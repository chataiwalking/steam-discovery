import { RoundedBox } from "@react-three/drei";
import type { ShapeKind } from "../types";
import { Ball, Cube, Rod } from "./shared";
import { PhysicalMaterial } from "./materials";

export { default as Globe } from "./RealEarth";

function Bolt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.047, 0.047, 0.026, 6]} />
        <PhysicalMaterial kind="metal" color="#b8bfc0" />
      </mesh>
      <Rod kind="metal" color="#737b7e" scale={[0.065, 0.012, 0.065]} position={[0, -0.015, 0]} />
    </group>
  );
}

/** A small die-cast car: painted shell, window glass, rubber and steel wheels. */
export function ToyCar({ color = "#9e382c" }: { color?: string }) {
  return (
    <group>
      <RoundedBox args={[0.78, 0.21, 0.4]} radius={0.048} smoothness={2} position={[0, 0.26, 0]} castShadow>
        <PhysicalMaterial kind="paint" color={color} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.37, 0.22, 0.34]} radius={0.03} smoothness={2} position={[-0.045, 0.45, 0]} castShadow>
        <PhysicalMaterial kind="glass" color="#789aa4" />
      </RoundedBox>
      <Cube kind="paint" color={color} position={[-0.04, 0.57, 0]} scale={[0.36, 0.026, 0.35]} />
      {[-0.23, 0.14].map(x => <Cube key={x} kind="metal" color="#47545c" position={[x, 0.46, 0]} scale={[0.025, 0.2, 0.35]} />)}
      {[-0.39, 0.39].map(x => <Cube key={x} kind="metal" color="#bcc5c7" position={[x, 0.2, 0]} scale={[0.035, 0.055, 0.38]} />)}
      {[-0.125, 0.125].map(z => (
        <group key={z}>
          <Cube kind="glass" color="#ece8cf" position={[0.4, 0.3, z]} scale={[0.015, 0.062, 0.09]} />
          <Cube kind="paint" color="#ab151c" position={[-0.4, 0.3, z]} scale={[0.015, 0.05, 0.08]} />
        </group>
      ))}
      {[-0.24, 0.24].flatMap(x => [-0.215, 0.215].map(z => (
        <group key={`${x}-${z}`} position={[x, 0.15, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.124, 0.124, 0.078, 24]} />
            <meshStandardMaterial color="#171b1d" roughness={0.94} />
          </mesh>
          <Rod kind="metal" color="#a2adb2" position={[0, z > 0 ? -0.041 : 0.041, 0]} scale={[0.071, 0.012, 0.071]} />
          <Rod kind="metal" color="#313a41" position={[0, z > 0 ? -0.05 : 0.05, 0]} scale={[0.025, 0.02, 0.025]} />
        </group>
      )))}
    </group>
  );
}

