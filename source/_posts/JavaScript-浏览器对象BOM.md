---
title: JavaScript-浏览器对象BOM
comments: true
toc: true
copyright: true
declare: true
categories:
  - JavaScript
tags:
  - javascript
date: 2019-04-11 23:17:30
top:
---

BOM 使得js能与浏览器进行交互。
<!--more-->
#### window 对象
* 表示浏览器窗口
* 所有js的全局变量、函数及对象自动转为`window`的成员，可以直接使用。常见的`document`就是它的一个成员。
##### 窗口尺寸
* 浏览器的窗口尺寸仅指内容部分(除开上方工具栏和滚动条)。
```
// 不同浏览器尺寸获取方式有差异
// 以下针对 IE 5,6,7,8
①document.documentElement.clientWidth
②document.documentElement.clientHeight
③document.body.clientWidth
④document.body.clientHeight
// 以下针对 出去5678的IE, Chrome、Firefox、Opera 以及 Safari
⑤window.innerWidth
⑥window.innerHeight
```
`IE 5678`未测试，其他浏览器以上6中都可使用，但有区别：
①和⑤，②和⑥得到的宽高是相同的，③④宽高小于前面的。？？？
另外不同浏览器返回高度也是有区别的。
##### 部分其他方法
<ul>
<li>window.open() - 打开新窗口</li>
<li>window.close() - 关闭当前窗口</li>
<li>window.moveTo() - 移动当前窗口</li>
<li>window.resizeTo() - 调整当前窗口的尺寸</li>
</ul>
* 更多查阅http://www.w3school.com.cn/jsref/dom_obj_window.asp

#### Screen
* 包含用户屏幕信息
* `window.screen`, 但是可以省略window
##### 屏幕可用宽高
屏幕可用宽高都是以像素计
```
// 可用屏幕宽度
screen.availWidth
// 可用屏幕高度,
screen.availHeight
```
* 更多查阅http://www.w3school.com.cn/jsref/dom_obj_screen.asp

#### location
* 获取当前页面url，并重定向到新的页面
* `window.location`, 但是可以省略window
##### 常用属性及方法
<ul>
<li>location.hostname 返回 web 主机的域名</li>
<li>location.pathname 返回当前页面的路径和文件名</li>
<li>location.port 返回 web 主机的端口 （80 或 443）</li>
<li>location.protocol 返回所使用的 web 协议（http:// 或 https://）</li>
<li>location.href 属性返回当前页面的 URL</li>
<li>location.assign() 方法加载新的文档。</li>
</ul>
* 更多查阅http://www.w3school.com.cn/jsref/dom_obj_location.asp

#### history
* `window.history`, 但是可以省略window
##### 常用属性及方法
* `history.back()` - 与在浏览器点击后退按钮相同
* `history.forward()` - 与在浏览器中点击按钮向前相同
* 更多查阅http://www.w3school.com.cn/jsref/dom_obj_history.asp

#### navigator
* 包含浏览器的信息
* `window.navigator`, 但是可以省略window
* 来自 navigator 对象的信息具有误导性，不应该被用于检测浏览器版本。因为：

    1. navigator 数据可被浏览器使用者更改
    2. 浏览器无法报告晚于浏览器发布的新操作系统
* 检测浏览器
不同的浏览器有其特定支持的对象，可以使用该对象来检测浏览器。例如，由于只有 Opera 支持属性 "window.opera"，您可以据此识别出 Opera。需要专门去查找···
```
if (window.opera) {
    // 在opera浏览器进行的操作
    ...some action...
}
```
##### 常用属性及方法
* `navigator.appCodeName` 浏览器的代码名，几乎基于Netscape的浏览器都会返回`Mozela`, 只读属性
* `navigator.appName` 返回浏览器的名称，基于Netscape的浏览器返回`Netscape`。如果是IE浏览器，返回的是`Microsoft Internet Explorer`。只读属性
* `navigator.appVersion` 浏览器平台和版本信息。只读属性
* 更多查阅http://www.w3school.com.cn/jsref/dom_obj_navigator.asp