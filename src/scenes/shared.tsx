import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, ExtrudeGeometry, Shape, type Group } from "three";
import type { WorldCanvasProps } from "../types";

export type SceneProps = WorldCanvasProps;
type MeshProps = ThreeElements["mesh"] & { color?: string; roughness?: number };

export function useSceneClock(props: SceneProps) {
  const time = useRef(0);
  useFrame((_, delta) => {
    if (props.paused) return;
    if (props.demo)
      time.current = props.narrationActive ? props.narrationTime : 0;
    else time.current += Math.min(delta, 0.06);
  });
  return time;
}

export function Ball({
  color = "#ffca70",
  roughness = 0.8,
  ...props
}: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}
export function Cube({ color = "#ffca70", ...props }: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
export function Rod({ color = "#ffca70", ...props }: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[1, 1, 1, 40]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
export function ToyPlatform({
  color = "#e6f1d0",
  radius = 3.7,
}: {
  color?: string;
  radius?: number;
}) {
  return (
    <group position={[0, -0.24, 0]}>
      <Rod color="#dcc6a4" scale={[radius, 0.36, radius]} />
      <Rod
        color={color}
        position={[0, 0.22, 0]}
        scale={[radius, 0.16, radius]}
      />
    </group>
  );
}
export function SceneLabel({
  children,
  position,
  color = "#43513d",
}: {
  children: React.ReactNode;
  position: [number, number, number];
  color?: string;
}) {
  return (
    <Html
      position={position}
      center
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "7px 12px",
          borderRadius: 16,
          background: "rgba(255,253,245,.93)",
          color,
          fontSize: 12,
          fontWeight: 750,
          boxShadow: "0 4px 16px #433b2010",
        }}
      >
        {children}
      </span>
    </Html>
  );
}
export function Cloud({
  position = [0, 0, 0],
  scale = 1,
  rain = false,
}: {
  position?: [number, number, number];
  scale?: number;
  rain?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      {[
        [-0.65, 0, 0, 0.58],
        [0, 0.23, 0, 0.8],
        [0.73, -0.02, 0, 0.58],
        [0.07, -0.17, 0.16, 0.61],
      ].map(([x, y, z, s], i) => (
        <Ball
          key={i}
          color={rain ? "#cfdee9" : "#fffef5"}
          position={[x, y, z]}
          scale={[s, s * 0.72, s * 0.64]}
        />
      ))}
    </group>
  );
}
export function Tree({
  position = [0, 0, 0],
  scale = 1,
  color = "#789d54",
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <Rod color="#b98d5e" position={[0, 0.38, 0]} scale={[0.09, 0.8, 0.09]} />
      <Ball color={color} position={[0, 1, 0]} scale={[0.46, 0.66, 0.43]} />
      <Ball color="#9cb96f" position={[0.21, 0.93, 0.1]} scale={0.29} />
    </group>
  );
}
export function Flower({
  position = [0, 0, 0],
  color = "#f4b856",
}: {
  position?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <Rod
        color="#8bad62"
        position={[0, 0.12, 0]}
        scale={[0.025, 0.24, 0.025]}
      />
      {Array.from({ length: 5 }, (_, i) => (
        <Ball
          key={i}
          color={color}
          scale={[0.08, 0.04, 0.12]}
          position={[
            Math.cos((i * Math.PI * 2) / 5) * 0.085,
            0.24,
            Math.sin((i * Math.PI * 2) / 5) * 0.085,
          ]}
        />
      ))}
      <Ball color="#fff4c4" scale={0.06} position={[0, 0.27, 0]} />
    </group>
  );
}
export function Gear({
  teeth = 12,
  radius = 1,
  color = "#edaf52",
  angle = 0,
}: {
  teeth?: number;
  radius?: number;
  color?: string;
  angle?: number;
}) {
  const geometry = useMemo(() => {
    const outline = new Shape();
    for (let i = 0; i < teeth * 4; i++) {
      const angle = ((i + 0.5) / (teeth * 4)) * Math.PI * 2;
      const r = radius + (i % 4 === 1 || i % 4 === 2 ? 0.095 : -0.095);
      const x = Math.cos(angle) * r,
        y = Math.sin(angle) * r;
      if (i === 0) outline.moveTo(x, y);
      else outline.lineTo(x, y);
    }
    outline.closePath();
    return new ExtrudeGeometry(outline, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.028,
      bevelSegments: 2,
      steps: 1,
    });
  }, [teeth, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, 0, angle]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.36, radius * 0.36, 0.08, 32]} />
        <meshStandardMaterial color={new Color(color).multiplyScalar(0.86)} />
      </mesh>
      <Rod
        color="#fff3d4"
        position={[0, 0, 0.35]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.12, 0.15, 0.12]}
      />
      <Cube
        color="#fff3d4"
        position={[radius * 0.56, 0, 0.31]}
        scale={[radius * 0.3, 0.1, 0.065]}
      />
    </group>
  );
}
export function WaterDrop({
  position = [0, 0, 0],
  scale = 1,
  color = "#65bcca",
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <Ball color={color} scale={[0.43, 0.48, 0.38]} />
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.37, 0.72, 32]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <Ball
        color="#f0ffff"
        position={[-0.13, 0.12, 0.32]}
        scale={[0.05, 0.12, 0.025]}
      />
    </group>
  );
}
export function Hover({
  children,
  props,
  height = 0.07,
  speed = 1,
}: {
  children: React.ReactNode;
  props: SceneProps;
  height?: number;
  speed?: number;
}) {
  const ref = useRef<Group>(null);
  const time = useSceneClock(props);
  useFrame(() => {
    if (ref.current)
      ref.current.position.y = Math.sin(time.current * speed) * height;
  });
  return <group ref={ref}>{children}</group>;
}
