import {
  Component,
  useCallback,
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, OrthographicCamera, PCFSoftShadowMap, SRGBColorSpace } from "three";
import { Environment } from "@react-three/drei";
import type { WorldCanvasProps } from "../types";
import {getExperiment} from "../content/experiments";
import {getLesson} from "../content/lessons";
import { SceneHtmlPortalContext } from "./SceneHtml";

const scenes: Record<string, ComponentType<WorldCanvasProps>> = {
  island: lazy(() => import("../scenes/Island")),
  "day-night": lazy(() => import("../scenes/DayNight")),
  "water-cycle": lazy(() => import("../scenes/WaterCycle")),
  gears: lazy(() => import("../scenes/Gears")),
  bridge: lazy(() => import("../scenes/Bridge")),
  light: lazy(() => import("../scenes/Light")),
  shapes: lazy(() => import("../scenes/Shapes")),
};
const categoryScenes:Record<string,ComponentType<WorldCanvasProps>>={
 S:lazy(()=>import("../scenes/ScienceExperiments")),
 T:lazy(()=>import("../scenes/TechnologyExperiments")),
 E:lazy(()=>import("../scenes/EngineeringExperiments")),
 A:lazy(()=>import("../scenes/ArtExperiments")),
 M:lazy(()=>import("../scenes/MathExperiments")),
};
const names:Record<string,string> = {
  island: "发现小岛",
  "day-night": "昼夜的秘密",
  "water-cycle": "小水滴旅行",
  gears: "齿轮朋友",
  bridge: "小小造桥师",
  light: "彩光画室",
  shapes: "形状与数量",
};

function CameraFit({
  island,
  lesson,
}: {
  island: boolean;
  lesson: WorldCanvasProps["lesson"];
}) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    camera.zoom = Math.min(
      size.width / (island ? 12.4 : 8.5),
      size.height / (island ? 9.4 : 6.6),
    );
    if (island) camera.position.set(7.5, 9.5, 12);
    else if (lesson === "balance-scale" || lesson === "lever") camera.position.set(0, 6.5, 11);
    else if (lesson === "gears" || lesson === "light")
      camera.position.set(1, 5, 13);
    else camera.position.set(5, 6.5, 10);
    camera.lookAt(0, island ? 0.25 : 1.35, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, island, lesson, invalidate]);
  return null;
}

