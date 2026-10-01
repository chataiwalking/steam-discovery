export type AgeBand = "2-3" | "4-5" | "6-8";
export type LessonId =
  | "day-night"
  | "water-cycle"
  | "gears"
  | "bridge"
  | "light"
  | "shapes";
export type ShapeKind = "sphere" | "cube" | "cylinder";
export interface NarrationClip {
  id: string;
  text: string;
  spokenText: string;
}
export interface LessonStep {
  title: string;
  instruction: string;
  clip: NarrationClip;
}
export interface AgeTrack {
  goal: string;
  steps: [LessonStep, LessonStep, LessonStep];
  success: string;
}
export interface LessonDefinition {
  id: LessonId;
  title: string;
  subtitle: string;
  category: string;
  color: string;
  icon: string;
  description: string;
  fact: string;
  source: { title: string; url: string };
  tracks: Record<AgeBand, AgeTrack>;
}
export interface AudioEntry {
  audioHash?: string;
  file: string;
  duration: number;
  textHash: string;
  text: string;
}
export interface WorldState {
  rotation: number;
  waterStage: number;
  waterOrder: number[];
  gearRunning: boolean;
  gearDirection: 1 | -1;
  gearTeeth: 12 | 24;
  deck: boolean;
  pier: boolean;
  braces: boolean;
  carRun: number;
  lights: [number, number, number];
  shapeKind: ShapeKind;
  shapes: ShapeKind[];
  sorted: number;
}
export type WorldAction =
  | { type: "rotate" }
  | { type: "water"; stage: number }
  | { type: "gear" }
  | { type: "bridge" }
  | { type: "bridge-finished"; runId: number }
  | { type: "light"; index: number }
  | { type: "shape"; kind: ShapeKind };
export interface WorldCanvasProps {
  lesson: LessonId | "island";
  state: WorldState;
  paused: boolean;
  narrationTime: number;
  narrationActive: boolean;
  demo: boolean;
  onSelect?: (id: LessonId) => void;
  onAction?: (action: WorldAction) => void;
}
