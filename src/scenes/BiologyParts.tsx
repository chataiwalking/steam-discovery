import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group } from 'three';
import { Ball, Cube, Rod } from './shared';

export function Leaf({ color = '#659c5e' }: { color?: string }) {
  return <group><Ball kind="ground" color={color} scale={[.6,.035,.28]} /><Cube color="#abc37b" scale={[1.03,.012,.012]} position={[0,.037,0]} /></group>;
}
export function BioFlower({ color = '#d997ae' }: { color?: string }) {
  return <group><Rod kind="ground" color="#638c55" position={[0,.64,0]} scale={[.024,1.05,.024]} />
    <group position={[.23,.5,0]} rotation={[0,0,.3]} scale={.6}><Leaf /></group>
    <group position={[0,1.24,0]}>{Array.from({length:7},(_,i)=><group key={i} rotation={[0,i*Math.PI*2/7,0]}><Ball color={color} position={[.34,0,0]} scale={[.37,.07,.17]} /></group>)}
      {[-1,1].flatMap(x=>[-1,1].map(z=><group key={`${x}-${z}`} position={[x*.13,.15,z*.13]}><Rod color="#d4c481" scale={[.012,.2,.012]} /><Ball color="#e4c960" position={[0,.12,0]} scale={.035} /></group>))}
      <Rod color="#8aa062" position={[0,.23,0]} scale={[.032,.28,.032]} /><Ball color="#aed17c" position={[0,.38,0]} scale={[.066,.035,.066]} />
    </group></group>;
}
export function WingedVisitor({ butterfly = false, progress, beats = 4 }: { butterfly?: boolean; progress?: RefObject<number>; beats?: number }) {
  const wings = useRef<Group>(null);
  useFrame(()=>{wings.current?.children.forEach((wing,i)=>{wing.rotation.x=(i%2===0?1:-1)*(.1+Math.sin((progress?.current??0)*beats*Math.PI*10)*.45);});});
  if (butterfly) return <group>
    <Ball kind="ground" color="#49584d" scale={[.055,.32,.055]} />
    <Ball color="#65765a" position={[0,.36,0]} scale={.09} />
    <group ref={wings}>{[-1,1].map(side=><group key={side}><Ball color="#daaa67" position={[side*.25,.1,0]} rotation={[0,0,side*.25]} scale={[.29,.31,.028]} /><Ball color="#c39068" position={[side*.18,-.21,0]} scale={[.2,.2,.024]} />
      {[.1,-.07].map(y=><Ball key={y} color="#ead6a0" position={[side*.31,y,.034]} scale={[.07,.1,.012]} />)
    }</group>)}</group>
    {[-1,1].map(side=><Rod key={side} color="#66795a" position={[side*.065,.49,0]} rotation={[0,0,side*-.4]} scale={[.007,.2,.007]} />)}
    {[-1,1].flatMap(side=>[-.1,0,.1].map(y=><Rod key={`${side}-${y}`} color="#66795a" position={[side*.08,y,.065]} rotation={[0,0,side*.8]} scale={[.006,.15,.006]} />))}
  </group>;
  return <group><Ball color="#b5a057" scale={[.27,.15,.15]} />
    {[-.08,.08].map(x=><mesh key={x} position={[x,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.145,.025,5,20]} /><meshStandardMaterial color="#4d5446" /></mesh>)}
    <Ball color="#596347" position={[.29,.04,0]} scale={.11} />
    <group ref={wings}>{[-1,1].map(side=><group key={side}><Ball kind="glass" color="#cee4df" position={[0,.15,side*.18]} rotation={[side*.3,0,0]} scale={[.2,.015,.16]} /></group>)}</group>
    {[-1,1].flatMap(side=>[-.1,0,.1].map(x=><Rod key={`${side}-${x}`} color="#526044" position={[x,-.13,side*.1]} rotation={[side*.6,0,0]} scale={[.006,.17,.006]} />))}
  </group>;
}
export function ButterflyStage({ stage, progress }: { stage: number; progress?: RefObject<number> }) {
  if(stage===1)return <group><Leaf /><Ball color="#e2e3b9" position={[0,.16,0]} scale={[.1,.15,.1]} /></group>;
  if(stage===2)return <group><Leaf />{Array.from({length:7},(_,i)=><Ball key={i} color={i%2?'#7d9e50':'#aac16e'} position={[-.35+i*.12,.14,0]} scale={[.09,.12,.09]} />)}<Ball color="#375e43" position={[.41,.2,.05]} scale={.026} /></group>;
  if(stage===3)return <group><Rod kind="wood" color="#7f7c4e" position={[0,.66,0]} rotation={[0,0,Math.PI/2]} scale={[.028,.88,.028]} /><Ball color="#719d69" position={[0,.3,0]} scale={[.18,.34,.16]} /><Cube color="#c0ae70" position={[0,.53,.145]} rotation={[0,0,.25]} scale={[.32,.03,.025]} /></group>;
  return <WingedVisitor butterfly progress={progress} />;
}
export function FrogModel({ stage = 4 }: { stage?: number }) {
  if(stage===1)return <group>{Array.from({length:9},(_,i)=><group key={i} position={[(i%3-1)*.22,.1,(Math.floor(i/3)-1)*.22]}><Ball kind="glass" color="#c9d9c1" scale={.14} /><Ball color="#566449" scale={.05} /></group>)}</group>;
  const adult=stage>=3;
  return <group><Ball kind="ground" color={adult?'#79a060':'#63775b'} scale={adult?[.3,.18,.29]:[.16,.12,.19]} position={[0,.18,0]} />
    {stage<4&&<mesh position={[0,.15,-.3]} rotation={[-Math.PI/2,0,0]} scale={stage===3?[.7,.55,.7]:1}><coneGeometry args={[.065,.47,12]} /><meshStandardMaterial color="#708566" /></mesh>}
    {adult&&<><Ball color="#7fa566" position={[0,.24,.18]} scale={[.28,.17,.22]} />{[-1,1].map(side=><group key={side}><Ball color="#90ac6d" position={[side*.17,.4,.2]} scale={.09} /><Ball color="#314b3a" position={[side*.17,.415,.28]} scale={.04} />
      <Ball color="#75985a" position={[side*.29,.12,-.16]} rotation={[0,side*.35,0]} scale={[.2,.11,.21]} /><Rod color="#75985a" position={[side*.24,.08,.23]} rotation={[0,0,side*.2]} scale={[.033,.2,.033]} />
    </group>)}</>}
  </group>;
}
export function OwlModel({ color = '#82745d' }: { color?: string }) {
  return <group><Ball kind="ground" color={color} position={[0,.33,0]} scale={[.32,.46,.24]} /><Ball color={color} position={[0,.75,0]} scale={[.33,.26,.25]} />
    {[-1,1].map(side=><group key={side}><Ball color="#b5ad8a" position={[side*.145,.78,.225]} scale={[.13,.15,.035]} /><Ball color="#354a42" position={[side*.145,.79,.26]} scale={.055} />
      <Ball kind="ground" color={color} position={[side*.27,.37,.02]} rotation={[0,0,side*.13]} scale={[.075,.34,.16]} /><Rod color="#a49a64" position={[side*.13,.01,.12]} scale={[.025,.16,.025]} />
    </group>)}<mesh position={[0,.69,.29]} rotation={[Math.PI,0,0]}><coneGeometry args={[.055,.12,10]} /><meshStandardMaterial color="#a39664" /></mesh>
  </group>;
}
export function RabbitModel() {
  return <group><Ball kind="ground" color="#c1b493" position={[0,.24,0]} scale={[.4,.28,.26]} /><Ball color="#cabb9c" position={[.24,.49,.12]} scale={.2} />
    {[-1,1].map(side=><group key={side}><Ball color="#c4b595" position={[.23+side*.065,.82,.1]} rotation={[0,0,side*.12]} scale={[.062,.3,.055]} /><Ball color="#776c59" position={[.39,.53,.1+side*.08]} scale={.025} /><Ball color="#a7997b" position={[side*.19,.08,.16]} scale={[.17,.07,.09]} /></group>)}
    <Ball color="#ddd4bc" position={[-.4,.27,0]} scale={.12} />
  </group>;
}
export function FishModel() {
  return <group><Ball color="#7eaeb6" scale={[.36,.18,.12]} />
    <mesh position={[-.4,0,0]} rotation={[0,0,-Math.PI/2]} scale={[1,1,.3]}><coneGeometry args={[.2,.28,3]} /><meshStandardMaterial color="#6b959f" /></mesh>
    <Ball color="#2e545b" position={[.2,.055,.105]} scale={.035} />
  </group>;
}

/** Seeded particles are one draw call; every position is a function of frozen progress. */
export function PollenParticles({ progress, visits }: { progress: RefObject<number>; visits: number }) {
  const count=20;
  const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(count*3),3));return g;},[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{const cycle=progress.current*visits;const a=geometry.getAttribute('position');
    for(let i=0;i<count;i++){const local=Math.max(0,Math.min(.5,cycle-Math.floor(i/5)));const t=.5-.5*Math.cos(local*Math.PI*2);a.setXYZ(i,-1.52+3.04*t,1.71+Math.sin(t*Math.PI)*.48+(i%5)*.035,(i%4-1.5)*.06);}
    a.needsUpdate=true;
  });
  return <points geometry={geometry} raycast={()=>null}><pointsMaterial size={.047} color="#e5ce70" toneMapped={false} depthWrite={false} /></points>;
}
