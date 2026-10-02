import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {CanvasTexture,SRGBColorSpace,type Group} from 'three';
import {ExperimentFrame,useExperimentMotion} from './ExperimentFrame';
import {Ball,Cube,Rod,SceneLabel,type SceneProps} from './shared';
import {PhysicalMaterial} from './materials';
import {Beam,type Motion} from './EngineeringExperimentsParts';
type Props={value:number;option:number;motion:Motion};
function Stamp({text,position,size=.28}:{text:string;position:[number,number,number];size?:number}) {
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const context=c.getContext('2d')!;context.clearRect(0,0,128,96);context.font='bold 60px sans-serif';context.fillStyle='#172e39';context.textAlign='center';context.textBaseline='middle';context.fillText(text,64,48);const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t},[text]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={position} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[size,size*.75]}/><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false}/></mesh>;
}
function Counting({value,option,motion}:Props) {
 const ref=useRef<Group>(null),rows=option+1,countInRow=Math.ceil(value/rows),gap=Math.min(.54,4.5/Math.max(1,countInRow-1));
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const active=motion.current>0&&motion.current<1&&Math.floor(motion.current*value)===i;child.scale.setScalar(active?1.2:1)})});
 return <group>{[-2.75,2.75].map(x=><Cube key={x} kind="wood" color="#937650" position={[x,1.1,0]} scale={[.16,2.2,.55]}/>)}<Cube kind="wood" color="#937650" position={[0,.15,0]} scale={[5.65,.18,.65]}/>{Array.from({length:rows},(_,row)=><Beam key={row} from={[-2.7,.83+row*.8,0]} to={[2.7,.83+row*.8,0]} color="#abb7bd" width={.027}/>)}<group ref={ref}>{Array.from({length:value},(_,i)=><group key={i} position={[(Math.floor(i/rows)-(countInRow-1)/2)*gap,.83+(i%rows)*.8,0]}><Ball kind="wood" color={i%2?'#b0946b':'#749092'} scale={[.19,.23,.23]}/></group>)}</group><SceneLabel position={[0,2.65,0]}>{value} 个 · {option===0?'一排':'两排'}</SceneLabel><SceneLabel position={[0,.25,1.4]}>排列改变，数量不变</SceneLabel></group>;
}
function Addition({value,option,motion}:Props) {
 const ref=useRef<Group>(null),base=option===0?2:3,total=base+value;
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const origin=i<base?[-2.05+i*.46,-.55]:[.91+((i-base)%3)*.46,-.8+Math.floor((i-base)/3)*.5];const target=[(i%5-2)*.59,.8+Math.floor(i/5)*.54],p=motion.current;child.position.set(origin[0]*(1-p)+target[0]*p,.47+Math.sin(p*Math.PI)*.4,origin[1]*(1-p)+target[1]*p)})});
 return <group>{[-1.65,1.45].map(x=><Cube key={x} kind="wood" color="#8d7858" position={[x,.16,-.55]} scale={[2,.2,1.35]}/>)}<Cube kind="wood" color="#a1926f" position={[0,.16,1.03]} scale={[3.75,.2,1.55]}/><group ref={ref}>{Array.from({length:total},(_,i)=><group key={i}><Ball kind="paint" color={i<base?'#bc8555':'#6393a1'} scale={.2}/></group>)}</group><SceneLabel position={[0,2.6,0]}>{base} + {value} = {total}</SceneLabel><SceneLabel position={[-1.65,.3,-1.45]}>原有 {base} 个</SceneLabel><SceneLabel position={[1.45,.3,-1.45]}>加入 {value} 个</SceneLabel></group>;
}
function Subtraction({value,option,motion}:Props) {
 const ref=useRef<Group>(null),base=option===0?6:8,remaining=base-value;
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const x=-2.1+(i%4)*.52,z=-.42+Math.floor(i/4)*.57,p=i<value?motion.current:0;child.position.set(x*(1-p)+(1.65+(i%2)*.43)*p,.42+Math.sin(p*Math.PI)*.4,z*(1-p)+(-.64+Math.floor(i/2)*.5)*p)})});
 return <group><Cube kind="wood" color="#a88b63" position={[-1.32,.16,0]} scale={[2.65,.2,2.25]}/><Cube kind="wood" color="#758c8a" position={[1.87,.16,0]} scale={[1.48,.2,2.5]}/><group ref={ref}>{Array.from({length:base},(_,i)=><group key={i}><Cube kind="wood" color={i<value?'#7b959c':'#c09e65'} scale={[.34,.34,.34]}/></group>)}</group><SceneLabel position={[0,2.6,0]}>{base} − {value} = {remaining}</SceneLabel><SceneLabel position={[-1.35,.3,1.55]}>剩下 {remaining} 个</SceneLabel><SceneLabel position={[1.86,.3,1.55]}>拿走 {value} 个</SceneLabel></group>;
}
function NumberLine({value,option,motion}:Props) {
 const ref=useRef<Group>(null),start=option===0?0:2,finish=start+value;
 useFrame(()=>{if(ref.current)ref.current.position.set(-2.64+(start+value*motion.current)*.44,.44+Math.abs(Math.sin(motion.current*value*Math.PI))*.17,0)});
 return <group><Cube kind="wood" color="#a39574" position={[0,.17,0]} scale={[5.85,.2,1.42]}/>{Array.from({length:13},(_,i)=><group key={i}><Cube kind="metal" color="#6d8791" position={[-2.64+i*.44,.28,0]} scale={[.012,.02,1]}/><Stamp text={String(i)} position={[-2.64+i*.44,.291,.5]} size={.29}/></group>)}<Beam from={[-2.7,.3,-.4]} to={[2.7,.3,-.4]} width={.02} color="#9c7650"/><group ref={ref}><Rod kind="metal" color="#427889" scale={[.12,.25,.12]}/><Ball kind="paint" color="#c19b5f" position={[0,.23,0]} scale={.17}/></group><SceneLabel position={[0,2.4,0]}>从 {start} 出发，向右 {value} 步，到 {finish}</SceneLabel></group>;
}
function Balance({value,option,motion}:Props) {
 const arm=useRef<Group>(null),leftPan=useRef<Group>(null),rightPan=useRef<Group>(null),right=option===0?4:6;
 useFrame(()=>{const a=Math.max(-.26,Math.min(.26,(value-right)*.065))*motion.current;if(arm.current)arm.current.rotation.z=a;if(leftPan.current)leftPan.current.rotation.z=-a;if(rightPan.current)rightPan.current.rotation.z=-a});
 const pan=(count:number,ref:React.RefObject<Group|null>,x:number)=><group ref={ref} position={[x,0,0]}>{[-.36,.36].map(z=><Beam key={z} from={[0,0,0]} to={[0,-.82,z]} color="#9caeb6" width={.012}/>)}<Rod kind="metal" color="#adb8b4" position={[0,-.83,0]} scale={[.66,.065,.52]}/>{Array.from({length:count},(_,i)=><Rod key={i} kind="metal" color="#a99c72" position={[((i%2)-.5)*.28,-.7+Math.floor(i/4)*.21,(Math.floor(i/2)%2-.5)*.28]} scale={[.1,.2,.1]}/>)}</group>;
 return <group><Rod kind="metal" color="#68818d" position={[0,.12,0]} scale={[.65,.21,.65]}/><Rod kind="metal" color="#9babae" position={[0,1.15,0]} scale={[.07,2.1,.07]}/><Ball kind="metal" color="#7e959e" position={[0,2.28,0]} scale={.15}/><group ref={arm} position={[0,2.28,0]}><Cube kind="metal" color="#9fa9a6" scale={[4.65,.1,.13]}/>{pan(value,leftPan,-1.92)}{pan(right,rightPan,1.92)}</group><SceneLabel position={[0,.25,1.6]}>{value} {value===right?'=':value>right?'＞':'＜'} {right} · 每个砝码一样重</SceneLabel></group>;
}
function Fractions({value,option,motion}:Props) {
 const ref=useRef<Group>(null),selected=option+1,theta=Math.PI*2/value;
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const distance=i<selected?.27*motion.current:0,a=(i+.5)*theta;child.position.set(Math.sin(a)*distance,.18,Math.cos(a)*distance)})});
 return <group><Rod kind="metal" color="#929f9e" position={[0,.06,0]} scale={[1.8,.1,1.8]}/><group ref={ref}>{Array.from({length:value},(_,i)=><group key={i} position={[0,.18,0]}><mesh castShadow><cylinderGeometry args={[1.42,1.42,.3,Math.max(8,Math.ceil(64/value)),1,false,i*theta,theta]}/><PhysicalMaterial kind="paint" color="#a57953"/></mesh><mesh position={[0,.16,0]}><cylinderGeometry args={[1.42,1.42,.03,Math.max(8,Math.ceil(64/value)),1,false,i*theta,theta]}/><PhysicalMaterial kind="paint" color={i<selected?'#d6ae58':'#d8cfb5'}/></mesh>{[i*theta,(i+1)*theta].map((angle,side)=><group key={side} position={[Math.sin(angle)*.71,0,Math.cos(angle)*.71]} rotation={[0,angle+(side===0?-Math.PI/2:Math.PI/2),0]}><mesh castShadow><planeGeometry args={[1.42,.3]}/><PhysicalMaterial kind="paint" color="#a57953"/></mesh><mesh position={[0,.16,0]}><planeGeometry args={[1.42,.03]}/><PhysicalMaterial kind="paint" color={i<selected?'#d6ae58':'#d8cfb5'}/></mesh></group>)}<Beam from={[0,.183,0]} to={[Math.sin(i*theta)*1.42,.183,Math.cos(i*theta)*1.42]} width={.008} color="#806b4f"/></group>)}</group><SceneLabel position={[0,2.65,0]}>平均 {value} 份，选 {selected} 份 = {selected}/{value}</SceneLabel></group>;
}
function Measurement({value,option,motion}:Props) {
 const guide=useRef<Group>(null),unit=option+1,length=value*.5;useFrame(()=>{if(guide.current)guide.current.position.x=-2.5+length*motion.current});
 return <group><Cube kind="wood" color="#a28356" position={[-2.5+length/2,.34,-.22]} scale={[length,.36,.59]}/><Cube kind="metal" color="#b9c2b7" position={[0,.16,.64]} scale={[5.32,.09,.62]}/>{Array.from({length:11},(_,i)=><group key={i}><Cube kind="paint" color="#435f6b" position={[-2.5+i*.5,.211,.48]} scale={[.015,.008,i%unit===0?.2:.1]}/>{i%unit===0&&<Stamp text={String(i/unit)} position={[-2.5+i*.5,.214,.77]} size={.25}/>}</group>)}<Cube kind="paint" color="#6c909a" position={[-2.5+unit*.25,.22,-1.15]} scale={[unit*.5,.16,.35]}/><group ref={guide} position={[-2.5,0,0]}><Cube kind="metal" color="#527580" position={[0,.65,-.25]} scale={[.018,1.2,.075]}/></group><SceneLabel position={[0,2.5,0]}>长度 = {value/unit} 个单位</SceneLabel><SceneLabel position={[0,.25,1.5]}>1 个单位 = {unit} 个小格 · 从零对齐</SceneLabel></group>;
}
function Area({value,option,motion}:Props) {
 const ref=useRef<Group>(null),rows=option+2,size=.7,total=value*rows;
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const stage=motion.current*1.6-i/total;child.position.y=.2+(motion.current>0&&motion.current<1&&stage>0&&stage<.5?Math.sin(stage*Math.PI*2)*.45:0)})});
 return <group><Cube kind="wood" color="#8c7755" position={[0,.08,0]} scale={[value*size+.2,.16,rows*size+.2]}/><group ref={ref}>{Array.from({length:total},(_,i)=><group key={i} position={[(i%value-(value-1)/2)*size,.2,(Math.floor(i/value)-(rows-1)/2)*size]}><Cube kind="paint" color={(i%value+Math.floor(i/value))%2?'#7798a1':'#c0b38d'} scale={[size-.02,.09,size-.02]}/></group>)}</group><Beam from={[-value*size/2,.07,rows*size/2+.34]} to={[value*size/2,.07,rows*size/2+.34]} width={.016} color="#a37b4b"/><SceneLabel position={[0,2.65,0]}>{value} 列 × {rows} 行 = {total} 块方砖</SceneLabel><SceneLabel position={[0,.15,rows*size/2+.7]}>每块方砖大小相同</SceneLabel></group>;
}
function Volume({value,option,motion}:Props) {
 const ref=useRef<Group>(null),layers=option+1,cols=value===4?2:value===6?3:value,rows=value/cols,total=value*layers,edge=.52,gap=.56,width=cols*gap,depth=rows*gap,height=layers*gap;
 useFrame(()=>{ref.current?.children.forEach((child,i)=>{const target=.39+Math.floor(i/value)*gap,stage=Math.max(0,Math.min(1,(motion.current-i/total*.6)/.4));child.position.y=target+(motion.current>0&&motion.current<1?(1-stage)*1.15:0)})});
 return <group><Cube kind="wood" color="#9e8b64" position={[0,.06,0]} scale={[width+.25,.12,depth+.25]}/>{[-width/2,width/2].flatMap(x=>[-depth/2,depth/2].map(z=><Beam key={`${x}-${z}`} from={[x,.12,z]} to={[x,height+.18,z]} color="#8da1a7" width={.023}/>))}{[-depth/2,depth/2].map(z=><Beam key={z} from={[-width/2,height+.18,z]} to={[width/2,height+.18,z]} color="#8da1a7" width={.023}/>)}{[-width/2,width/2].map(x=><Cube key={x} kind="glass" color="#bed5d4" position={[x,.15+height/2,0]} scale={[.018,height,depth]}/>)}<group ref={ref}>{Array.from({length:total},(_,i)=>{const local=i%value,layer=Math.floor(i/value);return <group key={i} position={[(local%cols-(cols-1)/2)*gap,.39+layer*gap,(Math.floor(local/cols)-(rows-1)/2)*gap]}><Cube kind="wood" color={['#b29668','#73959a','#a87854'][layer]} scale={[edge,edge,edge]}/></group>})}</group><SceneLabel position={[0,2.8,0]}>每层 {value} 块 × {layers} 层 = {total} 块</SceneLabel></group>;
}
const scenes={counting:Counting,addition:Addition,subtraction:Subtraction,'number-line':NumberLine,'balance-scale':Balance,fractions:Fractions,measurement:Measurement,'area-tiles':Area,'volume-blocks':Volume};
export default function MathExperiments(props:SceneProps) {const motion=useExperimentMotion(props),Scene=scenes[props.lesson as keyof typeof scenes];return <ExperimentFrame props={props}>{Scene&&<Scene value={props.state.experimentValue} option={props.state.experimentOption} motion={motion}/>}</ExperimentFrame>}
