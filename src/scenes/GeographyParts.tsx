import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, Object3D, PlaneGeometry, Shape, ShapeGeometry, TubeGeometry, Vector3, type Group, type InstancedMesh, type Mesh, type ShaderMaterial } from 'three';
import { Ball, Cube, Rod, type SceneProps } from './shared';
import { FocusTarget, easeMotion } from './MathCoreEffects';
import { PhysicalMaterial } from './materials';
import { Beam, type Point } from './EngineeringExperimentsParts';

export type GeoProps={value:number;option:number;motion:RefObject<number>;props:SceneProps};
export const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
export const spherePoint=(latitude:number,longitude:number,radius=1.45):Point=>{
  const lat=latitude*Math.PI/180,lon=longitude*Math.PI/180;
  return [radius*Math.cos(lat)*Math.sin(lon),radius*Math.sin(lat),radius*Math.cos(lat)*Math.cos(lon)];
};

export function Sandbox({width=5.5,depth=4.4}:{width?:number;depth?:number}) {
  return <group><Cube kind="wood" color="#8b8065" position={[0,.04,0]} scale={[width,.15,depth]}/>
    {[-1,1].map(side=><group key={side}><Cube kind="wood" color="#a09373" position={[side*width/2,.18,0]} scale={[.09,.25,depth]}/><Cube kind="wood" color="#a09373" position={[0,.18,side*depth/2]} scale={[width,.25,.09]}/></group>)}
  </group>;
}

/** A solid terrain, with sharp section walls sampled from the same height field. */
export function GeoTerrain({observation=false,height,width=5.3,depth=4.1,flat=false,frontCut}:{observation?:boolean;height:(x:number,z:number)=>number;width?:number;depth?:number;flat?:boolean;frontCut?:number}) {
  const geometry=useMemo(()=>{
    const back=-depth/2,front=frontCut??depth/2;
    const top=new PlaneGeometry(width,front-back,64,48);top.rotateX(-Math.PI/2);top.translate(0,0,(front+back)/2);
    const vertices:number[]=[],colors:number[]=[],indices=Array.from(top.index!.array),points=top.attributes.position;
    let peak=.2;for(let i=0;i<points.count;i++)peak=Math.max(peak,height(points.getX(i),points.getZ(i)));
    const low=new Color('#adc2a6'),mid=new Color('#739a8d'),high=new Color('#d0ceba'),color=new Color();
    for(let i=0;i<points.count;i++){
      const x=points.getX(i),z=points.getZ(i),h=flat?.12:height(x,z),t=clamp01((h-.12)/(peak-.12));
      vertices.push(x,h,z);color.copy(low).lerp(mid,Math.min(1,t*1.8)).lerp(high,Math.max(0,(t-.56)/.44));colors.push(color.r,color.g,color.b);
    }
    const rockColors=['#66797b','#ad9578','#99866a'].map(value=>new Color(value));
    const wall=(a:Point,b:Point,steps:number)=>{
      for(let i=0;i<steps;i++){
        const t=i/steps,n=(i+1)/steps,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,nx=a[0]+(b[0]-a[0])*n,nz=a[2]+(b[2]-a[2])*n;
        const h=flat?.12:height(x,z),nh=flat?.12:height(nx,nz),fractions=[0,.28,.64,1];
        for(let j=0;j<3;j++){
          const base=vertices.length/3,lo=.065+(h-.065)*fractions[j],hi=.065+(h-.065)*fractions[j+1],nlo=.065+(nh-.065)*fractions[j],nhi=.065+(nh-.065)*fractions[j+1];
          vertices.push(x,lo,z,nx,nlo,nz,nx,nhi,nz,x,hi,z);const c=rockColors[j];for(let k=0;k<4;k++)colors.push(c.r,c.g,c.b);indices.push(base,base+1,base+2,base,base+2,base+3);
        }
      }
    };
    wall([-width/2,0,front],[width/2,0,front],64);wall([width/2,0,front],[width/2,0,back],48);wall([width/2,0,back],[-width/2,0,back],64);wall([-width/2,0,back],[-width/2,0,front],48);
    top.dispose();const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(vertices,3));geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
  },[height,width,depth,flat,frontCut]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh name={observation ? "study:profile" : undefined} geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.94} side={DoubleSide}/></mesh>;
}

