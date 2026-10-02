import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape } from 'three';
import { getExperiment } from '../content/experiments';
import { ExperimentFrame, useExperimentMotion } from './ExperimentFrame';
import { Ball, Cube, Rod, type SceneProps } from './shared';
import { PhysicalMaterial } from './materials';
import { ToyCar } from './toyModels';
import { Board, Person, Readout, Stand, Wire, smooth, type ExperimentSceneProps } from './ScienceExperimentsParts';

function Bulb({ lit = false, intensity = 1 }: { lit?: boolean; intensity?: number }) {
  return <group>
    <Rod kind="stone" color="#c5c5b5" position={[0,.09,0]} scale={[.25,.15,.25]} />
    <Rod kind="metal" color="#9d9172" position={[0,.27,0]} scale={[.115,.2,.115]} />
    {[0,.05,.1].map(y=><mesh key={y} position={[0,.21+y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.119,.012,6,32]} /><PhysicalMaterial kind="metal" color="#817962" /></mesh>)}
    <mesh position={[0,.53,0]}><sphereGeometry args={[.25,32,24]} /><meshPhysicalMaterial color={lit?'#ffe6af':'#bed1d6'} transparent opacity={.38} roughness={.13} depthWrite={false} /></mesh>
    <mesh position={[0,.51,0]}><torusGeometry args={[.066,.012,7,24]} /><meshStandardMaterial color={lit?'#ffcd76':'#807e70'} emissive="#f7b64c" emissiveIntensity={lit?intensity*2.1:0} toneMapped={false} /></mesh>
  </group>;
}
function Battery({ position = [0,0,0] }: { position?: [number,number,number] }) {
  return <group position={position} rotation={[0,0,Math.PI/2]}>
    <Rod kind="paint" color="#314e56" scale={[.22,.87,.22]} />
    <Rod kind="metal" color="#ac9270" position={[0,.35,0]} scale={[.224,.21,.224]} />
    <Rod kind="metal" color="#a5adb0" position={[0,.49,0]} scale={[.082,.08,.082]} />
  </group>;
}
function Circuit({ value,option,progress }: ExperimentSceneProps){
  const charge=useRef<Group>(null), lamps=useRef<Group>(null);
  useFrame(()=>{const on=option===1&&progress.current>0;
    if(charge.current){charge.current.visible=on;charge.current.position.x=-2.25+(progress.current*2%1)*4.5;}
    lamps.current?.traverse(object=>{if(object instanceof Mesh&&object.material instanceof MeshStandardMaterial&&object.material.emissive.getHex()!==0){object.material.emissiveIntensity=on?Math.min(2.2,progress.current*8):0;}});
  });
  return <group><Board width={5.4} depth={3.2} />
    <Battery position={[-1.6,.57,1]} />
    <Wire points={[[-2.1,.55,1],[-2.45,.35,1],[-2.45,.35,-.5],[-1.85,.35,-.5]]} color="#4c5961" />
    <Wire points={[[1.85,.35,-.5],[2.42,.35,-.5],[2.42,.35,1],[.85,.35,1]]} />
    <Wire points={[[-1.14,.55,1],[-.65,.35,1],[-.3,.35,1]]} />
    <group position={[.25,.35,1]}>
      <Cube kind="stone" color="#c3bda5" scale={[1.2,.12,.6]} />
      {[-.43,.43].map(x=><Rod key={x} kind="metal" color="#b39b70" position={[x,.16,0]} scale={[.055,.22,.055]} />)}
      <group position={[-.43,.27,0]} rotation={[0,0,option===1?0:.65]}><Cube kind="metal" color="#b6a075" position={[.44,0,0]} scale={[.88,.055,.12]} /><Ball kind="paint" color="#473e32" position={[.9,0,0]} scale={.11} /></group>
    </group>
    <group ref={lamps}>{Array.from({length:value},(_,i)=>{
      const x=value===1?0:-1.8+i*3.6/(value-1);
      return <group key={i} position={[x,.28,-.55]}><Bulb lit={option===1} /><Readout text={`${i+1}`} position={[0,1.1,0]} /></group>;
    })}</group>
    <Wire points={[[-1.85,.33,-.7],[0,.33,-.7],[1.85,.33,-.7]]} color="#a05b43" />
    <group ref={charge} position={[0,.42,-.7]}><Ball color="#f0c771" scale={.055} /></group>
    <Readout text={option===1?'开关闭合：形成回路，小灯泡亮起':'开关断开：回路有缺口，小灯泡不亮'} />
  </group>;
}
function TrafficLight({ value,option,progress }: ExperimentSceneProps){
  const car=useRef<Group>(null),pedestrian=useRef<Group>(null),countdown=useRef<Group>(null);
  const signalNames=['红灯','绿灯','黄灯'];
  useFrame(()=>{const p=progress.current;
    if(car.current) car.current.position.x=option===0?-2.5+5*p:-2.5+1.15*Math.min(1,p*(option===2?2:3));
    if(pedestrian.current){const wait=value*.12;const walk=option===1?Math.max(0,Math.min(1,(p-wait)/(1-wait))):0;pedestrian.current.position.z=1.45-walk*2.9;}
    if(countdown.current)countdown.current.scale.x=Math.max(.01,1-p);
  });
  return <group>
    <Cube kind="stone" color="#5c6264" position={[0,.16,0]} scale={[5.8,.2,2.4]} />
    {[-1,1].map(z=><Cube key={z} kind="stone" color="#b6b9ae" position={[0,.19,z*1.43]} scale={[5.8,.24,.43]} />)}
    {[-2.3,-1.55,-.8,0,.8,1.55,2.3].map(x=><Cube key={x} color="#ddd5b4" position={[x,.27,0]} scale={[.35,.01,.035]} />)}
    {[-.82,-.42,-.02,.38,.78].map(z=><Cube key={z} color="#e4e2ce" position={[.75,.275,z]} scale={[.72,.015,.18]} />)}
    <Cube color="#eee7d0" position={[-.91,.28,0]} scale={[.055,.015,2.28]} />
    <group ref={car} position={[-2.5,.28,.55]}><ToyCar color="#687e87" /></group>
    <group ref={pedestrian} position={[.76,.29,1.45]} scale={.67}><Person color="#a48255" /></group>
    <Stand x={1.7} z={-1.48} height={1.6} />
    <Cube kind="metal" color="#35444b" position={[1.7,1.9,-1.48]} scale={[.42,1.12,.3]} />
    {['#cf5947','#dfb963','#65ab80'].map((color,i)=>{
      const selected=option===[0,2,1][i];
      return <mesh key={i} position={[1.7,2.25-i*.34,-1.31]}><sphereGeometry args={[.12,24,16]} /><meshStandardMaterial color={selected?color:'#303b3d'} emissive={color} emissiveIntensity={selected?1.6:0} toneMapped={false} /></mesh>;
    })}
    <Cube kind="metal" color="#283b42" position={[-1.8,1,-1.5]} scale={[1.2,.44,.08]} />
    <group ref={countdown} position={[-1.8,1,-1.44]}><Cube color="#bcad77" scale={[value*.2,.12,.015]} /></group>
    <Readout text={`行人${signalNames[option]} · ${option===1?'车辆停止，行人等候后通过':'行人停止，观察车辆信号'}（等待设置 ${value}）`} /><Readout text="行人信号" position={[1.7,2.65,-1.48]} /><group position={[-2,1.6,-1.4]}><Cube kind="metal" color="#35444b" scale={[.36,.72,.22]}/>{['#cf5947','#65ab80'].map((color,index)=><mesh key={color} position={[0,.18-index*.36,.13]}><sphereGeometry args={[.105,20,12]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={(index===1?option===0:option!==0)?1.7:0} toneMapped={false}/></mesh>)}<Readout text="车辆信号" position={[0,.65,0]}/></group>
  </group>;
}
function RobotPath({ value,option,progress }: ExperimentSceneProps){
  const robot=useRef<Group>(null);
  useFrame(()=>{if(!robot.current)return;const d=value*.42*smooth(progress.current);robot.current.position.set(option===1?d:option===2?-d:0,.42,1.68-(option===0?d:0));robot.current.rotation.y=option===1?-Math.PI/2:option===2?Math.PI/2:0;});
  return <group><Board width={5.7} depth={5} />
    {Array.from({length:13},(_,i)=>{const p=-2.52+i*.42;return <group key={i}><Cube color="#aebbb9" position={[p,.245,0]} scale={[.015,.01,4.9]} /><Cube color="#aebbb9" position={[0,.245,p*.93]} scale={[5.5,.01,.015]} /></group>;})}
    <Cube kind="stone" color="#aab5b2" position={[-1.7,.44,-1.6]} scale={[1.6,.4,.14]} />
    <Cube kind="stone" color="#aab5b2" position={[1.7,.44,-1.6]} scale={[1.6,.4,.14]} />
    <Cube kind="stone" color="#aab5b2" position={[1.4,.44,-.7]} scale={[.14,.4,1.6]} />
    {Array.from({length:value},(_,i)=>{const d=(i+1)*.42;return <mesh key={i} position={[option===1?d:option===2?-d:0,.258,1.68-(option===0?d:0)]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.068,20]} /><meshBasicMaterial color="#c4a35b" /></mesh>;})}
    <group ref={robot} position={[0,.42,1.68]}>
      <Cube kind="paint" color="#acb6b0" position={[0,.13,0]} scale={[.48,.27,.55]} />
      <Cube kind="metal" color="#718d96" position={[0,.43,-.04]} scale={[.38,.28,.33]} />
      {[-1,1].map(side=><group key={side}>
        <Rod kind="paint" color="#293b43" position={[side*.3,.02,0]} rotation={[0,0,Math.PI/2]} scale={[.19,.11,.19]} />
        <Ball kind="glass" color="#527d93" position={[side*.095,.46,-.21]} scale={.065} />
      </group>)}
      <Rod kind="metal" color="#bac2bf" position={[0,.67,0]} scale={[.012,.15,.012]} />
    </group>
    <Readout text={`${['向前','向右','向左'][option]}走 ${value} 步 · 每一步一个网格`} position={[0,.35,2.65]} />
  </group>;
}
function SolarPanel({ value,option,progress }: ExperimentSceneProps){
  const fan=useRef<Group>(null),gauge=useRef<Group>(null);
  const height=1+value*.24,tilt=Math.atan2(2.25,height-1.13), power=option===0?(.15+value/8*.85):0;
  useFrame(()=>{if(fan.current)fan.current.rotation.z=progress.current*power*40;if(gauge.current)gauge.current.scale.y=Math.max(.01,power*smooth(progress.current));});
  return <group>
    <Stand x={-.6} height={.9} />
    <group position={[-.6,1.13,0]} rotation={[tilt+(option===1?Math.PI:0),0,0]}>
      <Cube kind="metal" color="#7e939d" scale={[2.05,.1,1.65]} />
      <Cube kind="paint" color="#294957" position={[0,.061,0]} scale={[1.94,.025,1.54]} />
      {Array.from({length:6},(_,x)=>Array.from({length:4},(_,z)=><Cube key={`${x}-${z}`} kind="glass" color="#315b76" position={[-.79+x*.315,.087,-.57+z*.38]} scale={[.287,.025,.34]} />))}
    </group>
    <mesh position={[-.6,height,2.25]}><sphereGeometry args={[.22,32,24]} /><meshStandardMaterial color="#f2d294" emissive="#dcb964" emissiveIntensity={1.2} /></mesh>
    <Stand x={1.9} height={1.2} />
    <group position={[1.9,1.32,0]}>
      <mesh><torusGeometry args={[.55,.025,8,64]} /><PhysicalMaterial kind="metal" color="#78949b" /></mesh>
      <group ref={fan}>{[0,1,2].map(i=><group key={i} rotation={[0,0,i*Math.PI*2/3]}><Cube kind="paint" color="#86a39f" position={[0,.24,0]} scale={[.13,.43,.04]} /></group>)}</group>
      <Ball kind="metal" color="#9aacae" scale={.11} />
    </group>
    <Wire points={[[-.4,.9,.5],[.3,.2,.9],[1.9,.2,.7],[1.9,.8,0]]} />
    <Cube kind="metal" color="#546b75" position={[.9,.62,1.25]} scale={[.34,.85,.14]} />
    <group ref={gauge} position={[.9,.23,1.34]}><Cube color="#9abb82" position={[0,.4,0]} scale={[.17,.8,.01]} /></group>
    <Readout text={option===0?'面板朝向阳光：把部分光能变成电能':'面板背向阳光：这个示意装置不发电'} />
  </group>;
}
function WindTurbine({ value,option,progress }: ExperimentSceneProps){
  const rotor=useRef<Group>(null),wind=useRef<Group>(null),meter=useRef<Group>(null);
  const blade=useMemo(()=>{const shape=new Shape();shape.moveTo(-.04,.06);shape.lineTo(.1,.2);shape.lineTo(.15,.43);shape.lineTo(.025,1.05);shape.lineTo(-.03,.95);shape.lineTo(-.07,.24);shape.closePath();return new ExtrudeGeometry(shape,{depth:.028,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2,steps:1});},[]);
  useEffect(()=>()=>blade.dispose(),[blade]);
  useFrame(()=>{if(rotor.current)rotor.current.rotation.z=option===0?-progress.current*value*4:0;
    wind.current?.children.forEach((child,i)=>{child.position.x=-2.8+((progress.current*value*.22+i/4)%1)*1.3;});
    if(meter.current)meter.current.scale.y=Math.max(.01,option===0?value/8*smooth(progress.current):0);
  });
  return <group><Rod kind="metal" color="#647983" position={[0,.14,0]} scale={[.67,.18,.67]} />
    <mesh position={[0,1.08,0]} castShadow><cylinderGeometry args={[.065,.14,1.95,32]} /><PhysicalMaterial kind="paint" color="#c8d0cc" /></mesh>
    <Cube kind="paint" color="#adbdbd" position={[0,2.06,-.21]} scale={[.38,.31,.62]} />
    <group ref={rotor} position={[0,2.06,.18]}>
      {[0,1,2].map(i=><mesh key={i} geometry={blade} rotation={[0,0,i*Math.PI*2/3]} castShadow><PhysicalMaterial kind="paint" color="#d0d6d0" /></mesh>)}
      <Ball kind="paint" color="#a7b8b7" scale={[.17,.17,.21]} />
    </group>
    {option===1&&<Cube kind="metal" color="#b87854" position={[0,2.06,.41]} rotation={[0,0,.7]} scale={[.48,.065,.035]} />}
    <group ref={wind} position={[0,1.3,.3]}>{[0,1,2,3].map(i=><group key={i} position={[-2.8+i*.3,(i%2)*.38,0]}><Rod color="#799fad" rotation={[0,0,Math.PI/2]} scale={[.012,.5,.012]} /><mesh rotation={[0,0,-Math.PI/2]} position={[.3,0,0]}><coneGeometry args={[.05,.12,12]} /><meshBasicMaterial color="#799fad" /></mesh></group>)}</group>
    <Cube kind="metal" color="#556e78" position={[1.85,.67,.1]} scale={[.7,1.05,.28]} />
    <group ref={meter} position={[1.85,.21,.27]}><Cube color="#a9bd86" position={[0,.43,0]} scale={[.28,.86,.025]} /></group>
    <Wire color="#536878" points={[[0,.3,0],[.7,.14,0],[1.85,.2,0]]} />
    <Readout text={option===0?`风速 ${value}：叶轮转动，带动发电机`:'叶片锁定：有风经过，叶轮仍不转动'} />
  </group>;
}
function WaterFilter({ value,option,progress }: ExperimentSceneProps){
  const upper=useRef<Group>(null),lower=useRef<Group>(null),particles=useRef<Group>(null),stream=useRef<Group>(null);
  const quantity=.2+value*.12;
  useFrame(()=>{const p=smooth(progress.current);
    if(upper.current)upper.current.scale.y=Math.max(.01,1-p);
    if(lower.current)lower.current.scale.y=Math.max(.01,p);
    if(stream.current)stream.current.visible=p>0&&p<1;
    particles.current?.children.forEach((dot,i)=>{const caught=option===1?i<12:option===0?i<6:false;const end=caught?1.54:.43+(i%3)*.08;dot.position.y=2.2+(end-2.2)*Math.min(1,p*(1.1+i*.035));});
  });
  return <group>
    <Stand x={-1.55} height={2.65} /><Cube kind="metal" color="#8eaaaf" position={[-.5,2.5,0]} scale={[2.15,.055,.055]} />
    {[1,2.12].map((y,i)=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[i===0?.6:.64,i===0?.6:.55,i===0?1.1:1.05,48,1,true]} /><PhysicalMaterial kind="glass" color="#c2dde0" /></mesh>)}
    <group ref={upper} position={[0,1.66,0]}><mesh position={[0,quantity/2,0]}><cylinderGeometry args={[.51,.51,quantity,40]} /><meshPhysicalMaterial color="#8d8b66" transparent opacity={.57} roughness={.23} depthWrite={false} /></mesh></group>
    <group ref={lower} position={[0,.47,0]}><mesh position={[0,quantity/2,0]}><cylinderGeometry args={[.53,.53,quantity,40]} /><meshPhysicalMaterial color={['#9fa18b','#8db9bf','#8d8b66'][option]} transparent opacity={.54} roughness={.18} depthWrite={false} /></mesh></group>
    <mesh position={[0,1.51,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.63,.055,10,48]} /><PhysicalMaterial kind="metal" color="#799297" /></mesh>
    {option!==2&&<group position={[0,1.5,0]}>
      {Array.from({length:7},(_,i)=><group key={i}><Cube kind="metal" color="#81968f" position={[-.48+i*.16,0,0]} scale={[.012,.012,1.03]} /><Cube kind="metal" color="#81968f" position={[0,0,-.48+i*.16]} scale={[1.03,.012,.012]} /></group>)}
      {option===1&&<Rod kind="stone" color="#aa9a76" position={[0,.065,0]} scale={[.57,.11,.57]} />}
    </group>}
    <group ref={particles}>{Array.from({length:16},(_,i)=><Ball key={i} kind="stone" color="#6b6749" position={[Math.sin(i*2.4)*.38,2.2,Math.cos(i*2.4)*.38]} scale={i<6?.04:.02} />)}</group>
    <group ref={stream} position={[0,1.07,0]}><Rod kind="water" color="#91b4b7" scale={[.026,.7,.026]} /></group>
    <Readout text="过滤能拦住部分悬浮杂质 · 过滤后的水不能直接饮用" />
  </group>;
}
function Telegraph({ value,option,progress }: ExperimentSceneProps){
  const key=useRef<Group>(null),receiver=useRef<Group>(null),marks=useRef<Group>(null),signal=useRef<Mesh>(null);
  useFrame(()=>{const p=progress.current,phase=p*value;const on=p>0&&p<1&&(phase%1)<(option===0?.2:.65);
    if(key.current)key.current.rotation.z=on?-.13:.05;
    if(receiver.current)receiver.current.rotation.z=on?-.12:0;
    if(signal.current)(signal.current.material as MeshStandardMaterial).emissiveIntensity=on?2:0;
    marks.current?.children.forEach((mark,i)=>{mark.visible=p>=(i+1)/value;});
  });
  return <group><Board width={5.5} depth={2.4} />
    <Cube kind="wood" color="#776047" position={[-1.65,.4,0]} scale={[1.58,.25,1.3]} />
    <Rod kind="metal" color="#aaa389" position={[-1.92,.63,0]} rotation={[Math.PI/2,0,0]} scale={[.085,.65,.085]} />
    <group ref={key} position={[-1.92,.72,0]}><Cube kind="metal" color="#a39876" position={[.38,0,0]} scale={[1.05,.055,.18]} /><Rod kind="paint" color="#4e4132" position={[.76,.065,0]} scale={[.19,.13,.19]} /></group>
    <Rod kind="metal" color="#b9a879" position={[-1.18,.59,0]} scale={[.065,.15,.065]} />
    <Cube kind="wood" color="#806b50" position={[1.5,.4,0]} scale={[1.65,.25,1.3]} />
    {Array.from({length:10},(_,i)=><mesh key={i} position={[1.15+i*.055,.73,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.18,.025,8,32]} /><PhysicalMaterial kind="metal" color="#aa754e" /></mesh>)}
    <group ref={receiver} position={[1.0,1.05,0]}><Cube kind="metal" color="#9aa59f" position={[.45,0,0]} scale={[.94,.045,.13]} /><Ball kind="metal" color="#99987f" position={[.89,-.06,0]} scale={.075} /></group>
    <mesh ref={signal} position={[2.13,.77,0]}><sphereGeometry args={[.09,24,18]} /><meshStandardMaterial color="#e2c787" emissive="#e9ae45" emissiveIntensity={0} /></mesh>
    <Wire points={[[-1.12,.46,.6],[-.7,.28,.78],[.55,.28,.78],[1.9,.45,.6]]} />
    <Wire color="#53636d" points={[[-2.2,.46,-.6],[-.8,.29,-.9],[.8,.29,-.9],[2,.45,-.6]]} />
    <group ref={marks} position={[0,.32,1.62]}>{Array.from({length:value},(_,i)=><Cube key={i} kind="metal" color="#c5b17c" position={[(i-(value-1)/2)*.58,0,0]} scale={[option===0?.12:.4,.055,.12]} />)}</group>
    <Readout text={`${value} 次${option===0?'短信号':'长信号'} · 发报键与接收器同步动作`} />
  </group>;
}
function DigitalBit({ bit }: { bit: number }) {
  const segments:[[number,number,number],boolean][]=[[[0,.32,0],false],[[0,0,0],false],[[0,-.32,0],false],[[-.19,.16,0],true],[[.19,.16,0],true],[[-.19,-.16,0],true],[[.19,-.16,0],true]];
  return <group>{segments.map(([position,vertical],i)=><mesh key={i} position={position} rotation={[0,0,vertical?Math.PI/2:0]}><boxGeometry args={[.29,.044,.026]} /><meshStandardMaterial color={((bit===1?[4,6]:[0,2,3,4,5,6]).includes(i))?'#bad5a2':'#2a4149'} emissive="#89b274" emissiveIntensity={(bit===1?[4,6]:[0,2,3,4,5,6]).includes(i)?.65:0} /></mesh>)}</group>;
}
function BinaryCode({ props,value,option,progress }: ExperimentSceneProps){
  const displays=useRef<Group>(null);const bits=[(value>>2)&1,(value>>1)&1,value&1];
  useFrame(()=>{displays.current?.children.forEach((display,i)=>{const revealed=props.state.experimentRun===0&&!props.demo?1:Math.min(1,Math.max(0,progress.current*3-i));display.scale.y=.06+.94*revealed;});});
  return <group><Board width={4.8} depth={2.4} />
    <group ref={displays}>{bits.map((bit,i)=><group key={i} position={[(i-1)*1.42,.35,0]}>
      <Cube kind="metal" color="#3b5260" position={[0,.45,-.1]} scale={[1.12,1.16,.31]} />
      {option===0?<group position={[0,.47,.15]}><mesh><sphereGeometry args={[.29,32,24]} /><meshPhysicalMaterial color={bit?'#e4d69b':'#596668'} roughness={.18} emissive="#d4b365" emissiveIntensity={bit?1.5:0} toneMapped={false} /></mesh></group>:<group position={[0,.52,.08]}><DigitalBit bit={bit} /></group>}
      <Readout text={`位权 ${[4,2,1][i]}`} position={[0,1.28,0]} />
    </group>)}</group>
    <Readout text={`${bits.join('')}₂ = ${bits.map((bit,i)=>`${bit}×${[4,2,1][i]}`).join(' + ')} = ${value}`} position={[0,.35,1.9]} />
  </group>;
}
function Sensors({ value,option,progress }: ExperimentSceneProps){
  const person=useRef<Group>(null),doors=useRef<Group>(null),led=useRef<Mesh>(null);
  const distance=.35+value*.25;
  useFrame(()=>{const z=2.65+(distance-2.65)*smooth(progress.current);if(person.current)person.current.position.z=z;
    const open=option===0?Math.max(0,Math.min(1,(1.5-z)/Math.max(.05,1.5-distance))):0;
    doors.current?.children.forEach((door,i)=>{door.position.x=(i===0?-1:1)*(.59+open*.57);});
    if(led.current)(led.current.material as MeshStandardMaterial).emissiveIntensity=option===0?(open>0?1.9:.4):0;
  });
  return <group>
    <Cube kind="stone" color="#bbbdb1" position={[0,.15,.65]} scale={[4.5,.2,3.85]} />
    {[-1,1].map(side=><Cube key={side} kind="metal" color="#759098" position={[side*1.65,1.31,0]} scale={[.16,2.38,.2]} />)}
    <Cube kind="metal" color="#7e989f" position={[0,2.52,0]} scale={[3.46,.18,.27]} />
    <group ref={doors}>{[-1,1].map(side=><group key={side} position={[side*.59,1.33,0]}>
      <Cube kind="glass" color="#aec9ce" scale={[1.16,2.2,.04]} />
      {[-1,1].map(x=><Cube key={x} kind="metal" color="#9ab0b4" position={[x*.58,0,0]} scale={[.035,2.2,.07]} />)}
      <Cube kind="metal" color="#819ca5" position={[0,-1.09,0]} scale={[1.19,.035,.07]} />
      <Cube color="#c1c7b2" position={[0,0,.045]} scale={[1.13,.05,.01]} />
    </group>)}</group>
    <Cube kind="metal" color="#364d58" position={[0,2.64,.19]} scale={[.38,.17,.27]} />
    <mesh ref={led} position={[0,2.63,.34]}><sphereGeometry args={[.044,16,12]} /><meshStandardMaterial color={option===0?'#79b697':'#5c6261'} emissive="#70b893" emissiveIntensity={.2} /></mesh>
    <group ref={person} position={[0,.26,2.65]}><Person color="#b6a67c" /></group>
    <mesh position={[0,.265,.05]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.42,1.44,64,1,0,Math.PI]} /><meshBasicMaterial color={option===0?'#6b9d9b':'#a1aaa6'} transparent opacity={.5} /></mesh>
    <Readout text={option===0?'感应器开启：进入近处检测范围，门才会打开':'感应器关闭：走近时门仍然关闭'} position={[0,.34,2.72]} />
  </group>;
}
const technologyScenes:Record<string,ComponentType<ExperimentSceneProps>>={
  'electric-circuit':Circuit,'traffic-light':TrafficLight,'robot-path':RobotPath,'solar-panel':SolarPanel,
  'wind-turbine':WindTurbine,'water-filter':WaterFilter,telegraph:Telegraph,'binary-code':BinaryCode,sensors:Sensors,
};
export default function TechnologyExperiments(props:SceneProps){
  const progress=useExperimentMotion(props),definition=getExperiment(props.lesson)!;
  const Scene=technologyScenes[props.lesson];
  const value=props.demo?definition.targetValue:props.state.experimentValue;
  const option=props.demo?definition.targetOption:props.state.experimentOption;
  return <ExperimentFrame props={props}><Scene key={props.lesson} props={props} progress={progress} value={value} option={option} /></ExperimentFrame>;
}
