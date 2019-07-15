---
title: OpenGL学习之路10-纹理（下）
date: 2019-06-19 13:53:09
comments: true
toc: true
copyright: true
declare: true
mathjax: false
top:
categories:
- 图形处理
- OpenGL
tags:
- 纹理
- MipMap
- 各向异性过滤
---


### 使用普通纹理可能产生的问题
* 闪烁问题
    * 被渲染物体和使用的纹理相比很小
    * 纹理采样区域的移动幅度和它在屏幕的大小不成比例
    * 处于运动状态比较容易看到该现象
    
<!-- more -->

* 性能问题
    * 加载过大的纹理并进行过滤，屏幕实际只显示很少的一段。纹理越大，性能影响越明显。
* 解决方案：使用更小的纹理。
* 新的问题
    * 如果拉近物体，由于物体会被渲染的比原来更大，原来的纹理采样点不够。不得不对纹理进行拉伸，可能造成物体更模糊。
* 解决方案：使用 Mip 贴图。

### MIP 贴图

* MipMap: 多级渐远纹理。
* 多用在复杂场景，比如游戏等。在应用开发中较少涉及。
* 如果物体很远，产生的片元可能很少。而它却又有一张和近处物体同样高分辨率的纹理。在获取纹理时，GL可能需要跨越很大一段纹理才能取到片元坐标对应的纹理。这可能造成在小物体上产生不真实的感觉，同时这一部分高分辨率也浪费了内存空间，并且降低了性能。
* Mip贴图纹理由**一系列**纹理图像组成，每个图像大小在(s,t)每个轴的方向上都缩小一半（前一个图像的1/4），直到最后一个图像为 1 * 1 的单元 。OpenGL 会使用一组新的过滤方式，为不同距离的物体选择出最合适的纹理。
    ![opengl_mipmap_represent](https://i.loli.net/2019/06/19/5d09ce167e03758188.jpg)
    ```
    参数：GL_TEXTURE_1D、GL_TEXTURE_2D、GL_TEXTURE_3D
    glGenerateMipmaps(GL_TEXTURE_2D);
    ```

### 使用

* 只有 [纹理参数中设置](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF10-%E7%BA%B9%E7%90%86%EF%BC%88%E4%B8%8B%EF%BC%89.html#设置纹理参数) 的过滤方式 `GL_TEXTURE_MIN_FILTER` 为以下四种才可以生成 Mip 贴图。
    * `GL_NEAREST_MIPMAP_NEAREST`: 性能非常好，闪烁现象最弱
    * `GL_LINEAR_MIPMAP_NEAREST`: 常用于对游戏加速
    * `GL_LINEAR_MIPMAP_LINEAR`和`GL_NEAREST_MIPMAP_LINEAR`: 过滤器在 Mip 层之间进行了额外插值，以消除过滤痕迹
    * `GL_LINEAR_MIPMAP_LINEAR` 为三线性贴图，具有最高精度
* 函数原型

    ```c++
    void glGenerateMipmap(GLenum target);
    ```
    为指定纹理对象生成Mipmap贴图。`target` 为纹理类型，一般取值`GL_TEXTURE_1D`、`GL_TEXTURE_2D`、`GL_TEXTURE_3D`。纹理对象在[绑定纹理](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF9-%E7%BA%B9%E7%90%86(%E4%B8%8A).html#绑定纹理状态)时已经被指定。
    
### 各向异性过滤
* 当对一个几何图形进行纹理贴图，如果观察方向和纹理表面恰好垂直（各向同性过滤），那么能得到最好的效果。但是当从一个倾斜角度观察时，对纹理单元仍进行常规（各向同性过滤）采样，会导致一些纹理信息丢失，表现为图像模糊。
    ![opengl_texture_anisotropy](https://i.loli.net/2019/06/19/5d09ce16df89585545.jpg)
* 因此在纹理过滤时，还需要考虑观察角度，这种方式就叫各向异性过滤。
* 由于我们经常对物体使用仿射变换，间接改变观察方向，因此各向异性过滤应该一直应用到程序中。

##### 使用步骤
* 获取支持的各向异性过滤的最大数量

    ```c++
    GLfloat fLargest;
    glGetFloatv(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT, &fLargest);
    ```
* 设置各向异性过滤数据

    ```c++
    //设置纹理参数(各向异性过滤)
    glTexParameterf(GL_TEXTURE_2D,GL_TEXTURE_MAX_ANISOTROPY_EXT,fLargest) 􏰚
    
    // 恢复为各向同性过滤，1.0表示各向同性过滤
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAX_ANISOTROPY_EXT, 1.0f);
    ```
    数值设置越大，沿最大变化方向（最强观察方向）所采样的纹理单元就越多。
    
    设置该项纹理参数，会对性能有一定影响。但对现在硬件性能，其影响可以忽略。

