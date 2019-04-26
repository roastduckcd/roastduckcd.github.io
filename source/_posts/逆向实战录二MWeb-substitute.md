---
title: 逆向实战录二MWeb-substitute
date: 2019-04-26 00:21:41
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 逆向
tags:
- 逆向
---


* 在[逆向实战录一](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%B8%80.html)中我们使用直接修改汇编的方式破解，这篇采用注入 libsubstitute.dylib 来 hook 那两个方法。
<!--more-->

[MWeb逆向：汇编](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%B8%80.html)
[MWeb逆向：MonkeyDev](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%BA%8CMWeb-substitute.html)
[MWeb 逆向：DYLD_INSET_LIBRARIES](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%B8%89-DYLD_INSERT_LIBRARIES.html)
### 准备
* 本文使用 [MonkeyDev](https://github.com/AloneMonkey/MonkeyDev) 创建动态库项目。
	![monkeyappmac](https://i.loli.net/2019/04/26/5cc2aa416af3b.jpg)
	![monkeyappmac_dylib](https://i.loli.net/2019/04/26/5cc2aa4132ed4.jpg)
	项目中默认是 hook QQ 消息撤回功能的代码，可以直接删掉。
	
### 绕过试用框
* 上篇文章我们我们使用汇编 ret 了一个 sub_1000xxxx 的函数返回值，来改变 if 进程，从而绕过试用验证。
	![hook_sub_1000254ab0](https://i.loli.net/2019/04/26/5cc2aa4132c1f.jpg)
	由于该函数属于三方库 DevMateKit，在 MWeb 的 MachO 中没有它的符号表，所以 hopper 以该函数在 MachO 中的偏移地址表示。在 hopper 和 MachoOView 中对比，在 MachOView 中可能因为解析问题导致指令变化。
	![sub_254ab0_in_macho](https://i.loli.net/2019/04/26/5cc2aa4216994.jpg)
	既然没有符号，我们就不能通过 `MSHookMessageEx` 去 hook 该函数。怎么办呢？[看这里](https://blog.csdn.net/glt_code/article/details/83420589)
	
	```c++ MWebHook.m
	#import "MWebHook.h"
	#import "substrate.h"
	#include <mach-o/dyld.h>
	#include <dlfcn.h>
	
	
	// 全局变量
	intptr_t g_slide;
	
	
	// 每个镜像添加之后的回调
	static void _callback_for_add_image(const struct mach_header *header, intptr_t slide) {
	
	    Dl_info image_info;
	    int result = dladdr(header, &image_info);
	    if (result == 0) {
	        NSLog(@"load mach_header failed");
	        return;
	    }
	    
	    // info.plist 中获取可执行文件名
	    NSString *execName = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleExecutable"];
	    // 获取当前的可执行文件路径, bundle即.app文件
	    // 建议先 show package contents 看下路径，比如这里还要添加 Contents/MacOS
	    NSString *execPath = [[[NSBundle mainBundle] bundlePath] stringByAppendingFormat:@"/Contents/MacOS/%@", execName];
	
	    // 调用 MSHookFunction 前，打印看看。需要打开 console.app
	//    NSLog(@"RD===%s", image_info.dli_fname);
	    if (strcmp([execPath UTF8String], image_info.dli_fname) == 0) {
	        // 保存模块偏移基地址的值
	        g_slide = slide;
	//        NSLog(@"RD===%ld", g_slide);
	    }
	}
	
	
	// 接收原来的 IMP
	static int (*origin_sub254ab0)(int);
	
	
	// 实现新的函数，我们需要他返回 1
	static int hook_sub254ab0(int arg0){
	    return 1;
	}
	
	
	static void __attribute__((constructor)) initialize(void) {
	    // 注册回调
	    _dyld_register_func_for_add_image(_callback_for_add_image);
	    // 内存中的真实地址为：MachO 偏移地址 + ASLR
	    MSHookFunction((void *)(0x100254ab0 + g_slide), (void *)hook_sub254ab0, (void **)&origin_sub254ab0);

	}
	```
	![image_callback_console](https://i.loli.net/2019/04/26/5cc2aa4226399.jpg)
	编译后，MWeb 运行已经绕过试用框。剩下 update error 的警告框。
	
### 绕过 update error 提示

* 在逆向一中，我们修改方法 `- checkIfConfiguredProperly ` ，直接 ret；或 `+ bundleAtURLIsCodeSigned`的汇编，使其返回 1。既然看到方法有符号存在，~~ 那就简单了。 ~~ 
	![bundleAtURLIsCodeSigned](https://i.loli.net/2019/04/26/5cc2aa4142d98.jpg)
	不简单啊，因为方法在 framework 中，需要去 hook DevMateKit。需要另外建一个项目。
	
* 这里选择 hook 上一级方法 `- [DM_SUUpdater checkIfConfiguredProperly]`。
	在 MWebHook.m 中添加以下代码
	
	```c++ MWebHook.m
	@class DM_SUUpdater;

    // 函数指针
	static void (*origin_checkIfConfiguredProperly)(void *, void *);
	
	static void hook_checkIfConfiguredProperly(void * self, void * _cmd) {
	
	}
	
	static void __attribute__((constructor)) initialize(void) {
	    // 注册回调
	    _dyld_register_func_for_add_image(_callback_for_add_image);
	    MSHookFunction((void *)(0x100254ab0 + g_slide), (void *)hook_sub254ab0, (void **)&origin_sub254ab0);
	
		// 添加 hook 消息
	    MSHookMessageEx(objc_getClass("DM_SUUpdater"),  @selector(checkIfConfiguredProperly), (IMP)&hook_checkIfConfiguredProperly, (IMP*)&origin_checkIfConfiguredProperly);
	}
	```
	编译后成功绕过 update error。将项目下 TargeApp 目录中的 MWeb.app 复制到 /Applications 就可以像其他软件正常使用了。
	
* 笔者也试过 hook 另一个方法`+ bundleAtURLIsCodeSigned`，但是 substitute 提示找不到符号。其实在 hopper 中搜索，发现两个方法都搜不到，为什么上一个方法却能 hook 呢？

	在 Strings 区域中搜索两个方法的类，发现`DM_SUUpdater`以一个属性或 ivar 存在，而`DM_SUCodeSigningVerifier`搜索不到。
	![dm_suupdater_referenced_mweb](https://i.loli.net/2019/04/26/5cc2aa42460e3.jpg)
	个人推测：既然以属性存在，那么一定要引用头文件。头文件的方法就暴露给 MWeb 了。