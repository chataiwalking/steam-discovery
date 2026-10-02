import {getExperiment} from "./content/experiments";
import type { AgeBand, LessonId, WorldState } from "./types";
export const ageBands: AgeBand[] = ["2-3", "4-5", "6-8"];
export const defaultWorld = (): WorldState => ({
  experimentValue: 0, experimentOption: 0, experimentRun: 0,
  rotation: 0,
  waterStage: 0,
  waterOrder: [],
  gearRunning: false,
  gearDirection: 1,
  gearTeeth: 12,
  deck: false,
  pier: false,
  braces: false,
  carRun: 0,
  lights: [0, 0, 0],
  shapeKind: "sphere",
  shapes: [],
  sorted: 0,
});
export type Evidence = {
  actions: number;
  experimentCompleted:number;
  experimentResults:{value:number;option:number}[];
  experimentValues:number[];
  experimentOptions:number[];
  day: boolean;
  night: boolean;
  water: number[];
  reversed: boolean;
  ratio: boolean;
  bridgeBefore: boolean;
  bridgeAfter: boolean;
  crossed: boolean;
  pierCrossed: boolean;
  colors: number[];
  prediction: boolean;
  sortedKinds: string[];
};
export const defaultEvidence = (): Evidence => ({
  actions: 0,
  experimentCompleted:0,experimentResults:[],experimentValues:[],experimentOptions:[],
  day: false,
  night: false,
  water: [],
  reversed: false,
  ratio: false,
  bridgeBefore: false,
  bridgeAfter: false,
  crossed: false,
  pierCrossed: false,
  colors: [],
  prediction: false,
  sortedKinds: [],
});
export const isDay = (rotation: number) => Math.cos(rotation) > 0;
export const gearVelocity = (
  input: number,
  inputTeeth: number,
  outputTeeth: number,
) => (-input * inputTeeth) / outputTeeth;
export const lightHex = (lights: number[]) =>
  "#" +
  lights
    .map((x) =>
      Math.round(Math.max(0, Math.min(1, x)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
export function taskComplete(
  id: LessonId,
  age: AgeBand,
  step: number,
  w: WorldState,
  e: Evidence,
): boolean {
  const experiment=getExperiment(id);
  if(experiment){
    if(step===0)return true;
    if(step===1||age==="2-3")return e.experimentCompleted>=1;
    if(age==="4-5")return e.experimentResults.some(a=>e.experimentResults.some(b=>a.option===b.option&&a.value!==b.value));
    return e.experimentResults.some(result=>result.value===experiment.targetValue&&result.option===experiment.targetOption);
  }
  if (step === 0) return true;
  if (step === 1) return e.actions > 0;
  switch (id) {
    case "day-night":
      return age === "6-8" ? e.prediction : e.day && e.night;
    case "water-cycle":
      return age === "6-8"
        ? w.waterOrder.join(",") === "1,2,3"
        : [1, 2, 3].every((x) => e.water.includes(x));
    case "gears":
      return age === "2-3"
        ? e.actions >= 2
        : age === "4-5"
          ? e.reversed && w.gearRunning
          : e.ratio && w.gearRunning && w.gearTeeth === 24;
    case "bridge":
      return age === "2-3"
        ? w.deck && e.crossed
        : age === "4-5"
          ? w.deck && w.pier && e.pierCrossed
          : e.bridgeBefore && e.bridgeAfter;
    case "light":
      return age === "2-3"
        ? e.colors.length >= 3
        : age === "4-5"
          ? w.lights.filter((x) => x > 0).length === 2
          : w.lights.every((x) => x === 1);
    case "shapes":
      return age === "2-3"
        ? w.shapes.length === 3 && w.shapes.every((x) => x === "sphere")
        : age === "4-5"
          ? w.sorted === 5 &&
            w.shapes.length === 5 &&
            w.shapes.every((x) => x === w.shapes[0])
          : w.shapes.length === 8 &&
            w.shapes.includes("sphere") &&
            w.shapes.includes("cube") &&
            w.shapes.every((x) => x !== "cylinder");
  }
  return false;
}
export function taskHint(id: LessonId, age: AgeBand): string {
  const experiment=getExperiment(id);
  if(experiment){
    if(age==="2-3")return `点一下“${experiment.actionLabel}”，观察装置的变化。`;
    if(age==="4-5")return `先${experiment.actionLabel}，保持选项不变，改变“${experiment.parameterLabel}”后再试一次。`;
    return `把“${experiment.parameterLabel}”调到${experiment.targetValue}，选择“${experiment.options[experiment.targetOption]}”，再${experiment.actionLabel}。`;
  }
  const hints: Record<LessonId, Record<AgeBand, string>> = {
    "day-night": {
      "2-3": "让小屋经历一次白天，再经历一次黑夜。",
      "4-5": "转动地球，找到小屋的白天和黑夜。",
      "6-8": "先预测：小屋在地球转半圈后，会是白天还是黑夜？",
    },
    "water-cycle": {
      "2-3": "点一点，让水滴去蒸发、变成云、再落下雨。",
      "4-5": "依次试试蒸发、凝结和降雨，观察水的旅行。",
      "6-8": "按顺序点出：蒸发 → 凝结 → 降雨。",
    },
    gears: {
      "2-3": "让齿轮转起来，再停下来。",
      "4-5": "让齿轮转起来，再换一个方向。",
      "6-8": "让齿轮转起来，把右边换成二十四齿，观察它变慢。",
    },
    bridge: {
      "2-3": "放好桥面，再让小车过桥。",
      "4-5": "放好桥面和桥墩，再让小车过桥。",
      "6-8": "先试试没有斜撑的桥，再装上斜撑试一次。",
    },
    light: {
      "2-3": "分别点亮红灯、绿灯和蓝灯。",
      "4-5": "同时点亮两盏不同颜色的灯，看看混合后的颜色。",
      "6-8": "把三种彩光都调到最亮，让画板变成白色。",
    },
    shapes: {
      "2-3": "选小球，放三个到托盘里。",
      "4-5": "添加五个相同形状的物体，再放入对应的分类托盘。",
      "6-8": "用小球和方块组成八个物体，两种形状都要有。",
    },
  };
  return hints[id][age];
}

export function initialWorld(id:LessonId):WorldState{const state=defaultWorld();const experiment=getExperiment(id);if(experiment){state.experimentValue=experiment.initial;state.experimentOption=experiment.targetOption;}return state;}
