import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const base=process.env.E2E_BASE_URL||'http://127.0.0.1:5173/';
const lessons=JSON.parse(await readFile(new URL('../src/content/lessons.json',import.meta.url),'utf8'));
const browser=await chromium.launch({channel:process.env.E2E_BROWSER_CHANNEL||'chrome',headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const checks=[];
try {
 const chosen=process.env.AUDIO_ONLY?lessons.filter(lesson=>process.env.AUDIO_ONLY.split(',').includes(lesson.id)):lessons;
 for(const lesson of chosen){
  await page.goto(`${base}#/lesson/${lesson.id}?age=4-5`);
  await page.getByRole('button',{name:'听讲解',exact:true}).click();
  await page.getByRole('button',{name:'暂停讲解',exact:true}).waitFor({timeout:30000});
  await page.waitForFunction(()=>Number(document.querySelector('.audio-time')?.textContent?.split('/')[0])>=1);
  await page.getByRole('button',{name:'暂停讲解',exact:true}).click();
  await page.getByRole('button',{name:'继续讲解',exact:true}).waitFor();
  const paused=await page.locator('.audio-time').innerText();
  await page.getByRole('button',{name:'继续讲解',exact:true}).click();
  await page.getByRole('button',{name:'暂停讲解',exact:true}).waitFor();
  await page.getByRole('button',{name:'重听这一段',exact:true}).click();
  await page.getByRole('button',{name:'暂停讲解',exact:true}).waitFor();
  checks.push({lesson:lesson.id,clip:lesson.tracks['4-5'].steps[0].clip.id,pausedTime:paused,result:'Real MP3 advanced, paused, resumed and replayed; no Audio mock'});
 }
 await mkdir('artifacts',{recursive:true});
 await writeFile(process.env.AUDIO_REPORT||'artifacts/real-audio-browser.json',JSON.stringify({base,browser:await browser.version(),checks,humanListeningVerified:false},null,2));
 console.log(`Real MP3 playback verified for ${checks.length} themes.`);
} finally {await browser.close();}
