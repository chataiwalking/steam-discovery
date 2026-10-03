import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color,DoubleSide,DynamicDrawUsage,LatheGeometry,Object3D,Shape,ShapeGeometry,Vector2,type Group,type InstancedMesh,type Mesh,type MeshBasicMaterial} from 'three';
import {ExperimentFrame,useExperimentMotion} from './ExperimentFrame';
import {Ball,Cube,Rod,SceneLabel,type SceneProps} from './shared';
import {PhysicalMaterial} from './materials';
import {Beam,Frame,type Motion,type Point} from './EngineeringExperimentsParts';
import {BeatPulse,ColorMixDisk,FlowPath,InspectPart,StudyMaterial} from './EngineeringArtEffects';
type Props={value:number;option:number;motion:Motion};

function ColorWheel({value,option,motion}:Props) {
 const palette=useMemo(()=>option===0?['#d94034','#3f965f','#407db5']:option===1?['#e3e5df','#171f23']:['#db5633','#e5a547','#b84937'],[option]);
 return <group>
  <Cube kind="metal" color="#667c84" position={[0,.12,0]} scale={[1.6,.22,1.3]}/><Rod kind="metal" color="#a6b4b7" position={[0,.85,-.1]} scale={[.055,1.5,.055]}/>
  <group position={[0,1.9,0]}><InspectPart detail={value===0?'转速为 0：色块保持分离':'高速时颜色在视觉中平均；不是颜料混合'} labelPosition={[0,1.4,.2]}>
   <Rod kind="metal" color="#758b94" rotation={[Math.PI/2,0,0]} scale={[1.16,.07,1.16]}/><group position={[0,0,.042]}><ColorMixDisk palette={palette} value={value} motion={motion}/></group>
   <Rod kind="metal" color="#a7b7bd" rotation={[Math.PI/2,0,0]} position={[0,0,.078]} scale={[.13,.1,.13]}/>
  </InspectPart></group>
  {palette.map((color,i)=><Cube key={color} kind="paint" color={color} position={[(i-(palette.length-1)/2)*.38,.35,.9]} scale={[.27,.09,.27]}/>)}
  <SceneLabel position={[0,.35,1.5]}>转速 {value} · 视觉混合示意</SceneLabel>
 </group>;
}

function Symmetry({value,option,motion}:Props) {
 const ref=useRef<Group>(null),ghost=useRef<Group>(null);
 useFrame(()=>{
  ref.current?.children.forEach((child,i)=>{const a=i*Math.PI*2/value+(option===1&&i===0?.45:0),r=(option===1&&i===0?.67:1.03)*(.88+.12*motion.current);child.position.set(Math.cos(a)*r,Math.sin(a)*r,0);child.rotation.z=a-Math.PI/2});
  if(ghost.current)ghost.current.position.x=1.03*(.88+.12*motion.current);
 });
 const axes=useMemo(()=>Array.from({length:value},(_,i)=>{const a=i*Math.PI*2/value;return [[0,1.7,.02],[Math.cos(a)*1.4,1.7+Math.sin(a)*1.4,.02]] as Point[]}),[value]);
 return <group>
  <Cube kind="wood" color="#8b7452" position={[0,1.7,-.15]} scale={[3.25,3.15,.13]}/><Cube kind="paint" color="#d0d4c8" position={[0,1.7,-.07]} scale={[3.05,2.95,.04]}/>
  {axes.map((points,i)=><FlowPath key={i} points={points} motion={motion} color="#9dada4" radius={.008} active={false}/>)}
  <group position={[0,1.7,.09]}><group ref={ref}>{Array.from({length:value},(_,i)=><group key={i}><InspectPart detail={`第 ${i+1} 片 · ${option===1&&i===0?'偏离对应位置':`等分角 ${Math.round(360/value)}°`}`} labelPosition={[0,.65,.2]}><Ball kind="paint" color={option===0?'#71919b':i%2?'#b7785b':'#71919b'} scale={[.22,.48,.09]}/></InspectPart></group>)}</group>
   {option===1&&<group ref={ghost} rotation={[0,0,-Math.PI/2]}><mesh scale={[.22,.48,.09]}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color="#c99072" wireframe transparent opacity={.45}/></mesh></group>}
   <Ball kind="metal" color="#c4aa69" scale={[.22,.22,.09]}/>
  </group>
  <Beam from={[0,.24,-.03]} to={[0,3.17,-.03]} width={.012} color="#a0aaa2"/>
  <SceneLabel position={[0,.2,1.3]}>{value} 片花瓣 · {option===0?'等角度排列':'一片发生了错位'}</SceneLabel>
 </group>;
}

