import { createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { addAfterEffect } from '@react-three/fiber';
import type { Object3D } from 'three';

export interface SceneAnnotation {
  id: string;
  text: string;
  content: ReactNode;
  color?: string;
}
interface RegisteredAnnotation extends SceneAnnotation {
  visible: boolean;
  fingerprint: string;
  order: number;
}
const emptySnapshot: readonly SceneAnnotation[] = [];

/** Html content is registered as DOM-compatible React content, not a scene object. */
export function annotationText(content: ReactNode): string {
  if (content == null || typeof content === 'boolean') return '';
  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'bigint') return String(content);
  if (Array.isArray(content)) return content.map(annotationText).join('');
  if (isValidElement<{children?:ReactNode;'aria-label'?:string}>(content)) return annotationText(content.props.children) || content.props['aria-label'] || '';
  return '';
}
function contentFingerprint(content: ReactNode): string {
  if (Array.isArray(content)) return content.map(contentFingerprint).join('|');
  if (isValidElement<{children?:ReactNode;href?:string;title?:string;className?:string;'aria-label'?:string}>(content)) {
    const {children,href,title,className}=content.props;
    const tag=typeof content.type==='string'?content.type:typeof content.type==='function'?content.type.name:String(content.type);
    return `${tag}:${href??''}:${title??''}:${className??''}:${content.props['aria-label']??''}[${contentFingerprint(children)}]`;
  }
  return annotationText(content);
}
export function worldVisible(object: Object3D | null): boolean {
  if (!object) return false;
  let current: Object3D | null = object;
  while (current) { if (!current.visible) return false; current=current.parent; }
  return true;
}

/** Only text/content or actual visibility transitions notify React subscribers. */
class AnnotationRegistry {
  private records=new Map<string,RegisteredAnnotation>();
  private listeners=new Set<()=>void>();
  private snapshot:readonly SceneAnnotation[]=emptySnapshot;
  private order=0;
  private pending=false;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
  getSnapshot=()=>this.snapshot;
  getServerSnapshot=()=>emptySnapshot;
  private publish() {
    const seen=new Set<string>();
    this.snapshot=[...this.records.values()].sort((a,b)=>a.order-b.order).filter(entry=>{
      if(!entry.visible||!entry.text||seen.has(entry.text))return false;
      seen.add(entry.text);return true;
    }).map(({id,text,content,color})=>({id,text,content,color}));
    if(this.pending)return;
    this.pending=true;
    queueMicrotask(()=>{this.pending=false;this.listeners.forEach(listener=>listener());});
  }
  put(id:string,content:ReactNode,text:string,visible:boolean,color?:string) {
    const previous=this.records.get(id),fingerprint=contentFingerprint(content);
    if(previous&&previous.text===text&&previous.fingerprint===fingerprint&&previous.visible===visible&&previous.color===color)return;
    this.records.set(id,{id,content,text,visible,color,fingerprint,order:previous?.order??this.order++});
    this.publish();
  }
  visibility(id:string,visible:boolean) {
    const entry=this.records.get(id);
    if(!entry||entry.visible===visible)return;
    this.records.set(id,{...entry,visible});this.publish();
  }
  remove(id:string) {if(this.records.delete(id))this.publish();}
}
interface AnnotationContextValue {registry:AnnotationRegistry;showLabels:boolean;shortLabelLimit:number}
const AnnotationContext=createContext<AnnotationContextValue|null>(null);

/** Place both Canvas and AnnotationDock under this provider; key it by lesson. */
export function SceneAnnotationsProvider({children,showLabels=false,shortLabelLimit=18}:{children:ReactNode;showLabels?:boolean;shortLabelLimit?:number}) {
  const registry=useMemo(()=>new AnnotationRegistry(),[]);
  const value=useMemo(()=>({registry,showLabels,shortLabelLimit}),[registry,showLabels,shortLabelLimit]);
  return <AnnotationContext.Provider value={value}>{children}</AnnotationContext.Provider>;
}

/** Probe after model updates/render so invisible ancestor groups cannot leak Html. */
export function useSceneAnnotation(content:ReactNode,anchor:RefObject<Object3D|null>,{color,onVisibility}:{color?:string;onVisibility?:(visible:boolean)=>void}={}) {
  const context=useContext(AnnotationContext),id=useId();
  const text=annotationText(content).replace(/\s+/g,' ').trim();
  const current=useRef({content,text,color,onVisibility});current.current={content,text,color,onVisibility};
  const registry=context?.registry;
  useLayoutEffect(()=>{
    if(!registry)return;
    const entry=current.current;registry.put(id,entry.content,entry.text,worldVisible(anchor.current),entry.color);
    return ()=>registry.remove(id);
  },[registry,id,anchor]);
  useLayoutEffect(()=>{
    registry?.put(id,content,text,worldVisible(anchor.current),color);
  },[registry,id,anchor,content,text,color]);
  useEffect(()=>{
    const inspect=()=>{
      const visible=worldVisible(anchor.current);
      registry?.visibility(id,visible);
      current.current.onVisibility?.(visible);
    };
    inspect();
    return addAfterEffect(inspect);
  },[registry,id,anchor]);
  return {text,showLabel:!!context?.showLabels&&!!text&&text.length<=(context?.shortLabelLimit??18)};
}

/** A compact always-visible summary, with the full list collapsed by default. */
export function AnnotationDock({className='',summaryItems=2,label='观察要点'}:{className?:string;summaryItems?:number;label?:string}) {
  const context=useContext(AnnotationContext);
  if(!context)return null;
  return <RegisteredAnnotationDock registry={context.registry} className={className} summaryItems={summaryItems} label={label}/>;
}
function RegisteredAnnotationDock({registry,className,summaryItems,label}:{registry:AnnotationRegistry;className:string;summaryItems:number;label:string}) {
  const annotations=useSyncExternalStore(registry.subscribe,registry.getSnapshot,registry.getServerSnapshot);
  if(!annotations.length)return null;
  const count=Math.max(1,Math.min(2,summaryItems)),summary=annotations.slice(-count);
  return <section className={`annotation-dock ${className}`.trim()} aria-label="场景观察要点" data-annotation-count={annotations.length}>
    <div className="annotation-dock-summary"><strong className="annotation-dock-heading">{label}</strong>
      <div className="annotation-dock-excerpts">{summary.map(entry=><span key={entry.id} className="annotation-dock-excerpt" title={entry.text}>{entry.content}</span>)}</div>
    </div>
    <details className="annotation-dock-details"><summary>全部观察要点（{annotations.length}）</summary>
      <ul className="annotation-dock-list">{annotations.map(entry=><li key={entry.id} data-annotation-id={entry.id}>{entry.content}</li>)}</ul>
    </details>
  </section>;
}
