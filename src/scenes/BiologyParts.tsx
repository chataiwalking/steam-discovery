import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, type ShaderMaterial } from 'three';
import { Ball, Cube, Rod } from './shared';
import { Wire } from './ScienceExperimentsParts';
import { InspectObject } from './ScienceTechnologyEffects';

export type CellPartId = 'membrane' | 'nucleus' | 'mitochondria' | 'endoplasmic' | 'golgi';
export const cellPartNames: Record<CellPartId,string> = {
  membrane:'细胞膜 · 包围并分隔细胞', nucleus:'细胞核与核仁', mitochondria:'线粒体 · 内膜有褶皱',
  endoplasmic:'粗面内质网 · 表面有核糖体', golgi:'高尔基体 · 层叠的膜囊',
};
function CellSurface({ color, selected = false, inner = false }: {color:string;selected?:boolean;inner?:boolean}) {
  return <meshStandardMaterial color={color} roughness={.53} metalness={.03} side={inner?BackSide:DoubleSide}
    emissive={color} emissiveIntensity={selected?.3:.025} customProgramCacheKey={()=>'bio-cell-grain-v1'}
    onBeforeCompile={shader=>{
      shader.vertexShader='varying vec3 bioSurface;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbioSurface=position;');
      shader.fragmentShader='varying vec3 bioSurface;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grain=fract(sin(dot(floor(bioSurface*155.),vec3(127.1,311.7,74.7)))*43758.5453);diffuseColor.rgb*=.94+grain*.12;');
    }}/>
}
function CellPick({id,selected,onSelect,children}: {id:CellPartId;selected:CellPartId;onSelect:(id:CellPartId)=>void;children:ReactNode}) {
  return <InspectObject key={selected} text={cellPartNames[id]} position={[0,-1.45,1.6]} radius={.7}>
    <group onClick={event=>{event.stopPropagation();onSelect(id);}}>{children}</group>
  </InspectObject>;
}
/** Original shell geometry removes a cap around +Z; no transparent sphere hides the specimen. */
function OpenCellShell({ selected, closed = false }: { selected:boolean;closed?:boolean }) {
  const cut=closed?0:.94;
  return <group>
    <mesh rotation={[Math.PI/2,0,0]}><sphereGeometry args={[1.55,64,42,0,Math.PI*2,cut,Math.PI-cut]}/><CellSurface color="#8ab4bf" selected={selected}/></mesh>
    {!closed&&<>
      <mesh rotation={[Math.PI/2,0,0]}><sphereGeometry args={[1.485,64,42,0,Math.PI*2,cut,Math.PI-cut]}/><CellSurface color="#254a50" inner/></mesh>
      <mesh position={[0,0,Math.cos(cut)*1.55]}><torusGeometry args={[Math.sin(cut)*1.55,.039,8,80]}/><CellSurface color="#b4d1c5" selected={selected}/></mesh>
      <mesh position={[0,0,Math.cos(cut)*1.485]}><torusGeometry args={[Math.sin(cut)*1.485,.019,6,80]}/><CellSurface color="#4d8d91"/></mesh>
    </>}
  </group>;
}
function MembraneSheet({offset=0,color,selected=false,width=.15}: {offset?:number;color:string;selected?:boolean;width?:number}) {
  const geometry=useMemo(()=>{
    const g=new BufferGeometry(),positions:number[]=[],indices:number[]=[];
    for(let i=0;i<=36;i++){
      const u=i/36,angle=(-.86+u*1.72)*Math.PI;
      const x=Math.sin(angle)*(.63+offset*.07),y=Math.cos(angle)*.26+offset;
      const z=.06+Math.sin(u*Math.PI*3)*.025;
      positions.push(x,y,z-width/2,x,y,z+width/2);
      if(i<36){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[offset,width]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry}><CellSurface color={color} selected={selected}/></mesh>;
}
function CellParticles({progress,ribosomes=false}: {progress:RefObject<number>;ribosomes?:boolean}) {
  const material=useRef<ShaderMaterial>(null);
  const geometry=useMemo(()=>{
    const points:number[]=[];
    for(let i=0;i<(ribosomes?72:160);i++){
      if(ribosomes){const u=(i%18)/17,a=(-.86+u*1.72)*Math.PI,row=Math.floor(i/18);points.push(Math.sin(a)*(.63+row*.012),Math.cos(a)*.26+row*.095,.17+(i%3)*.025);}
      else {const a=i*2.39996,b=Math.acos(1-2*((i*.6180339)%1)),r=.65+(i%13)/13*.65;const x=Math.sin(b)*Math.cos(a)*r,y=Math.sin(b)*Math.sin(a)*r,z=Math.cos(b)*r;
        if((x+.43)**2+(y-.26)**2+(z-.18)**2>.42&&z<.85)points.push(x,y,z);}
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));return g;
  },[ribosomes]);
  const uniforms=useMemo(()=>({phase:{value:0},tint:{value:new Color(ribosomes?'#dbdca7':'#799a92')},size:{value:ribosomes?3.2:2.25}}),[ribosomes]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{if(material.current)material.current.uniforms.phase.value=progress.current;});
  return <points geometry={geometry} raycast={()=>null}><shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false}
    vertexShader="uniform float size;uniform float phase;void main(){vec3 p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=size;}"
    fragmentShader="uniform vec3 tint;void main(){float r=length(gl_PointCoord-.5);float a=1.-smoothstep(.12,.49,r);gl_FragColor=vec4(tint,a*.6);}"/></points>;
}
function Mitochondrion({selected}: {selected:boolean}) {
  return <group>
    <mesh rotation={[Math.PI/2,0,0]} scale={[.52,.22,.23]}><sphereGeometry args={[1,36,24,0,Math.PI*2,.92,Math.PI-.92]}/><CellSurface color="#cf8758" selected={selected}/></mesh>
    <mesh position={[0,0,.139]} scale={[.416,.175,1]}><torusGeometry args={[1,.042,6,48]}/><CellSurface color="#e7b177" selected={selected}/></mesh>
    <group scale={[.41,.17,.16]} position={[0,0,.09]}>
      <mesh scale={[1,1,.3]}><sphereGeometry args={[1,28,16]}/><CellSurface color="#9c6047"/></mesh>
      <Wire points={Array.from({length:15},(_,i)=>[-.83+i*.119,(i%2===0?-.65:.65)*(1-Math.abs(i-7)*.035),.3])} radius={.08} color="#ecc09a"/>
    </group>
  </group>;
}
export function AnimalCellCutaway({inside,selected,onSelect,progress}: {
  inside:boolean;selected:CellPartId;onSelect:(id:CellPartId)=>void;progress:RefObject<number>;
}) {
  return <group>
    <CellPick id="membrane" selected={selected} onSelect={onSelect}><OpenCellShell closed={!inside} selected={selected==='membrane'}/></CellPick>
    {inside&&<>
      <CellParticles progress={progress}/>
      <CellPick id="nucleus" selected={selected} onSelect={onSelect}><group position={[-.43,.26,.18]}>
        <mesh rotation={[Math.PI/2,0,0]}><sphereGeometry args={[.53,48,28,0,Math.PI*2,.9,Math.PI-.9]}/><CellSurface color="#8b79b1" selected={selected==='nucleus'}/></mesh>
        <mesh position={[0,0,.33]}><torusGeometry args={[.414,.025,8,48]}/><CellSurface color="#b9a4d4" selected={selected==='nucleus'}/></mesh>
        <Ball color="#4b406c" scale={[.41,.4,.3]}/><Ball color="#c29fc7" position={[.07,-.05,.25]} scale={.155}/>
        {[-1,1].map(side=><Wire key={side} points={[[side*.27,-.14,.28],[side*.14,.1,.31],[side*.25,.24,.28]]} color="#a691bb" radius={.018}/>)}
      </group></CellPick>
      <CellPick id="mitochondria" selected={selected} onSelect={onSelect}>
        <group position={[.58,-.51,.37]} rotation={[0,0,-.18]}><Mitochondrion selected={selected==='mitochondria'}/></group>
        <group position={[-.73,-.63,.06]} rotation={[0,0,.38]} scale={.62}><Mitochondrion selected={selected==='mitochondria'}/></group>
      </CellPick>
      <CellPick id="endoplasmic" selected={selected} onSelect={onSelect}><group position={[-.27,-.33,.22]} scale={.88}>
        {[0,.095,.19,.285].map(offset=><MembraneSheet key={offset} offset={offset} color="#5cacc0" selected={selected==='endoplasmic'} width={.32}/>)}
        <CellParticles progress={progress} ribosomes/>
        <Wire points={[[.42,.12,.05],[.68,.19,.04],[.81,-.03,.04],[.71,-.22,.04],[.45,-.14,.04]]} radius={.03} color="#63b5be"/>
      </group></CellPick>
      <CellPick id="golgi" selected={selected} onSelect={onSelect}><group position={[.61,.49,.27]} scale={.52} rotation={[0,0,.25]}>
        {[0,.11,.22,.33,.44].map(offset=><MembraneSheet key={offset} offset={offset} color="#91b761" selected={selected==='golgi'} width={.35}/>)}
        {[0,1,2].map(i=><Ball key={i} color="#bcce79" position={[.64+i*.12,.35+i*.12,.04]} scale={.09}/>)}
      </group></CellPick>
      {[[-.95,.54,.02],[.69,.11,.61],[.29,-.96,.17]].map((p,i)=><Ball key={i} color="#c5ad6c" position={p as [number,number,number]} scale={.075+i*.015}/>)}
    </>}
  </group>;
}

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
  const count=25;
  const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(count*3),3));return g;},[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{const cycle=progress.current*visits;const a=geometry.getAttribute('position');
    for(let i=0;i<count;i++){const local=Math.max(0,Math.min(.5,cycle-Math.floor(i/5)));const t=.5-.5*Math.cos(local*Math.PI*2);a.setXYZ(i,-1.52+3.04*t,1.75+.11*t+Math.sin(t*Math.PI)*.52+(i%5-2)*.018,(i%4-1.5)*.04);}
    a.needsUpdate=true;
  });
  return <points geometry={geometry} raycast={()=>null}><pointsMaterial size={.047} color="#e5ce70" toneMapped={false} depthWrite={false} /></points>;
}

export function AirCycleParticles({progress,cycles}: {progress:RefObject<number>;cycles:number}) {
  const geometry=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(new Float32Array(18*3),3));return g;},[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{const phase=progress.current*cycles%1,inhale=phase<.5,local=(phase%.5)*2;const a=geometry.getAttribute('position');
    for(let i=0;i<18;i++){const t=(local+i/18)%1,u=inhale?t:1-t,side=i%2?1:-1;a.setXYZ(i,side*Math.max(0,u-.42)*1.12,2.78-u*1.34,.16+(i%3)*.025);}a.needsUpdate=true;
  });
  return <points geometry={geometry} raycast={()=>null}><pointsMaterial color="#c6e3dc" size={.035} toneMapped={false} depthWrite={false}/></points>;
}
