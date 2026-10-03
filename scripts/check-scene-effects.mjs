import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173/';
const output = process.env.SCENE_AUDIT_OUTPUT || 'output/playwright/scene-effects';
const lessons = JSON.parse(await readFile('src/content/lessons.json', 'utf8'));
const experiments = JSON.parse(await readFile('src/content/experiments.json', 'utf8'));
const only = process.env.SCENE_AUDIT_ONLY?.split(',');
const samples = new Set(['day-night','water-cycle','magnetism','electric-circuit','solar-panel','pulley','color-wheel','mosaic','fractions']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output, {recursive:true});
if(process.env.SCENE_REFRESH_PREVIEWS)await mkdir('public/previews',{recursive:true});
const browser = await chromium.launch({channel:process.env.E2E_BROWSER_CHANNEL || 'chrome', headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const page = await context.newPage();
let errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {if(message.type()==='error') errors.push(message.text());});
const report = {base,checkedAt:new Date().toISOString(),desktop:[],mobile:[],failures:[]};
try {
 for (const lesson of lessons) {
  if (only && !only.includes(lesson.id)) continue;
  errors = [];
  const experiment = experiments.find(e => e.id === lesson.id);
  try {
   await page.goto(`${base}#/lesson/${lesson.id}?age=4-5`);
   const canvas = page.locator('.experiment-canvas canvas');
   await canvas.waitFor({state:'visible',timeout:60000});
   await page.locator('.scene-loading-overlay').waitFor({state:'hidden',timeout:60000});
   await page.getByRole('button',{name:'我来试试看',exact:true}).click();
   if (experiment) {
    const slider=page.getByRole('slider',{name:experiment.parameterLabel,exact:true});
    await slider.focus();await slider.press('Home');
    for(let i=experiment.min;i<experiment.targetValue;i++)await slider.press('ArrowRight');
    await page.locator('.experiment-options').getByRole('button',{name:experiment.options[experiment.targetOption],exact:true}).click();
    await page.getByRole('button',{name:experiment.actionLabel,exact:true}).click();
   } else {
    const button=name=>page.getByRole('button',{name,exact:true});
    if(lesson.id==='day-night')await button('转动地球').click();
    if(lesson.id==='water-cycle')await page.getByRole('button',{name:/降雨/}).click();
    if(lesson.id==='gears')await button('启动齿轮').click();
    if(lesson.id==='bridge'){await button('桥面').click();await button('桥墩').click();await button('让小车过桥').click();}
    if(lesson.id==='light')for(const name of ['红灯','绿灯','蓝灯'])await button(name).click();
    if(lesson.id==='shapes')for(let i=0;i<3;i++)await button('添加小球').click();
   }
   await page.waitForTimeout(200);
   await page.getByRole('button',{name:'暂停动画',exact:true}).click();
   await page.waitForTimeout(120);
   const firstImage = await canvas.screenshot();
   const first = hash(firstImage);
   await page.waitForTimeout(300);
   const secondImage = await canvas.screenshot();
   const second = hash(secondImage);
   const effects = await canvas.getAttribute('data-scene-effects');
   const glError = await canvas.evaluate(element => {
    const gl=element.getContext('webgl2');return gl?gl.getError():-1;
   });
   if (first !== second) {
    await writeFile(`${output}/${lesson.id}-pause-before.png`,firstImage);
    await writeFile(`${output}/${lesson.id}-pause-after.png`,secondImage);
    throw new Error('Canvas changed while animation was paused');
   }
   if (glError !== 0) throw new Error(`WebGL error ${glError}`);
   if (!effects) throw new Error('Postprocessing did not initialize');
   if (errors.length) throw new Error(errors.join('\n'));
   if(lesson.id==='day-night') {
    await page.getByRole('button',{name:'转动地球',exact:true}).click();
    if(hash(await canvas.screenshot())===second)throw new Error('Paused earth did not redraw a changed angle');
   }
   await page.getByRole('button',{name:'继续动画',exact:true}).click();
   if (experiment) await page.getByRole('button',{name:experiment.actionLabel,exact:true}).waitFor({state:'visible',timeout:30000});
   if(lesson.id==='bridge')await page.getByRole('button',{name:'让小车过桥',exact:true}).waitFor({state:'visible',timeout:30000});
   if (samples.has(lesson.id)) await page.locator('.experiment-canvas').screenshot({path:`${output}/${lesson.id}-desktop.png`});
   if(process.env.SCENE_REFRESH_PREVIEWS) {
    const style=await page.addStyleTag({content:'[data-scene-overlays],.experiment-badges{visibility:hidden!important}'});
    await page.locator('.experiment-canvas').screenshot({path:`public/previews/${lesson.id}.png`});
    await style.evaluate(element=>element.remove());
   }
   const item={id:lesson.id,title:lesson.title,effects,pauseStable:true,webglError:glError,errors:[...errors]};
   report.desktop.push(item);
   console.log(`PASS ${lesson.id}: shader, pause, resume, ${effects}`);
  } catch(error) {report.failures.push({id:lesson.id,message:error.message,errors:[...errors]});console.error(`FAIL ${lesson.id}: ${error.message}`);}
 }
 await page.setViewportSize({width:390,height:844});
 for (const id of ['water-cycle','magnetism','electric-circuit','pulley','mosaic','fractions']) {
  if(only&&!only.includes(id))continue;
  errors=[];
  await page.goto(`${base}#/lesson/${id}?age=4-5`);
  await page.locator('.scene-loading-overlay').waitFor({state:'hidden',timeout:60000});
  const canvas=page.locator('.experiment-canvas canvas');
  const effects=await canvas.getAttribute('data-scene-effects');
  const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
  await page.locator('.experiment-canvas').screenshot({path:`${output}/${id}-mobile.png`});
  report.mobile.push({id,effects,fits,errors:[...errors]});
  if(effects!=='fxaa'||!fits||errors.length)report.failures.push({id,scope:'mobile',effects,fits,errors:[...errors]});
 }
}finally {
 await writeFile(`${output}/render-audit.json`,JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
console.log(`Scene rendering audit: ${report.desktop.length} desktop scenes, ${report.mobile.length} mobile samples, ${report.failures.length} failures`);
if(report.failures.length)process.exitCode=1;
