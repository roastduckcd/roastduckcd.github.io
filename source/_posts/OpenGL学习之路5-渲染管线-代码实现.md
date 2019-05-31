---
title: OpenGL渲染管线-代码实现
date: 2019-05-31 11:10:07
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图形处理
- OpenGL
tags:
- 固定管线
---


* [Github 代码仓](https://github.com/roastduckcd/OpenGL/)

### 渲染流程概述
* [渲染管线的大概流程看这](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF3-%E6%B8%B2%E6%9F%93%E6%9E%B6%E6%9E%84%E5%8F%8A%E5%9B%BA%E5%AE%9A%E7%AE%A1%E7%BA%BF%E7%9D%80%E8%89%B2%E5%99%A8.html#渲染管线（流水线）一般流程)
* 流程虽然有好几步，但是开发者真正可操作的很少。尤其是固定管线：准备好顶点（纹理等）数据，指定着色器，打开一些功能和测试开关，最后交换缓冲区。顶点坐标和片元的着色处理由OpenGL内部完成；包括图元装配、光栅化等都不要开发者干预。
* 即便是可编程管线，开发者也就是要自己写顶点和片元着色器。其他流程还是一样的。
* 当然简单只是宏观上的。
<!--more-->
#### 渲染窗口
* OpenGL 并没有自己的窗口系统，需要依赖操作系统。GLUT 库就是一套封装了主流操作系统窗口交互的工具库，但是它只适合学习和开发简单的OpenGL应用。`Github tag : 20190523-2-A`

    ```c++ main.cpp 
    void prepareToRender(int argc, char *argv[]) {
        // 设置工作空间，默认可执行文件目录
        gltSetWorkingDirectory(argv[0]);
        // 初始化窗口交互工具
        glutInit(&argc, argv);
        // 创建窗口
        glutInitWindowSize(800, 600);
        glutCreateWindow("base primitive");
        // 检查api可用性, 初始化上下文
        GLenum state = glewInit();
        if (GLEW_OK != state) {
            printf("api 不支持！\n");
        } 
    }
    
    void render(void) {
    }
    
    void registerCallback(void) {
        // 注册渲染回调
        glutDisplayFunc(render);
    }
    
    int main(int argc, char *argv[]) {
    
        prepareToRender(argc, argv);
    
        registerCallback();
        // 开启监听循环
        glutMainLoop();
        return 0;
    }
    ```

#### 顶点数据（两种方式）
* 第一种是一个个点的传入。同时这种方式使用的是最简单的固定管线，只需要传入数据就可以渲染。但是短处显而易见，如果数据很多将是一场灾难，而且很难出复杂的效果。`Github tag : 20190523-2-B`

    ```
    void simplistPipeline(void) {
        // 设置裁减区域范围
        glOrtho(-10.0, 10.0, -10.0, 10.0, -10, 10);
        // 指定渲染图形的颜色
        glColor4f(1, 0, 0, 1);
        // 设置点的大小
        glPointSize(5);
        // 设定图元样式为点，注意点的图元样式只有GL_POINTS。另一个GL_POINT即便只有一个点也无效。
        glBegin(GL_POINTS);
    
        glVertex3f(3, 0, 0);
        glVertex3f(0, 3, 0);
        glVertex3f(0, 0, 3);
        // 随glBegin配套出现
        glEnd();
        // 强制刷新缓冲区
        glFlush();      
        // 交换缓冲区
        //    glutSwapBuffers();
    }
    ```
    上面的裁减区域如果不设置，默认范围(-1,1)，x,y,z都是。

* 我们重点使用 [`GLBatch`](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF%E4%B8%80-%E9%83%A8%E5%88%86%E6%9C%AF%E8%AF%AD.html#OpenGL-头文件) 处理数据。 `Github tag : 20190523-2-C`

    ``` c++ main.cpp 
    // 这是全局变量 
    GLBatch pointBatch;
    
    void setupVertexData() {
        GLfloat vertexes[] = {
            0.5, 0, 0,
            0, 0.5, 0,
            0, 0, 0.5,
        };
        glPointSize(5);
        // 指定渲染的图元方式和顶点数量
        pointBatch.Begin(GL_POINTS, 3);
        // 复制顶点数据，处理成向量顶点的形式
        pointBatch.CopyVertexData3f(vertexes);
        // 结束处理，和begin成套
        pointBatch.End();
    }
    ```
    * 指定点的大小可以通过`glPointSize`函数。也可以在使用GLSL语言自定义着色器的时候，对内部变量 `gl_PointSize`赋值，但前提是必须激活选项`glEnable(GL_PROGRAM_POINT_SIZE)`。一旦该选项被激活，`glPointSize`函数将会失效。

#### 使用固定管线着色器
* 关于着色器种类[看这](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF3-%E6%B8%B2%E6%9F%93%E6%9E%B6%E6%9E%84%E5%8F%8A%E5%9B%BA%E5%AE%9A%E7%AE%A1%E7%BA%BF%E7%9D%80%E8%89%B2%E5%99%A8.html#固定管线着色器)
* 由于我们暂时只画点，这里选择使用`GLT_GLT_SHADER_IDENTITY`。
* 首先初始化着色器管理类。我们在 `prepareToRender` 函数中 `glewinit()` 之后添加代码。一定要在 `glewinit()`之后初始化着色器。着色器的状态由渲染上下文管理，先有上下文，状态才能被管理。
    
    ``` c++ main.cpp
    // 这是全局变量
    GLShaderManager shaderManager;
    // 添加到 glewinit 之后
    shaderManager.InitializeStockShaders();
    ```
* 由于不同图形需要不同着色器，我们需要能在渲染过程中改变着色器种类。因此选择在渲染回调中指定。
* 渲染回调时机
    * 窗口frame改变时，系统自动触发
    * 开发者手动调用
* 在`render`函数中添加。
   
    ```
    // 红色
    GLfloat rgbaColor[] = {1,0,0,1};
    // 指定着色器
    shaderManager.UseStockShader(GLT_SHADER_IDENTITY, rgbaColor);
    ```
    [平面着色器需要的两个参数](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF3-%E6%B8%B2%E6%9F%93%E6%9E%B6%E6%9E%84%E5%8F%8A%E5%9B%BA%E5%AE%9A%E7%AE%A1%E7%BA%BF%E7%9D%80%E8%89%B2%E5%99%A8.html#单元着色器-GLT-SHADER-IDENTITY)。
    
#### 开始渲染和交换缓冲区
* 在 `render`函数最后添加两句

    ```
    // 开始绘制
    pointBatch.Draw();
    // 交换缓冲区
    glutSwapBuffers();
    ```
    * 从这里能推断出 `GLBatch` 是顶点传送的通道，从原始数据到最后片元都由它来管理。
    * [关于缓冲区交换](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF%E4%B8%80-%E9%83%A8%E5%88%86%E6%9C%AF%E8%AF%AD.html#渲染上屏-交换缓冲区)

#### 刷新颜色缓冲区
* 运行程序，运气好应该能看到3个正方形的红点。正方形是因为像素点。不过多半看到的类似这样
    ![opengl_no_clear_color_buffer](https://i.loli.net/2019/05/31/5cf09d873f52317559.jpg)
* 这是因为显卡是随时在使用的，缓冲区里随时都有数据。因此每次渲染之前我们都应该先刷新缓冲区。在 `render`函数开始的地方 `Github tag : 20190523-2-D`
    
    ```c++
    // 刷新颜色缓冲区，为了防止之前的颜色信息影响本次渲染
    glClear(GL_COLOR_BUFFER_BIT);
    ```
    * 另外还有三个缓冲区 `GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT | GL_ACCUM_BUFFER_BIT`深度、模板、累加器缓冲区，每次渲染前都应该先刷新。
* 再运行就没问题了。默认窗口背景色是浅灰色，要更改可以在`prepareToRender`中添加下面这句
    
    ```c++
    glClearColor(1, 1, 0, 1);
    ```
    该函数仅指明使用什么颜色来刷新颜色缓冲区，因此该函数必须在`glClear`之前调用。虽然有个clear单词，但笔者认为叫刷新更合适。
