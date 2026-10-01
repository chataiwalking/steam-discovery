import Globe from './RealEarth';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Rod, SceneLabel, useSceneClock, type SceneProps } from './shared';

export default function DayNight(props: SceneProps) {
  const earth = useRef<Group>(null);
  const time = useSceneClock(props);
  useFrame(() => {
    if (earth.current) earth.current.rotation.y = props.demo ? time.current * .25 : props.state.rotation;
  });
  return <group>
    <ambientLight intensity={.025} />
    <directionalLight position={[8, 0, 0]} intensity={3.4} />
    <group position={[-.5, 1, 0]} ref={earth} onClick={event => {
      event.stopPropagation(); props.onAction?.({ type: 'rotate' });
    }}><Globe /></group>
    <group position={[3.25, 1.55, .1]}>
      <mesh>
        <sphereGeometry args={[.63, 48, 32]} />
        <shaderMaterial toneMapped={false}
          vertexShader={`varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
          fragmentShader={`varying vec3 vN; varying vec3 vP;
            float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
            void main(){float grain=hash(floor(vP*230.)); float limb=pow(abs(vN.z),.3);
              vec3 c=mix(vec3(.94,.36,.035),vec3(1.,.87,.49),limb);
              gl_FragColor=vec4(c*(.88+grain*.12),1.);}`}
        />
      </mesh>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-.5, -.64, 0]}>
      <ringGeometry args={[1.7, 1.712, 96]} />
      <meshBasicMaterial color="#7e969f" />
    </mesh>
    <Rod kind="metal" color="#48545b" position={[-.5, -.86, 0]} scale={[1.9, .1, 1.9]} />
    <SceneLabel position={[-.5, 3, 0]}>地球自转 · 找找小屋的白天</SceneLabel>
    <SceneLabel position={[3.3, .55, .1]} color="#f2c578">太阳</SceneLabel>
  </group>;
}
