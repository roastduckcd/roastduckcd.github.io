---
title: OC中不能直接对frame成员赋值
comments: true
toc: true
copyright: true
declare: true
categories:
  - ObjectiveC
tags:
  - iOS
date: 2019-02-18 05:16:33
top:
---

原因是点语法的不同。

前半部分`view.frame`OC中UI对象的点语法，本质是getter方法：`- (CGRect)frame{}`，是一个方法。<!--more-->同过view.frame 即 - [vew frame]得到的值是一个方法返回值，并且是一个值类型。在C语言中是不能当左值的，也就是只能出现在`=`的右边。所以编译时出现`Expression is not assignable`。

后半部分`frame`本身是一个`CGRect`的结构体，`.`表示指针指向。

但是也许我们能看到

```
[UIButton buttonWithType:UIButtonTypeSystem].backgroundColor = [UIColor redColor];
```
方法返回值还是出现在左边，但没报错。那是因为OC的setter方法，这一句其实是

```
[[UIButton buttonWithType:UIButtonTypeSystem] setBackgroundColor:[UIColor redColor]];
```
实际上是方法的调用。


所以我们要修改`frame`必须要先创建`CGRect`的结构体，再通过调用`view`的`setFrame`方法。

```
    // 只能作右值
    CGRect newFrame = self.view.frame;
    // 修改结构体
    newFrame.origin.x = 50;
    // 调用setter方法
    self.view.frame = newFrame;
```


扩展：

```
typedef struct rect {
    int a;
    int b;
}MyRect;
MyRect * check();
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // insert code here...
        NSLog(@"Hello, World!");
        // 函数返回值不能当左值
//        check().a = 6;
        // 函数返回值是指针可以当左值。
        check() -> a = 6;
    }
    return 0;
}
MyRect * check() {
    struct rect test = {3, 4};
    // 要这样用必须有typedef
    MyRect r = {3, 4};
    MyRect *p = &r;
    return p;
}
```