---
title: OpenGL学习之路7-混合
date: 2019-06-10 23:43:45
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图形处理
- OpenGL
tags:
- 混合blend
mathjax: true
---


* 不开启混合时，新片元的颜色值只是简单替换颜色缓冲区的值；如果开启了深度测试，深度值小的片元颜色替换颜色缓冲区的值。
* 混合常⽤于实现在其他一些不透明的物体前面绘制一个透明物体的效果。模型使用了透明度时，一定要使用混合，否则颜色会不正常。代码？？

<!--more-->
* 像素颜色，先看深度值，再根据透明度使用混合方程式计算颜色。不透明应该不计算？
* 混合和深度无关。计算的是像素点的颜色，最终放到颜色缓冲区。
* 关闭混合，透明度会失效。
* 混合能有限度的抗锯齿。
* 开启混合后，新片元颜色值和颜色缓冲区值默认按以下方程式混合。
    * $C\_f = (C\_s \* S) + (C\_d \* D)$ （默认方程式）
        Cf : 最终计算参数的颜⾊
        Cs : 源颜⾊，新片元的颜色值
        Cd : 目标颜⾊，颜色缓冲区的颜色值
        S : 源混合因⼦ 
        D : 目标混合因⼦
    * 具体计算由 OpenGL 内部完成，**开发者只需要指定函数参数选项**。OpenGL会根据选项查表代入方程式求解。
* 其他混合方程式: 使用函数`glbBlendEquation(GLenum mode)`可以指定以下混合方程式。
    * $C\_f = (C\_s \* S) + (C\_d \* D)$ 对应选项为 `GL_FUNC_ADD`
    * $C\_f = (C\_s \* S) - (C\_d \* D)$ 对应选项为 `GL_FUNC_SUBSTRACT`
    * $C\_f = (C\_s \* D) - (C\_d \* S)$ 对应选项为 `GL_FUNC_REVERSE_SUBSTRACT`
    * $C\_f = min(C\_s, C\_d)$ 对应选项为 `GL_MIN`
    * $C\_f = max(C\_s, C\_d)$ 对应选项为 `GL_MAX`
    
* 相关函数

    ```c++
    // 开启混合
    glEnable(GL_BlEND)
    // 设置混合方程式，默认 GL_FUNC_ADD
    glbBlendEquation(GLenum mode)
    
    // 设置混合常量颜色，默认黑色
    glBlendColor(GLclampf red ,GLclampf green ,GLclampf blue ,GLclampf alpha );
    
    // 设置混合因⼦的一种方式，具体值需要查表调用函数
    // S : 源混合因⼦ 
    // D : 目标混合因⼦
    glBlendFunc(GLenum S,GLenum D)
    
    // 设置混合因⼦更灵活的方式，具体值需要查表调用函数
    // strRGB : 源颜色的混合因⼦ 
    // dstRGB : 目标颜色的混合因⼦
    // strAlpha : 源alpha的混合因子
    // dstAlpha : 目标alpha的混合因子
    glBlendFuncSeparate(GLenum strRGB,GLenum dstRGB ,GLenum strAlpha,GLenum dstAlpha)
    ```
    ![opengl_blend_factor](https://i.loli.net/2019/06/10/5cfe7afe15fa892058.jpg)
    R、G、B、A 代表红绿蓝和alpha。
    下标s、d代表源、目标。
    下标c代表常量颜色，默认黑色。使用`glBlendColor`函数指定。
    
* 混合方程式计算示例

    ```
    下面通过一个常⻅的混合函数组合来说明问题:
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA); 
    
    如果颜色缓存区已经有一种颜色红色 Cd : (1.0f,0.0f,0.0f,0.0f)
    如果在这上面⽤一种alpha为0.6的蓝色 Cs : (0.0f,0.0f,1.0f,0.6f)
    
    S、D 的值根据参数查表
    S = 源alpha值 = 0.6f
    D = 1 - 源alpha值= 1-0.6f = 0.4f
    
    方程式Cf = (Cs * S) + (Cd * D)
            = (Blue * 0.6f) + (Red * 0.4f)
    ```