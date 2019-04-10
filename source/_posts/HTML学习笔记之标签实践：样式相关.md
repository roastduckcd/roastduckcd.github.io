---
title: HTML学习笔记之标签实践：样式相关
comments: true
toc: true
copyright: true
declare: true
categories:
  - HTML
tags:
  - html
date: 2019-04-10 23:22:18
top:
---

使用 HTML4.0，所有的格式化代码均可移出 HTML 文档，然后移入一个独立的样式表。
当浏览器读到一个样式表，它就会按照这个样式表来对文档进行格式化。有三种方式来插入样式表：
<!--more-->
###1. 外部样式表
当样式需要被应用到很多页面的时候，外部样式表将是理想的选择。使用外部样式表，你就可以通过更改一个文件(.css)来改变整个站点的外观,在需要该样式表的html文档中链接CSS文件。多个html文档共用这一个CSS文件，CSS文件中的样式会应用到所有链接到的html。
```html
<head>
    //定义资源引用。
    <link rel="stylesheet" type="text/css" href="mystyle.css">
</head>
```
###2. 内部样式表
当单个文件需要特别样式时，就可以使用内部样式表。你可以在 head 部分通过 `<style>` 标签定义内部样式表。样式会应用在整个html文档上。
```
<head>
    <style type="text/css">
        //修改背景色
		body {background-color:brown}
		//修改左边距
		p {margin-left: 20px}
    </style>
</head>
```
###3. 内联样式表
当特殊的样式需要应用到个别元素时，就可以使用内联样式。 使用内联样式的方法是在相关的标签中使用样式属性。样式属性可以包含任何 CSS 属性。样式仅针对个别html元素。
```html
<p>这里没应用内联样式表，使用的是内部样式表，有个对比</p>
<p style="color: yellow; margin-left: 40px">这里会应用上内联样式表，仅针对该元素有效^_^</p>
```
效果：
<p>这里没应用内联样式表，使用的是内部样式表，有个对比</p>
<p style="color: red; margin-left: 40px">这里会应用上内联样式表，仅针对该元素有效^_^</p>