function Mosaic({value,option,motion}:Props) {
 const ref=useRef<InstancedMesh>(null),marker=useRef<Mesh>(null),previous=useRef(-1),[hovered,setHovered]=useState<number|null>(null),[pinned,setPinned]=useState<number|null>(null),size=2.85/value;
 const palettes=[['#7caeb4','#326673','#b2c5c0','#516d84'],['#d7994a','#a75339','#e0bc74','#bd7350'],['#64826a','#a4ac81','#344f43','#86987a']],colors=palettes[option];
 const dummy=useMemo(()=>new Object3D(),[]),selected=pinned??hovered;
 useLayoutEffect(()=>{
  if(!ref.current)return;
  ref.current.instanceMatrix.setUsage(DynamicDrawUsage);
  for(let i=0;i<value*value;i++){const x=i%value,y=Math.floor(i/value),distance=Math.round(Math.hypot(x-(value-1)/2,y-(value-1)/2));ref.current.setColorAt(i,new Color(colors[(distance+x%2)%4]))}
  if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;
  previous.current=-1;
 },[value,option]);
 useEffect(()=>{setHovered(null);setPinned(null)},[value,option]);
 useFrame(()=>{
  const p=motion.current;
  if(marker.current&&selected!==null){const settle=Math.min(1,Math.max(0,p*1.3-selected/(value*value)*.3));marker.current.position.z=.07+(p>0&&p<1?(1-settle)*.26:0)}
  if(!ref.current||previous.current===p)return;previous.current=p;
  for(let i=0;i<value*value;i++){
   const x=i%value,y=Math.floor(i/value),settle=Math.min(1,Math.max(0,p*1.3-i/(value*value)*.3));
   dummy.position.set((x-(value-1)/2)*size,((value-1)/2-y)*size,.07+(p>0&&p<1?(1-settle)*.26:0));
   dummy.scale.set(size-.025,size-.025,.09);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);
  }
  ref.current.instanceMatrix.needsUpdate=true;
 });
 return <group position={[0,1.65,0]} rotation={[-.12,0,0]}>
  <Cube kind="wood" color="#877055" scale={[3.1,3.1,.15]}/>
  <instancedMesh ref={ref} args={[undefined,undefined,value*value]} key={value} castShadow receiveShadow
   onPointerMove={event=>{event.stopPropagation();setHovered(current=>current===(event.instanceId??null)?current:(event.instanceId??null))}}
   onPointerOut={()=>setHovered(null)} onClick={event=>{event.stopPropagation();setPinned(current=>current===event.instanceId?null:(event.instanceId??null))}}>
   <boxGeometry/><StudyMaterial color="#ffffff" mode="tile" motion={motion}/>
  </instancedMesh>
  {selected!==null&&<mesh ref={marker} raycast={()=>undefined} position={[(selected%value-(value-1)/2)*size,((value-1)/2-Math.floor(selected/value))*size,.07]} scale={[size-.02,size-.02,.102]}><boxGeometry/><meshBasicMaterial color="#f7dc9a" wireframe/></mesh>}
  {selected!==null&&<SceneLabel position={[0,1.8,.3]} color="#f0ce91">第 {Math.floor(selected/value)+1} 行，第 {selected%value+1} 列 · 单块组合成图案{pinned!==null?' · 再点收起':''}</SceneLabel>}
  <SceneLabel position={[0,-1.48,.35]}>{value} × {value} 块 · {['海洋色','暖阳色','森林色'][option]}</SceneLabel>
 </group>;
}

