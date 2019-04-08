---
title: HTML学习笔记之标签实践：链接相关
comments: true
toc: true
copyright: true
declare: true
categories:
  - HTML
tags:
  - html
date: 2019-04-08 23:18:32
top:
---

HTML 使用超级链接与网络上的另一个文档相连，几乎可以在所有的网页中找到链接。点击链接可以从一张页面跳转到另一张页面。
<!--more-->
###1. HTML 超链接（链接）`<a>`
超链接可以是一个字，一个词，或者一组词，也可以是一幅图像，您可以点击这些内容来跳转到新的文档或者当前文档中的某个部分。
当您把鼠标指针移动到网页中的某个链接上时，箭头会变为一只小手。
两种使用 <a> 标签的方式：

* 通过使用 href 属性 - 创建指向另一个文档的链接
* 通过使用 name 属性 - 创建文档内的书签
###2. HTML 链接 - href 属性
`<a href="http://www.baidu.com">这是百度的链接文本</a>`

* 属性***href*** 指定链接地址，开始和结束标签之间的文本即链接表象。"链接文本" 不必一定是文本。图片或其他HTML元素都可以成为链接。
* `http://`必不可少
###3. HTML 链接 - name 属性
name 属性规定锚（anchor）的名称。使用 name 属性创建 HTML 页面中的书签。书签对读者是不可见的。当使用命名锚（named anchors）时，我们可以创建直接跳至该命名锚（比如页面中某个小节）的链接，这样使用者就无需不停地滚动页面来寻找他们需要的信息了。
```
<p>接下来使用name属性创建书签</p><br />
		<!-- 先对锚进行命名（创建书签) -->
		<a name="tips">小贴士：使用了name属性</a><br />
		<!-- 在同一个文档中创建指向该锚的链接 -->
		<a href="#tips">指向tips锚的链接</a>
		<!-- 也可在其他页面中创建指向该锚的链接 -->
		<!-- 地址是当前锚所在页面的地址,其他页面使用会跳转到当前页面 -->
		<!-- <a href="http://www.w3school.com.cn/html/html_links.asp#tips">有用的提示</a> -->
```
###4. HTML 链接 - target 属性
定义被链接的文档在何处显示
_blank
_parent
_self
_top
```
<a href="http://www.baidu.com" target="_blank">
		有target属性的超链接,_blank表示在新窗口打开链接
</a><br />
```
###5. 注意
* 请始终将正斜杠添加到子文件夹。假如这样书写链接：href="http://www.w3school.com.cn/html"，就会向服务器产生两次 HTTP 请求。这是因为服务器会添加正斜杠到这个地址，然后创建一个新的请求，就像这样：href="http://www.w3school.com.cn/html/"。
* 链接用文件夹下的html文档这样书写：href="htmlStudy4httpAddress" target="_blank"(target是为了方便看出效果）
* 命名锚经常用于在大型文档开始位置上创建目录。可以为每个章节赋予一个命名锚，然后把链接到这些锚的链接放到文档的上部。
* 假如浏览器找不到已定义的命名锚，那么就会定位到文档的顶端。不会有错误发生。
###6. 一些实例
```
<a href="htmlStudy4httpAddress" target="_blank">
	还可以创建链接本页面的链接。
</a>
```
```
还可以用图片来作链接
	<a href="http://www.baidu.com">
	<img src="http://image6.huangye88.com/2013/03/28/2a569ac6dbab1216.jpg">
</a>
```
```
//跳转本页面元素
<a 
    href="#C4">查看 Chapter 4。
</a>
<h2>
    <a name="C4">Chapter 4</a>
</h2>
<p>This chapter explains ba bla bla</p>
```
```
//跳出框架
//有时页面被锁定在浏览器某块区域，借此跳转成一个新页面
<a href="htmlStudy4httpAddress" target="_top">
	跳出框架，什么鬼···
</a>
```
```
//在安装邮件客户端程序后才能工作。
<p>还可以发邮件
    //注意大坑：使用 %20 注意是%20 不是 20% 来替换单词之间的空格，这样浏览器就可以正确地显示文本
	<a href="mailto:roart_duck@163.com?subject=hello%20kitty">发送邮件
	</a>简单型
</p>
<p>发邮件带抄送带内容
	<a href="mailto:roart_duck@163.com?cc=sjy457346652@microsoft.com&someone@github.com&subject=发邮件咯&body=千万注意空格写法%20不是百分之20（只能这样写，不然用不了）写错调不了客户端；千万注意空格写法%20不是百分之20（只能这样写，不然用不了）写错调不了客户端；千万注意空格写法%20不是百分之20（只能这样写，不然用不了）写错调不了客户端。重要的事情说三遍">发送邮件
	</a>
</p>
```