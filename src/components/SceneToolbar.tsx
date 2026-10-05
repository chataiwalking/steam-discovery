import { Eye, EyeOff, Minus, Plus, RotateCcw, Moon, Sun, Move3D } from "lucide-react";
import type { SceneView } from "./SceneCamera";

export function SceneToolbar({ view, onView, zoom, onZoom, showLabels, onLabels, dark, onDark, onReset }: {
  view: SceneView; onView: (view: SceneView) => void; zoom: number; onZoom: (zoom: number) => void;
  showLabels: boolean; onLabels: () => void; dark: boolean; onDark: () => void; onReset: () => void;
}) {
  return <div className="scene-toolbar" aria-label="观察工具">
    <label className="scene-view-select"><Move3D size={16} /><span className="sr-only">观察视角</span>
      <select aria-label="观察视角" value={view} onChange={e => onView(e.target.value as SceneView)}>
        <option value="perspective">立体视角</option><option value="front">正面观察</option>
        <option value="top">从上往下</option><option value="orbit">自由转动</option>
      </select>
    </label>
    <div className="scene-zoom">
      <button aria-label="缩小模型" disabled={zoom <= .8} onClick={() => onZoom(Math.max(.8, +(zoom - .2).toFixed(1)))}><Minus size={15}/></button>
      <output aria-label="模型缩放">{Math.round(zoom * 100)}%</output>
      <button aria-label="放大模型" disabled={zoom >= 1.6} onClick={() => onZoom(Math.min(1.6, +(zoom + .2).toFixed(1)))}><Plus size={15}/></button>
    </div>
    <div className="scene-display-tools">
      <button aria-label="显示名称标注" aria-pressed={showLabels} onClick={onLabels}>{showLabels ? <Eye size={16}/> : <EyeOff size={16}/>}<span>标注</span></button>
      <button aria-label="暗色舞台" aria-pressed={dark} onClick={onDark}>{dark ? <Moon size={16}/> : <Sun size={16}/>}<span>背景</span></button>
      <button aria-label="还原观察视角" onClick={onReset}><RotateCcw size={16}/><span>还原</span></button>
    </div>
  </div>;
}
