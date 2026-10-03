import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import {CatmullRomCurve3,Color,DoubleSide,MeshStandardMaterial,Quaternion,ShaderMaterial,TubeGeometry,Vector3,type Mesh} from 'three';
import {SceneLabel} from './shared';
import type {Motion,Point} from './EngineeringExperimentsParts';

// Pointer events only change inspection state; animation never schedules React updates.
export function InspectPart({children,detail,labelPosition=[0,.6,.6]}:{children:ReactNode;detail:string;labelPosition?:Point}) {
 const [hovered,setHovered]=useState(false),[pinned,setPinned]=useState(false);
 return <group onPointerOver={event=>{event.stopPropagation();setHovered(true)}} onPointerOut={()=>setHovered(false)} onClick={event=>{event.stopPropagation();setPinned(value=>!value)}}>
  {children}
  {(hovered||pinned)&&<SceneLabel position={labelPosition} color={pinned?'#ffd58f':'#b6e6ee'}>{detail}{pinned?' · 再点收起':' · 点击固定'}</SceneLabel>}
 </group>;
}

const flowVertex=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const flowFragment=`uniform vec3 uColor;uniform float uProgress;uniform float uTime;uniform float uActive;varying vec2 vUv;
void main(){
 float revealed=step(vUv.x,uProgress+.002);
 float pulse=pow(.5+.5*cos((vUv.x-uTime*1.8)*35.0),5.0);
 vec3 color=uColor*(.62+.38*revealed+.32*pulse*uActive*revealed);
 gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

// One narrow tube makes the direction / causal path legible without a particle cloud.
export function FlowPath({points,motion,color='#d4ad67',radius=.016,active=true,reveal=false}:{points:Point[];motion:Motion;color?:string;radius?:number;active?:boolean;reveal?:boolean}) {
 const geometry=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(points.map(point=>new Vector3(...point)),false,'centripetal'),Math.max(12,points.length*6),radius,5,false),[points,radius]);
 const material=useMemo(()=>new ShaderMaterial({vertexShader:flowVertex,fragmentShader:flowFragment,uniforms:{uColor:{value:new Color(color)},uProgress:{value:1},uTime:{value:0},uActive:{value:0}}}),[color]);
 useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material]);
 useFrame(()=>{material.uniforms.uProgress.value=reveal?motion.current:1;material.uniforms.uTime.value=motion.current;material.uniforms.uActive.value=active&&motion.current>0&&motion.current<1?1:0});
 return <mesh geometry={geometry} material={material}/>;
}

export function ForceArrow({from,to,color='#d4ab66',width=.025}:{from:Point;to:Point;color?:string;width?:number}) {
 const transform=useMemo(()=>{const a=new Vector3(...from),b=new Vector3(...to),length=a.distanceTo(b);return {middle:a.clone().add(b).multiplyScalar(.5),tip:b,rotation:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()),length}},[...from,...to]);
 return <group><mesh position={transform.middle} quaternion={transform.rotation}><cylinderGeometry args={[width,width,Math.max(.001,transform.length-.09),6]}/><meshStandardMaterial color={color} roughness={.6}/></mesh><mesh position={transform.tip} quaternion={transform.rotation}><coneGeometry args={[width*3,.15,8]}/><meshStandardMaterial color={color} roughness={.6}/></mesh></group>;
}

// Lighting is kept from MeshStandardMaterial. The scalar color is an explanatory
// diagram, never a numerical stress result or a physically accurate fluid solver.
export function StudyMaterial({color,motion,mode='stress',strength=1}:{color:string;motion:Motion;mode?:'stress'|'clay'|'water'|'tile';strength?:number}) {
 const uniforms=useMemo(()=>({uEaProgress:{value:0},uEaStrength:{value:strength}}),[]);
 const material=useMemo(()=>{
  const result=new MeshStandardMaterial({color,roughness:mode==='water'||mode==='tile'?.25:.65,side:DoubleSide});
  result.customProgramCacheKey=()=>`ea-study-${mode}`;
  result.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vEaLocal;varying vec2 vEaUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEaLocal = position;vEaUv = uv;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEaLocal;varying vec2 vEaUv;uniform float uEaProgress;uniform float uEaStrength;');
   const study=mode==='stress'
    ? 'float band = pow(max(0.0,1.0-abs(vEaLocal.y)*1.1),1.8); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.63,.25,.08),clamp(uEaStrength,0.0,1.0)*band*.42);'
    : mode==='clay'
    ? 'float ridge=sin(vEaLocal.y*110.0+atan(vEaLocal.z,vEaLocal.x)*2.0); diffuseColor.rgb*=.94+.06*ridge;'
    : mode==='tile'
    ? 'float edge=min(min(vEaUv.x,1.0-vEaUv.x),min(vEaUv.y,1.0-vEaUv.y));float grout=1.0-smoothstep(.005,.045,edge);diffuseColor.rgb*=.97+.03*sin(vEaUv.x*43.0+vEaUv.y*31.0);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.12,.11),grout*.5);'
    : 'float ripple=sin(vEaLocal.x*18.0-uEaProgress*25.0)*sin(vEaLocal.z*9.0+uEaProgress*8.0); diffuseColor.rgb*=.93+.07*ripple*uEaStrength;';
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n${study}`);
  };
  return result;
 },[color,mode,uniforms]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(()=>{uniforms.uEaProgress.value=motion.current;uniforms.uEaStrength.value=strength});
 return <primitive object={material} attach="material"/>;
}