function Pottery({value,option,motion}:Props) {
 const ref=useRef<Group>(null),height=.5+value*.26;
 const radius=(t:number)=>option===0?.64:option===1?.43+.36*Math.sin(t*Math.PI):.27+.55*Math.pow(Math.sin(t*Math.PI),1.4)*(1-.5*t);
 const geometry=useMemo(()=>{const points=[new Vector2(0,.05)];for(let i=0;i<=32;i++){const t=i/32;points.push(new Vector2(radius(t),.05+height*t))}for(let i=32;i>=0;i--){const t=i/32;points.push(new Vector2(radius(t)-.065,.14+(height-.09)*t))}points.push(new Vector2(0,.14));return new LatheGeometry(points,64)},[height,option]);
 const profile=useMemo(()=>Array.from({length:25},(_,i)=>{const t=i/24;return [radius(t)+.018,.43+height*t,0] as Point}),[height,option]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);useFrame(()=>{if(ref.current)ref.current.rotation.y=motion.current*Math.PI*8});
 return <group>
  <Rod kind="metal" color="#526a77" position={[0,.12,0]} scale={[1.35,.23,1.35]}/>
  <group ref={ref} position={[0,.3,0]}><Rod kind="metal" color="#b1babb" scale={[1.15,.13,1.15]}/><InspectPart detail="同一截面绕中轴旋转，形成轴对称器物" labelPosition={[.85,height*.6,.4]}><mesh geometry={geometry} position={[0,.08,0]} castShadow receiveShadow><StudyMaterial color="#aa7653" mode="clay" motion={motion}/></mesh></InspectPart>{[.2,.5,.8].map(t=><mesh key={t} position={[0,.13+height*t,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius(t)+.004,.008,5,64]}/><meshStandardMaterial color="#a1714f" roughness={.7}/></mesh>)}</group>
  <FlowPath points={profile} motion={motion} color="#dbbe85" radius={.013} active={false}/>
  <Beam from={[0,.25,0]} to={[0,.65+height,0]} color="#88b4be" width={.012}/>
  <SceneLabel position={[0,.3,1.8]}>{['直筒','圆肚','细颈'][option]} · 绕中轴旋转</SceneLabel>
 </group>;
}

function Rhythm({value,option,motion}:Props) {
 const mallets=useRef<Group>(null),cols=Math.min(value,4);
 useFrame(()=>{mallets.current?.children.forEach((child,i)=>{const phase=motion.current*value-i,hit=phase>0&&phase<1?Math.sin(phase*Math.PI):0;child.position.y=1.14-hit*.28})});
 return <group>
  <Cube kind="wood" color="#7e6d54" position={[0,.12,0]} scale={[5.3,.15,3.3]}/>
  {Array.from({length:value},(_,i)=>{const x=(i%4-(cols-1)/2)*1.22,z=Math.floor(i/4)*1.5-.6,strong=option===1&&i%2===0;return <group key={i} position={[x,.48,z]}><InspectPart detail={`第 ${i+1} 拍 · ${strong?'强拍':'常规拍'} · 次序在一组内保持不变`}>
   <Rod kind="wood" color="#965f43" scale={[.41,.55,.41]}/><Rod kind="paint" color={strong?'#d4b679':'#d6d7c8'} position={[0,.29,0]} scale={[.41,.022,.41]}/>
   {[-.27,.27].map(y=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.414,.025,6,24]}/><PhysicalMaterial kind="metal" color="#9eafb3"/></mesh>)}
   <group position={[0,.31,0]}><BeatPulse motion={motion} index={i} count={value} strong={strong}/></group>
  </InspectPart></group>})}
  <group ref={mallets}>{Array.from({length:value},(_,i)=><group key={i} position={[(i%4-(cols-1)/2)*1.22,1.14,Math.floor(i/4)*1.5-.6]}><Rod kind="wood" color="#b49770" position={[0,.36,0]} scale={[.025,.65,.025]}/><Ball kind="wood" color="#c2a47a" scale={.085}/></group>)}</group>
  <SceneLabel position={[0,2.25,0]}>{value} 拍一组 · {option===0?'均匀敲击':'强弱交替'}</SceneLabel><SceneLabel position={[0,.25,2]}>跟着鼓槌看节拍</SceneLabel>
 </group>;
}

function Perspective({value,option,motion}:Props) {
 const farX=.25+value*.265,eyeX=-2.6,planeX=-1.3,nearX=.25,ratio=(x:number)=>option===0?(planeX-eyeX)/(x-eyeX):1;
 const corners=[[-.375,-.375],[-.375,.375],[.375,-.375],[.375,.375]];
 return <group>
  <Cube kind="metal" color="#566f7a" position={[eyeX,1.15,0]} scale={[.38,.36,.45]}/><Rod kind="metal" color="#91a1a8" position={[eyeX+.22,1.15,0]} rotation={[0,0,Math.PI/2]} scale={[.14,.15,.14]}/><Rod kind="metal" color="#708893" position={[eyeX,.55,0]} scale={[.045,1.1,.045]}/>
  <Cube kind="glass" color="#b3d3d7" position={[planeX,1.25,0]} scale={[.025,2.4,2.4]}/>{[-1.2,1.2].map(z=><Cube key={z} kind="metal" color="#81949c" position={[planeX,1.25,z]} scale={[.07,2.5,.07]}/>)}
  {[[nearX,-.68,'#bf8452'],[farX,.68,'#5a91a1']].map(([x0,z0,color],i)=>{const x=Number(x0),z=Number(z0),r=ratio(x);return <group key={i}>
   <InspectPart detail={`实际边长相同 · ${option===0?`投影比例 ${(r*100).toFixed(0)}%`:'平行投影比例相同'}`} labelPosition={[x,1.85,z]}><Cube kind="wood" color={String(color)} position={[x,1.15,z]} scale={[.75,.75,.75]}/><Cube kind="paint" color={String(color)} position={[planeX+.027,1.15,z*r]} scale={[.025,.75*r,.75*r]}/></InspectPart>
   {corners.map(([dy,dz],j)=><FlowPath key={j} points={option===0?[[eyeX,1.15,0],[planeX,1.15+dy*r,(z+dz)*r],[x,1.15+dy,z+dz]]:[[planeX,1.15+dy,z+dz],[x,1.15+dy,z+dz]]} motion={motion} radius={.006} color={i?'#779cac':'#c4a070'} reveal/>)}
  </group>})}
  <SceneLabel position={[-1.3,2.75,0]}>观察窗</SceneLabel><SceneLabel position={[1.4,2.6,0]}>两个方块大小相同</SceneLabel><SceneLabel position={[0,.2,1.9]}>{option===0?'透视投影：近大远小':'平行投影：尺寸相同'}</SceneLabel>
 </group>;
}

