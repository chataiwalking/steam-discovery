import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,CatmullRomCurve3,Float32BufferAttribute,Vector3,type Group,type Mesh,type MeshBasicMaterial} from 'three';
import {ExperimentFrame,useExperimentMotion} from './ExperimentFrame';
import {Ball,Cube,Rod,SceneLabel,type SceneProps} from './shared';
import {PhysicalMaterial} from './materials';
import {ClayImpressions,FiberSheet,GlyphFace,HistoryBoat,HistoryCamel,HistoryCoils,HistoryInspect,HistoryLink,HistoryPath,HistorySurface,PotModel,portion,soften,useHistoryGlyphs,useHistoryMotif,type HistoryMotion,type HistoryPoint} from './HistoryParts';
type HistoryProps={value:number;option:number;motion:HistoryMotion};
const writingSymbols=['╱','∨','╲','┐','⊥','⋀'];
const typeCharacters=['日','月','山','水','木','土'];

function Archaeology({value,option,motion}:HistoryProps) {
 const layers=useRef<(Group|null)[]>([]),brush=useRef<Group>(null),artifact=useRef<Group>(null),chosen=value-1,layerY=.28+(3-chosen)*.43;
 useFrame(()=>{
  const p=soften(motion.current);layers.current.forEach((layer,i)=>{if(!layer)return;layer.position.x=i<chosen?-p*1.7:0;layer.position.z=i===chosen?-p*1.9:0});
  if(brush.current){brush.current.position.set(-.85+1.7*motion.current,layerY+.28,.55);brush.current.visible=motion.current>0&&motion.current<1}
  if(artifact.current)artifact.current.position.y=layerY+.12*p;
 });
 return <group>
  <Cube kind="wood" color="#6f604a" position={[-.35,.05,0]} scale={[4.3,.10,2.9]}/>
  {['#b8a17e','#a48563','#87684e','#6d5848'].map((color,i)=><group key={i} ref={node=>{layers.current[i]=node}} position={[0,.28+(3-i)*.43,0]}><HistoryInspect detail={`第 ${i+1} 层 · 示意层位，不能直接换算年代`} position={[-1.4,.45,1.5]}><mesh scale={[3.3,.42,2.5]} receiveShadow><boxGeometry/><HistorySurface color={color} mode="soil"/></mesh></HistoryInspect><SceneLabel position={[-1.38,0,1.27]}>{i+1}</SceneLabel></group>)}
  <group ref={artifact} position={[0,layerY,.56]}><HistoryInspect detail={option===0?'发现与层位记录配对；位置也是证据':'只看外形，缺少解释发现位置的证据'} position={[.1,.55,.55]}><PotModel scale={.39} color={['#baa78c','#ad825c','#bc9972','#9b7961'][chosen]}/></HistoryInspect></group>
  <group ref={brush} position={[0,layerY+.25,.55]}><Rod kind="wood" color="#b39163" rotation={[0,0,Math.PI/2]} scale={[.035,.55,.035]}/><Cube kind="paint" color="#d4c6a8" position={[-.3,-.07,0]} scale={[.15,.19,.15]}/></group>
  <Cube kind="wood" color="#715e48" position={[2.47,.96,0]} scale={[1.02,1.78,.09]}/><Cube kind="paint" color="#dbceb4" position={[2.47,.96,.06]} scale={[.91,1.63,.02]}/>
  <SceneLabel position={[2.47,1.48,.11]}>发现记录</SceneLabel><SceneLabel position={[2.47,.93,.11]}>{option===0?`物品 → 第 ${value} 层`:'层位：未记录'}</SceneLabel><SceneLabel position={[2.47,.49,.11]}>外形 ≠ 年代</SceneLabel>
  <SceneLabel position={[0,.2,1.93]}>虚拟探方 · 真实考古要保留上下文</SceneLabel>
 </group>;
}

