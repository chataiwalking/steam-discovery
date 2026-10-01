import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  Headphones,
  Home,
  Leaf,
  Lightbulb,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Shapes,
  Sparkles,
  Star as StarIcon,
  Volume2,
  X,
  Minus,
  Sun,
  Moon,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { lessons } from "./content/lessons";
import type {
  AgeBand,
  LessonDefinition,
  LessonId,
  WorldAction,
  WorldState,
  ShapeKind,
} from "./types";
import {
  ageBands,
  defaultWorld,
  defaultEvidence,
  isDay,
  lightHex,
  taskComplete,
  taskHint,
} from "./learning";
import { useNarration } from "./hooks/useNarration";
import { Illustration, Star } from "./components/Illustrations";
const WorldCanvas = lazy(() => import("./components/WorldCanvas"));
const shapeNames: Record<ShapeKind, string> = {
  sphere: "小球",
  cube: "方块",
  cylinder: "圆柱",
};
function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing still supports this session. */
  }
}
function route() {
  const match = location.hash.match(/^#\/lesson\/([\w-]+)(?:\?age=([\d-]+))?/);
  return {
    id: match?.[1] as LessonId | undefined,
    age: match?.[2] as AgeBand | undefined,
  };
}
function App() {
  const initial = route();
  const storedAge = readStore<AgeBand>("discovery-age", "4-5");
  const [age, setAge] = useState<AgeBand>(
    ageBands.includes(initial.age!)
      ? initial.age!
      : ageBands.includes(storedAge)
        ? storedAge
        : "4-5",
  );
  const [lessonId, setLessonId] = useState<LessonId | undefined>(initial.id);
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const v = readStore<unknown>("discovery-progress", {});
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, boolean>)
      : {};
  });
  const [modal, setModal] = useState<"discoveries" | "guide" | null>(null);
  useEffect(() => {
    const fn = () => {
      const r = route();
      setLessonId(r.id);
      if (ageBands.includes(r.age!)) setAge(r.age!);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    saveStore("discovery-age", age);
  }, [age]);
  useEffect(() => {
    saveStore("discovery-progress", completed);
  }, [completed]);
  useEffect(() => {
    if (!modal) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [modal]);
  const openLesson = useCallback(
    (id: LessonId) => {
      location.hash = `/lesson/${id}?age=${age}`;
    },
    [age],
  );
  const current = lessons.find((x) => x.id === lessonId);
  const count = lessons.filter((l) => completed[`${l.id}:${age}`]).length;
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="小小发现家首页">
          <span className="brand-symbol">
            <Sparkles size={25} />
          </span>
          <span>
            小小发现家<small>STEAM EXPLORER</small>
          </span>
        </a>
        <nav aria-label="主导航">
          <a href="#/" className={!current ? "nav-active" : ""}>
            <Compass size={17} />
            探索小岛
          </a>
          <button onClick={() => setModal("discoveries")}>
            <StarIcon size={17} />
            我的发现{count > 0 && <i>{count}</i>}
          </button>
        </nav>
        <button className="parent-button" onClick={() => setModal("guide")}>
          <Settings2 size={17} />
          <span>家长指南</span>
        </button>
      </header>
      {current ? (
        <Lesson
          key={`${current.id}:${age}`}
          lesson={current}
          age={age}
          completed={!!completed[`${current.id}:${age}`]}
          onComplete={() =>
            setCompleted((p) => ({ ...p, [`${current.id}:${age}`]: true }))
          }
        />
      ) : (
        <main className="home-page">
          <section className="home-hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span />
                观察 · 实验 · 发现
              </span>
              <h1>
                世界这么大，
                <br />
                一起动手
                <span className="title-answer">
                  找答案
                  <svg viewBox="0 0 240 15">
                    <path d="M3 9Q115-4 234 7M12 14Q119 4 217 11" />
                  </svg>
                </span>
                <span className="title-dot">。</span>
              </h1>
              <p className="hero-description">
                转一转地球，搭一座小桥，看看光的颜色。
                <br />
                走近真实的物体，亲手发现身边的科学。
              </p>
              <div className="hero-actions">
                <button
                  className="primary"
                  onClick={() =>
                    openLesson(
                      lessons.find((l) => !completed[`${l.id}:${age}`])?.id ??
                        "day-night",
                    )
                  }
                >
                  <Compass size={20} />
                  开始今天的探索
                  <ArrowRight size={19} />
                </button>
                <a
                  className="quiet-link"
                  href="#worlds"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("worlds")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  先逛逛小岛
                  <ChevronRight size={17} />
                </a>
              </div>
              <div className="hero-promise">
                <span>
                  <Shapes size={15} />
                  亲手玩一玩
                </span>
                <span>
                  <Headphones size={15} />
                  讲给你听
                </span>
                <span>
                  <Leaf size={15} />
                  按年龄探索
                </span>
              </div>
            </div>
            <div className="island-wrap">
              <div className="island-wash" />
              <div className="island-label">
                <span className="tiny-sun">✳</span>SCIENCE IN YOUR HANDS
              </div>
              <Suspense
                fallback={
                  <div className="canvas-loading">
                    <LoaderCircle />
                    展台正在准备…
                  </div>
                }
              >
                <WorldCanvas
                  lesson="island"
                  state={defaultWorld()}
                  paused={false}
                  narrationTime={0}
                  narrationActive={false}
                  demo={false}
                  onSelect={openLesson}
                />
              </Suspense>
              <span className="island-note">
                <span>↖</span> 点击展台上的装置，开始探索
              </span>
              <span className="floating-spark spark-one">✧</span>
              <span className="floating-spark spark-two">✦</span>
              <div className="hero-stamp">
                <Star />
                <span>
                  每个为什么
                  <br />
                  <b>都值得被发现</b>
                </span>
              </div>
            </div>
          </section>
          <section className="learning-path" aria-label="学习年龄">
            <div>
              <span className="small-label">选一个适合你的起点</span>
              <h2>小小年纪，大大好奇</h2>
            </div>
            <div className="age-options">
              {ageBands.map((a, i) => (
                <button
                  key={a}
                  aria-pressed={age === a}
                  onClick={() => setAge(a)}
                  className={age === a ? "selected" : ""}
                >
                  <span className="age-icon">
                    {i === 0 ? <Leaf /> : i === 1 ? <Lightbulb /> : <Compass />}
                  </span>
                  <span>
                    <b>{a.replace("-", "–")} 岁</b>
                    <small>{["感官探索", "因果实验", "发现挑战"][i]}</small>
                  </span>
                  {age === a && <Check size={17} />}
                </button>
              ))}
            </div>
            <div className="age-note">
              同一个世界
              <br />
              <strong>不一样的发现</strong>
            </div>
          </section>
          <section className="worlds-section" id="worlds">
            <div className="section-heading">
              <div>
                <span className="small-label">六个小世界 · 无数个为什么</span>
                <h2>
                  今天，想发现什么？ <Sparkles size={24} />
                </h2>
              </div>
              <span className="progress-label">
                <StarIcon size={17} />
                <b>{count}</b> / 6 个世界已探索
              </span>
            </div>
            <div className="lesson-grid">
              {lessons.map((l, index) => (
                <button
                  className="lesson-card"
                  key={l.id}
                  onClick={() => openLesson(l.id)}
                  style={{ "--card-color": l.color } as React.CSSProperties}
                >
                  <div className="card-art">
                    <span className="card-category">{l.category}</span>
                    <Illustration id={l.id} />
                    <span className="card-number">0{index + 1}</span>
                    {completed[`${l.id}:${age}`] && (
                      <span className="card-done">
                        <Check size={14} />
                        已发现
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <div>
                      <h3>{l.title}</h3>
                      <p>{l.subtitle}</p>
                    </div>
                    <span className="round-arrow">
                      <ArrowRight size={20} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="curiosity-note">
            <Star />
            <div>
              <h2>不用急着答对，先大胆试试看。</h2>
              <p>每一次点击、每一个“咦？”，都是发现世界的第一步。</p>
            </div>
            <span className="hand-drawn-flower">✳</span>
          </section>
        </main>
      )}
      <footer>
        <a className="footer-brand" href="#/">
          <Sparkles size={16} />
          小小发现家
        </a>
        <span>让好奇心发芽，让发现发生。</span>
        <button onClick={() => setModal("guide")}>
          陪伴探索指南
          <ArrowRight size={14} />
        </button>
      </footer>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close-button"
              aria-label="关闭"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            {modal === "discoveries" ? (
              <>
                <Star className="modal-star" />
                <span className="small-label">好奇心的足迹</span>
                <h2 id="modal-title">我的发现收藏</h2>
                <p>每次完成探索，就把一颗发现星装进口袋。</p>
                <div className="discovery-list">
                  {lessons.map((l) => (
                    <div key={l.id}>
                      <span>{l.title}</span>
                      <span>
                        {ageBands.map((a) => (
                          <span
                            className={`age-star ${completed[`${l.id}:${a}`] ? "earned" : ""}`}
                            key={a}
                            title={`${a}岁`}
                          >
                            <StarIcon size={17} />
                            <small>{a}</small>
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="fine-print">探索记录保存在这台设备的浏览器里。</p>
              </>
            ) : (
              <>
                <span className="guide-icon">
                  <Leaf />
                </span>
                <span className="small-label">一起发现，比讲出答案更重要</span>
                <h2 id="modal-title">给大朋友的陪伴指南</h2>
                <div className="guide-list">
                  <p>
                    <b>2–3 岁 · 一起点一点</b>
                    陪孩子认颜色、形状和声音，用“你看到了什么”开始聊天。
                  </p>
                  <p>
                    <b>4–5 岁 · 试试会怎样</b>
                    鼓励先猜一猜，再亲手改变一个条件，观察不同。
                  </p>
                  <p>
                    <b>6–8 岁 · 找到小规律</b>
                    让孩子解释自己的发现，再换一种方法验证。
                  </p>
                </div>
                <p className="guide-tip">
                  讲解可以随时暂停、重听；完成后还能自由玩。动画是帮助理解的简化示意，桥梁实验不代表真实工程承重。
                </p>
                <p className="fine-print">
                  中文讲解由本地语音模型制作。首次点击“听讲解”后播放。
                </p>
                <button
                  className="text-button"
                  onClick={() => {
                    if (window.confirm("清空这台设备上的全部探索记录？"))
                      setCompleted({});
                  }}
                >
                  清空本机探索记录
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
function Lesson({
  lesson,
  age,
  completed,
  onComplete,
}: {
  lesson: LessonDefinition;
  age: AgeBand;
  completed: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0),
    [w, setW] = useState(defaultWorld),
    [e, setE] = useState(defaultEvidence),
    [paused, setPaused] = useState(false),
    [carBusy,setCarBusy]=useState(false),
    [hidden, setHidden] = useState(document.hidden),
    [celebrate, setCelebrate] = useState(false),
    [feedback, setFeedback] = useState("");
  const track = lesson.tracks[age],
    narration = useNarration(track.steps[step].clip);
  useEffect(() => {
    const fn = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, []);
  const update = (
    next: WorldState,
    changes: Partial<ReturnType<typeof defaultEvidence>> = {},
  ) => {
    setW(next);
    setE((prev) => ({ ...prev, ...changes, actions: prev.actions + 1 }));
    setFeedback("");
  };
  function rotate() {
    const rotation = w.rotation + Math.PI / 2;
    update(
      { ...w, rotation },
      { day: e.day || isDay(rotation), night: e.night || !isDay(rotation) },
    );
  }
  function water(stage: number) {
    const order =
      age === "6-8" && step === 2
        ? [...w.waterOrder, stage].slice(-3)
        : w.waterOrder;
    update(
      { ...w, waterStage: stage, waterOrder: order },
      { water: [...new Set([...e.water, stage])] },
    );
    if (age === "6-8" && step === 2 && order.some((x, i) => x !== i + 1))
      setFeedback(
        "再想一想：水先变成水蒸气，接着变成云，最后呢？可以点“重新试试”。",
      );
  }
  function gear() {
    update({ ...w, gearRunning: !w.gearRunning });
  }
  function bridgeRun() {
    if(carBusy)return;
    if (!w.deck) {setFeedback("先给小桥放上桥面吧。");return;}
    setCarBusy(true);
    update({...w,carRun:w.carRun+1});
    setFeedback("观察小车走过小桥，看看桥身有没有变化。");
  }
  function bridgeFinished(runId:number) {
    if(!carBusy||runId!==w.carRun)return;
    setCarBusy(false);
    setE(prev=>({...prev,crossed:true,pierCrossed:prev.pierCrossed||w.pier,bridgeBefore:prev.bridgeBefore||!w.braces,bridgeAfter:prev.bridgeAfter||(w.braces&&prev.bridgeBefore)}));
    setFeedback(w.braces?"有了三角形支撑，这座模型小桥更稳了。":"小车到达了对岸，再试试添加支撑。");
  }
  function light(index: number, value?: number) {
    const lights = [...w.lights] as WorldState["lights"];
    lights[index] = value ?? (lights[index] > 0 ? 0 : 1);
    update(
      { ...w, lights },
      {
        colors: [
          ...new Set([...e.colors, ...(lights[index] > 0 ? [index] : [])]),
        ],
      },
    );
  }
  function addShape(kind: ShapeKind) {
    if (w.shapes.length >= 10) {
      setFeedback("托盘最多放十个，取走一个再试试。");
      return;
    }
    update(
      { ...w, shapeKind: kind, shapes: [...w.shapes, kind], sorted: 0 },
      { sortedKinds: [] },
    );
  }
  function onAction(action: WorldAction) {
    if (step === 0) return;
    switch (action.type) {
      case "rotate":
        rotate();
        break;
      case "water":
        water(action.stage);
        break;
      case "gear":
        gear();
        break;
      case "bridge":
        bridgeRun();
        break;
      case "bridge-finished":
        bridgeFinished(action.runId);
        break;
      case "light":
        light(action.index);
        break;
      case "shape":
        addShape(action.kind);
        break;
    }
  }
  function reset() {
    narration.stop();
    setCarBusy(false);
    setW(defaultWorld());
    setE(defaultEvidence());
    setPaused(false);
    setFeedback("");
    setCelebrate(false);
  }
  function changeStep(next: number) {
    narration.stop();
    setCarBusy(false);
    setStep(next);
    setPaused(false);
    setFeedback("");
    if (next > 0) {
      setW(defaultWorld());
      setE(defaultEvidence());
    }
    setCelebrate(false);
  }
  const ready = taskComplete(lesson.id, age, step, w, e);
  function predict(day: boolean) {
    const result = isDay(w.rotation + Math.PI);
    if (day === result) {
      update(
        { ...w, rotation: w.rotation + Math.PI },
        { prediction: true, day: e.day || result, night: e.night || !result },
      );
      setFeedback("发现啦！地球转动，小屋就从一面来到另一面。");
    } else setFeedback("再观察一下小屋现在的位置，转半圈后它会面对太阳吗？");
  }
  const effectivePaused = paused || narration.status === "paused";
  const stageLabels = ["看一看", "动手试", "发现规律"];
  return (
    <main className="lesson-page" data-lesson={lesson.id} data-age={age}>
      <div className="lesson-topline">
        <a className="back-link" href="#/">
          <ArrowLeft size={18} />
          回到小岛
        </a>
        <span>
          {age.replace("-", "–")} 岁 ·{" "}
          {age === "2-3" ? "感官探索" : age === "4-5" ? "因果实验" : "发现挑战"}
        </span>
        <span className="lesson-earned">
          {completed ? (
            <>
              <CheckCircle2 size={16} />
              已经发现，欢迎再玩
            </>
          ) : (
            <>
              <StarIcon size={16} />
              一颗发现星等着你
            </>
          )}
        </span>
      </div>
      <div className="lesson-title-row">
        <div>
          <span className="small-label">
            {lesson.category} · {lesson.subtitle}
          </span>
          <h1>{lesson.title}</h1>
        </div>
        <div className="lesson-stepper">
          {stageLabels.map((label, i) => (
            <button
              key={label}
              className={step === i ? "current" : step > i ? "past" : ""}
              disabled={i > step}
              onClick={() => changeStep(i)}
            >
              <span>{step > i ? <Check size={15} /> : i + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="lesson-workspace">
        <section className="experiment">
          <div className="experiment-badges">
            <span>
              <span className="live-dot" />
              你的三维小实验
            </span>
            <button
              onClick={() => {
                if (narration.status === "playing") {
                  narration.pause();
                  setPaused(true);
                } else if (narration.status === "paused") {
                  void narration.play();
                  setPaused(false);
                } else setPaused((p) => !p);
              }}
              aria-label={effectivePaused ? "继续动画" : "暂停动画"}
            >
              {effectivePaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
          <div className="experiment-canvas">
            <Suspense
              fallback={
                <div className="canvas-loading">
                  <LoaderCircle />
                  实验正在准备…
                </div>
              }
            >
              <WorldCanvas
                lesson={lesson.id}
                state={w}
                paused={paused || hidden || narration.status === "paused"}
                narrationTime={narration.time}
                narrationActive={narration.active}
                demo={step === 0}
                onAction={onAction}
              />
            </Suspense>
          </div>
          <div className="scene-caption">
            {step === 0 ? (
              <>
                <Volume2 size={16} />
                点击右侧“听讲解”，看看这个世界怎样变化
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                {taskHint(lesson.id, age)}
              </>
            )}
          </div>
          <div className="science-note">
            <span>发现小知识</span>
            {lesson.fact}
          </div>
        </section>
        <aside className="lesson-sidebar">
          <section className="narration-card">
            <div className="narration-heading">
              <span className="narrator-icon">
                <Headphones size={23} />
              </span>
              <div>
                <span>小岛讲解员</span>
                <h2>{track.steps[step].title}</h2>
              </div>
              <span className="step-count">0{step + 1} / 03</span>
            </div>
            <p className="narration-text" aria-live="polite">
              {track.steps[step].clip.text}
            </p>
            <div className="audio-progress">
              <span
                style={{
                  width: `${narration.duration ? Math.min(100, (narration.time / narration.duration) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="audio-controls">
              <button
                className="audio-play"
                onClick={() => {
                  setPaused(false);
                  if (narration.status === "playing") narration.pause();
                  else void narration.play();
                }}
                disabled={narration.status === "loading"}
              >
                {narration.status === "loading" ? (
                  <LoaderCircle className="spin" size={18} />
                ) : narration.status === "playing" ? (
                  <Pause size={18} />
                ) : (
                  <Volume2 size={18} />
                )}{" "}
                {narration.status === "playing"
                  ? "暂停讲解"
                  : narration.status === "paused"
                    ? "继续讲解"
                    : narration.status === "error"
                      ? "重试播放"
                      : "听讲解"}
              </button>
              <button
                className="replay"
                onClick={() => {
                  setPaused(false);
                  void narration.play(true);
                }}
                aria-label="重听这一段"
              >
                <RotateCcw size={17} />
                重听
              </button>
              <span className="audio-time">
                {Math.floor(narration.time)} / {Math.ceil(narration.duration)}{" "}
                秒
              </span>
            </div>
            {narration.status === "error" && (
              <p role="alert" className="audio-error">
                声音暂时没能播放。可以重试，也可以先读字幕继续探索。
              </p>
            )}
          </section>
          <section className="controls-card">
            <div className="controls-heading">
              <span>{step === 0 ? "准备好出发了吗？" : "轮到你来试试"}</span>
              {step > 0 && (
                <button onClick={reset}>
                  <RotateCcw size={15} />
                  重新试试
                </button>
              )}
            </div>
            {step === 0 ? (
              <div className="intro-task">
                <span className="intro-bulb">
                  <Lightbulb size={31} />
                </span>
                <p>{track.goal}</p>
                <small>先听一听，再亲手发现。</small>
              </div>
            ) : (
              <>
                <p className="task-instruction">{taskHint(lesson.id, age)}</p>
                <div className="lesson-controls">
                  {lesson.id === "day-night" && (
                    <>
                      <div className="day-status">
                        {isDay(w.rotation) ? <Sun /> : <Moon />}
                        <span>
                          小屋现在是<b>{isDay(w.rotation) ? "白天" : "黑夜"}</b>
                        </span>
                      </div>
                      {age === "6-8" && step === 2 ? (
                        <div className="control-pair">
                          <button onClick={() => predict(true)}>
                            <Sun size={20} />
                            转半圈后是白天
                          </button>
                          <button onClick={() => predict(false)}>
                            <Moon size={20} />
                            转半圈后是黑夜
                          </button>
                        </div>
                      ) : (
                        <button className="wide-control" onClick={rotate}>
                          <RotateCcw size={20} />
                          转动地球
                        </button>
                      )}
                    </>
                  )}
                  {lesson.id === "water-cycle" && (
                    <>
                      <div className="water-buttons">
                        {["蒸发", "凝结", "降雨"].map((label, i) => (
                          <button
                            key={label}
                            onClick={() => water(i + 1)}
                            aria-pressed={w.waterStage === i + 1}
                          >
                            <span>{["↑", "☁", "↓"][i]}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                      {age === "6-8" && step === 2 && (
                        <div
                          className="sequence-slots"
                          aria-label="你排列的水循环顺序"
                        >
                          {[0, 1, 2].map((i) => (
                            <span key={i}>
                              {w.waterOrder[i]
                                ? ["", "蒸发", "凝结", "降雨"][w.waterOrder[i]]
                                : "？"}
                              {i < 2 && <ChevronRight size={13} />}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {lesson.id === "gears" && (
                    <>
                      <button className="wide-control" onClick={gear}>
                        {w.gearRunning ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} />
                        )}{" "}
                        {w.gearRunning ? "停止齿轮" : "启动齿轮"}
                      </button>
                      {age !== "2-3" && (
                        <button
                          className="wide-control secondary-control"
                          onClick={() =>
                            update(
                              {
                                ...w,
                                gearDirection: w.gearDirection === 1 ? -1 : 1,
                              },
                              { reversed: true },
                            )
                          }
                        >
                          <RotateCcw size={18} />
                          换个转动方向
                        </button>
                      )}
                      {age === "6-8" && (
                        <div className="segmented-control">
                          <button
                            aria-pressed={w.gearTeeth === 12}
                            onClick={() => update({ ...w, gearTeeth: 12 })}
                          >
                            右边 12 齿
                          </button>
                          <button
                            aria-pressed={w.gearTeeth === 24}
                            onClick={() =>
                              update({ ...w, gearTeeth: 24 }, { ratio: true })
                            }
                          >
                            右边 24 齿
                          </button>
                        </div>
                      )}
                      <small className="control-note">
                        相邻的两个齿轮，转动方向相反。
                      </small>
                    </>
                  )}
                  {lesson.id === "bridge" && (
                    <>
                      <div className="bridge-parts">
                        {(
                          [
                            { key: "deck", label: "桥面" },
                            ...(age !== "2-3"
                              ? [{ key: "pier", label: "桥墩" }]
                              : []),
                            ...(age === "6-8"
                              ? [{ key: "braces", label: "斜撑" }]
                              : []),
                          ] as {
                            key: "deck" | "pier" | "braces";
                            label: string;
                          }[]
                        ).map((p) => (
                          <button
                            key={p.key}
                            disabled={carBusy}
                            aria-pressed={w[p.key]}
                            onClick={() => update({ ...w, [p.key]: !w[p.key] })}
                          >
                            {w[p.key] ? (
                              <Check size={17} />
                            ) : (
                              <Plus size={17} />
                            )}{" "}
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <button className="wide-control" onClick={bridgeRun} disabled={carBusy}>
                        <ArrowRight size={20} />
                        {carBusy?"小车正在过桥…":"让小车过桥"}
                      </button>
                      {age === "6-8" && (
                        <div className="comparison">
                          <span className={e.bridgeBefore ? "checked" : ""}>
                            <CheckCircle2 size={14} />
                            试过没有斜撑
                          </span>
                          <span className={e.bridgeAfter ? "checked" : ""}>
                            <CheckCircle2 size={14} />
                            试过有斜撑
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {lesson.id === "light" && (
                    <>
                      <div className="light-buttons">
                        {["红灯", "绿灯", "蓝灯"].map((name, i) => (
                          <button
                            key={name}
                            style={
                              {
                                "--light-color": [
                                  "#dc7768",
                                  "#6d9f78",
                                  "#76a8cd",
                                ][i],
                              } as React.CSSProperties
                            }
                            aria-pressed={w.lights[i] > 0}
                            onClick={() => light(i)}
                          >
                            <span className="bulb-dot" />
                            {name}
                            {w.lights[i] > 0 && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                      {age === "6-8" && (
                        <div className="light-sliders">
                          {["红光亮度", "绿光亮度", "蓝光亮度"].map(
                            (name, i) => (
                              <label key={name}>
                                {name}
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={w.lights[i]}
                                  onChange={(ev) =>
                                    light(i, Number(ev.target.value))
                                  }
                                />
                              </label>
                            ),
                          )}
                        </div>
                      )}
                      <div className="mixed-light">
                        <span style={{ backgroundColor: lightHex(w.lights) }} />
                        <small>画板上的光</small>
                      </div>
                    </>
                  )}
                  {lesson.id === "shapes" && (
                    <>
                      <div className="shape-options">
                        {(["sphere", "cube", "cylinder"] as ShapeKind[]).map(
                          (kind) => (
                            <button
                              key={kind}
                              aria-pressed={w.shapeKind === kind}
                              onClick={() =>
                                setW((p) => ({ ...p, shapeKind: kind }))
                              }
                            >
                              <span>
                                {kind === "sphere"
                                  ? "●"
                                  : kind === "cube"
                                    ? "■"
                                    : "▰"}
                              </span>
                              {shapeNames[kind]}
                            </button>
                          ),
                        )}
                      </div>
                      <div className="count-controls">
                        <button
                          aria-label="取走一个"
                          onClick={() =>
                            update(
                              {
                                ...w,
                                shapes: w.shapes.slice(0, -1),
                                sorted: 0,
                              },
                              { sortedKinds: [] },
                            )
                          }
                          disabled={!w.shapes.length}
                        >
                          <Minus size={22} />
                        </button>
                        <span>
                          <b>{w.shapes.length}</b> 个物体
                        </span>
                        <button
                          aria-label={`添加${shapeNames[w.shapeKind]}`}
                          onClick={() => addShape(w.shapeKind)}
                        >
                          <Plus size={22} />
                        </button>
                      </div>
                      {age === "4-5" && (
                        <>
                          <p className="sort-label">
                            选择形状，再放进对应的分类托盘
                          </p>
                          <button
                            className="wide-control secondary-control"
                            onClick={() => {
                              if (e.sortedKinds.includes(w.shapeKind)) {
                                setFeedback(
                                  "这个形状已经分好啦，选另一个形状试试。",
                                );
                                return;
                              }
                              const amount = w.shapes.filter(
                                (x) => x === w.shapeKind,
                              ).length;
                              if (!amount) {
                                setFeedback("先添加这个形状，再来分类。");
                                return;
                              }
                              const kinds = [...e.sortedKinds, w.shapeKind];
                              const ordered = [
                                ...w.shapes.filter((x) => kinds.includes(x)),
                                ...w.shapes.filter((x) => !kinds.includes(x)),
                              ];
                              update(
                                {
                                  ...w,
                                  shapes: ordered,
                                  sorted: w.sorted + amount,
                                },
                                { sortedKinds: kinds },
                              );
                            }}
                          >
                            把{shapeNames[w.shapeKind]}放入分类托盘
                          </button>
                          <small className="control-note">
                            已分类 {w.sorted} / {w.shapes.length} 个
                          </small>
                        </>
                      )}
                    </>
                  )}
                </div>
                {feedback && (
                  <p role="status" className="experiment-feedback">
                    {feedback}
                  </p>
                )}
                {step === 2 && ready && (
                  <div className="task-success" role="status">
                    <CheckCircle2 size={19} />
                    {track.success}
                  </div>
                )}
              </>
            )}
            <button
              className="primary next-button"
              disabled={!ready}
              onClick={() => {
                if (step < 2) changeStep(step + 1);
                else {
                  onComplete();
                  setCelebrate(true);
                }
              }}
            >
              {step === 0 ? (
                <>
                  <span>我来试试看</span>
                  <ArrowRight size={18} />
                </>
              ) : step === 1 ? (
                <>
                  <span>去发现小规律</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <StarIcon size={19} />
                  <span>
                    {completed ? "再收下一颗好奇心" : "收下这颗发现星"}
                  </span>
                </>
              )}
            </button>
          </section>
        </aside>
      </div>
      <div className="lesson-bottom">
        <span>
          <Leaf size={16} />
          不用着急，按照自己的节奏来。
        </span>
        {lesson.source.url ? (
          <a href={lesson.source.url} target="_blank" rel="noreferrer">
            知识来源：{lesson.source.title}
            <ArrowRight size={13} />
          </a>
        ) : (
          <span>知识来源：{lesson.source.title}</span>
        )}
      </div>
      {celebrate && (
        <div className="celebration-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="探索完成"
            className="celebration"
          >
            <div className="star-burst">
              <Star />
              {["✧", "✦", "✧", "✦"].map((x, i) => (
                <span key={i} className={`burst-${i}`}>
                  {x}
                </span>
              ))}
            </div>
            <span className="small-label">又多了一个小小发现</span>
            <h2>好奇心，闪闪发光！</h2>
            <p>{track.success}</p>
            <div>
              <button className="primary" onClick={() => setCelebrate(false)}>
                <Compass size={18} />
                再自由玩一会儿
              </button>
              <a className="secondary-button" href="#/">
                <Home size={18} />
                回小岛看看
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
export default App;
