---
title: 从UIStoryboard获取UIViewController实例
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 踩的坑
tags:
  - storyboard
date: 2019-03-24 01:35:10
top:
---

坑：从UIStoryboard获取UIViewController实例

在写一个Block进行反向传值的测试Demo时，在第二个控制器调用block时产生异常，断点查看原来block为空。但是我在第一个控制器明明已经实现了T_T。<!--more-->

http://www.cocoachina.com/ios/20160226/15324.html（翻译）
http://code.tutsplus.com/tutorials/what-is-exc_bad_access-and-how-to-debug-it--cms-24544（英文原版）
> 总之，当你碰到EXC_BAD_ACCESS ，这意味着你试图发送消息到的内存块，但内存块无法执行该消息。但是，在某些情况下， EXC_BAD_ACCESS是由被损坏的指针引起的。每当你的应用程序尝试引用损坏的指针，一个异常就会被内核抛出。

既然block的使用没问题，那就只好查看block的owner了。发现调用block时的ControllerB 和 实现block时的 ControllerA
地址不同。也就是调用block时的ControllerB，其实并没有拿到block的实现。

由于我用的storyboard，获取Controller的方法是
```
UIStoryboard *storyBoard = [UIStoryboard storyboardWithName:@"Main" bundle:[NSBundle mainBundle]];

SecondViewController *secondVc = [storyBoard instantiateViewControllerWithIdentifier:@"SecondViewController"];
```
因为secondVc是个局部变量，这样每次创建时获取了一个新的Controller实例，造成了我实现和调用的Controller实例不同，从而发生异常。

既然如此，要保证是同一个实例，那就提升为属性，问题解决。
```
@property (strong, nonatomic) SecondViewController *secondVc;
//懒加载：getter
- (SecondViewController *)secondVc{
    
    if (!_secondVc) {
        
        UIStoryboard *storyBoard = [UIStoryboard storyboardWithName:@"Main" bundle:[NSBundle mainBundle]];
        _secondVc = [storyBoard instantiateViewControllerWithIdentifier:@"SecondViewController"];
    }
    return _secondVc;
}
```
总结：
1. present或push时的Controller和之后使用的Controller就是同一个，所以保证在其他地方使用的Controller 和 present或push时的 Controller 实例地址相同就可以。

ControllerA：
```
[self.navigationController pushViewController:self.secondVc animated:YES];
```
ControllerB:    self
2. 提高程序的容错性。
很简单，加个if进行判断即可。个人认为，程序若还在调试期，不加可以快速定位异常点，但在交付客户使用时，一定要加，宁愿让客户看到占位信息，也不能让程序崩溃。
```
if (self.passValueBlock) {
        
        self.passValueBlock(self.secondText);
    }
```
