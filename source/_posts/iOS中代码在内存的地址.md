---
title: iOS中代码在内存的地址
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
tags:
  - 函数地址
date: 2019-03-09 22:36:16
top:
---

# iOS中代码在内存的地址
* App 运行在内存中，每一个函数、变量都会有地址。拿到这个地址我们就可以拿到汇编代码进行修改。如何得到这个地址呢？
<!--more-->

* 以`viewDidLoad`方法为例，其他变量等地址求值相同。方法在内存中的实际地址是这样的
![](https://i.loli.net/2019/03/09/5c83cf47c9b41.jpg)
如何得到这个值(`0x10236c700`)呢？

	**注意：** 使用`bt`命令得到的是当前的函数调用栈。而`frame1`打印的是当前断点语句的地址。因此Xcode 中断点要下在方法名上。
* 首先看看`viewDidLoad`在 MachO 文件中的位置。

	![](https://i.loli.net/2019/03/09/5c83cf47be289.jpg)
　　图中箭头所指就是OC方法`viewDidLoad`在 MachO 文件的偏移值 `0x1700`。注意这是方法的 `IMP` 地址，位于`_TEXT`段下的`_text`分区中。

	　　一定和方法的`SEL`地址区分，它位于`_TEXT`段下的`_objc_methodname`分区中。
　　![](https://i.loli.net/2019/03/09/5c83cf47cc3cf.jpg)

* 其次要知道我们的 app 在内存中的位置

	![](https://i.loli.net/2019/03/09/5c83cf47bba94.jpg)

	　　图中就是 app 在运行时内存的首地址 `0x10236b000`。这个地址值会随每一次启动而变化。

	>**补充：** 实际上变化的内存地址由两部分组成：`0x100000000`+`0x236b000`。前部分也叫`PAGEZERO`，是一个虚拟空间，64位下保持不变。后一部分是 ASLR (Address Space Layout Randomization)，地址空间布局随机化。这是一种缓冲区溢出保护技术。它的原理和应用可以在[百科](https://baike.baidu.com/item/aslr/5779647?fr=aladdin)看到。这项技术使 App 加载进内存时，其内存地址是随机的。该操作由系统内核完成。
	　　
* 计算：`0x10236b000`+ `0x1700` = `0x10236c700`
即MachO 文件中函数在内存中实际地址：`PAGEZERO（64位固定0x100000000） + 函数在 MachO 文件中偏移地址 + 模块（程序、app）在内存中的偏移值（不包含PAGEZERO的部分）`