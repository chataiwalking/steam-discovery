import { useMemo, useRef, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, Mesh, ShaderMaterial } from 'three';
import { getExperiment } from '../content/experiments';
import { ExperimentFrame, useExperimentMotion } from './ExperimentFrame';
import { Ball, Cube, Rod, Tree, type SceneProps } from './shared';
import { Board, Readout, Wire, smooth, type ExperimentSceneProps } from './ScienceExperimentsParts';
import { EffectPath, InspectObject } from './ScienceTechnologyEffects';
import { FocusTarget } from './MathCoreEffects';
import { BioFlower, ButterflyStage, FishModel, FrogModel, Leaf, OwlModel, PollenParticles, RabbitModel, WingedVisitor } from './BiologyParts';

function CellWorld({ value, option, progress }: ExperimentSceneProps) {
  const cell=useRef<Group>(null),nucleus=useRef<Mesh>(null);
  useFrame(()=>{if(cell.current)cell.current.scale.setScalar(.62+value*.16);if(nucleus.current)nucleus.current.rotation.y=progress.current*Math.PI*1.5;});
  return <group><Board width={4.6} depth={3.1}/><group ref={cell} position={[0,1.8,0]}>
    <mesh><sphereGeometry args={[1.23,48,32]}/><meshPhysicalMaterial color="#9dbda8" transparent opacity={option===0?.55:.12} roughness={.22} depthWrite={false}/></mesh>
    <mesh ref={nucleus} position={[-.23,.13,.23]}><sphereGeometry args={[.36,28,20]}/><meshStandardMaterial color="#a39ac2" roughness={.6}/><Ball color="#d0bad9" position={[.1,0,.25]} scale={.095}/></mesh>
    {Array.from({length:8},(_,i)=><group key={i} position={[Math.cos(i*2.4)*.82,Math.sin(i*1.9)*.5,Math.sin(i*2.4)*.55]} rotation={[0,i,0]}>
      <Ball color={i%2?'#ba9a70':'#72a4a0'} scale={[.22,.095,.11]}/>{i%2===0&&<Cube color="#b9d2c0" scale={[.25,.012,.012]}/>}</group>)}
    <Wire points={[[1.18,.05,.2],[1.8,.1,.3],[2.15,.1,.3]]} radius={.007} color="#b0c4b6"/>
    <Readout text="细胞膜" position={[2.4,.1,.3]}/>{option===1&&<><Wire points={[[-.23,.13,.23],[-1.5,.65,.3],[-1.9,.65,.3]]} radius={.007} color="#bbb0d0"/><Readout text="细胞核" position={[-2.15,.65,.3]}/></>} </group>
    <Readout text={`模型放大 ${value} 级 · 典型动物细胞结构示意，非所有细胞`} position={[0,.35,2.08]}/>
  </group>;
}
function FlowerPollination({ value, option, progress }: ExperimentSceneProps) {
  const visitor=useRef<Group>(null);
  useFrame(()=>{if(!visitor.current)return;const t=progress.current*value%1,q=.5-.5*Math.cos(t*Math.PI*2);visitor.current.position.set(-1.52+3.04*q,1.73+Math.sin(q*Math.PI)*.52,.02);visitor.current.rotation.y=t<.5?0:Math.PI;});
  return <group><Board width={5.2} depth={2.7}/>{[-1,1].map(side=><group key={side} position={[side*1.52,.24,0]}><BioFlower color={side<0?'#d99baa':'#dab18b'}/></group>)}
    <group ref={visitor} position={[-1.52,1.73,0]} scale={option===0?1:.73}><WingedVisitor butterfly={option===1} progress={progress} beats={value}/></group>
    <PollenParticles progress={progress} visits={value}/>
    <EffectPath progress={progress} points={[[-1.52,1.71,.14],[0,2.25,.14],[1.52,1.71,.14]]} color="#e1c473" speed={value} strength={.25}/>
    <Readout text="花药：产生花粉" position={[-1.8,.32,1.4]}/><Readout text="柱头：接到花粉" position={[1.8,.32,1.4]}/>
    <Readout text="同种花之间的转运示意 · 访花次数不等于种子数量" position={[0,3,0]}/>
  </group>;
}
function ButterflyLife({ props, value, option, progress }: ExperimentSceneProps) {
  const marker=useRef<Group>(null),models=useRef<Group>(null);
  useFrame(()=>{const stage=props.state.experimentRun>0||props.demo?1+(value-1)*progress.current:value;if(marker.current)marker.current.position.x=(stage-2.5)*1.45;if(models.current)models.current.scale.setScalar(.78+.22*smooth(progress.current));});
  return <group><Board width={5.9} depth={3.2}/>
    {option===0?<group ref={models}>{[1,2,3,4].map(stage=><group key={stage} position={[(stage-2.5)*1.45,.74,0]}><ButterflyStage stage={stage} progress={progress}/><Readout text={['卵','幼虫','蛹','成虫'][stage-1]} position={[0,1.08,0]}/></group>)}</group>:<>
      <group position={[0,1.15,0]} scale={2} ref={models}><ButterflyStage stage={value} progress={progress}/></group>
      {[1,2,3,4].map(stage=><group key={stage} position={[(stage-2.5)*1.15,.31,1.35]} scale={.5}><ButterflyStage stage={stage}/><Readout text={['卵','幼虫','蛹','成虫'][stage-1]} position={[0,.84,0]}/></group>)}
    </>}
    <group ref={marker} position={[(value-2.5)*1.45,.265,-.7]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.34,.39,40]}/><meshBasicMaterial color="#dfc486" toneMapped={false}/></mesh></group>
    <Readout text={`第 ${value} 阶段：${['卵','幼虫','蛹','成虫'][value-1]} · 时间和大小均已压缩`} position={[0,.35,2.28]}/>
  </group>;
}
function FrogLife({ props, value, option, progress }: ExperimentSceneProps) {
  const frog=useRef<Group>(null),marker=useRef<Group>(null);
  useFrame(()=>{if(frog.current)frog.current.position.y=.56+Math.sin(progress.current*Math.PI*4)*.05;if(marker.current){const stage=props.state.experimentRun>0||props.demo?1+(value-1)*progress.current:value;marker.current.position.x=(stage-2.5)*1.4;}});
  return <group><Board width={5.8} depth={3.2}/>
    <mesh position={[0,.39,0]}><boxGeometry args={[5.1,.27,2.3]}/><meshPhysicalMaterial color="#649ca4" transparent opacity={.28} depthWrite={false} roughness={.15}/></mesh>
    {option===0?<group ref={frog} position={[0,.56,0]} scale={2}><FrogModel stage={value}/></group>:<group>{[1,2,3,4].map(stage=><group key={stage} position={[(stage-2.5)*1.4,.56,0]}><FrogModel stage={stage}/><Readout text={['蛙卵','蝌蚪','幼蛙','成蛙'][stage-1]} position={[0,.85,0]}/></group>)}</group>}
    <group ref={marker} position={[(value-2.5)*1.4,.56,-.78]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.32,.37,40]}/><meshBasicMaterial color="#c7d7a1" toneMapped={false}/></mesh></group>
    <Readout text={`第 ${value} 阶段 · 幼蛙还带尾巴，成蛙不再有尾巴`} position={[0,.35,2.05]}/>
  </group>;
}
function Grasshopper() {
  return <group><Ball color="#92aa63" scale={[.3,.12,.12]}/><Ball color="#6e914f" position={[.3,.02,0]} scale={.13}/>{[-1,1].flatMap(side=>[-.16,.03,.2].map((x,i)=><group key={`${side}-${x}`} position={[x,-.03,side*.14]}><Rod color="#718c50" rotation={[side*.4,0,i===0?.7:-.2]} scale={[i===0?.025:.014,i===0?.5:.23,i===0?.025:.014]}/></group>))}</group>;
}
function FoodChain({ value, option, progress }: ExperimentSceneProps) {
  const light=useRef<Group>(null);
  useFrame(()=>{if(light.current)light.current.position.x=-1.85+Math.max(0,value-1)*1.85*smooth(progress.current);});
  const names=option===0?['小草','草食性小虫','青蛙']:['藻类','水蚤','小鱼'];
  return <group><Board width={5.7} depth={3.3}/>
    {[0,1,2].map(i=><group key={i} position={[-1.85+i*1.85,.75,0]} visible={i<value}>
      {i===0?<group>{[-.2,0,.2].map(x=><group key={x} position={[x,.1,0]} rotation={[0,0,x]}><Rod color={option===0?'#7fa15c':'#65a08c'} scale={[.035,.6,.035]}/><group position={[.14,.21,0]} scale={.45}><Leaf color={option===0?'#84a464':'#63a794'}/></group></group>)}</group>:i===1?option===0?<Grasshopper/>:<group scale={.7}><Ball color="#c0be8e" scale={[.26,.38,.2]}/>{[-1,1].map(s=><Rod key={s} color="#a6b688" position={[s*.23,.22,0]} rotation={[0,0,s*-.5]} scale={[.018,.4,.018]}/>)}</group>:option===0?<FrogModel/>:<FishModel/>}
      <Readout text={names[i]} position={[0,.85,0]}/></group>)}
    {[0,1].map(i=><group key={i} visible={i+1<value}><EffectPath progress={progress} points={[[-1.45+i*1.85,.62,.7],[-.5+i*1.85,.62,.7]]} speed={2} radius={.023-i*.006} color="#d0c17d" strength={.6}/><mesh position={[-.55+i*1.85,.62,.7]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.1,.22,12]}/><meshBasicMaterial color="#d8c582" toneMapped={false}/></mesh></group>)}
    <group ref={light} position={[-1.85,.7,.85]}><Ball color="#e6c881" scale={.07}/></group>
    <Readout text="箭头：食物 → 取食者 · 能量不是全部传给下一环节" position={[0,.35,2.18]}/>
  </group>;
}
function AnimalHabitats({ props, value, option, progress }: ExperimentSceneProps) {
  const resources=useRef<Group>(null);
  useFrame(()=>{resources.current?.children.forEach((card,i)=>{card.visible=i<value;const reveal=props.state.experimentRun>0||props.demo?Math.min(1,Math.max(0,progress.current*value-i)):1;card.scale.setScalar(.65+.35*smooth(reveal));});});
  return <group><Board width={5.8} depth={3.6}/>
    {option===0?<><mesh position={[0,.3,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.25,48]}/><meshPhysicalMaterial color="#659fa8" roughness={.18}/></mesh><group position={[0,.37,0]} scale={1.6}><FrogModel/></group></>:option===1?<><Tree position={[-1.35,.24,-.5]} scale={1.2}/><Rod kind="wood" color="#8b7754" position={[0,.63,0]} rotation={[0,0,Math.PI/2]} scale={[.09,1.8,.09]}/><group position={[0,.73,0]} scale={1.35}><OwlModel/></group></>:<><group position={[0,.35,0]} scale={1.5}><RabbitModel/></group><group position={[-1.3,.3,-.4]}><Leaf/></group></>}
    <group ref={resources}>{['食物','水','庇护','空间'].map((name,i)=><group key={name} position={[(i-1.5)*1.22,.48,1.55]}>
      <Cube color={['#a6bd7c','#8ebdc9','#c0a989','#abc2a4'][i]} scale={[1.04,.08,.65]}/><Readout text={name} position={[0,.2,0]}/></group>)}</group>
    <Readout text="显示的是观察要素，不是存活评分" position={[0,2.75,0]}/>
  </group>;
}
function BreathingLungs({ value, option, progress }: ExperimentSceneProps) {
  const lungs=useRef<Group>(null),diaphragm=useRef<Group>(null);
  useFrame(()=>{const inhale=.5-.5*Math.cos(progress.current*value*Math.PI*2);if(lungs.current)lungs.current.scale.set(1+inhale*.08,1+inhale*.12,1+inhale*.14);if(diaphragm.current){diaphragm.current.position.y=.57-inhale*.24;diaphragm.current.scale.y=1-inhale*.65;}});
  const showFlow=option===1?.8:.27;
  return <group><Board width={4.3} depth={2.6}/>
    <mesh position={[0,1.63,-.12]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial color="#c2d4c8" transparent opacity={.14} depthWrite={false}/></mesh>
    <Rod color="#b9c7c0" position={[0,2.53,0]} scale={[.095,.98,.095]}/>
    <group ref={lungs} position={[0,1.44,0]}>{[-1,1].map(side=><group key={side} position={[side*.57,0,0]}><Ball color={option===0?'#dcadab':'#c8a8a5'} scale={side<0?[.48,.77,.29]:[.43,.7,.28]}/><Wire points={[[side*-.57,.76,.05],[side*-.22,.38,.07],[0,.2,.08],[side*.16,-.05,.08]]} color="#b9ccc5" radius={.046}/></group>)}</group>
    <group ref={diaphragm} position={[0,.57,0]}><mesh scale={[1.25,.34,.35]}><sphereGeometry args={[1,32,16,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={option===1?'#bfa464':'#a9b0a0'} roughness={.7}/></mesh></group>
    {[-1,1].map(side=><group key={side}><EffectPath progress={progress} points={[[0,2.85,.14],[0,2.1,.14],[side*.6,1.65,.3]]} speed={value} strength={showFlow} color="#88c4d5" enabled={p=>p>0&&p<1&&p*value%1<.5}/><EffectPath progress={progress} points={[[side*.6,1.65,.3],[0,2.1,.14],[0,2.85,.14]]} speed={value} strength={showFlow} color="#c6b47b" enabled={p=>p>0&&p<1&&p*value%1>=.5}/></group>)}
    <Readout text="肺（正面示意）" position={[0,3.12,0]}/><Readout text="膈肌：吸气时向下、变平" position={[0,.37,1.4]}/>
    <Readout text={`${value} 次模型演示 · 不是呼吸频率或肺容量测量`} position={[0,.25,2]}/>
  </group>;
}
function HeartbeatFlow({ value, option, progress }: ExperimentSceneProps) {
  const heart=useRef<Group>(null);
  useFrame(()=>{if(heart.current){const contraction=Math.pow(Math.max(0,Math.sin(progress.current*value*Math.PI*2)),3);heart.current.scale.setScalar(1-.09*contraction);}});
  return <group><Board width={5.4} depth={3}/>
    <group ref={heart} position={[0,1.35,0]}>{[-1,1].map(side=><group key={side}><Ball color={side<0?'#9caec2':'#c99992'} position={[side*.37,.39,0]} scale={[.35,.31,.25]}/><Ball color={side<0?'#8ea4bd':'#c18583'} position={[side*.35,-.15,0]} rotation={[0,0,-side*.16]} scale={[.4,.52,.29]}/>
      <Cube color="#ded3b4" position={[side*.36,.17,.3]} rotation={[0,0,side*.18]} scale={[.38,.055,.045]}/><Readout text={side<0?'右心':'左心'} position={[side*.15,.83,0]}/></group>)}</group>
    <group position={[-2,1.43,0]}><Ball color="#bfa8a4" scale={[.3,.55,.24]}/><Ball color="#bfa8a4" position={[.64,0,0]} scale={[.28,.51,.23]}/><Readout text="肺" position={[.31,.84,0]}/></group>
    <group position={[2,1.46,0]}><Ball color="#b8c6a5" scale={[.33,.48,.23]}/><Cube color="#b8c6a5" position={[0,-.56,0]} scale={[.49,.64,.28]}/><Readout text="身体" position={[0,.82,0]}/></group>
    <EffectPath progress={progress} points={[[-.37,1.1,.4],[-1.1,.9,.4],[-2,1.4,.35]]} color="#8cbbd5" speed={value} radius={.034} strength={option===1?.85:.16}/>
    <EffectPath progress={progress} points={[[-1.37,1.55,.35],[-.65,2.07,.35],[.37,1.75,.4]]} color="#dcaa9a" speed={value} radius={.034} strength={option===1?.85:.16}/>
    <EffectPath progress={progress} points={[[.37,1.1,.4],[1,2.3,.35],[2,1.6,.35]]} color="#dcaa9a" speed={value} radius={.034} strength={option===0?.85:.16}/>
    <EffectPath progress={progress} points={[[2,1,.35],[1,.57,.35],[-.37,1.75,.4]]} color="#8cbbd5" speed={value} radius={.034} strength={option===0?.85:.16}/>
    <Readout text="红蓝：含氧情况不同 · 血液本身都是红色" position={[0,.35,1.8]}/>
    <Readout text={`${value} 次模型演示 · 不代表个人心率`} position={[0,2.9,0]}/>
  </group>;
}
function SeedModel({ option }: { option: number }) {
  if(option===0)return <group><Ball kind="wood" color="#a99867" scale={[.045,.1,.045]}/><Rod color="#c2c2a0" position={[0,.25,0]} scale={[.009,.4,.009]}/>{Array.from({length:12},(_,i)=><group key={i} rotation={[0,i*Math.PI*2/12,0]}><Rod color="#d8dece" position={[.17,.48,0]} rotation={[0,0,-1.05]} scale={[.007,.38,.007]}/></group>)}</group>;
  if(option===1)return <group><Ball color="#9d966c" scale={[.07,.12,.05]}/><Ball color="#b5bc86" position={[.21,.11,0]} rotation={[0,0,-.5]} scale={[.3,.08,.012]}/></group>;
  return <group><Ball kind="wood" color="#9a7b56" scale={[.11,.15,.11]}/><Ball color="#787b4d" position={[0,.13,0]} scale={[.125,.05,.125]}/></group>;
}
function SeedDispersal({ value, option, progress }: ExperimentSceneProps) {
  const seed=useRef<Group>(null);
  const distance=.7+value*(option===2?.2:option===1?.62:.73);
  useFrame(()=>{if(seed.current){const p=progress.current;seed.current.position.set(-2.2+distance*smooth(p),2.25-1.75*smooth(p),Math.sin(p*Math.PI)*.12);seed.current.rotation.y=option===1?p*Math.PI*8:0;seed.current.rotation.z=option===0?Math.sin(p*Math.PI*3)*.12:0;}});
  return <group><Board width={5.7} depth={3}/><Rod color="#708b57" position={[-2.2,1.23,0]} scale={[.025,1.8,.025]}/><Ball color="#cbd4b1" position={[-2.2,2.25,0]} scale={.19}/>
    <group ref={seed} position={[-2.2,2.25,0]}><SeedModel option={option}/></group>
    <EffectPath progress={progress} points={[[-2.2,2.25,.05],[-2.2+distance*.5,1.32,.13],[-2.2+distance,.5,.05]]} color="#b9d4a0" strength={.28} radius={.013} speed={value*.4}/>
    {[.9,1.3].map(y=><EffectPath key={y} progress={progress} points={[[-2.8,y,.6],[2.2,y,.6]]} color="#8cbeca" strength={.18+value*.08} radius={.012} speed={value*.5}/>) }
    <Readout text="同结构比较风力 · 路径不代表真实落地距离" position={[0,.32,1.95]}/>
  </group>;
}
function AnimalCamouflage({ props, value, option, progress }: ExperimentSceneProps) {
  const material=useRef<ShaderMaterial>(null),reveal=useRef<Mesh>(null);
  const tint=useMemo(()=>new Color().lerpColors(new Color('#c3bd9b'),new Color('#454f3e'),(value-1)/4),[value]);
  const uniforms=useMemo(()=>({tint:{value:tint}}),[tint]);
  useFrame(()=>{if(reveal.current)reveal.current.visible=progress.current>.72&&progress.current<.96;if(material.current)material.current.uniforms.tint.value.copy(tint);});
  return <group><Board width={5.3} depth={2.7}/>
    <mesh position={[0,1.62,-.55]}><planeGeometry args={[4.9,2.65]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="uniform vec3 tint;varying vec2 vUv;void main(){float bark=sin(vUv.x*75.+sin(vUv.y*16.)*2.)*.05+sin(vUv.y*24.)*.025;gl_FragColor=vec4(tint*(.96+bark),1.);}"/></mesh>
    <FocusTarget paused={props.paused} radius={.66} color="#b9d395" position={[.65,.65,-.14]} ringPlane="front" ringPosition={[0,.5,.35]}><OwlModel color={option===0?'#b9b694':'#59604a'}/></FocusTarget>
    <mesh ref={reveal} position={[.65,1.22,.24]} visible={false}><ringGeometry args={[.56,.585,48]}/><meshBasicMaterial color="#ded39a" transparent opacity={.8} toneMapped={false}/></mesh>
    <Readout text="动物颜色固定 · 比较它与背景的明暗差别" position={[0,.3,1.85]}/>
  </group>;
}

const biologyScenes:Record<string,ComponentType<ExperimentSceneProps>>={
  'cell-world':CellWorld,'flower-pollination':FlowerPollination,'butterfly-life':ButterflyLife,'frog-life':FrogLife,
  'food-chain':FoodChain,'animal-habitats':AnimalHabitats,'breathing-lungs':BreathingLungs,'heartbeat-flow':HeartbeatFlow,
  'seed-dispersal':SeedDispersal,'animal-camouflage':AnimalCamouflage,
};
export default function BiologyExperiments(props:SceneProps){
  const progress=useExperimentMotion(props),definition=getExperiment(props.lesson);
  if(!definition)return null;
  const Scene=biologyScenes[props.lesson];if(!Scene)return null;
  const value=props.demo?definition.targetValue:props.state.experimentValue,option=props.demo?definition.targetOption:props.state.experimentOption;
  return <ExperimentFrame props={props}><InspectObject key={props.lesson} text={definition.fact} position={[0,3.37,0]} radius={2.75}><Scene props={props} value={value} option={option} progress={progress}/></InspectObject></ExperimentFrame>;
}
