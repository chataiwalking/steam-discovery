import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import { SceneLabel } from './shared';

type Point = [number, number, number];
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

/** These paths are explanatory overlays, never inferred numerical field solutions. */
export function EffectPath({ points, progress, color = '#eecb79', strength = 1, radius = .018, speed = 3, closed = false, activeAfterStart = false, gate, enabled }: {
  points: Point[]; progress: RefObject<number>; color?: string; strength?: number; radius?: number; speed?: number; closed?: boolean; activeAfterStart?: boolean; gate?: { frequency: number; duty: number }; enabled?: (progress: number) => boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const key = JSON.stringify(points);
  const geometry = useMemo(() => new TubeGeometry(new CatmullRomCurve3((JSON.parse(key) as Point[]).map(p => new Vector3(...p)), closed), 72, radius, 5, closed), [key, radius, closed]);
  const uniforms = useMemo(() => ({ phase: { value: 0 }, tint: { value: new Color(color) }, strength: { value: strength } }), [color]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!material.current) return;
    const p = progress.current, gated = gate ? p > 0 && p < 1 && (p * gate.frequency % 1) < gate.duty : true;
    material.current.uniforms.phase.value = p * speed;
    material.current.uniforms.strength.value = strength * (gated && (!activeAfterStart || p > 0) && (!enabled || enabled(p)) ? 1 : 0);
  });
  return <mesh geometry={geometry} raycast={() => null}>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} transparent depthWrite={false} toneMapped={false}
      fragmentShader={`uniform float phase;uniform float strength;uniform vec3 tint;varying vec2 vUv;
        void main(){float front=fract(vUv.x*3.-phase);float pulse=pow(max(0.,1.-abs(front-.5)*2.),9.);
        float edge=sin(vUv.y*3.14159);float alpha=(.24+.65*pulse)*clamp(strength,0.,1.)*(.6+.4*edge);
        gl_FragColor=vec4(tint*(.55+1.35*pulse),alpha);}`} />
  </mesh>;
}

/** A finite disturbance keeps pause/demo semantics by using experiment progress only. */
export function WaveSurface({ progress, position, size, strength = 1, frequency = 5, color = '#8ecfdf' }: {
  progress: RefObject<number>; position: Point; size: [number, number]; strength?: number; frequency?: number; color?: string;
}) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ phase: { value: 0 }, amplitude: { value: strength }, frequency: { value: frequency }, tint: { value: new Color(color) } }), [color]);
  useFrame(() => { if (material.current) { material.current.uniforms.phase.value = progress.current; material.current.uniforms.amplitude.value = strength; material.current.uniforms.frequency.value = frequency; } });
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
    <planeGeometry args={[...size, 24, 24]} />
    <shaderMaterial ref={material} uniforms={uniforms} side={DoubleSide} transparent depthWrite={false} toneMapped={false}
      vertexShader={`uniform float phase;uniform float amplitude;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float d=length(uv-.5);p.z+=sin(d*35.-phase*18.)*.012*amplitude*sin(phase*3.14159);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`}
      fragmentShader={`uniform float phase;uniform float amplitude;uniform float frequency;uniform vec3 tint;varying vec2 vUv;
        void main(){float d=length(vUv-.5);float rings=pow(max(0.,sin(d*frequency*6.28318-phase*15.)),12.);
        float edge=1.-smoothstep(.32,.5,d);float entry=sin(clamp(phase,0.,1.)*3.14159);
        gl_FragColor=vec4(tint*(.8+.7*rings),rings*edge*entry*.55*amplitude);}`} />
  </mesh>;
}

