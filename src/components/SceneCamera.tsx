import { useLayoutEffect, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MathUtils, OrthographicCamera, Vector3 } from "three";

export type SceneView = "perspective" | "front" | "top" | "orbit";

function presetPosition(lesson: string, view: SceneView, targetY: number) {
  if (lesson === "island") return new Vector3(7.5, 9.5, 12);
  if (view === "front") return new Vector3(0, targetY + .4, 14);
  if (view === "top") return new Vector3(0, 15, .001);
  if (lesson === "balance-scale" || lesson === "lever") return new Vector3(0, 6.5, 11);
  if (lesson === "gears" || lesson === "light") return new Vector3(1, 5, 13);
  return new Vector3(5, 6.5, 10);
}

/** Changing a viewing angle is available even when the experiment clock is paused. */
export function SceneCamera({ lesson, view, zoom, resetToken }: {
  lesson: string; view: SceneView; zoom: number; resetToken: number;
}) {
  const { camera, size, invalidate, setEvents } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transition = useRef<{
    start: Vector3; end: Vector3; initialZoom: number; endZoom: number; startedAt: number;
  } | null>(null);
  const previous = useRef<{lesson: string; view: SceneView; reset: number} | null>(null);
  const island = lesson === "island";
  const specimen = lesson === "cell-world";
  const targetY = island ? .25 : specimen ? 1.8 : 1.35;
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    const scale = Math.min(size.width / (island ? 12.4 : specimen ? 5 : 8.5), size.height / (island ? 9.4 : specimen ? 4.4 : 6.6)) * zoom;
    const prev = previous.current;
    const firstView = !prev || prev.lesson !== lesson;
    const changePreset = firstView || prev.view !== view || prev.reset !== resetToken;
    const end = view === "orbit" ? camera.position.clone()
      : changePreset ? presetPosition(lesson, view, targetY)
      : transition.current?.end.clone() ?? camera.position.clone();
    previous.current = { lesson, view, reset: resetToken };
    if (firstView || view === "orbit" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition.current = null;
      camera.position.copy(end);
      camera.zoom = scale;
      camera.lookAt(0, targetY, 0);
      camera.updateProjectionMatrix();
      controls.current?.target.set(0, targetY, 0);
      controls.current?.update();
    } else {
      transition.current = { start: camera.position.clone(), end, initialZoom: camera.zoom, endZoom: scale, startedAt: performance.now() };
    }
    invalidate();
  }, [camera, size.width, size.height, island, specimen, targetY, lesson, view, zoom, resetToken, invalidate]);

  useFrame(() => {
    const move = transition.current;
    if (!move || !(camera instanceof OrthographicCamera)) return;
    const t = Math.min(1, (performance.now() - move.startedAt) / 320);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(move.start, move.end, eased);
    camera.zoom = MathUtils.lerp(move.initialZoom, move.endZoom, eased);
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
    if (t < 1) invalidate();
    else transition.current = null;
  }, -1);

  useLayoutEffect(() => {
    setEvents({ enabled: view !== "orbit" });
    return () => setEvents({ enabled: true });
  }, [view, setEvents]);
  if (island || view !== "orbit") return null;
  return <OrbitControls ref={controls} enableDamping={false} enableZoom={false} enablePan={false}
    minPolarAngle={.08} maxPolarAngle={Math.PI * .48} target={[0, targetY, 0]} />;
}
