import { ShapeToy, shapeColors } from "./toyModels";
import type { ShapeKind } from "../types";
import { Rod, SceneLabel, ToyPlatform, type SceneProps } from "./shared";

export default function Shapes(props: SceneProps) {
  const shapes: ShapeKind[] = props.demo
    ? ["sphere", "cube", "cylinder"]
    : props.state.shapes;
  const sorted = props.demo ? 0 : props.state.sorted;
  const kinds: ShapeKind[] = ["sphere", "cube", "cylinder"];
  return (
    <group>
      <ToyPlatform radius={3.65} color="#e8dcbc" />
      <Rod
        color="#f8efd9"
        position={[0, 0.03, -0.85]}
        scale={[2.9, 0.07, 1.65]}
      />
      {shapes.map((kind, i) => {
        const done = i < sorted;
        const kindIndex = kinds.indexOf(kind);
        const matchingPrevious = shapes
          .slice(0, i)
          .filter((k) => k === kind).length;
        return (
          <group
            key={`${kind}-${i}`}
            position={
              done
                ? [
                    (kindIndex - 1) * 2 + ((matchingPrevious % 2) - 0.5) * 0.42,
                    0.4 + Math.floor(matchingPrevious / 4) * 0.54,
                    1.18 + Math.floor((matchingPrevious % 4) / 2) * 0.48,
                  ]
                : [
                    props.demo ? (i - 1) * 1.65 : ((i % 5) - 2) * 1.0,
                    props.demo ? 0.9 : 0.6,
                    -0.5 - Math.floor(i / 5) * 1.1,
                  ]
            }
            rotation={[
              0,
              props.demo && props.narrationActive
                ? props.narrationTime * 0.24
                : 0,
              0,
            ]}
          >
            <ShapeToy
              kind={kind}
              size={done ? 0.24 : props.demo ? 0.58 : 0.38}
            />
          </group>
        );
      })}
      {kinds.map((kind, i) => (
        <group key={kind} position={[(i - 1) * 2, 0, 1.55]}>
          <Rod
            color={shapeColors[kind]}
            position={[0, 0.03, 0]}
            scale={[0.83, 0.1, 0.83]}
          />
          <Rod
            color="#fff8e7"
            position={[0, 0.09, 0]}
            scale={[0.72, 0.045, 0.72]}
          />
          <SceneLabel position={[0, 0.12, 0.94]}>
            {["球", "立方体", "圆柱"][i]}
          </SceneLabel>
        </group>
      ))}
      <SceneLabel position={[0, 2.25, -0.5]}>选形状 · 动手数一数</SceneLabel>
    </group>
  );
}
