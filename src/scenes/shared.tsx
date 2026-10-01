import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { SceneHtml as Html } from "../components/SceneHtml";
import { DoubleSide, ExtrudeGeometry, Path, Shape, type Group } from "three";
import { PhysicalMaterial, cloudTexture, type MaterialKind } from "./materials";
import type { WorldCanvasProps } from "../types";

export type SceneProps = WorldCanvasProps;
type MeshProps = ThreeElements["mesh"] & { color?: string; roughness?: number; kind?: MaterialKind };

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
  roughness,
  kind = "paint",
  ...props
}: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[1, 32, 24]} />
      <PhysicalMaterial kind={kind} color={color} roughness={roughness} />
    </mesh>
  );
}
export function Cube({ color = "#c9c8bc", kind = "paint", roughness, ...props }: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <PhysicalMaterial kind={kind} color={color} roughness={roughness} />
    </mesh>
  );
}
export function Rod({ color = "#c9c8bc", kind = "paint", roughness, ...props }: MeshProps) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[1, 1, 1, 40]} />
      <PhysicalMaterial kind={kind} color={color} roughness={roughness} />
    </mesh>
  );
}
export function ToyPlatform({
  color = "#bcc2c1",
  radius = 3.7,
}: {
  color?: string;
  radius?: number;
}) {
  return (
    <group position={[0, -0.24, 0]}>
      <Rod kind="metal" color="#303b43" scale={[radius, 0.22, radius]} />
      <Rod
        color={color}
        kind="stone"
        position={[0, 0.15, 0]}
        scale={[radius - 0.04, 0.09, radius - 0.04]}
      />
    </group>
  );
}
export function SceneLabel({
  children,
  position,
  color = "#dbe6ec",
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
          borderRadius: 6,
          background: "rgba(24,38,50,.91)",
          border: "1px solid rgba(191,214,226,.22)",
          color,
          fontSize: 12,
          fontWeight: 750,
          boxShadow: "0 4px 16px #0d18242b",
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
  const texture = cloudTexture();
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[(i % 3 - 1) * .48, Math.sin(i * 2.4) * .2, (i / 3 - 1) * .22]}
          rotation={[0, .42, (i - 3) * .045]}>
          <planeGeometry args={[1.9, 1.02]} />
          <meshStandardMaterial map={texture} transparent opacity={.59} depthWrite={false}
            color={rain ? "#a9bac6" : "#f0f3f4"} roughness={1} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export function Tree({
  position = [0, 0, 0],
  scale = 1,
  color = "#456242",
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <Rod kind="wood" color="#635343" position={[0, 0.58, 0]} scale={[0.047, 1.16, 0.047]} />
      {Array.from({ length: 7 }, (_, level) => (
        <group key={level} position={[0, .37 + level * .145, 0]} rotation={[0, level * 1.36, 0]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[.36 - level * .041, .43, 9, 1]} />
            <PhysicalMaterial kind="ground" color={color} />
          </mesh>
          {[0, 1, 2].map(i => <mesh key={i} rotation={[.52, i * 2.09, .25]} position={[.08, -.08, .03]} castShadow>
            <coneGeometry args={[.12 - level * .012, .3, 5]} />
            <PhysicalMaterial kind="ground" color={i % 2 ? "#415c42" : "#566a47"} />
          </mesh>)}
        </group>
      ))}
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
    const bore = new Path();
    bore.absarc(0, 0, radius * .18, 0, Math.PI * 2, true);
    outline.holes.push(bore);
    // Machined relief holes make the plate thickness and metal reflections legible.
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const relief = new Path();
      relief.absarc(Math.cos(a) * radius * .54, Math.sin(a) * radius * .54, radius * .115, 0, Math.PI * 2, true);
      outline.holes.push(relief);
    }
    return new ExtrudeGeometry(outline, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.015,
      bevelSegments: 2,
      steps: 1,
    });
  }, [teeth, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, 0, angle]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <PhysicalMaterial kind="metal" color="#adb8bd" roughness={.24} />
      </mesh>
      <mesh position={[0, 0, .29]}>
        <torusGeometry args={[radius * .23, .04, 10, 48]} />
        <PhysicalMaterial kind="metal" color="#666e72" roughness={.2} />
      </mesh>
      <Rod kind="metal" color="#454f57" position={[0, 0, .23]} rotation={[Math.PI / 2, 0, 0]}
        scale={[radius * .1, .65, radius * .1]} />
      <Cube color={color} position={[radius * .76, 0, .284]} scale={[radius * .12, .045, .009]} />
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
