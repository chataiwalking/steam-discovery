import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Vector3 } from "three";
import type { ShapeKind } from "../types";
import { Ball, Cube, Rod } from "./shared";

function Land({
  lat,
  lon,
  scale,
}: {
  lat: number;
  lon: number;
  scale: [number, number, number];
}) {
  const { point, rotation } = useMemo(() => {
    const point = new Vector3(
      Math.cos(lat) * Math.cos(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.sin(lon),
    );
    const rotation = new Group();
    rotation.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), point);
    return { point: point.multiplyScalar(1.405), rotation: rotation.rotation };
  }, [lat, lon]);
  return (
    <Ball color="#9dbf75" position={point} rotation={rotation} scale={scale} />
  );
}
export function Globe({
  angle = 0,
  small = false,
}: {
  angle?: number;
  small?: boolean;
}) {
  return (
    <group rotation={[0, angle, 0]}>
      <Ball color="#63aabf" scale={1.4} roughness={0.95} />
      {[
        [-0.1, 0.65, 0.45, 0.55],
        [0.48, 0.8, 0.4, 0.47],
        [0.02, -0.7, 0.35, 0.48],
        [0.75, -1, 0.52, 0.25],
        [-0.68, 2, 0.32, 0.3],
        [0.4, 2.3, 0.6, 0.5],
        [-0.5, -0.6, 0.25, 0.43],
        [-0.1, 3.5, 0.5, 0.45],
      ].map(([lat, lon, x, y], i) => (
        <Land key={i} lat={lat} lon={lon} scale={[x, y, 0.05]} />
      ))}
      <Ball color="#fff5de" position={[0, 1.31, 0]} scale={[0.5, 0.14, 0.5]} />
      {!small && (
        <group position={[1.23, 0.77, 0]} rotation={[0, 0, -1.01]}>
          <Rod color="#fff4d8" scale={[0.23, 0.035, 0.23]} />
          <Cube
            color="#fff0c2"
            position={[0, 0.15, 0]}
            scale={[0.25, 0.28, 0.25]}
          />
          <mesh
            position={[0, 0.35, 0]}
            rotation={[0, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[0.24, 0.22, 4]} />
            <meshStandardMaterial color="#dd7552" />
          </mesh>
          <Cube
            color="#734e3b"
            position={[0, 0.15, 0.13]}
            scale={[0.07, 0.12, 0.015]}
          />
        </group>
      )}
    </group>
  );
}

export function ToyCar({ color = "#ef956b" }: { color?: string }) {
  return (
    <group>
      <Cube color={color} position={[0, 0.26, 0]} scale={[0.65, 0.24, 0.4]} />
      <Cube
        color="#f8dd98"
        position={[-0.05, 0.48, 0]}
        scale={[0.35, 0.22, 0.35]}
      />
      <Cube
        color="#94bcbc"
        position={[0.08, 0.49, 0.184]}
        scale={[0.15, 0.14, 0.02]}
      />
      {[-0.2, 0.2].flatMap((x) =>
        [-0.23, 0.23].map((z) => (
          <group
            key={`${x}-${z}`}
            position={[x, 0.15, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Rod color="#526b64" scale={[0.12, 0.09, 0.12]} />
            <Rod
              color="#fbe5b5"
              position={[0, z > 0 ? -0.052 : 0.052, 0]}
              scale={[0.055, 0.02, 0.055]}
            />
          </group>
        )),
      )}
    </group>
  );
}
export function BridgeModel({
  deck = true,
  pier = true,
  braces = true,
}: {
  deck?: boolean;
  pier?: boolean;
  braces?: boolean;
}) {
  return (
    <group>
      {[-2.5, 2.5].map((x) => (
        <group key={x}>
          <Cube
            color="#ddd0b4"
            position={[x, 0.35, 0]}
            scale={[1.3, 0.7, 1.8]}
          />
          <Cube
            color="#b8ce8d"
            position={[x, 0.76, 0]}
            scale={[1.4, 0.15, 1.8]}
          />
        </group>
      ))}
      {deck && (
        <group>
          {Array.from({ length: 11 }, (_, i) => (
            <Cube
              key={i}
              color={i % 2 === 0 ? "#d99b65" : "#e6b17a"}
              position={[-2.1 + i * 0.42, 0.8, 0]}
              scale={[0.4, 0.2, 1.3]}
            />
          ))}
          {[-0.7, 0.7].map((z) => (
            <group key={z}>
              <Cube
                color="#c38a57"
                position={[0, 1.35, z]}
                scale={[4.8, 0.11, 0.1]}
              />
              {[-2.1, -0.7, 0.7, 2.1].map((x) => (
                <Cube
                  key={x}
                  color="#e1ae74"
                  position={[x, 1.08, z]}
                  scale={[0.1, 0.62, 0.1]}
                />
              ))}
            </group>
          ))}
        </group>
      )}
      {pier && (
        <group>
          {[-0.45, 0.45].map((z) => (
            <Rod
              key={z}
              color="#9bada0"
              position={[0, 0.36, z]}
              scale={[0.18, 0.8, 0.18]}
            />
          ))}
          <Cube
            color="#b4c2ab"
            position={[0, 0.03, 0]}
            scale={[0.8, 0.12, 1.35]}
          />
        </group>
      )}
      {braces &&
        [-0.75, 0.75].map((z) => (
          <group key={z}>
            {[-1, 1].map((direction) => (
              <Cube
                key={direction}
                color="#679880"
                position={[direction * 1.05, 1.1, z]}
                rotation={[0, 0, direction * 0.234]}
                scale={[2.16, 0.12, 0.12]}
              />
            ))}
          </group>
        ))}
    </group>
  );
}

export function Lamp({ color, lit = true }: { color: string; lit?: boolean }) {
  return (
    <group>
      <Rod color="#dfd4bd" position={[0, 0.1, 0]} scale={[0.34, 0.12, 0.34]} />
      <Rod
        color="#b9b8a5"
        position={[0, 0.5, 0]}
        scale={[0.065, 0.75, 0.065]}
      />
      <group position={[0, 0.93, 0]} rotation={[-0.7, 0, 0]}>
        <Rod
          color={color}
          scale={[0.25, 0.43, 0.25]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Ball
          color={lit ? "#fff7da" : "#a5a69b"}
          position={[0, 0, -0.23]}
          scale={[0.21, 0.21, 0.045]}
        />
      </group>
    </group>
  );
}

export const shapeColors = {
  sphere: "#efac63",
  cube: "#82afa8",
  cylinder: "#a0a6cf",
};
export function ShapeToy({
  kind,
  size = 0.48,
}: {
  kind: ShapeKind;
  size?: number;
}) {
  if (kind === "sphere") return <Ball color={shapeColors[kind]} scale={size} />;
  if (kind === "cube")
    return (
      <RoundedBox
        args={[size * 1.7, size * 1.7, size * 1.7]}
        radius={0.08}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={shapeColors[kind]} roughness={0.8} />
      </RoundedBox>
    );
  return (
    <Rod
      color={shapeColors[kind]}
      scale={[size * 0.8, size * 1.9, size * 0.8]}
    />
  );
}
