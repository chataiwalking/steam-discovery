import {test,expect,type Page} from '@playwright/test';
import type {ExperimentDefinition} from '../src/content/experiments';
import {readFileSync} from 'node:fs';
const experiments:ExperimentDefinition[]=JSON.parse(readFileSync(new URL('../src/content/experiments.json',import.meta.url),'utf8'));
const subjects=[{id:'S',name:'科学'},{id:'T',name:'技术'},{id:'E',name:'工程'},{id:'A',name:'艺术'},{id:'M',name:'数学'}];
import type {AgeBand} from '../src/types';
const ages:AgeBand[]=['2-3','4-5','6-8'];
async function value(page:Page,experiment:ExperimentDefinition,next:number){
 const range=page.getByRole('slider',{name:experiment.parameterLabel,exact:true});
 await range.focus();await range.press('Home');for(let i=experiment.min;i<next;i++)await range.press('ArrowRight');
 await expect(range).toHaveValue(String(next));
}
async function run(page:Page,experiment:ExperimentDefinition){
 await page.getByRole('button',{name:experiment.actionLabel,exact:true}).click();
 await expect(page.getByRole('button',{name:experiment.actionLabel,exact:true})).toBeVisible({timeout:30000});
}
for(const experiment of experiments)test(`${experiment.id} has a real scene and completes all three age tracks`,async({page})=>{
 test.setTimeout(150000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const age of ages){
  await page.goto(`/#/lesson/${experiment.id}?age=${age}`);
  await expect(page.locator('[data-scene-overlays]').getByText(experiment.title,{exact:true})).toBeVisible({timeout:60000});
  await page.getByRole('button',{name:'我来试试看',exact:true}).click();
  await expect(page.getByRole('button',{name:'去发现小规律',exact:true})).toBeDisabled();
  await run(page,experiment);
  await page.getByRole('button',{name:'去发现小规律',exact:true}).click();
  const award=page.getByRole('button',{name:'收下这颗发现星',exact:true});await expect(award).toBeDisabled();
  if(age==='4-5'){
   await run(page,experiment);await expect(award).toBeDisabled();
   await value(page,experiment,experiment.initial===experiment.max?experiment.min:experiment.max);
   await expect(award).toBeDisabled();await run(page,experiment);
  }else if(age==='6-8'){
   await value(page,experiment,experiment.targetValue);await page.locator('.experiment-options').getByRole('button',{name:experiment.options[experiment.targetOption],exact:true}).click();
   await expect(award).toBeDisabled();await run(page,experiment);
  }else await run(page,experiment);
  await award.click();await expect(page.getByRole('dialog',{name:'探索完成',exact:true})).toBeVisible();
  expect(await page.evaluate(({id,age})=>JSON.parse(localStorage.getItem('discovery-progress')||'{}')[`${id}:${age}`],{id:experiment.id,age})).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('STEAM classification and search show real filtered results',async({page})=>{
 await page.goto('/');await expect(page.locator('.lesson-card')).toHaveCount(50);
 for(const subject of subjects){await page.getByRole('navigation',{name:'STEAM分类'}).getByRole('button',{name:new RegExp(subject.name)}).click();await expect(page.locator('.lesson-card')).toHaveCount(10);await expect(page.getByRole('region',{name:`${subject.name}场景`})).toBeVisible();}
 await page.getByRole('navigation',{name:'STEAM分类'}).getByRole('button',{name:/全部/}).click();
 await page.getByRole('textbox',{name:'搜索场景',exact:true}).fill('月亮');await expect(page.locator('.lesson-card')).toHaveCount(1);await expect(page.locator('.lesson-card')).toContainText('月亮的脸');
 await page.getByRole('textbox',{name:'搜索场景',exact:true}).fill('不存在的场景');await expect(page.locator('.lesson-card')).toHaveCount(0);await expect(page.locator('.catalog-empty')).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
