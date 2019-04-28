---
title: NSRunloop与AutoreleasePool
date: 2019-04-28 21:51:28
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 内存管理
tags:
- runloop
- autoreleasepool
---



https://v.youku.com/v_show/id_XODgxODkzODI0.html
https://blog.ibireme.com/2015/05/18/runloop/
https://www.cnblogs.com/kenshincui/p/6823841.html
https://www.jianshu.com/p/5674ef48fe1e
<!--more-->
```
CFRunLoopSourceRef 是事件产生的地方。Source有两个版本：Source0 和 Source1。

// TODO: 查找结构体验证, source当中没有看到回调成员
struct __CFRunLoopSource {
    CFRuntimeBase _base;
    uint32_t _bits;
    pthread_mutex_t _lock;
    CFIndex _order;            /* immutable */
    CFMutableBagRef _runLoops;
    union {
        CFRunLoopSourceContext version0;    /* immutable, except invalidation */
        CFRunLoopSourceContext1 version1;    /* immutable, except invalidation */
    } _context;
};


• Source0 只包含了一个回调（函数指针），它并不能主动触发事件。使用时，你需要先调用 CFRunLoopSourceSignal(source)，将这个 Source 标记为待处理，然后手动调用 CFRunLoopWakeUp(runloop) 来唤醒 RunLoop，让其处理这个事件。
• Source1 包含了一个 mach_port 和一个回调（函数指针），被用于通过内核和其他线程相互发送消息。这种 Source 能主动唤醒 RunLoop 的线程，其原理在下面会讲到。
```

* 一个runloop可以有多个mode，一个mode可以有多个事件源(timer,source,observer)。同一个事件可以添加到不同的mode中。
* commonModes并不是一个标准mode，而是一个标准mode的集合。runloop中定义了一个当把一个事件以commonModes添加到runloop时，runloop会自动将该事件源添加到commonModes中的每个标准mode下。即同一个事件可以添加到不同的mode中。


