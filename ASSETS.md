# 三维资源与许可

本项目场景由 Three.js / React Three Fiber 实时绘制。地形、齿轮、桥梁、灯具、实验桌、树木与材质细节均由本项目程序化建模生成。没有把外部照片用作三维场景替代品。

## 地球贴图

以下文件取自 [Three.js 官方 planets 资源目录](https://github.com/mrdoob/three.js/tree/r180/examples/textures/planets)，以原始文件内容本地随站点发布：

| 本地文件 | 上游文件 |
| --- | --- |
| `public/textures/earth-day.jpg` | `earth_atmos_2048.jpg` |
| `public/textures/earth-normal.jpg` | `earth_normal_2048.jpg` |
| `public/textures/earth-specular.jpg` | `earth_specular_2048.jpg` |
| `public/textures/earth-clouds.png` | `earth_clouds_1024.png` |

使用其真实地理表面、海洋掩膜、地表凹凸与独立云层绘制球体。地球模型大小、观察小屋大小和太阳距离均为教学展示比例。地球表面资料参考 [NASA Blue Marble](https://science.nasa.gov/resource/blue-marble/)；本项目不声称贴图代表即时卫星观测。

Three.js [MIT License](https://github.com/mrdoob/three.js/blob/r180/LICENSE)：

> The MIT License
>
> Copyright © 2010-2025 three.js authors
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 环境光

`public/textures/studio-small-09.hdr`： [Studio Small 09](https://polyhaven.com/a/studio_small_09)，作者 Sergej Majboroda / Poly Haven，1K HDR 原件，约 1.5 MB。按 [CC0](https://polyhaven.com/license) 许可发布。

仅作为实体表面的局部反射与环境照明，不将摄影棚全景作为网页背景。运行时从本站 `textures/` 加载，无第三方图像请求。

## 程序化资源

`src/scenes/materials.tsx` 使用确定性数学噪声生成木纹、石纹、拉丝金属、细水波与半透明云雾纹理；模型、纹理算法与程序生成的资源按项目代码许可证发布。没有从第三方美术资源中复制这些程序化纹理。