function AncientPottery({value,option,motion}:HistoryProps) {
 return <group>
  <Cube kind="wood" color="#85704f" position={[0,.13,0]} scale={[3.5,.22,2.4]}/>
  <Rod kind="paint" color="#b58b6c" position={[0,.29,0]} scale={[.62,.10,.62]}/>
  <HistoryCoils count={value} pattern={option} motion={motion}/>
  <HistoryInspect detail="绳纹与盘筑可提供工艺线索；不是年代或文明等级" position={[1.8,1.15,.4]}>
   <Cube kind="wood" color="#947650" position={[1.8,.65,0]} scale={[.85,.85,.07]}/><mesh position={[1.8,.65,.05]} scale={[.73,.73,.03]}><boxGeometry/><HistorySurface color="#c3a080" pattern={option}/></mesh>
  </HistoryInspect>
  <SceneLabel position={[-1.65,.5,0]}>泥条盘筑</SceneLabel><SceneLabel position={[1.8,1.75,0]}>{option===1?'绳纹装饰':'盘筑纹'}</SceneLabel>
  <SceneLabel position={[0,.25,1.72]}>{value} 圈泥条 · 手工塑形示意，不展示烧制</SceneLabel>
 </group>;
}

function Crop({barley=false}:{barley?:boolean}) {return <group>
 <Rod kind="paint" color="#758547" position={[0,.37,0]} scale={[.014,.72,.014]}/>
 <Ball kind="paint" color="#c8af68" position={[0,.77,0]} scale={[barley?.07:.09,.20,.07]}/>
 {[-1,1].map(sign=><HistoryLink key={sign} from={[0,.43,0]} to={[sign*.15,.57,.03]} color="#799055" width={.012}/>)}
 {barley&&[-1,0,1].map(i=><HistoryLink key={i} from={[0,.88,0]} to={[i*.1,1.12,.02]} color="#d3bc7c" width={.007}/>)}
</group>}
function EarlyFarming({value,option,motion}:HistoryProps) {
 const seeds=useRef<Group>(null),crops=useRef<Group>(null),basket=useRef<Group>(null),store=useRef<Group>(null),grain=useRef<Mesh>(null);
 useFrame(()=>{
  const p=motion.current,grow=soften(portion(p,1,value)),harvest=soften(portion(p,2,value)),storage=soften(portion(p,3,value));
  seeds.current?.children.forEach((seed,i)=>{seed.position.y=.8-(.57*soften(portion(p,0,value)));seed.visible=grow<.3;seed.position.x=-1.55+(i%3-1)*.32});
  if(crops.current){crops.current.scale.y=.02+.98*grow;crops.current.visible=value>=2;crops.current.position.y=.23-harvest*.53}
  if(basket.current)basket.current.visible=harvest>.5&&storage<.86;
  if(store.current)store.current.visible=storage>.5;
  if(grain.current){grain.current.visible=storage>0&&storage<1;grain.current.position.set(.7+1.7*storage,.9+Math.sin(storage*Math.PI)*.45,0)}
 });
 return <group>
  <Cube kind="ground" color="#9a8865" position={[-1.5,.12,0]} scale={[2.15,.22,1.65]}/>
  {[-.55,0,.55].map(z=><HistoryLink key={z} from={[-2.4,.23,z]} to={[-.65,.23,z]} color="#695a40" width={.025}/>)}
  <group ref={seeds}>{Array.from({length:6},(_,i)=><Ball key={i} color="#d8c180" position={[-1.55+(i%3-1)*.32,.8,(Math.floor(i/3)-.5)*.6]} scale={[.045,.028,.025]}/>)}</group>
  <group ref={crops} position={[0,.23,0]}>{Array.from({length:6},(_,i)=><group key={i} position={[-1.55+(i%3-1)*.32,0,(Math.floor(i/3)-.5)*.6]}><HistoryInspect detail={option===0?'小麦示例：不同地区的作物各有特点':'大麦示例：外形只是辨认提示'}><Crop barley={option===1}/></HistoryInspect></group>)}</group>
  <Rod kind="wood" color="#9f8256" position={[.7,.33,0]} scale={[.48,.5,.48]}/><Rod kind="paint" color="#554d34" position={[.7,.59,0]} scale={[.43,.015,.43]}/>
  <group ref={basket} position={[.7,.65,0]}>{Array.from({length:8},(_,i)=><Ball key={i} color="#d1ba74" position={[Math.sin(i*2)*.25,(i%3)*.04,Math.cos(i*2)*.25]} scale={[.07,.035,.04]}/>)}</group>
  <HistoryInspect detail="收获后保存粮食，是农事过程的一部分" position={[2.3,1.5,.5]}><PotModel position={[2.3,.12,0]} scale={1.05}/></HistoryInspect>
  <group ref={store} position={[2.3,.91,0]}>{Array.from({length:6},(_,i)=><Ball key={i} color="#d1ba74" position={[Math.sin(i*2)*.16,0,Math.cos(i*2)*.16]} scale={[.055,.03,.04]}/>)}</group><Ball ref={grain} color="#d1ba74" scale={.075}/>
  <HistoryPath points={[[-2.4,.30,1.05],[-.7,.30,1.05],[.7,.30,1.05],[2.3,.30,1.05]]} motion={motion}/>
  <SceneLabel position={[-1.5,1.85,0]}>{option===0?'小麦田':'大麦田'}</SceneLabel><SceneLabel position={[.7,1.5,0]}>收获</SceneLabel><SceneLabel position={[2.3,1.85,0]}>储藏</SceneLabel>
  <SceneLabel position={[0,.25,1.8]}>播种 → 生长 → 收获 → 储藏 · 压缩时间示意</SceneLabel>
 </group>;
}

