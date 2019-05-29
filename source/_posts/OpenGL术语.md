---
title: OpenGL术语
date: 2019-05-17 00:47:46
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图像处理
- OpenGL
tags:
- OpenGL术语
---


* 3D物体：任何物体，其几何形状都是由三角形组成的。构成一个平面最少需要3个点。
* GPU 处理大量运算。
<!--more-->
### context 上下文
* 状态机：管理许多对象，对象声明周期内的状态和动作。触发条件，状态机执行相应动作，改变对象的状态，直到对象销毁。
* context：管理视觉对象，对象有颜色、位置等状态。外部输入，执行响应修改动作，改变当前状态。
* 切换上下文？耗费较多性能。可以在不同线程中创建不同上下文，他们共享纹理和缓冲区。不同线程进行不同的渲染功能。

### render 渲染
* 将视觉数据通过GPU或CPU运算后转换成3D图像的操作。

### primitive 图元
* OpenGL 或 OpenGL ES中构成3D图像的基本单位。
* OpenGL 中是：点(Pont)、线(Line)、三角形(Triangle)、四边形(Quad)、多边形(Ploygon)。
* OpenGL ES 中是：点(Pont)、线(Line)、三角形(Triangle)。
* 点是最基本图元。
* [顶点、 图元、片元、像素的含义](https://blog.csdn.net/u014800094/article/details/53035889)

##### 几种基本图元
* `GL_POINTS:` 顶点只以点的形式渲染，不聚合成其他图形。
* `GL_LINES:` 每隔两个顶点连成一条线段。
* `GL_LINE_STRIP:` 每两个相邻顶点连成一条线段。
* `GL_LINE_LOOP:` `GL_LINE_STRIP`的基础上，尾首两个顶点再连线，组成闭合图形。
* `GL_TRIANGLES:` 每隔3个顶点连成一个三角形。
* `GL_TRIANGLE_STRIP:` 每3个相邻顶点连成一个三角形(除前两个点外，每个点与前面两个点组成三角形)。
* `GL_TRIANGLE_FAN:` 以第一个顶点为圆心，之后每隔两个顶点和圆心组成三角形，形成一个扇形三角形组。
    ![some_ways_primitive_component](https://i.loli.net/2019/05/22/5ce554711f99949665.jpg)
    
##### 环绕
* 顶点顺序和顶点间连线方向一致的组成图元的方式就叫做环绕。比如从顶点数组 V 中获取 V0,V1,V2三个点，按照0、1、2顺序连接顶点的方式即环绕。
* 默认按逆时针环绕得到的多边形为图形正面。
* 默认按顺时针环绕得到的多边形为图形反面。
* 可以通过 `glFrontFace(GL_CW)`指定正面。
    * `GL_CW` 顺时针环绕为正面。
    * `GL_CCW` 逆时针环绕为正面。

### vetex、vetex array、vetex buffer 顶点、顶点数组、顶点缓冲区
* 顶点就是一个位置数据。顶点数组有GPU处理。
* 一个3D图像顶点数据的集合就是顶点数组。点是最基本的图元，刚开始绘制简单图形时，我们都是先绘制点，然后连线。当图形复杂时，我们就需要多次调用顶点函数，耗时费力。使用顶点数组可以一次搞定。
* 顶点数组可以存储在内存中，但是GPU访问内存肯定没有GPU访问自己的显存快。为了更高的性能，我们通常将其存储在显存中，使用的这部分显存就叫顶点缓冲区。
* https://blog.csdn.net/u012501459/article/details/12945153

### [pipeline 管线，渲染流水线](https://www.khronos.org/opengl/wiki/Rendering_Pipeline_Overview)
* OpenGL 渲染流程。GPU在处理数据的时候是有一定顺序的，就像画图是先点后线再及面，这个顺序是不能打破的。它描述的是`接收一组3D坐标，转换为2D坐标，然后将2D坐标转换为可视图像`的整个过程。
* 固定管线：早起版本封装好的渲染流程 api，调用这些api就可以完成相应功能。开发者设置固定的参数（比如光照模式，纹理模式），就好比OC API中的NSOption选项。因此功能相对有限，不能满足每一个应用场景。
* processing pipeline 可编程管线：由于固定管线的缺陷，OpenGL开放了部分模块供开发者自定义，一般来说就是顶点着色器和片元（片段、像素）着色器。
* http://www.songho.ca/opengl/gl_pipeline.html

### shader 着色器
* 实现图像渲染的一个程序，类比成一个函数吧。输入数据经过着色器处理后才能被下一阶段程序使用。
* 可以使用 GLSL语言（OpenGL Shading Language）自定义着色器，需要自行编译和链接，由于着色器需要大量调用，它是在显卡GPU是执行的。
* https://www.cnblogs.com/leeplogs/p/7339097.html

#### vertex shader 顶点着色器(可编程)
* 处理每一个顶点的变换（旋转、平移、投影等），需要计算的顶点属性主要包括坐标变换、顶点光照、法线等等。变换的工作包括三个部分，模型变换、视图变换和投影变换。将`gl_Vertex`变换为`gl_Position`，通过将`gl_Vertex`乘上`gl_ModelViewMatrix`矩阵可以将其变换到摄像机空间（又称Eye空间或摄像机坐标系），而乘上`gl_ModelViewProjectionMatrix`矩阵可以将顶点数据变换到齐次裁剪空间，此时即得到了`gl_Position`。
* 自身坐标到归一化坐标（0，1坐标系）的运算也在这里。
* 并行执行

#### fragment shader 片元(片段)着色器(可编程)
* 处理图形中每一个像素颜色的计算和填充，处理光、阴影、遮挡、环境等等对物体表面的影响。
* 并行执行
* windows DiretX 中叫做像素着色器。但是片元和像素并不是一样的，片元包含一个点和它相关信息（颜色、纹理等）。
{% blockquote nikoong, https://blog.csdn.net/nikoong/article/details/79776873 %}
片段可以理解为像素的原型，但绝对不是指一大片像素）。片段是包含位置，颜色，深度，纹理坐标等属性的数据结构。片段可能会最终成为图像上的像素。片段是通过检查原始图元和和屏幕像素是否相交来生成的。如果一个片段与一个基元相交，但不与它的任何顶点相交，那么它的属性必须通过顶点之间的属性插值来计算得出。
{% endblockquote %}

> 以下两个了解其作用即可，开发者一般不操作。

#### [GeometryShader ⼏何着⾊器](https://blog.csdn.net/iron_lzn/article/details/48729849#commentBox)
* 为了可移植性，最新的WebGL和OpenGL ES标准不在支持几何着色器，开发移动应用和web应用请不要使用几何着色器。

#### [TessellationShader 曲面细分着⾊器](https://www.cnblogs.com/zenny-chen/p/4280100.html)
* 细分曲面着色器是可选的，它操作的不是点、线、三角形基本图元

### Primitive Assembly 图元装配
* 将顶点着色器的数据转换为基本图元

### rasterization 光栅化，像素化
* 将图元数学信息及其颜色映射为屏幕对应的像素点和填充该像素的颜色。
* 光栅化就是把顶点数据转换为片元的过程。⽚元中的每⼀一个元素对应于帧缓冲区中的⼀一个像素。
* 光栅化其实是一种将几何图元变为二维图像的过程。该过程包含了两部分 的⼯作。第一部分⼯工作:决定窗口坐标中的哪些整型栅格区域被基本图元占用;第二部分工作:分配⼀个颜⾊色值和⼀个深度值到各个区域。光栅化过程产生的是片元.

### texture 纹理
* 就是一张图片，但是位图格式。使用纹理只需要得到图形顶点在纹理中的坐标，然后将这部分纹理填充到图形。就好比填图，我们可以用笔慢慢描，也可以直接扔张图片进去。
* https://blog.csdn.net/qq21497936/article/details/79184344#commentBox
* https://blog.csdn.net/dcrmg/article/details/53180369#commentBox

### blending 混合
* 片元着色器处理后的数据，会对所有像素？经过一系列测试（Alpha、Depth测试等），满足测试的像素的颜色会和帧缓冲区的颜色进行混合。混合算法可以使用预定义，也可以自定义。
* 可以使用片元着色器或者混合方程式。

### matrix 矩阵

#### 变换矩阵
* 使图形发生平移、旋转等变化的矩阵

#### 投影矩阵
* 将3D坐标转换为屏幕使用的2D坐标。

### 渲染上屏/交换缓冲区
* 原始数据经过着色器处理、测试混合等流程后形成最终显示数据，这些数据再映射到程序窗口上成像，保存最终数据的显存部分就是渲染缓冲区（个人理解）。
* 如果一个窗口对应一个缓冲区，当屏幕刷新时，GPU正在往缓冲区写数据，就会造成屏幕上一帧和下一帧共存的问题。因此，OpenGL至少有两个缓冲区。直接映射到屏幕的缓冲区称为为屏幕缓冲区，另一个称为离屏缓冲区（名字是相对的，不变的是位置）。屏幕缓冲区映射到屏幕时，GPU将计算的下一帧数据写入离屏缓冲区，然后交换两个缓冲区。之前的屏幕缓冲区变为离屏缓冲区，离屏变为屏幕，实现图像显示。
* 如果GPU计算离屏buffer的速度快于屏幕刷新率。可能出现上一帧映射了一部分数据到屏幕，此时缓冲区交换，上一帧未映射的数据被下一帧替换。屏幕继续刷新，映射了下一帧到屏幕。由于刷新是从上到下，从左到右逐行进行，画面会产生撕裂。因此执行交换一般会等待屏幕刷新完成的信号，这个信号就是垂直同步信号。
* 但这样一来，GPU写入离屏buffer后，需要等待垂直同步信号，GPU就产生了空闲。两次刷新之间和buffer交换都需要消耗一点时间，可能造成延迟的现象。因此又引入了三重缓冲技术，额外再增加了一个离屏缓冲区。
* http://mini.eastday.com/mobile/180309010002602.html#

### OpenGL 头文件
* `<glut/glut.h>` 
    * mac系统下使用如上形式，windows 和 linux 系统需要使用freeglut的静态库，并且添加一个宏。
    
    ```oc
    #ifdef __APPLE__
    #include <GLUT/GLUT.h> // mac下居然不区分大小写
    #else
    #define FREEGLUT_STATIC // 一定要添加宏
    #include <GL/glut.h>
    #endif
    ```
    {% blockquote 百度百科 GLUT https://baike.baidu.com/item/GLUT/6415146?fr=aladdin GLUT %}
    负责处理和底层操作系统的交互以及I/O操作。适合学习OpenGL和开发简单的OpenGL应用程序。GLUT并不是一个功能全面的工具包所以大型应用程序需要复杂的用户界面最好使用本机窗口系统工具包。
    {% endblockquote %}
* `"glew.h"` 
    {% blockquote -wbp- glew库的使用要点 以及 典型错误 https://blog.csdn.net/a_txpt_001/article/details/40356793 %}
    长话短说，就是因为windows对opengl的支持不好，为了不使用软模拟的opengl，需要从显卡厂家的驱动里抽取opengl的实现，而glew方便了这个过程。只需要调用一下glewInit就可以使用gl*函数了。
    {% endblockquote %}
    {% blockquote 他山之金 GLEW库安装和初始化 https://blog.csdn.net/u010281174/article/details/45848003 %}
    GLEW能自动识别你的平台所支持的全部OpenGL高级扩展涵数。也就是说，只要包含一个glew.h头文件，你就能使用gl, glu, glext, wgl, glx的全部函数[0]。
    {% endblockquote %}
    
* `"GLTools.h"` 封装了OpenGL工具函数库、OpenGL实用工具库以及一些其他的常用函数，一般来说引入该文件足以。
        
    * `"GLBatch.h"` 顶点数据处理类。它可以传输顶点/法线/纹理/颜⾊数据到顶点着色器中。
    
    * `"GLShaderManager.h"` 着色器管理类，创建并管理自定义着色器，同时也提供[一组固定管线存储着色器](http://http://roastduck.xyz/article/OpenGL-渲染架构及固定管线着色器.html#固定着色器)，能进行一些基本渲染操作。
    
    * `"GLFrame.h"` 矩阵工具类。表示位置，需要设置vOrigin, vForward ,vUp。GLFrame可以表示世界坐标系中任意物体的位置与方向。无论是相机还是模型，都可以使用GLFrame来表示。[详解](https://blog.csdn.net/fyyyr/article/details/79298664)

    * `"GLMatrixStack.h"` 矩阵栈帧类。可以加载单元矩阵/矩阵相乘/缩放/平移/旋转等操作。压栈/出栈用来保存变换前的模型举证。
    
    * `"GLFrustum.h"` 矩阵视锥体类，跟摄像机相关。视锥体就是以摄像机为顶点的一个四棱锥，描述视野范围。快速设置正投影、透视投影矩阵。完成坐标由3D到2D的转换。
    
    * `"GLGeometryTransform.h"` 几何变换类。在代码中传输视图矩阵/投影矩阵/视图投影变换矩阵等。处理矩阵的叉乘、变换等。
     
### OpenGL 部分函数参考
* https://www.cnblogs.com/1024Planet/p/5764646.html#_label03