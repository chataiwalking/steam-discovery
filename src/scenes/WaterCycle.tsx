import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Float32BufferAttribute, Group, InstancedMesh, Object3D, PlaneGeometry } from 'three';
import { Cloud, Cube, Rod, Tree, SceneLabel, useSceneClock, type SceneProps } from './shared';
import { PhysicalMaterial, surfaceTexture } from './materials';
import { Atmosphere, FocusTarget, damping } from './MathCoreEffects';

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

// Uncorrelated travel phases keep the falling rain spread under the cloud.
const tracks = Array.from({ length: 42 }, (_, i) => ({
  angle: i * 2.39996,
  phase: ((i + 11) * (i + 37) % 101) / 101,
  radius: .2 + .6 * ((i * 23) % 41) / 41,
}));

export default function WaterCycle(props: SceneProps) {
  const drops = useRef<InstancedMesh>(null), cloud = useRef<Group>(null);
  const splashes = useRef<InstancedMesh>(null);
  const particle = useMemo(()=>new Object3D(),[]);
  const time = useSceneClock(props);
  const waterMap = useMemo(() => {
    const texture = surfaceTexture('water').clone(); texture.needsUpdate = true; return texture;
  }, []);
  useEffect(() => () => waterMap.dispose(), [waterMap]);
  const stage = props.demo ? props.narrationActive ? Math.min(3, Math.floor(props.narrationTime / 3)) : 0 : props.state.waterStage;
  useFrame((_,delta) => {
    waterMap.offset.set(time.current * .012, time.current * .007);
    const cloudSize = stage >= 2 ? 1.18 : .72;
    if (cloud.current) {
      const blend = props.paused ? 1 : damping(delta, 5);
      cloud.current.scale.setScalar(cloud.current.scale.x + (cloudSize - cloud.current.scale.x) * blend);
    }
    if (!drops.current || stage === 0) return;
    for (let i = 0; i < drops.current.count; i++) {
      const { angle: lane, phase, radius } = tracks[i];
      const progress = (time.current * (stage === 3 ? .79 : .31) + phase) % 1;
      const sway = Math.sin(lane + progress * 4);
      const fade = .25 + .75 * Math.sin(Math.PI * progress);
      if (stage === 1) {
        // Invisible vapour is represented by small tracers drifting from lake to cloud.
        particle.position.set(-1.35 + 1.9 * progress + .34 * sway, .15 + 2.7 * progress, .4 + .3 * Math.cos(lane) - .65 * progress);
        particle.scale.setScalar(.72 * fade);
      } else if (stage === 2) {
        const radius = 1.4 - .98 * progress;
        particle.position.set(.55 + radius * Math.cos(lane), 2.35 + .53 * progress + .22 * sway, -.3 + radius * .46 * Math.sin(lane));
        particle.scale.setScalar((.38 + progress) * fade);
      } else {
        particle.position.set(.20 + radius * Math.cos(lane) - progress * .22, 2.72 - 2.6 * progress, -.13 + radius * .67 * Math.sin(lane));
        particle.scale.set(.34 * fade, 2.55 * fade, .34 * fade);
      }
      particle.rotation.set(0, 0, 0);
      particle.updateMatrix();
      drops.current.setMatrixAt(i, particle.matrix);
      if (stage === 3 && splashes.current) {
        // The previous drop just landed here when this track wraps back to the cloud.
        const r = progress < .36 ? .22 * progress / .36 : 0;
        particle.position.set(-.02 + radius * Math.cos(lane), .112, -.13 + radius * .67 * Math.sin(lane));
        particle.rotation.x = -Math.PI / 2;
        particle.scale.setScalar(r);
        particle.updateMatrix();
        splashes.current.setMatrixAt(i, particle.matrix);
      }
    }
    drops.current.instanceMatrix.needsUpdate = true;
    if (stage === 3 && splashes.current) splashes.current.instanceMatrix.needsUpdate = true;
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
    <instancedMesh ref={splashes} args={[undefined, undefined, tracks.length]} visible={stage === 3} raycast={() => null} frustumCulled={false}>
      <ringGeometry args={[.89, 1, 20]} />
      <meshBasicMaterial color="#b4e7e9" transparent opacity={.64} depthWrite={false} />
    </instancedMesh>
    <FocusTarget paused={props.paused} enabled={!props.demo} radius={.5} position={[-2.4, 3.3, -.7]} onActivate={()=>props.onAction?.({type:'water',stage:1})}>
      <mesh><sphereGeometry args={[.39, 40, 32]} /><meshBasicMaterial color="#ffe2a1" /></mesh>
      <Atmosphere radius={.43} color="#ffc16c" strength={.3}/>
    </FocusTarget>
    <group name="study:profile" ref={cloud} position={[.55,3,-.3]} scale={.85}>
      <FocusTarget paused={props.paused} enabled={!props.demo} radius={.85} onActivate={()=>props.onAction?.({type:'water',stage:stage===2?3:2})}>
      <Cloud rain={stage === 3} />
      </FocusTarget>
    </group>
    <instancedMesh ref={drops} args={[undefined,undefined,tracks.length]} visible={stage > 0} raycast={()=>null} frustumCulled={false}>
      <sphereGeometry args={[.044,8,6]}/><meshBasicMaterial color={stage===1?'#ffcc74':stage===2?'#edfaff':'#47aacd'} transparent opacity={.86}/>
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
