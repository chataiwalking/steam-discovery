import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, MathUtils, type ShaderMaterial } from "three";
import { getExperiment } from "../content/experiments";
import { SceneLabel, ToyPlatform, useSceneClock, type SceneProps } from "./shared";

const subjectColors = { S: "#63c7de", T: "#79d5ad", E: "#ffbc74", A: "#ed9cb9", M: "#b7afff" };
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform vec3 color;
  uniform float focus;
  uniform float phase;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float rim = smoothstep(0.859, 0.868, r) * (1.0 - smoothstep(0.879, 0.889, r));
    float angle = atan(p.y, p.x);
    float ticks = step(0.85, fract(angle / 6.2831853 * 48.0));
    float scaleMarks = smoothstep(0.81, 0.82, r) * (1.0 - smoothstep(0.845, 0.85, r)) * ticks;
    float sweep = pow(max(0.0, cos(angle - phase)), 14.0) * focus;
    float alpha = rim * (0.18 + focus * 0.35 + sweep * 0.25) + scaleMarks * 0.18;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color * (1.0 + sweep), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function ExperimentFrame({ props, children }: { props: SceneProps; children: ReactNode }) {
  const experiment = getExperiment(props.lesson)!;
  const material = useRef<ShaderMaterial>(null);
  const hovering = useRef(false);
  const flash = useRef(0);
  const clock = useSceneClock(props);
  const invalidate = useThree(state => state.invalidate);
  const uniforms = useMemo(() => ({
    color: { value: new Color(subjectColors[experiment.subject]) },
    focus: { value: 0 },
    phase: { value: 0 },
  }), [experiment.subject]);
  useLayoutEffect(() => { flash.current = 1; invalidate(); }, [props.state.experimentRun, props.state.experimentValue, props.state.experimentOption, invalidate]);
  useFrame((_, delta) => {
    if (!material.current) return;
    const step = Math.min(delta, 0.06);
    if (!props.paused) flash.current = Math.max(0, flash.current - step * 0.7);
    const target = hovering.current ? 1 : flash.current;
    material.current.uniforms.focus.value = props.paused ? target : MathUtils.damp(material.current.uniforms.focus.value, target, 8, step);
    material.current.uniforms.phase.value = clock.current * 0.65;
  });
  return <group>
    <ToyPlatform radius={3.8} color="#9da8ad" />
    <mesh position={[0, -0.038, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
      <planeGeometry args={[8, 8]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} />
    </mesh>
    <group onPointerOver={() => { hovering.current = true; invalidate(); }} onPointerOut={() => { hovering.current = false; invalidate(); }} onPointerDown={() => { flash.current = 1; invalidate(); }}>
      {children}
    </group>
    <SceneLabel position={[0, 3.7, 0]}>{experiment.title}</SceneLabel>
  </group>;
}

export function useExperimentMotion(props: SceneProps) {
  const clock = useSceneClock(props), started = useRef(0), reported = useRef(0), progress = useRef(0);
  useLayoutEffect(() => { started.current = clock.current; progress.current = 0; if (props.state.experimentRun === 0) reported.current = 0; }, [props.state.experimentRun, clock]);
  useFrame(() => {
    if (props.paused) return;
    if (props.demo) { progress.current = props.narrationActive ? Math.min(1, props.narrationTime / 5) : 0; return; }
    const run = props.state.experimentRun;
    progress.current = run > 0 ? Math.min(1, Math.max(0, (clock.current - started.current) / 2.5)) : 0;
    if (run > 0 && progress.current >= 1 && reported.current !== run) { reported.current = run; props.onAction?.({ type: "experiment-complete", runId: run }); }
  }, -1);
  return progress;
}
