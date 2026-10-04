import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Vector3, type Group, type ShaderMaterial } from 'three';
import { getExperiment } from '../content/experiments';
import { ExperimentFrame, useExperimentMotion } from './ExperimentFrame';
import { Ball, Cloud, Cube, Rod, SceneLabel, type SceneProps } from './shared';
import Globe from './RealEarth';
import { Atmosphere, FocusTarget, easeMotion } from './MathCoreEffects';
import { Beam, type Point } from './EngineeringExperimentsParts';
import { Compass, GeoArrow, GeoMovingMarker, GeoParticles, GeoPath, GeoPin, GeoTerrain, GroundSlab, LavaSurface, LayerCap, Mountain, Sandbox, clamp01, spherePoint, type GeoProps } from './GeographyParts';

const layerColors=['#7dbaac','#cc916d','#e8ae59','#f3d18b'];
const layerNames=['地壳','地幔','外核（液态）','内核（固态）'];
const layerRadii=[1.4,1.31,.79,.43];

function EarthLayers({value,option,motion,props}:GeoProps) {
  const layers=useRef<Group>(null),cut=value*Math.PI/7,gapStart=1.62;
  useFrame(()=>{layers.current?.children.forEach((child,i)=>{const p=option===1?easeMotion(motion.current):0;child.position.x=[-2.08,-.5,.87,2][i]*p;child.scale.setScalar(1-p*.48);});});
  return <group>
    <group ref={layers} position={[0,1.6,0]}>{layerRadii.map((radius,i)=><group key={i}>
      <FocusTarget radius={radius*1.05} paused={props.paused} enabled={!props.demo} color={layerColors[i]}>
        <mesh castShadow><sphereGeometry args={[radius,48,32,gapStart+cut,Math.PI*2-cut]}/><meshStandardMaterial color={layerColors[i]} roughness={.68}/></mesh>
        {cut>0&&[gapStart,gapStart+cut].map(angle=><LayerCap key={angle} radius={radius} angle={angle} color={layerColors[i]} order={i}/>) }
      </FocusTarget>
    </group>)}</group>
    <SceneLabel position={[0,3.02,0]}>外层地壳薄 · 里面还有不同的层</SceneLabel>
    {layerNames.map((name,i)=><SceneLabel key={name} position={[(i-1.5)*1.48,.26,1.65]} color={layerColors[i]}>{name}</SceneLabel>)}
    <SceneLabel position={[0,.1,2.5]}>颜色、厚度作示意 · 地幔主要是固态岩石</SceneLabel>
  </group>;
}

function Landforms({value,option,motion,props}:GeoProps) {
  const height=useMemo(()=>(x:number,z:number)=>.17+(option===0?value*.32*(Math.exp(-((x+.95)**2/1.05+(z+.35)**2/.8))+.72*Math.exp(-((x-1.15)**2/.85+(z-.25)**2/.7))):value*.12*(Math.exp(-((x+.8)**2/2.5+(z+.2)**2/2.2))+.45*Math.exp(-((x-1.3)**2/2+(z-.9)**2/1.5)))),[value,option]);
  const points=useMemo(()=>Array.from({length:24},(_,i)=>{const t=i/23,x=-.95+t*.95,z=-.35+t*.9;return [x,height(x,z)+.07,z] as Point;}),[height]);
  return <group><Sandbox/><GeoTerrain height={height}/>
    <GeoPath points={points} color="#e9d199" motion={motion} flow/>
    <GeoMovingMarker points={points} motion={motion} size={.075}/>
    <GeoPin props={props} position={[-.95,height(-.95,-.35),-.35]}/><GeoPin props={props} position={[0,height(0,.55),.55]} color="#7fcede"/>
    <SceneLabel position={[-1.2,2.65,-.35]}>{option===0?'山峰':'低缓丘陵'}</SceneLabel>
    <SceneLabel position={[1.62,.4,1.45]}>{option===0?'谷地比周围低':'平原较平坦'}</SceneLabel>
    <SceneLabel position={[0,.1,2.6]}>从高处沿坡向低处 · 高度等级 {value}（示意）</SceneLabel>
  </group>;
}

