---
title: OpenGL学习之路8-向量和矩阵
date: 2019-06-19 13:29:26
comments: true
toc: true
copyright: true
declare: true
mathjax: true
top:
categories:
- 图形处理
- OpenGL
tags:
- 矩阵栈
- 矩阵变换


* GLTools 提供的数学计算库：`"math3d.h"`
* 以下变量声明如不额外指出，都来自该库。

<!-- more -->

### 向量
* 向量：具有方向和大小，坐标表示为（x, y, z）（从原点出发）。
* `M3DVector3f`：表示向量(x, y, z）
* `M3DVector4f`：表示向量(x, y, z, w)，w为x, y, z的缩放因子，通常为1.0。

    ```
    // 声明并初始化一个4维变量
    M3DVector4f vVectro= {0.0f,0.0f,1.0f,1.0f};
    // 声明⼀一个三分量顶点数组
    M3DVector3f vVerts[] = {
        -0.5f,0.0f,0.0f,
        0.5f,0.0f,0.0f,
        0.0f,0.5f,0.0f
    };
    ```

### 矩阵

#### 原理
* 由 m × n 个数排成的m行n列的数表称为m行n列的矩阵，简称m × n矩阵。
* 矩阵的转置：将矩阵逐行变成列，就矩阵的转置矩阵。
* 行矩阵矩阵和列矩阵。不同系统对矩阵存储的方式不一样。
    * 行矩阵：逐行存储的矩阵, **windows D3D 采用**
        $ \begin{bmatrix}
        1 & 0 & 0 & 0 \\ 
        0& 1 & 0 & 0 \\ 
        0 &  0 & 1  & 0 \\
        x & y & z & 1
        \end{bmatrix}$
    * 列矩阵：逐列存储的矩阵, **OpenGL 采用**
        $ \begin{bmatrix}
        1 & 0 & 0 & x \\ 
        0& 1 & 0 & y \\ 
        0 &  0 & 1  & z \\
        0 & 0 & 0 & 1
        \end{bmatrix}$
    * 行矩阵和列矩阵互为转置。
    * [OpenGL中矩阵的行主序与列主序](https://www.jianshu.com/p/bfc8327eaad3)
* OpenGL 中列矩阵表示
    * `typedef float M3DMatrix33f[9]`：3 * 3 矩阵
    * `typedef float M3DMatrix33f[16]`：4 * 4 矩阵（齐次坐标）

#### 计算法则

##### 点乘
* 一个向量和它在另一个向量上的投影的长度，是标量（无方向）。
* $\underset{a}{\rightarrow} * \underset{b}{\rightarrow} = |a| * |b| * cos(\Theta )$
* u=(u1,u2,u3) v=(v1,v2,v3)
    $u * v = u_1v_1+u_2v_2+u_3v_3$
* 函数形式: 结果由返回值接收

    ```c++
    // 返回值范围 -1 ~ 1
    float m3dDotProduct3(const M3DVector3f u,const M3DVector3f v)

    // 返回两个向量间的弧度值
    float m3dGetAngleBetweenVector3(const M3DVector3f u,const M3DVector3f v)
    ```
    
##### 向量的叉乘
* 结果是一个新的向量，称为向量积(法向量)，它垂直于相乘的a、b两向量所构成的平面。方向由右手法则得出。
* 如果a，b互相垂直，那么和叉乘得出的法向量就能构成一个三维坐标系统。
* $\underset{a}{\rightarrow} \times  \underset{b}{\rightarrow} = |a| * |b| * sin(\Theta )$，方向垂直向量a和b组成的平面。
* u=(u1,u2,u3) v=(v1,v2,v3)
    $u  \times   v = ( u_2v_3 - v_2u_3 , u_3v_1 - v_3u_1, u_1v_2 - u_2v_1)$
* 函数形式：结果通过参数指针传递

    ```c++
    void m3dCrossProduct3(M3DVector3f result, const M3DVector3f u, const M3DVector3f v)
    ```
    
##### 矩阵乘法
* 第一个矩阵的列数（column）和第二个矩阵的行数（row）相同时才能进行。
* 计算规则就是矩阵a的第一行乘以矩阵b的第一列，各个元素对应相乘然后求和作为第一元素的值
    ![opengl_matrix_multiplication](https://i.loli.net/2019/06/19/5d09c8713228676380.png)
* 矩阵是没有叉乘一说的。
    {% blockquote 别拦着我逃学 百度知道回答中的评论 https://zhidao.baidu.com/question/154361626.html %}
    matlab里矩阵叉乘表示的是构成矩阵的列向量分别做叉乘后所得列向量再组成的矩阵。例如（用matlab的格式） a1,a2,a3为三维列向量，b1,b2,b3为三维列向量 A = [a1,a2,a3]; B = [b1,b2,b3]; 那么 cross(A,B) 也即楼主说的A和B的叉乘结果为： [cross(a1,b1), cross(a2,b2), cross(a3,b3)]
    {% endblockquote %}
    
### OpenGL 中的矩阵
* OpenGL中的坐标变换都是通过矩阵运算完成的，与图形学的描述完全一致。要注意的是变换中的矩阵乘法是左乘

#### 变换术语
* 视图：观察者或摄像机的空间位置，对应视图矩阵
    * 视图变换：移动观察者或摄像机来观察物体
    * 实际开发者并不操作，只是为了方便理解。
* 模型：物体的空间位置，在场景中移动物体，对应模型矩阵
    * 模型变换：操作模型和其中特定的对象，对模型进行仿射变换。由于矩阵乘法不遵守结合律，所以变换顺序不同，结果也不一样。
        ![opengl_model_view_transform_difference](https://i.loli.net/2019/06/19/5d09c87323a3251051.jpg)
    * 实际开发者并不操作，只是为了方便理解。
* 模型视图：描述视图和模型变换的二元性
    * 模型视图变换：模型变换和视图变换在管线中的集合。由于两种变换是相对的，有时两种变换分别得到的效果是一样的（比如使看到的物体变小，可以将视图沿+z平移，或者将模型沿-z平移）。
    * 由于模型对应的物体坐标系只针对某个物体模型本身，而视图针对所有的模型。**所以视图变化会影响所有模型，而模型变换只影响自身。**
    * 开发者实际操作，**对应的模型视图矩阵是同时对所有模型有效的**。
* 投影：改变视景体大小或重新设置它的形状
    * 投影变换：将经过模型视图变换后的3维顶点转换为2位坐标。这种投影定义了视景体并创建了裁剪平面。
    * 两种投影方式：[正交投影和透视投影](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF2-%E5%9D%90%E6%A0%87%E7%B3%BB%E5%8F%8A%E6%8A%95%E5%BD%B1%E6%96%B9%E5%BC%8F.html#投影方式)
    * 开发者实际操作。
* 视口：这是伪变化，只是对窗口上的最终输出进行缩放
    * 视口变换：投影变换后的坐标转换到屏幕坐标系中。
* [关于几个变换矩阵的理论映射关系](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF2-%E5%9D%90%E6%A0%87%E7%B3%BB%E5%8F%8A%E6%8A%95%E5%BD%B1%E6%96%B9%E5%BC%8F.html#矩阵变换)
* 顶点变换管线
![opengl_vertex_transform_pipeline](https://i.loli.net/2019/06/19/5d09c872badec61408.jpg)
模型视图矩阵和投影矩阵由开发者传入，透视除法和视口变换由GL内部完成。

#### OpenGL 中的照相机和物体
* 使用 `GLFrame` 对象描述世界坐标系中的相机和物体。
    {% blockquote 超频化石鱼 OpenGL自定义相机与模型：GLFrame https://blog.csdn.net/fyyyr/article/details/79298664 %}
    GLFrame叫参考帧，其中存储了1个世界坐标点和2个世界坐标下的方向向量，也就是9个glFloat值，分别用来表示：当前位置点，向前方向向量，向上方向向量。

    GLFrame可以表示世界坐标系中任意物体的位置与方向。无论是相机还是模型，都可以使用GLFrame来表示。对任意一个使用GLFrame来表示的物体而言，涉及到的坐标系有两个：永远不变的世界坐标系，针对于自身的物体坐标系(即绘图坐标系)。
    {% endblockquote %}
    
    ```c++
    class GLFrame {
        protected:
            // Where am I? 位置坐标
            M3DVector3f vOrigin; 
            // Where am I going? 前进方向，Z 轴方向
            M3DVector3f vForward;
            // Which way is up? Y 轴方向
            M3DVector3f vUp; 
    }
    ```
    Y轴向量和Z轴向量进行叉乘，得到X轴向量。
    
    > 虽然都是 `M3DVector3f` 类型，但是 `vOrigin` 只表示一个坐标点。而 `vForward` 和 `vUp` 表示的是向量，有距离和方向（原点出发到该点）。
    
* 相机默认位于世界坐标系原点，观察方向为世界坐标系-Z，前进方向为 -Z，向上为世界坐标系+Y，向右为世界坐标系+X。相机本身坐标系垂直屏幕向右为+X，向上为+Y，屏幕相离为+Z（Z轴方向和世界坐标系相反）。一般绘制开始时将其远离物体，向世界坐标系+Z方向移动，即相机坐标系-Z方向移动。

    ```c++
    void GLFrame::GetCameraMatrix(M3DMatrix44f m,bool bRotationOnly = flase);
    ```
    该函数就是将相机坐标系转换到世界坐标系。由于Z轴方向不一致，过程就是对相机先做一次旋转（Z轴的反转），再做一次平移（相机和世界坐标系是相对运动的，因此函数实现中会看到取负数）。
* 物体默认位于世界坐标系原点，与世界坐标系重合。

    ```c++
    // 用来生成模型矩阵
    void GLFrame::GetMatrix(M3DMatrix44f matrix, bool bRotationOnly = false)
    ```
    
* `GLFrame` 变换成矩阵时的对应位置，记住OpenGL中矩阵是列主序。
    ![opengl_GLFrame_Matrix](https://i.loli.net/2019/06/19/5d09c872aeebb42436.jpg)
    X轴方向向量由 Y 叉乘 Z 得到，T 表示平移即 `vOrigin`。

### OpenGL 矩阵栈
* 为了方便管理和应用变换矩阵，通常使用矩阵栈 `GLMatrixStack.h`。顶点的变换（平移、缩放等）通过和栈顶的变换矩阵相乘实现。OpenGL 为模型视图矩阵和投影矩阵各维护一个矩阵堆栈。栈顶就是当前坐标变换矩阵，进入OpenGL管道的每个坐标(齐次坐标)都会先乘上这个矩阵，结果才是对应点在场景中的世界坐标。
    ![opengl_vertex_transform_transform](https://i.loli.net/2019/06/19/5d09c871725a787319.jpg)

* 入栈与出栈
    ![opengl_matrix_stack_workflow](https://i.loli.net/2019/06/19/5d09c8727550b82255.jpg)
    以矩阵2为基础状态，物体A应用矩阵3变换。先复制矩阵2并压栈，以此保存原来状态，便于快速回到基础状态。然后矩阵2 * 矩阵3，得到最终变换矩阵，新矩阵会覆盖掉栈顶矩阵。物体A应用新的变换后，将当前栈顶矩阵出栈，恢复到基础状态。**压栈和出栈必须成对**。
* 每次变换是以世界坐标系的原点为参考点（顶点数据以世界坐标系）进行。也就是要固定世界坐标系，使用模型视图变换来移动物体。
    {% blockquote chriszeng87 OpenGL使用矩阵堆栈glpushMatrix的原因 https://chriszeng87.iteye.com/blog/2125018 %}
    2）OpenGL物体建模实际上是分两步走的。第一步，在世界坐标系的原点位置绘制出该物体；第二步，通过modelview变换矩阵对世界坐标系原点处的物体进行仿射变换，将该物体移动到世界坐标系的目标位置处。
    {% endblockquote %}
    
* 记住模型视图变换是全局有效的。如果我们换一个角度，从物体角度看，相当于世界坐标系变换了。物体A应用一个变换A后，世界坐标系变换；继续绘制物体B，B就被绘制在变换后的原点上。由于我们给出的变换B仍是以原世界坐标系为参照，现在对物体B应用变换B，实际上物体B应用的是变换A*变换B。因此每次变换后需要pop栈顶矩阵，恢复原来的世界坐标系。反过来说，以世界坐标系为参照，就是要恢复模型视图矩阵。？？
    
    > 如果不先复制栈顶其实也可以，保存新的变换矩阵，在恢复时求出新变换矩阵的逆矩阵，再乘回去，也能得到变换前的矩阵。但是吃力不讨好。
    
### 典型渲染循环
![opengl_render_cycle](https://i.loli.net/2019/06/19/5d09c872754fa65050.jpg)
    
### 函数解析
* 初始化
    
    ```c++
    GLMatrixStack		modelViewMatrix;
    GLMatrixStack		projectionMatrix;
    ```
    这里是 c++ 对象的隐式初始化，会自动调用下面的构造函数
    ```c++
    // 构造函数，默认栈深度64
    GLMatrixStack::GLMatrixStack(int iStackDepth = 64);
    ```
* 加载或重置栈顶矩阵。一般只使用 `LoadIdentity`，通常使用后面的 `push`。

    ```c++
    // 用单元矩阵重置栈顶矩阵
    void GLMatrixStack::LoadIdentity(void);
    
    // 用任意矩阵重置栈顶矩阵
    // 参数:4*4矩阵
    void GLMatrixStack::LoadMatrix(const M3DMatrix44f m);
    
    // 将 GLFame 转换为矩阵，再重置栈顶矩阵
    void GLMatrixStack::LoadMatrix(GLFrame &frame);
    ```
* 入栈和出栈

    ```c++
    // 栈顶矩阵复制后，再重新放到栈顶（保存变换状态）
    void GLMatrixStack::PushMatrix(void);
    
    // 将矩阵压入栈顶
    void PushMatrix(const M3DMatrix44f mMatrix);
    
    // 将 GLFame 转换为矩阵，再压⼊栈顶
    void PushMatrix(GLFame &frame);
    
    // 出栈(移除栈顶矩阵，恢复之前保存的变换状态) 
    void GLMatrixStack::PopMatrix(void);
    ```
* 栈顶矩阵乘法

    ```c++
    // 矩阵乘以栈顶矩阵，相乘结果覆盖原栈顶矩阵
    void GLMatrixStack::MultMatrix(const M3DMatrix44f);
    
    // 将 GLFame 转换为矩阵，再乘以栈顶矩阵，相乘结果覆盖原栈顶矩阵
    void GLMatrixStack::MultMatrix(GLFrame &frame);
    ```
    
* 获取栈顶矩阵

    ```c++
    // 栈顶矩阵作为返回值
    const M3DMatrix44f & GLMatrixStack::GetMatrix(void);
    // 使用形参接收栈顶矩阵
    void GLMatrixStack::GetMatrix(M3DMatrix44f mMatrix);
    ```
    
* 仿射变换

    ```c++
    // 旋转 
    // 参数 angle 是传递的度数，不是弧度值
    void MatrixStack::Rotate(GLfloat angle, GLfloat x, GLfloat y, GLfloat z);
    // 平移
    void MatrixStack::Translate(GLfloat x, GLfloat y, GLfloat z);
    // 缩放
    void MatrixStack::Scale(GLfloat x, GLfloat y, GLfloat z);
    ```