function Kinetic({value,option,motion}:Props) {
 const arm=useRef<Group>(null),pendants=useRef<Group>(null);
 useFrame(()=>{
  const p=motion.current,a=-(option===1?.2*p:0)+Math.sin(p*Math.PI*4)*.1*(1-p);
  if(arm.current)arm.current.rotation.z=a;
  pendants.current?.children.forEach((child,i)=>{const length=.55+(Math.min(i,value-1-i)%3)*.27;child.rotation.z=-a+Math.sin(p*12/Math.sqrt(length)+i*.35)*.065*Math.sin(Math.PI*p)});
 });
 return <group><Frame width={5.4} height={3.2}/><Beam from={[0,3.2,0]} to={[0,2.65,0]} width={.015} color="#81969f"/>
  <group ref={arm} position={[0,2.65,0]}><InspectPart detail="两侧的重力与到支点的距离，共同决定平衡" labelPosition={[0,.35,.6]}><Cube kind="metal" color="#aaada4" scale={[4.8,.055,.055]}/></InspectPart>
   <group ref={pendants}>{Array.from({length:value},(_,i)=>{const x=(i-(value-1)/2)*4.4/(value-1),length=.55+(Math.min(i,value-1-i)%3)*.27,heavy=option===1&&i===value-1;return <group key={i} position={[x,0,0]}><InspectPart detail={heavy?'右侧偏重：改变整体平衡':'悬绳越长，摆动节奏通常越慢'} labelPosition={[0,-length-.65,.4]}><Beam from={[0,0,0]} to={[0,-length,0]} width={.012} color="#9ba8aa"/><Ball kind={i%3===0?'metal':'paint'} color={['#b3a05e','#567c8a','#a36950'][i%3]} position={[0,-length-.2,0]} scale={[heavy?.38:.21,heavy?.4:.25,.075]}/></InspectPart></group>})}</group>
  </group>
  <SceneLabel position={[0,.25,1.6]}>{value} 个悬挂物 · {option===0?'两边均衡':'右边偏重'}</SceneLabel>
 </group>;
}

