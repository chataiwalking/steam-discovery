import { useLayoutEffect, useRef, type ComponentRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OrthographicCamera } from "three";

export type SceneView = "perspective" | "front" | "top" | "orbit";

/** Camera inspection is separate from experiment actions and learning evidence. */
export function SceneCamera({ lesson, view, zoom, resetToken }: {
  lesson: string; view: SceneView; zoom: number; resetToken: number;
}) {
  const { camera, size, invalidate, setEvents } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previousPreset = useRef("");
  const island = lesson === "island";
  const specimen = lesson === "cell-world";
  const targetY = island ? .25 : specimen ? 1.8 : 1.35;
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    camera.zoom = Math.min(size.width / (island ? 12.4 : specimen ? 5 : 8.5), size.height / (island ? 9.4 : specimen ? 4.4 : 6.6)) * zoom;
    const preset = `${lesson}:${view}:${resetToken}`;
    if (preset !== previousPreset.current) {
    previousPreset.current = preset;
    if (island) camera.position.set(7.5, 9.5, 12);
    else if (view === "front") camera.position.set(0, targetY + .4, 14);
    else if (view === "top") camera.position.set(0, 15, .001);
    else if (lesson === "balance-scale" || lesson === "lever") camera.position.set(0, 6.5, 11);
    else if (lesson === "gears" || lesson === "light") camera.position.set(1, 5, 13);
    else camera.position.set(5, 6.5, 10);
    camera.lookAt(0, targetY, 0);
    }
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, targetY, 0);
    controls.current?.update();
    invalidate();
  }, [camera, size.width, size.height, island, specimen, targetY, lesson, view, zoom, resetToken, invalidate]);
  useLayoutEffect(() => {
    // OrbitControls listens to native events; do not activate lesson objects while inspecting.
    setEvents({ enabled: view !== "orbit" });
    return () => setEvents({ enabled: true });
  }, [view, setEvents]);
  if (island || view !== "orbit") return null;
  return <OrbitControls ref={controls} enabled={view === "orbit"} enableDamping={false}
    enableZoom={false} enablePan={false} minPolarAngle={.08} maxPolarAngle={Math.PI * .48}
    target={[0, targetY, 0]} />;
}
