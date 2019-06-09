---
title: OpenGL学习之路6-隐藏面消除和深度测试
date: 2019-06-09 20:00:29
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图形处理
- OpenGL
tags:
- 渲染技巧
- 隐藏面消除
- 深度测试
---


* 隐藏面：观察者看不见的部分，比如电脑屏幕的背面，较近物体挡住的较远物体的部分。既然看不见，对于这部分的顶点数据，就没必要渲染，应该提早裁减以提高性能。这种操作就是隐藏面消除(Hidden surface elimination)。
<!--more-->
* 消除隐藏面的几种方法
    * 油画法
    * 正背面剔除法

### 油画法(不使用)
* 先渲染离观察者较远的物体，再渲染较近的。需要先对物体距观察者距离进行排序，然后从最远的物体开始。
    ![opengl_oil_painting](https://i.loli.net/2019/06/09/5cfcf535a1ffd51936.jpg)
* 但是如果物体之间不能确定距离大小，比如交叉重叠的物体。这种情况油画法无法处理。同时油画法会处理一个物体所有顶点数据，没有对看不到的进行裁剪，性能上达不到最优。所以这种方式并没使用。
    ![opengl_oil_painting_defect](https://i.loli.net/2019/06/09/5cfcf5358250f96665.jpg)
    
### 正背面剔除法 Face Culling
##### 相关原理
* 对于n面物体，某一时刻肯定有我们看不到的面，比如3维6面物体，某一时刻我们最多只能看到3个面。将这些看不到的面的数据剔除，能极大的提高渲染效率。
* 如何判断一个物体的正背面呢？
    * 在OpenGL中默认按逆时针环绕组成的面为正面，反之为背面。但是也可以通过函数指定正面环绕形式。
        > 环绕：顶点顺序和顶点连线方向一致形成平面的方式。{a,b,c}
        
        ![opengl_triangle_windings](https://i.loli.net/2019/06/09/5cfcf5358067f59546.jpg)
        
        ```
        // 指定哪种环绕方式为正面
        void glFrontFace(GLenum mode);
        ```
        mode参数为: `GL_CW`(顺时针), `GL_CCW`(逆时针),默认值:`GL_CCW`
        
    * 同时我们还要注意观察点位置。因为对于同一个面，观察点在一侧假设看到的是逆时针，在另一侧观察则是顺时针。
        ![opengl_camera_pos_affect_windings](https://i.loli.net/2019/06/09/5cfcf5357fe6f71457.jpg)
* 确定好以上两点，OpenGL 会自行判断哪些点是正面，只对正面进行渲染。

##### 相关函数
    
    ```
    // 开启表面剔除
    void glEnable(GL_CULL_FACE);
    // 关闭表⾯剔除
    void glDisable(GL_CULL_FACE);
    
    // 用户选择剔除正⾯/背⾯，GL_FRONT, GL_BACK(默认), GL_FRONT_AND_BACK。
    void glCullFace(GL_BACK);
    ```
    front 和 back 是相对于摄像机，或者以人眼看向屏幕。
##### 示例: 剔除正面？？的两种方式

    ```
    // 直接指定
    glCullFace(GL_FRONT);
    
    // 间接指定
    // 指定顺时针环绕方式为正面
    glFrontFace(GL_CW);
    // 剔除远的背面
    glCullFace(GL_BACK);
    ```
    ![opengl_cull_front_two_ways](media/opengl_cull_front_two_ways.jpg)
    * `GL_FRONT` 指 NMPQ，`GL_BACK` 指 BADC。这是相对于摄像机镜头的，不会变动。
    * 当使用默认环绕方式，NMPQ 为正面。正面和GL_FRONT重合。使用GL_FRONT。
    * 当指定顺时针环绕为正面时，BADC为正面，NMPQ为背面。所以剔除GL_BACK。

### 深度测试
##### 相关原理
* 深度就是像素点在世界坐标Z轴上的绝对值，表示离摄像机的距离，深度越大，距离越远。注意深度是针对渲染区域的所有像素点，而不是物体顶点。
* 为什么使用深度？避免油画法需要固定物体渲染顺序的问题。油画法渲染必须先远后进，才能达到较近物体挡住较远物体的效果。使用了深度后，渲染顺序就不再重要。OpenGL 只会渲染深度值小的像素。
* 专门存储当前渲染区域像素深度值的内存区域叫深度缓冲区。只要存在深度缓冲区，当前像素的深度值就会被写入。可以使用函数 `glDepthMask(GL_FALSE)`来禁⽌写⼊。
*   
    {% blockquote cqltbe131421 opengl学习之路十六，深度测试
 https://blog.csdn.net/cqltbe131421/article/details/82906652 %}
    深度缓冲是在片段着色器运行之后（以及模板测试(Stencil Testing)运行之后。
    现在大部分的GPU都提供一个叫做提前深度测试(Early Depth Testing)的硬件特性。提前深度测试允许深度测试在片段着色器之前运行。只要我们清楚一个片段永远不会是可见的（它在其他物体之后），我们就能提前丢弃这个片段。片段着色器通常开销都是很大的，所以我们应该尽可能少运行它们。
    当使用提前深度测试时，片段着色器的一个限制是你不能写入片段的深度值。如果一个片段着色器对它的深度值进行了写入，提前深度测试是不可能的。OpenGL不能提前知道深度值。
    ···
    这个（从观察者的视角）变换z值的方程是嵌入在投影矩阵中的，所以当我们将一个顶点坐标从观察空间至裁剪空间的时候这个非线性方程就被应用了。
    {% endblockquote %} 

* 深度缓冲区(Depth Buffer)和颜色缓冲区(Color Buffer)是一一对应的。前者存储已绘制的像素的深度值，后者存储已绘制的像素的颜色。绘制像素之前，对于每个新的输入片元，将其深度值和深度缓冲区中存储的已绘制像素点的深度值比较，如果新的深度值小于缓冲区的，就会使用新片元信息替换掉深度缓冲区和颜色缓冲区的值，并且绘制出新像素。反之则会放弃新像素的信息，继续使用深度缓冲区和颜色缓冲区存储的值。这个过程就是深度测试。
    ![opengl_depth_test](https://i.loli.net/2019/06/09/5cfcf535be06e97447.jpg)
    这些过程都是在一轮渲染迭代中，图中分步进行表示的是不同物体顶点处理的先后顺序。
* 深度测试默认是关闭的。

##### 深度值的计算
* 深度缓冲是由窗口系统自动创建的。深度值一般由16 bit、24 bit或32 bit表示。通常是24 bit。位数越多，精度越高。深度值范围一般为[0,1]。
* 一种计算方式
    $depth=\frac{z - near}{far - near}$
    z为坐标值；near为摄像机到近裁面距离；far为摄像机到远裁面距离；near<z<far。
    ![opengl_linear_depth_equation](https://i.loli.net/2019/06/09/5cfcf53582b3038309.png)
    当near和far确定时，深度值和Z值成正比关系。所有点的精度都是一样的。
    但是现实生活中观察物体，越远的物体越模糊。我们能分辨眼前花朵纹路，不会去关心远处大楼上商标的笔画。因此越远的物体，精度可以降低，减少运算性能的消耗。
    因此我们采用的方程是非线性的。
    $depth = \frac{1/z - 1/near}{1/far - 1/near}$
    ![opengl_nonlinear_depth_equation](https://i.loli.net/2019/06/09/5cfcf5357fe6266382.png)
    由上图可以直观看出非线性关系的走势。要注意深度值0.5的值并不代表着物体的z值是位于可视区域的中间。

##### 深度测试的问题: Z-Fighting
* 预防为主，一般在大型OpenGL项目会碰到的多。
    {% blockquote The fool OpenGL学习脚印：深度测试(depth testing) https://blog.csdn.net/wangdingqiaoit/article/details/5220660 %}
    当深度值精确度很低时，容易引起ZFighting现象，表现为两个物体靠的很近时确定谁在前，谁在后时出现了歧义。
    ···
    1.不要将两个物体靠的太近，避免渲染时三角形叠在一起。这种方式要求对场景中物体插入一个少量的偏移，那么就可能避免ZFighting现象。例如上面的立方体和平面问题中，将平面下移0.001f就可以解决这个问题。当然手动去插入这个小的偏移是要付出代价的。 
    2.尽可能将近裁剪面设置得离观察者远一些。上面我们看到，在近裁剪平面附近，深度的精确度是很高的，因此尽可能让近裁剪面远一些的话，会使整个裁剪范围内的精确度变高一些。但是这种方式会使离观察者较近的物体被裁减掉，因此需要调试好裁剪面参数。 
    3.使用更高位数的深度缓冲区，通常使用的深度缓冲区是24位的，现在有一些硬件使用使用32位的缓冲区，使精确度得到提高。
    {% endblockquote %}
    
* 什么事Z-fighting？由非线性图看出，深度0.5以后，Z值增大，对应的深度值会越来越靠近。受深度值精度（bit位）影响，当两个面很接近时，可能出现深度值相差很小甚至相等的情况，此时不能确定两个面的先后顺序，可能造成两个面相互交叉的情况（不确定先后，不知道用哪个面的颜色等信息）。
    ![opengl_depth_testing_zFighting](https://i.loli.net/2019/06/09/5cfcf5356ba9593539.jpg)

* 如何解决Z-fighting？插入偏移实现，OpenGL 自动实现。一般不用开启，影响性能。
    * 第一步，启用多边形偏移

        ```c++
        // 启⽤用Polygon Offset ⽅方式 
        // GL_POLYGON_OFFSET_POINT  对应光栅化模式: GL_POINT 点
        // GL_POLYGON_OFFSET_LINE 对应光栅化模式: GL_LINE 线
        // GL_POLYGON_OFFSET_FILL 对应光栅化模式: GL_FILL 面
        glEnable(GL_POLYGON_OFFSET_FILL)
        ```
    * 第二步，计算偏移量（由OpenGL完成）
    $Offset = ( m * factor ) + ( r * units)$
    　　m : 多边形的深度的斜率的最大值,理解⼀个多边形越是与近裁剪面平行,m 就越接近于0。就是深度值。
    　　r : 能产生于窗口坐标系的深度值中可分辨的差异最小值.r 是由具体OpenGL 平台指定的⼀个常量.
    　　factor :  
    　　units : 
    　　offset大于0，模型离摄像机越远；offset小于0，模型离摄像机越近。
        ```c++
        
        glPolygonOffset(Glfloat factor,Glfloat units)
        ```
        一般将 factor、units 设为-1,-1可满足要求。
    * 第三部，关闭多边形偏移
        
        ```
        glDisable(GL_POLYGON_OFFSET_FILL)
        ```
    
##### 相关函数
*  

    ```
    // 激活深度测试
    glEnable(GL_DEPTH_TEST)
    // 刷新深度缓冲区（每次渲染前都应该做一次，否则测试时会使用到上一次渲染存储的深度值）
    // 默认刷新使用最大值1
    glClear(GL_DEPTH_BUFFER_BIT)
    
    // 指定深度测试时比较方式，默认小于（新值比缓冲值）
    // GL_ALWAYS 不比较，直接通过
    // GL_NEVER 不比较，都不通过
    // GL_LESS 小于
    // GL_LEQUAL 小于等于
    // GL_EQUAL 等于
    // GL_GEQUAL 大于等于
    // GL_GREATER 大于
    // GL_NOTEQUAL 不等于
    glDepthFunc(GLEnum mode);
    
    // 禁⽌写⼊深度缓冲区（一般不用吧）
    glDepthMask(GL_FALSE)
    ```
    
    
### 参考链接
* [OpenGL中的深度、深度缓存、深度测试及保存成图片](https://www.cnblogs.com/haoyul/p/6048953.html)
* [深度测试](https://blog.csdn.net/cqltbe131421/article/details/82906652)
* [OpenGL学习脚印：深度测试(depth testing)](https://blog.csdn.net/wangdingqiaoit/article/details/52206602)
* [Depth Testing](https://learnopengl.com/Advanced-OpenGL/Depth-testing)
* [几种测试](https://blog.csdn.net/cauchyweierstrass/article/details/53047680)