function WritingHistory({value,option,motion}:HistoryProps) {
 const textures=useHistoryGlyphs(writingSymbols),marks=useRef<(Group|null)[]>([]),tool=useRef<Group>(null);
 useFrame(()=>{
  marks.current.forEach((mark,i)=>{if(mark)mark.visible=portion(motion.current,i,value)>.5});
  if(tool.current){const i=Math.min(value-1,Math.floor(motion.current*value)),phase=motion.current*value-i;tool.current.position.set(-1.1+(i%3)*.86,.96-Math.sin(Math.min(1,phase)*Math.PI)*.24,Math.floor(i/3)*.8-.4);tool.current.rotation.z=option===0?.18:-.3;tool.current.visible=motion.current>0&&motion.current<1}
 });
 return <group>
  <Cube kind="wood" color="#846d4d" position={[0,.35,0]} scale={[3.65,.20,2.55]}/>
  <HistoryInspect detail={option===0?'泥板：用工具压出凹痕，符号只是示意':'纸草：切开的植物片交叠成书写面，与纤维纸不同'} position={[0,1.9,.6]}><mesh position={[0,option===0?.505:.51,0]} scale={[3.2,option===0?.11:.12,2.15]}><boxGeometry/><HistorySurface color={option===0?'#b99a75':'#dccb9d'} mode={option===0?'clay':'papyrus'}/></mesh></HistoryInspect>
  {option===0?<group position={[0,.577,0]}><ClayImpressions count={value} motion={motion}/></group>:Array.from({length:value},(_,i)=><group key={i} ref={node=>{marks.current[i]=node}} position={[-1.1+(i%3)*.86,.577,Math.floor(i/3)*.8-.4]}><GlyphFace texture={textures[i]} scale={.42}/></group>)}
  <group ref={tool}><Rod kind="wood" color="#876343" rotation={[0,0,.2]} scale={[.023,.65,.023]}/>{option===1&&<mesh position={[-.06,-.34,0]} rotation={[0,0,.2]}><coneGeometry args={[.036,.13,6]}/><meshStandardMaterial color="#343c31"/></mesh>}</group>
  {option===1&&[-1.75,1.75].map(x=><Rod key={x} kind="paint" color="#c9b484" position={[x,.63,0]} rotation={[Math.PI/2,0,0]} scale={[.12,2.2,.12]}/>)}
  <SceneLabel position={[0,2.55,0]}>{option===0?'泥板压印':'纸草墨写'} · {value} 个示意符号</SceneLabel><SceneLabel position={[0,.25,1.85]}>材料与方法相配 · 不表示统一替换顺序或古文译文</SceneLabel>
 </group>;
}

