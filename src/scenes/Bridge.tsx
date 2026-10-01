import { BridgeModel, ToyCar } from "./toyModels";
import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  Ball,
  Cube,
  Rod,
  SceneLabel,
  Tree,
  ToyPlatform,
  useSceneClock,
  type SceneProps,
} from "./shared";

export default function Bridge(props: SceneProps) {
  const car = useRef<Group>(null),
    bridge = useRef<Group>(null);
  const time = useSceneClock(props),
    started = useRef(0),
    reportedRun = useRef(0);
  const deck = props.demo || props.state.deck;
  const pier = props.demo || props.state.pier;
  const braces = props.demo || props.state.braces;
  useLayoutEffect(() => {
    started.current = time.current;
    if (props.state.carRun === 0) reportedRun.current = 0;
  }, [props.state.carRun, props.demo, time]);
  useFrame(() => {
    const elapsed = Math.max(
      0,
      props.demo ? time.current : time.current - started.current,
    );
    const hasRun = props.demo ? props.narrationActive : props.state.carRun > 0;
    const running = hasRun && elapsed < 5;
    if (car.current) {
      car.current.position.x =
        hasRun && deck ? -3 + Math.min(1, elapsed / 5) * 6 : -2.7;
      car.current.position.y =
        0.94 + (running && !braces && deck ? Math.sin(elapsed * 8) * 0.026 : 0);
    }
    if (bridge.current)
      bridge.current.rotation.z =
        running && !braces ? Math.sin(elapsed * 8) * 0.005 : 0;
    if (
      !props.demo &&
      !props.paused &&
      deck &&
      car.current &&
      props.state.carRun > 0 &&
      elapsed >= 5 &&
      reportedRun.current !== props.state.carRun
    ) {
      reportedRun.current = props.state.carRun;
      props.onAction?.({ type: "bridge-finished", runId: props.state.carRun });
    }
  });
  return (
    <group>
      <ToyPlatform radius={3.8} color="#c4d799" />
      <Rod color="#81c1c9" position={[0, 0.03, 0]} scale={[3.55, 0.07, 2.15]} />
      {[-1.7, -0.9, 1.3, 2].map((x, i) => (
        <Cube
          key={i}
          color="#b5dedc"
          position={[x, 0.081, i % 2 ? 1.65 : -1.5]}
          scale={[0.65, 0.008, 0.025]}
        />
      ))}
      <group ref={bridge}>
        <BridgeModel deck={deck} pier={pier} braces={braces} />
      </group>
      <group
        ref={car}
        position={[-2.7, 0.94, 0]}
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "bridge" });
        }}
      >
        <ToyCar />
      </group>
      <Tree position={[-2.5, 0.1, -1.8]} scale={0.8} />
      <Tree position={[2.9, 0.1, -1.5]} scale={0.65} />
      <Ball
        color="#d5c8a6"
        position={[-2.8, 0.23, 1.35]}
        scale={[0.3, 0.22, 0.2]}
      />
      <SceneLabel position={[0, 2.1, -0.2]}>
        {!deck
          ? "铺上桥面，让两岸连起来"
          : braces
            ? "三角形斜撑 · 连接更稳定"
            : pier
              ? "桥墩把长跨度分成两段"
              : "小桥已经连起来啦"}
      </SceneLabel>
    </group>
  );
}
