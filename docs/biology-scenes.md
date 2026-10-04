# 生物类 10 课交付说明

类别 `B`，颜色 `#73BB8C`，图标 `biology`。独立模块为 `src/scenes/BiologyExperiments.tsx` 与 `BiologyParts.tsx`。待主任务整合的两份内容文件是 `src/content/lessons.json` 和 `biology-experiments.json`。

10 课共 90 段讲解，覆盖 2–3、4–5、6–8 岁各 3 步。每段 `text=spokenText`，ID 为 `${id}-${age}-${index}`，正文为 20–60 个中文字。每课 `initial != targetValue`；4–5 岁明确保持一个选项、用初始值和目标值各完整运行一次；6–8 岁明确目标值、目标选项和运行行为。改变参数本身不产生完成证据，所有课程使用公共 2.5 秒完成 hook。

## 逐课模型与参数

| 课程 | 独立模型、参数与响应 | 内容边界 |
| --- | --- | --- |
| `cell-world` 细胞小世界 | 膜包围的动物细胞、细胞核和多种内部结构；放大等级 1–5 改变模型尺度；整体/内部视图改变膜的透明度与标注。 | 放大不等于细胞生长；不把有细胞核的动物细胞推广为所有细胞；颜色与结构比例为模型。 |
| `flower-pollination` 花粉的旅行 | 两朵同类花包含花药与柱头；蜂/蝶为两种独立访客模型；1–5 次往返与单 draw 的 20 个花粉点展示同步携带和转运。 | 点表示放大花粉；两种访客不设置虚构的成功率；访花次数不等于种子或果实数量，未立即生成果实。 |
| `butterfly-life` 蝴蝶的成长 | 卵、分节幼虫、悬挂蛹与有翅成虫四个模型；阶段 1–4 控制标记终点和放大对象；概览与单阶段放大是两种观察方式。 | 四阶段完全变态；蛹与卵分开建模；时间压缩，不给出跨物种的统一生長天数。 |
| `frog-life` 青蛙的成长 | 胶状卵团、带长尾蝌蚪、四肢与短尾幼蛙、无尾成蛙；阶段 1–4 控制放大或顺序观察；浅池提示水生阶段。 | 展示常见青蛙生活史，不声称所有种类一致；尾巴被吸收，不演示掉落；阶段模型省略更细的出腿时间点。 |
| `food-chain` 食物链小剧场 | 草→草食性小虫→蛙与藻类→水蚤→小鱼两条链，均有对应生物模型；观察 1–3 环节决定显示对象与连线。 | 箭头从食物指向取食者；路径粗细提示能量并非全部传递，不给虚构百分比；未用更改环节数预测种群。 |
| `animal-habitats` 动物的家 | 池塘蛙、森林猫头鹰、草地兔对应各自景观与身体模型；1–4 个提示依次显示食物、水、庇护、空间。 | 数值只是观察要素数量；没有根据四个图标生成健康/存活分数；具体条件因物种不同。 |
| `breathing-lungs` 一呼一吸 | 正面肺/气管模型，左肺稍小；膈肌球冠随吸气向下变平，肺同步扩张；1–5 次完整周期；可选择强调肺或膈肌/气流。 | 气流沿气道双向标记；次数不是呼吸频率，未计算肺容量或诊断个人状态；人体结构比例简化。 |
| `heartbeat-flow` 心脏小泵站 | 四腔心脏模型，右心→肺→左心与左心→身体→右心两条路线；1–5 次收缩示意；路线选择改变强调程度。 | 红蓝区分含氧情况，血液本身都为红色；瓣膜只作位置/方向提示；不是个人心率或血压计算。 |
| `seed-dispersal` 种子去旅行 | 绒毛、翅状、较重种子各有独立结构；固定起点/风向，风等级 1–5 影响横向漂移；带翅种子旋转落下。 | 相同结构下比较风力；模型路径不是实际米数，不预测发芽率；三种结构关系为示意，不用一个系数代表所有植物。 |
| `animal-camouflage` 躲猫猫的动物 | 树皮纹理 shader 背景，背景等级 1–5 从浅至深；浅色/深色猫头鹰外形固定；运行后短暂显示定位圈，鸟体可 hover/click。 | 动物不随背景瞬间变色；只比较视觉对比，不生成观察者识别率或捕食概率。 |

## 四项 Three.js Skill 的实际应用