/** Timber decking and trusses with concrete abutments and visible fasteners. */
export function BridgeModel({ deck = true, pier = true, braces = true }: { deck?: boolean; pier?: boolean; braces?: boolean }) {
  return (
    <group>
      {[-2.65, 2.65].map(x => (
        <group key={x}>
          <Cube kind="stone" color="#a4a69c" position={[x, 0.35, 0]} scale={[1.35, 0.7, 1.8]} />
          <Cube kind="ground" color="#777865" position={[x, 0.76, 0]} scale={[1.42, 0.1, 1.9]} />
          <Cube kind="stone" color="#858981" position={[x, 0.15, 0.93]} scale={[1.42, 0.24, 0.16]} />
        </group>
      ))}
      {deck && (
        <group>
          {[-0.53, 0.53].map(z => <Cube key={z} kind="wood" color="#806345" position={[0, 0.63, z]} scale={[4.8, 0.19, 0.19]} />)}
          {Array.from({ length: 15 }, (_, i) => (
            <Cube key={i} kind="wood" color={i % 3 === 0 ? "#a7845b" : "#b39267"} position={[-2.24 + i * 0.32, 0.8, 0]} scale={[0.305, 0.14, 1.4]} />
          ))}
          {[-0.75, 0.75].map(z => (
            <group key={z}>
              <Cube kind="wood" color="#947047" position={[0, 1.41, z]} scale={[4.85, 0.13, 0.13]} />
              {[-2.2, -1.1, 0, 1.1, 2.2].map(x => (
                <group key={x}>
                  <Cube kind="wood" color="#a5865e" position={[x, 1.08, z]} scale={[0.13, 0.7, 0.13]} />
                  <Cube kind="metal" color="#626e70" position={[x, 0.87, z]} scale={[0.16, 0.16, 0.16]} />
                  <Bolt position={[x, 1.38, z + (z < 0 ? -0.08 : 0.08)]} />
                </group>
              ))}
            </group>
          ))}
        </group>
      )}
      {pier && (
        <group>
          {[-0.47, 0.47].map(z => <Cube key={z} kind="stone" color="#a1a39d" position={[0, 0.37, z]} scale={[0.28, 0.7, 0.3]} />)}
          <Cube kind="stone" color="#8d918b" position={[0, 0.04, 0]} scale={[0.82, 0.15, 1.5]} />
          <Cube kind="metal" color="#606b6e" position={[0, 0.69, 0]} scale={[0.45, 0.09, 1.35]} />
        </group>
      )}
      {braces && [-0.78, 0.78].map(z => (
        <group key={z}>
          {[-1, 1].map(direction => (
            <group key={direction}>
              <Cube kind="wood" color="#92714c" position={[direction * 1.1, 1.11, z]} rotation={[0, 0, direction * 0.24]} scale={[2.26, 0.115, 0.12]} />
              <Bolt position={[direction * 2.18, 1.37, z + (z < 0 ? -0.075 : 0.075)]} />
              <Bolt position={[0, 0.86, z + (z < 0 ? -0.075 : 0.075)]} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Adjustable optical bench projector, pointing towards negative Z. */
export function Lamp({ color, lit = true }: { color: string; lit?: boolean }) {
  return (
    <group>
      <Cube kind="metal" color="#26323a" position={[0, 0.09, 0]} scale={[0.63, 0.12, 0.59]} />
      <Rod kind="metal" color="#afb9bf" position={[0, 0.44, 0]} scale={[0.05, 0.66, 0.05]} />
      <Rod kind="metal" color="#33434c" position={[0, 0.44, 0]} scale={[0.1, 0.12, 0.1]} />
      <Rod kind="metal" color="#b5bec1" position={[0.13, 0.44, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.045, 0.15, 0.045]} />
      <group position={[0, 0.93, 0]} rotation={[0.32, 0, 0]}>
        <Rod kind="metal" color="#374651" scale={[0.245, 0.53, 0.245]} rotation={[Math.PI / 2, 0, 0]} />
        {[-0.16, -0.07, 0.04, 0.15].map(z => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.024, 32]} />
            <PhysicalMaterial kind="metal" color="#1c2c33" />
          </mesh>
        ))}
        <Rod kind="metal" color="#aeb5b6" position={[0, 0, -0.29]} scale={[0.265, 0.065, 0.265]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh position={[0, 0, -0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.213, 0.213, 0.021, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.09} metalness={0.05} clearcoat={1} emissive={lit ? color : "#000000"} emissiveIntensity={lit ? 1.25 : 0} />
        </mesh>
        <Cube kind="paint" color={color} position={[0, 0.25, 0.09]} scale={[0.12, 0.015, 0.11]} />
      </group>
    </group>
  );
}

export const shapeColors = { sphere: "#a5b1b4", cube: "#a27c52", cylinder: "#83a6a9" };
export function ShapeToy({ kind, size = 0.48 }: { kind: ShapeKind; size?: number }) {
  if (kind === "sphere") return <Ball kind="metal" color={shapeColors[kind]} roughness={0.2} scale={size} />;
  if (kind === "cube") return (
    <RoundedBox args={[size * 1.7, size * 1.7, size * 1.7]} radius={size * 0.035} smoothness={2} castShadow receiveShadow>
      <PhysicalMaterial kind="wood" color={shapeColors[kind]} />
    </RoundedBox>
  );
  return (
    <group>
      <Rod kind="glass" color={shapeColors[kind]} scale={[size * 0.8, size * 1.9, size * 0.8]} />
      {[-0.94, 0.94].map(y => <Rod key={y} kind="glass" color="#b6d3d5" position={[0, y * size, 0]} scale={[size * 0.81, size * 0.025, size * 0.81]} />)}
    </group>
  );
}
