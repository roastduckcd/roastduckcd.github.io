---
title: Runtime二对象-类对象-元类对象
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - Runtime
tags:
  - isa
  - superclass
date: 2019-03-20 15:28:13
top:
---

#### [先上原文](http://www.sealiesoftware.com/blog/archive/2009/04/14/objc_explain_Classes_and_metaclasses.html)
#### 翻译

* OC 是一门基于类的面向对象语言。每个对象都是某一个类的实例；对象的联合体成员变量`isa`指向它的类。类描述了对象的状态：占用内存大小、成员类型和布局；还描述了对象的行为：_对象能响应的方法和已经实现的实例方法。？_<!--more-->

* 类的方法列表保存了实例方法以及对象能响应的方法。向实例对象发送消息的过程，就是调用`objc_msgSend`函数去查实例对象的类(或父类)方法列表，匹配成功则调用。

* 每个 OC 类也是一个对象，也有 `isa`和其他数据成员以及响应的方法。调用类方法，比如`[NSObject alloc]`，就是在向类对象发送消息。

* 既然类也是对象，那它一定是其他某个类的实例，我们称之为元类。正如类描述了实例对象的信息，元类描述的是类对象的信息。注意，元类的方法列表存放的是类方法，由类对象调用。向类(元类的实例)发送消息，`objc_msgSend`会去查找元类(或父元类)的方法列表，匹配成功则调用。元类代表类对象描述了类方法，类代表实例对象描述了实例方法。

* 元类对象呢？元类的元类并且一直持续？当然不是。某一元类是根类的元类的实例；根源类的元类是它本身。`isa`走位链在根源类这里结束：实例->类->元类->根元类->根元类自己。元类对象的 `isa` 指向并不重要，因为我们不会向元类对象发送消息。

* 相比而言，元类的父类更为重要。元类的父类走位链和类的父类走位链是相互独立的，所以类方法的继承和实例方法的继承也互相独立。根元类的父类是根类，所以类对象能响应根类的实例方法。结论：和其他对象一样，类对象是根类的实例(或子类)。

* 是不是二晕二晕的？一起来理一下。记住，向对象发送消息时，方法查找起始点是对象`isa`指向的类，然后是父类链。实例方法定义在类中，类方法定义在元类和根类(不是根元类)中。

* 在一些计算机语言科学理论中，类和元类的继承关系更加自由，比如更进一步的元类链，任一元类能实例化多个类。OC 使用元类的目的是存储类方法，但同时又想隐藏元类。比如，`[NSObject class]`和`[NSObject self]`等价，但前者理论上应该返回`NSObject->isa`指向的元类。OC 根据实际情况做了很多妥协，比如这里就限制了类的`schema`（应该是想说明 NSObject 指向自己，这里实在不知道怎么翻译），以免`NSObject`太元类了。

#### 祭图，再说一遍
![isa_superclass_chain](https://i.loli.net/2019/03/20/5c91eb637d09c.png)

* `isa`走位：`object_getClass(实例)` -> `object_getClass(类)` -> `object_getClass(元类)` -> `object_getClass(根元类)` -> `object_getClass(根元类)`。 `isa` 最终指向根元类。

* `superclass`走位：`[实例 class]` -> `[类 superclass]` -> `[父类 superclass]` -> `[根类 superclass]` -> `nil`。 `superclass` 最终指向 `nil`。
    * 根元类的父类指向根类，最后指向 nil。

#### isa 走位验证

![isa_chain_verified](https://i.loli.net/2019/03/20/5c91eb62f2b8a.jpg)

* 所有对象都是`objc_object`结构体，有一个 `isa`成员。所有类对象都是`objc_class`结构体，继承自`objc_object`。所以第一个 8 字节就是 `isa`。OBJECTIVE2 后的 `isa`不仅包含类的地址，其 bit 位还存储有其他信息。因此需要 `& 0xffffffff8`。[详细看这 shiftcls 字段](http://roastduck.xyz/article/iOS-non-pointer-isa.html)
* `po` 命令：打印类型
* `p/x`将结果以 16 进制显示
* `x` 读取内存中的值
* 除了上面的`lldb`调试，也可以使用 `object_getClass(Class)`函数验证。

#### 父类指针走位

![superclass_chain_verified](https://i.loli.net/2019/03/20/5c91eb6320a29.jpg)
* `objc_class`继承自`objc_object`，默认第一个为 `isa`，第二个 8 bytes 才是 `superclass`。该成员直接就表示的父类地址。