function PaperMaking({value,option,motion}:HistoryProps) {
 const screen=useRef<Group>(null),press=useRef<Mesh>(null),dry=useRef<Group>(null),pulp=useRef<Group>(null);
 useFrame(()=>{
  const p=motion.current,form=soften(portion(p,1,value)),pressed=portion(p,2,value),dried=soften(portion(p,3,value));
  if(screen.current){screen.current.position.set(-1.9+1.9*form,.57+.24*Math.sin(form*Math.PI),0);screen.current.visible=value>=2}
  if(press.current){press.current.visible=value>=3;press.current.position.y=1.1-.43*Math.sin(pressed*Math.PI)}
  if(dry.current){dry.current.visible=dried>0;dry.current.position.set(2.25,.74+.42*dried,0);dry.current.rotation.z=-dried*Math.PI/2}
  if(pulp.current)pulp.current.visible=form<.65;
 });
 return <group>
  <Cube kind="wood" color="#897350" position={[-1.9,.26,0]} scale={[1.85,.50,2.05]}/><Cube kind="water" color="#b1c6b6" position={[-1.9,.51,0]} scale={[1.62,.04,1.80]}/>
  <group ref={pulp} position={[-1.9,.54,0]}><FiberSheet motion={motion} clustered={option===1} density={.35}/></group>
  <Cube kind="wood" color="#9b8360" position={[0,.33,0]} scale={[1.88,.50,2.03]}/>
  <group ref={screen} position={[-1.9,.57,0]}><HistoryInspect detail="抄纸帘托住纤维，水从缝隙排出；不是纸草片" position={[0,.8,.3]}><FiberSheet motion={motion} clustered={option===1}/>{[-.83,.83].map(x=><Cube key={x} kind="wood" color="#a99264" position={[x,0,0]} scale={[.09,.10,1.88]}/>)}{[-.92,.92].map(z=><Cube key={z} kind="wood" color="#a99264" position={[0,0,z]} scale={[1.74,.10,.09]}/>)}</HistoryInspect></group>
  <Cube ref={press} kind="wood" color="#b39b73" position={[0,1.1,0]} scale={[1.69,.12,1.87]}/>
  <group ref={dry} position={[2.25,.9,0]}><HistoryInspect detail={option===0?'分散纤维形成较连续的纸面；工艺还有许多步骤':'纤维聚团造成示意不均；不据此计算纸的强度'} position={[0,.95,.4]}><FiberSheet motion={motion} clustered={option===1}/></HistoryInspect></group>
  <HistoryLink from={[2.28,.35,-1.05]} to={[2.28,2.28,-1.05]} color="#806646" width={.04}/><HistoryLink from={[2.28,.35,1.05]} to={[2.28,2.28,1.05]} color="#806646" width={.04}/><HistoryLink from={[2.28,2.28,-1.05]} to={[2.28,2.28,1.05]} color="#806646" width={.04}/>
  <SceneLabel position={[-1.9,1.58,0]}>分散纤维</SceneLabel><SceneLabel position={[0,1.9,0]}>抄纸 · 压水</SceneLabel><SceneLabel position={[2.25,2.75,0]}>干燥</SceneLabel>
  <SceneLabel position={[0,.25,1.85]}>第 {value} 个观察阶段 · 真实手工造纸远不止四步</SceneLabel>
 </group>;
}