function RiverJourney({value,option,motion,props}:GeoProps) {
  const height=useMemo(()=>(x:number,z:number)=>{const t=clamp01((x+2.2)/4.4),channel=Math.sin(t*Math.PI*2)*.58,bank=clamp01(Math.abs(z-channel)*1.7);return .14+(1-t)*value*.27+bank*.26;},[value]);
  const points=useMemo(()=>Array.from({length:40},(_,i)=>{const t=i/39;return [-2.2+t*4.4,.195+(1-t)*value*.27,Math.sin(t*Math.PI*2)*.58] as Point;}),[value]);
  const branch=useMemo(()=>{const end=points[17];return [[-1.85,end[1]+.4,-1.65],[-1.2,end[1]+.25,-1.2],[-.7,end[1]+.13,-.68],end] as Point[];},[points]);
  return <group><Sandbox/><GeoTerrain height={height}/>
    <GeoPath points={points} color="#4996b7" width={.09} motion={motion} flow/>
    {option===1&&<GeoPath points={branch} color="#67bfd2" width={.048} motion={motion} flow/>}
    <GeoMovingMarker points={points} motion={motion} color="#c7f1f3" size={.085}/>
    <GeoPin props={props} position={points[0]}/><GeoPin props={props} position={points[39]} color="#82d0de"/>
    <GeoArrow from={[.75,points[26][1]+.35,.85]} to={[1.7,points[33][1]+.35,.85]}/>
    <SceneLabel position={[-1.95,2.5,-1.2]}>上游高</SceneLabel><SceneLabel position={[1.85,.55,1.25]}>下游低</SceneLabel>
    <SceneLabel position={[0,.1,2.6]}>重力使河水向低处流 · 蓝点只表示路径</SceneLabel>
  </group>;
}

function Volcano({value,option,motion,props}:GeoProps) {
  const path=useMemo(()=>option===0?[[0,.43,0],[0,.95,0],[0,1.42,0],[0,1.93,0]] as Point[]:[[0,1.95,0],[.2,1.77,.35],[.45,1.2,.8],[.78,.55,1.23],[.93,.2,1.65]] as Point[],[option]);
  const bubbles=useMemo(()=>(i:number,p:number,out:Vector3)=>{const t=(p*1.8+i/16)%1;if(option===0)out.set(Math.sin(i*2.4)*.06,.42+t*1.5,Math.cos(i*2.4)*.06);else{const angle=i*2.4,r=t*.7;out.set(Math.cos(angle)*r,1.9+Math.sin(t*Math.PI)*value*.17-t*.35,Math.sin(angle)*r);}},[value,option]);
  return <group><Sandbox/><Cube kind="stone" color="#b49b80" position={[0,.1,0]} scale={[5,.16,3.9]}/>
    <mesh position={[0,1.02,0]} castShadow receiveShadow><cylinderGeometry args={[.28,1.64,1.68,48,1,false,option===0?.72:0,option===0?5.05:Math.PI*2]}/><meshStandardMaterial color="#8b8274" roughness={.96} side={DoubleSide}/></mesh>
    <mesh position={[0,1.87,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.29,.055,8,40]}/><meshStandardMaterial color="#5e625a" roughness={.9}/></mesh>
    {option===0&&<group><FocusTarget radius={.55} paused={props.paused} enabled={!props.demo} position={[0,.45,0]} color="#f2b565"><Ball kind="paint" color="#d97643" scale={[.39,.3,.39]}/><Atmosphere radius={.41} color="#ffb763" strength={.25}/></FocusTarget><Rod color="#e99253" position={[0,1.13,0]} scale={[.085,1.34,.085]}/></group>}
    <GeoPath points={path} color="#ffbb6a" width={option===0?.05:.078} motion={motion} flow/>
    <GeoMovingMarker points={path} motion={motion} color="#ffd995" size={.075}/>
    <GeoParticles motion={motion} color="#edbf88" size={.025+value*.002} point={bubbles}/>
    {option===1&&<group position={[.9,.195,1.7]} scale={[.8,1,.5]}><LavaSurface motion={motion} radius={.52}/></group>}
    <SceneLabel position={[-1.68,1.25,.45]}>{option===0?'地下：岩浆':'地表：熔岩'}</SceneLabel>
    <SceneLabel position={[0,.1,2.65]}>局部岩浆 · 部分板块边界或热点可形成火山</SceneLabel>
    <SceneLabel position={[0,2.8,-.3]}>压力等级 {value} · 动画为情景示意</SceneLabel>
  </group>;
}

