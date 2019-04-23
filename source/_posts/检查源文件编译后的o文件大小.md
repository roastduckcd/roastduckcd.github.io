---
title: 检查源文件编译后的o文件大小
date: 2019-04-24 00:05:54
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 工具
- 性能优化
tags:
- 性能优化
---


检查下编译后各文件编译后.o文件大小
<!--more-->

* 在`target - Build Settings`中搜索`Write Link Map File`，设置为 YES。编译后会在`Path to Link Map File`指定的路径中生成一个 txt 文件。
    ![xcode_writeLinkMapFile](https://i.loli.net/2019/04/24/5cbf37c4d9428.jpg)
    通常路径为`~/Library/Developer/Xcode/DerivedData/XXXX-fybqffuoxlmezedpfbtfqqtbmdjr/Build/Intermediates.noindex/XXXX.build/Debug-iphonesimulator/XXXX.build/`，如果用真机编译，则在`Debug-iphoneos`路径下。
    
* 该文件列出了项目编译的中间文件和引用的库文件等路径信息、 MachO 文件代码段和数据段的信息。
    ![mapfile_sections](https://i.loli.net/2019/04/24/5cbf37c53448c.jpg)
    首列为分区起始地址，然后是分区大小，段名，分区名。
    
    Symbols 之后就是代码段和数据段具体数据，这里的信息和 Sections 是对应的。比如 __text 区从 0x1000019B0 开始，其大小为 0x00122F71。0x1000019B0 + 0x00122F71 = 0x100124921。那么 __stubs 区起始地址为 0x100124921 + 0x1 = 0x100124922。
    
    列举具体数据信息时，布局方式和上面大致相同。首列为起始地址，数据大小，文件编号（编号相同说明处于同一文件），数据标识（比如方法名，函数名，类名等等）
    ![mapfile_symbols_map_text](https://i.loli.net/2019/04/24/5cbf37c4da4e6.jpg)
    ![mapfile_symbols_map_stubs](https://i.loli.net/2019/04/24/5cbf37c4d6bfc.jpg)
    文件最后是 Dead Stripped Symbols。
    ![mapfile_dead_stripped_symbols](https://i.loli.net/2019/04/24/5cbf37c4d865b.jpg)
* 源文件生成的 .o 等文件位置 `~/Library/Developer/Xcode/DerivedData/XXXX-fybqffuoxlmezedpfbtfqqtbmdjr/Build/Intermediates.noindex/XXXX.build/Debug-iphonesimulator/XXXX.build/Objects-normal/x86_64` 笔者这里使用的是模拟器。
    
    分析每个文件生成代码段的大小。因为苹果对上架的app有大小限制，代码段超过100M就不允许上架。有了上面的数据，我们就有调整的依据了。