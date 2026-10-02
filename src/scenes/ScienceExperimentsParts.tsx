import { useEffect, useMemo, type RefObject } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { Cube, Rod, SceneLabel, type SceneProps } from './shared';
import { PhysicalMaterial } from './materials';

export interface ExperimentSceneProps {
  props: SceneProps;
  progress: RefObject<number>;
  value: number;
  option: number;
}
export const smooth = (n: number) => n * n * (3 - 2 * n);
export function Wire({ points, color = '#ba4e36', radius = .025 }: {
  points: [number, number, number][]; color?: string; radius?: number;
}) {
  const geometry = useMemo(() => new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), Math.max(16, points.length * 8), radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow><PhysicalMaterial kind="paint" color={color} roughness={.48} /></mesh>;
}
export function Board({ width = 4.9, depth = 3.1 }: { width?: number; depth?: number }) {
  return <group><Cube kind="wood" color="#8c7654" position={[0,.12,0]} scale={[width,.23,depth]} />
    <Cube kind="metal" color="#657780" position={[0,.015,0]} scale={[width+.08,.075,depth+.08]} /></group>;
}
export function Stand({ x = 0, z = 0, height = 1.5 }: { x?: number; z?: number; height?: number }) {
  return <group position={[x,0,z]}><Rod kind="metal" color="#53646b" position={[0,.1,0]} scale={[.43,.15,.43]} />
    <Rod kind="metal" color="#9eabb0" position={[0,height/2+.1,0]} scale={[.035,height,.035]} /></group>;
}
export function Readout({ text, position = [0,.25,2.3] }: { text: string; position?: [number,number,number] }) {
  return <SceneLabel position={position}>{text}</SceneLabel>;
}
export function GlassTank({ width = 4.4, height = 1.5, depth = 2.1 }: { width?: number; height?: number; depth?: number }) {
  return <group>
    <Cube kind="stone" color="#c2cbc9" position={[0,.2,0]} scale={[width+.16,.15,depth+.16]} />
    {[-1,1].map(sign => <group key={sign}>
      <Cube kind="glass" color="#b2d5dd" position={[sign*width/2,.24+height/2,0]} scale={[.04,height,depth]} />
      <Cube kind="glass" color="#c8e1e4" position={[0,.24+height/2,sign*depth/2]} scale={[width,height,.025]} />
      <Cube kind="metal" color="#789ba6" position={[0,.25+height,sign*depth/2]} scale={[width+.05,.035,.035]} />
    </group>)}
  </group>;
}
export function Person({ color = '#b4a58c' }: { color?: string }) {
  return <group>
    <mesh position={[0,.93,0]} castShadow><sphereGeometry args={[.13,20,16]} /><PhysicalMaterial kind="paint" color="#bba58b" /></mesh>
    <Cube kind="paint" color={color} position={[0,.62,0]} scale={[.31,.42,.2]} />
    {[-1,1].map(sign => <group key={sign}>
      <Rod kind="paint" color="#394f62" position={[sign*.085,.24,0]} scale={[.055,.42,.055]} />
      <Rod kind="paint" color={color} position={[sign*.22,.58,0]} rotation={[0,0,sign*.13]} scale={[.045,.37,.045]} />
    </group>)}
  </group>;
}
