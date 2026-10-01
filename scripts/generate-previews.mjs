import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const base=process.env.E2E_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({channel:process.env.E2E_BROWSER_CHANNEL||'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const scenes={'day-night':'地球自转 · 找找小屋的白天','water-cycle':'小水滴在这里',gears:'相邻齿轮 · 总是反着转',bridge:'三角形斜撑 · 连接更稳定',light:'让彩色的光，在这里相遇',shapes:'选形状 · 动手数一数'};
await mkdir('public/previews',{recursive:true});
try{
 for(const [id,label] of Object.entries(scenes)){
  await page.goto(`${base}#/lesson/${id}?age=4-5`);
  await page.getByText(label,{exact:true}).waitFor({timeout:60000});
  await page.waitForLoadState('networkidle');
  const hiddenStyle=await page.addStyleTag({content:'[data-scene-overlays],.experiment-badges{visibility:hidden!important}'});
  await page.evaluate(async()=>{for(let i=0;i<8;i++)await new Promise(requestAnimationFrame)});
  await page.locator('.experiment-canvas').screenshot({path:`public/previews/${id}.png`});
  await hiddenStyle.evaluate(element=>element.remove());
  console.log(`Captured real Three.js scene: ${id}`);
 }
}finally{await browser.close()}
