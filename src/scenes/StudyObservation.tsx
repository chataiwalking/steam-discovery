import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, Line, LineBasicMaterial,
  LineSegments, MathUtils, Matrix4, Mesh, Object3D, Vector3,
} from 'three';
import type { SceneProps } from './shared';

type Mode = 'path' | 'profile' | 'level' | 'units' | 'register';
type Stroke = {
  mesh: Mesh; instance: number; contour: LineSegments; trace?: Line;
  mode: Mode; point: Vector3; history: number[]; last: Vector3; matrix: Matrix4;
};

const ink: Record<Mode, string> = {
  path: '#ffca6d', profile: '#b7f3ee', level: '#8ddcff', units: '#ffe097', register: '#eab3a2',
};
const names = new Set(Object.keys(ink));
const noRaycast = () => {};

// Cut the real surface at a plane. On curved objects this gives continuous section lines
// without exposing triangulation. Disjoint meshes and concave silhouettes stay disjoint.
function cutSurface(geometry: BufferGeometry, axis: 'x'|'y'|'z', fraction: number, out: number[]) {
  const pos = geometry.getAttribute('position'), index = geometry.index;
  if (!pos || !geometry.boundingBox) return;
  const box = geometry.boundingBox;
  const plane = MathUtils.lerp(box.min[axis], box.max[axis], fraction);
  const vertices = [new Vector3(), new Vector3(), new Vector3()];
  const first = new Vector3(), second = new Vector3();
  const count = index?.count ?? pos.count;
  for (let i = 0; i + 2 < count; i += 3) {
    let hits = 0;
    for (let j = 0; j < 3; j++) vertices[j].fromBufferAttribute(pos, index ? index.getX(i+j) : i+j);
    for (let j = 0; j < 3; j++) {
      const a = vertices[j], b = vertices[(j+1)%3];
      if ((a[axis] < plane) === (b[axis] < plane)) continue;
      (hits++ === 0 ? first : second).lerpVectors(a, b, (plane-a[axis])/(b[axis]-a[axis]));
    }
    if (hits === 2 && first.distanceToSquared(second) > 1e-12) {
      out.push(first.x,first.y,first.z,second.x,second.y,second.z);
    }
  }
}

function makeContour(mesh: Mesh, mode: Mode) {
  const source = mesh.geometry;
  if (!source.boundingBox) source.computeBoundingBox();
  const bounds = source.boundingBox!;
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const positions: number[] = [];
  if (mode === 'level') {
    // Mark three levels on the moving fill, stem or wall.
    for (const f of [.18,.5,.82]) cutSurface(source,'y',f,positions);
  } else if (mode === 'register') {
    // Two intersecting registration lines make the registration of plate and paper visible.
    cutSurface(source,'x',.503,positions); cutSurface(source,'z',.503,positions);
  } else if (mode === 'profile') {
    cutSurface(source,'z',.503,positions); cutSurface(source,'y',.56,positions);
  } else {
    cutSurface(source, size.y < size.z*.15 ? 'z' : 'y', .54, positions);
  }

  // Lift each point a fraction off its source so the surface depth test stays stable.
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = center.x + (positions[i]-center.x)*1.012;
    positions[i+1] = center.y + (positions[i+1]-center.y)*1.012;
    positions[i+2] = center.z + (positions[i+2]-center.z)*1.012;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions,3));
  geometry.computeBoundingSphere();
  return { geometry, center };
}

function visible(object:Object3D) {
  for (let o:Object3D|null=object; o; o=o.parent) if (!o.visible) return false;
  return true;
}

