---
title: iOS多线程
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 多线程
tags:
  - 多线程
  - NSOperation
date: 2019-03-25 01:27:05
top:
---

###同步和异步，并行和串行

* 针对线程
    
1. **同步：**会阻塞当前线程，必须等同步线程的任务执行完，才继续下一任务
2. **异步：**不会阻塞当前线程，任务不用等待。
        
<!--more-->
    针对队列，一个线程中的多个任务执行方式
3. **串行：**队列中当前任务需要等待上一个任务完成，再执行。
4. **并行：**队列中当前任务不需要等待上一个完成，就能执行。

    任务1，2，3分别输出a,b,c
    串行队列执行属性：a,b,c
    并行队列执行：需要根据当前系统能处理的任务数量，假设可处理俩个任务，则先处理任务1，任务2；任务3则看任务1或2谁先执行完,任务3再执行。

> 同步和异步代表会不会开辟新的线程。串行和并发代表任务执行的方式。
>同步串行和同步并发，任务执行的方式是一样的。没有区别，因为没有开辟新的线程，所有的任务都是在一条线程里面执行。
>异步串行和异步并发，任务执行的方式是有区别的，异步串行会开辟一条新的线程，队列中所有任务按照添加的顺序一个一个执行，异步并发会开辟多条线程，至于具体开辟多少条线程，是由系统决定的，但是所有的任务好像就是同时执行的一样。

5. **线程死锁：**两个或两个以上的进程在执行过程中，因争夺资源而造成的一种互相等待的现象，若无外力作用，它们都将无法推进下去。
**死锁可能的原因：**
* 第一，因为系统资源不足；
* 第二，进程运行推进的顺序不合适；
* 第三，资源分配不当。

---
我的理解：存在同步异步，串行并行才有载体实现。
案例解析：
1. 
```
//同步串行(主队列)
void synchronizeThreadAndSerialQueue(){
    
    NSLog(@"任务1");
    dispatch_sync(dispatch_get_main_queue(), ^{
        NSLog(@"任务2");
    });
    NSLog(@"任务3");
}
//输出结果：任务1
```
        解析：任务加入队列的顺序：任务1，同步线程，任务3，任务2(block中的任务最后加入)。任务1执行后，由于线程同步，任务3需要等到同步线程中的任务结束才执行；又因为任务在主队列(串行队列)，任务2需要等带任务3结束才执行。造成任务2，3互相等待，即产生死锁。通过Xcode的DebugNavigator也可看到程序并未结束，内存一直被占用着。
   
   ![然并卵的描述][1]     
2. 
```
//同步并行(全局队列)
void synchronizeThreadAndConcurrentQueue(){
    
    NSLog(@"任务1");
    dispatch_sync(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
        NSLog(@"任务2");
    });
    NSLog(@"任务3");
}
//输出结果：
        任务1  
        任务2   
        任务3
```
        解析：任务1执行后，遇到同步线程，阻塞，任务3等待同步线程的任务结束；此时因为任务2被加入到全局队列(并行队列)，可以自由执行。然后返回主线程，执行任务3。
![尼玛，原来要顶格][2]
3. 
```
//异步串行套同步串行
void asynchronizeThreadAndSerialQueue(){
    
    dispatch_queue_t serialQueue = dispatch_queue_create("asynchronize.serial", DISPATCH_QUEUE_SERIAL);
    NSLog(@"任务1");
    
    dispatch_async(serialQueue, ^{
        NSLog(@"任务2");
        dispatch_sync(serialQueue, ^{
            NSLog(@"任务3");
        });
        NSLog(@"任务4");
    });
    NSLog(@"任务5");
}
//输出结果：
    任务1
    任务5
    任务2(任务5和2顺序不一定)
//在使用MAC Command Line Tools调试中出现：T_T
    任务1
    任务5
```
        解析：手动创建了一个串行队列。任务1执行后，遇到异步线程，其中的任务2，同步线程，任务4加入到创建的串行队列中。由于是异步，所有主线程中任务5不需等待其他任务。所以任务2和5的顺序取决于线程执行状态，如有sleep等。
            异步线程中任务2执行后，遇到同步线程，任务3和任务4形成死锁，原理同案例1.，所以无输出。
![尼玛，原来要顶格][3]
4. 
```
//异步并行(全局队列)套同步并行
void asynchronizeThreadAndConcurrentQueue(){
    
    NSLog(@"任务1");
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
        NSLog(@"任务2");
        dispatch_sync(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
            NSLog(@"任务3");
        });
        NSLog(@"任务4");
    });
    NSLog(@"任务5");
}
//输出结果：
        任务1
        任务5
        任务2(2和5顺序不一定)
        任务3
        任务4(4一定在3后)
```
        解析：案例3和案例2结合。
![尼玛，原来要顶格][4]
5.
```
//异步并行套同病串行
void mixed(){
    
    dispatch_async(dispatch_get_global_queue(0, 0), ^{
        NSLog(@"任务1");
        dispatch_sync(dispatch_get_main_queue(), ^{
            NSLog(@"任务2");
        });
        NSLog(@"任务3");
    });
    NSLog(@"任务4");
    while (1) {
        
    }
    NSLog(@"任务5");
}
//输出结果
        任务4
        任务1(1和4顺序不一定)
```
        解析：首先遇到异步另开线程，将 （任务1，同步线程，任务3） 加入全局队列，任务4和该异步线程同级，输出顺序取决于执行状态。异步线程中任务1执行后遇到同步线程，阻塞，任务3等待同步线程的任务完成。因为同步线程为主队列，任务2在任务3之后加入，所以任务2要等待任务3执行，形成死锁不执行。while形成死循环，任务5用于不执行。