本轮复用上轮已经读取的 `threejs-animation`、`threejs-interaction`、`threejs-shaders` 与 `threejs-postprocessing` Skill。动画由公共 progress 直接驱动，暂停冻结教学时间，讲解示范跟随 narrationTime；所有对象支持 raycast 反馈与点击原理。GLSL 用于路径行进、背景纹理及受控发光，沿用公共 composer/bloom/OutputPass，未建立额外 render owner。参数与观察重点控制模型结构、路径或显隐，而非统一套上装饰动画。

花粉使用 20 个 points、单 BufferGeometry/单 draw。每帧只更新 refs/attributes，不调用 React setState。自建 BufferGeometry 卸载 dispose；复用 EffectPath/Wire 的自建几何也有现成的释放路径。其余 JSX 几何和材质由 R3F 生命周期管理。

## 已核对的一手来源

来源已通过网络检索或打开原页核对，以下链接均为官方机构或相关研究机构的一手科普/教育资料。曾尝试的部分 Smithsonian 页面在网页工具中返回 403/500，因此主课程采用能够读取的 NPS 资料，未把抓取失败内容当成实读原页。

- 细胞：[NHGRI Cell](https://www.genome.gov/genetics-glossary/Cell)，补充 [NHGRI Nucleus](https://www.genome.gov/genetics-glossary/Nucleus)。支撑基本生命单位、动物/植物的真核细胞及细胞核。
- 传粉：[NPS Pollinators](https://www.nps.gov/grsm/learn/nature/pollinators.htm)。支撑花粉来源/接收部位、访花动物与传粉、传粉与果实种子形成的区别。
- 蝴蝶：[NPS Butterfly Ecology](https://home.nps.gov/romo/learn/nature/butterfly-ecology.htm)。支撑卵、幼虫、蛹、成虫及完全变态。
- 青蛙：[NPS Fun With Frogs](https://www.nps.gov/teachers/classrooms/fun-with-frogs.htm)。尾巴吸收的补充依据来自 [University of St Andrews Metamorphosis From Tadpole to Frog](https://tadpoles.wp.st-andrews.ac.uk/from-tadpole-to-frog/)，出腿顺序也与官方教育资料 [US Army Corps of Engineers Children Outdoors with Nature](https://www.govinfo.gov/content/pkg/GOVPUB-D103-PURL-gpo53856/pdf/GOVPUB-D103-PURL-gpo53856.pdf)一致。未采用部分儿童资料中“尾巴掉落”的粗略措辞。
- 食物链：[NPS Food Chains](https://www.nps.gov/teachers/classrooms/food-chain.htm)，方向与能量传递补充 [NOAA Energy Flow](https://repository.library.noaa.gov/view/noaa/37768/noaa_37768_DS1.pdf)。
- 栖息地：[NPS Food, Water, Shelter, Space](https://www.nps.gov/teachers/classrooms/food-water-shelter-space.htm)。支撑四类要素与物种差异。
- 呼吸：[NHLBI How Your Body Controls Breathing](https://www.nhlbi.nih.gov/health/lungs/body-controls-breathing)，补充 [NHLBI The Respiratory System](https://www.nhlbi.nih.gov/health/lungs/respiratory-system)。支撑膈肌、肺被动扩张、气道与气体交换。
- 循环：[NHLBI How Blood Flows through the Heart](https://www.nhlbi.nih.gov/health/heart/blood-flow)。支撑瓣膜、右心到肺、肺到左心及身体循环的方向。
- 种子：[NPS Plant Adaptations](https://www.nps.gov/teachers/classrooms/plant-adaptations.htm)。支撑风、水、动物传播及结构影响。
- 保护色：[NPS Animal Camouflage](https://home.nps.gov/romo/animal_camouflage.htm)，补充 [NPS Desert Adaptations](https://www.nps.gov/teachers/classrooms/desert-adaptations.htm)。支撑外形/背景关系与隐藏作用。

## 验证与整合边界

两份数据已通过自有 schema/中文长度/clip 一致性检查。对 `BiologyExperiments.tsx` 与 `BiologyParts.tsx` 两个 entry 创建 TypeScript program，静态诊断为 0。未启动浏览器、TTS 或全量测试，也未修改共享 Subject、分类、主 JSON、公共实验框架、测试、Git 或部署配置；这些由主任务统一整合并验收。


统一内容、浏览器与发布验证见 [80课扩展记录](catalog80.md)。
