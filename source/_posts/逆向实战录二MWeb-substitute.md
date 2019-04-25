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

### 准备
* 本文使用 [MonkeyDev](https://github.com/AloneMonkey/MonkeyDev) 创建动态库项目。
	![monkeyappmac](https://i.loli.net/2019/04/26/5cc1ded12e4f9.jpg)
	![monkeyappmac_dylib](https://i.loli.net/2019/04/26/5cc1ded10dbbb.jpg)
	项目中默认是 hook QQ 消息撤回功能的代码，可以直接删掉。
	
### 绕过试用框
* 上篇文章我们我们使用汇编 ret 了一个 sub_1000xxxx 的函数返回值，来改变 if 进程，从而绕过试用验证。
	![hook_sub_1000254ab0](https://i.loli.net/2019/04/26/5cc1ded12af34.jpg)
	由于该函数属于三方库 DevMateKit，在 MWeb 的 MachO 中没有它的符号表，所以 hopper 以该函数在 MachO 中的偏移地址表示。在 hopper 和 MachoOView 中对比，在 MachOView 中可能因为解析问题导致指令变化。
	![sub_254ab0_in_macho](https://i.loli.net/2019/04/26/5cc1ded164bae.jpg)
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
	![image_callback_console](https://i.loli.net/2019/04/26/5cc1ded15f381.jpg)
	编译后，MWeb 运行已经绕过试用框。剩下 update error 的警告框。
	
### 绕过 update error 提示

* 在逆向一中，我们修改方法 `- bundleAtURLIsCodeSigned`的汇编，使其返回 1。该方法有符号存在，~~ 那就简单了。 ~~ 不简单啊，因为方法在 framework 中，需要去 hook DevMateKit，重新建一个项目？
	![bundleAtURLIsCodeSigned](https://i.loli.net/2019/04/26/5cc1ded11bb52.jpg)
	
	```c++ MWebHook.m
	// MARK: TODO
	```

### 恢复符号表
* 我们下载的 APP 一般都是删除符号表的，这样不仅增加一点逆向成本，APP 体积也更小。而且逆向总要去 hook 方法。

	```shell restore-symbol路径
	./restore-symbol /Applications/MWeb.app/Contents/MacOS/MWeb -o MWeb
	```
	可以看到恢复后的可执行文件变大了。然后将新的可执行文件替换原来的。发现启动应用没有任何反应。
	
	打开 Console.app 查看日志
	![console_mweb_crash](reverseMWeb/console_mweb_crash.jpg)
	很明显，是检测了 APP 的什么状态, 然后直接终止应用。是时候祭出 Hopper 了。
	
	
### UI 调试

* Xcode 随便新建一个 MacOS 项目。`Debug - Attach To Process - 选中要附加的 APP`。Xcode 上方状态栏显示 Running xxx 后，使用 Xcode `Debug View Hierarchy`断住 APP。

* 接下来使用 `bt all`打印 APP 所有在使用线程的堆栈。

* 使用 `image list | grep xxx`来查看指定可执行文件的模块地址。 xxx 必须是完整可执行文件名。