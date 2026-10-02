# 小小发现家 · STEAM Discovery

面向2–8岁孩子的写实三维科学探索馆。转动地球、追踪水滴、拨动齿轮、搭建桥梁、混合彩光和分类计数，配合普通话短句讲解认识世界。

[在线探索](https://chataiwalking.github.io/steam-discovery/) · [GitHub仓库](https://github.com/chataiwalking/steam-discovery)

正式入口：[AI搭子学习馆](https://aidazi.tech/steam/)。当前按用户要求优先同步此站点，GitHub保留源码；本轮不处理GitHub Pages。

当前视觉采用真实地理/云层贴图、摄影棚HDR环境光与PBR材质，实木展台、金属齿轮、木桥和光学装置均由Three.js实时绘制。课程卡预览由真实场景截图生成，见 `node scripts/generate-previews.mjs`。资源许可见 [ASSETS.md](ASSETS.md)。

## 内容

50个主题，按科学S、技术T、工程E、艺术A、数学M分类，每类10个。每个主题提供2–3岁感官探索、4–5岁因果实验、6–8岁发现挑战，共150套流程、450段童声讲解。各流程包括“看一看 → 动手试 → 发现规律”，完成操作后收集发现星。年龄与进度保存在当前浏览器。

技术：React 19、TypeScript、Vite、Three.js、React Three Fiber。课程按需加载，固定相机、受限DPR、页面隐藏暂停；WebGL不可用时保留二维示意与字幕、音频入口。

## 本地使用

需要Node.js 22.12以上。

```bash
npm ci
npm run dev
```

打开终端显示的本地网址。网站使用固定音频，普通访客不需要Python、模型、API Key或登录。首次点“听讲解”才播放声音。

```bash
npm run check:content  # 课程结构、450段MP3与清单完整性
npm test              # 科学状态、完成条件
npx playwright install chromium
npm run test:e2e       # 150套分龄流程及语音恢复/清理、移动布局
npm run build
npm run preview
```

本机若已安装Chrome，可使用 `E2E_BROWSER_CHANNEL=chrome npm run test:e2e`。

## 课程与场景

- `src/content/lessons.json`：网站与TTS共享的课程、分龄目标、字幕、口播和知识来源。
- `src/content/experiments.json`：44个扩展实验的参数、选项、目标与科学说明。
- `src/learning.ts`：完成条件、操作证据与基础科学关系；扩展实验需等待动画完成回报后才能计入观察。
- 2–3岁完成一次观察，4–5岁在固定选项下比较两次数值，6–8岁观察指定目标配置；已完成的证据与当前控件值分开记录。
- `src/scenes/`：三维小岛和六个主题，各主题动态导入。
- `src/hooks/useNarration.ts`：播放、暂停、重听、失败重试、切课取消与音频时钟。
- `public/audio/manifest.json`：音频路径、真实时长、口播文本与SHA256。

新增主题时，补充主题标识、课程数据、场景和任务条件。任何口播改动都应重新生成对应音频后运行完整性检查。

## 免费离线配音

使用Kokoro中文专用模型 `hexgrad/Kokoro-82M-v1.1-zh`，音色 `zf_001`、CPU、速度0.9。童声风格在原始WAV合成后提高3.5半音并单独补偿语速，保持讲解节奏；详细参数见public/audio/generation.json。默认系统Python 3.14不适合此依赖组合，使用独立Python 3.12环境。

```bash
uv venv --python 3.12 .venv-tts
uv pip install --python .venv-tts/bin/python -r scripts/tts-requirements.txt
.venv-tts/bin/python scripts/synthesize_narration.py --help
```

具体生成命令与样例校验见脚本帮助；默认课程输入来自 `src/content/lessons.json`。生成时需要FFmpeg。模型仅首次下载到缓存中，不进Git；成品MP3纳入仓库，网站播放时不连接TTS服务。转写核对、时长和非静音检查不能替代听感校听。

## 发布

GitHub Actions对main执行内容检查、单测、浏览器测试和生产构建，通过后发布到GitHub Pages。

生产基础路径由 `VITE_BASE_PATH=/steam-discovery/` 设置，Hash路由支持课程链接刷新。修改仓库名时需同步修改工作流内基础路径。

## 科学边界

地球自转演示固定光源且不按真实距离缩放；水蒸气不可见，路径粒子用于示意；彩光使用RGB加色，不等同颜料混色；桥梁是定性结构示意，不显示真实承重数据。来源见 [content-sources.md](content-sources.md)。

开发机浏览器、移动视口模拟、iPad或手机实机是不同的验证范围；具体交付检查记录见 [VERIFICATION.md](VERIFICATION.md)。

MIT。第三方组件和语音模型见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

### 本机已下载模型的离线重建

```bash
.venv-tts/bin/python scripts/synthesize_narration.py --samples
.venv-tts/bin/python scripts/synthesize_narration.py
python3 scripts/synthesize_narration.py --verify
```

脚本复用已校验的本地模型目录；首次下载受网络影响时，可用 `--model-dir` 指向含 `config.json`、`kokoro-v1_1-zh.pth`、`zf_001.pt` 的本地目录，权重仍须通过官方 SHA256 校验。
