import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  Ball,
  Cloud,
  Rod,
  Tree,
  WaterDrop,
  SceneLabel,
  ToyPlatform,
  useSceneClock,
  type SceneProps,
} from "./shared";

export default function WaterCycle(props: SceneProps) {
  const drops = useRef<Group>(null);
  const time = useSceneClock(props);
  const stage = props.demo
    ? props.narrationActive
      ? Math.min(3, Math.floor(props.narrationTime / 3))
      : 0
    : props.state.waterStage;
  useFrame(() => {
    if (!drops.current) return;
    drops.current.children.forEach((child, i) => {
      const progress = (time.current * 0.42 + i / 10) % 1;
      child.position.y =
        stage === 1 ? 0.25 + progress * 2.45 : 2.7 - progress * 2.45;
      child.position.x =
        stage === 1
          ? -1.4 + Math.sin(progress * Math.PI) * 0.22 + (i % 3) * 0.28
          : 0.4 + (i % 4) * 0.4;
    });
  });
  return (
    <group>
      <ToyPlatform radius={3.6} />
      <Rod
        color="#72bdc7"
        position={[-0.8, 0.04, 0.2]}
        scale={[2.3, 0.08, 1.65]}
      />
      <Rod
        color="#91d2d6"
        position={[-0.8, 0.09, 0.2]}
        scale={[2, 0.015, 1.45]}
      />
      {[0.45, 0.8, 1.2].map((r, i) => (
        <mesh
          key={i}
          position={[-0.8, 0.11 + i * 0.002, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r, r + 0.018, 64]} />
          <meshBasicMaterial color="#c6eded" />
        </mesh>
      ))}
      <group
        position={[-2.4, 3.3, -0.7]}
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "water", stage: 1 });
        }}
      >
        <Ball color="#ffcf69" scale={0.48} />
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} rotation={[0, 0, (Math.PI * i) / 4]}>
            <Rod
              color="#ffcf69"
              position={[0, 0.68, 0]}
              scale={[0.022, 0.2, 0.022]}
            />
          </group>
        ))}
      </group>
      <group
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "water", stage: stage === 2 ? 3 : 2 });
        }}
      >
        <Cloud
          position={[0.8, 3, -0.3]}
          scale={stage >= 2 ? 1.05 : 0.82}
          rain={stage === 3}
        />
      </group>
      <group ref={drops} visible={stage === 1 || stage === 3}>
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i} position={[0, 0, 0.3 + (i % 3) * 0.35]}>
            {stage === 1 ? (
              <Ball color="#f0ffff" scale={0.065} />
            ) : (
              <WaterDrop scale={0.14} />
            )}
          </group>
        ))}
      </group>
      <group
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "water", stage: 0 });
        }}
      >
        <WaterDrop position={[-0.9, 0.5, 1.5]} scale={0.64} />
      </group>
      <Tree position={[2.3, 0.03, 0.3]} scale={1.05} />
      <Tree position={[2.3, 0.03, -1.2]} scale={0.7} />
      <Tree position={[1.3, 0.03, -2]} scale={0.55} color="#aac27d" />
      <Ball
        color="#d0c6a6"
        position={[2.1, 0.19, 1.4]}
        scale={[0.35, 0.19, 0.24]}
      />
      <SceneLabel position={[-0.8, -0.1, 2.65]}>
        {
          [
            "小水滴在这里",
            "蒸发 ↑ 水变成水蒸气",
            "凝结 · 小水滴聚成云",
            "降雨 ↓ 水回到地面",
          ][stage]
        }
      </SceneLabel>
      {stage === 1 && (
        <SceneLabel position={[-2.3, 2, 0.4]} color="#668b94">
          小点只表示路径 · 水蒸气看不见
        </SceneLabel>
      )}
    </group>
  );
}
