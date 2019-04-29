---
title: Mac开发时遇到的TIP
date: 2019-04-29 23:49:40
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- macOS
tags:
- NSButton
---


### macOS 使用右手坐标系，z 轴由屏幕指向我们，坐标原点在左下角。

### NSButton
* 修改背景色
    * 使用 layer 的 CGColor
    * 使用纯色图片
    * 使用 NSButtonCell 的背景色。NSButton 继承自 NScontrol，主要负责事件响应，与之配套的 NSButtonCell 负责界面显示。NSButtonCell 是 NSbutton 的属性。但是如果直接 `button.cell`是不能设置 cell 背景色的。原因在于 cell 的声明`@property (nullable, strong) __kindof NSCell *cell;`。也就是说 cell 可以是 NSCell 及其子类。但是呢，NSCell 本身是没有背景色属性的，我们需要先设置好 NSButtonCell，再赋值给 NSButton 的 cell 属性即可。继承关系：`NSButtonCell < NSActionCell < NSCell`。

    ```
    // 使用 layer
    button.wantsLayer = YES;
    button.layer.backgroundColor = [NSColor redColor].CGColor;
    
    // 使用图片
    [button setImage:[[NSBundle mainBundle] imageForResource:@"240.png"]];
    aliOSSButton.imagePosition = NSImageBelow;
    
    // 使用 NSButtonCell
    NSButtonCell *cell = [[NSButtonCell alloc] initTextCell:@"lksjdf"];
    cell.backgroundColor = [NSColor lightGrayColor];
    button.cell = cell;
    // NSButton 有部分属性和 cell 可以互相覆盖。推荐这些视图设置都在 NSButtonCell 上完成。
    // button.title = @"anniu";
    ```