function WoodblockPrinting({value,option,motion}:HistoryProps) {
 const texture=useHistoryMotif(option),brush=useRef<Group>(null),paper=useRef<Group>(null),copies=useRef<(Group|null)[]>([]),ink=useRef<Mesh>(null);
 useFrame(()=>{
  const p=motion.current,inked=soften(Math.min(1,p/.2)),printing=Math.max(0,(p-.22)/.78),cycle=Math.min(value-1,Math.floor(printing*value)),phase=printing*value-cycle;
  if(brush.current){brush.current.position.x=-1.9+1.4*inked;brush.current.visible=p>0&&p<.22}
  if(ink.current)(ink.current.material as MeshBasicMaterial).opacity=.15+.85*inked;
  if(paper.current){paper.current.visible=p>.22&&p<1;paper.current.position.y=.73+.64*(1-Math.sin(Math.min(1,phase)*Math.PI));paper.current.position.x=-1.2}
  copies.current.forEach((copy,i)=>{if(copy)copy.visible=printing>=(i+1)/value});
 });
 return <group>
  <Cube kind="wood" color="#897151" position={[-1.2,.35,0]} scale={[2.05,.5,2.20]}/><Cube kind="wood" color="#9d7b4f" position={[-1.2,.66,0]} scale={[1.78,.12,1.86]}/>
  <HistoryInspect detail="整块版保留同一图案，可以再次施墨印刷" position={[-1.2,1.9,.3]}><mesh ref={ink} position={[-1.2,.728,0]} rotation={[-Math.PI/2,0,0]} scale={[-1.55,1.65,1]}><planeGeometry/><meshBasicMaterial map={texture} transparent depthWrite={false} side={2} opacity={.15} toneMapped={false}/></mesh></HistoryInspect>
  <group ref={brush} position={[-1.9,.86,0]}><Rod kind="wood" color="#a2875f" scale={[.027,.56,.027]}/><Cube kind="paint" color="#353d32" position={[0,-.22,0]} scale={[.28,.12,1.25]}/></group>
  <group ref={paper} position={[-1.2,1.25,0]}><Cube kind="paint" color="#e8dfc7" scale={[1.64,.025,1.73]}/></group>
  <Cube kind="wood" color="#947a54" position={[1.6,1.43,0]} scale={[2.06,2.45,.08]}/>
  {Array.from({length:value},(_,i)=><group key={i} ref={node=>{copies.current[i]=node}} position={[1.15+(i%2)*.9,.89+Math.floor(i/2)*1.08,.10]} rotation={[Math.PI/2,0,0]} scale={.55}><HistoryInspect detail={`第 ${i+1} 张 · 展示副本，同一雕版留下对应图案`} position={[0,.65,.3]}><Cube kind="paint" color="#e8dfc7" scale={[1.70,.025,1.81]}/><group position={[0,.019,0]}><GlyphFace texture={texture} scale={1.54}/></group></HistoryInspect></group>)}
  <Cube kind="wood" color="#867454" position={[1.65,.35,0]} scale={[2,.45,2.18]}/>
  <SceneLabel position={[-1.2,2.55,0]}>{option===0?'花叶版':'波纹版'}</SceneLabel><SceneLabel position={[1.65,2.88,0]}>同一版 → {value} 张纸</SceneLabel><SceneLabel position={[0,.25,1.9]}>虚拟施墨 → 转印 · 图案为原创示意</SceneLabel>
 </group>;
}

function MovableType({value,option,motion}:HistoryProps) {
 const textures=useHistoryGlyphs(typeCharacters),blocks=useRef<(Group|null)[]>([]),paper=useRef<Group>(null),imprint=useRef<Group>(null),order=useMemo(()=>Array.from({length:value},(_,i)=>option===1?value-1-i:i),[value,option]);
 useFrame(()=>{
  blocks.current.forEach((block,i)=>{if(!block)return;const p=soften(portion(Math.min(1,motion.current/.66),i,value)),slot=value-1-order.indexOf(i);block.position.set(-2.35*(1-p)+(-.85+slot*1.7/Math.max(1,value-1))*p,.55+Math.sin(p*Math.PI)*.55,.42*(i%3-1)*(1-p));block.rotation.y=(1-p)*.12});
  if(paper.current){const contact=soften(Math.min(1,Math.max(0,(motion.current-.66)/.14))),transfer=soften(Math.min(1,Math.max(0,(motion.current-.82)/.18)));paper.current.visible=motion.current>.66;paper.current.position.set(2.38*transfer,1.25-.595*contact+Math.sin(transfer*Math.PI)*.32,0)}
  if(imprint.current)imprint.current.visible=motion.current>=.80;
 });
 return <group>
  <Cube kind="wood" color="#88704e" position={[-2.35,.32,0]} scale={[1.45,.48,1.70]}/><Cube kind="wood" color="#987b55" position={[0,.33,0]} scale={[2.15,.50,1.52]}/>
  {[-1.06,1.06].map(x=><Cube key={x} kind="metal" color="#7a847f" position={[x,.66,0]} scale={[.07,.26,1.45]}/>)}{[-.73,.73].map(z=><Cube key={z} kind="metal" color="#7a847f" position={[0,.66,z]} scale={[2.12,.26,.07]}/>)}
  {Array.from({length:value},(_,i)=><group key={i} ref={node=>{blocks.current[i]=node}} position={[-2.35,.55,.42*(i%3-1)]}><HistoryInspect detail={`独立字块「${typeCharacters[i]}」· 可拆开后重新排列`} position={[0,.72,.35]}><Cube kind="wood" color="#b49b73" scale={[.28,.18,.38]}/><group position={[0,.096,0]}><GlyphFace texture={textures[i]} scale={.25} mirror/></group></HistoryInspect></group>)}
  <Cube kind="wood" color="#8b7655" position={[2.38,.33,0]} scale={[2.12,.50,1.58]}/>
  <group ref={paper} position={[0,1.25,0]}><Cube kind="paint" color="#e3d8bb" scale={[2.01,.025,1.40]}/><group ref={imprint}>{order.map((character,i)=><group key={i} position={[-.85+i*1.7/Math.max(1,value-1),.019,0]}><GlyphFace texture={textures[character]} scale={.26}/></group>)}</group></group>
  <SceneLabel position={[-2.35,1.75,0]}>独立字块</SceneLabel><SceneLabel position={[0,2.10,0]}>{option===0?'顺序排版':'换位排版'}</SceneLabel><SceneLabel position={[2.38,1.70,0]}>版面与印迹对应</SceneLabel><SceneLabel position={[0,.25,1.85]}>现代汉字原理示意 · 不是古代原文字形</SceneLabel>
 </group>;
}

