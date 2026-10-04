import {useEffect,useMemo,useRef,useState,type ReactNode,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {CanvasTexture,CatmullRomCurve3,Color,DoubleSide,LatheGeometry,MeshStandardMaterial,Quaternion,ShaderMaterial,SRGBColorSpace,TubeGeometry,Vector2,Vector3,type Group} from 'three';
import {Ball,Cube,Rod,SceneLabel} from './shared';
import {PhysicalMaterial} from './materials';
export type HistoryMotion=RefObject<number>;
export type HistoryPoint=[number,number,number];
export const portion=(progress:number,index:number,total:number)=>Math.min(1,Math.max(0,progress*total-index));
export const soften=(progress:number)=>progress*progress*(3-2*progress);

export function HistoryInspect({children,detail,position=[0,.65,.55]}:{children:ReactNode;detail:string;position?:HistoryPoint}) {
 const [hover,setHover]=useState(false),[pinned,setPinned]=useState(false);
 return <group onPointerOver={event=>{event.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)} onClick={event=>{event.stopPropagation();setPinned(value=>!value)}}>
  {children}{(hover||pinned)&&<SceneLabel position={position} color="#f1d0a9">{detail}{pinned?' · 再点收起':' · 点击固定'}</SceneLabel>}
 </group>;
}

export function HistoryLink({from,to,width=.018,color='#a48c69'}:{from:HistoryPoint;to:HistoryPoint;width?:number;color?:string}) {
 const transform=useMemo(()=>{const a=new Vector3(...from),b=new Vector3(...to);return {mid:a.clone().add(b).multiplyScalar(.5),rotation:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.clone().sub(a).normalize()),length:a.distanceTo(b)}},[...from,...to]);
 return <mesh position={transform.mid} quaternion={transform.rotation}><cylinderGeometry args={[width,width,transform.length,6]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>;
}

const pathVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const pathFragment=`uniform vec3 color;uniform float progress;varying vec2 vUv;
void main(){float passed=step(vUv.x,progress+.002);float pulse=pow(.5+.5*cos((vUv.x-progress)*31.0),6.0);
 gl_FragColor=vec4(color*(.48+.52*passed+.18*pulse*passed),1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function HistoryPath({points,motion,color='#c6a66d',radius=.012}:{points:HistoryPoint[];motion:HistoryMotion;color?:string;radius?:number}) {
 const geometry=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(points.map(point=>new Vector3(...point)),false,'centripetal'),Math.max(12,points.length*6),radius,5,false),[points,radius]);
 const material=useMemo(()=>new ShaderMaterial({vertexShader:pathVertex,fragmentShader:pathFragment,uniforms:{color:{value:new Color(color)},progress:{value:0}}}),[color]);
 useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material]);useFrame(()=>{material.uniforms.progress.value=motion.current});
 return <mesh geometry={geometry} material={material}/>;
}

export function HistorySurface({color,mode='clay',pattern=0}:{color:string;mode?:'clay'|'papyrus'|'soil';pattern?:number}) {
 const material=useMemo(()=>{
  const result=new MeshStandardMaterial({color,roughness:.84,side:DoubleSide});result.customProgramCacheKey=()=>`history-${mode}-${pattern}`;
  result.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHistoryPosition;varying vec2 vHistoryUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvHistoryPosition=position;vHistoryUv=uv;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHistoryPosition;varying vec2 vHistoryUv;');
   const texture=mode==='papyrus'
    ? 'float fibres=sin(vHistoryUv.x*135.0)*.035+sin(vHistoryUv.y*110.0)*.02;diffuseColor.rgb*=.94+fibres;'
    : mode==='soil'
    ? 'float grain=fract(sin(dot(floor(vHistoryPosition.xy*120.0),vec2(12.9898,78.233)))*43758.5453);diffuseColor.rgb*=.91+grain*.13;'
    : pattern===1
    ? 'float cord=sin((vHistoryUv.x*1.6+vHistoryUv.y)*160.0);diffuseColor.rgb*=.91+.09*cord;'
    : 'float clay=sin(vHistoryPosition.y*58.0)*sin(vHistoryPosition.x*40.0+vHistoryPosition.z*43.0);diffuseColor.rgb*=.96+clay*.04;';
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n${texture}`);
  };return result;
 },[color,mode,pattern]);useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
}