function Illustration({ lesson }: { lesson: WorldCanvasProps["lesson"] }) {
 if(getExperiment(lesson))return <img src={`${import.meta.env.BASE_URL}previews/${lesson}.png`} alt={`${getLesson(lesson)?.title}的三维示意图`} style={{width:"min(100%,360px)",borderRadius:8}}/>;
  return (
    <svg
      viewBox="0 0 360 220"
      role="img"
      aria-label={`${names[lesson]??getLesson(lesson)?.title}的二维示意图`}
      style={{ width: "min(100%, 360px)", height: "auto" }}
    >
      <ellipse cx="180" cy="183" rx="143" ry="25" fill="#d5d8b9" />
      {(lesson === "island" || lesson === "day-night") && (
        <>
          <circle cx="163" cy="111" r="62" fill="#80b6c4" />
          <path
            d="M143 55l-11 30 24 21-20 26 15 28 19-17 17-38-16-30z"
            fill="#acc783"
          />
          <path d="M199 64a62 62 0 010 95z" fill="#395771" opacity=".45" />
          <circle cx="270" cy="60" r="25" fill="#f2c96d" />
          <path
            d="M105 90l-25-15m29 57l-31 6m42 24l-21 24"
            stroke="#d9b576"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {lesson === "water-cycle" && (
        <>
          <ellipse cx="165" cy="160" rx="80" ry="20" fill="#81c4d2" />
          <path
            d="M110 138Q65 93 115 66m105 28q55 34 7 58"
            fill="none"
            stroke="#f0bc68"
            strokeWidth="6"
            strokeDasharray="10 7"
          />
          <g fill="#fdf9ef">
            <ellipse cx="190" cy="70" rx="67" ry="25" />
            <circle cx="175" cy="55" r="26" />
            <circle cx="205" cy="58" r="24" />
          </g>
          <path
            d="M173 104v16m22-13v17m23-24v16"
            stroke="#6fb7c7"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {lesson === "gears" && (
        <>
          <circle
            cx="127"
            cy="112"
            r="42"
            fill="#e9ad5d"
            stroke="#e9ad5d"
            strokeWidth="18"
            strokeDasharray="12 8"
          />
          <circle
            cx="229"
            cy="112"
            r="51"
            fill="#8bb4a4"
            stroke="#8bb4a4"
            strokeWidth="18"
            strokeDasharray="12 8"
          />
          <circle cx="127" cy="112" r="13" fill="#fff2d5" />
          <circle cx="229" cy="112" r="13" fill="#fff2d5" />
        </>
      )}
      {lesson === "bridge" && (
        <>
          <path
            d="M50 165q130-25 260 0"
            fill="none"
            stroke="#91c6cd"
            strokeWidth="22"
          />
          <path
            d="M55 129h250M90 80v78m90-78v78m90-78v78M90 88l90 40 90-40"
            fill="none"
            stroke="#b7875f"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          <rect x="142" y="106" width="36" height="16" rx="5" fill="#ee9576" />
        </>
      )}
      {lesson === "light" && (
        <>
          <rect x="85" y="30" width="190" height="150" rx="12" fill="#d9c39a" />
          <rect x="97" y="42" width="166" height="126" rx="5" fill="#fcf4df" />
          <circle cx="163" cy="99" r="37" fill="#ef8e7a" opacity=".85" />
          <circle cx="203" cy="99" r="37" fill="#8ec181" opacity=".85" />
          <circle cx="183" cy="127" r="37" fill="#91b7d8" opacity=".75" />
        </>
      )}
      {lesson === "shapes" && (
        <>
          <circle cx="100" cy="124" r="38" fill="#efac63" />
          <rect x="152" y="62" width="70" height="88" rx="8" fill="#82afa8" />
          <rect x="235" y="95" width="62" height="73" fill="#a0a6cf" />
          <ellipse cx="266" cy="95" rx="31" ry="12" fill="#b9bddc" />
          <ellipse cx="266" cy="168" rx="31" ry="12" fill="#a0a6cf" />
        </>
      )}
    </svg>
  );
}

function Fallback({ lesson }: { lesson: WorldCanvasProps["lesson"] }) {
  return (
    <div
      role="status"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <Illustration lesson={lesson} />
      <strong style={{ color: "#566348", fontSize: 18 }}>
        {names[lesson]??getLesson(lesson)?.title}
      </strong>
      <p
        style={{
          color: "#827d6b",
          fontSize: 13,
          maxWidth: 320,
          lineHeight: 1.8,
        }}
      >
        这个浏览器暂时无法展示三维互动。你仍然可以看图、阅读字幕、收听讲解。
      </p>
    </div>
  );
}

class CanvasBoundary extends Component<
  { children: ReactNode; lesson: WorldCanvasProps["lesson"] },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Fallback lesson={this.props.lesson} />
    ) : (
      this.props.children
    );
  }
}

function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

function SceneReady({onReady}:{onReady:()=>void}) {
  useEffect(()=>{onReady()},[onReady]);
  return null;
}

export default function WorldCanvas(props: WorldCanvasProps) {
  const [readyLesson,setReadyLesson]=useState<string|null>(null);
  const sceneReady=useCallback(()=>setReadyLesson(props.lesson),[props.lesson]);
  const [overlayTarget, setOverlayTarget] = useState<HTMLDivElement | null>(null);
  const overlayPortal = useMemo(
    () => (overlayTarget ? { current: overlayTarget } : null),
    [overlayTarget],
  );
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const sceneProps = { ...props, paused: props.paused || hidden };
  const [available, setAvailable] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      if (!context) return false;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    } catch {
      return false;
    }
  });
  const Scene = scenes[props.lesson] ?? categoryScenes[getExperiment(props.lesson)?.subject??"S"];
  if (!available) return <Fallback lesson={props.lesson} />;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {readyLesson!==props.lesson&&<div className="scene-loading-overlay" role="status"><span className="scene-loading-ring"/>正在布置科学展台…</div>}
      <div
        ref={setOverlayTarget}
        data-scene-overlays=""
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />
      {overlayPortal && (
        <CanvasBoundary lesson={props.lesson} key={props.lesson}>
          <Canvas
            orthographic
            camera={{ position: [6, 8, 12], zoom: 50, near: 0.1, far: 100 }}
            dpr={[1, 1.5]}
            shadows={{ type: PCFSoftShadowMap }}
            frameloop={sceneProps.paused ? "demand" : "always"}
            gl={{
              alpha: false,
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1.02,
              outputColorSpace: SRGBColorSpace,
              antialias: true,
              powerPreference: "high-performance",
            }}
            style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
            fallback={<Fallback lesson={props.lesson} />}
            aria-label={`${names[props.lesson]??getLesson(props.lesson)?.title}三维互动场景`}
          >
            <SceneHtmlPortalContext.Provider value={overlayPortal}>
              <CameraFit island={props.lesson === "island"} lesson={props.lesson} />
              <ContextGuard onLost={() => setAvailable(false)} />
              <color attach="background" args={[props.lesson === "day-night" ? "#141e29" : "#d0d5d5"]} />
              <Suspense fallback={null}>
                <Environment files={`${import.meta.env.BASE_URL}textures/studio-small-09.hdr`}
                  environmentIntensity={props.lesson === "day-night" ? 0 : 0.65} />
              </Suspense>
              {props.lesson !== "day-night" && (
                <>
                  <ambientLight intensity={0.15} />
                  <hemisphereLight args={["#e7f0f4", "#6b6b64", 0.5]} />
                  <directionalLight
                    position={[-4, 9, 5]}
                    intensity={2.4}
                    castShadow
                    shadow-mapSize={[1536, 1536]}
                    shadow-camera-left={-8}
                    shadow-camera-right={8}
                    shadow-camera-top={8}
                    shadow-camera-bottom={-8}
                    shadow-normalBias={0.025}
                    shadow-bias={-0.0001}
                    shadow-radius={3}
                  />
                </>
              )}
              {props.lesson !== "day-night" && (
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, props.lesson === "island" ? -1.87 : -0.46, 0]}>
                  <planeGeometry args={[200, 200]} />
                  <meshStandardMaterial color="#c4cbcb" roughness={0.94} />
                </mesh>
              )}
              <Suspense fallback={null}>
                <Scene {...sceneProps} />
                <SceneReady onReady={sceneReady}/>
              </Suspense>
            </SceneHtmlPortalContext.Provider>
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}