![尼玛，又有了][5]

###NSOperation的方式有两种，

* 一种是用定义好的两个子类：NSInvocationOperation 和 NSBlockOperation。
    继承重写NSOperation的一个方法main。然后把NSOperation子类的对象放入NSOperationQueue队列中，该队列就会启动并开始处理它。

* 一种是继承NSOperation
如何控制线程池中的线程数？
通过下面的代码设置：
`[queue setMaxConcurrentOperationCount:5];`
    队列里可以加入很多个NSOperation,可以把NSOperationQueue看作一个线程池，可往线程池中添加操作（NSOperation）到队列中。线程池中的线程可看作消费者，从队列中取走操作，并执行它。
    线程池中的线程数，也就是并发操作数。默认情况下是-1，-1表示没有限制，这样会同时运行队列中的全部的操作。
```
- (void)viewDidLoad
 {
    [super viewDidLoad];
    NSInvocationOperation *operation = [[NSInvocationOperation
        alloc] initWithTarget:self
                     selector:@selector(downloadImage:)
                       object:kURL];
    NSOperationQueue *queue = [[NSOperationQueue alloc] init];
    [queue addOperation:operation];
}
```
### GCD的介绍和使用
        支持多核心处理器和其他的对称多处理系统的系统。这建立在任务并行执行的线程池模式的基础上的。
        工作原理是：让程序平行排队地执行特定任务，根据可用的处理资源，安排他们在任何可用的处理器核心上执行任务。
        
dispatch queue分为下面三种：
        
* Serial
又称为private dispatch queues，同时只执行一个任务。Serial queue通常用于同步访问特定的资源或数据。当你创建多个Serial queue时，虽然它们各自是同步执行的，但Serial queue与Serial queue之间是并发执行的。
* Concurrent
又称为global dispatch queue，可以并发地执行多个任务，但是执行完成的顺序是随机的。
* Main dispatch queue
它是全局可用的serial queue，它是在应用程序主线程上执行任务的。

一般操作：

        耗时操作，比如读取网络数据，IO,数据库读写等，一般会在另外一个线程中处理这些操作，然后通知主线程更新界面。
```
//此方法可以实现监听一组任务是否完成，如果完成后通知其他操作(如界面更新),此方法在下载附件时挺有用，
//在搪行几个下载任务时，当下载完成后通过dispatch_group_notify通知主线程下载完成并更新相应界面

dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
dispatch_group_t group = dispatch_group_create();
dispatch_group_async(group, queue, ^{
    [NSThread sleepForTimeInterval:0.09];
    NSLog(@”group1”);
    NSURL * url = [NSURL URLWithString:kURL];
    NSData * data = [[NSData alloc]initWithContentsOfURL:url];
    _image = [[UIImage alloc]initWithData:data];
});
dispatch_group_async(group, queue, ^{
    [NSThread sleepForTimeInterval:0.09];
    NSLog(@”group2”);
});
dispatch_group_async(group, queue, ^{

    [NSThread sleepForTimeInterval:0.09];
    NSLog(@”group3”);
});
dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    NSLog(@”updateUi”);
    _imageView.image = _image;
});
}
```
```
//是在前面的任务执行结束后它才执行，而且它后面的任务等它执行完成之后才会执行
dispatch_queue_t queue =dispatch_async(queue, ^{
    [NSThread sleepForTimeInterval:4];
    NSLog(@”dispatch_async2”);
});
dispatch_barrier_async(queue, ^{
    NSLog(@”dispatch_barrier_async”);
    [NSThread sleepForTimeInterval:4];
});
dispatch_async(queue, ^{
    [NSThread sleepForTimeInterval:1];
    NSLog(@”dispatch_async”);
});
}
```

```
[_condition lock];
    [NSThread sleepForTimeInterval:3];
    NSLog(@”当前物品名称:%d,售出数量:%d,线程名-=-==: %@”,          _tickets, _count, [[NSThread currentThread] name]);
    [_condition signal];
    [_condition unlock];
}
}
- (void)run
{
while (true) {
    //上锁
    [_lock lock];
if (_tickets > 0) {
    [NSThread sleepForTimeInterval:0.09];
    _count = 200 - _tickets;
    NSLog(@”当前物品名称:%d,售出数量:%d,线程名: %@”, _tickets,     _count, [[NSThread currentThread] name]);
    _tickets–;
}else{
    break;
}
    [_lock unlock];
    }
}
/**
* @param string url
*/
- (void)downloadImage:(NSString *) url{
    NSData *data = [[NSData alloc] initWithContentsOfURL:[NSURL URLWithString:url]];
    UIImage *image = [[UIImage alloc] initWithData:data]
    if(image == nil){
        [self updateUI:image];
    }else{

    [self performSelectorOnMainThread:@selector(updateUI:) withObject:image waitUntilDone:YES];
    }
}
- (void)updateUI:(UIImage *)image
{
    _imageView.image = image;
}
```


  [1]: http://s1.knowsky.com/20151016/qgjziakjkep03.jpg
  [2]: http://s1.knowsky.com/20151016/1fivutu14nc03.jpg
  [3]: http://s1.knowsky.com/20151016/nbrawr5unfe05.jpg
  [4]: http://s1.knowsky.com/20151016/0zkjjd4glch05.jpg
  [5]: http://s1.knowsky.com/20151016/eugxee5yhvb05.jpg