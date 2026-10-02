import {useLayoutEffect,useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import {getExperiment} from '../content/experiments';
import {SceneLabel,ToyPlatform,useSceneClock,type SceneProps} from './shared';
export function ExperimentFrame({props,children}:{props:SceneProps;children:ReactNode}) {
 const experiment=getExperiment(props.lesson)!;
 return <group><ToyPlatform radius={3.8} color="#9da8ad"/><group>{children}</group><SceneLabel position={[0,3.7,0]}>{experiment.title}</SceneLabel></group>;
}
export function useExperimentMotion(props:SceneProps) {
 const clock=useSceneClock(props),started=useRef(0),reported=useRef(0),progress=useRef(0);
 useLayoutEffect(()=>{started.current=clock.current;progress.current=0;if(props.state.experimentRun===0)reported.current=0},[props.state.experimentRun,clock]);
 useFrame(()=>{
  if(props.paused)return;
  if(props.demo){progress.current=props.narrationActive?Math.min(1,props.narrationTime/5):0;return;}
  const run=props.state.experimentRun;
  progress.current=run>0?Math.min(1,Math.max(0,(clock.current-started.current)/2.5)):0;
  if(run>0&&progress.current>=1&&reported.current!==run){reported.current=run;props.onAction?.({type:'experiment-complete',runId:run})}
 });
 return progress;
}
