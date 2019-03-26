---
title: python-属性赋值
comments: true
toc: true
copyright: true
declare: true
categories:
  - python
date: 2019-03-26 21:58:25
top:
---


python 中对属性的访问和赋值是通过类的自由方法完成的。我们可以重写这些方法来验证。
<!--more-->

```
class User(object):
    def __getattr__(self, item):
        print("调用了get_attr")
        return super(User, self).__getattr__(item)

    def __setattr__(self, key, value):
        print("调用了set_attr")
        super(User, self).__setattr__(key, value)

    def __delattr__(self, item):
        print("调用了del_attr")
        super(User, self).__delattr__(item)

    def __getattribute__(self, item):
        print("调用了get_attribute")
        return super(User, self).__getattribute__(item)
    # 定义一个属性
    name = ""
```
实例化一个对象

```
user = User()
```
* 取值

```
user.name
# 调用了get_attribute
```
* 赋值

```
user.name = "song"
# 调用了set_attr
```
* 删除属性

```
del user.name
# 调用了del_attr
```
上面的都是针对已存在的属性，如果属性并不存在呢？

* 访问不存在的属性
```
try:
    user.addr
except AttributeError:
    print("为演示对不存在的属性调用不做处理")
# 调用了get_attribute
# 调用了get_attr
# 为演示对不存在的属性调用不做处理
```
* 删除不存在的属性
```
try:
    del user.age
except AttributeError:
    print("为演示对不存在的属性调用不做处理")
# 调用了del_attr
# 为演示对不存在的属性调用不做处理
```
可以看到访问时，对象会先调用`__getattribute__`,如果没有找到，再调用`__getattr__`。我们就可以在这两个方法中，对该属性进行处理，设置新值或者抛出友好一点的提示。如果不处理，程序中断，抛出`AttributeError`

而对不存在的属性赋值，由于python是一门动态语言，如果属性不存在，python会自动创建。

### 知乎看到的

```
python只有name和object 
a = 3 
这个语句中 a 是一个名字，3是一个object
这个语句其实并不是什么赋值而是干了以下三件事
1. 创建name a
2. 创建object 3
3. 将name a 关联到 3这个object 
以后就可以用a来调用3这个object

所有name在创建时必须关联到一个object。name可以在创建以后指向任何一个object（包括不同类型）。所以name本身没有类别，他关联的object是有类别的。

在python中可以使用type（name）来查看name关联的object的类型。

作者：蔡海洋
链接：https://www.zhihu.com/question/25090486/answer/266513336
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
```

### 死循环

* `__setattr__`

```
class User(object):
    def __setattr__(self, key, value):
        print("调用了set_attr")
        # 这是个什么效果？？？待深入
        super(User, self).__setattr__(key, value)
```
由于赋值操作会调用`__setattr__`函数，如果将上面的赋值实现如下：
```
self.key = value
```
这样就会被`__setattr__`函数拦截，有继续向下调用`__setattr__`,导致了循环调用，最终程序会崩溃。
解决方法就是使用上面的。调用父类的方法？？？,
或者也可以使用本类的变量和方法字典，通过key去赋值
```
self.__dict__[key] = value
```
* `__getattribute__`
同样的，由于使用`self.xxx`时，会被`__getattribute__`拦截。所以
如果在`__getattribute__`中使用`self.xxx`也会导致死循环