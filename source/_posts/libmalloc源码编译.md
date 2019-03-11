---
title: libmalloc源码编译
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 源码编译
tags:
  - libmalloc
date: 2019-03-12 01:29:13
top:
---

### 编译环境
* macOS 10.14.3
* Xcode 10.1
* 源码下载链接：[libmalloc-166.220.1](https://opensource.apple.com/tarballs/libmalloc/libmalloc-166.220.1.tar.gz)
<!--more-->

### 相关包下载
* [libplatform-177.200.16](https://opensource.apple.com/tarballs/libplatform/libplatform-177.200.16.tar.gz)
* [xnu-4903.221.2](https://opensource.apple.com/tarballs/xnu/xnu-4903.221.2.tar.gz)
* 将上面的源码包（包括 libmalloc）解压到一个文件夹，比如`source`
### 编译
* 先删掉多余的 target 

    ![malloc166_alter_target](https://i.loli.net/2019/03/12/5c869abecaf86.jpg)
    
* 编译应该会出现 `BSD.xcconfig does not exist` 和 `unable to find sdk macosx.internal` 两个错误

    ![malloc_delete_file](https://i.loli.net/2019/03/12/5c869abeadf2e.jpg)
    
* 利用源码根目录中`include`文件夹, 用来存放需要补充的文件。在`Building Settings - System Header Search Paths`中添加路径`$(SRCROOT)/include`
* 在 `source`文件夹中搜索缺失的头文件，并拖到当前的 `include` 文件夹。如果提示中含有前缀路径，需要在`include`文件夹新建对应的文件夹。提示`file not found`的文件如下
    * `sys/reason.h `
    * `radix_tree.h`、`radix_tree_internal.h`，这两个根据错误提示 fix 一下就好。
    * `_simple.h `
    * `platform/string.h` 选取 `libplatform`下的
    * `mach-o/dyld_priv.h `
    * `os/internal/internal_shared.h`
    * `os/base_private.h`
    * `resolver.h`
    * `os/internal/atomic.h` 选取 `libplatform`下的
    * `os/internal/crashlog.h` 选取 `libplatform`下的
    * `os/lock_private.h`
    * `os/once_private.h`
    * `os/tsd.h`
    * `machine/cpu_capabilities.h`
    * `resolver_internal.h`

### 其他错误
* 宏定义报错`_COMM_PAGE_MEMORY_SIZE`、`_COMM_PAGE_NCPUS`、`_COMM_PAGE_START_ADDRESS`、`_COMM_PAGE64_BASE_ADDRESS`、`_COMM_PAGE_PHYSICAL_CPUS`、`_COMM_PAGE_LOGICAL_CPUS`
    
    在`magazine_inline.c` 文件头部添加
    
    ```
    #define	_COMM_PAGE_MEMORY_SIZE		(_COMM_PAGE_START_ADDRESS+0x038)
#define _COMM_PAGE_NCPUS  			(_COMM_PAGE_START_ADDRESS+0x022)
#define _COMM_PAGE_START_ADDRESS	_COMM_PAGE64_BASE_ADDRESS
#define _COMM_PAGE64_BASE_ADDRESS   ( 0x00007fffffe00000ULL )
#define	_COMM_PAGE_PHYSICAL_CPUS		(_COMM_PAGE_START_ADDRESS+0x035)
#define	_COMM_PAGE_LOGICAL_CPUS			(_COMM_PAGE_START_ADDRESS+0x036)
    ```
    
* 宏定义报错 `_COMM_PAGE_VERSION` ，直接注释报错的那段代码。
* 宏定义报错 以`NOTE`开头的7个宏定义错，直接注释报错的两段函数。
* `link command failed` 链接错误

    ![malloc_link_failed](https://i.loli.net/2019/03/12/5c869abeaf632.jpg)

    上图已经提示了错误在`nano_malloc_common.c`文件。在 Xcode 中查找上面4个函数，注意去掉前面的下划线。然后将对应文件中的注释。
![malloc_search_code](https://i.loli.net/2019/03/12/5c869abeae71b.jpg)

* 笔者解决完这个编译不再报错。

### 添加 target 进行调试
* 新建 target
    
    ![new_target](https://i.loli.net/2019/03/12/5c869abec0bc1.jpg)

    ![objc_target_comandtool](https://i.loli.net/2019/03/12/5c869abebf5c8.jpg)

* 创建好后别忘了选择你新建的 `scheme`。然后在 `main`函数中键入以下代码

    ```
    #import <malloc/malloc.h>
    
    void *t = calloc(1, 24);
    NSLog(@"%d", malloc_size(t));
    ```
    就可以调试 `calloc`这个函数了。不能跟踪源码再看下面
    ![malloc_make_debugable](https://i.loli.net/2019/03/12/5c869abec22ef.jpg)
    
* 最后附上[可编译项目](https://github.com/roastduckcd/libmalloc.git)