const paperFragment=`uniform float clustered;uniform float density;uniform vec3 baseColor;varying vec2 vUv;
float random(float x){return fract(sin(x*12.9898)*43758.5453);}
void main(){vec2 p=vUv;float fibres=0.0;
 for(int i=0;i<24;i++){float f=float(i);vec2 c=mix(vec2(random(f+1.0),random(f+73.0)),vec2(.3+random(f+8.0)*.4,.3+random(f+81.0)*.4),clustered);
  float a=random(f+21.0)*6.2831853;vec2 d=p-c;vec2 r=mat2(cos(a),-sin(a),sin(a),cos(a))*d;
  fibres=max(fibres,(1.0-smoothstep(.006,.013,abs(r.y)))*(1.0-smoothstep(.05,.115,abs(r.x))));}
 float body=mix(1.0,.36+.64*(1.0-smoothstep(.1,.24,length(p-.5))),clustered);
 vec3 color=mix(baseColor*.82,baseColor,body);color=mix(color,vec3(.91,.85,.67),fibres*.62);
 gl_FragColor=vec4(color,mix(.2,.97,density)*body);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export function FiberSheet({motion,clustered=false,density=1}:{motion:HistoryMotion;clustered?:boolean;density?:number}) {
 const material=useMemo(()=>new ShaderMaterial({vertexShader:pathVertex,fragmentShader:paperFragment,transparent:true,side:DoubleSide,depthWrite:false,uniforms:{clustered:{value:clustered?1:0},density:{value:density},baseColor:{value:new Color('#ddd6b7')}}}),[clustered]);
 useEffect(()=>()=>material.dispose(),[material]);useFrame(()=>{material.uniforms.density.value=density*(.35+.65*motion.current)});
 return <mesh rotation={[-Math.PI/2,0,0]} material={material}><planeGeometry args={[1.55,1.7]}/></mesh>;
}

export function ClayImpressions({count,motion}:{count:number;motion:HistoryMotion}) {
 const uniforms=useMemo(()=>({historyProgress:{value:0},historyCount:{value:count}}),[]);
 const material=useMemo(()=>{
  const result=new MeshStandardMaterial({color:'#b99a75',roughness:.88});result.customProgramCacheKey=()=> 'history-clay-impressions';
  const functions=`uniform float historyProgress;uniform float historyCount;
float historyIndent(vec2 p){float result=0.0;for(int i=0;i<6;i++){float f=float(i);vec2 c=vec2(.15625+mod(f,3.0)*.26875,.68605-floor(f/3.0)*.37209);vec2 d=p-c;
float wedge=step(0.0,d.x)*step(d.x,.10)*step(abs(d.y),(.10-d.x)*.33);float tail=step(-.025,d.x)*step(d.x,.085)*(1.0-smoothstep(.005,.009,abs(d.y)));
result=max(result,max(wedge,tail)*step(f+.5,historyProgress*historyCount)*step(f+.5,historyCount));}return result;}`;
  result.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nvarying vec2 vHistoryStamp;${functions}`).replace('#include <begin_vertex>','#include <begin_vertex>\nvHistoryStamp=uv;transformed.z-=historyIndent(uv)*.016;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec2 vHistoryStamp;${functions}`).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.0-.26*historyIndent(vHistoryStamp);');
  };return result;
 },[uniforms]);useEffect(()=>()=>material.dispose(),[material]);useFrame(()=>{uniforms.historyProgress.value=motion.current;uniforms.historyCount.value=count});
 return <mesh rotation={[-Math.PI/2,0,0]} material={material} receiveShadow><planeGeometry args={[3.2,2.15,72,48]}/></mesh>;
}

