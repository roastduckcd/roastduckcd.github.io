---
title: OpenGL学习之路9-纹理(上)
date: 2019-06-19 13:32:23
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


### 纹理即图像

* 包含原始bit数据的图片叫位图。由于位图占用空间大，因此通常经过一系列算法剔除不影响人眼观察的bit，这个过程叫压缩。常见png、jpg都属于压缩后的图片。
* 图片的存储字节数 = 图片宽度 * 图片高度 * 每个像素占用内存的字节数

<!-- more -->

* 图片就是一组RGBA颜色集合。
* 颜色值表示：RGBA 一个颜色通道占用 1 byte。
* 标注纹理文件 `.tga`: 以一个字节接一个字节存储。
* 其他压缩图片格式如 png、 jpg 也能作纹理。

### 纹理坐标
* 纹理坐标是作为0.0到1.0范围内的浮点值指定的。纹理坐标命名为s、t、r和q，支持从一维到三维纹理坐标，通常使用2维（s、t）。q 和 齐次坐标中的 w 一样，一般为 1。
    ![opengl_tex_coordinate_strq_axis](https://i.loli.net/2019/06/19/5d09c934f09f837143.jpg)
* 纹理贴图左下角为原点(0,0)，向右为+x，向上为+y。但是实际上原点位置并不重要，贴图时纹理坐标可以不用和模型坐标一一对应，但是纹理坐标不能交叉映射。
    ![opengl_tex_coordinate_map](https://i.loli.net/2019/06/19/5d09c9336f65369611.jpg)
    可以类比装修贴墙纸，可以选择上下左右颠倒，但是一般不会把正面贴到墙上。

### 纹理使用流程

##### 􏰗􏰘􏲆􏲇分配纹理对象
* 
    
    ```􏲋􏲏􏲐􏲋􏲏􏲋􏲑􏰺􏰳􏲒􏲓􏲔􏲕􏲖􏰌􏲗􏲘􏲙􏰗􏰘􏲆􏲇􏱈􏲚􏲓􏰯c++
    void glGenTextures(GLsizei n, GLuint *textTures);
    ```
    * `n`: 纹理对象数量(图片数量)
    * `texTures`: 纹理坐标数组，初始化时由纹理标识符填充。
    
##### 绑定纹理状态
*  
    
    ```c++
    void glBindTexture(GLenum target, GLunit texture);
    ```
    * `target`: 纹理模式(GL_TEXTURE_1D、GL_TEXTURE_2D(常用)···)
    * `texture`: 要绑定的纹理对象数组

##### 加载纹理坐标（上面的纹理数组）
* 读取 tga 文件

    ```c++
    GLbyte *gltReadTGABits(const char *szFileName, GLint *iWidth, GLint *iHeight, GLint *iComponents, GLenum *eFormat);
    ```
    * [函数实现](https://github.com/roastduckcd/GLTools/blob/master/src/GLTools.cpp#L889)
    * `szFileName`: 纹理文件名称
    * `iWidth, iHeight`: 文件宽度、高度
    * `iComponents`: `GL_RGB`, `GL_RGBA`, `GL_LUMINANCE` 中的一种
    * `eFormat`: `GL_RGB`, `GL_BGRA`, `GL_BGR`, `GL_LUMINANCE`中的一种
    * 返回值: 指向图像数据的指针
    
* 从颜色缓存区内容作为像素图直接读取。OpenGL 无法直接将一个像素图绘制到颜色缓冲区中，但是可以使用下面的函数将颜色缓冲区的内容作为像素图直接读取。

    ```c++
    void glReadPixels(GLint x,GLint y,GLSizei width,GLSizei height, GLenum format, GLenum type,const void * pixels);
    ```
    * `x, y`: 矩形左下⻆角的窗口坐标
    * `width, height`: 矩形的宽，高。以像素为单位 
    * `format`: 指定pixels指向的数据元素的颜色布局。[OpenGL 的像素颜色布局](#OpenGL-像素颜色布局)
    * `type`: 解释参数 pixels 指向的数据，告诉OpenGL 使用缓存区中的什么数据类型来存储颜⾊分量[OpenGL像素数据类型](#OpenGL-像素数据类型)。该函数从图形硬件中复制数据，通常通过总线传输到系统内存。在这种情况下，应用程序将被阻塞，直到内存传输完成。
    * `pixels`: 指向图形数据的指针
    
##### 设置纹理参数
* 函数原型
    
    ```c++
        // 浮点型
        void glTexParameterf(GLenum target,GLenum pname,GLFloat param);
        void glTexParameteri(GLenum target,GLenum pname,GLint param);
        void glTexParameterfv(GLenum target,GLenum pname,GLFloat *param);
        void glTexParameteriv(GLenum target,GLenum pname,GLint *param)
    ```
    * `target`: 纹理模式(GL_TEXTURE_1D、GL_TEXTURE_2D(常用)···)
    * `pname`: 要设置的纹理参数
    * `param, *param`: 纹理参数的值，可以是数组？

###### 参数一：设置纹理在 s、t r轴上的环绕方式。
* 纹理坐标表示(s, t, r, q)  对照笛卡尔坐标系 (x, y, z, w)。模型上纹理不能填满模型时显示的方式，类似平铺、复制等。

    ```
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
    ```
    ![opengl_texture_winding_ways](https://i.loli.net/2019/06/19/5d09c9401f16169004.jpg)
    ![-w983](https://i.loli.net/2019/06/19/5d09c934a78b774534.jpg)

    对应图像
    ![opengl_texture_winding_ways_example](https://i.loli.net/2019/06/19/5d09c933a721957770.jpg)


###### 参数二：纹理过滤，影响颜色显示质量。
* `GL_NEAREST`: 邻近过滤，选取离像素点最近的纹理。如果放大到一定程度，颜色有明显分界（像素方块）。
* `GL_LINEAR`: 线性过滤，将像素点周围颜色混合后作为纹理。相同缩放程度下，线性过滤颜色更加平滑。但是性能消耗更多。
* 当一个纹理贴图被过滤时，GL使用纹理坐标判断一个几何片元对应纹理的什么地方。然后对紧邻该位置的纹理单元使用邻近或线性过滤。
    ![opengl_filter_ways_example](https://i.loli.net/2019/06/19/5d09c933c090d54064.jpg)
* 综合性能和显示质量，一般纹理放大时选择线性过滤；纹理缩小时选择邻近过滤。
    
    ```c++
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    ``` 
* 最后4个选项只能在 `GL_TEXTURE_MIN_FILTER` 下生效。如果在 `GL_TEXTURE_MAG_FILTER` 下使用会产生`GL_INVALID_ENUM`类型的错误代码。
    ![opengl_texture_filter_option](https://i.loli.net/2019/06/19/5d09c9337144259246.jpg)


###### 参数三：对 Mipmap 层的限制
* [Mipmap相关](http://roastduck.xyz/article/OpenGL%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF10-%E7%BA%B9%E7%90%86(%E4%B8%8B).html)
* 对下一步[载入纹理](#载入纹理)中参数 level 的限制。
* 设置 mip 贴图使用的基层和最大层。
    
    ```
    // 设置 mip 最小使用哪层
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_BASE_LEVEL, 0);
    // 设置 mip 最多使用层数
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LEVEL, n);
    
    // 在上面已经限制的基础上再进行限制，功能貌似重复
    // 最小加载的mip层
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_LOD, n)
    // 最大加载的mip层
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LOD, n)
    ```


##### 载入纹理
* 
    
    ```c++
    void glTexImage1D(GLenum target,GLint level,GLint internalformat,GLsizei width,GLint border,GLenum format,GLenum type,void *data)
    // 常用 2D
    void glTexImage2D(GLenum target,GLint level,GLint internalformat,GLsizei width,GLsizei height,GLint border,GLenum format,GLenum type,void * data);
    
    void glTexImage3D(GLenum target,GLint level,GLint internalformat,GLSizei width,GLsizei height,GLsizei depth,GLint border,GLenum format,GLenum type,void *data);
    ```
    * `target`: 纹理模式(GL_TEXTURE_1D、GL_TEXTURE_2D(常用)、GL_TEXTURE_3D···)
    * `level`: 指定所加载的mip贴图层次，非mipmap纹理level设置为0，mipmap设置为mipmap纹理的层级（mipmap的图像数量）。
    * `internalformat`: 每个纹理单元中存储多少颜⾊成分。 _指定了纹理存储在显存中的内部格式？_
        {% blockquote  csxiaoshui OpenGL API 之 glTexImage2D https://blog.csdn.net/csxiaoshui/article/details/27543615 %}
        internalFormat用来指定OpenGL中纹理单元中的格式是什么样的，~~而参数中的后三个(format 、type、 data)是用来指定传输到OpenGL中纹理单元数据的格式是怎么样的。~~ 后三个参数描述了图片在内存中的存储方式。
        {% endblockquote %}
        
        链接最后的示例貌似有问题？
    * `width, height, depth`: 指加载纹理的宽度、⾼高度、深度。
        
        > 这些值必须是 2 的整数次方。(OpenGL 旧版本要求，现在可以不是。但是开发者习惯使用以2的整数次⽅去设置这些参数。
    * `border`: 允许为纹理贴图指定一个边界宽度。2D中必须是0。
    * `format`: 每一个像素所包含的成分以及这些成分的顺序。[OpenGL 的像素颜色布局](#OpenGL-像素颜色布局)
    * `type` : 每一个成分需要几个字节来表示。[OpenGL像素数据类型](#OpenGL-像素数据类型)
    * `data` : 实际指向的数据是什么

    > OpenGL API
    > [glTexImage2D的详细说明](https://blog.csdn.net/huanyingtianhe/article/details/38559085)

##### 测试纹理对象是否有效
* `texture` 如果被分配空间，则返回 true，否则为 false。
    
    ```c++
    GLboolean glIsTexture(GLuint texture);
    ```

##### 程序退出时（glMainLoop()之后）删除绑定纹理对象
* 
    
    ```
    void glDeleteTextures(GLsizei n,GLuint *textures);
    ```

### 其他函数
* 改变和恢复像素存储方式

    ```c++
    // 改变
    void glPixelStorei(GLenum pname,GLint param)
    // 恢复
    void glPixelStoref(GLenum pname,GLfloat param)
    ```
    * 参数1: 指定 OpenGL 如何从数据缓存区中解包图像 数据。`GL_UNPACK_ALIGNMENT`不进行字节对齐
    * 参数2: 表示参数 `GL_UNPACK_ALIGNMENT` 设置的值。
    * `GL_UNPACK_ALIGNMENT` 指内存中每个像素行起点的排列请求，允许设置为1 (byte排列)、2(排列为偶数byte的⾏)、4(字word排列)、8(行从双字节边界开始)

* 缓冲区操作
    改变这些像素操作的源。参数可以取`GL_FRONT`、`GL_BACK`、`GL_LEFT`、`GL_RIGHT`、`GL_FRONT_LEFT`、`GL_FRONT_RIGHT`、`GL_BACK_LEFT`、`GL_BACK_RIGHT`或者甚至是`GL_NONE`中的任意一个。
    ```c++
    // 指定读取的缓存 
    glReadBuffer(mode);
    // 指定写⼊入的缓存
    glWriteBuffer(mode);
    ```

* 更新纹理

    ```c++
    void glTexSubImage1D(GLenum target,GLint level,GLint xOffset,GLsizei width,GLenum format,GLenum type,const GLvoid *data);
    
    void glTexSubImage2D(GLenum target,GLint level,GLint xOffset,GLint yOffset,GLsizei width,GLsizei height,GLenum format,GLenum type,const GLvoid *data);

    void glTexSubImage3D(GLenum target,GLint level,GLint xOffset,GLint yOffset,GLint zOffset,GLsizei width,GLsizei height,GLsizei depth,Glenum type,const GLvoid * data)
    ```
    
* 替换纹理
    替换一个纹理图像要比直接使用`glTexImage`系列函数重新加载一个新纹理快得多：
    ```c++
    void glCopyTexSubImage1D(GLenum target,GLint level,GLint xoffset,GLint x,GLint y,GLsize width);
    
    void glCopyTexSubImage2D(GLenum target,GLint level,GLint xoffset,GLint yOffset,GLint x, GLint y,GLsizei width,GLsizei height)
    
    void glCopyTexSubImage3D(GLenum target,GLint level,GLint xoffset,GLint yOffset,GLint zOffset,GLint x,GLint y,GLsizei width,GLsizei height)
    ```
    
* 使⽤颜色缓存区加载数据,形成新的纹理使⽤。源缓冲区通过 `glReadBuffer`函数指定。

    ```c++
    void glCopyTexImage1D(GLenum target,GLint level,GLenum internalformt,GLint x,GLint y,GLsizei width,GLint border)
    
    void glCopyTexImage2D(GLenum target,GLint level,GLenum internalformt,GLint x,GLint y,GLsizei width,GLsizei height,GLint border)
    ```
    * `x, y, width, height`: 指定读取颜色缓冲区的范围。

### OpenGL 像素颜色布局
![opengl_pixel_format](https://i.loli.net/2019/06/19/5d09c933ad38586176.jpg)
* `GL_RGB`纹理读取数据且顺序为R、G、B。`GL_BGRA`纹理读取数据且顺序为B、G、R、A。

> RGBA顺序转换
> ``` c++ 
// R G B R G B
// 0 1 2 3 4 5
for(int i=0; i<ImageSize; i+=3){
    GLbyte temp=pBits[i];
    pBits[i]=pBits[i+2];
    pBits[i+2]=temp;
}
> ```

### OpenGL 像素数据类型
![opengl_pixel_data_type](https://i.loli.net/2019/06/19/5d09c9339f6f283465.jpg)
* `GL_(UNSIGNED_)BYTE​`: 指 R、G、B、A各占 1 byte。
* `GL_UNSIGNED_BYTE_3_2_2`
    根据 format 指定的颜色成分确定分量。比如 format 指定为 `GL_RGB`。
    ![opengl_type_3_3_2](https://i.loli.net/2019/06/19/5d09c935480a545402.jpg)
* `GL_UNSIGNED_BYTE_2_3_3_REV`
    REV 表示反转。还是以 format 为 `GL_RGB`。
    ![opengl_type_2_3_3_REV](https://i.loli.net/2019/06/19/5d09c9335f3f184837.jpg)
    
### 相关链接
* http://www.it165.net/pro/html/201607/71996.html