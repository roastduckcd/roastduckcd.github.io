---
title: RAC流程分析
date: 2019-05-02 22:32:08
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- RAC
tags:
- RAC
---



KVO - 添加观察者，观察者观察到变化，观察者作出响应。
RAC - 订阅者订阅信号，信号变化，订阅者作出响应？？？
<!--more-->
RAC 将需要传输的数据或事件都当做信号。信号发出，由订阅者收到信号(即得到数据)作出响应。信号创建时，内部创建一个销毁者收集所有信息，等到合适的时机销毁。因此我们不需要关注如何销毁。


一个内部的基本流程如下：

```
// 创建信号
RACSignal *signal = [RACSignal createSignal:^RACDisposable * _Nullable(id<RACSubscriber>  _Nonnull subscriber) {
    
    // 发送信号
    [subscriber sendNext:@"已将值发送出去"];
    // 销毁信号及订阅者
    return [RACDisposable disposableWithBlock:^{
        NSLog(@"自动销毁了");
    }];
}];
// 订阅信号
[signal subscribeNext:^(id  _Nullable x) {
    NSLog(@"订阅到了:%@",x);
}];
```


* 创建信号

```
+ (RACSignal *)createSignal:(RACDisposable * (^)(id<RACSubscriber> subscriber))didSubscribe {};
```
顺着该方法一路进去，最后来到 RACDynamicSignal 类，这是 RACSignal 的子类。而这里对于主流程来说就做了一件事，那就是**保存创建信号时传入的 block，等待时机执行它**。

```
+ (RACSignal *)createSignal:(RACDisposable * (^)(id<RACSubscriber> subscriber))didSubscribe {
	RACDynamicSignal *signal = [[self alloc] init];
    // 保存 block
    // 这里的 didSubscribe 其实是一个只读属性。这里展示了一种修改OC只读属性的方法
    // 其他还可以通过 KVC 方式
	signal->_didSubscribe = [didSubscribe copy];
	// 这里暂时不管。是跟RAC测试相关的，需要设置 RAC_DEBUG_SIGNAL_NAMES ，但是怎么设置还在研究。
	return [signal setNameWithFormat:@"+createSignal:"];
}
```
block 的东西放到后面再说。我们已经创建好信号，接下来就是订阅该信号。

* 订阅信号
既然要订阅信号,就需要订阅者，也就是接收信号的。但是在哪创建了订阅者？进到`subscribeNext:方法`

```
- (RACDisposable *)subscribeNext:(void (^)(id x))nextBlock {
	NSCParameterAssert(nextBlock != NULL);
	// 这是一个工厂方法，就是创建订阅者，并保存了 block
	RACSubscriber *o = [RACSubscriber subscriberWithNext:nextBlock error:NULL completed:NULL];
	// 这里的 self 其实是 RACDynamicSignal 对象，是创建信号时返回的
	return [self subscribe:o];
}
```
```
- (RACDisposable *)subscribe:(id<RACSubscriber>)subscriber {
	NSCParameterAssert(subscriber != nil);

    // 创建复合销毁者
	RACCompoundDisposable *disposable = [RACCompoundDisposable compoundDisposable];
	// 将订阅者、
	subscriber = [[RACPassthroughSubscriber alloc] initWithSubscriber:subscriber signal:self disposable:disposable];

	if (self.didSubscribe != NULL) {
		RACDisposable *schedulingDisposable = [RACScheduler.subscriptionScheduler schedule:^{
			RACDisposable *innerDisposable = self.didSubscribe(subscriber);
			[disposable addDisposable:innerDisposable];
		}];

		[disposable addDisposable:schedulingDisposable];
	}
	
	return disposable;
}
```

* 发送信号
* 销毁信号