/** Object raycasting gives the exhibit itself hover/click feedback; no learning state changes. */
export function InspectObject({ children, text, position = [0, 1.3, 0], radius = .65 }: {
  children: ReactNode; text: string; position?: Point; radius?: number;
}) {
  const [hovered, setHovered] = useState(false), [selected, setSelected] = useState(false);
  useCursor(hovered);
  const ring = useRef<Mesh>(null), hint = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!ring.current || !hint.current) return;
    const target = hovered || selected ? 1 : 0;
    const next = ring.current.scale.x + (target - ring.current.scale.x) * (1 - Math.exp(-12 * Math.min(delta, .06)));
    ring.current.scale.setScalar(next);
    hint.current.visible = selected;
  });
  return <group onPointerOver={event => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}
    onClick={event => { event.stopPropagation(); setSelected(value => !value); }}>
    {children}
    <mesh ref={ring} position={[position[0], .29, position[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={0} raycast={() => null}>
      <ringGeometry args={[radius, radius + .028, 48]} /><meshBasicMaterial color={selected ? '#f4d58e' : '#a9dce4'} transparent opacity={.8} toneMapped={false} side={DoubleSide} depthWrite={false} />
    </mesh>
    <group ref={hint} visible={selected}><SceneLabel position={position}>{text}</SceneLabel></group>
  </group>;
}

export function DirectionArrow({ position, length = .65, up = true, color = '#87c4cd' }: { position: Point; length?: number; up?: boolean; color?: string }) {
  return <group position={position} rotation={[0, 0, up ? 0 : Math.PI]} raycast={() => null}>
    <mesh position={[0, length / 2, 0]}><cylinderGeometry args={[.014, .014, length, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={[0, length, 0]}><coneGeometry args={[.065, .17, 12]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
  </group>;
}

/** A straight ray with an animated source; camera movement never changes its direction. */
export function LightRay({ source, target, progress, initialSource, color = '#eacb8b', strength = .4 }: {
  source: Point; target: Point; progress: RefObject<number>; initialSource?: Point; color?: string; strength?: number;
}) {
  const mesh = useRef<Mesh>(null);
  const vectors = useMemo(() => ({ start: new Vector3(), end: new Vector3(), destination: new Vector3(), direction: new Vector3(), up: new Vector3(0, 1, 0) }), []);
  useFrame(() => {
    if (!mesh.current) return;
    const p = progress.current * progress.current * (3 - 2 * progress.current);
    vectors.start.set(...source);
    if (initialSource) vectors.start.set(...initialSource).lerp(vectors.destination.set(...source), p);
    vectors.end.set(...target);
    vectors.direction.subVectors(vectors.end, vectors.start);
    mesh.current.position.copy(vectors.start).add(vectors.end).multiplyScalar(.5);
    mesh.current.scale.y = vectors.direction.length();
    mesh.current.quaternion.setFromUnitVectors(vectors.up, vectors.direction.normalize());
  });
  return <mesh ref={mesh} raycast={() => null}><cylinderGeometry args={[.009, .009, 1, 6]} /><meshBasicMaterial color={color} transparent opacity={strength} toneMapped={false} depthWrite={false} /></mesh>;
}

export function LongitudinalMedium({ progress, frequency, amplitude }: { progress: RefObject<number>; frequency: number; amplitude: number }) {
  const geometry = useMemo(() => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(new Float32Array(48 * 3), 3)); return g; }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const p = progress.current, active = p > 0 && p < 1;
    const attribute = geometry.getAttribute('position');
    for (let i = 0; i < 48; i++) {
      const x = -2.1 + (i % 24) * .1826;
      const offset = active ? Math.sin(x * frequency * .9 - p * frequency * 6) * amplitude : 0;
      attribute.setXYZ(i, x + offset, 1.26 + Math.floor(i / 24) * .24, -.16);
    }
    attribute.needsUpdate = true;
  });
  return <points geometry={geometry} raycast={() => null}><pointsMaterial size={.055} color="#8fc7d1" sizeAttenuation transparent opacity={.85} depthWrite={false} toneMapped={false} /></points>;
}

export function MolecularInset({ progress, target, cooling, running }: { progress: RefObject<number>; target: number; cooling: boolean; running: boolean }) {
  const geometry = useMemo(() => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(new Float32Array(48 * 3), 3)); return g; }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const p = progress.current, heat = running ? (cooling ? 6 : 0) + (target - (cooling ? 6 : 0)) * p * p * (3 - 2 * p) : target;
    const state = heat < 2 ? 0 : heat < 5 ? 1 : 2;
    const a = geometry.getAttribute('position');
    for (let i = 0; i < 48; i++) {
      const phase = i * 2.39996;
      const lattice: Point = [(i % 4 - 1.5) * .16, (Math.floor(i / 4) % 4 - 1.5) * .16, (Math.floor(i / 16) - 1) * .16];
      const range = state === 2 ? .6 : .32;
      const drift = p * (state === 2 ? 9 : 3);
      a.setXYZ(i, state === 0 ? lattice[0] : Math.sin(phase + drift) * range,
        state === 0 ? lattice[1] : Math.cos(phase * 1.73 + drift * .67) * range,
        state === 0 ? lattice[2] : Math.sin(phase * .67 - drift * .83) * range);
    }
    a.needsUpdate = true;
  });
  return <group position={[-1.65, 1.3, 0]}>
    <mesh><boxGeometry args={[1.35, 1.35, 1.35]} /><meshBasicMaterial color="#8ca6b3" wireframe transparent opacity={.22} /></mesh>
    <points geometry={geometry} raycast={() => null}><pointsMaterial size={.05} color="#9dd7df" depthWrite={false} toneMapped={false} /></points>
    <SceneLabel position={[0, -.8, .12]}>粒子放大示意 · 间距不按比例</SceneLabel>
  </group>;
}
