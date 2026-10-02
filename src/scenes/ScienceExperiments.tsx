import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, DirectionalLight, Float32BufferAttribute, Group, Line, LineBasicMaterial, PointLight, ShaderMaterial } from 'three';
import { getExperiment } from '../content/experiments';
import { ExperimentFrame, useExperimentMotion } from './ExperimentFrame';
import Globe from './RealEarth';
import { Ball, Cloud, Cube, Rod, Tree, type SceneProps } from './shared';
import { PhysicalMaterial } from './materials';
import { Board, GlassTank, Readout, Stand, smooth, type ExperimentSceneProps } from './ScienceExperimentsParts';

function LunarSurface({ phase, view = true }: { phase: number; view?: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  useEffect(() => { if (material.current) material.current.uniforms.phase.value = phase; }, [phase]);
  return <mesh>
    <sphereGeometry args={[1,64,48]} />
    <shaderMaterial ref={material} uniforms={{ phase: { value: phase }, fromEarth: { value: view ? 1 : 0 } }}
      vertexShader={`varying vec3 n; varying vec3 p; varying vec3 worldN; void main(){p=position;n=normalize(normalMatrix*normal);worldN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`uniform float phase; uniform float fromEarth; varying vec3 n; varying vec3 p; varying vec3 worldN;
        float h(vec3 v){return fract(sin(dot(v,vec3(127.1,311.7,74.7)))*43758.5453);}
        float crater(vec3 c,float r){float d=length(normalize(p)-normalize(c))/r;return -.15*exp(-d*d*2.)+.09*exp(-pow((d-.84)*6.,2.));}
        void main(){vec3 sun=vec3(sin(phase),0.,-cos(phase));float light=max(0.,dot(normalize(n),sun));
          if(fromEarth<.5)light=max(0.,dot(normalize(worldN),vec3(1.,0.,0.)));
          float grain=h(floor(p*180.));float maria=.08*sin(p.x*6.+sin(p.z*4.))+.045*cos(p.y*9.+p.z*5.);
          float albedo=.64+maria+grain*.025;
          albedo+=crater(vec3(.3,.4,.8),.17)+crater(vec3(-.4,-.2,.85),.22)+crater(vec3(.57,-.5,.7),.11)+crater(vec3(-.2,.67,.71),.09)+crater(vec3(.1,-.6,.8),.08)+crater(vec3(-.61,.16,.69),.14);
          gl_FragColor=vec4(vec3(albedo)*(.055+light*.92),1.);}`}
    />
  </mesh>;
}
function MoonPhases({ props, value, option, progress }: ExperimentSceneProps) {
  const orbitalMoon = useRef<Group>(null), phaseMaterial = useRef<Group>(null);
  const target = value * Math.PI / 4;
  useFrame(() => {
    const phase = target - ((props.state.experimentRun > 0 || props.demo) ? (1-progress.current)*Math.PI/4 : 0);
    if (orbitalMoon.current) orbitalMoon.current.position.set(Math.cos(phase)*1.62,1.25,Math.sin(phase)*1.62);
    const mesh = phaseMaterial.current?.children[0];
    if (mesh && 'material' in mesh) (mesh.material as ShaderMaterial).uniforms.phase.value = phase;
  });
  return <group>
    {option === 0 ? <>
      <Stand height={.55} />
      <group position={[0,1.6,0]} scale={1.1} ref={phaseMaterial}><LunarSurface phase={target} /></group>
      <group position={[-2.35,.9,0]} scale={.3}><Globe small /></group>
      <Readout text="从地球看：明亮的部分来自太阳照明" position={[0,.3,1.8]} />
    </> : <>
      <group position={[0,1.25,0]} scale={.4}><Globe small /></group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,1.24,0]}><ringGeometry args={[1.61,1.63,96]} /><meshBasicMaterial color="#b5bfc1" /></mesh>
      <group ref={orbitalMoon} position={[Math.cos(target)*1.62,1.25,Math.sin(target)*1.62]} scale={.35}><LunarSurface phase={target} view={false} /></group>
      <Ball color="#e5bf71" position={[2.65,1.25,0]} scale={.27} />
      {[0,1,2].map(i => <Cube key={i} color="#d7b663" position={[2.15-i*.27,1.25,-.68]} scale={[.15,.018,.018]} />)}
      <Readout text="太阳始终照亮月球的一半 · 不是地球的影子" position={[0,.25,2.05]} />
    </>}
    <Readout text={['新月','渐盈的月牙','上弦月','盈凸月','满月','亏凸月','下弦月','渐亏的月牙','新月'][value]} position={[0,3.03,0]} />
  </group>;
}
function SolarSystem({ value, option, progress }: ExperimentSceneProps) {
  const orbit = useRef<Group>(null);
  useFrame(() => { orbit.current?.children.forEach((child,i) => {
    const a = [-.8,1,2.2][i] + progress.current*value*Math.PI*2*[1,.53,.084][i];
    child.position.set(Math.cos(a)*[1.25,1.95,2.73][i],.85,Math.sin(a)*[1.25,1.95,2.73][i]);
    child.rotation.y = progress.current*value*4;
  }); });
  return <group>
    <mesh position={[0,.85,0]}><sphereGeometry args={[.42,40,32]} /><meshStandardMaterial color="#ebbb61" emissive="#e5a439" emissiveIntensity={.8} /></mesh>
    {[1.25,1.95,2.73].map((r,i) => <mesh key={r} rotation={[-Math.PI/2,0,0]} position={[0,.82,0]}><ringGeometry args={[r-.009,r+.009,100]} /><meshBasicMaterial color={i===option?'#bd8a40':'#718690'} /></mesh>)}
    <group ref={orbit}>
      <group scale={option===0?.22:.17}><Globe small /></group>
      <group><Ball kind="stone" color="#ad6750" scale={option===1?.2:.15} /></group>
      <group>
        <mesh castShadow><sphereGeometry args={[option===2?.4:.34,48,32]} />
          <meshStandardMaterial color="#cbb89a" roughness={.88} customProgramCacheKey={()=>'jupiter-bands-v1'} onBeforeCompile={shader=>{
            shader.vertexShader='varying vec3 planetSurface;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nplanetSurface=position;');
            shader.fragmentShader='varying vec3 planetSurface;\n'+shader.fragmentShader;
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat belt=.5+.5*sin(planetSurface.y*67.+sin(planetSurface.x*23.)*.2);diffuseColor.rgb*=mix(vec3(.65,.51,.4),vec3(1.,.98,.88),smoothstep(.25,.8,belt));');
          }} />
        </mesh>
      </group>
    </group>
    <Readout text={`观察${['地球','火星','木星'][option]} · 行星大小、轨道和时间均为压缩示意`} />
  </group>;
}
function MagnetBar({ reverse = false }: { reverse?: boolean }) {
  return <group>
    <Cube kind="metal" color="#939fa4" scale={[1.3,.45,.52]} />
    {[-1,1].map(side => { const north = reverse ? side<0 : side>0; return <group key={side} position={[side*.35,0,0]}>
      <Cube kind="paint" color={north?'#a95043':'#3f7196'} scale={[.6,.47,.54]} />
      <Readout text={north?'N':'S'} position={[0,.36,0]} />
    </group>; })}
  </group>;
}
function Magnetism({ value, option, progress }: ExperimentSceneProps) {
  const bars = useRef<Group>(null), distance=.75+value*.14;
  useFrame(() => { if (!bars.current) return;
    const motion=option===1 ? -Math.min(Math.max(0,distance-.68),smooth(progress.current)*.6/(distance*distance)) : smooth(progress.current)*.6/(1+value*.2);
    bars.current.children[0].position.x=-distance-motion;
    bars.current.children[1].position.x=distance+motion;
  });
  return <group><Board width={5.7} depth={1.9} />
    {[-.35,.35].map(z => <Rod key={z} kind="metal" color="#75858a" position={[0,.43,z]} rotation={[0,0,Math.PI/2]} scale={[.026,5.4,.026]} />)}
    <group ref={bars} position={[0,.75,0]}><group position={[-distance,0,0]}><MagnetBar /></group><group position={[distance,0,0]}><MagnetBar reverse={option===0} /></group></group>
    <Readout text={option===0?'N 对 N：同名磁极相斥':'N 对 S：异名磁极相吸'} position={[0,1.85,0]} />
    <Readout text="轨道上的磁铁可以移动 · 距离越近，作用越明显" />
  </group>;
}
function Floating({ value, option, progress }: ExperimentSceneProps) {
  const blocks=useRef<Group>(null);
  useFrame(()=>{blocks.current?.children.forEach((b,i)=>{
    const target=[1.01,.49,1.17][option], p=Math.min(1,progress.current*1.8);
    b.position.y=2.2+(target-2.2)*smooth(p)+(option!==1&&p>.7?Math.sin((progress.current-.4)*15+i)*.04*(1-progress.current):0);
  });});
  return <group><GlassTank />
    <mesh position={[0,.67,0]}><boxGeometry args={[4.32,.76,2.03]} /><meshPhysicalMaterial color="#598c9e" transparent opacity={.22} roughness={.15} metalness={.1} depthWrite={false} /></mesh>
    <mesh position={[0,1.05,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[4.3,2.01]} /><meshPhysicalMaterial color="#7cabba" transparent opacity={.31} roughness={.09} metalness={.28} clearcoat={1} depthWrite={false} /></mesh>
    <group ref={blocks}>{Array.from({length:value},(_,i)=><group key={i} position={[(i-(value-1)/2)*.78,2.2,0]}>
      <Cube kind={option===1?'metal':'wood'} color={['#a17b43','#8a939a','#c8af79'][option]} scale={[.46,.4,.46]} />
    </group>)}</group>
    <Readout text={`${['木块：浮在水面','钢块：沉入水底','软木：浮在水面，露出更多'][option]} · 同样大小，不同材料`} />
  </group>;
}
function PlantGrowth({ value, option, progress }: ExperimentSceneProps) {
  const plant=useRef<Group>(null);
  useFrame(()=>{if(plant.current){const growth=(.22+.78*smooth(progress.current))*(option===1?.045:value/8);plant.current.scale.setScalar(Math.max(.04,growth));plant.current.rotation.z=option===2?.16:0;}});
  return <group>
    <mesh position={[0,.48,0]} castShadow><cylinderGeometry args={[.75,.54,.8,48,1,true]} /><PhysicalMaterial kind="stone" color="#8e5e44" /></mesh>
    <Rod kind="ground" color="#322c22" position={[0,.8,0]} scale={[.7,.05,.7]} />
    <Ball kind="wood" color="#7e6840" position={[0,.84,0]} scale={[.11,.07,.08]} />
    <group ref={plant} position={[0,.86,0]}>
      <Rod kind="ground" color={option===2?'#b4b07d':'#50723c'} position={[0,.85,0]} scale={[.035,1.7,.035]} />
      {[.45,.8,1.15,1.48].map((y,i)=><group key={y} position={[0,y,0]} rotation={[0,i*2.4,option===2?.35:0]}>
        <Rod kind="ground" color="#677c47" rotation={[0,0,-.85]} position={[.15,.07,0]} scale={[.012,.38,.012]} />
        <Ball kind="paint" color={option===2?'#b0b27b':'#477747'} position={[.37,.16,0]} rotation={[0,.2,.37]} scale={[.33,.025,.13]} />
      </group>)}
      <Ball kind="ground" color={option===2?'#b1b17f':'#558849'} position={[0,1.75,0]} scale={[.08,.17,.07]} />
    </group>
    <Stand x={2} height={2.7} />
    <mesh position={[2,2.9,0]}><sphereGeometry args={[.22,24,20]} /><meshStandardMaterial color={option===2?'#54616a':'#f3d197'} emissive={option===2?'#000':'#e6a942'} emissiveIntensity={.55} /></mesh>
    <Readout text={['水和光充足：幼苗逐渐展开绿叶','缺水：种子很难开始正常生长','缺光：幼苗细长、叶片苍白'][option]} />
  </group>;
}
function SoundWaves({ value, option, progress }: ExperimentSceneProps) {
  const wave=useMemo(()=>{
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(new Float32Array(81*3),3));
    return new Line(geometry,new LineBasicMaterial({color:'#d4c0a1'}));
  },[]);
  useEffect(()=>()=>{wave.geometry.dispose();(wave.material as LineBasicMaterial).dispose();},[wave]);
  const rings=useRef<Group>(null);
  useFrame(()=>{const p=progress.current,active=p>0&&p<1;const a=option===0?.045:.16;
    const positions=wave.geometry.attributes.position;
    for(let i=0;i<81;i++){const u=i/80;positions.setXYZ(i,-2+u*4,.77+(active?Math.sin(u*Math.PI)*Math.sin(p*(value+1)*Math.PI*6)*a*(1-p*.55):0),0);}
    positions.needsUpdate=true;
    rings.current?.children.forEach((r,i)=>{const cycle=(p*(value+1)*.7+i/5)%1;r.scale.setScalar(.25+cycle*1.9);r.visible=active;r.position.z=-cycle*.5;});
  });
  return <group><Board width={4.65} depth={1.6} />
    <Cube kind="wood" color="#6f4e32" position={[0,.4,0]} scale={[4.3,.37,1.24]} />
    <mesh position={[0,.593,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.28,.32,48]} /><PhysicalMaterial kind="metal" color="#645c49" /></mesh>
    {[-2,2].map(x=><Cube key={x} kind="metal" color="#a6afb0" position={[x,.73,0]} scale={[.12,.2,.9]} />)}
    <primitive object={wave} />
    <group ref={rings} position={[0,1.9,-.3]}>{Array.from({length:5},(_,i)=><mesh key={i}><torusGeometry args={[.45,.007,6,64]} /><meshBasicMaterial color="#92b6c3" transparent opacity={.35} /></mesh>)}</group>
    <Readout text={`${option===0?'小振幅':'大振幅'} · 振动速度 ${value} · 波纹只作可视化示意`} />
  </group>;
}
function Shadows({ props, value, option, progress }: ExperimentSceneProps) {
  const lamp=useRef<Group>(null),light=useRef<PointLight>(null),stand=useRef<Group>(null);
  const height=1.05+value*.24;
  const scene=useThree(state=>state.scene);
  useEffect(()=>{
    // This experiment has one visible point source: suppress the gallery rig's
    // second shadow, and restore it when leaving the lesson.
    const saved:{light:DirectionalLight;cast:boolean}[]=[];
    scene.traverse(object=>{if(object instanceof DirectionalLight){saved.push({light:object,cast:object.castShadow});object.castShadow=false;}});
    return ()=>{for(const entry of saved)entry.light.castShadow=entry.cast;};
  },[scene]);
  useFrame(()=>{const y=(props.state.experimentRun>0||props.demo)?1.1+(height-1.1)*smooth(progress.current):height;
    if(lamp.current)lamp.current.position.y=y;
    if(light.current)light.current.position.y=y;
    if(stand.current){stand.current.position.y=y/2;stand.current.scale.y=y;}
  });
  return <group>
    <Cube kind="paint" color="#dfdfd4" position={[0,.15,0]} scale={[5.8,.13,3.4]} />
    <Rod kind="metal" color="#71858f" position={[-2.5,.25,-.6]} scale={[.3,.1,.3]} />
    <group ref={stand} position={[-2.5,height/2,-.6]} scale={[1,height,1]}><Rod kind="metal" color="#99a6a9" scale={[.025,1,.025]} /></group>
    <group ref={lamp} position={[-2.5,height,-.6]}><Ball kind="glass" color="#ead6a0" scale={.17} /><Rod kind="metal" color="#71858b" scale={[.24,.08,.24]} position={[0,.2,0]} /></group>
    <pointLight ref={light} position={[-2.5,height,-.6]} intensity={28} color="#ffe4b1" decay={2} distance={8} castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.002} />
    {option===0?<Rod kind="wood" color="#7f7254" position={[-.55,.67,0]} scale={[.28,.9,.28]} />:option===1?<Cube kind="stone" color="#858d8e" position={[-.55,.62,0]} scale={[.7,.8,.7]} />:<Tree position={[-.55,.23,0]} scale={.9} />}
    <Readout text="看地面：光源越低，影子通常越长" />
  </group>;
}
function WaterStates({ props, value, option, progress }: ExperimentSceneProps) {
  const ice=useRef<Group>(null),water=useRef<Group>(null),mist=useRef<Group>(null),gauge=useRef<Group>(null);
  const target=option===0?value:6-value;
  useFrame(()=>{const running=props.state.experimentRun>0||props.demo;
    const heat=running?(option===0?0:6)+(target-(option===0?0:6))*smooth(progress.current):target;
    if(ice.current){ice.current.visible=heat<3;ice.current.scale.setScalar(Math.max(.01,1-heat/3));}
    if(water.current){water.current.scale.y=Math.max(.03,Math.min(1,heat/2.8))*(1-Math.max(0,heat-4)*.15);water.current.position.y=.8;}
    if(mist.current){mist.current.visible=heat>4;mist.current.scale.setScalar(.35+(heat-4)*.17);mist.current.position.y=2.48+Math.sin(progress.current*9)*.04;}
    if(gauge.current){gauge.current.scale.y=.08+heat*.21;gauge.current.position.y=.65+gauge.current.scale.y/2;}
  });
  return <group>
    <Cube kind="metal" color="#65747a" position={[0,.33,0]} scale={[1.8,.4,1.6]} />
    <Rod kind="metal" color={option===0?'#97694e':'#60838f'} position={[0,.57,0]} scale={[.73,.08,.73]} />
    <mesh position={[0,1.37,0]}><cylinderGeometry args={[.7,.7,1.5,48,1,true]} /><PhysicalMaterial kind="glass" color="#bbd6da" /></mesh>
    <group ref={water} position={[0,.8,0]}><mesh position={[0,.35,0]}><cylinderGeometry args={[.65,.65,.7,48]} /><meshPhysicalMaterial color="#78a4b4" transparent opacity={.47} roughness={.1} metalness={.05} clearcoat={.9} depthWrite={false} /></mesh></group>
    <group ref={ice} position={[0,1.12,0]}>{[-1,1].flatMap(x=>[-1,1].map(z=><Cube key={`${x}${z}`} kind="glass" color="#d7e7e6" position={[x*.2,0,z*.2]} rotation={[0,x*z*.12,0]} scale={[.34,.4,.34]} />))}</group>
    <group ref={mist} position={[0,2.5,0]}><Cloud scale={.55} /></group>
    <Stand x={1.4} height={2.15} />
    <Cube kind="glass" color="#cad7dd" position={[1.4,1.4,0]} scale={[.15,1.7,.12]} />
    <group ref={gauge} position={[1.4,.8,.08]}><Cube color={option===0?'#c27749':'#548cad'} scale={[.055,1,.025]} /></group>
    <Readout text={`${target<2?'冰':target<5?'液态水':'沸水与水蒸气'} · 白雾是小水滴，水蒸气本身看不见`} />
  </group>;
}
const scienceScenes: Record<string,ComponentType<ExperimentSceneProps>>={
  'moon-phases':MoonPhases,'solar-system':SolarSystem,magnetism:Magnetism,floating:Floating,
  'plant-growth':PlantGrowth,'sound-waves':SoundWaves,shadows:Shadows,'states-of-water':WaterStates,
};
export default function ScienceExperiments(props:SceneProps){
  const progress=useExperimentMotion(props), definition=getExperiment(props.lesson)!;
  const Scene=scienceScenes[props.lesson];
  const value=props.demo?definition.targetValue:props.state.experimentValue;
  const option=props.demo?definition.targetOption:props.state.experimentOption;
  return <ExperimentFrame props={props}><Scene key={props.lesson} props={props} progress={progress} value={value} option={option} /></ExperimentFrame>;
}
