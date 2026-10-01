# 课程内容与知识来源

核对日期：2026-10-01。课程正文是针对 2–8 岁儿童编写的原创简体中文，不逐句翻译或复制来源。`src/content/lessons.json` 同时供网页和本地 TTS 使用；字幕与口播保持一致。

| 主题 | 依据 | 本站使用的知识与演示边界 |
| --- | --- | --- |
| 昼夜的秘密 | [NASA：What Is Earth?，Why Do We Have Day and Night?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth-grades-5-8/) | 地球自转，让大多数地方交替经历昼夜；朝向太阳的一面是白天。模型的天体大小、距离和转速经过教学简化，不涵盖季节与极昼极夜。 |
| 小水滴旅行 | [USGS：儿童水循环互动图](https://water.usgs.gov/edu/watercycle-kids-adv.html)、[水循环术语表](https://www.usgs.gov/glossary/glossary-water-cycle-terms)、[凝结与水循环](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle) | 水蒸气不可见；漂浮粒子只表示路径。凝结使水蒸气变成液态小水滴，云由小水滴或冰晶组成；降雨把水带回地面。三步骤仅展示一条路线，不表示整个水循环只有三个过程。 |
| 齿轮朋友 | [Science Buddies：Gear Up Your Candy](https://www.sciencebuddies.org/stem-activities/candy-gears) | 两个啮合的外齿轮转向相反，角速度与齿数成反比。十二齿转一圈时，二十四齿转半圈。齿形简化，不演示内齿轮或机械效率。 |
| 小小造桥师 | [Science in School：Building bridges: how do structures stay upright?](https://www.scienceinschool.org/article/2023/building-bridges-how-structures-stay-upright/) | 增加支撑、比较结构形状，并保持小车等条件相同。使用夸张变形帮助观察斜撑作用，是定性的教学演示；不输出承重数值、不进行真实结构分析。 |
| 彩光画室 | [Exploratorium：Color Mixing Lab](https://annex.exploratorium.edu/wsw/projects/color_mixing_lab/) | 红绿蓝光加法混色，红光与绿光叠加呈黄色，三色光比例合适可呈白色。屏幕模拟结果受显示设备影响；不把光的混色与颜料混色混用。 |
| 形状与数量 | 原创基础数学活动，无外部素材与引文 | 认识球、立方体和圆柱；按形状分类；一一对应计数；用两类物体组成八。不为基础数学活动虚构外部引用。 |

## 分龄任务

| 年龄 | 学习方式 | 任务示例 |
| --- | --- | --- |
| 2–3 岁 | 点击认识，感官观察，成人可陪同讲述 | 切换昼夜；认识水面、云和雨；启动和停止齿轮；搭桥让车通过；认识三色光；找出并数三个球。 |
| 4–5 岁 | 一次改变一个条件，观察因果 | 转动地球；依次触发水的变化；改变齿轮方向；加入桥墩比较；两色光相加；收集五个同形物体。 |
| 6–8 岁 | 先预测，再操作与比较 | 预测小屋进入白天；给水循环排序；比较齿数与转速；比较有无斜撑；调出白光；用球和立方体组合八。 |

每个年龄档包含三步：看一看、动手试、发现规律，共 18 套学习流程和 54 段独立口播。完成后保留自由探索，不用下一课中断当前实验。

## 校验

运行 `node scripts/check-content.mjs` 检查主题、年龄档、步骤和口播完整性，并确认每段音频的文件、正文哈希、实际 MP3 帧及音频时长一致。`--content-only` 仅用于配音制作期间的内容检查，不替代交付验收。

程序检查不等于人工校听，也不证明真实平板设备性能；这些验证须分别记录。
