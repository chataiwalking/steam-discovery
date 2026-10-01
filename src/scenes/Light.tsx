import { useMemo } from "react";
import { Lamp } from "./toyModels";
import { Color, Quaternion, SRGBColorSpace, Vector3 } from "three";
import { Cube, Rod, SceneLabel, ToyPlatform, type SceneProps } from "./shared";

const colors = ["#ff2d1b", "#24d24b", "#2862ff"];
function LightBeam({ index, strength }: { index: number; strength: number }) {
  const { center, rotation, length } = useMemo(() => {
    const x = (index - 1) * 1.9;
    const yaw = Math.atan2(x, 2.58);
    const from = new Vector3(x - Math.sin(yaw) * 0.313, 1.164, 1.45 - Math.cos(yaw) * 0.313);
    const to = new Vector3(0, 1.86, -1.01);
    return {
      center: from.clone().add(to).multiplyScalar(0.5),
      rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), from.clone().sub(to).normalize()),
      length: from.distanceTo(to),
    };
  }, [index]);
  return (
    <mesh position={center} quaternion={rotation}>
      <coneGeometry args={[1.06, length, 40, 1, true]} />
      <meshBasicMaterial color={colors[index]} transparent opacity={0.022 + strength * 0.055} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
export default function Light(props: SceneProps) {
  const lights = props.demo
    ? [1, props.narrationActive && props.narrationTime >= 3 ? 1 : 0, props.narrationActive && props.narrationTime >= 6 ? 1 : 0]
    : props.state.lights;
  const [r, g, b] = lights.map(n => Math.max(0, Math.min(1, n)));
  const mixed = new Color().setRGB(r, g, b, SRGBColorSpace);
  const active = r + g + b > 0;
  const names = ["红光", "绿光", "蓝光"];
  return (
    <group>
      <ToyPlatform color="#798992" radius={3.6} />
      <Cube kind="metal" color="#263b48" position={[0, 0.03, 0.3]} scale={[6.3, 0.15, 4.25]} />
      {Array.from({ length: 7 }, (_, i) => (
        <Cube key={i} kind="metal" color="#71818a" position={[0, 0.115, -1.4 + i * 0.56]} scale={[6, 0.009, 0.011]} />
      ))}
      <Cube kind="metal" color="#566872" position={[0, 1.8, -1.25]} scale={[4.4, 3.25, 0.12]} />
      <mesh position={[0, 1.83, -1.17]}>
        <planeGeometry args={[4.04, 2.9]} />
        <meshStandardMaterial color="#c5c9c7" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.86, -1.02]}>
        <circleGeometry args={[1.06, 64]} />
        <meshBasicMaterial color={active ? mixed : "#151c22"} toneMapped={false} />
      </mesh>
      {[-1.75, 1.75].map(x => (
        <group key={x}>
          <Rod kind="metal" color="#85959e" position={[x, 0.48, -1.31]} scale={[0.065, 0.8, 0.065]} />
          <Cube kind="metal" color="#415665" position={[x, 0.18, -1.31]} scale={[0.6, 0.1, 0.6]} />
          {[0.3, 3.3].map(y => <Rod key={y} kind="metal" color="#aebabe" position={[x, y, -1.16]} rotation={[Math.PI / 2, 0, 0]} scale={[0.034, 0.02, 0.034]} />)}
        </group>
      ))}
      {colors.map((color, i) => (
        <group key={color} position={[(i - 1) * 1.9, 0.13, 1.45]}>
          <group rotation={[0, Math.atan2((i - 1) * 1.9, 2.58), 0]} onClick={e => { e.stopPropagation(); props.onAction?.({ type: "light", index: i }); }}><Lamp color={color} lit={lights[i] > 0} /></group>
          <SceneLabel position={[0, 0.2, 0.65]} color={["#f4b3ab", "#acd9b4", "#b2caff"][i]}>{names[i]}</SceneLabel>
        </group>
      ))}
      {colors.map((color, i) => lights[i] > 0 && <LightBeam key={color} index={i} strength={lights[i]} />)}
      <SceneLabel position={[0, 3.75, -1.1]}>
        {r === 1 && g === 1 && b === 1 ? "红 + 绿 + 蓝 = 白光" : "让彩色的光，在这里相遇"}
      </SceneLabel>
    </group>
  );
}
