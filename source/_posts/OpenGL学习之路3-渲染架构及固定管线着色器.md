---
title: OpenGL学习之路3-渲染架构及固定管线着色器
date: 2019-05-23 20:31:21
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图形处理
- OpenGL
tags:
- OpenGL
- 渲染架构
- 着色器
- 固定管线
---


### 渲染架构

{% blockquote James R. Mille https://people.eecs.ku.edu/~jrmiller/Courses/OpenGL/Architecture.html CPU-GPU Cooperation %}
The architecture of OpenGL is based on a client-server model. An application program written to use the OpenGL API is the "client" and runs on the CPU. The implementation of the OpenGL graphics engine (including the GLSL shader programs you will write) is the "server" and runs on the GPU. Geometry and many other types of attributes are stored in buffers called Vertx Buffer Objects (or VBOs). These buffers are allocated on the GPU and filled by your CPU program.

OpenGL 是基于CS模型的架构。C端指的是使用了OpenGL API的应用程序，是运行在CPU上的。S端指的是OpenGL图形引擎的实现，包括自定义着色器，是运行在GPU上的。图形的几何数据等属性存储在顶点缓冲区对象（VBO）中。这些缓冲区存在于GPU上（显存）但是由CPU填充数据。
{% endblockquote %}

<!--more-->

![opengl_rendering_architecture](https://i.loli.net/2019/05/23/5ce692588029821818.jpg)

* 这里的客户端、服务端和网络请求中代表的实体不同，但是思想都一样。开发者调用相应OpenGL API。CPU执行API就相当于发送请求，请求的参数就是顶点、纹理等数据，这些数据一开始都在内存中，由CPU从内存写入显存缓冲区。服务端即GPU使用相应着色器对收到的数据进行处理，最后渲染到屏幕上或者传回内存。服务端中开发者能操作的是顶点和片元着色器，这两者计算由GPU完成。
    * **Attributes:** 属性
        * 通常存储一些经常发生变化的值，比如存储顶点坐标、颜色值、纹理坐标、光照、法线等属性。
        * 属性值会应用到每一个顶点，通常使用4个元素来描述一个属性值。比如坐标（x,y,z,w），当然我们不一定4个元素都使用。缺省时，(x,y,z)默认为0，w默认为1，这种缺省方式对颜色值等其他属性一样存在。
        * 属性值只能传到顶点着色器，不能直接传递到片元着色器。
    * **Uniforms:** 统一值
        * 通常存储一些要应用到所有属性的值。它可以改变，但是他的变化不是针对某一个属性，而是整个图形而言。比如图形旋转由图形顶点数据*旋转矩阵。顶点数据肯定很多，它们的旋转肯定都是一样的即都是乘以同一个旋转矩阵，这个旋转矩阵就可以使用Uniform来传递。类似的还有平移矩阵、缩放矩阵等。
        * 这个过程一般发生在顶点着色器。
        * 可以同时使用多个不同形式的统一值。比如同时对图形旋转和变换颜色。
    
    * **Texture:** 纹理值，即图片，需要使用位图。但是一般不会传递到顶点着色器，而是由片元着色器根据片元纹理坐标获取颜色。
    * **Position and Outs:** 这两个都是渲染管线内部变量，开发者是不能干预的。可以不用管。
        * 它们同时在顶点着色器和片元着色器声明。作为顶点着色器的输出，其值可以是常量或片元之间的插值？。片元着色器中响应的输入变量会接收这两个值。

### 渲染管线（流水线）一般流程
* 渲染管线的定义可以[看这](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF%E4%B8%80-%E9%83%A8%E5%88%86%E6%9C%AF%E8%AF%AD.html#pipeline-管线，渲染流水线)
* 在OpenGL进⾏绘制的时候，⾸先由顶点着⾊器对传入的顶点数据进行运算，对原始顶点附加纹理坐标、进行坐标变换等操作。顶点着色器输出的数据再通过图元装配，将顶点转换为基本图元。接着会对图元进行裁切，因为视口之外的数据没必要进行渲染。剩下的数据进行光栅化，以图元范围内的像素点进行映射，生成相应的片元。最后，将片元数据传⼊片元着⾊器中进行运算。片元着⾊器会对栅格化数据中的每一个像素进行运算，并决定像素的颜⾊和深度值。经深度、Alpha等测试后和帧缓冲区（屏幕缓冲区？）对应像素颜色进行混合，最后成像。
* https://blog.csdn.net/u014587123/article/details/80460758
* http://www.cnblogs.com/liangliangh/p/4116164.html

### 固定管线着色器
* 可编程管线中我们可以自定义顶点着色器和片元着色器的实现方式。
* 固定管线则是使用参数指定系统着色器，下面这些着色器可以看成是系统实现好的顶点和片元着色器“组合”后的产物。
* 函数原型

    ```c++
    GLShaderManager::UseStockShader(GLT_STOCK_SHADER nShaderID, ...)
    ```
* 第一个参数为着色器类型，一共有10种着色器选项。每种着色器需要的参数个数是不一样的。

#####  单元着色器 : `GLT_SHADER_IDENTITY`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_IDENTITY, GLfloat vColor[4]);
    ```
* 参数2：一维RGBA颜色数组。
* 在默认坐标系（-1，1）中以指定颜色渲染图形。

##### 平面着色器 : `GLT_SHADER_FLAT`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_FLAT, GLfloat mvp[16], GLfloat vColor[4]);
    ```
* 参数2：4*4图形变换矩阵。
* 参数3：一维RGBA颜色数组。
* 渲染的图形需要应用旋转、平移等模型变换或者投影变换等矩阵。如果要同时应用两种变换，需要开发者自行计算两种变换矩阵的结果。

##### 上色着色器 : `GLT_SHADER_SHADED`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_SHADED,GLfloat mvp[16]);
    ```
* 参数2：4*4图形变换矩阵。
* 变换同平面着色器一样，不同的是会自动平滑着色。

##### 默认光源着色器 : `GLT_SHADER_DEFAULT_LIGHT`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_DEFAULT_LIGHT, GLfloat mvMatrix[16], GLfloat pMatrix[16], GLfloat vColor[4]);
    ```
* 参数2：4*4模型变换矩阵。
* 参数3：4*4投影变换矩阵。
* 参数4：一维RGBA颜色数组。
* 默认光源模拟太阳光线，发出的是平行光。会使图形产生阴影和光照效果，参数2或参数3之一设置为单元矩阵，就同平面着色器一样。同时应用两种变换，不需要开发者单独计算。

##### 点光源着色器 : `GLT_SHADER_POINT_LIGHT_DIFF`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_POINT_LIGHT_DIEF, GLfloat mvMatrix[16], GLfloat pMatrix[16], GLfloat vLightPos[3], GLfloat vColor[4]);
    ```
* 参数2：4*4模型变换矩阵。
* 参数3：4*4投影变换矩阵。
* 参数4：点光源位置(x,y,z)。
* 参数5：一维RGBA颜色数组，漫反射颜色。
* 变换同默认光源着色器类似，但是光源的位置是待定的。

##### 纹理替换着色器 : `GLT_SHADER_TEXTURE_REPLACE`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_TEXTURE_REPLACE, GLfloat mvMatrix[16], GLint nTextureUnit);
    ```
* 参数2：4*4模型变换矩阵。
* 参数3：纹理单元。
* 可以对图形应用模型或投影变换（虽然参数是mv，但是投影变换也是16矩阵）。变换后的图形使用纹理单元进行颜色填充。

##### 纹理调整着色器 : `GLT_SHADER_TEXTURE_MODULATE`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_TEXTURE_MODULATE, GLfloat mvMatrix[16], GLfloat vColor[4], GLint nTextureUnit);
    ```
* 参数2：4*4模型变换矩阵。
* 参数3：一维RGBA颜色数组。
* 参数4：纹理单元。
* 可以对图形应用模型或投影变换（虽然参数是mv，但是投影变换也是16矩阵）。将参数3提供的颜色和纹理的颜色混合（相乘），变换后的图形使用混合色进行颜色填充。

##### 纹理点光源着色器 : `GLT_SHADER_TEXTURE_POINT_LIGHT_DIFF`
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_TEXTURE_POINT_LIGHT_DIFF, G Lfloat mvMatrix[16], GLfloat pMatrix[16], GLfloat vLightPos[3], GLfloat vBaseColor[4], GLint nTextureUnit);
    ```
* 参数2：4*4模型变换矩阵。
* 参数3：4*4投影变换矩阵。
* 参数4：点光源位置（x,y,z）。
* 参数5：一维RGBA颜色数组。
* 参数6：纹理单元。
* 可以对图形应用模型或投影变换。将参数5提供的颜色和纹理的颜色混合（相乘），变换后的图形使用混合色进行颜色填充，并且使用漫反射照明进行调整（矩阵相乘）。

>以下两个暂未查到相关资料

##### 着色器 : `GLT_SHADER_TEXTURE_RECT_REPLACE`？
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_TEXTURE_RECT_REPLACE, );
    ```

##### 着色器 : `GLT_SHADER_LAST`？
* 函数原型

    ```c++
GLShaderManager::UseStockShader(GLT_SHADER_LAST, );
    ```