function buildStrokes(root:Group, overlays:Group) {
  const strokes:Stroke[] = [];
  const geometries=new Map<string, ReturnType<typeof makeContour>>();
  const materials=new Map<Mode, LineBasicMaterial>();
  function add(mesh:Mesh, mode:Mode, instance=-1) {
    if (strokes.length >= 64 || !mesh.geometry.getAttribute('position')) return;
    const key=mesh.geometry.uuid+mode;
    let info=geometries.get(key);
    if (!info) { info=makeContour(mesh,mode); geometries.set(key,info); }
    let material=materials.get(mode);
    if(!material) { material=new LineBasicMaterial({color:new Color(ink[mode]), transparent:true, opacity:.86, depthWrite:false,toneMapped:false}); materials.set(mode,material); }
    const contour=new LineSegments(info.geometry, material);
    contour.matrixAutoUpdate=false; contour.raycast=noRaycast; contour.renderOrder=2;
    overlays.add(contour);
    let trace:Line|undefined;
    if(mode==='path') {
      const geometry=new BufferGeometry();
      geometry.setAttribute('position',new Float32BufferAttribute(new Float32Array(32*3),3));
      geometry.setDrawRange(0,0);
      trace=new Line(geometry,material);
      trace.frustumCulled=false; trace.raycast=noRaycast;
      overlays.add(trace);
    }
    const point=info.center.clone();
    // An off-centre reference point also records angular movement.
    if (mode==='path') point.x=MathUtils.lerp(point.x,mesh.geometry.boundingBox!.max.x,.68);
    strokes.push({mesh,instance,mode,contour,trace,point,history:[],last:new Vector3(Infinity,Infinity,Infinity),matrix:new Matrix4()});
  }
  root.traverse(target=>{
    if(!target.name.startsWith('study:')) return;
    const mode=target.name.slice(6) as Mode;
    if(!names.has(mode)) return;
    const visit = (object:Object3D) => {
      // Skip invisible helper meshes, e.g. the hover ring used by FocusTarget.
      const candidates: Mesh[]=[];
      object.traverse(child=>{
        if (!(child instanceof Mesh) || !child.geometry?.attributes.position) return;
        const materials=Array.isArray(child.material)?child.material:[child.material];
        if(materials.every(m=>m.transparent && m.opacity<.24))return;
        candidates.push(child);
      });
      // For a multipart landmark outline the specimen before its secondary ornaments.
      const chosen=candidates[0];
      if (!chosen) return;
      if(chosen instanceof InstancedMesh) {
        for(let i=0;i<chosen.count;i++) add(chosen,mode,i);
      } else add(chosen,mode);
    };
    if(mode==='units' && target instanceof Group) target.children.forEach(visit);
    else visit(target);
  });
  function dispose() {
    strokes.forEach(({contour,trace})=>{overlays.remove(contour); if(trace) {overlays.remove(trace); trace.geometry.dispose();}});
    geometries.forEach(({geometry})=>geometry.dispose()); materials.forEach(material=>material.dispose());
  }
  return {strokes,dispose};
}

export default function StudyObservation({props,children}:{props:SceneProps;children:ReactNode}) {
  const root=useRef<Group>(null), overlays=useRef<Group>(null), strokes=useRef<Stroke[]>([]);
  const sample=useRef(new Vector3());
  const w=props.state;
  useLayoutEffect(()=>{
    if(!root.current || !overlays.current) return;
    const built=buildStrokes(root.current,overlays.current);
    strokes.current=built.strokes;
    overlays.current.userData.samples=built.strokes.length;
    return ()=>{strokes.current=[]; built.dispose();};
  },[props.lesson,props.demo,w.experimentValue,w.experimentOption,w.experimentRun,w.shapeKind,w.shapes,w.sorted,w.gearTeeth,w.deck,w.pier,w.braces,w.waterStage]);
  useFrame(()=>{
    for(const s of strokes.current) {
      const shown=visible(s.mesh);
      s.contour.visible=shown;
      if(s.trace) s.trace.visible=shown;
      if(!shown) continue;
      s.mesh.updateWorldMatrix(true,false);
      if(s.instance>=0 && s.mesh instanceof InstancedMesh) {
        s.mesh.getMatrixAt(s.instance,s.matrix);
        s.matrix.premultiply(s.mesh.matrixWorld);
      } else s.matrix.copy(s.mesh.matrixWorld);
      s.contour.matrix.copy(s.matrix);
      s.contour.matrixWorldNeedsUpdate=true;
      if(!s.trace || props.paused)continue;
      const now=sample.current.copy(s.point).applyMatrix4(s.matrix);
      if(now.distanceToSquared(s.last)<.0016)continue;
      if(now.distanceToSquared(s.last)>1) s.history.length=0;
      s.last.copy(now);
      s.history.push(now.x,now.y,now.z);
      if(s.history.length>32*3)s.history.splice(0,3);
      const geometry=s.trace.geometry;
      const pos=geometry.getAttribute('position');
      (pos.array as Float32Array).set(s.history);
      pos.needsUpdate=true;
      geometry.setDrawRange(0,s.history.length/3);
    }
  });
  return <><group ref={root}>{children}</group><group ref={overlays} name="study-observation" dispose={null}/></>;
}
