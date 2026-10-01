import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { LessonId } from "../types";
import { Globe, ToyCar, BridgeModel, Lamp, ShapeToy } from "./toyModels";
import {
  Ball,
  Cloud,
  Cube,
  Flower,
  Gear,
  Rod,
  Tree,
  WaterDrop,
  useSceneClock,
  type SceneProps,
} from "./shared";

function Stop({
  position,
  title,
  subtitle,
  color,
  id,
  children,
  props,
}: {
  position: [number, number, number];
  title: string;
  subtitle: string;
  color: string;
  id: LessonId;
  children: React.ReactNode;
  props: SceneProps;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      scale={hovered ? 1.06 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "";
        props.onSelect?.(id);
      }}
    >
      <Rod color={color} scale={[1.04, 0.14, 0.96]} position={[0, 0.04, 0]} />
      <Rod color="#fff4dc" scale={[0.87, 0.07, 0.8]} position={[0, 0.15, 0]} />
      {children}
      <Html
        center
        position={[0, -0.12, 1.05]}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          className="island-stop-label"
          aria-label={`探索${title}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onSelect?.(id);
          }}
          style={{
            border: "1px solid #fff8e9",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 56,
            minWidth: 104,
            cursor: "pointer",
            borderRadius: 16,
            padding: "7px 12px",
            background: hovered ? "#fffaf0" : "rgba(255,252,241,.91)",
            color: "#4f5842",
            boxShadow: "0 4px 16px #66553312",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            transition: "transform .2s",
            transform: hovered ? "translateY(-3px)" : "",
          }}
        >
          <span className="island-full-title" style={{ fontSize: 13, fontWeight: 800 }}>{title}</span>
          <span className="island-short-title">{{"day-night":"昼夜","water-cycle":"水滴",gears:"齿轮",bridge:"小桥",light:"彩光",shapes:"形状"}[id]}</span>
          <span
            className="island-subtitle"
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: ".08em",
              color: "#a4967f",
              marginTop: 3,
            }}
          >
            {subtitle}
          </span>
        </button>
      </Html>
    </group>
  );
}
export default function Island(props: SceneProps) {
  const cloud = useRef<Group>(null),
    earth = useRef<Group>(null),
    gears = useRef<Group>(null);
  const time = useSceneClock(props);
  useFrame(() => {
    if (cloud.current)
      cloud.current.position.y = Math.sin(time.current * 0.6) * 0.07;
    if (earth.current) earth.current.rotation.y = time.current * 0.12;
    if (gears.current) gears.current.rotation.z = -time.current * 0.14;
  });
  return (
    <group position={[0, -0.5, 0]}>
      <Rod color="#b99065" scale={[5.35, 0.62, 4.1]} position={[0, -0.49, 0]} />
      <Rod
        color="#dbbf8a"
        scale={[5.46, 0.29, 4.21]}
        position={[0, -0.12, 0]}
      />
      <Rod color="#b4ce8d" scale={[5.5, 0.17, 4.24]} position={[0, 0.1, 0]} />
      <Rod color="#c6d89d" scale={[5.1, 0.028, 3.86]} position={[0, 0.2, 0]} />
      {Array.from({ length: 25 }, (_, i) => {
        const angle = (i / 25) * Math.PI * 2;
        return (
          <Ball
            key={i}
            color={i % 2 ? "#e7d4a7" : "#f0dfb6"}
            position={[Math.cos(angle) * 2.2, 0.24, Math.sin(angle) * 1.72]}
            scale={[0.28, 0.045, 0.18]}
            rotation={[0, -angle, 0]}
          />
        );
      })}
      <Stop
        props={props}
        id="day-night"
        title="昼夜的秘密"
        subtitle="SCIENCE"
        color="#a4c7ba"
        position={[-2.85, 0.25, -1.95]}
      >
        <group ref={earth} position={[0, 1.12, 0]} scale={0.61}>
          <Globe small />
        </group>
        <Rod color="#b68c5b" position={[0, 0.28, 0]} scale={[0.4, 0.2, 0.4]} />
        <Ball color="#ffd176" scale={0.28} position={[0.94, 1.69, 0.06]} />
      </Stop>
      <Stop
        props={props}
        id="water-cycle"
        title="小水滴旅行"
        subtitle="NATURE"
        color="#a6cdd0"
        position={[0, 0.25, -2.35]}
      >
        <Rod
          color="#79b9c6"
          position={[0, 0.23, 0]}
          scale={[0.72, 0.05, 0.65]}
        />
        <group ref={cloud}>
          <Cloud position={[0, 1.6, -0.1]} scale={0.69} />
        </group>
        <WaterDrop position={[0, 0.7, 0.15]} scale={0.8} />
        <WaterDrop position={[0.55, 1, 0.15]} scale={0.16} />
        <WaterDrop position={[-0.48, 1.05, 0.15]} scale={0.13} />
      </Stop>
      <Stop
        props={props}
        id="gears"
        title="齿轮朋友"
        subtitle="TECHNOLOGY"
        color="#ecc584"
        position={[2.85, 0.25, -1.8]}
      >
        <Cube
          color="#e8d6b0"
          position={[0, 0.9, -0.15]}
          scale={[1.6, 1.35, 0.17]}
        />
        <group position={[-0.43, 1, 0]} scale={0.59}>
          <Gear color="#eca559" />
        </group>
        <group position={[0.47, 1, 0]} scale={0.38} ref={gears}>
          <Gear teeth={8} color="#7ea99b" />
        </group>
      </Stop>
      <Stop
        props={props}
        id="bridge"
        title="小小造桥师"
        subtitle="ENGINEERING"
        color="#d3cfa1"
        position={[-2.8, 0.25, 1.26]}
      >
        <Rod
          color="#82bec4"
          position={[0, 0.2, 0]}
          scale={[0.83, 0.035, 0.71]}
        />
        <group scale={0.32} position={[0, 0.21, 0]}>
          <BridgeModel />
          <group position={[-0.6, 0.93, 0]}>
            <ToyCar />
          </group>
        </group>
        <Tree scale={0.34} position={[-0.66, 0.22, -0.4]} />
      </Stop>
      <Stop
        props={props}
        id="light"
        title="彩光画室"
        subtitle="ART"
        color="#ddb8a5"
        position={[0, 0.25, 1.75]}
      >
        <Cube
          color="#ead6ac"
          position={[0, 1, -0.25]}
          scale={[1.5, 1.3, 0.12]}
        />
        <Cube
          color="#fff5d9"
          position={[0, 1.03, -0.175]}
          scale={[1.3, 1.08, 0.025]}
        />
        {["#f49883", "#9fc383", "#92b7d3"].map((color, i) => (
          <group key={color}>
            <Ball
              color={color}
              scale={[0.26, 0.26, 0.025]}
              position={[(i - 1) * 0.29, 1.04 + (i === 1 ? 0.15 : 0), -0.13]}
            />
            <group position={[(i - 1) * 0.52, 0.23, 0.3]} scale={0.46}>
              <Lamp color={color} />
            </group>
          </group>
        ))}
      </Stop>
      <Stop
        props={props}
        id="shapes"
        title="形状与数量"
        subtitle="MATH"
        color="#c5c2d5"
        position={[2.88, 0.25, 1.4]}
      >
        <group position={[-0.35, 0.63, 0]}>
          <ShapeToy kind="cube" size={0.43} />
        </group>
        <group position={[0.4, 0.55, 0.24]}>
          <ShapeToy kind="sphere" size={0.34} />
        </group>
        <group position={[0.29, 0.99, -0.14]} rotation={[0, 0, -0.2]}>
          <ShapeToy kind="cylinder" size={0.3} />
        </group>
      </Stop>
      {[
        [-4.3, 0.2, -1.4, 0.75],
        [-4.3, 0.2, 0.6, 0.5],
        [-1.45, 0.2, -3.3, 0.7],
        [1.8, 0.2, -3.25, 0.65],
        [4.25, 0.2, -1, 0.68],
        [4.1, 0.2, 1.35, 0.5],
        [-1.5, 0.2, 3.1, 0.4],
      ].map(([x, y, z, s], i) => (
        <Tree
          key={i}
          position={[x, y, z]}
          scale={s}
          color={i % 2 ? "#90af65" : "#739357"}
        />
      ))}
      {[
        [-3.6, 0.25, 2.35],
        [-3.8, 0.25, 1.9],
        [-1.35, 0.25, 0.7],
        [-1.5, 0.25, 0.5],
        [1.75, 0.25, 2.8],
        [2.05, 0.25, 2.8],
        [3.85, 0.25, 0.4],
        [1.6, 0.25, -1.2],
      ].map((p, i) => (
        <Flower
          key={i}
          position={p as [number, number, number]}
          color={i % 3 === 0 ? "#ed9776" : "#f4cc74"}
        />
      ))}
      <group position={[-0.4, 0.23, -0.05]}>
        <Rod
          color="#bc9064"
          scale={[0.08, 0.72, 0.08]}
          position={[0, 0.38, 0]}
        />
        <Cube
          color="#ffebbd"
          position={[0, 0.75, 0]}
          scale={[0.9, 0.3, 0.12]}
        />
        <Ball color="#f0ad6c" position={[0, 1.03, 0]} scale={0.12} />
      </group>
      <Cloud position={[-4.8, 3.1, -3.2]} scale={0.7} />
      <Cloud position={[4.7, 3.4, -3]} scale={0.48} />
      <Ball
        color="#dec49b"
        position={[4.42, -0.12, 2.76]}
        scale={[0.5, 0.23, 0.42]}
      />
      <Ball
        color="#e6cda5"
        position={[-4.83, -0.12, 2]}
        scale={[0.37, 0.22, 0.33]}
      />
    </group>
  );
}
