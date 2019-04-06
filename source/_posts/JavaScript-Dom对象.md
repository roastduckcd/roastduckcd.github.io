---
title: JavaScript-Dom对象
comments: true
toc: true
copyright: true
declare: true
categories:
  - JavaScript
tags:
  - javascript
date: 2019-04-06 21:27:39
top:
---

### 简介
* 一个页面就是一个DOM(文档对象模型)。
* 树形结构展示(图片来`w3school`)
<!--more-->
![html DOM 树结构][1]
通过这个模型js能可改变html页面的标签及其属性、样式等一切元素。
### 使用
#### 获取元素
* 可以通过元素的`id` `class` `标签名`来获取标签元素
* 通过`id` 可以获取指定的某个元素, 后两者获取到的是符合条件的列表
* `getElementById`是`document`的方法
* `getElementsByTagName` 和 `getElementsByClassName`是标签元素的方法，使用`document`调用是获取不到的
* 获取自身元素`this`
```
// 通过id
document.getElementById("")

// 通过标签名
// 获取所有<p>
div = document.getElementById("my")
tags = div.getElementsByTagName("p")
// 不要使用forin，实际看到的集合中元素不只2个，集合中不知多了些什么鬼
for (var i = 0; i < tags.length; i++) {
    document.write(tags[i].innerHTML + "<br/>")
}

// 通过类名
// 注意：通过类名查找 HTML 元素在 IE 5,6,7,8 中无效。
pp = div.getElementsByClassName("para1")
document.write(pp[0].innerHTML)

// 使用this
<h1 onclick="this.innerHTML='谢谢!'">请点击该文本</h1>
// 或者使用将this作为函数参数使用
<script>
    function changetext(id)
    { id.innerHTML="谢谢!"; }
</script>
<h1 onclick="changetext(this)">请点击该文本</h1>
```
#### 输出html语句
```
document.write("html语句")
```
* 绝不要使用在文档加载之后使用 document.write()。这会覆盖该文档。
#### html元素对象的属性
* 使用`innerHTML`可以改变html元素之间的内容，该内容不仅指text，如果中间有其他html元素，同样被替换掉。
* 使用对应html元素的属性可以进行修改
* DOM 对象 style属性查询http://www.w3school.com.cn/jsref/dom_obj_style.asp
```
// 改变html内容
p = document.getElementById("para2")
p.innerHTML = "改变的内容"
// 改变html属性, 这里改变了颜色
style = document.getElementById("para2")
style.style.color = "#ff0000"
```
#### html事件
* 更多事件查询http://www.w3school.com.cn/jsref/dom_obj_event.asp
##### 点击事件 onclick
* 该事件不仅button有？？？其他标签貌似也可以使用
```
// 如何使用
// 1. 可以直接使用标签的事件属性：使用button的onclick事件
<button type="button" onclick="document.getElementById('para2').style.color='blue'">变色</button>

// 2. 可以使用DOM的事件属性
<script>
// 获取当前时间
document.getElementById("myBtn").onclick=function(){document.getElementById("demo").innerHTML=Date();};
</script>
```
##### 是否加载事件 onload 、 onunload 
* onload 和 onunload 事件会在用户进入或离开页面时被触发。
* onload 事件可用于检测访问者的浏览器类型和浏览器版本，并基于这些信息来加载网页的正确版本。
* 貌似只能用于`<body>`中
```
<body onload="checkCookies()">

<script>
// onload 和 onunload 事件可用于处理 cookie。
function checkCookies()
{
if (navigator.cookieEnabled==true)
	{
	alert("已启用 cookie")
	}
else
	{
	alert("未启用 cookie")
	}
}
</script>
</body>
```
##### 输入框改变 onchange onfocus
* `onchange`: 点击其他地方是光标不再输入框时(失去焦点)
* `onfocus`: 点击输入框出现光标(获得焦点)
```
// 输入框不是焦点时，将当中小写字符转为大写
<input type="text" name="test" id="my_test" onchange="changeText(this)">
<script>
function changeText(id) {
    id.value = id.value.toUpperCase();
    // document.getElementById("my_test").value.toUpperCase()
}
</script>
```
##### 鼠标事件 onmouseover、onmouseout
* `onmouseover`: 鼠标移到当前标签上
* `onmouseout`: 鼠标从当前标签上移走
* `onmousedown`: 鼠标按下
* `onmousedown`: 鼠标弹起
* `onclick`: 点击
```
<h3 onmouseover="over(this)" onmouseout="out(this)">这是一个3级标题来测试鼠标事件</h3>

<script>
function over(id) {
    id.innerHTML = "移到这就变了"
}
function out(id) {
    id.innerHTML = "移起走就还原了"
}
</script>
```
#### 利用js创建、追加或删除html元素(DOM 节点)
##### 添加
* 首先创建新元素
* 使用点语法设置元素的属性
* 获取新元素的父元素(即将成为)
* 父元素`appendChild(to_append)`
##### 删除
* 获取要删除的元素
* 获取父元素
* 父元素`removeChild(to_delete)`
```
<button type="button" onclick="appendTag()">添加html标签</button>
<button type="button" onclick="deleteTag()">删除html标签</button>

<script>
function appendTag() {
    // 首先创建新的节点
    var p = document.createElement("p");
    // 创建新的内容节点
    var text = document.createTextNode("这是js动态添加的段落");
    p.appendChild(text);
    // 设置属性
    p.setAttribute("id", "newPara")
    // 设置文本也可通过该属性
    p.innerHTML = "通过innerHTML添加text"


    // 先要获取到要添加到的元素
    var div = document.getElementById("my");
    // 该元素追加
    div.appendChild(p)
}

function deleteTag() {
    // 删除时需要先获取父节点，通过父节点调用删除
    var div = document.getElementById("my")
    // 获取要删除的子节点
    var newPara = document.getElementById("newPara")
    div.removeChild(newPara)
}
</script>
```

  [1]: http://www.w3school.com.cn/i/ct_htmltree.gif