function silhouette(option:number) {const s=new Shape();if(option===0){s.moveTo(-.48,.03);s.quadraticCurveTo(-.28,.5,0,.12);s.quadraticCurveTo(.28,.45,.4,.02);s.lineTo(.2,-.06);s.quadraticCurveTo(-.03,-.27,-.22,-.1);s.closePath()}else if(option===1){s.moveTo(-.2,-.3);s.bezierCurveTo(-.4,.04,-.16,.18,-.15,.18);s.bezierCurveTo(-.44,.74,-.03,.79,-.02,.25);s.bezierCurveTo(.14,.84,.42,.68,.19,.15);s.bezierCurveTo(.43,-.06,.31,-.31,.1,-.34);s.closePath()}else{s.moveTo(0,-.45);s.bezierCurveTo(-.66,-.12,-.45,.4,.19,.51);s.bezierCurveTo(.41,.03,.37,-.27,0,-.45);s.closePath()}return s}
function ShadowTheater({value,option,motion}:Props) {
 const shadow=useRef<Mesh>(null),lamp=useRef<Mesh>(null),geometry=useMemo(()=>new ShapeGeometry(silhouette(option)),[option]),z=-.9+value*.23,ratio=3.4/(2.2-z),y=1.4+.2*(2.2-z)/3.4;
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{if(shadow.current)(shadow.current.material as MeshBasicMaterial).opacity=.86*motion.current;if(lamp.current)(lamp.current.material as MeshBasicMaterial).color.setRGB(.25+motion.current*.9,.23+motion.current*.58,.18+motion.current*.3)});
 return <group>
  <Cube kind="wood" color="#725d48" position={[0,1.7,-1.3]} scale={[3.9,3.05,.14]}/><Cube kind="paint" color="#d8d7c4" position={[0,1.7,-1.2]} scale={[3.65,2.8,.03]}/>
  <mesh ref={shadow} geometry={geometry} position={[0,1.6,-1.177]} scale={ratio*.7}><meshBasicMaterial color="#18252c" side={DoubleSide} transparent opacity={0}/></mesh>
  <InspectPart detail={`点光源投影放大 ${ratio.toFixed(2)} 倍 · 物体靠近灯，影子更大`} labelPosition={[.9,y+.6,z]}><mesh geometry={geometry} position={[0,y,z]} scale={.7} castShadow><PhysicalMaterial kind="wood" color="#634836"/></mesh><Rod kind="wood" color="#937753" position={[0,y/2,z]} scale={[.018,y,.018]}/></InspectPart>
  <Cube kind="metal" color="#5c747f" position={[0,1.4,2.2]} scale={[.45,.4,.45]}/><mesh ref={lamp} position={[0,1.4,1.969]}><circleGeometry args={[.13,24]}/><meshBasicMaterial color="#edd397" toneMapped={false}/></mesh><Rod kind="metal" color="#7b919a" position={[0,.64,2.2]} scale={[.045,1.28,.045]}/>
  {[-1,1].map(sign=><FlowPath key={sign} points={[[0,1.4,2.2],[sign*.4*ratio,1.6,-1.16]]} motion={motion} color="#d4c08d" radius={.007} reveal/>)}
  <SceneLabel position={[0,.2,1.1]}>离幕布更远 · 影子更大</SceneLabel>
 </group>;
}

function Pattern({value,option,motion}:Props) {
 const ref=useRef<Group>(null),cycle=option===0?2:3,colors=['#ac7250','#668e9a','#b0a76d'];
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const p=motion.current,phase=Math.min(1,Math.max(0,p*value-i)),pulse=p>0&&p<1?Math.sin(phase*Math.PI):0;child.position.y=.44+pulse*.22;child.scale.setScalar(1+pulse*.12)})});
 return <group>
  <Cube kind="wood" color="#917a59" position={[0,.13,0]} scale={[5.65,.2,3.2]}/><Cube kind="paint" color="#c9cdbc" position={[0,.245,0]} scale={[5.4,.03,2.95]}/>
  <group ref={ref}>{Array.from({length:value},(_,i)=>{const type=i%cycle;return <group key={i} position={[(i%5-2)*1.05,.44,(Math.floor(i/5)-.5)*1.3]}><InspectPart detail={`第 ${i+1} 个 · 重复单元中的第 ${type+1} 位`} labelPosition={[0,.65,0]}>
   {type===0?<Ball kind="paint" color={colors[type]} scale={.2}/>:type===1?<Cube kind="paint" color={colors[type]} scale={[.4,.4,.4]}/>:<Rod kind="paint" color={colors[type]} scale={[.2,.4,.2]}/>}<SceneLabel position={[0,-.11,.44]}>{i+1}</SceneLabel>
  </InspectPart></group>})}</group>
  <FlowPath points={[[ -2.46,.28,-1.1],[-2.46,.28,-1.25],[-2.1+(Math.min(value,cycle)-1)*1.05+.35,.28,-1.25],[-2.1+(Math.min(value,cycle)-1)*1.05+.35,.28,-1.1]]} motion={motion} color="#d6b780" radius={.018} active={false}/>
  <SceneLabel position={[-1.3,.27,-1.75]}>先找一个重复单元</SceneLabel><SceneLabel position={[0,2.4,0]}>{cycle} 个组成一个重复单元</SceneLabel>
 </group>;
}
const scenes={'color-wheel':ColorWheel,'symmetry-art':Symmetry,mosaic:Mosaic,pottery:Pottery,'music-rhythm':Rhythm,perspective:Perspective,'kinetic-sculpture':Kinetic,'shadow-theater':ShadowTheater,'pattern-design':Pattern};
export default function ArtExperiments(props:SceneProps) {const motion=useExperimentMotion(props),Scene=scenes[props.lesson as keyof typeof scenes];return <ExperimentFrame props={props}>{Scene&&<Scene value={props.state.experimentValue} option={props.state.experimentOption} motion={motion}/>}</ExperimentFrame>}
