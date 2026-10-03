import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DynamicDrawUsage, Float32BufferAttribute, Group, InstancedMesh, Object3D, PlaneGeometry } from 'three';
import { Cloud, Cube, Rod, Tree, SceneLabel, useSceneClock, type SceneProps } from './shared';
import { PhysicalMaterial, surfaceTexture } from './materials';
import { Atmosphere, FocusTarget, WaterRipples, damping } from './MathCoreEffects';

function terrainHeight(x: number, z: number) {
  const lakeDistance = Math.sqrt(((x + .65) / 2.1) ** 2 + ((z - .35) / 1.22) ** 2);
  const shore = Math.max(-.03, Math.min(.28, (lakeDistance - .88) * .5));
  const mountain = Math.exp(-((x - 1.15) ** 2 / 2.4 + (z + 1.45) ** 2 / .42)) * 1.35
    + Math.exp(-((x + 1.25) ** 2 / .9 + (z + 1.7) ** 2 / .24)) * .72;
  const detail = (Math.sin(x * 11 + z * 5) * Math.cos(z * 8) * .035 + Math.sin(x * 27 - z * 19) * .017) * Math.min(1, Math.max(0, lakeDistance - .8));
  return shore + mountain * (.8 + Math.sin(x * 5 + z * 4) * .16) + detail;
}
function Landscape() {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(6.5, 4.6, 96, 68);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const colors = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = terrainHeight(x, z);
      p.setY(i, h);
      const slope = Math.abs(terrainHeight(x + .045, z) - h) + Math.abs(terrainHeight(x, z + .045) - h);
      const color = new Color(h > .72 || slope > .06 ? '#777d75' : h < .13 ? '#c3b99b' : '#69765b');
      color.multiplyScalar(.9 + Math.sin(x * 23 + z * 12) * .07);
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group>
    <Cube kind="stone" color="#747c77" position={[0, -.16, 0]} scale={[6.5, .28, 4.6]} />
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={.96} map={surfaceTexture('ground')}
        bumpMap={surfaceTexture('stone')} bumpScale={.07} />
    </mesh>
    <Cube kind="metal" color="#3f4e55" position={[0, -.34, 0]} scale={[6.65, .085, 4.75]} />
  </group>;
}

export default function WaterCycle(props: SceneProps) {
  const drops = useRef<InstancedMesh>(null), cloud = useRef<Group>(null);
  const particle = useMemo(()=>new Object3D(),[]);
  const time = useSceneClock(props);
  const waterMap = useMemo(() => {
    const texture = surfaceTexture('water').clone(); texture.needsUpdate = true; return texture;
  }, []);
  useEffect(() => () => waterMap.dispose(), [waterMap]);
  const stage = props.demo ? props.narrationActive ? Math.min(3, Math.floor(props.narrationTime / 3)) : 0 : props.state.waterStage;
  useFrame((_,delta) => {
    waterMap.offset.set(time.current * .012, time.current * .007);
    if(cloud.current&&!props.paused)cloud.current.scale.setScalar(cloud.current.scale.x+((stage>=2?1.2:.85)-cloud.current.scale.x)*damping(delta,5));
    if (!drops.current) return;
    const count=stage===1?10:20;
    drops.current.instanceMatrix.setUsage(DynamicDrawUsage);
    for(let i=0;i<count;i++) {
      const progress = (time.current * (stage === 1 ? .23 : .75) + i / 20) % 1;
      particle.position.set(stage===1?-1.6+Math.sin(progress*Math.PI)*.25:-.1+(i%5)*.29,stage===1?.3+progress*2.5:2.9-progress*2.75,-.15+(i%4)*.23);
      particle.scale.set(stage===1?1:.45,stage===1?1:2.9,stage===1?1:.45);
      particle.updateMatrix();drops.current.setMatrixAt(i,particle.matrix);
    }
    drops.current.instanceMatrix.needsUpdate=true;
  });
  return <group>
    <Landscape />
    <FocusTarget paused={props.paused} enabled={!props.demo} radius={2.12} onActivate={()=>props.onAction?.({type:'water',stage:0})}>
      <mesh position={[-.65, .1, .35]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.02, 1.15, 1]} receiveShadow>
        <circleGeometry args={[1, 100]} />
        <meshPhysicalMaterial color="#315c63" roughness={.13} metalness={.16} clearcoat={1}
          clearcoatRoughness={.07} envMapIntensity={1.1} bumpMap={waterMap} bumpScale={.045} />
      </mesh>
    </FocusTarget>
    <WaterRipples props={props} position={[-.65,.107,.35]} scale={[2.02,1.15,1]} rain={stage===3}/>
    <FocusTarget paused={props.paused} enabled={!props.demo} radius={.5} position={[-2.4, 3.3, -.7]} onActivate={()=>props.onAction?.({type:'water',stage:1})}>
      <mesh><sphereGeometry args={[.39, 40, 32]} /><meshBasicMaterial color="#ffe2a1" /></mesh>
      <Atmosphere radius={.43} color="#ffc16c" strength={.3}/>
    </FocusTarget>
    <group ref={cloud} position={[.55,3,-.3]} scale={.85}>
      <FocusTarget paused={props.paused} enabled={!props.demo} radius={.85} onActivate={()=>props.onAction?.({type:'water',stage:stage===2?3:2})}>
      <Cloud rain={stage === 3} />
      </FocusTarget>
    </group>
    <instancedMesh ref={drops} key={stage===1?'vapor':'rain'} args={[undefined,undefined,stage===1?10:20]} visible={stage === 1 || stage === 3} raycast={()=>null} frustumCulled={false}>
      <sphereGeometry args={[.024,8,6]}/><meshBasicMaterial color={stage===1?'#d8a452':'#9dc9d1'} transparent opacity={stage===1?.85:.7}/>
    </instancedMesh>
    <Tree position={[2.45, .23, .2]} scale={1.05} />
    <Tree position={[2.55, .3, -1.2]} scale={.78} />
    <Tree position={[1.95, .27, 1.2]} scale={.61} />
    {[[-2.7, .19, .9, .21], [1.75, .2, 1.38, .33], [2.33, .3, -.5, .24], [-1.6, .27, 1.8, .24]].map(([x,y,z,s], i) =>
      <mesh key={i} position={[x,y,z]} rotation={[i*.43,i*.97,.2]} scale={[s,s*.7,s*.86]} castShadow>
        <icosahedronGeometry args={[1, 1]} /><PhysicalMaterial kind="stone" color="#9b9d90" />
      </mesh>)}
    <Rod kind="metal" color="#768a90" position={[-3.02, .05, 1.8]} scale={[.018,.25,.018]} />
    <SceneLabel position={[-.8, -.1, 2.65]}>
      {['小水滴在这里', '蒸发 ↑ 水变成水蒸气', '凝结 · 小水滴聚成云', '降雨 ↓ 水回到地面'][stage]}
    </SceneLabel>
    {stage === 1 && <SceneLabel position={[-2.3, 2, .4]} color="#b9dae5">小点只表示路径 · 水蒸气看不见</SceneLabel>}
  </group>;
}
