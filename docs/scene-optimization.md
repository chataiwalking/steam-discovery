# 全部科普场景交互优化

覆盖 50 个课程场景（STEAM 每类 10 课）及课程入口小岛。课程、150 套分龄流程、450 段讲解与学习完成条件保持原合同。

## 实现

- 运动：统一 `clock → experiment progress → scene → composer` 帧顺序；用帧率无关阻尼与 smoothstep 改善旋转、归位、路径和起止运动。暂停保留当时状态，显式参数操作仍会重绘对应的静态姿态。
- 交互：物体拾取、悬停/点击反馈和部件说明；暂停时通过 invalidate 重绘，退出清除反馈。解释性点击不冒充实验完成。
- Shader：水面波纹、光束渐隐、薄大气边缘、沿轨道/回路/流路前进的提示、陶土/陶瓷/色轮等局部材质。效果由课程参数和当前进度驱动。
- 后期：一套 EffectComposer 包含 RenderPass、受控 bloom、OutputPass 和 FXAA。线性光照只做一次色调映射，再进行 sRGB 抗锯齿；手机小屏停用 bloom，连续低帧率时同样退为 FXAA。
- 性能：水循环最多 20 个路径粒子用一次 instanced draw，马赛克最多 64 块用一次 instanced draw；分子/声波采用少量 points，自建资源在卸载时释放。
- 预览：全部 50 张课程卡图片由本次实际 Three.js 场景重新捕获。

## 逐课记录

- [科学与技术的 17 个扩展实验](scene-optimization-st.md)
- [工程与艺术的 18 个扩展实验](scene-optimization-ea.md)
- [原 6 课、数学 9 个扩展实验及小岛](scene-optimization-core-m.md)

以上列表中的课程 ID 已与 lessons.json 全量比对，50 课无遗漏。机械、场线、流体和粒子图继续采用课程规定的简化关系；逐课记录描述所依据的模型和参数范围。

## 本地验证

- `npm run check:content`：50 课、150 流程、450 个音频文件与文本/音频 SHA256、实测时长匹配。
- `npm test`：88 项学习逻辑测试通过。
- `E2E_BROWSER_CHANNEL=chrome npm run test:e2e -- --workers=2`：68 项通过，覆盖全部 150 套分龄流程、课程搜索、视口和音频重试/切换。
- 暂停静态同步修复后，昼夜、彩光、形状三课的 9 个年龄流程再次通过。
- `scripts/check-scene-effects.mjs`：全部 50 课 shader/WebGL、暂停画布稳定、恢复检查通过；6 个 390px 手机布局样本通过。首次地球/齿轮截图差异已独立复验通过；原记录与复验记录均保留。
- `npm run build`：TypeScript 和 Vite 构建通过。

本机 Chrome 与手机视口模拟是当前验证范围。音频内容未改变，不将流程测试当作逐条人工校听。

## AI 搭子发布

正式路径为 `https://aidazi.tech/steam/`。在 `VITE_BASE_PATH=/steam/` 构建后，`node scripts/package-aidazi.mjs OUTPUT_DIRECTORY` 创建只包含学习馆的发布包、同站返回导航、授权说明和 SHA256 清单。

`scripts/publish-aidazi-steam.sh` 在服务器创建新版本，复制当前站点，仅替换新版本中的 `/steam`，校验所有文件及主页一致性，再原子切换入口。切换后通过服务器 HTTPS 回读，失败自动恢复旧入口。发布包中的 `steam/release.json` 记录来源提交，公网资源摘要、浏览器验收与 GitHub main 回读分别保存。

GitHub 作为源码同步目标。此次使用已完成的本地验证，源提交带 `[skip ci]`，沿用 README 中不处理 GitHub Pages 的发布范围。
