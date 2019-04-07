---
title: HTML学习笔记之标签实践：图像相关
comments: true
toc: true
copyright: true
declare: true
categories:
  - HTML
tags:
  - html
date: 2019-04-08 00:14:53
top:
---

###1. 图像标签`<img>`
<img> 是空标签，它只包含属性，并且没有闭合标签。
<!--more-->
###2. 源属性`<src>`
源属性的值是图像的 URL 地址。

定义图像的语法是：
`<img src="url" />` URL 指存储图像的位置。
###3. 替换文本属性`Alt`
浏览器无法载入图像时,用来为图像定义一串预备的可替换的文本。替换文本属性的值是用户定义的。为了有助于更好的显示信息，应该总是使用 alt 属性。
```html
//http://img2.imgtn.bdimg.com/it/u=79356478,2468231218&fm=206&gp=0.jpg

<img src="0.jpg" alt="it's dog"/>
```
###4. 设置图片宽高
```html
<img src="http://img2.imgtn.bdimg.com/it/u=79356478,2468231218&fm=206&gp=0.jpg" alt="it's dog" width="300" height="500" />
```
###5. 添加背景图片
gif 和 jpg 文件均可用作HTML背景。如果图像小于页面，图像会进行重复（平铺形式）。
```
<body background="http://h.hiphotos.baidu.com/image/h%3D200/sign=cd65e7fa13d5ad6eb5f963eab1cb39a3/377adab44aed2e7394aa5a128f01a18b87d6fa49.jpg">
</body>
```
###6. 图片对齐方式`align（上下方向）`
top,middle,bottom;其中bottom对齐方式是默认的对齐方式
```
<p style="color:red"
    掺点文字
	<img src="http://img2.imgtn.bdimg.com/it/u=79356478,2468231218&fm=206&gp=0.jpg" alt="it's dog" width="300" height="500" align="bottom" />
	演示对齐方式:有bottom，top，middle
</p>
```
###7. 浮动图像`align（左右方向）`
使图片浮动至***段落`<p>`*** 的左边或右边。
```
<p style="color:red"
    掺点文字
	<img src="http://img2.imgtn.bdimg.com/it/u=79356478,2468231218&fm=206&gp=0.jpg" alt="it's dog" width="300" height="500" align="left" />
	演示方式:有left,right
</p>
```
###8. 图像区域映射`<map>`
带有可点击区域的图像映射.

* 属性：usemap
`标签`：`<map>``<area>`
`area`: shape为circle时，coords为（圆心x，圆心y，半径）;当shape为rect时，coords为（rect左上坐标点x，rect左上坐标点y，rect右下坐标点x，rect右下坐标点y，）
`shape`:default,rect,circ,poly
* area 元素永远嵌套在map元素内部。area元素可定义图像映射中的区域。
* img 元素中的 "usemap" 属性引用 map 元素中的 "id" 或 "name" 属性（根据浏览器），所以我们同时向 map 元素添加了 "id" 和 "name" 属性,适应不同浏览器。
```
<img src="http://img2.imgtn.bdimg.com/it/u=79356478,2468231218&fm=206&gp=0.jpg" alt="it's dog" width="300" height="500" align="bottom" usemap="#dog" alt="dogPic" />演示对齐方式:有bottom，top，middle

	<map name="dog" id="dog">
        <area shape="circle" coords="10,500,10" href="http://img2.imgtn.bdimg.com/it/u=1744644003,881536991&fm=21&gp=0.jpg" target="_blank" alt="girl" />
		<area shape="rect" coords="10,10,50,10" href="http://img5.imgtn.bdimg.com/it/u=2661661555,2642985590&fm=21&gp=0.jpg" target="_blank" alt="qqgirl" />
	</map>
```
### 提示
加载图片是需要时间的，建议是：慎用图片。