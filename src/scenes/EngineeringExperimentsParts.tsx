import {useMemo,useRef,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {Quaternion,Vector3,type Mesh} from 'three';
import {PhysicalMaterial,type MaterialKind} from './materials';
import {Cube,Rod} from './shared';
export type Point=[number,number,number];
export type Motion=RefObject<number>;
export function Beam({from,to,width=.045,color='#5b6d75',kind='metal'}:{from:Point;to:Point;width?:number;color?:string;kind?:MaterialKind}) {
 const {position,rotation,length}=useMemo(()=>{const a=new Vector3(...from),b=new Vector3(...to);return {position:a.clone().add(b).multiplyScalar(.5),rotation:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()),length:a.distanceTo(b)}},[...from,...to]);
 return <mesh position={position} quaternion={rotation} castShadow><cylinderGeometry args={[width,width,length,10]}/><PhysicalMaterial kind={kind} color={color}/></mesh>;
}
export function MovingBeam({from,to,width=.028,color='#b39d77',kind='wood'}:{from:()=>Point;to:()=>Point;width?:number;color?:string;kind?:MaterialKind}) {
 const ref=useRef<Mesh>(null);const vectors=useMemo(()=>({a:new Vector3(),b:new Vector3(),up:new Vector3(0,1,0)}),[]);
 useFrame(()=>{if(!ref.current)return;const {a,b,up}=vectors;a.set(...from());b.set(...to());ref.current.position.copy(a).add(b).multiplyScalar(.5);ref.current.scale.set(width,a.distanceTo(b),width);ref.current.quaternion.setFromUnitVectors(up,b.sub(a).normalize())});
 return <mesh ref={ref} castShadow><cylinderGeometry args={[1,1,1,8]}/><PhysicalMaterial kind={kind} color={color}/></mesh>;
}
export function Weights({count=1}:{count?:number}) {return <group>{Array.from({length:count},(_,i)=><group key={i} position={[0,i*.22,0]}><Rod kind="metal" color="#66747c" scale={[.25,.2,.25]}/><Rod kind="metal" color="#b3bec2" position={[0,.1,0]} scale={[.075,.035,.075]}/></group>)}</group>}
export function Frame({width=4,height=3}:{width?:number;height?:number}) {return <group>{[-width/2,width/2].map(x=><group key={x}><Cube kind="metal" color="#425862" position={[x,height/2,0]} scale={[.12,height,.13]}/><Cube kind="metal" color="#748990" position={[x,.09,0]} scale={[.55,.16,1.1]}/></group>)}<Cube kind="metal" color="#657982" position={[0,height,0]} scale={[width+.15,.13,.13]}/></group>}
export function PulleyWheel({radius=.3}:{radius?:number}) {return <group><mesh rotation={[0,0,0]}><torusGeometry args={[radius,.045,8,40]}/><PhysicalMaterial kind="metal" color="#adb7bc"/></mesh><Rod kind="metal" color="#5d737c" rotation={[Math.PI/2,0,0]} scale={[radius*.67,.1,radius*.67]}/>{[0,Math.PI/3,Math.PI*2/3].map(angle=><group key={angle} rotation={[0,0,angle]}><Cube kind="metal" color="#b5c3c7" position={[0,0,.057]} scale={[radius*1.65,.025,.018]}/></group>)}<Rod kind="metal" color="#b8a783" rotation={[Math.PI/2,0,0]} scale={[.055,.18,.055]}/></group>}
