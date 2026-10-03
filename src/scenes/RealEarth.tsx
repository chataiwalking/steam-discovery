import { useTexture } from '@react-three/drei';
import { SRGBColorSpace, Vector2 } from 'three';
import { PhysicalMaterial } from './materials';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Mesh } from 'three';
import { Atmosphere } from './MathCoreEffects';

export default function Globe({ angle = 0, small = false, time }: { angle?: number; small?: boolean; time?: {current:number} }) {
  const cloudLayer=useRef<Mesh>(null);
  const normalScale=useMemo(()=>new Vector2(.28,.28),[]);
  useFrame(()=>{if(cloudLayer.current)cloudLayer.current.rotation.y=(time?.current??0)*.006;});
  const base = import.meta.env.BASE_URL;
  const [day, normal, ocean, clouds] = useTexture([
    `${base}textures/earth-day.jpg`, `${base}textures/earth-normal.jpg`,
    `${base}textures/earth-specular.jpg`, `${base}textures/earth-clouds.png`,
  ]);
  day.colorSpace = SRGBColorSpace;
  clouds.colorSpace = SRGBColorSpace;
  day.anisotropy = normal.anisotropy = 4;
  return <group rotation={[0, angle, 0]}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1.4, 80, 64]} />
      <meshPhysicalMaterial map={day} normalMap={normal} normalScale={normalScale}
        roughness={.9} metalness={0} clearcoat={.8} clearcoatMap={ocean} clearcoatRoughness={.2}
        envMapIntensity={.08} />
    </mesh>
    <mesh ref={cloudLayer}>
      <sphereGeometry args={[1.413, 64, 48]} />
      <meshStandardMaterial map={clouds} transparent opacity={.65} depthWrite={false}
        roughness={1} envMapIntensity={.08} />
    </mesh>
    <Atmosphere strength={small?.12:.22}/>
    {!small && <group position={[1.23, .77, 0]} rotation={[0, 0, -1.01]}>
      <mesh position={[0, .015, 0]} receiveShadow>
        <cylinderGeometry args={[.22, .23, .035, 40]} />
        <PhysicalMaterial kind="stone" color="#bab6a3" />
      </mesh>
      <mesh position={[0, .12, 0]} castShadow>
        <boxGeometry args={[.25, .21, .22]} />
        <PhysicalMaterial kind="stone" color="#dfd8bd" />
      </mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * .081, .264, 0]} rotation={[0, 0, side * .54]} castShadow>
        <boxGeometry args={[.19, .026, .29]} />
        <PhysicalMaterial kind="wood" color="#714936" />
      </mesh>)}
      <mesh position={[.052, .295, -.055]} castShadow>
        <boxGeometry args={[.042, .12, .048]} />
        <PhysicalMaterial kind="stone" color="#ad9f86" />
      </mesh>
      <mesh position={[-.059, .08, .112]}>
        <boxGeometry args={[.055, .13, .012]} />
        <PhysicalMaterial kind="wood" color="#4f4032" />
      </mesh>
      <mesh position={[.055, .139, .113]}>
        <boxGeometry args={[.07, .065, .013]} />
        <meshStandardMaterial color="#d0e5eb" emissive="#edb452" emissiveIntensity={.38} roughness={.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .04, 0]}>
        <ringGeometry args={[.233, .249, 48]} />
        <meshBasicMaterial color="#f0b766" toneMapped={false} />
      </mesh>
    </group>}
  </group>;
}
