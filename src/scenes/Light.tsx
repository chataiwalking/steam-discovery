import { Lamp } from "./toyModels";
import { Color, SRGBColorSpace } from "three";
import { Cube, SceneLabel, ToyPlatform, type SceneProps } from "./shared";

const colors = ["#ff6b65", "#80c67b", "#6d9ee0"];
export default function Light(props: SceneProps) {
  const lights = props.demo
    ? [
        1,
        props.narrationActive && props.narrationTime >= 3 ? 1 : 0,
        props.narrationActive && props.narrationTime >= 6 ? 1 : 0,
      ]
    : props.state.lights;
  const [r, g, b] = lights.map((n) => Math.max(0, Math.min(1, n)));
  const mixed = new Color().setRGB(r, g, b, SRGBColorSpace);
  const active = r + g + b > 0;
  const names = ["红光", "绿光", "蓝光"];
  return (
    <group>
      <ToyPlatform color="#e5dfcf" radius={3.6} />
      <Cube
        color="#cfbc95"
        position={[0, 1.8, -1.25]}
        scale={[4.4, 3.25, 0.18]}
      />
      <mesh position={[0, 1.83, -1.13]}>
        <planeGeometry args={[4.04, 2.9]} />
        <meshStandardMaterial color="#ecebdf" roughness={1} />
      </mesh>
      <mesh position={[0, 1.86, -1.02]}>
        <circleGeometry args={[1.06, 64]} />
        <meshBasicMaterial
          color={active ? mixed : "#000000"}
          toneMapped={false}
        />
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <Cube
          key={x}
          color="#bfa877"
          position={[x, 0.25, -1.23]}
          scale={[0.18, 0.7, 0.3]}
        />
      ))}
      {colors.map((color, i) => (
        <group key={color} position={[(i - 1) * 1.9, 0.03, 1.45]}>
          <group
            onClick={(e) => {
              e.stopPropagation();
              props.onAction?.({ type: "light", index: i });
            }}
          >
            <Lamp color={color} lit={lights[i] > 0} />
          </group>
          <SceneLabel
            position={[0, 0.2, 0.65]}
            color={["#b66559", "#568b50", "#507fa8"][i]}
          >
            {names[i]}
          </SceneLabel>
        </group>
      ))}
      {colors.map(
        (color, i) =>
          lights[i] > 0 && (
            <mesh
              key={color}
              position={[(i - 1) * 0.93, 1.45, 0.1]}
              rotation={[Math.PI / 2 - 0.35, 0, -(i - 1) * 0.5]}
            >
              <coneGeometry args={[0.8, 2.6, 32, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.07 + lights[i] * 0.1}
                depthWrite={false}
              />
            </mesh>
          ),
      )}
      <SceneLabel position={[0, 3.75, -1.1]}>
        {r === 1 && g === 1 && b === 1
          ? "红 + 绿 + 蓝 = 白光"
          : "让彩色的光，在这里相遇"}
      </SceneLabel>
    </group>
  );
}
