import {cp,mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const destination=path.resolve(process.argv[2] || 'output/aliyun-swas-manage/steam-release');
const stage=path.join(destination,'stage');
const target=path.join(stage,'steam');
await mkdir(destination,{recursive:true});
await cp('dist',target,{recursive:true,errorOnExist:true,force:false});
for(const file of ['LICENSE','THIRD_PARTY_NOTICES.md','content-sources.md','ASSETS.md']) await cp(file,path.join(target,file));
const indexPath=path.join(target,'index.html');
let html=await readFile(indexPath,'utf8');
if(!html.includes('/steam/assets/'))throw new Error('Build with VITE_BASE_PATH=/steam/ before packaging.');
// The app header owns the return link and visual theme; do not inject a second shell.
if(!html.includes('科学通识'))throw new Error('Expected the themed science application.');
html=html.replace('</head>','<link rel="canonical" href="https://aidazi.tech/steam/"></head>');
await writeFile(indexPath,html);
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const license=await readFile('LICENSE','utf8'),notices=await readFile('THIRD_PARTY_NOTICES.md','utf8');
await writeFile(path.join(target,'attribution.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小小发现家 · 项目与第三方说明</title><style>body{margin:0;background:#fff;color:#1d3447;font:16px/1.8 system-ui,sans-serif}main{max-width:850px;margin:auto;padding:40px 24px}a{color:#d64d7c}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style></head><body><main><a href="/steam/">返回小小发现家</a> · <a href="/">返回 AI 搭子</a><h1>项目与第三方说明</h1><p><a href="https://github.com/chataiwalking/steam-discovery">项目源代码</a> · <a href="/steam/content-sources.md">课程知识来源</a></p><h2>第三方组件与素材</h2><pre>${escape(notices)}</pre><h2>MIT License</h2><pre>${escape(license)}</pre></main></body></html>`);
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const lessons=JSON.parse(await readFile('src/content/lessons.json','utf8'));
await writeFile(path.join(target,'release.json'),JSON.stringify({revision,builtAt:new Date().toISOString(),lessons:lessons.length,tracks:lessons.reduce((count,lesson)=>count+Object.keys(lesson.tracks).length,0),narrations:lessons.reduce((count,lesson)=>count+Object.values(lesson.tracks).reduce((sum,track)=>sum+track.steps.length,0),0),themeVersion:'aidazi-islands-v1',subjects:Object.fromEntries([...new Set(lessons.map(lesson=>lesson.subject))].map(subject=>[subject,lessons.filter(lesson=>lesson.subject===subject).length]))},null,2)+'\n');
const files=[];
async function walk(directory){for(const item of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(item.isDirectory())await walk(file);else if(item.isFile())files.push(file);else throw new Error(`Unexpected non-regular file: ${file}`);}}
await walk(stage);files.sort();
const checksums=[];
for(const file of files){const digest=createHash('sha256').update(await readFile(file)).digest('hex');checksums.push(`${digest}  ${path.relative(stage,file).split(path.sep).join('/')}`);}
await writeFile(path.join(destination,'OVERLAY_SHA256SUMS'),checksums.join('\n')+'\n');
// macOS tar otherwise adds AppleDouble ._ metadata entries outside /steam.
execFileSync('tar',['-czf',path.join(destination,'steam-overlay.tar.gz'),'-C',stage,'steam'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
console.log(`Prepared AI Dazi /steam overlay: ${files.length} verified files, source ${revision}`);
