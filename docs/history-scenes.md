# 历史 H：10 个儿童互动场景

历史类共 10 课，覆盖 2–3、4–5、6–8 岁，每个年龄轨道有三段讲解。内容在本轮先完成并交给统一发布流程 合并/配音；本记录不把内容合并、音频生成、构建、浏览器和生产发布视为同一结果。

## 内容交付

- `src/content/lessons.json`：10 个完整 `LessonDefinition`、90 个 clip，ID 为 `${id}-${age}-${index}`。
- `src/content/experiments.json`：10 个完整 `ExperimentDefinition`；所有 `initial != targetValue`。
- 所有 clip 的 `text = spokenText`，每段 20–60 字；本地数据生成时逐条校验通过。
- 4–5 岁目标明确初始值、目标值和保持不变的第一选项；6–8 岁目标明确目标值与目标选项。
- H 色值 `#D1A071`，icon 为 `history`。参数是层位、工序、符号数、纸张数、排版数、交流点数、航段与车厢数，没有虚构“年代旋钮”。

## 实查来源、装置与边界

| ID / 课题 | 独立装置与可观察过程 | 来源与历史边界 |
| --- | --- | --- |
| `archaeology-layers` 考古地层 | 四层探方逐层展开，虚拟刷子揭露发现；保留记录时物品与所选层位配对，只看外形时显示记录缺失；真实土层/发现可点击检查。 | [English Heritage 考古教育资料](https://www.english-heritage.org.uk/contentassets/f583b72ab49f4cb18f82b9709cd9064a/archaeology-learning-pack-final.pdf)实际展示地层与遗物位置的学习任务。未扰动层位通常下层较早，但坑穴和翻动会改变关系；模型没有真实遗址年代或价值鉴定。 |
| `ancient-pottery` 陶器的故事 | 泥条从分离状态按序落到器壁，层数改变盘筑高度；表面材质区分盘筑与绳纹，旁边有可检查纹样片。 | [The Met 绳纹时期陶器](https://www.metmuseum.org/art/collection/search/53154)说明泥条塑形、绳子滚压留下的痕迹与现代修复。模型不是该文物复制，不用造型判定文明高低，也不包含烧制操作。 |
| `early-farming` 早期农耕 | 种子落入田地、作物生长、收获进入篮子、粮食转入储藏罐；滑块决定观察到哪道农事工序；小麦和大麦示例有不同穗形。 | [British Museum 史前英国教育资料](https://www.britishmuseum.org/sites/default/files/2019-09/visit-resource_prehistoric-britain-KS2.pdf)介绍早期农耕及种植、收获、磨制、储藏工具。时间被压缩；不宣称所有地区同时发展农耕，或所有生活方式都被农耕替代。 |
| `writing-history` 书写材料的旅行 | 泥板压印用局部顶点凹陷与浅影呈现楔状痕迹；纸草用植物片纹理与逐个墨迹对照；书写工具随符号数移动到对应位置。 | [British Museum 泥板楔形文字方法](https://www.britishmuseum.org/blog/how-write-cuneiform)支持工具压入湿泥；[The Met 纸草制作](https://www.metmuseum.org/pt/essays/papyrus-making-in-egypt)支持纸草片交叠与墨写。图形为示意，不是古文译文；没有把泥板、纸草、纤维纸排成全球统一替换链。 |
| `paper-making` 一张纸的诞生 | 纸浆槽、抄纸帘、压板、干燥架四个装置连成过程；纤维材质比较分散/聚团，帘上纤维随成形和干燥发生位置变化。 | [UNESCO 宣纸传统制作技艺](https://ich.unesco.org/en/RL/traditional-handicrafts-of-making-xuan-paper-00201)说明原料、制浆与复杂手工工序；[V&A 造纸观察](https://www.vam.ac.uk/blog/caring-for-our-collections/making-paper)的搜索返回原文摘要说明纸浆在竹帘成形再干燥。仅压缩成四个观察阶段，不宣称真实造纸仅四步，不提供工艺配方或纸强度计算。 |
| `woodblock-printing` 雕版印刷 | 整体雕版先施墨，纸随每次转印贴合版面；结果在展示板逐张排开，相同图案与印刷张数可直接比较；原创花叶/波纹两块版。 | [Smithsonian 中国年画教育资源](https://asia.si.edu/education/educator-resources/teaching-china-with-the-smithsonian/videos/new-years-prints/)介绍设计、雕版、印刷及后续上色。这里只做虚拟施墨转印，版已经预制；图案为原创，不提供刀具雕刻步骤。 |
| `movable-type` 活字小工坊 | 现代汉字字块从字盘逐个进入版框；顺序/换位改变排列；纸在字块排好后贴合版面，出现对应印迹并移到展示台。版面字形镜像，纸面正常读取。 | [UNESCO 中国木活字印刷技艺](https://ich.unesco.org/en/RL/wooden-movable-type-printing-of-china-00322)支持独立字块、组版、印刷与拆版重用。现代汉字只解释原理，不复刻古代字形；不把更多字块或活字使用等同于文明进步。 |
| `silk-road` 丝路商旅 | 多个交流点构成折线/曲线网络，陆路商队或海路商船停靠，商品标记随经过的点依次出现；可检查各节点。 | [UNESCO 丝路介绍](https://www.unesco.org/en/silk-roads/about-silk-roads)明确多条陆海路线、货物与技艺/想法传播、商旅常走部分路段。图为示意，不是完整地图或统一年代；节点数不表示历史繁荣等级。 |
| `ancient-navigation` 古代航海 | 计划航段组成航线，船头沿路径改变方向；晴夜看星，多云遮星；船上指针反向抵消船体旋转保持示意磁北，旁边罗盘解释磁北与真北区别。 | [Royal Museums Greenwich 航海星盘](https://www.rmg.co.uk/stories/space-astronomy/what-mariners-astrolabe)说明利用天体观测帮助找纬度；[RMG 磁性与罗盘](https://www.rmg.co.uk/stories/space-astronomy/magnetic-mr-halley)说明磁北/真北差异与多云航海中的罗盘作用。只用北半球示意，偏角不对应真实地域，不能当成实际导航工具或完整定位算法。 |
| `railway-history` 铁路的变迁 | 蒸汽机车的轮辐/连杆按位移转动，电力列车的受电结构接到供电线；车厢数改变编组，两种动力以同样动画速度沿相同轨道行进。 | [Science Museum Group 机车车辆藏品](https://collection.sciencemuseumgroup.org.uk/search/categories/locomotives-and-rolling-stock)包含蒸汽、柴油、电力车辆；[National Railway Museum 车辆动力说明](https://blog.railwaymuseum.org.uk/the-way-ahead-working-rail-vehicles-at-the-science-museum-group/)同时区分 steam/diesel/electric。只对比两种结构，不套全球统一替换时间表，不用动画速度或车厢数判定真实能力或年代。 |

来源处理：本轮 web search 实际返回上述 primary 博物馆/教育/UNESCO 来源；部分博物馆正文 open 返回内部错误，采用同页搜索返回正文/摘要，仅使用已显示的事实，没有把抓取失败当成全文读取成功。没有逐字复制长段原文，没有依赖 Wikipedia/Reddit 内容或生成具体发明归属、最早/唯一断言。

## Four Three.js Skills 应用

- Animation：所有装置过程使用原有 `useExperimentMotion`，工序以 `portion` 和 smoothstep 形缓动拆分；移动、轮转与路径运动直接写 refs，2.5 秒完成事件仍由公共 hook 负责。
- Interaction：`HistoryInspect` 射线拾取到真实部件，hover 显示说明，click 固定，再点收起；它只控制解释层，不生成观察完成证据。
- Shaders：土层颗粒、陶土/绳纹、纸草片、纤维成纸使用局部材质 shader；泥板采用可见浅凹印记；交流/工序路径按真实动作进度点亮。纤维 shader 的降序 mask 使用 `1.0-smoothstep(low,high,x)`，没有逆序 smoothstep。
- Postprocessing：使用统一发布流程 的公共 composer/OutputPass/FXAA；没有历史课独立全屏 pass、噪点、景深或强发光装饰。局部自定义 shader 带 Three.js 色彩输出 chunks。

## 文件、资源与验证

- `src/scenes/HistoryExperiments.tsx`：十课默认入口、装置与对应过程。
- `src/scenes/HistoryParts.tsx`：历史检查交互、阶段缓动、路径、材质、纸/泥板 shader、原创 glyph/motif 纹理、船/商队/陶器部件。
- 构造的 `TubeGeometry`、`LatheGeometry`、星点 `BufferGeometry`、标准/shader material 和 `CanvasTexture` 都有 cleanup dispose；纹理只在内容/模式变化时生成。
- 没有每帧 setState；框架暂停与 narration demo 均保持公共进度约定。
- 内容段长与 clip ID 已局部校验；两份 TSX 仅运行 `transpileModule` 语法检查，零语法诊断。未在子流程运行完整 TypeScript、浏览器、TTS 或全量测试。
- 统一发布流程 负责公共 Subject/JSON/分类/frame/WorldCanvas/TTS、统一构建与浏览器验收、生产发布与 GitHub 同步；本记录没有提前宣称这些门槛通过。


统一内容、浏览器与发布验证见 [80课扩展记录](catalog80.md)。
