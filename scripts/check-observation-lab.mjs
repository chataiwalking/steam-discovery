import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.E2E_BASE_URL||'http://127.0.0.1:5173/';
const output=process.env.OBSERVATION_AUDIT_OUTPUT||'output/playwright/observation-lab';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,viewports:[],inspection:[],slowObservation:null,failures:[]};
const experiments=JSON.parse(await readFile('src/content/experiments.json','utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=(condition,message)=>{if(!condition)throw Error(message)};
try{
 for(const viewport of [{width:1440,height:1100},{width:1026,height:824},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}#/lesson/cell-world?age=4-5`);
  await page.locator('[data-scene-ready="cell-world"] canvas').waitFor({state:'visible',timeout:60000});
  await page.locator('.scene-loading-overlay').waitFor({state:'hidden'});
  await page.getByRole('region',{name:'场景观察要点',exact:true}).waitFor();
  const scrollBlocked=await page.locator('canvas').evaluate(canvas=>{let node=canvas;while(node&&!node.classList.contains('scene-viewport')){if(getComputedStyle(node).touchAction==='none')return true;node=node.parentElement;}return false;});
  check(!scrollBlocked,'Default view blocks page touch scrolling');
  check(await page.locator('[data-scene-overlays] .scene-label').count()===0,'Labels cover the default scene');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflows viewport');
  await page.locator('.experiment').screenshot({path:`${output}/cell-${viewport.width}.png`});
  await page.getByRole('button',{name:'显示名称标注',exact:true}).click();
  check(await page.locator('[data-scene-overlays] .scene-label').count()>0,'Name toggle did not show short labels');
  const long=await page.locator('[data-scene-overlays] .scene-label').evaluateAll(nodes=>nodes.some(n=>n.textContent.length>18));
  check(!long,'Long explanations still cover the model');
  await page.getByRole('button',{name:'显示名称标注',exact:true}).click();
  await page.getByRole('button',{name:'放大展台',exact:true}).click();
  check(await page.locator('.lesson-workspace-focus').count()===1,'Focus mode did not open');
  await page.getByRole('button',{name:'收起展台',exact:true}).click();
  report.viewports.push({viewport,labelsOffByDefault:true,shortLabelToggle:true,focusMode:true,errors});
  check(!errors.length,errors.join('\n'));await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 for(const id of ['day-night','gears','cell-world','contour-map']){
  await page.goto(`${base}#/lesson/${id}?age=4-5`);
  await page.locator(`[data-scene-ready="${id}"] canvas`).waitFor({state:'visible',timeout:60000});
  await page.getByRole('button',{name:'我来试试看',exact:true}).click();
  await page.getByRole('button',{name:'暂停动画',exact:true}).click();
  const canvas=page.locator('.experiment-canvas canvas');
  const frames=[];
  for(const view of ['perspective','front','top']){
   await page.getByRole('combobox',{name:'观察视角',exact:true}).selectOption(view);
   await page.waitForTimeout(150);frames.push(hash(await canvas.screenshot()));
  }
  check(new Set(frames).size===3,`${id}: view presets do not change paused canvas`);
  await page.getByRole('combobox',{name:'观察视角',exact:true}).selectOption('orbit');
  const b=await canvas.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  await page.mouse.down();await page.mouse.move(b.x+b.width/2+80,b.y+b.height/2+25,{steps:12});await page.mouse.up();
  const orbit=hash(await canvas.screenshot());
  await page.getByRole('button',{name:'还原观察视角',exact:true}).click();
  await page.waitForTimeout(150);check(orbit!==hash(await canvas.screenshot()),`${id}: orbit did not move`);
  await page.getByRole('button',{name:'放大模型',exact:true}).click();
  check(await page.getByLabel('模型缩放',{exact:true}).textContent()==='120%','Zoom readout is incorrect');
  check(await page.getByRole('button',{name:'去发现小规律',exact:true}).isDisabled(),`${id}: inspection incorrectly completed an experiment`);
  report.inspection.push({id,presets:true,orbit:true,zoom:true,evidenceUnchanged:true});
 }
 await page.goto(`${base}#/lesson/cell-world?age=4-5`);
 await page.locator('[data-scene-ready="cell-world"] canvas').waitFor({state:'visible',timeout:60000});
 await page.getByRole('button',{name:'我来试试看',exact:true}).click();
 await page.getByRole('button',{name:'半速观察',exact:true}).click();
 const experiment=experiments.find(e=>e.id==='cell-world'),start=Date.now();
 await page.getByRole('button',{name:experiment.actionLabel,exact:true}).click();
 await page.getByRole('button',{name:experiment.actionLabel,exact:true}).waitFor({state:'visible',timeout:30000});
 const elapsed=Date.now()-start;check(elapsed>=4700,`Half-speed experiment completed too early: ${elapsed}ms`);
 check((await page.locator('.control-note').textContent()).includes('已完成 1 次观察'),'Completion was duplicated or omitted');
 report.slowObservation={elapsed,completedExactlyOnce:true};
 for(const id of ['earth-layers','contour-map','plate-motion','seasons','breathing-lungs','flower-pollination']){
  if(!experiments.some(e=>e.id===id))continue;
  await page.goto(`${base}#/lesson/${id}?age=4-5`);await page.locator(`[data-scene-ready="${id}"] canvas`).waitFor({timeout:60000});
  await page.locator('.experiment').screenshot({path:`${output}/${id}.png`});
 }
 await page.close();
 report.fallback=[];
 for(const failure of ['no-webgl','context-lost','scene-load-failed']){
  const p=await browser.newPage({viewport:{width:390,height:844}});
  if(failure==='no-webgl')await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:original.call(this,kind,...args);};});
  if(failure==='scene-load-failed')await p.route(/\/(src\/scenes\/BiologyExperiments\.tsx|assets\/BiologyExperiments-[\w-]+\.js)(\?.*)?$/,route=>route.abort());
  await p.goto(`${base}#/lesson/cell-world?age=4-5`);
  if(failure==='context-lost'){
   await p.locator('[data-scene-ready="cell-world"] canvas').waitFor({timeout:60000});
   await p.getByRole('button',{name:'我来试试看',exact:true}).click();
   await p.getByRole('button',{name:experiment.actionLabel,exact:true}).click();
   await p.locator('canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  }
  await p.getByText('这个浏览器暂时无法展示三维互动。你仍然可以看图、阅读字幕、收听讲解。',{exact:true}).waitFor({timeout:60000});
  if(failure!=='context-lost')await p.getByRole('button',{name:'我来试试看',exact:true}).click();
  await p.locator('.scene-loading-overlay').waitFor({state:'hidden'});
  check(await p.getByRole('button',{name:experiment.actionLabel,exact:true}).isDisabled(),`${failure}: experiment is still clickable`);
  check(await p.getByRole('button',{name:'听讲解',exact:true}).isEnabled(),`${failure}: narration disabled`);
  check(await p.getByRole('button',{name:'去发现小规律',exact:true}).isDisabled(),`${failure}: false observation awarded`);
  report.fallback.push({failure,readable:true,controlsDisabled:true,noFalseCompletion:true});await p.close();
 }
}catch(error){report.failures.push(error.stack);process.exitCode=1;}
finally{await writeFile(`${output}/verification.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
