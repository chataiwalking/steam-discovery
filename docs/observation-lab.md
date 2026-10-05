# 观察实验室：参考 WeduLab 的效果重构

2026-10-05。参考站实际检查了首页、[CellLab](https://wedulab.com/labs/cell) 的模型点选与信息面板，以及 [Contour 3D](https://wedulab.com/labs/contour) 的地形、切面、图层和投影布局。借鉴模型主舞台、可控观察视角、按需标注、分步过程的表达方式；模型、几何、shader 与交互代码均在本仓库实现，没有复制参考站资产。

## 全部 80 课共用的变化

- 舞台工具栏与说明移到模型外面。所有 SceneLabel / Readout 注册到外置“观察要点”，默认无浮动文字；主动打开标注时只允许最多 18 字的短名称，长解释继续留在下方。
- 观察要点跟随实际可见对象更新，过滤 `visible=false` 的祖先，不会出现看不见的模型仍残留 HTML 标签的问题。默认两条摘要，完整说明可展开。
- 立体、正面、俯视、自由转动四种视角，80%–160% 缩放与还原。自由转动关闭模型拾取，避免拖动镜头误触实验。普通视角允许手机纵向滚页。
- 明暗舞台、专注展台、半速观察。半速只控制手动实验时钟；讲解演示继续与语音同步，暂停不推进进度。
- WebGL 不可用、context 丢失、场景资源失败时移除加载遮罩，保留图文与语音，并停用动手实验入口，避免卡住“观察变化中”或生成虚假完成记录。
- 80 张课程预览图重新从实际三维舞台生成，截图不带工具栏、说明和覆盖文字。

S、T、E、A、M、B、G、H 各 10 课全部接入以上观察系统。下列 20 课另有独立模型或过程重构。

## 生物 10 课

| 课程 | 模型与过程变化 |
| --- | --- |
| cell-world | 真正截球壳、膜内壁与切缘，细胞核/核仁、线粒体内褶皱、内质网/核糖体、高尔基体、细胞质颗粒；单选高亮；独立近景构图 |
| flower-pollination | 花粉批次到达柱头后反馈，支持最多五次访花 |
| butterfly-life | 放大比例与阶段指示位置修正 |
| frog-life | 蛙卵静止、蝌蚪游动、幼蛙与成蛙跳动 |
| food-chain | 分段路径点亮与节点追踪 |
| animal-habitats | 栖息要素逐个揭示并配图形提示 |
| breathing-lungs | 吸气、呼气方向相反的批量气流粒子 |
| heartbeat-flow | 瓣膜开合与循环方向箭头 |
| seed-dispersal | 落台高度、落点圈与参数对应 |
| animal-camouflage | 点选动物的定位圈 |

## 地理 10 课

| 课程 | 模型与过程变化 |
| --- | --- |
| earth-layers | 环形剖面和可移出的实体圈层切块 |
| landforms | 使用同一高度场构造实心地形与剖面边缘 |
| river-journey | 支流刻入地形，水滴汇入后继续向下游 |
| volcano | 地下岩层及剖面边界 |
| plate-motion | 参数驱动缩短、分离、滑动与褶皱，零位移无假山/新地壳 |
| weather-map | 定向气流和观测读取环 |
| seasons | 公转过程、世界方向固定的倾轴、从球心计算的平行日照，避免缩尺点源造成虚假极夜 |
| latitude-longitude | 逐步定位路径和清晰选中线，极点避免退化纬圈 |
| contour-map | 水平切面逐级扫描、轮廓逐线形成、同一高度函数的二维投影 |
| map-directions | 地图路径按格逐个点亮 |

细胞结构补充核对 [NHGRI organelle](https://www.genome.gov/genetics-glossary/Organelle) 与 [NIGMS organelle tour](https://www.nigms.nih.gov/biobeat/2021/03/take-a-tour-of-your-cells-organelles)。所有生物、地理模型仍是教学示意：结构位置、颜色、尺度与过程时间有简化；季节轨道不按日地实际尺寸比例绘制，计算光照使用平行方向。

## 验证方式

- `npm test`：学习证据与完成规则。
- `npm run check:content`：80 课 / 240 年龄路径 / 720 音频及哈希。
- `E2E_BROWSER_CHANNEL=chrome npx playwright test --fully-parallel --workers=3`：既有 98 项课程、年龄路径、语音与导航回归。准备状态由模型内部的 SceneReady 和实际注册说明验证，不再依赖始终显示的浮动标题。
- `node scripts/check-observation-lab.mjs`：三种视口、标注、专注模式、暂停时换视角与缩放、自由转动不产生实验成绩、半速完成仅一次，以及三类 WebGL / 加载失败回退。
- `node scripts/check-scene-effects.mjs`：逐课 WebGL / shader、暂停像素一致性、恢复与真实预览图；手机检查可读性与窄屏 FXAA。

实际验收记录在 `output/playwright/observation-lab/`、`wedulab-refactor-all80/` 和最终复验目录。发布通过现有 `/steam/` overlay、原子版本切换和逐文件 SHA256 校验，保留 AI 搭子主站首页。
