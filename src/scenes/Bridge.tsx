import { BridgeModel, ToyCar } from "./toyModels";
import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  Ball,
  Cube,
  SceneLabel,
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
        0.846 + (running && !braces && deck ? Math.sin(elapsed * 8) * 0.026 : 0);
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
      <ToyPlatform radius={3.8} color="#b8bfba" />
      <Cube kind="stone" color="#77878a" position={[0, 0.02, 0]} scale={[7.05, 0.08, 4.25]} />
      <Cube kind="water" color="#507c87" position={[0, 0.09, 0]} scale={[6.96, 0.1, 4.16]} />
      {[-1.7, -0.9, 1.3, 2].map((x, i) => (
        <Cube
          key={i}
          kind="water" color="#b2c5c6"
          position={[x, 0.148, i % 2 ? 1.65 : -1.5]}
          scale={[0.65, 0.005, 0.015]}
        />
      ))}
      <group ref={bridge}>
        <BridgeModel deck={deck} pier={pier} braces={braces} />
      </group>
      <group
        ref={car}
        position={[-2.7, 0.846, 0]}
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.({ type: "bridge" });
        }}
      >
        <ToyCar />
      </group>
      {[-3.05, 3.05].map(x => (
        <group key={x}>
          <Cube kind="ground" color="#747765" position={[x, 0.16, -1.43]} scale={[0.85, 0.3, 0.8]} />
          <Ball kind="stone" color="#94978c" position={[x, 0.3, 1.4]} scale={[0.27, 0.22, 0.37]} />
          <Ball kind="stone" color="#7d827c" position={[x - 0.23, 0.24, 1.13]} scale={[0.18, 0.15, 0.27]} />
        </group>
      ))}
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
