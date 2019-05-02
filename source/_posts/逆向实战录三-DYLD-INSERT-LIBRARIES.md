---
title: 逆向实战录三-DYLD-INSERT-LIBRARIES
date: 2019-04-26 17:32:28
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


{% blockquote webfrog, http://iosre.com/t/macos-app-app/10976 %}
逆向的几种方式
* 直接修改汇编
* 插入动态库
    * 修改 MachO LoadCommand:insert_dylib
    * 使用 DYLD_INSERT_LIBRARIES 环境变量
* 可执行文件不一定非要是使用源代码编译链接后生成的，一个拥有执行权限的 shell 脚本，也是可以的。

{% endblockquote %}
<!--more-->
[MWeb逆向：汇编](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%B8%80.html)
[MWeb逆向：MonkeyDev](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%BA%8CMWeb-substitute.html)
[MWeb 逆向：DYLD_INSET_LIBRARIES](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%B8%89-DYLD-INSERT-LIBRARIES.html)

### 使用 DYLD_INSET_LIBRARIES 破解

* 新建一个 macOS 动态库项目 MWebInject
	![library_hook_dev](https://i.loli.net/2019/04/26/5cc2d07e7e668.jpg)
	
* 引入 libsubstitute 动态库，我们要使用 MSHook 系列函数。安装了 MonkeyDev 后，该动态库可以在 `/opt/MonkeyDev/MFrameworks`下找到。
	
	```
	~ cd /opt/MonkeyDev/MFrameworks
	
	~ ls
	
	-rwxr-xr-x  1 root  wheel  65032 Apr  2 14:48 libsubstitute.dylib
	-rw-r--r--  1 root  wheel  15771 Apr  2 14:48 substrate.h
	```

* 将这两个文件都引入到 HookDevMateKit 中。在动态库.m 文件中加入[上一篇](http://roastduck.xyz/article/%E9%80%86%E5%90%91%E5%AE%9E%E6%88%98%E5%BD%95%E4%BA%8CMWeb-substitute.html)中绕过试用逻辑的代码。
	
	```c++ MWebHook.m
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
        MSHookFunction((void *)(0x100254ab0 + g_slide), (void *)hook_sub254ab0, (void **)&origin_sub254ab0);
    
    }
    ```
* 编译，在项目中的 Products 下生成 libMWebInject.dylib。然后 show in finder，将动态库拷贝到桌面上。
* 这时候打开终端，来到桌面路径下测试。首先将 libsubstitute.dylib 拷贝到 /Applications/MWeb.app/Contents/MacOS/ 路径下，至于为什么吗？
    ![machoview_substitute_path](https://i.loli.net/2019/04/26/5cc2d07e7bee1.jpg)
    可以看到 libMWebInject.dylib 中已经指定，感觉将其改为和 Inject 动态库处于同一路径好些，免得拷贝。不过笔者在 xcode 中没找到怎么改！！！
    
    > [@executable_path](https://www.cnblogs.com/o--ok/p/9784260.html)
    > [@executable_path](https://wincent.com/wiki/%40executable_path%2C_%40load_path_and_%40rpath)
    
    拷贝好后，终端执行
    ```
DYLD_INSERT_LIBRARIES=libMWebInject.dylib /Applications/MWeb.app/Contents/MacOS/MWeb
    ```
    不出意外，MWeb 已经运行，而且没有 update error 的提示框。

* 由此可以推测出 update error 的出现是由于对可执行文件或整个 app 的完整性校验。而使用 DYLD_INSERT_LIBRARIES 动态注入并没有改变原 app(直接启动 MWeb，可以看到试用框又出现了)。而前面两篇文章破解后的 app 都改变了可执行文件，直接使用不会出现试用框。

### 总结
* 一旦更新 MWeb，新的可执行文件会覆盖掉我们破解过的。又要重新破解一次才行。使用汇编破解的方式，需要全程重来。使用动态注入的方式，对于 sub_xxxx 的函数，如果地址变化则要重新破解，但只要改几个数字就好；对于 hook 的方法名，只要 MWeb 没有改变名字，动态库就可以长期有效。
* 三篇文章破解方式
    * 修改汇编
    * MonkeyDev 通过 IMP 交换实现对原方法或函数的修改，然后编译成动态库。通过修改可执行文件的 LoadCommand 加载动态库。
    * 编译动态库思路和 MonkeyDev 相同。加载动态库是通过 DYLD_INSERT_LIBRARIES 动态注入。

    > framework 是一个动态库，不能直接执行。使用 DYLD_INSERT_LIBRARIES 会报 exec format error 。

### 创建一个 app 实现自动注入
* [参考链接](http://iosre.com/t/macos-app-app/10976)
* 使用 DYLD_INSERT_LIBRARIES， 每次都要去命令行太不友好。我们可以编写一个脚本实现自动化，并且将其包装成 App 的方式使用。
* 新建一个文件夹，并命名为 MWeb.app（名字随意，笔者平常使用 Alfred，MWeb 用习惯了。为了不和原App 名冲突，我将原来的重命名 NMWeb.app）。然后 show package contents 进入。
* 创建 Frameworks 文件夹，并将 libMWebInject.dylib 和 libsubstitute.dylib（不是必须的，如果选择不拷贝，脚本文件修改相应路径或者手动拷贝） 拷贝进来。
* 创建 MacOS 文件夹，在里面新建一个脚本文件，名字和之前新建的 app 同名，同时不要有 .sh 后缀。用 sublime text 打开输入下面的脚本

    ```
    #!/bin/sh
    // 获取当前脚本文件的目录的父目录，也就是 Contents 目录绝对路径
    CurrentAppPath=$(cd $(dirname $0) && cd .. && pwd)
    
    // 检测可执行文件目录中是否有 libsubstitute 动态库，没有则复制过去一个
    substitute_path=/Applications/MWeb.app/Contents/MacOS/libsubstitute.dylib
    if [ ! -e substitute_path ]; then
        cp ${CurrentAppPath}/Frameworks/libsubstitute.dylib  /Applications/MWeb.app/Contents/MacOS/
    fi
    
    // 注入动态库
    DYLD_INSERT_LIBRARIES=${CurrentAppPath}/Frameworks/libMWebInject.dylib /Applications/MWeb.app/Contents/MacOS/MWeb
    ```
    保存后，给脚本文件添加当前用户的可执行权限
    
    ```
    // 再次提醒，这里 MWeb 就是我们创建的脚本。改这个名字只是笔者的习惯
    chmod u+x MWeb
    ```
* 在脚本 app/Contents 下新建一个 info.plist 文件, 内容如下
    
    ```
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
    	<key>LSUIElement</key>
    	<true/>
    </dict>
    </plist>
    ```
    也可以用 xcode 新建一个
    ![LSUIElemnt_true](https://i.loli.net/2019/04/26/5cc2d07c3c837.jpg)

* 现在可以使用脚本 app 自动破解了。

### 恢复符号表
* 我们下载的 APP 一般都是删除符号表的，这样不仅增加一点逆向成本，APP 体积也更小。而且逆向总要去 hook 方法。

	```shell restore-symbol路径
	./restore-symbol /Applications/MWeb.app/Contents/MacOS/MWeb -o MWeb
	```
	可以看到恢复后的可执行文件变大了。然后将新的可执行文件替换原来的。发现启动应用没有任何反应。

* 使用 MonkeyDev 的 monkeyparser，它已经集成了 restore-symbol，在 `/opt/MonkeyDev/Tools/mpack.sh`中可以看到相关命令。在注入前会自动恢复符号表以及去签名步骤。
* 恢复符号表之后，再启动app，可能启动不了。因为可执行文件被修改，签名遭到破坏。app中可能对签名信息作了验证。
	安装了 MonkeyDev 后可以使用如下命了去掉签名。其实就是用strip命令去删除了MachO中签名的信息。
	```
	monkeyparser strip -t MWeb -o MWeb-unsigned
	```
		
### Xcode LLDB 调试

* Xcode 随便新建一个 MacOS 项目。`Debug - Attach To Process - 选中要附加的 APP`。Xcode 上方状态栏显示 Running xxx 后，使用 Xcode `Debug View Hierarchy`断住 APP。

* 接下来使用 `bt all`打印 APP 所有在使用线程的堆栈。

* 使用 `image list | grep xxx`来查看指定可执行文件的模块地址。 xxx 必须是完整可执行文件名。

* 这种方式有个缺点，附加时 App 已经启动了。对于 AppDelegate 的方法我们调试不了。

### Mac App 的界面调试
* 上面 Xcode 的 `Debug View Hierarchy`
* Interface Inspector App，收费工具，可以自行破解。