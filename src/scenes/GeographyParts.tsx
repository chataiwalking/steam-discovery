import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, Object3D, PlaneGeometry, TubeGeometry, Vector3, type Group, type InstancedMesh, type ShaderMaterial } from 'three';
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

/** A small CPU-built terrain; only parameter changes rebuild its buffer. */
export function GeoTerrain({height,width=5.3,depth=4.1,flat=false}:{height:(x:number,z:number)=>number;width?:number;depth?:number;flat?:boolean}) {
  const geometry=useMemo(()=>{
    const geo=new PlaneGeometry(width,depth,56,44);geo.rotateX(-Math.PI/2);
    const points=geo.attributes.position,colors=[];
    for(let i=0;i<points.count;i++){
      const h=height(points.getX(i),points.getZ(i));points.setY(i,flat?.12:h);
      const color=new Color(h>.95?'#a9aaa0':h>.45?'#8d9d7b':'#b8c49b');color.multiplyScalar(.94+Math.sin(points.getX(i)*14+points.getZ(i)*11)*.04);
      colors.push(color.r,color.g,color.b);
    }
    geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
  },[height,width,depth,flat]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.94} side={DoubleSide}/></mesh>;
}

/** Direction marks travel only with the completed-observation timeline. */
export function GeoPath({points,color='#70bddd',width=.022,motion,flow=false,closed=false}:{points:Point[];color?:string;width?:number;motion?:RefObject<number>;flow?:boolean;closed?:boolean}) {
  const geometry=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p)),closed,'centripetal'),Math.max(32,points.length*3),width,5,closed),[points,width,closed]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const material=useRef<ShaderMaterial>(null),uniforms=useMemo(()=>({uColor:{value:new Color(color)},uPhase:{value:0},uFlow:{value:Number(flow)}}),[color,flow]);
  useFrame(()=>{if(material.current)material.current.uniforms.uPhase.value=(motion?.current??0)*3;});
  return <mesh geometry={geometry} raycast={()=>null}><shaderMaterial ref={material} uniforms={uniforms}
    vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
    fragmentShader={`uniform vec3 uColor;uniform float uPhase;uniform float uFlow;varying vec2 vUv;
      void main(){float mark=pow(max(0.,cos(vUv.x*70.-uPhase*6.2831853)),7.);gl_FragColor=vec4(uColor*(.78+mark*.55*uFlow),1.);}`}/>
  </mesh>;
}

export function GeoMovingMarker({points,motion,color='#f5d58b',size=.12}:{points:Point[];motion:RefObject<number>;color?:string;size?:number}) {
  const group=useRef<Group>(null),curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,'centripetal'),[points]),sample=useMemo(()=>new Vector3(),[]);
  useFrame(()=>{if(group.current){curve.getPoint(easeMotion(motion.current),sample);group.current.position.copy(sample);}});
  return <group ref={group}><Ball color={color} scale={size}/><mesh raycast={()=>null}><sphereGeometry args={[size*1.35,14,10]}/><meshBasicMaterial color={color} transparent opacity={.14} depthWrite={false} blending={AdditiveBlending}/></mesh></group>;
}

/** At most a few dozen points share one draw call and one reusable transform. */
export function GeoParticles({motion,count=16,color='#b2dce9',size=.04,point,stretch=1}:{motion:RefObject<number>;count?:number;color?:string;size?:number;stretch?:number;point:(index:number,phase:number,out:Vector3)=>void}) {
  const mesh=useRef<InstancedMesh>(null),dummy=useMemo(()=>new Object3D(),[]);
  useFrame(()=>{if(!mesh.current)return;mesh.current.visible=motion.current>0;for(let i=0;i<count;i++){point(i,motion.current,dummy.position);dummy.scale.set(1,stretch,1);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);}mesh.current.instanceMatrix.needsUpdate=true;});
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
    fragmentShader={`uniform float uPhase;varying vec2 vUv;void main(){float veins=sin(vUv.x*29.+sin(vUv.y*22.+uPhase)*3.);vec3 c=mix(vec3(.5,.09,.025),vec3(1.,.57,.12),smoothstep(-.4,.7,veins));gl_FragColor=vec4(c,1.);}`}/></mesh>;
}

export function LayerCap({radius,angle,color,order}:{radius:number;angle:number;color:string;order:number}) {
  return <mesh rotation={[0,angle+Math.PI,0]}><circleGeometry args={[radius,64,-Math.PI/2,Math.PI]}/>
    <meshStandardMaterial color={color} side={DoubleSide} roughness={.8} polygonOffset polygonOffsetFactor={-order} polygonOffsetUnits={-order}/>
  </mesh>;
}

export function GroundSlab({position,color='#a59b7c',scale=[2.35,.42,2.5]}:{position:Point;color?:string;scale?:Point}) {
  return <group position={position}><Cube kind="ground" color={color} position={[0,scale[1]*.275,0]} scale={[scale[0],scale[1]*.45,scale[2]]}/><Cube kind="stone" color="#a77f62" position={[0,-scale[1]*.09,0]} scale={[scale[0],scale[1]*.28,scale[2]]}/><Cube kind="stone" color="#cfb283" position={[0,-scale[1]*.365,0]} scale={[scale[0],scale[1]*.27,scale[2]]}/></group>;
}

export function Mountain({radius=1,height=1.4,color='#909d7f'}:{radius?:number;height?:number;color?:string}) {
  return <mesh position={[0,height/2,0]} castShadow receiveShadow><coneGeometry args={[radius,height,20]}/><PhysicalMaterial kind="ground" color={color}/></mesh>;
}
