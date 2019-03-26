---
title: LLDB部分命令列举
comments: true
toc: true
top: 
declare: true
copyright: true
categories:
  - 工具
  - 调试工具
tags:
  - 工具
  - LLDB
date: 2019-01-30 16:44:02
updated:
permalink: 
---

* [官网](http://lldb.llvm.org/)
* 完整的 lldb 命令[点击进入](http://lldb.llvm.org/lldb-gdb.html)
* 终端中输入 `lldb` 即可进入环境。本文是在 Xcode 中调试。
<!--more-->
### 流程控制命令 
* `c（continue）`:继续运行到下一个断点处
* `s（step into）`:进入函数
* `si`:进入函数，汇编级别指令
* `n`:单步向下过掉==一条源码==语句，不会进入函数
* `ni`:单步向下过掉==一条汇编==语句，不会进入函数
* `finish`:进入到函数后，退出当前函数，回到上一个函数

### 对象操作命令 expression
一般我们用来查看变量的值，二般写些简单语句。
* 缩写为 `p` 或 `e` + 语句
* 在 lldb 中新变量的声明和使用都必须在前面加 `$`。调试程序中的变量直接使用

```c
(lldb) expression int $a = 10;
(lldb) p a
error: use of undeclared identifier 'a'
(lldb) p $a
(int) $a = 10
```

##### ==`p 表达式`: 动态执行语句==
* `p 对象`: 打印对象所有信息，包括类型、地址、值等

```ObjC
(lldb) p NSString *$str = @"string1";
(lldb) p $str
(NSTaggedPointerString *) $str = 0x8692ace9390c5ac2 @"string1"
(lldb) p NSArray *$arr = @[@1, @"string2"];
(lldb) p $arr
(__NSArrayI *) $arr = 0x00006000039b2ac0 @"2 elements"
(lldb) p jinmao
(Dog *) $0 = 0x00006000039be820
(lldb) p jinmao.name
(__NSCFConstantString *) $1 = 0x0000000108b80070 @"jinmao"
(lldb) 
```

* `po 对象`: 调用对象的 description 方法。如果是 OC 基本类型对象，只打印值。我们可以重写对象的`-description`方法来改变该调试语句的输出。

```ObjC
// 上面的po打印
(lldb) po $str
string1
(lldb) po $arr
<__NSArrayI 0x6000039b2ac0>(
1,
string2
)
(lldb) po jinmao
<Dog: 0x6000039be820>
(lldb) po jinmao.name
jinmao
```

* 当程序被断住时，我们可以操作当前作用域的变量、调用对象方法等。

```ObjC
// 取值
(lldb) p self.view.backgroundColor
(UIDeviceRGBColor *) $10 = 0x0000600002cb4140
// 修改值、调用方法
(lldb) p self.view.backgroundColor = [UIColor redColor];
(UICachedDeviceRGBColor *) $11 = 0x0000600002ca0b40
```

* `p` 命令操作属性或成员变量时会自动分配一个`$n`局部变量来接收值。我们也可以直接操作这个变量。

```Objc
(lldb) p jinmao
(Dog *) $0 = 0x0000600002892980
(lldb) po jinmao.name
jinmao
(lldb) po $0.name = @"erha"
erha
```
和操作原对象没什么区别。注意也许有的 lldb `$n`变量并不能直接使用点语法。这时需要在前面显示指明类型即可。
` (lldb) po (Dog *)$0.name`

* 指定不同打印格式

```
// 16 进制打印
p/x
```

### 断点命令
* `help breakpoint` 断点命令参数列表, 区分大小写
* breakpoint 可缩写为 break

##### 查看断点 `breakpoint list`, 缩写`break list`
断点分组，组号从1开始。每组下的断点也从1开始编号。某个具体断点用 `组号.断点号` 表示
![lldb_break_list](https://i.loli.net/2019/01/30/5c5161672de1e.jpg)
##### 下断点
* `breakpoint set -n 函数名`
<br/>`breakpoint set` 可以缩写为 `b`
* `b -n "[类 方法]" -n "[类n 方法n:]"`，`-n`可选。
<br/>同时对 OC 方法设置多个断点，这种方法会将这些断点归为一组, 注意根据方法名称有可能不成功。
* `b --file 文件名 --selector 方法名`<br/>
为某个文件中的所有同名方法设置断点，省略 file 就是给整个项目中的同名方法设置断点。
* `b -r xxx` 为带有 xxx 字段的所有方法下断点 
* `b -a 函数地址` 汇编状态下常用

##### 断点命令 `breakpoint command`
* 给某一个断点添加命令 `breakpoint command add 断点组号`

##### 启用/禁用断点
* `break enable 组号/断点号`
* `break disable 组号/断点号`
注意如果先使用组号禁用断点，再使用断点号启用某一个断点会无效。所以如果要禁用某一组的断点，推荐使用`break dis 组号.*`。`*`号就表示所有。

##### 删除断点
* `breakpoint delete 断点组号`：删除某组所有断点
* `breakpoint delete 断点号`：禁用某个断点
* `breakpoint delete` 删除所有断点

### 内存断点 watchpoint
* 监控某个属性值变化 `watchpoint set variable xxx`，只能使用`对象->成员变量`，不能使用点语法。

### target hook 命令，只要触发断点就调用
* `target stop-hook add -o "frame variable"`
进入断点需要默认执行的 lldb 命令，此处是已进入断点就打印函数参数。一般写一些每个函数都能触发的通用命令。
针对 breakpoint 和 watchpoint 命令。
```
target stop-hook add -o "frame variable"
```
* list
* disable / able
* delete
* 该命令一旦退出程序就失效。可以使用 lldb 的初始化文件 `.lldb` 来配置 target-hook 命令使其长期有效，直接将命令写入即可。

### 堆栈操作命令
* 查看函数调用栈 `bt`
* 查看上(下)一个函数的汇编信息 `up/down`，不会改变执行流程
* 查看某一个栈帧的函数的汇编信息 `frame select 栈帧编号`, 这个栈帧
* 查看当前栈帧函数的参数 `frame variable`
* 断点回滚 `thread return` 回滚到该函数被调用的地方。
    * 回滚后不会再继续往下执行
    * 相当于在函数开头直接 return。

### 内存镜像命令 image
##### image list 查看加载了哪些动态库
列出所有内存中正在运行的模块在系统的路径，和此时在内存中的真实物理地址。
##### image lookup 当前进程加载的模块列表
* 崩溃代码定位
    * 先打全局断点，再 image lookup
* image lookup -a 方法内存地址 模块名
在指定模块中查找指定地址的**方法**信息，不指定模块名就是在所有模块中找。(笔者使用对象地址没有得到任何信息···)

```
Dog *a = [[Dog alloc] init];
[a performSelector:@selector(run)];
```
a 调用了一个不存在的 run 方法。此时崩溃
![lldb_imagelookup_exception](https://i.loli.net/2019/01/30/5c5161674883a.jpg)
由于奔溃地方指向如图位置，给我们定位 bug 带来困难。此时根据图中所示找到奔溃方法的上一个函数栈帧，得到它的地址，然后使用 `image lookup`
![lldb_imagelookup_getExcep](https://i.loli.net/2019/01/30/5c51616703d50.jpg)
这样直接就定位奔溃代码位置在`ViewController.m`中的第25行。
>Tip:这个功能也可以通过Xcode设置异常断点来实现

* image lookup -t 类名 
查看类的成员变量及属性等，但是看不到类的方法。
* image lookup -n 函数名
查找函数在模块/App中的位置
* image dump sections 模块名
从内存中导出模块的 MachO section 信息。一定要加模块名，否则是导出内存中所有的模块
* image dump symtab 模块名
从内存中导出模块的 MachO symbols 信息。千万要加模块名，否则就是内存中所有的模块。笔者跑了三分钟没到个头啊···


### 查看内存命令 memory
##### memory read[/][分组数][进制格式][每组字节数]
* 中括号表示参数可选。
* 进制格式：`x 16进制(常用)`， `d 10进制`
* 每组字节数：每组按多少个字节展示 `b 1个字节`，`h 2个字节`，`w 4个字节`，`g 8个字节`。如果是10进制，该参数无效。
* `memory read/6xb 0xxxxxxxxx` 读取 0xxxxxxxxx 的内容，分成6组，按16进制显示，每1个字节一组。因此总共读取了 6 bytes。
* `memory read` 也可以简写为 `x`: `x/6xb 0xxxxxxxxx`

    ![lldb_memory_read_format](https://i.loli.net/2019/03/26/5c99f42771f4d.jpg)

##### memory write
* `memory write 0xxxxxxxx value`：向内存 0xxxxxxxx 写入 value 值。

~~TODO: 后面补充~~
~~### 寄存器操作命令 register~~
~~##### register read / write~~
