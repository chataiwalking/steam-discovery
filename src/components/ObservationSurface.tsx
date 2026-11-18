import { useEffect, useMemo } from "react";
import { Color, Float32BufferAttribute, PlaneGeometry } from "three";

/** A shaded observation table keeps the specimen and its cast shadows readable. */
export function ObservationSurface({ dark, island }: { dark: boolean; island: boolean }) {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(100, 100, 64, 64);
    plane.rotateX(-Math.PI / 2);
    const vertices = plane.getAttribute("position");
    const edge = new Color(dark ? "#142a36" : "#82a5b6");
    const center = new Color(dark ? "#3b5057" : "#e8e5d8");
    const sample = new Color();
    const colors = new Float32Array(vertices.count * 3);
    const radius = island ? 83 : 42;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), z = vertices.getZ(i);
      const intensity = Math.exp(-((x + 1.8) ** 2 + .83 * (z + 1.4) ** 2) / radius);
      sample.lerpColors(edge, center, intensity).toArray(colors, i * 3);
    }
    plane.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return plane;
  }, [dark, island]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh receiveShadow position-y={island ? -1.87 : -.46} geometry={geometry}>
    <meshStandardMaterial vertexColors roughness={.96} />
  </mesh>;
}