function SilkRoad({value,option,motion}:HistoryProps) {
 const traveler=useRef<Group>(null),goods=useRef<(Group|null)[]>([]);
 const points=useMemo(()=>Array.from({length:value},(_,i)=>[-2.55+5.1*i/(value-1),.28,(option===0?.7:-.8)*Math.sin(i/(value-1)*Math.PI*2)] as HistoryPoint),[value,option]);
 const curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,'centripetal'),[points]),position=useMemo(()=>new Vector3(),[]),tangent=useMemo(()=>new Vector3(),[]);
 useFrame(()=>{if(traveler.current){curve.getPoint(motion.current,position);curve.getTangent(motion.current,tangent);traveler.current.position.copy(position);traveler.current.rotation.y=-Math.atan2(tangent.z,tangent.x)}goods.current.forEach((item,i)=>{if(item)item.visible=motion.current>=i/(value-1)})});
 return <group>
  <Cube kind={option===0?'ground':'water'} color={option===0?'#b5a17b':'#759ea2'} position={[0,.12,0]} scale={[6.15,.22,3.15]}/>
  {points.map(([x,y,z],i)=><group key={i} position={[x,y,z]}><HistoryInspect detail={`交流点 ${i+1} · 商旅常走其中一段，也交换技艺和想法`} position={[0,1.3,.45]}><Cube kind="stone" color={option===0?'#c4b28c':'#aab399'} scale={[.48,.22,.60]}/>{option===0?<mesh position={[0,.48,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[.37,.63,4]}/><PhysicalMaterial kind="wood" color="#937a57"/></mesh>:<Rod kind="wood" color="#927550" position={[0,.2,.38]} scale={[.025,.45,.025]}/>}</HistoryInspect><group ref={node=>{goods.current[i]=node}} position={[0,.15,.60]}>{i%2?<Cube kind="paint" color="#887799" scale={[.26,.15,.19]}/>:<PotModel scale={.32}/>}</group><SceneLabel position={[0,-.03,-.48]}>{i+1}</SceneLabel></group>)}
  <HistoryPath points={points} motion={motion} color={option===0?'#906b43':'#d9d3b2'} radius={.016}/>
  <group ref={traveler} position={points[0]} scale={.75}>{option===0?<HistoryCamel/>:<HistoryBoat/>}</group>
  <SceneLabel position={[0,2.55,0]}>{option===0?'陆路商队':'海路商船'} · 连接 {value} 个交流点</SceneLabel><SceneLabel position={[0,.25,1.95]}>丝路是陆海网络 · 此图不对应真实地图或统一年代</SceneLabel>
 </group>;
}

