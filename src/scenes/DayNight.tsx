import { Globe } from "./toyModels";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Rod, SceneLabel, useSceneClock, type SceneProps } from "./shared";

export default function DayNight(props: SceneProps) {
  const earth = useRef<Group>(null);
  const time = useSceneClock(props);
  useFrame(() => {
    if (earth.current)
      earth.current.rotation.y = props.demo
        ? time.current * 0.25
        : props.state.rotation;
  });
  return (
    <group>
      <ambientLight intensity={0.06} />
      <directionalLight position={[8, 0, 0]} intensity={3} />
      <group
        position={[-0.5, 1, 0]}
        ref={earth}
        onClick={(event) => {
          event.stopPropagation();
          props.onAction?.({ type: "rotate" });
        }}
      >
        <Globe />
      </group>
      <group position={[3.25, 1.55, 0.1]}>
        <mesh>
          <sphereGeometry args={[0.63, 32, 24]} />
          <meshBasicMaterial color="#ffd466" />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 5]}>
            <Rod
              color="#f8c354"
              position={[0, 0.93, 0]}
              scale={[0.035, 0.25, 0.035]}
            />
          </group>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, -0.65, 0]}>
        <ringGeometry args={[1.7, 1.725, 64]} />
        <meshBasicMaterial color="#d2c6a5" />
      </mesh>
      <Rod
        color="#e6deca"
        position={[-0.5, -0.86, 0]}
        scale={[1.9, 0.15, 1.9]}
      />
      <SceneLabel position={[-0.5, 3, 0]}>地球自转 · 找找小屋的白天</SceneLabel>
      <SceneLabel position={[3.3, 0.55, 0.1]} color="#976622">
        太阳
      </SceneLabel>
    </group>
  );
}
