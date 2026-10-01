import { useEffect, useMemo, useRef, useState } from "react";
import { SceneHtml as Html } from "../components/SceneHtml";
import { useFrame } from "@react-three/fiber";
import { PlaneGeometry, type Group } from "three";
import type { LessonId } from "../types";
import { Globe, ToyCar, BridgeModel, Lamp, ShapeToy } from "./toyModels";
import { PhysicalMaterial } from "./materials";
import { Ball, Cube, Gear, Rod, useSceneClock, type SceneProps } from "./shared";

function Stop({ position, title, subtitle, id, children, props }: {
  position: [number, number, number]; title: string; subtitle: string;
  id: LessonId; children: React.ReactNode; props: SceneProps;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
      onClick={e => { e.stopPropagation(); document.body.style.cursor = ""; props.onSelect?.(id); }}>
      <Cube kind="metal" color="#34434b" scale={[2.45, 0.13, 2.3]} position={[0, 0.05, 0]} />
      <Cube kind="stone" color="#d0d1c8" scale={[2.38, 0.07, 2.23]} position={[0, 0.14, 0]} />
      <Cube kind="metal" color={hovered ? "#a0b8b5" : "#71837f"} scale={[0.78, 0.028, 0.14]} position={[0, 0.193, 0.92]} />
      {children}
      <Html center position={[0, 0.25, 1.12]} zIndexRange={[10, 0]} style={{ pointerEvents: "auto" }}>
        <button type="button" className="island-stop-label" aria-label={`探索${title}`}
          onClick={e => { e.stopPropagation(); props.onSelect?.(id); }}
          style={{ border: `1px solid ${hovered ? "#7d9eab" : "#aab3b5"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 56, minWidth: 108, cursor: "pointer", borderRadius: 5, padding: "7px 12px", background: hovered ? "#fff" : "rgba(244,246,244,.96)", color: "#233942", boxShadow: "0 3px 8px #192d3326", whiteSpace: "nowrap", fontFamily: "inherit", transition: "transform .2s", transform: hovered ? "translateY(-2px)" : "" }}>
          <span className="island-full-title" style={{ fontSize: 13, fontWeight: 750 }}>{title}</span>
          <span className="island-short-title">{{ "day-night": "昼夜", "water-cycle": "水滴", gears: "齿轮", bridge: "小桥", light: "彩光", shapes: "形状" }[id]}</span>
          <span className="island-subtitle" style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", color: "#687b83", marginTop: 4 }}>{subtitle}</span>
        </button>
      </Html>
    </group>
  );
}

function Watershed() {
  const terrain = useMemo(() => {
    const geometry = new PlaneGeometry(1.78, 1.48, 28, 24);
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), z = vertices.getZ(i);
      const mountain = Math.exp(-((x + 0.32) ** 2 * 5 + (z + 0.31) ** 2 * 9)) * 0.88;
      const ridge = Math.exp(-((x - 0.38) ** 2 * 11 + (z + 0.42) ** 2 * 12)) * 0.57;
      vertices.setY(i, Math.max(0.016, mountain + ridge + Math.sin(x * 31 + z * 23) * 0.022));
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => terrain.dispose(), [terrain]);
  return (
    <group position={[0, 0.24, 0]}>
      <Cube kind="wood" color="#8e7658" position={[0, 0.02, 0]} scale={[1.91, 0.13, 1.6]} />
      <mesh geometry={terrain} position={[0, 0.1, 0]} receiveShadow castShadow><PhysicalMaterial kind="ground" color="#777d63" /></mesh>
      <Cube kind="water" color="#548793" position={[0, 0.16, 0.21]} scale={[1.75, 0.05, 1.1]} />
      {[-0.94, 0.94].map(x => <Cube key={x} kind="glass" color="#c8dbde" position={[x, 0.31, 0]} scale={[0.025, 0.5, 1.6]} />)}
      <Cube kind="glass" color="#c8dbde" position={[0, 0.3, 0.79]} scale={[1.9, 0.49, 0.025]} />
      <Cube kind="metal" color="#798b90" position={[0, 1.48, -0.6]} scale={[1.93, 0.05, 0.05]} />
      {[-0.94, 0.94].map(x => <Cube key={x} kind="metal" color="#829397" position={[x, 0.77, -0.6]} scale={[0.04, 1.4, 0.04]} />)}
      <Rod kind="metal" color="#60727a" position={[0, 1.42, -0.3]} rotation={[Math.PI / 2, 0, 0]} scale={[0.065, 0.6, 0.065]} />
      {[-0.4, 0, 0.4].map(x => <Ball key={x} kind="water" color="#92bcc4" position={[x, 0.92, -0.2]} scale={[0.021, 0.047, 0.021]} />)}
    </group>
  );
}

export default function Island(props: SceneProps) {
  const earth = useRef<Group>(null), gears = useRef<Group>(null), smallGear = useRef<Group>(null);
  const time = useSceneClock(props);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  useFrame(() => {
    if (earth.current) earth.current.rotation.y = time.current * 0.08;
    if (gears.current) gears.current.rotation.z = time.current * 0.14;
    if (smallGear.current) smallGear.current.rotation.z = -time.current * 0.21 + Math.PI / 8;
  });
  return (
    <group position={[0, -0.5, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.33, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#bec7c8" roughness={0.88} />
      </mesh>
      {/* A real workbench: oak slab, steel apron, cross bars and inset display trays. */}
      <Cube kind="wood" color="#a38863" scale={[9.85, 0.26, 6.8]} position={[0, -0.08, 0]} />
      <Cube kind="metal" color="#293940" scale={[9.75, 0.3, 6.7]} position={[0, -0.34, 0]} />
      {[-4.3, 4.3].flatMap(x => [-2.9, 2.9].map(z => <Cube key={`${x}-${z}`} kind="metal" color="#24343c" scale={[0.18, 0.93, 0.18]} position={[x, -0.86, z]} />))}
      {[-2.9, 2.9].map(z => <Cube key={z} kind="metal" color="#34424a" scale={[8.65, 0.11, 0.13]} position={[0, -1.08, z]} />)}
      {[-4.3, 4.3].map(x => <Cube key={x} kind="metal" color="#34424a" scale={[0.13, 0.11, 5.85]} position={[x, -1.08, 0]} />)}
      <Stop props={props} id="day-night" title="昼夜的秘密" subtitle="01 · ASTRONOMY" position={[-3.13, 0.1, -1.72]}>
        <Rod kind="metal" color="#455358" position={[0, 0.26, 0]} scale={[0.51, 0.14, 0.51]} />
        <Rod kind="metal" color="#8f9fa2" position={[0, 0.53, 0]} scale={[0.055, 0.5, 0.055]} />
        <mesh position={[0, 1.36, 0]} rotation={[0, 0, -0.3]}><torusGeometry args={[0.97, 0.025, 8, 64]} /><PhysicalMaterial kind="metal" color="#7f949b" /></mesh>
        <group ref={earth} position={[0, 1.36, 0]} scale={0.61}><Globe small /></group>
      </Stop>
      <Stop props={props} id="water-cycle" title="小水滴旅行" subtitle="02 · EARTH SCIENCE" position={[0, 0.1, -1.72]}><Watershed /></Stop>
      <Stop props={props} id="gears" title="齿轮朋友" subtitle="03 · MECHANICS" position={[3.13, 0.1, -1.72]}>
        <Cube kind="metal" color="#44535d" position={[0, 1.06, -0.17]} scale={[1.93, 1.64, 0.11]} />
        <Cube kind="metal" color="#a5b1b5" position={[0, 1.06, -0.098]} scale={[1.78, 1.5, 0.035]} />
        {[-0.78, 0.78].flatMap(x => [0.44, 1.69].map(y => <Rod key={`${x}-${y}`} kind="metal" color="#394951" position={[x, y, -0.07]} rotation={[Math.PI / 2, 0, 0]} scale={[0.035, 0.016, 0.035]} />))}
        <group position={[-0.4, 1.1, 0]} ref={gears} scale={0.49}><Gear color="#a0aaaf" /></group>
        <group position={[0.42, 1.1, 0]} ref={smallGear} scale={0.327}><Gear teeth={8} color="#ad8f5c" /></group>
      </Stop>
      <Stop props={props} id="bridge" title="小小造桥师" subtitle="04 · ENGINEERING" position={[-3.13, 0.1, 1.55]}>
        <Cube kind="water" color="#477b85" position={[0, 0.235, 0]} scale={[2.15, 0.07, 1.6]} />
        <group scale={0.34} position={[0, 0.27, 0]}><BridgeModel /><group position={[-0.6, 0.846, 0]}><ToyCar /></group></group>
      </Stop>
      <Stop props={props} id="light" title="彩光画室" subtitle="05 · OPTICS" position={[0, 0.1, 1.55]}>
        <Cube kind="metal" color="#40505b" position={[0, 1, -0.49]} scale={[1.95, 1.52, 0.07]} />
        <Cube kind="paint" color="#d9dcda" position={[0, 1.03, -0.44]} scale={[1.8, 1.34, 0.025]} />
        {["#e94735", "#55bc73", "#447bd0"].map((color, i) => <group key={color}>
          <mesh position={[(i - 1) * 0.29, 1.05 + (i === 1 ? 0.17 : 0), -0.416]}><circleGeometry args={[0.32, 32]} /><meshBasicMaterial color={color} transparent opacity={0.58} toneMapped={false} /></mesh>
          <group position={[(i - 1) * 0.61, 0.21, 0.47]} scale={0.53}><Lamp color={color} /></group>
        </group>)}
      </Stop>
      <Stop props={props} id="shapes" title="形状与数量" subtitle="06 · MATHEMATICS" position={[3.13, 0.1, 1.55]}>
        <Cube kind="wood" color="#806d51" position={[0, 0.27, 0]} scale={[1.94, 0.15, 1.6]} />
        <group position={[-0.46, 0.72, -0.17]} rotation={[0, 0.17, 0]}><ShapeToy kind="cube" size={0.45} /></group>
        <group position={[0.45, 0.63, 0.38]}><ShapeToy kind="sphere" size={0.3} /></group>
        <group position={[0.43, 0.77, -0.46]}><ShapeToy kind="cylinder" size={0.45} /></group>
      </Stop>
    </group>
  );
}