function SkyStars({cloudy}:{cloudy:boolean}) {
 const geometry=useMemo(()=>{const result=new BufferGeometry(),vertices=[];for(let i=0;i<24;i++)vertices.push(Math.sin(i*2.399)*2.8,2.65+(i%4)*.16,-1.4+Math.cos(i*1.618)*.4);result.setAttribute('position',new Float32BufferAttribute(vertices,3));return result},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);return <points geometry={geometry} visible={!cloudy}><pointsMaterial color="#fff1cc" size={.055} sizeAttenuation toneMapped={false}/></points>;
}
function AncientNavigation({value,option,motion}:HistoryProps) {
 const boat=useRef<Group>(null),needle=useRef<Group>(null),points=useMemo(()=>Array.from({length:value+1},(_,i)=>[-2.25+4.4*i/value,.3,-.55+Math.sin(i/value*Math.PI*1.5)*.9] as HistoryPoint),[value]);
 const curve=useMemo(()=>new CatmullRomCurve3(points.map(p=>new Vector3(...p)),false,'centripetal'),[points]),position=useMemo(()=>new Vector3(),[]),tangent=useMemo(()=>new Vector3(),[]);
 useFrame(()=>{if(boat.current){curve.getPoint(motion.current,position);curve.getTangent(motion.current,tangent);const angle=-Math.atan2(tangent.z,tangent.x);boat.current.position.copy(position);boat.current.rotation.y=angle;if(needle.current)needle.current.rotation.y=-angle+.12}});
 return <group>
  <Cube kind="water" color="#486f7f" position={[0,.15,0]} scale={[6.2,.26,3.2]}/><Cube kind="paint" color="#354b65" position={[0,2.62,-1.95]} scale={[6.10,1.45,.08]}/><SkyStars cloudy={option===1}/>
  {option===1&&[-1.5,0,1.5].map(x=><group key={x} position={[x,2.65,-1.3]}>{[-.25,.25].map(dx=><Ball key={dx} kind="paint" color="#b0bcc0" position={[dx,0,0]} scale={[.64,.25,.30]}/>)}</group>)}
  <HistoryPath points={points} motion={motion} color="#c8bc90" radius={.014}/>
  <group ref={boat} position={points[0]}><HistoryBoat/><group position={[.4,.39,.16]} scale={.6}><Rod kind="metal" color="#bea372" scale={[.18,.03,.18]}/><group ref={needle}><mesh position={[0,.036,-.10]} rotation={[-Math.PI/2,0,0]}><coneGeometry args={[.035,.2,3]}/><meshBasicMaterial color="#c45e43"/></mesh><mesh position={[0,.036,.10]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.035,.2,3]}/><meshBasicMaterial color="#dfd7be"/></mesh></group></group></group>
  <HistoryInspect detail="罗盘朝磁北；磁北与真北不同，偏角只作示意" position={[2.30,1.30,1.05]}><Rod kind="wood" color="#97784f" position={[2.3,.50,1.08]} scale={[.45,.20,.45]}/><HistoryLink from={[2.3,.63,1.08]} to={[2.25,.63,.72]} color="#ca6049" width={.023}/><HistoryLink from={[2.3,.63,1.08]} to={[2.30,.63,1.44]} color="#d7d5c1" width={.018}/></HistoryInspect>
  <SceneLabel position={[-1.9,1.5,0]}>{option===0?'晴夜：观察天体':'多云：观察罗盘'}</SceneLabel><SceneLabel position={[0,.25,1.95]}>北半球航海示意 · 星与罗盘不直接给出完整位置</SceneLabel>
 </group>;
}

