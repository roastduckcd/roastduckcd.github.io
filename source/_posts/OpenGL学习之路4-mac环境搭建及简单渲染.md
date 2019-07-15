---
title: OpenGL学习之路4-mac环境搭建及简单渲染
date: 2019-05-23 21:01:09
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 图形处理
- OpenGL
tags:
- mac-OpenGL环境
---


### 搭建环境
* 下面配置好的环境可以备份，每次写代码时复制一份。或者自定义一个 Xcode 模板。这是笔者的[代码仓,模板的 tag 是 OpenGL_template](https://github.com/roastduckcd/OpenGL/)。模板下载后, 放在`~/Library/Developer/Xcode/Templates/Project Templates`下。如果编译报头文件错误，可能要在`Build Settings`中修改`PublicOpenGLHeaderPath`为`$(SRCROOT)/你的工程名`。然后如图使用
    ![opengl_environment_create_project](https://i.loli.net/2019/05/23/5ce69a07e9d7838014.jpg)
    <!--more-->
    > [git clone 克隆或下载一个仓库单个文件夹](https://www.cnblogs.com/zhoudaxiaa/p/8670481.html)

* 开始搭建环境。创建一个 mac cocoa app。删除不需要的文件。
    ![opengl_environment_to_delete](https://i.loli.net/2019/05/23/5ce69a07b180714288.jpg)
    
* 编译报缺少 xxx.entitlements 的错。
    ![opengl_environment_delete_entitle](https://i.loli.net/2019/05/23/5ce69a07d6d1137644.jpg)

* 添加 OpenGL.framework 和 GLUT.framework。
    ![opengl_environment_add_framework](https://i.loli.net/2019/05/23/5ce69a07c844059174.jpg)
    在弹出的窗口中搜索上面两个库添加即可。
* 创建 main.cpp 文件（选择 macos c++ file，不需要main.hpp）。
    ![opengl_environment_main_cpp](https://i.loli.net/2019/05/23/5ce69a07f2b3498259.jpg)
    
* 将 include 文件夹拖入项目。这里面有着色器容器类等。记住勾选 copy item if needed。 [include在这](https://github.com/roastduckcd/OpenGL/tree/master/OpenGL.xctemplate/include)

* 修改头文件搜索路径
    ![opengl_environment_header_path](https://i.loli.net/2019/05/23/5ce69a081494177802.jpg)

* 在 main.cpp 中添加代码，应该能够编译通过了。
    
    ```
    #include "GLTools.h"
    #ifdef __APPLE__
    #include <glut/glut.h>  // mac 下引入 glut 库
    #else
    #define FREEGLUT_STATIC // windows 或 linux 的引入方式，宏必须要定义
    #include <GL/glut.h>    
    #endif
    
    int main(int argc, char *argv[]) {
    
    }
    ```

### 显示窗口
* 先试试绘制一个基本的窗口。在main函数中添加代码，别忘了回调函数。
    
    ```
    void render(void) {

    }
    
    int main(int argc, char *argv[]) {
        //初始化GLUT库，参数为 main 函数形参
        glutInit(&argc, argv);
        // 初始化窗口大小、标题
        glutInitWindowSize(800, 600);
        glutCreateWindow("base primitive");
        // 注册显示回调：屏幕变化或者主动渲染触发自定义函数
        glutDisplayFunc(render);
        // 开启 GLUT loop 监听消息，类似 runloop
        glutMainLoop();
        
        return 0;
    }
    ```

### 使用默认坐标系渲染三角形
* 渲染最基本的图元, 具体代码就不贴了, 看[我的Github，tag为 20190523-1-A](https://github.com/roastduckcd/OpenGL/)

    ```
    // 据说是 Resource 文件夹，实际仍是可执行文件路径
    
    // 初始化GLUT库，参数为 main 函数形参
    
    // 初始化显示模式
 
    // 初始化窗口大小、标题
    
    // 注册回调函数
    // 1. 注册重塑回调：窗口 frame 改变则触发自定义函数
   
    // 2. 注册显示回调：屏幕变化或者主动渲染触发自定义函数（图形需要发生变化，就要重新渲染）
    
    // 3. 注册键盘输入回调：键盘输入触发自定义函数
    // 字母、数字等ASCII码能标识的键位
    
    // 4. 注册特殊键位输入回调：键盘输入触发自定义函数
    // 方向键，F功能键等
    
    // 初始化GLEW库，检查 api 是否可用
   
    // 设置渲染环境
    // 1.1 设置背景色
    
    // 1.2 初始化着色管理器
    
    // 1.3 设置图形顶点数组：三角形，一位数组形式
    
    // 1.4 使用批处理处理顶点数据
    // 1.4.1 开始：设定图元类型，顶点数量
    
    // 1.4.2 复制顶点数据
    
    // 1.4.3 结束
    
    
    // 开启 GLUT loop 监听消息，类似 runloop
        
    ```

### 使用自定义坐标
* 渲染复杂滴滴的图形, [Github代码，tag为 20190523-1-B](https://github.com/roastduckcd/OpenGL/)

    ```c main.cpp main函数 
    // 初始化GLUT库，参数为 main 函数形参
    
    // 初始化窗口大小、标题
    
    // 注册渲染回调，窗口更新则调用
    
    // 开启GLUT loop
    
    ```
    ```c main.cpp 渲染回调
    // 1.1 设置背景色
    
    // 1.2 清空颜色、深度、模板换缓冲区
    
    // 1.3 设置颜色
    
    // 1.4 设置裁减区域 glOrtho
    
    // 1.5 开始渲染 glbegin primitive mode glew.h
    // 不同mode需要重新begin end
    
    // 1.6 设置顶点（正方形，圆形，）
    glVertex2f : (x, y)
    glVertex3f : (x, y, z)
    
    // 1.7 结束渲染
    
    // 1.8 刷新缓冲区
    ```