function PlateMotion({value,option,motion,props}:GeoProps) {
  const left=useRef<Group>(null),right=useRef<Group>(null),fold=useRef<Group>(null),newCrust=useRef<Group>(null);
  useFrame(()=>{const p=easeMotion(motion.current),distance=value*.22*p;
    if(left.current&&right.current){const x=option===0?1.25+distance:option===1?1.3-.1*p:1.3;left.current.position.set(-x,.57,option===2?-distance:0);right.current.position.set(x,.57,option===2?distance:0);}
    if(fold.current)fold.current.scale.y=option===1?.12+value*.32*p:.001;
    if(newCrust.current)newCrust.current.scale.x=option===0?.1+distance*2:.001;
  });
  return <group><Sandbox width={6.7} depth={3.8}/>
    <group ref={left} position={[-1.3,.57,0]}><FocusTarget radius={1.05} paused={props.paused} enabled={!props.demo}><GroundSlab position={[0,0,0]} color="#9aaa83"/></FocusTarget></group>
    <group ref={right} position={[1.3,.57,0]}><FocusTarget radius={1.05} paused={props.paused} enabled={!props.demo}><GroundSlab position={[0,0,0]} color="#b9ad81"/></FocusTarget></group>
    <group ref={fold} position={[0,.77,0]} scale={[1,.001,1]}><Mountain radius={.67} height={1.1}/></group>
    <group ref={newCrust} position={[0,.73,0]} scale={[.001,1,1]}><Cube color="#d59a72" scale={[1,.06,2.5]}/></group>
    {option===0?<><GeoArrow from={[-.6,1.3,0]} to={[-1.7,1.3,0]}/><GeoArrow from={[.6,1.3,0]} to={[1.7,1.3,0]}/></>:option===1?<><GeoArrow from={[-1.8,1.3,0]} to={[-.65,1.3,0]}/><GeoArrow from={[1.8,1.3,0]} to={[.65,1.3,0]}/></>:<><GeoArrow from={[-1.3,1.3,.7]} to={[-1.3,1.3,-.7]}/><GeoArrow from={[1.3,1.3,-.7]} to={[1.3,1.3,.7]}/></>}
    <SceneLabel position={[0,2.65,0]}>{['远离：中间产生新地壳','大陆靠近：挤压形成山脉','沿边滑动：两侧擦身而过'][option]}</SceneLabel>
    <SceneLabel position={[0,.1,2.5]}>板块包括地壳和上部地幔 · 运动被加快</SceneLabel>
  </group>;
}

const stations=[{temperature:23,rain:false,cloud:false,air:'向东',dx:1,dz:0},{temperature:18,rain:false,cloud:true,air:'向南',dx:0,dz:1},{temperature:12,rain:true,cloud:true,air:'向西',dx:-1,dz:0},{temperature:26,rain:false,cloud:false,air:'向北',dx:0,dz:-1}];
const stationPositions:Point[]=[[-1.55,.2,-.85],[1.55,.2,-.85],[-1.55,.2,.85],[1.55,.2,.85]];
function WeatherMap({value,option,motion,props}:GeoProps) {
  const selected=value-1,record=stations[selected],place=stationPositions[selected];
  const rain=useMemo(()=>(i:number,p:number,out:Vector3)=>{const t=(p*3+i/16)%1;out.set(place[0]-.38+(i%4)*.25,place[1]+1.32-t*1.08,place[2]-.23+Math.floor(i/4)*.15);},[place]);
  const pointer=useMemo(()=>[[place[0],.35,place[2]],[place[0]+record.dx*.75,.35,place[2]+record.dz*.75]] as Point[],[place,record]);
  return <group><Sandbox/><Cube kind="paint" color="#b0c4af" position={[0,.15,0]} scale={[5.25,.035,4.05]}/>
    {[-.85,.85].map(x=><Beam key={x} from={[x,.2,-1.95]} to={[x,.2,1.95]} width={.008} color="#d4decd"/>)}<Beam from={[-2.5,.2,0]} to={[2.5,.2,0]} width={.008} color="#d4decd"/>
    {stationPositions.map((position,i)=><group key={i}><GeoPin props={props} position={position} color={selected===i?'#f4c87f':'#849ca7'} radius={.32}/><SceneLabel position={[position[0],.23,position[2]+.58]}>{i+1} 号站{option===1?` · ${stations[i].temperature}°C`:stations[i].rain?' · 有雨':stations[i].cloud?' · 多云':' · 晴'}</SceneLabel></group>)}
    {option===0&&record.cloud&&<Cloud position={[place[0],1.55,place[2]]} scale={.59} rain={record.rain}/>} 
    {option===0&&!record.cloud&&<group position={[place[0],1.38,place[2]]}><Ball color="#efd192" scale={.25}/><Atmosphere radius={.27} color="#f3ce87" strength={.22}/></group>}
    {option===0&&record.rain&&<GeoParticles motion={motion} point={rain} stretch={2.9} size={.019}/>} 
    {option===1&&<><GeoArrow from={pointer[0]} to={pointer[1]}/><GeoMovingMarker points={pointer} motion={motion} color="#e4eeee" size={.065}/></>}
    <SceneLabel position={[0,2.8,0]}>选定 {value} 号站 · {option===0?(record.rain?'有降雨':record.cloud?'多云':'晴朗'):`气温 ${record.temperature}°C · 空气${record.air}移动`}</SceneLabel>
    <SceneLabel position={[0,.1,2.6]}>虚构情景观测 · 非实时天气或预报</SceneLabel>
  </group>;
}

