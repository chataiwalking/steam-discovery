import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {ExtrudeGeometry,Shape,type Group,type Mesh} from 'three';
import {ExperimentFrame,useExperimentMotion} from './ExperimentFrame';
import {Ball,Cube,Rod,SceneLabel,type SceneProps} from './shared';
import {PhysicalMaterial} from './materials';
import {ToyCar} from './toyModels';
import {Beam,MovingBeam,Weights,Frame,PulleyWheel,type Motion} from './EngineeringExperimentsParts';
type Props={value:number;option:number;motion:Motion};
function Lever({value,option,motion}:Props) {
 const ref=useRef<Group>(null),pivot=(value-4)*.34,left=2.35+pivot,right=2.35-pivot;
 const angle=Math.max(-.25,Math.min(.25,(left-right*(option+1))*.065));
 useFrame(()=>{if(ref.current)ref.current.rotation.z=angle*motion.current});
 return <group><Cube kind="metal" color="#5d727a" position={[pivot,.12,0]} scale={[1,.22,1.25]}/><mesh position={[pivot,.66,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[.65,1.15,4]}/><PhysicalMaterial kind="metal" color="#839296"/></mesh><group ref={ref} position={[pivot,1.23,0]}><Cube kind="wood" color="#a3865d" position={[-pivot,0,0]} scale={[5.25,.18,.6]}/><group position={[-left,.22,0]}><Weights/></group><group position={[right,.22,0]}><Weights count={option+1}/></group>{[-left,right].map(x=><Cube key={x} kind="metal" color="#758992" position={[x,.11,0]} scale={[.75,.07,.73]}/>)}</group><SceneLabel position={[-2.25,2.4,0]}>左边 1 块</SceneLabel><SceneLabel position={[2.25,2.4,0]}>右边 {option+1} 块</SceneLabel><SceneLabel position={[0,.25,1.65]}>支点移动 · 比较两边的力矩</SceneLabel></group>;
}
function Pulley({value,option,motion}:Props) {
 const load=useRef<Group>(null),wheel=useRef<Group>(null),handle=useRef<Group>(null);
 const pull=value*.145,lift=pull/(option===1?2:1),height=()=>(option===1?.95:.58)+lift*motion.current;
 useFrame(()=>{if(load.current)load.current.position.y=height()-(option===1?.65:.28);if(wheel.current)wheel.current.position.y=option===1?height():2.6;if(handle.current)handle.current.position.y=2.16-pull*motion.current});
 return <group><Frame width={3.3}/><group ref={wheel} position={[-.66,option===1?.95:2.6,0]}><PulleyWheel/></group>{option===1&&<group position={[.02,2.6,0]}><PulleyWheel/></group>}<group ref={load} position={[-.66,.3,0]}><Cube kind="wood" color="#a1835b" scale={[.66,.4,.65]}/><Beam from={[0,.2,0]} to={[0,.3,0]}/></group>{option===0?<><MovingBeam from={()=>[-.96,height()-.08,0]} to={()=>[-.96,2.6,0]}/><MovingBeam from={()=>[-.36,2.6,0]} to={()=>[-.36,2.16-pull*motion.current,0]}/></>:<><MovingBeam from={()=>[-.96,3,0]} to={()=>[-.96,height(),0]}/><MovingBeam from={()=>[-.36,height(),0]} to={()=>[-.28,2.6,0]}/><MovingBeam from={()=>[.32,2.6,0]} to={()=>[.32,2.16-pull*motion.current,0]}/></>}<group ref={handle} position={[option===1?.32:-.36,2.16,0]}><Rod kind="wood" color="#a46d46" rotation={[0,0,Math.PI/2]} scale={[.09,.5,.09]}/></group><SceneLabel position={[0,.4,1.4]}>拉绳 {value} 格 · 重物上升 {option===1?value/2:value} 格</SceneLabel><SceneLabel position={[0,3.32,0]}>{option===1?'理想动滑轮 · 拉绳路程加倍':'理想定滑轮 · 改变用力方向'}</SceneLabel></group>;
}
function Ramp({value,option,motion}:Props) {
 const ref=useRef<Group>(null),length=2+value*.34,height=1.45,run=Math.sqrt(length*length-height*height),angle=Math.atan2(height,run),start=-2.45;
 useFrame(()=>{if(ref.current)ref.current.position.set(start+run*motion.current,.39+height*motion.current,0)});
 return <group><Cube kind="stone" color="#879493" position={[start+run,.78,0]} scale={[.62,1.55,1.35]}/><group position={[start+run/2,.22+height/2,0]} rotation={[0,0,angle]}><Cube kind="wood" color="#a18760" scale={[length,.16,1.28]}/>{[-.62,.62].map(z=><Cube key={z} kind="metal" color="#6e848d" position={[0,.05,z]} scale={[length,.11,.045]}/>)}</group><group ref={ref} rotation={[0,0,angle]} position={[start,.39,0]}><Cube kind="wood" color="#9b7250" position={[0,.21,0]} scale={[.55,.5,.56]}/>{option===1&&<group position={[0,.57,0]}><Weights/></group>}</group><SceneLabel position={[0,.2,1.6]}>同样的高度 · {option===1?'重箱子':'轻箱子'}</SceneLabel><Beam from={[start+run+.5,.05,0]} to={[start+run+.5,height+.2,0]} color="#b99e6e" width={.025}/><SceneLabel position={[0,2.65,0]}>坡道更长，坡度更缓</SceneLabel></group>;
}
function ArchStone({index,total,missing,motion}:{index:number;total:number;missing:boolean;motion:Motion}) {
 const ref=useRef<Group>(null),middle=Math.floor(total/2),keystoneStart=Math.PI/2-Math.PI/(2*total),keystoneEnd=Math.PI/2+Math.PI/(2*total);
 const start=(index<middle?index*keystoneStart/middle:index===middle?keystoneStart:keystoneEnd+(index-middle-1)*(Math.PI-keystoneEnd)/(total-middle-1))+.013;
 const end=(index<middle?(index+1)*keystoneStart/middle:index===middle?keystoneEnd:keystoneEnd+(index-middle)*(Math.PI-keystoneEnd)/(total-middle-1))-.013,center=(start+end)/2;
 const geometry=useMemo(()=>{const s=new Shape();for(let i=0;i<=6;i++){const a=start+(end-start)*i/6;const x=Math.cos(a)*1.5,y=Math.sin(a)*1.5;if(i===0)s.moveTo(x,y);else s.lineTo(x,y)}for(let i=6;i>=0;i--){const a=start+(end-start)*i/6;s.lineTo(Math.cos(a)*1.12,Math.sin(a)*1.12)}s.closePath();return new ExtrudeGeometry(s,{depth:.65,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012,steps:1})},[start,end]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{if(ref.current){const fall=missing?Math.max(0,motion.current-.2):0;ref.current.position.y=.57-Math.min(.42+Math.sin(center)*1.05,fall*fall*3.1);ref.current.rotation.z=missing?Math.cos(center)*fall*.2:0}});
 return <group ref={ref} position={[0,.57,-.32]}><mesh geometry={geometry} castShadow receiveShadow><PhysicalMaterial kind="stone" color={index===Math.floor(total/2)?'#b9ab90':'#9d9e91'}/></mesh></group>;
}
function Arch({value,option,motion}:Props) {
 const support=useRef<Group>(null);useFrame(()=>{if(support.current){support.current.position.z=motion.current*2;support.current.visible=motion.current<.72}});
 return <group>{[-1.37,1.37].map(x=><Cube key={x} kind="stone" color="#8c948e" position={[x,.3,0]} scale={[.75,.6,1.15]}/>)}{Array.from({length:value},(_,i)=>option===1&&i===Math.floor(value/2)?null:<ArchStone key={`${value}-${i}`} index={i} total={value} missing={option===1} motion={motion}/>)}<group ref={support}><Cube kind="wood" color="#8a6d4c" position={[0,.53,0]} scale={[2.3,.1,.6]}/>{[-.8,.8].map(x=><Cube key={x} kind="wood" color="#8a6d4c" position={[x,.3,0]} scale={[.1,.55,.5]}/>)}</group><SceneLabel position={[0,2.75,0]}>{option===0?'完整拱形 · 力传向两边':'缺少拱顶石 · 结构不完整'}</SceneLabel><SceneLabel position={[0,.2,1.45]}>定性结构模型 · 不表示实际承重</SceneLabel></group>;
}
function Tower({value,option,motion}:Props) {
 const ref=useRef<Group>(null),com=useRef<Group>(null),width=option===1?1.9:.82;
 useFrame(()=>{const p=motion.current;const a=option===0&&value>=6?.85*p*p:Math.sin(p*Math.PI*6)*(option===0?.022*value:.035);if(ref.current)ref.current.rotation.z=-a;if(com.current)com.current.position.x=Math.sin(a)*value*.155});
 return <group><Cube kind="metal" color="#637c87" position={[0,.1,0]} scale={[width,.18,1.2]}/><group ref={ref} position={[0,.19,0]}>{Array.from({length:value},(_,i)=><Cube key={i} kind="wood" color={i%2?'#a48961':'#b19772'} position={[0,.155+i*.31,0]} rotation={[0,(i%2)*Math.PI/2,0]} scale={[i===0?width-.1:.68,.3,i===0?1:.68]}/>)}</group><group ref={com} position={[0,.22,.76]}><Ball color="#c95232" scale={.075}/></group><Beam from={[-width/2,.21,.8]} to={[width/2,.21,.8]} color="#99bba6" width={.02}/><SceneLabel position={[0,2.95,0]}>{value} 层 · {option===1?'宽地基':'窄地基'}</SceneLabel><SceneLabel position={[0,.2,1.6]}>红点：重心在底面的投影</SceneLabel></group>;
}
function Dam({value,option,motion}:Props) {
 const upstream=useRef<Mesh>(null),downstream=useRef<Mesh>(null),flow=useRef<Group>(null),level=.25+value*.2;
 useFrame(()=>{const p=option===1?motion.current:0;const height=level-p*Math.min(.55,level*.3);if(upstream.current){upstream.current.scale.y=height;upstream.current.position.y=height/2+.06}if(downstream.current){const h=.18+p*Math.min(.55,level*.3);downstream.current.scale.y=h;downstream.current.position.y=h/2+.06}if(flow.current){flow.current.visible=option===1&&motion.current>0&&motion.current<1;flow.current.children.forEach((child,i)=>{child.position.x=.2+((motion.current*4+i*.17)%1)*1.7;child.position.y=.19+Math.sin(i*2)*.035})}});
 return <group><Cube kind="stone" color="#7c9398" position={[0,.01,0]} scale={[5.4,.12,2.7]}/><Cube ref={upstream} kind="water" color="#3b7986" position={[-1.36,level/2+.06,0]} scale={[2.42,level,2.52]}/><Cube ref={downstream} kind="water" color="#4b8990" position={[1.36,.15,0]} scale={[2.42,.18,2.52]}/>{[-1.06,1.06].map(z=><Cube key={z} kind="stone" color="#a7aaa0" position={[0,1.05,z]} scale={[.45,2.1,.55]}/>)}<Cube kind="metal" color="#657c86" position={[0,option===1?2.25:.85,0]} scale={[.14,1.5,1.55]}/><Cube kind="metal" color="#b8c1bb" position={[0,2.3,0]} scale={[.7,.12,2.8]}/><group ref={flow}>{Array.from({length:10},(_,i)=><Ball key={i} kind="water" color="#aad4d6" position={[.2,.2,(i%3-1)*.35]} scale={[.1,.055,.055]}/>)}</group><SceneLabel position={[-1.4,2.8,0]}>上游水位 {value}</SceneLabel><SceneLabel position={[1.4,2.8,0]}>{option===1?'闸门打开':'闸门关闭'}</SceneLabel></group>;
}
function Crane({value,option,motion}:Props) {
 const arm=useRef<Group>(null),cargo=useRef<Group>(null),reach=.8+value*.29;
 useFrame(()=>{if(arm.current)arm.current.rotation.z=option===1?-value*.03*motion.current:0;if(cargo.current)cargo.current.position.y=-1.84+.85*motion.current});
 return <group><Cube kind="metal" color="#526a73" position={[-.6,.12,0]} scale={[1.7,.23,1.6]}/>{[-.86,-.34].map(x=><Cube key={x} kind="metal" color="#bea05e" position={[x,1.35,0]} scale={[.08,2.45,.14]}/>)}{Array.from({length:4},(_,i)=><Beam key={i} from={[-.86,.25+i*.56,0]} to={[-.34,.81+i*.56,0]} color="#b59659" width={.035}/>)}<group ref={arm} position={[-.6,2.65,0]}><Cube kind="metal" color="#c5a564" position={[(reach-1.25)/2,0,0]} scale={[reach+1.25,.13,.28]}/><Beam from={[-1.2,0,0]} to={[0,.45,0]} color="#7c8b8f" width={.023}/><Beam from={[0,.45,0]} to={[reach,0,0]} color="#7c8b8f" width={.023}/>{option===0&&<Cube kind="stone" color="#697d83" position={[-1.07,-.18,0]} scale={[.55,.48,.63]}/>}<MovingBeam from={()=>[reach,0,0]} to={()=>[reach,-1.84+.85*motion.current+.3,0]} kind="metal" color="#73868c" width={.022}/><group ref={cargo} position={[reach,-1.84,0]}><Cube kind="wood" color="#a7825b" scale={[.6,.52,.6]}/><Beam from={[-.22,.26,0]} to={[0,.4,0]} width={.016}/><Beam from={[.22,.26,0]} to={[0,.4,0]} width={.016}/></group></group><SceneLabel position={[0,.3,1.7]}>吊臂伸长 · {option===0?'配重帮助平衡':'缺少配重，容易倾斜'}</SceneLabel></group>;
}
function Suspension({value,option,motion}:Props) {
 const span=2+value*.37,tower=span*.32,deck=useRef<Group>(null),car=useRef<Group>(null);
 const y=(x:number)=>.59-(option===1?.035*value*Math.sin(Math.PI*(x/span+.5))*motion.current:0);
 const cable=(x:number)=>Math.abs(x)<=tower?1.15+1.08*(x/tower)**2:2.23-(Math.abs(x)-tower)/(span/2-tower)*1.95;
 useFrame(()=>{deck.current?.children.forEach((item,i)=>{const x=-span/2+(i+.5)*span/14;item.position.y=y(x)});if(car.current){const x=-span/2+span*motion.current;car.current.position.set(x,y(x)+.068,0)}});
 return <group><Cube kind="water" color="#50808b" position={[0,.03,0]} scale={[5.8,.08,2.1]}/>{[-tower,tower].flatMap(x=>[-.58,.58].map(z=><Cube key={`${x}-${z}`} kind="stone" color="#9faaa4" position={[x,1.14,z]} scale={[.17,2.28,.18]}/>))}<group ref={deck}>{Array.from({length:14},(_,i)=><Cube key={i} kind="wood" color="#a58a62" position={[-span/2+(i+.5)*span/14,.59,0]} scale={[span/14-.015,.12,1.1]}/>)}</group>{[-.6,.6].map(z=><group key={z}>{Array.from({length:20},(_,i)=>{const x=-span/2+i*span/20,n=x+span/20;return <Beam key={i} from={[x,cable(x),z]} to={[n,cable(n),z]} width={.029} color="#84979d"/>})}{Array.from({length:9},(_,i)=>{const x=-tower+i*tower/4;return option===1&&i%2===1?null:<MovingBeam key={i} from={()=>[x,cable(x),z]} to={()=>[x,y(x),z]} width={.016} kind="metal" color="#a2b2b6"/>})}</group>)}<group ref={car} position={[-span/2,.66,0]} scale={.7}><ToyCar color="#a03e30"/></group><SceneLabel position={[0,2.75,0]}>{option===0?'桥面 → 吊索 → 主缆 → 桥塔':'部分吊索缺失 · 桥面变形示意'}</SceneLabel></group>;
}
function Catapult({value,option,motion}:Props) {
 const ball=useRef<Mesh>(null),arm=useRef<Group>(null),angle=[.35,.75,1.12][option],speed=1.4+value*.15,flight=2*speed*Math.sin(angle)/1.5,range=speed*Math.cos(angle)*flight;
 useFrame(()=>{const p=motion.current,t=p*flight;if(ball.current)ball.current.position.set(-2+speed*Math.cos(angle)*t,.65+speed*Math.sin(angle)*t-.75*t*t,0);if(arm.current)arm.current.rotation.z=-.7+Math.min(1,p*5)*1.3});
 return <group><Cube kind="wood" color="#95764f" position={[-2,.15,0]} scale={[1.45,.2,1.15]}/>{[-.4,.4].map(z=><group key={z}><Beam from={[-2.45,.25,z]} to={[-2,.75,z]} kind="wood" width={.07}/><Beam from={[-1.55,.25,z]} to={[-2,.75,z]} kind="wood" width={.07}/></group>)}<group ref={arm} position={[-2,.7,0]}><Cube kind="wood" color="#b4986e" position={[.37,0,0]} scale={[1.2,.1,.22]}/><Rod kind="wood" color="#8e6c47" position={[.92,.07,0]} scale={[.18,.1,.18]}/></group><Rod kind="metal" color="#bdc4c3" position={[-2,.7,0]} rotation={[Math.PI/2,0,0]} scale={[.12,1,.12]}/><Ball ref={ball} color="#c27843" position={[-2,.65,0]} scale={.17}/><Cube kind="wood" color="#6d877b" position={[-2+range,.4,0]} scale={[.7,.13,.9]}/><SceneLabel position={[0,3.15,0]}>拉开程度 {value} · {['较低角度','中间角度','较高角度'][option]}</SceneLabel><SceneLabel position={[0,.3,1.7]}>简化弹道 · 虚拟软球</SceneLabel></group>;
}
const scenes={lever:Lever,pulley:Pulley,ramp:Ramp,arch:Arch,'tower-balance':Tower,dam:Dam,crane:Crane,'suspension-bridge':Suspension,catapult:Catapult};
export default function EngineeringExperiments(props:SceneProps) {
 const motion=useExperimentMotion(props),Scene=scenes[props.lesson as keyof typeof scenes];
 return <ExperimentFrame props={props}>{Scene&&<Scene value={props.state.experimentValue} option={props.state.experimentOption} motion={motion}/>}</ExperimentFrame>;
}