```
// app 启动后的 runloop
{
    wakeup port = 0x1f07,
    stopped = false,
    ignoreWakeUps = false,

    current mode = kCFRunLoopDefaultMode,

    common modes = {
        type = mutable set,
        count = 2,
        entries =>
        0 : {contents = "UITrackingRunLoopMode"}
        2 : {contents = "kCFRunLoopDefaultMode"}
    },

    common mode items = {
        type = mutable set, count = 13,
        entries =>
        0 : {
            signalled = No, valid = Yes, order = -1,
            context = <CFRunLoopSource context>{
                version = 0,
                info = 0x0,
                callout = PurpleEventSignalCallback (0x111d4a188)
            }
        }
        1 : {
            signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {
                port = 42251,
                subsystem = 0x10ea19db0,
                context = 0x0
            }
        }
        2 : {signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{
                version = 0,
                info = 0x600001eb8210,
                callout = __handleEventQueue (0x10dace4b0)
            }
        }
        3 : <CFRunLoopSource 0x600001cb8840 [0x1098f4b48]{signalled = No, valid = Yes, order = -2, context = <CFRunLoopSource context>{version = 0, info = 0x6000027f8d20, callout = __handleHIDEventFetcherDrain (0x10dace4bc)}}
        4 : <CFRunLoopSource 0x600001cb5b00 [0x1098f4b48]>{signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {port = 22787, subsystem = 0x10ea06bd8, context = 0x6000029aa4a0}}
        15 : <CFRunLoopObserver 0x6000018b8c80 [0x1098f4b48]>{valid = Yes, activities = 0x20, repeats = Yes, order = 0, callout = _UIGestureRecognizerUpdateObserver (0x10dd721db), context = <CFRunLoopObserver context 0x6000002b8930>}
        16 : <CFRunLoopObserver 0x6000018bc320 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2000000, callout = _ZN2CA11Transaction17observer_callbackEP19__CFRunLoopObservermPv (0x10fb7395a), context = <CFRunLoopObserver context 0x0>}
        17 : <CFRunLoopObserver 0x6000018b8b40 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 1999000, callout = _beforeCACommitHandler (0x10dba9770), context = <CFRunLoopObserver context 0x7fd30f000210>}
        18 : <CFRunLoopObserver 0x6000018b8aa0 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2001000, callout = _afterCACommitHandler (0x10dba97e9), context = <CFRunLoopObserver context 0x7fd30f000210>}
        19 : <CFRunLoopSource 0x600001cb4fc0 [0x1098f4b48]>{signalled = Yes, valid = Yes, order = 0, context = <CFRunLoopSource context>{version = 0, info = 0x600000db0600, callout = FBSSerialQueueRunLoopSourceHandler (0x114d2372b)}}
        20 : <CFRunLoopObserver 0x6000018b8960 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
                                                                                                                                                                                                                                                                                             0 : <0x7fd30e000058>
                                                                                                                                                                                                                                                                                             )}}
        21 : <CFRunLoopSource 0x600001cb0000 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 1, info = 0x4b03, callout = PurpleEventCallback (0x111d4a194)}}
        22 : <CFRunLoopObserver 0x6000018b8a00 [0x1098f4b48]>{valid = Yes, activities = 0x1, repeats = Yes, order = -2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
                                                                                                                                                                                                                                                                                             0 : <0x7fd30e000058>
                                                                                                                                                                                                                                                                                             )}}
    }
    ,
    modes = <CFBasicHash 0x6000027f8270 [0x1098f4b48]>{
        type = mutable set,
        count = 4,
        entries =>
        2 : <CFRunLoopMode 0x6000012b8410 [0x1098f4b48]>{name = UITrackingRunLoopMode, port set = 0x5203, queue = 0x6000007b8c80, source = 0x6000007b8d80 (not fired), timer port = 0x4e03,
            sources0 = <CFBasicHash 0x6000027f8120 [0x1098f4b48]>{type = mutable set, count = 4,
                entries =>
                0 : <CFRunLoopSource 0x600001cb8540 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 0, info = 0x0, callout = PurpleEventSignalCallback (0x111d4a188)}}
                1 : <CFRunLoopSource 0x600001cb8840 [0x1098f4b48]>{signalled = No, valid = Yes, order = -2, context = <CFRunLoopSource context>{version = 0, info = 0x6000027f8d20, callout = __handleHIDEventFetcherDrain (0x10dace4bc)}}
                2 : <CFRunLoopSource 0x600001cb8780 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 0, info = 0x600001eb8210, callout = __handleEventQueue (0x10dace4b0)}}
                3 : <CFRunLoopSource 0x600001cb4fc0 [0x1098f4b48]>{signalled = Yes, valid = Yes, order = 0, context = <CFRunLoopSource context>{version = 0, info = 0x600000db0600, callout = FBSSerialQueueRunLoopSourceHandler (0x114d2372b)}}
            }
            ,
            sources1 = <CFBasicHash 0x6000027f8090 [0x1098f4b48]>{
                type = mutable set,
                count = 3,
                entries =>
                0 : <CFRunLoopSource 0x600001cb0000 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 1, info = 0x4b03, callout = PurpleEventCallback (0x111d4a194)}}
                1 : <CFRunLoopSource 0x600001cb5b00 [0x1098f4b48]>{signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {port = 22787, subsystem = 0x10ea06bd8, context = 0x6000029aa4a0}}
                2 : <CFRunLoopSource 0x600001cb86c0 [0x1098f4b48]>{signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {port = 42251, subsystem = 0x10ea19db0, context = 0x0}}
            }
            ,
            observers = (
                         "<CFRunLoopObserver 0x6000018b8a00 [0x1098f4b48]>{valid = Yes, activities = 0x1, repeats = Yes, order = -2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
	0 : <0x7fd30e000058>
)}}",
                         "<CFRunLoopObserver 0x6000018b8c80 [0x1098f4b48]>{valid = Yes, activities = 0x20, repeats = Yes, order = 0, callout = _UIGestureRecognizerUpdateObserver (0x10dd721db), context = <CFRunLoopObserver context 0x6000002b8930>}",
                         "<CFRunLoopObserver 0x6000018b8b40 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 1999000, callout = _beforeCACommitHandler (0x10dba9770), context = <CFRunLoopObserver context 0x7fd30f000210>}",
                         "<CFRunLoopObserver 0x6000018bc320 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2000000, callout = _ZN2CA11Transaction17observer_callbackEP19__CFRunLoopObservermPv (0x10fb7395a), context = <CFRunLoopObserver context 0x0>}",
                         "<CFRunLoopObserver 0x6000018b8aa0 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2001000, callout = _afterCACommitHandler (0x10dba97e9), context = <CFRunLoopObserver context 0x7fd30f000210>}",
                         "<CFRunLoopObserver 0x6000018b8960 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
	0 : <0x7fd30e000058>
)}}"
                         ),
            timers = (null),
            currently 561452758 (13219890425720) / soft deadline in: 1.84467309e+10 sec (@ -1) / hard deadline in: 1.84467309e+10 sec (@ -1)
        },

        3 : <CFRunLoopMode 0x6000012b84e0 [0x1098f4b48]>{name = GSEventReceiveRunLoopMode, port set = 0x2e03, queue = 0x6000007b8e00, source = 0x6000007b8f00 (not fired), timer port = 0x2f03,
            sources0 = <CFBasicHash 0x6000027f8000 [0x1098f4b48]>{type = mutable set, count = 1,
                entries =>
                0 : <CFRunLoopSource 0x600001cb8540 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 0, info = 0x0, callout = PurpleEventSignalCallback (0x111d4a188)}}
            }
            ,
            sources1 = <CFBasicHash 0x6000027f8750 [0x1098f4b48]>{type = mutable set, count = 1,
                entries =>
                0 : <CFRunLoopSource 0x600001cb00c0 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 1, info = 0x4b03, callout = PurpleEventCallback (0x111d4a194)}}
            }
            ,
            observers = (null),
            timers = (null),
            currently 561452758 (13219891417244) / soft deadline in: 1.84467309e+10 sec (@ -1) / hard deadline in: 1.84467309e+10 sec (@ -1)
        },

        4 : <CFRunLoopMode 0x6000012b8340 [0x1098f4b48]>{name = kCFRunLoopDefaultMode, port set = 0x1e07, queue = 0x6000007b8a80, source = 0x6000007b8b80 (not fired), timer port = 0x2b07,
            sources0 = <CFBasicHash 0x6000027f8060 [0x1098f4b48]>{type = mutable set, count = 4,
                entries =>
                0 : <CFRunLoopSource 0x600001cb8540 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 0, info = 0x0, callout = PurpleEventSignalCallback (0x111d4a188)}}
                1 : <CFRunLoopSource 0x600001cb8840 [0x1098f4b48]>{signalled = No, valid = Yes, order = -2, context = <CFRunLoopSource context>{version = 0, info = 0x6000027f8d20, callout = __handleHIDEventFetcherDrain (0x10dace4bc)}}
                2 : <CFRunLoopSource 0x600001cb8780 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 0, info = 0x600001eb8210, callout = __handleEventQueue (0x10dace4b0)}}
                3 : <CFRunLoopSource 0x600001cb4fc0 [0x1098f4b48]>{signalled = Yes, valid = Yes, order = 0, context = <CFRunLoopSource context>{version = 0, info = 0x600000db0600, callout = FBSSerialQueueRunLoopSourceHandler (0x114d2372b)}}
            }
            ,
            sources1 = <CFBasicHash 0x6000027f8030 [0x1098f4b48]>{type = mutable set, count = 3,
                entries =>
                0 : <CFRunLoopSource 0x600001cb0000 [0x1098f4b48]>{signalled = No, valid = Yes, order = -1, context = <CFRunLoopSource context>{version = 1, info = 0x4b03, callout = PurpleEventCallback (0x111d4a194)}}
                1 : <CFRunLoopSource 0x600001cb5b00 [0x1098f4b48]>{signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {port = 22787, subsystem = 0x10ea06bd8, context = 0x6000029aa4a0}}
                2 : <CFRunLoopSource 0x600001cb86c0 [0x1098f4b48]>{signalled = No, valid = Yes, order = 0, context = <CFRunLoopSource MIG Server> {port = 42251, subsystem = 0x10ea19db0, context = 0x0}}
            }
            ,
            observers = (
                         "<CFRunLoopObserver 0x6000018b8a00 [0x1098f4b48]>{valid = Yes, activities = 0x1, repeats = Yes, order = -2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
	0 : <0x7fd30e000058>
)}}",
                         "<CFRunLoopObserver 0x6000018b8c80 [0x1098f4b48]>{valid = Yes, activities = 0x20, repeats = Yes, order = 0, callout = _UIGestureRecognizerUpdateObserver (0x10dd721db), context = <CFRunLoopObserver context 0x6000002b8930>}",
                         "<CFRunLoopObserver 0x6000018b8b40 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 1999000, callout = _beforeCACommitHandler (0x10dba9770), context = <CFRunLoopObserver context 0x7fd30f000210>}",
                         "<CFRunLoopObserver 0x6000018bc320 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2000000, callout = _ZN2CA11Transaction17observer_callbackEP19__CFRunLoopObservermPv (0x10fb7395a), context = <CFRunLoopObserver context 0x0>}",
                         "<CFRunLoopObserver 0x6000018b8aa0 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2001000, callout = _afterCACommitHandler (0x10dba97e9), context = <CFRunLoopObserver context 0x7fd30f000210>}",
                         "<CFRunLoopObserver 0x6000018b8960 [0x1098f4b48]>{valid = Yes, activities = 0xa0, repeats = Yes, order = 2147483647, callout = _wrapRunLoopWithAutoreleasePoolHandler (0x10db79aa9), context = <CFArray 0x6000027f8e10 [0x1098f4b48]>{type = mutable-small, count = 1, values = (
	0 : <0x7fd30e000058>
)}}"
                         ),
            timers = <CFArray 0x600000db05a0 [0x1098f4b48]>{
                type = mutable-small,
                count = 1,
                values = (
                    0 : <CFRunLoopTimer 0x600001cb4600 [0x1098f4b48]>{valid = Yes, firing = No, interval = 0, tolerance = 0, next fire date = 561452759 (1.44256401 @ 13221335340408), callout = (Delayed Perform) UIApplication _accessibilitySetUpQuickSpeak (0x1086a447d / 0x10db3daab) (/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/Library/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot/System/Library/PrivateFrameworks/UIKitCore.framework/UIKitCore), context = <CFRunLoopTimer context 0x600003c929c0>}
                )

            },
            currently 561452758 (13219891455096) / soft deadline in: 1.44388529 sec (@ 13221335340408) / hard deadline in: 1.44388526 sec (@ 13221335340408)
        },

        5 : <CFRunLoopMode 0x6000012b41a0 [0x1098f4b48]>{name = kCFRunLoopCommonModes, port set = 0x460f, queue = 0x6000007b3500, source = 0x6000007b3600 (not fired), timer port = 0x390b,
            sources0 = (null),
            sources1 = (null),
            observers = (null),
            timers = (null),
            currently 561452758 (13219892811011) / soft deadline in: 1.84467309e+10 sec (@ -1) / hard deadline in: 1.84467309e+10 sec (@ -1)
        },

    }
```



# AutoreleasePool implementation

runtime源码
https://opensource.apple.com/tarballs/objc4/ 中的NSObject.mm文件

blog
http://ios.jobbole.com/92027/

需要手动使用
https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/mmAutoreleasePools.html#//apple_ref/doc/uid/20000047-1041876+%20+%22Autorelease%20Pool%20Blocks%20and%20Threads%22