function SeasonGlobe({hemisphere}:{hemisphere:number}) {
  const uniforms=useMemo(()=>({uSun:{value:new Vector3(0,1.48,0)},uHemisphere:{value:hemisphere===0?1:-1}}),[hemisphere]);
  return <mesh><sphereGeometry args={[.64,48,32]}/><shaderMaterial uniforms={uniforms}
    vertexShader={`varying vec3 vWorld;varying vec3 vN;varying vec3 vLocal;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vN=normalize((modelMatrix*vec4(normal,0.)).xyz);vLocal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
    fragmentShader={`uniform vec3 uSun;uniform float uHemisphere;varying vec3 vWorld;varying vec3 vN;varying vec3 vLocal;
      void main(){float sunlight=max(0.,dot(normalize(vN),normalize(uSun-vWorld)));vec3 c=mix(vec3(.29,.53,.38),vec3(.23,.52,.68),step(0.,vLocal.y));float grid=1.-smoothstep(.01,.03,abs(vLocal.y));c=mix(c,vec3(.86,.89,.81),grid);float focus=step(0.,vLocal.y*uHemisphere);gl_FragColor=vec4(c*(.2+sunlight*.9)+focus*.035,1.);}`}/></mesh>;
}
function Seasons({value,option,motion,props}:GeoProps) {
  const earth=useRef<Group>(null),theta=value*Math.PI/2,position:Point=[Math.cos(theta)*2.37,1.48,Math.sin(theta)*2.37];
  const orbit=useMemo(()=>Array.from({length:64},(_,i)=>[Math.cos(i*Math.PI/32)*2.37,.22,Math.sin(i*Math.PI/32)*2.37] as Point),[]);
  const latitude=option===0?50:-50,declination=-23.44*Math.cos(theta),daylight=24/Math.PI*Math.acos(-Math.tan(latitude*Math.PI/180)*Math.tan(declination*Math.PI/180));
  const names=option===0?['冬季','春季','夏季','秋季']:['夏季','秋季','冬季','春季'];
  const parallel=useMemo(()=>Array.from({length:48},(_,i)=>spherePoint(latitude,i*360/48,.67)),[latitude]);
  useFrame(()=>{if(earth.current)earth.current.rotation.y=motion.current*Math.PI*2;});
  return <group><GeoPath points={orbit} closed width={.012} color="#819da8"/>
    <group position={[0,1.48,0]}><Ball color="#eacd8b" scale={.34}/><Atmosphere radius={.36} color="#ffe0a4" strength={.3}/></group>
    <group position={position} rotation={[0,0,-23.44*Math.PI/180]}>
      <Beam from={[0,-.96,0]} to={[0,.96,0]} color="#cfdfe2" width={.018}/>
      <group ref={earth}><FocusTarget radius={.7} paused={props.paused} enabled={!props.demo}><SeasonGlobe hemisphere={option}/><GeoPath points={parallel} closed width={.012} color="#f1d38e"/></FocusTarget></group>
      <Ball color="#dfa075" position={[0,.9,0]} scale={.052}/>
    </group>
    <SceneLabel position={[0,3.06,0]}>选定：{option===0?'北半球':'南半球'} · {names[value]}</SceneLabel>
    <SceneLabel position={[0,.15,2.82]}>纬度 {Math.abs(latitude)}° 示意昼长约 {daylight.toFixed(1)} 小时</SceneLabel>
    <SceneLabel position={[0,.1,-2.95]}>地轴一直朝同一侧 · 轨道距离固定以比较倾斜</SceneLabel>
  </group>;
}

function LatitudeLongitude({value,option,motion,props}:GeoProps) {
  const degrees=value*30,latitude=option<2?degrees*(option===0?1:-1):0,longitude=option>=2?degrees*(option===2?1:-1):0;
  const parallels=useMemo(()=>[-60,-30,0,30,60].map(lat=>Array.from({length:48},(_,i)=>spherePoint(lat,i*360/48,1.455))),[]);
  const meridians=useMemo(()=>[-120,-60,0,60,120,180].map(lon=>Array.from({length:33},(_,i)=>spherePoint(-90+i*180/32,lon,1.455))),[]);
  const selected=useMemo(()=>option<2?Array.from({length:48},(_,i)=>spherePoint(latitude,i*360/48,1.474)):Array.from({length:33},(_,i)=>spherePoint(-90+i*180/32,longitude,1.474)),[latitude,longitude,option]);
  const path=useMemo(()=>Array.from({length:24},(_,i)=>spherePoint(latitude*i/23,longitude*i/23,1.5)),[latitude,longitude]);
  // At the zero point use a short stationary curve rather than duplicate knots.
  const safePath=useMemo(()=>degrees===0?[spherePoint(0,0,1.5),spherePoint(0,.01,1.5)]:path,[degrees,path]);
  return <group><group position={[0,1.62,0]} rotation={[0,-longitude*Math.PI/180,0]}>
    <Globe small angle={-Math.PI/2}/>{parallels.map((points,i)=><GeoPath key={`lat-${i}`} points={points} closed width={i===2?.014:.006} color={i===2?'#e5c581':'#a4bec8'}/>)}
    {meridians.map((points,i)=><GeoPath key={`lon-${i}`} points={points} width={i===2?.013:.006} color={i===2?'#ebb595':'#a4bec8'}/>)}
    <GeoPath points={selected} closed={option<2} width={.017} color="#f5d788"/>
    <GeoMovingMarker points={safePath} motion={motion} color="#fff0bd" size={.08}/>
    <GeoPin props={props} position={spherePoint(latitude,longitude,1.47)} color="#efd17e" radius={.18}/>
  </group>
    <SceneLabel position={[0,3.16,0]}>目标：{['北纬','南纬','东经','西经'][option]} {degrees}°</SceneLabel>
    <SceneLabel position={[0,.1,2.48]}>赤道 0°纬度 · 零度经线 0°经度 · 想象的定位线</SceneLabel>
    <SceneLabel position={[2.05,1.45,0]}>{Math.abs(latitude)===90?'极点经线相会 · 经度不唯一':option<2?'沿零度经线定位':'纬度保持 0° · 转到目标一侧'}</SceneLabel>
  </group>;
}

function ContourMap({value,option,motion,props}:GeoProps) {
  const peak=value*100,height=useMemo(()=>(x:number,z:number)=>.12+peak*.0035*Math.exp(-(x*x+z*z)/1.56),[peak]);
  const contours=useMemo(()=>Array.from({length:Math.floor(peak/50)-1},(_,i)=>{const meters=(i+1)*50,radius=Math.sqrt(-Math.log(meters/peak)*1.56);return {meters,points:Array.from({length:64},(_,j)=>{const a=j*Math.PI/32;return [Math.cos(a)*radius,option===0?.125+meters*.0035:.137,Math.sin(a)*radius] as Point;})};}),[peak,option]);
  const material=useRef<ShaderMaterial>(null),uniforms=useMemo(()=>({uPeak:{value:peak},uProgress:{value:0}}),[peak]);
  useFrame(()=>{if(material.current)material.current.uniforms.uProgress.value=motion.current;});
  return <group><Sandbox/><GeoTerrain height={height} flat={option===1}/>
    {option===1&&<mesh position={[0,.132,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}><planeGeometry args={[5.3,4.1]}/><shaderMaterial ref={material} uniforms={uniforms}
      vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`uniform float uPeak;uniform float uProgress;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*vec2(5.3,4.1);float h=uPeak*exp(-dot(p,p)/1.56);float band=abs(fract(h/50.+.5)-.5);float line=1.-smoothstep(.017,.035,band);vec3 c=mix(vec3(.61,.72,.5),vec3(.83,.77,.55),h/uPeak);c=mix(c,vec3(.42,.29,.18),line*(.6+.4*uProgress));gl_FragColor=vec4(c,1.);}`}/></mesh>}
    {contours.map(({meters,points})=><GeoPath key={meters} points={points} closed width={meters%100===0?.014:.008} color={meters%100===0?'#806241':'#a0835a'}/>)}
    <GeoPin props={props} position={[0,option===0?height(0,0):.145,0]}/>
    {[100,200,300,400].filter(meters=>meters<peak).map(meters=>{const x=Math.sqrt(-Math.log(meters/peak)*1.56);return <SceneLabel key={meters} position={[x,option===0?.16+meters*.0035:.16,0]}>{meters} m</SceneLabel>;})}
    <SceneLabel position={[0,2.82,0]}>山顶 {peak} m · 每隔 50 m 画一条线（示意）</SceneLabel>
    <SceneLabel position={[0,.1,2.62]}>同一条线，海拔相同 · 不是距山顶相同</SceneLabel>
  </group>;
}

const mapVectors:Point[]=[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]];
function MapDirections({value,option,motion,props}:GeoProps) {
  const vector=mapVectors[option],points=useMemo(()=>Array.from({length:value+1},(_,i)=>[vector[0]*i*.5,.34,vector[2]*i*.5] as Point),[value,vector]);
  return <group><Sandbox/><Cube kind="paint" color="#b2c7ad" position={[0,.15,0]} scale={[5.25,.025,4.05]}/>
    {Array.from({length:9},(_,i)=>{const x=(i-4)*.5;return <group key={i}><Beam from={[x,.18,-2]} to={[x,.18,2]} color="#dde5d6" width={.008}/><Beam from={[-2,.18,x]} to={[2,.18,x]} color="#dde5d6" width={.008}/></group>;})}
    <Compass size={2.05} y={.195}/>
    <GeoPath points={points} color="#e9b570" width={.032} motion={motion} flow/><GeoMovingMarker points={points} motion={motion} color="#75b6c9" size={.12}/>
    <GeoPin props={props} position={points[points.length-1]} color="#f5d093"/>
    {[[0,.2,-2.3,'北'],[2.4,.2,0,'东'],[0,.2,2.3,'南'],[-2.4,.2,0,'西']].map(([x,y,z,name])=><SceneLabel key={String(name)} position={[Number(x),Number(y),Number(z)]}>{name}</SceneLabel>)}
    <SceneLabel position={[0,2.8,0]}>目标：{['向北','向东','向南','向西'][option]} {value} 格</SceneLabel>
    <SceneLabel position={[0,.1,2.9]}>先看指北箭头 · 北是地图北，和观察视角无关</SceneLabel>
  </group>;
}

const scenes={
  'earth-layers':EarthLayers,landforms:Landforms,'river-journey':RiverJourney,volcano:Volcano,
  'plate-motion':PlateMotion,'weather-map':WeatherMap,seasons:Seasons,'latitude-longitude':LatitudeLongitude,
  'contour-map':ContourMap,'map-directions':MapDirections,
};
export default function GeographyExperiments(props:SceneProps) {
  const motion=useExperimentMotion(props),experiment=getExperiment(props.lesson),Scene=scenes[props.lesson as keyof typeof scenes];
  const value=props.demo?(experiment?.targetValue??props.state.experimentValue):props.state.experimentValue;
  const option=props.demo?(experiment?.targetOption??props.state.experimentOption):props.state.experimentOption;
  return <ExperimentFrame props={props}>{Scene&&<Scene value={value} option={option} motion={motion} props={props}/>}</ExperimentFrame>;
}
