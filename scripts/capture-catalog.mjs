import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.E2E_BASE_URL||'http://127.0.0.1:5173/';
const out=process.env.CATALOG_OUTPUT||'artifacts/catalog50';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[],badResponses=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)badResponses.push([response.status(),response.url()])});
const sections=[];
try{
 await page.goto(base);await page.getByRole('button',{name:'探索昼夜的秘密',exact:true}).waitFor({timeout:60000});await page.locator('.scene-loading-overlay').waitFor({state:'hidden'});
 await page.screenshot({path:`${out}/home.png`,clip:{x:0,y:0,width:1440,height:920}});
 for(const subject of ['科学','技术','工程','艺术','数学']){
  await page.getByRole('navigation',{name:'STEAM分类'}).getByRole('button',{name:new RegExp(subject)}).click();
  await page.locator('#worlds').evaluate(element=>element.scrollIntoView({block:'start'}));
  await page.waitForLoadState('networkidle');
  const count=await page.locator('.lesson-card').count();if(count!==10)throw Error(`${subject}: expected10 got${count}`);
  await page.screenshot({path:`${out}/${subject}.png`,fullPage:false});sections.push({subject,count});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#worlds').evaluate(element=>element.scrollIntoView({block:'start'}));await page.waitForFunction(()=>Array.from(document.querySelectorAll('.lesson-card img')).filter(image=>{const box=image.getBoundingClientRect();return box.top<innerHeight&&box.bottom>0}).every(image=>image.complete&&image.naturalWidth>0));await page.screenshot({path:`${out}/mobile.png`,fullPage:false});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await writeFile(`${out}/report.json`,JSON.stringify({base,sections,overflow,errors,badResponses},null,2));console.log(JSON.stringify({sections,overflow,errors,badResponses}));
}finally{await browser.close()}