const diskFragment=`uniform vec3 uA;uniform vec3 uB;uniform vec3 uC;uniform float uPaletteSize;uniform float uAngle;uniform float uBlur;varying vec2 vUv;
void main(){vec2 centered=vUv-.5;float a=atan(centered.y,centered.x)-uAngle;
 float sector=mod(floor((a+3.14159265)/6.2831853*12.0+12.0),uPaletteSize);
 vec3 color=mix(uA,uB,step(.5,sector));color=mix(color,uC,step(1.5,sector));
 vec3 mean=uPaletteSize<2.5?(uA+uB)*.5:(uA+uB+uC)/3.0;
 color=mix(color,mean,uBlur);gl_FragColor=vec4(color,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function ColorMixDisk({palette,value,motion}:{palette:string[];value:number;motion:Motion}) {
 const material=useMemo(()=>new ShaderMaterial({vertexShader:flowVertex,fragmentShader:diskFragment,side:DoubleSide,uniforms:{uA:{value:new Color(palette[0])},uB:{value:new Color(palette[1])},uC:{value:new Color(palette[2]??palette[0])},uPaletteSize:{value:palette.length},uAngle:{value:0},uBlur:{value:0}}}),[palette]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(()=>{material.uniforms.uAngle.value=motion.current*value*Math.PI*2;material.uniforms.uBlur.value=motion.current>0&&motion.current<1?Math.max(0,(value-2)/6)*.88:0});
 return <mesh material={material}><circleGeometry args={[1.15,64]}/></mesh>;
}

export function BeatPulse({motion,index,count,strong=false}:{motion:Motion;index:number;count:number;strong?:boolean}) {
 const ref=useRef<Mesh>(null),material=useMemo(()=>new MeshStandardMaterial({color:strong?'#d8ab53':'#72a3b4',transparent:true,opacity:0,depthWrite:false,emissive:strong?'#7c4a12':'#194453',emissiveIntensity:.3}),[strong]);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(()=>{const phase=motion.current*count-index,hit=Math.max(0,1-Math.abs(phase-.5)*4);if(ref.current)ref.current.scale.setScalar(1+(1-hit)*.24);material.opacity=hit*(strong?.88:.6)});
 return <mesh ref={ref} rotation={[-Math.PI/2,0,0]} material={material}><ringGeometry args={[.42,.46,32]}/></mesh>;
}