/** Direction marks travel only with the completed-observation timeline. */
export function GeoPath({points,color='#70bddd',width=.022,motion,flow=false,closed=false,reveal}:{points:Point[];color?:string;width?:number;motion?:RefObject<number>;flow?:boolean;closed?:boolean;reveal?:{index:number;count:number}}) {
  const geometry=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p)),closed,'centripetal'),Math.max(32,points.length*3),width,5,closed),[points,width,closed]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const material=useRef<ShaderMaterial>(null),uniforms=useMemo(()=>({uColor:{value:new Color(color)},uPhase:{value:0},uFlow:{value:Number(flow)},uReveal:{value:1}}),[color,flow]);
  useFrame(()=>{if(material.current){const p=motion?.current??0;material.current.uniforms.uPhase.value=p*3;material.current.uniforms.uReveal.value=reveal?clamp01(p*reveal.count-reveal.index):1;}});
  return <mesh geometry={geometry} raycast={()=>null}><shaderMaterial ref={material} uniforms={uniforms}
    vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
    fragmentShader={`uniform vec3 uColor;uniform float uPhase;uniform float uFlow;uniform float uReveal;varying vec2 vUv;
      void main(){float mark=pow(max(0.,cos(vUv.x*70.-uPhase*6.2831853)),7.);float shown=step(vUv.x,uReveal+.001);gl_FragColor=vec4(uColor*(.32+.46*shown+mark*.55*uFlow*shown),1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`}/>
  </mesh>;
}

export function GeoMovingMarker({points,motion,color='#f5d58b',size=.12}:{points:Point[];motion:RefObject<number>;color?:string;size?:number}) {
  const group=useRef<Group>(null),curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,'centripetal'),[points]),sample=useMemo(()=>new Vector3(),[]);
  useFrame(()=>{if(group.current){curve.getPoint(easeMotion(motion.current),sample);group.current.position.copy(sample);}});
  return <group ref={group}><Ball color={color} scale={size}/><mesh raycast={()=>null}><sphereGeometry args={[size*1.35,14,10]}/><meshBasicMaterial color={color} transparent opacity={.14} depthWrite={false} blending={AdditiveBlending}/></mesh></group>;
}

/** At most a few dozen points share one draw call and one reusable transform. */
export function GeoParticles({motion,count=16,color='#b2dce9',size=.04,point,stretch=1,stretchVector}:{motion:RefObject<number>;count?:number;color?:string;size?:number;stretch?:number;stretchVector?:Point;point:(index:number,phase:number,out:Vector3)=>void}) {
  const mesh=useRef<InstancedMesh>(null),dummy=useMemo(()=>new Object3D(),[]),previous=useRef(-1),previousPoint=useRef(point);
  useFrame(()=>{if(!mesh.current)return;const p=motion.current;if(previous.current===p&&previousPoint.current===point)return;previous.current=p;previousPoint.current=point;mesh.current.visible=p>0;for(let i=0;i<count;i++){point(i,p,dummy.position);if(stretchVector)dummy.scale.set(...stretchVector);else dummy.scale.set(1,stretch,1);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);}mesh.current.instanceMatrix.needsUpdate=true;});
  return <instancedMesh ref={mesh} args={[undefined,undefined,count]} visible={false} raycast={()=>null} frustumCulled={false}>
    <sphereGeometry args={[size,8,6]}/><meshBasicMaterial color={color} transparent opacity={.8} depthWrite={false}/>
  </instancedMesh>;
}

export function GeoArrow({from,to,color='#f2d396'}:{from:Point;to:Point;color?:string}) {
  const {tipRotation}=useMemo(()=>{
    const vector=new Vector3(...to).sub(new Vector3(...from)).normalize();
    const object=new Object3D();object.quaternion.setFromUnitVectors(new Vector3(0,1,0),vector);
    return {tipRotation:object.quaternion};
  },[...from,...to]);
  return <group><Beam from={from} to={to} color={color} width={.019}/><mesh position={to} quaternion={tipRotation}><coneGeometry args={[.09,.19,12]}/><meshBasicMaterial color={color}/></mesh></group>;
}

export function GeoPin({position,color='#eec482',props,radius=.25}:{position:Point;color?:string;props:SceneProps;radius?:number}) {
  return <FocusTarget position={position} radius={radius} color={color} paused={props.paused} enabled={!props.demo}>
    <Rod kind="metal" color="#607b86" position={[0,.15,0]} scale={[.018,.3,.018]}/><Ball color={color} position={[0,.32,0]} scale={.095}/>
  </FocusTarget>;
}

export function Compass({size=2.3,y=.2}:{size?:number;y?:number}) {
  return <group><GeoArrow from={[0,y,0]} to={[0,y,-size]} color="#df8a72"/>
    <GeoArrow from={[0,y,0]} to={[size,y,0]} color="#83c1d1"/>
    <Beam from={[0,y,size]} to={[0,y,-size]} color="#82989d" width={.011}/><Beam from={[-size,y,0]} to={[size,y,0]} color="#82989d" width={.011}/>
  </group>;
}

export function LavaSurface({motion,radius=.85}:{motion:RefObject<number>;radius?:number}) {
  const material=useRef<ShaderMaterial>(null),uniforms=useMemo(()=>({uPhase:{value:0}}),[]);
  useFrame(()=>{if(material.current)material.current.uniforms.uPhase.value=motion.current*4;});
  return <mesh rotation={[-Math.PI/2,0,0]} raycast={()=>null}><circleGeometry args={[radius,40]}/><shaderMaterial ref={material} uniforms={uniforms}
    vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
    fragmentShader={`uniform float uPhase;varying vec2 vUv;void main(){float veins=sin(vUv.x*29.+sin(vUv.y*22.+uPhase)*3.);vec3 c=mix(vec3(.5,.09,.025),vec3(1.,.57,.12),smoothstep(-.4,.7,veins));gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`}/></mesh>;
}

