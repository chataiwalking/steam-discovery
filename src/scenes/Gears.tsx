import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  Cube,
  Gear,
  Rod,
  SceneLabel,
  ToyPlatform,
  useSceneClock,
  type SceneProps,
} from "./shared";

export default function Gears(props: SceneProps) {
  const left = useRef<Group>(null),
    right = useRef<Group>(null);
  const time = useSceneClock(props),
    phase = useRef(0),
    previous = useRef(0);
  const rightRadius = props.state.gearTeeth / 12;
  const leftX = -rightRadius,
    rightX = 1;
  useFrame(() => {
    const dt = Math.max(0, Math.min(0.08, time.current - previous.current));
    previous.current = time.current;
    if ((props.state.gearRunning || props.demo) && !props.paused) {
      if (props.demo)
        phase.current = time.current * 0.65 * props.state.gearDirection;
      else phase.current += dt * 0.65 * props.state.gearDirection;
    }
    if (left.current) left.current.rotation.z = phase.current;
    if (right.current)
      right.current.rotation.z =
        -phase.current / rightRadius + Math.PI / props.state.gearTeeth;
  });
  return (
    <group>
      <ToyPlatform color="#f4dec1" radius={3.7} />
      <group
        position={[0, 2.1, 0]}
        rotation={[-0.12, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "gear" });
        }}
      >
        <Cube
          color="#f8ebd8"
          position={[0, 0, -0.38]}
          scale={[6.5, 4.3, 0.25]}
        />
        <Cube
          color="#dec9a7"
          position={[0, -2.05, -0.25]}
          scale={[6.5, 0.2, 0.8]}
        />
        <group position={[leftX, 0, 0]} ref={left}>
          <Gear teeth={12} radius={1} color="#edaf52" />
        </group>
        <group position={[rightX, 0, 0]} ref={right}>
          <Gear
            teeth={props.state.gearTeeth}
            radius={rightRadius}
            color="#71ac99"
          />
        </group>
        {[leftX, rightX].map((x, i) => (
          <Rod
            key={i}
            color="#a37552"
            position={[x, 0, 0.49]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.13, 0.23, 0.13]}
          />
        ))}
      </group>
      <SceneLabel position={[leftX, 0.33, 0.95]} color="#a66e25">
        12 齿
      </SceneLabel>
      <SceneLabel position={[rightX, 0.33, 0.95]} color="#417c6b">
        {props.state.gearTeeth} 齿
      </SceneLabel>
      <SceneLabel position={[0, 4.55, 0]}>相邻齿轮 · 总是反着转</SceneLabel>
    </group>
  );
}