export function PotModel({color='#ad805c',scale=1,position=[0,0,0]}:{color?:string;scale?:number;position?:HistoryPoint}) {
 const geometry=useMemo(()=>new LatheGeometry([new Vector2(.28,.03),new Vector2(.39,.13),new Vector2(.45,.37),new Vector2(.37,.68),new Vector2(.25,.79),new Vector2(.25,.85),new Vector2(.20,.85),new Vector2(.20,.79),new Vector2(.31,.66),new Vector2(.38,.35),new Vector2(.23,.10)],32),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh geometry={geometry} scale={scale} position={position} castShadow receiveShadow><HistorySurface color={color}/></mesh>;
}

function textureCanvas(draw:(context:CanvasRenderingContext2D)=>void,width=256,height=256){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(context)draw(context);
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;
}
export function useHistoryGlyphs(characters:string[]) {
 const textures=useMemo(()=>characters.map(character=>textureCanvas(context=>{context.clearRect(0,0,256,256);context.fillStyle='#242b28';context.textAlign='center';context.textBaseline='middle';context.font='bold 178px serif';context.fillText(character,128,138)})),[characters]);
 useEffect(()=>()=>textures.forEach(texture=>texture.dispose()),[textures]);return textures;
}
export function useHistoryMotif(pattern:number) {
 const texture=useMemo(()=>textureCanvas(context=>{
  context.clearRect(0,0,256,256);context.strokeStyle='#25352c';context.fillStyle='#25352c';context.lineWidth=13;context.lineCap='round';
  if(pattern===0){context.beginPath();context.moveTo(74,220);context.quadraticCurveTo(182,148,139,32);context.stroke();for(let i=0;i<4;i++){context.save();context.translate(116+i*5,65+i*36);context.rotate(i%2?-.8:.7);context.beginPath();context.ellipse(17,0,33,12,0,0,Math.PI*2);context.fill();context.restore()}}
  else for(let i=0;i<4;i++){context.beginPath();context.moveTo(22,45+i*50);context.bezierCurveTo(71,5+i*50,137,86+i*50,230,27+i*50);context.stroke()}
 }),[pattern]);useEffect(()=>()=>texture.dispose(),[texture]);return texture;
}
export function GlyphFace({texture,scale=.35,mirror=false}:{texture:CanvasTexture;scale?:number;mirror?:boolean}) {
 return <mesh rotation={[-Math.PI/2,0,0]} scale={[mirror?-scale:scale,scale,1]}><planeGeometry/><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} side={DoubleSide}/></mesh>;
}
export function HistoryBoat({color='#a98b5e'}:{color?:string}) {return <group>
 <mesh position={[0,.16,0]} scale={[.8,.22,.42]} castShadow><sphereGeometry args={[1,20,12]}/><PhysicalMaterial color={color} kind="wood"/></mesh>
 <Cube kind="wood" color="#cfb184" position={[0,.29,0]} scale={[1.25,.06,.65]}/><Rod kind="wood" color="#856a48" position={[0,.91,0]} scale={[.025,1.2,.025]}/>
 <mesh position={[.26,.88,0]}><planeGeometry args={[.48,.82]}/><meshStandardMaterial color="#e2d9b9" roughness={.9} side={DoubleSide}/></mesh>
</group>}
export function HistoryCamel(){return <group>
 <Ball kind="paint" color="#b99b71" position={[0,.47,0]} scale={[.42,.2,.18]}/><Ball kind="paint" color="#b99b71" position={[-.1,.65,0]} scale={[.16,.17,.16]}/><Ball kind="paint" color="#b99b71" position={[.15,.65,0]} scale={[.15,.17,.15]}/>
 <Rod kind="paint" color="#b99b71" position={[.4,.71,0]} rotation={[0,0,-.28]} scale={[.07,.6,.08]}/><Ball kind="paint" color="#b99b71" position={[.51,.98,0]} scale={[.19,.09,.09]}/>
 {[-.25,.25].flatMap(x=>[-.12,.12].map(z=><Rod key={`${x}-${z}`} kind="paint" color="#977b58" position={[x,.21,z]} scale={[.025,.43,.025]}/>))}
 <Cube kind="paint" color="#8c5b43" position={[0,.73,.23]} scale={[.32,.24,.15]}/>
</group>}

export function HistoryCoils({count,motion,pattern}:{count:number;motion:HistoryMotion;pattern:number}) {
 const ref=useRef<Group>(null);
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const p=soften(portion(motion.current,i,count));child.position.y=.22+i*.155+(1-p)*(.8+i*.035)})});
 return <group ref={ref}>{Array.from({length:count},(_,i)=><group key={i} position={[0,.22+i*.155,0]}><HistoryInspect detail={`第 ${i+1} 圈泥条 · ${pattern?'绳纹只是工艺线索':'盘筑留下接合痕迹'}`}><mesh rotation={[Math.PI/2,0,0]} castShadow receiveShadow><torusGeometry args={[.58+.04*Math.sin(i*.8),.084,8,48]}/><HistorySurface color="#b58b6c" pattern={pattern}/></mesh></HistoryInspect></group>)}</group>;
}