export function GeoVolcanoSection({angle}:{angle:number}) {
  const geometry=useMemo(()=>{const shape=new Shape();shape.moveTo(0,.18);shape.lineTo(1.64,.18);shape.lineTo(.28,1.86);shape.lineTo(0,1.86);shape.closePath();return new ShapeGeometry(shape)},[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group rotation={[0,angle-Math.PI/2,0]}><mesh geometry={geometry}><meshStandardMaterial color="#ad9d80" roughness={.94} side={DoubleSide}/></mesh>
    {[.43,.84,1.25,1.65].map(y=>{const radius=1.64-(y-.18)/1.68*1.36;return <Beam key={y} from={[0,y,.004]} to={[radius,y,.004]} color="#7d8274" width={.011}/>})}
  </group>;
}

export function LayerCap({radius,inner=0,angle,color,order}:{radius:number;inner?:number;angle:number;color:string;order:number}) {
  return <mesh rotation={[0,angle+Math.PI,0]}><ringGeometry args={[inner,radius,64,1,-Math.PI/2,Math.PI]}/>
    <meshStandardMaterial color={color} side={DoubleSide} roughness={.8} polygonOffset polygonOffsetFactor={-order} polygonOffsetUnits={-order}/>
  </mesh>;
}

/** A horizontal plane visibly meets the same contour as the 3D height field. */
export function GeoContourSweep({motion,levels,width=5.3,depth=4.1}:{motion:RefObject<number>;levels:number;width?:number;depth?:number}) {
  const group=useRef<Group>(null);
  useFrame(()=>{if(group.current){const p=motion.current,index=Math.min(levels-1,Math.floor(p*levels));group.current.position.y=.12+(index+1)*.175;group.current.visible=p>0&&p<1}});
  return <group ref={group} visible={false}>
    <mesh rotation={[-Math.PI/2,0,0]} raycast={()=>null}><planeGeometry args={[width,depth]}/><meshBasicMaterial color="#a9dce1" transparent opacity={.13} depthWrite={false} side={DoubleSide}/></mesh>
    {[-depth/2,depth/2].map(z=><Beam key={z} from={[-width/2,0,z]} to={[width/2,0,z]} color="#91c8d0" width={.009}/>)}
    {[-width/2,width/2].map(x=><Beam key={x} from={[x,0,-depth/2]} to={[x,0,depth/2]} color="#91c8d0" width={.009}/>)}
  </group>;
}

/** Shortening the plates thickens this folded strip; no mountain appears at zero. */
export function GeoFold({motion,strength}:{motion:RefObject<number>;strength:number}) {
  const geometry=useMemo(()=>{const geo=new PlaneGeometry(1.45,2.5,36,12);geo.rotateX(-Math.PI/2);return geo},[]),mesh=useRef<Mesh>(null),previous=useRef(-1),previousStrength=useRef(-1);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{const p=easeMotion(motion.current);if(previous.current===p&&previousStrength.current===strength)return;previous.current=p;previousStrength.current=strength;const points=geometry.attributes.position;for(let i=0;i<points.count;i++){const x=points.getX(i),z=points.getZ(i),crest=Math.pow(Math.max(0,Math.cos(x/1.45*Math.PI)),2);points.setY(i,.78+crest*strength*p*(.85+.15*Math.cos(z*2.3)))}points.needsUpdate=true;geometry.computeVertexNormals();if(mesh.current)mesh.current.visible=strength*p>.001;});
  return <mesh ref={mesh} geometry={geometry} visible={false} castShadow receiveShadow><meshStandardMaterial color="#9eae95" roughness={.92} side={DoubleSide}/></mesh>;
}

export function GroundSlab({position,color='#a59b7c',scale=[2.35,.42,2.5]}:{position:Point;color?:string;scale?:Point}) {
  return <group position={position}><Cube kind="ground" color={color} position={[0,scale[1]*.275,0]} scale={[scale[0],scale[1]*.45,scale[2]]}/><Cube kind="stone" color="#a77f62" position={[0,-scale[1]*.09,0]} scale={[scale[0],scale[1]*.28,scale[2]]}/><Cube kind="stone" color="#cfb283" position={[0,-scale[1]*.365,0]} scale={[scale[0],scale[1]*.27,scale[2]]}/></group>;
}

export function Mountain({radius=1,height=1.4,color='#909d7f'}:{radius?:number;height?:number;color?:string}) {
  return <mesh position={[0,height/2,0]} castShadow receiveShadow><coneGeometry args={[radius,height,20]}/><PhysicalMaterial kind="ground" color={color}/></mesh>;
}
