# 地理 G 类：十个实际互动场景

## 已交付文件

- `src/scenes/GeographyExperiments.tsx`：十个课程 ID 的独立场景及默认导出。
- `src/scenes/GeographyParts.tsx`：参数化地形、shader 路径、单实例粒子组、地图箭头、分层剖面等仅供地理场景使用的辅助组件。
- `src/content/lessons.json`：十份完整 LessonDefinition，包含三年龄档各三步骤，共 90 段讲解。
- `src/content/experiments.json`：十份 ExperimentDefinition。

G 颜色为 `#68AACB`，图标标识为 `geography`。统一发布流程 负责公共 Subject/分类/主 JSON/WorldCanvas 接入、TTS、全项目验证与发布，本模块没有修改这些公共文件。

## 逐课场景、参数和依据

| ID / 标题 | 独立实际效果与选项 | 参数与目标 | 官方来源 |
| --- | --- | --- | --- |
| `earth-layers` 地球的里面 | 球面扇形剖切和分层截面；整体模型或四层平滑展开，显示地壳、地幔、液态外核、固态内核 | 剖开角度等级 0→3；目标选项“分层展开” | [USGS：The Interior of the Earth](https://pubs.usgs.gov/gip/interior/) |
| `landforms` 山川小沙盘 | 参数实际改变地形顶点与坡面，山地/山谷或平原/丘陵；观察标记从高处沿地形向低处移动 | 山峰高度等级 1→4；目标选项“山地与山谷” | [USGS：Topographic maps: Tools for planning](https://pubs.usgs.gov/publication/70039402) |
| `river-journey` 河流去旅行 | 有明确坡降的河道、追踪点与流动路径 shader；可显示主河流或支流汇入 | 上游高度等级 1→4；目标选项“支流汇入” | [USGS：Rivers, Streams, and Creeks](https://www.usgs.gov/water-science-school/science/rivers-streams-and-creeks) |
| `volcano` 火山的秘密 | 火山切开剖面显示局部岩浆室和通道；地表模式展示熔岩路径与纹理 shader，少量实例粒子随观察进度运动 | 气泡压力等级 1→4；目标选项“地下剖面” | [USGS：Volcanoes of the United States](https://pubs.usgs.gov/gip/volcus/ustext.html) |
| `plate-motion` 移动的大地 | 可见分层岩石圈板块实际远离、大陆挤压隆起、或沿边滑动；远离时显示中间新地壳 | 移动距离等级 0→3；目标选项“相互靠近” | [USGS：Understanding plate motions](https://pubs.usgs.gov/gip/dynamic/understanding.html) |
| `weather-map` 天气观察站 | 四个固定情景站点；云雨模式有太阳、云和实例雨滴，气温/风模式显示站点温度及空气流向动画 | 观测点编号 1→3；目标选项“气温与风” | [NOAA：Weather systems and patterns](https://www.noaa.gov/education/resource-collections/weather-atmosphere/weather-systems-patterns) |
| `seasons` 四季的脚步 | 地轴固定倾斜 23.44°、四个公转位置；世界坐标日照 shader 正确区分朝向/背向太阳的一侧；可对照南北半球 | 公转位置编号 0→2；目标选项“北半球”，分别表示北冬与北夏 | [NASA Space Place：What Causes the Seasons?](https://spaceplace.nasa.gov/seasons/en/) |
| `latitude-longitude` 地球上的坐标 | 真实地球纹理、经纬网、零点标记、目标纬线/经线，以及从零点向目标移动的定位点；北纬/南纬/东经/西经四选项 | 角度档位 0→2，每档 30°；目标选项“东经”，目标点为东经 60°、纬度 0° | [NOAA：Latitude](https://oceanservice.noaa.gov/facts/latitude.html)，[Longitude](https://oceanservice.noaa.gov/facts/longitude.html) |
| `contour-map` 等高线小地图 | 三维解析山体及其同高曲线；地图模式用 shader 根据同一个高度函数画等高线，50 m 间隔并标注主要高程 | 山峰高度等级 1→4；目标选项“俯视等高线”，山顶示意高程 400 m | [USGS：What is a topographic map?](https://www.usgs.gov/faqs/what-a-topographic-map?qt-news_science_products=0) |
| `map-directions` 地图寻路 | 固定指北箭头、方格地图、方向路径与逐格旅行者；北/东/南/西四个真实方位 | 行走格数 1→3；目标选项“向东”，到达出发点东侧三格 | [USGS：Finding your way with map and compass](https://pubs.usgs.gov/publication/fs07999) |

## 科学与示意边界

- 地层不是整锅岩浆：地幔主要为固态；外核与内核的液态/固态区别在课程事实和模型标签中明确。地层厚度与颜色作示意。
- 河流路径高度随旅程严格下降；支流终点与主河流节点重合。没有声称所有河流都会抵达海洋。
- 地下熔融岩石称岩浆，地表称熔岩；火山可与部分板块边界或热点有关。气泡压力“等级”不是实际压力值，不用于预测真实火山。大陆碰撞模式不自动生成火山。
- 天气站是虚构情景记录。地图箭头表示空气“去向”，没有把它误称为气象学中表示“来向”的风名。
- 四季不是太阳远近：四个位置使用同一圆轨道半径，地轴世界方向固定；公转位置改变两半球日照。北纬/南纬 50° 的示意昼长根据太阳赤纬计算，忽略大气折射等因素；北冬约 7.9 h、北夏约 16.1 h，南半球相反。
- 经度零点与纬度零点独立。坐标采用简化球面；地球纹理在本场景旋转 -90°，将纹理本初经线和模型的零经线对齐，东经指向球体局部 +X，北纬指向 +Y。经度模式自动把目标一侧转向观察者，避免西经 90° 等目标藏在球背面；北/南极提醒经线相会、经度不唯一。
- 等高线采用 `h(x,z)=peak*exp(-(x²+z²)/1.56)` 的同一个解析函数，三维高度映射与二维线条严格相符。相同高度不等于距山顶相同。
- 地图北沿地图局部 -Z、东沿 +X。方向由地图标注与指北箭头定义，不能由屏幕左右推断；场景不是现实导航工具。

官方资料已通过实时网页检索核对；NASA、NOAA 和 USGS 河流页面可直接读取正文。部分 USGS `pubs` 页面的直接工具请求被网站返回 403，官方检索索引提供了对应原文与真实出版物地址，保留该官方 URL，没有编造镜像或来源。

## 学习证据与年龄分层

- 每课 `initial != targetValue`。
- 2–3 岁：与成人完成至少一次观察并指认变化，讲解以具象短句为主。
- 4–5 岁：目标清楚列出 initial 和 target 两个数值，保持同一个 targetOption，分别执行完整观察再比较。
- 6–8 岁：目标明确给出 targetValue、targetOption 和执行按钮，要求完成目标设置下的实际观察。
- 所有场景复用 `useExperimentMotion` 的 2.5 s 完成合同。点选局部物体只产生视觉反馈，不发送学习完成动作；只有公共运动 hook 在新 run 真正完成后报告 `experiment-complete`。
- 演示模式使用课程目标预设，进度仍取叙述时间；动手模式使用实际 state。暂停只冻结进度，静态参数、选项变化仍能通过公共 frame 的 invalidate 重绘新模型。

## 性能和资源

- 没有新增每课全屏 pass 或独立 composer，复用公共 EffectComposer/OutputPass。
- 几何动画和 shader 均取 ref 进度，不做每帧 React setState；CPU 地形仅在参数改变时重建，BufferGeometry/TubeGeometry 显式 dispose。
- 火山、天气的粒子默认 16 个，共用一个 InstancedMesh 和一个 Object3D 变换；装饰线条和粒子不参与 raycast，透明效果关闭 depthWrite。
- 局部 hover/click 复用已支持 demand invalidate 与暂停静态反馈的 FocusTarget，退出不会残留选中环。

## 本模块验证

- 数据校验通过：10 课、10 实验、90 个唯一 clip ID；text=spokenText，全部 31–41 字，位于要求的 20–60 字范围；目标/初始值在参数边界内，目标选项合法。
- TypeScript 初次核查中，本模块文件无错误；当时唯一报错来自其他分工 HistoryParts 的未使用导入，已告知统一发布流程。
- `git diff --check` 针对本模块文件通过。
- 不运行独立 Chrome、TTS 或全量测试。浏览器 shader/暂停/手机验收、完整年龄流程、TTS 产物、发布及 GitHub 同步由统一发布流程 统一验证并补充最终证据。


统一内容、浏览器与发布验证见 [80课扩展记录](catalog80.md)。
