import { ShapeToy, shapeColors } from "./toyModels";
import {useLayoutEffect,useRef,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {type Group} from 'three';
import {FocusTarget,damping} from './MathCoreEffects';
import type { ShapeKind } from "../types";
import { Cube, Rod, SceneLabel, ToyPlatform, useSceneClock, type SceneProps } from "./shared";

function MovingShape({position,children,props,radius}:{position:[number,number,number];children:ReactNode;props:SceneProps;radius:number}) {
  const group=useRef<Group>(null),initial=useRef(position),time=useSceneClock(props);
  const previousPosition=useRef(position);
  const invalidate=useThree(state=>state.invalidate);
  useLayoutEffect(()=>{
    const changed=position.some((value,index)=>value!==previousPosition.current[index]);
    previousPosition.current=position;
    if(changed&&props.paused&&group.current){group.current.position.set(...position);invalidate();}
  },[position,props.paused,invalidate]);
  useFrame((_,delta)=>{
    if(!group.current||props.paused)return;
    const alpha=damping(delta,10);
    group.current.position.x+=(position[0]-group.current.position.x)*alpha;
    group.current.position.y+=(position[1]-group.current.position.y)*alpha;
    group.current.position.z+=(position[2]-group.current.position.z)*alpha;
    group.current.rotation.y=props.demo?time.current*.24:0;
  });
  return <group ref={group} position={initial.current}><FocusTarget radius={radius} paused={props.paused} enabled={!props.demo}>{children}</FocusTarget></group>;
}

export default function Shapes(props: SceneProps) {
  const shapes: ShapeKind[] = props.demo
    ? ["sphere", "cube", "cylinder"]
    : props.state.shapes;
  const sorted = props.demo ? 0 : props.state.sorted;
  const kinds: ShapeKind[] = ["sphere", "cube", "cylinder"];
  return (
    <group>
      <ToyPlatform radius={3.65} color="#bcc1b8" />
      <Cube kind="wood" color="#8c785b" position={[0, 0.06, -0.85]} scale={[5.85, 0.12, 2.85]} />
      <Cube kind="paint" color="#788b85" position={[0, 0.13, -0.85]} scale={[5.65, 0.025, 2.65]} />
      {shapes.map((kind, i) => {
        const done = i < sorted;
        const kindIndex = kinds.indexOf(kind);
        const matchingPrevious = shapes
          .slice(0, i)
          .filter((k) => k === kind).length;
        return (
          <MovingShape
            key={`${kind}-${i}`}
            props={props}
            radius={done?.35:props.demo?.72:.5}
            position={
              done
                ? [
                    (kindIndex - 1) * 2 + ((matchingPrevious % 2) - 0.5) * 0.42,
                    0.4 + Math.floor(matchingPrevious / 4) * 0.54,
                    1.18 + Math.floor((matchingPrevious % 4) / 2) * 0.48,
                  ]
                : [
                    props.demo ? (i - 1) * 1.65 : ((i % 5) - 2) * 1.0,
                    0.16 + (props.demo ? 0.58 : 0.38) * (kind === "cube" ? 0.85 : kind === "cylinder" ? 0.95 : 1),
                    -0.5 - Math.floor(i / 5) * 1.1,
                  ]
            }
          >
            <ShapeToy
              kind={kind}
              size={done ? 0.24 : props.demo ? 0.58 : 0.38}
            />
          </MovingShape>
        );
      })}
      {kinds.map((kind, i) => (
        <group key={kind} position={[(i - 1) * 2, 0, 1.55]}>
          <Cube kind="wood" color="#9c825d" position={[0, 0.07, 0]} scale={[1.8, 0.14, 1.6]} />
          <Cube kind="paint" color="#d2d2c7" position={[0, 0.145, 0]} scale={[1.63, 0.025, 1.43]} />
          {[-0.88, 0.88].map(x => <Cube key={x} kind="wood" color="#8f7958" position={[x, 0.21, 0]} scale={[0.06, 0.26, 1.6]} />)}
          {[-0.77, 0.77].map(z => <Cube key={z} kind="wood" color="#8f7958" position={[0, 0.21, z]} scale={[1.8, 0.26, 0.06]} />)}
          <FocusTarget radius={.23} color={shapeColors[kind]} position={[-.68,.155,-.58]} paused={props.paused} enabled={!props.demo}><Rod kind="metal" color={shapeColors[kind]} scale={[0.07,0.01,0.07]}/></FocusTarget>
          <SceneLabel position={[0, 0.12, 0.94]}>
            {["球", "立方体", "圆柱"][i]}
          </SceneLabel>
        </group>
      ))}
      <SceneLabel position={[0, 2.25, -0.5]}>选形状 · 动手数一数</SceneLabel>
    </group>
  );
}