function RailVehicle({electric,motion}:{electric:boolean;motion:HistoryMotion}) {
 const wheels=useRef<(Group|null)[]>([]),rod=useRef<Group>(null),steam=useRef<Group>(null);
 useFrame(()=>{
  const angle=motion.current*2.4/.16;wheels.current.forEach(wheel=>{if(wheel)wheel.rotation.z=-angle});if(rod.current)rod.current.position.set(Math.cos(angle)*.09,.43+Math.sin(angle)*.09,.31);
  if(steam.current){steam.current.visible=!electric&&motion.current>0&&motion.current<1;steam.current.children.forEach((puff,i)=>{const phase=(motion.current*3+i*.17)%1;puff.position.set(.31-phase*.45,1.25+phase*.65,Math.sin(i*2)*.09);puff.scale.setScalar(.045+phase*.13)})}
 });
 return <group>
  <Cube kind="metal" color={electric?'#577f88':'#465b5d'} position={[0,.45,0]} scale={[1.06,.25,.55]}/>
  {electric?<><Cube kind="metal" color="#c5ccc2" position={[0,.78,0]} scale={[1,.50,.53]}/><Cube kind="glass" color="#456d7d" position={[.51,.87,0]} scale={[.025,.17,.39]}/><HistoryLink from={[-.25,1.04,0]} to={[0,1.55,0]} color="#737b76" width={.025}/><HistoryLink from={[0,1.55,0]} to={[.25,1.04,0]} color="#737b76" width={.025}/></>:<><Rod kind="metal" color="#6c776b" position={[.16,.75,0]} rotation={[0,0,Math.PI/2]} scale={[.23,.72,.23]}/><Cube kind="metal" color="#577273" position={[-.37,.85,0]} scale={[.31,.67,.52]}/><Rod kind="metal" color="#424e4c" position={[.31,1.11,0]} scale={[.07,.30,.07]}/><group ref={rod}><HistoryLink from={[-.32,0,0]} to={[.33,0,0]} color="#c5c9bd" width={.027}/></group></>}
  {[-.32,.33].flatMap((x,i)=>[-.32,.32].map((z,j)=><group key={`${i}-${j}`} ref={node=>{wheels.current[i*2+j]=node}} position={[x,.43,z]}><Rod kind="metal" color="#3c4746" rotation={[Math.PI/2,0,0]} scale={[.16,.07,.16]}/><Cube kind="metal" color="#b8b5a4" position={[0,0,z<0?-.05:.05]} scale={[.24,.025,.015]}/></group>))}
  <group ref={steam}>{Array.from({length:5},(_,i)=><Ball key={i} color="#dadbd0" scale={.08}/>)}</group>
 </group>;
}
function RailwayHistory({value,option,motion}:HistoryProps) {
 const train=useRef<Group>(null),engineX=value*.75/2;
 useFrame(()=>{if(train.current)train.current.position.x=-1.2+2.4*motion.current});
 return <group>
  <Cube kind="stone" color="#8e958b" position={[0,.11,0]} scale={[7.1,.2,1.9]}/>
  {Array.from({length:20},(_,i)=><Cube key={i} kind="wood" color="#7d6c51" position={[-3.3+i*.35,.23,0]} scale={[.11,.06,1.10]}/>)}{[-.35,.35].map(z=><Cube key={z} kind="metal" color="#abb3aa" position={[0,.28,z]} scale={[7,.08,.045]}/>)}
  {option===1&&<><HistoryLink from={[-3.1,1.60,0]} to={[3.1,1.60,0]} color="#84948d" width={.015}/>{[-2.9,2.9].map(x=><group key={x}><HistoryLink from={[x,.18,-.7]} to={[x,1.65,-.7]} color="#6e817a" width={.032}/><HistoryLink from={[x,1.60,-.7]} to={[x,1.60,0]} color="#6e817a" width={.025}/></group>)}</>}
  <group ref={train} position={[-1.2,0,0]}><group position={[engineX,.05,0]}><HistoryInspect detail={option===0?'蒸汽推动活塞，再由连杆带动车轮；这里没有真实热源':'电力列车由供电系统向电机供能；此处只示意结构'} position={[0,1.75,.55]}><RailVehicle electric={option===1} motion={motion}/></HistoryInspect></group>
   {Array.from({length:value},(_,i)=><group key={i} position={[engineX-(i+1)*.75,0,0]}><Cube kind="metal" color="#967c57" position={[0,.66,0]} scale={[.62,.60,.55]}/><Cube kind="glass" color="#527882" position={[0,.73,.282]} scale={[.42,.16,.01]}/>{[-.21,.21].flatMap(x=>[-.32,.32].map(z=><Rod key={`${x}-${z}`} kind="metal" color="#46534f" position={[x,.45,z]} rotation={[Math.PI/2,0,0]} scale={[.13,.06,.13]}/>) )}</group>)}
  </group>
  <SceneLabel position={[0,2.7,0]}>{option===0?'蒸汽 → 活塞 → 连杆 → 车轮':'供电 → 电机 → 车轮'}</SceneLabel><SceneLabel position={[0,.25,1.7]}>{value} 节车厢 · 演示速度相同，不比较真实性能</SceneLabel>
 </group>;
}

const historyScenes={'archaeology-layers':Archaeology,'ancient-pottery':AncientPottery,'early-farming':EarlyFarming,'writing-history':WritingHistory,'paper-making':PaperMaking,'woodblock-printing':WoodblockPrinting,'movable-type':MovableType,'silk-road':SilkRoad,'ancient-navigation':AncientNavigation,'railway-history':RailwayHistory};
export default function HistoryExperiments(props:SceneProps) {
 const motion=useExperimentMotion(props),Scene=historyScenes[props.lesson as keyof typeof historyScenes];
 return <ExperimentFrame props={props}>{Scene&&<Scene value={props.state.experimentValue} option={props.state.experimentOption} motion={motion}/>}</ExperimentFrame>;
}
