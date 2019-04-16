---
title: HTML学习笔记之标签实践：表单相关
comments: true
toc: true
copyright: true
declare: true
categories:
  - HTML
tags:
  - html
date: 2019-04-16 23:44:23
top:
---

静态网页：用户只能看
动态网页：用户可以输入
&nbsp;&nbsp;&nbsp;&nbsp;注意：不同浏览器对HTML元素有各自的默认外观样式。因此同一套代码，不同浏览器可能显示不同。
<!--more-->
#### 语法简介
    作用是为了搜集用户不同类型的输入信息。
```html
<form>
    form element
</form>
```

`form element`: 包含不同类型的`input`元素、复选框、单选按钮、提交按钮等。
#### 表单属性
`<form>`: 表单，有5个属性。只有放在该标签之内的表单元素才能实现和服务器的交互，否则表单元素仍有效，但是不能提交到服务器。
`name`: 表单名，不能包含特殊字符和空格
`action`: 指定表单数据提交到哪个地址处理，可以使相对或绝对路径，某个程序或者其他形式地址如 电子邮件形式
`method`: 指定表单数据使用哪一种HTTP提交方法，get或post
&nbsp;&nbsp;&nbsp;&nbsp;get: 默认值，表单数据被传送到指定的url，组合后的新url送到程序处理，
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;安全性较差，可以直接显示表单数据
&nbsp;&nbsp;&nbsp;&nbsp;post:表单数据包含在表单主体中，打包后送到程序处理，可以隐藏表单信息
`target`: 新窗口打开方式，同`<a>`的target属性，<a href="#target">点击跳转</a>
`enctype`: 设置表单的编码方式，一般不设置，使用默认方式
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`application/x-www.form-urlencoded`;
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;但如果是“上传文件”的表单必须使用`multipart/form-data`(MIME编码方式)
#### 表单对象
即`<form></form>`之中的标签
##### input标签
&nbsp;&nbsp;&nbsp;&nbsp;可以有结束标签`</input>`，也可以是自闭合标签`<input/>`
&nbsp;&nbsp;&nbsp;&nbsp;`type`: 表单类型
<table>
<caption>input标签的type属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<th>参考效果</th>
<thead>
<tbody>
<tr>
<td>text</td>
<td>单行文本框</td>
<td>
    <form>
        <input type="text"></input>
    </form>
</td>
</tr>

<tr>
<td>password</td>
<td>密码文本框,自动隐藏字符</td>
<td>
    <form>
        <input type="password"></input>
    </form>
</td>
</tr>

<tr>
<td>button</td>
<td>按钮</td>
<td>
    <form>
        <input type="button" value="按钮"></input>
    </form>
</td>
</tr>

<tr>
    <td>submit</td>
    <td>提交按钮</td>
    <td>
        <form>
            <input type="submit" value="提交">向表单处理程序提交表单,一般就是处理输入数据的脚本的服务器页面，在表单action属性中指定</input>
        </form>
    </td>
</tr>

<tr>
<td>reset</td>
<td>重置按钮</td>
<td>
    <form>
        <input type="reset"></input>
    </form>
</td>
</tr>

<tr>
<td>image</td>
<td>图片形式的提交按钮</td>
<td>
    <form>
        <input type="image"></input>
    </form>
</td>
</tr>

<tr>
<td>radio</td>
<td>单选框</td>
<td>
    <form>
        <input type="radio"></input>
    </form>
</td>
</tr>

<tr>
<td>checkbox</td>
<td>多选框</td>
<td>
    <form>
        <input type="checkbox"></input>
    </form>
</td>
</tr>

<tr>
<td>hidden</td>
<td>隐藏字段</td>
<td>
    <form>
        <input type="hidden"></input>
    </form>
</td>
</tr>

<tr>
<td>file</td>
<td>上传文本</td>
<td>
    <form>
        <input type="file"></input>
    </form>
</td>
</tr>
</tbody>
</table>
###### text文本框属性
<table>
<caption>text文本框属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>文本框默认文字</td>
</tr>
<tr>
<td>size</td>
<td>文本框长度，以字符为单位</td>
</tr>
<tr>
<td>maxlength</td>
<td>最多可以输入的字符数</td>
</tr>
</tbody>
</table>
###### password文本框属性
同text文本框属性，不同处仅在于输入时字符不可见。
###### 单选按钮属性
<table>
<caption>单选按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>name</td>
<td>单选按钮所在组名</td>
</tr>
<tr>
<td>value</td>
<td>单选按钮取值，后端数据需要</td>
</tr>
</tbody>
</table>
&nbsp;&nbsp;&nbsp;要注意同一组的单选按钮name值必须一样，否则会出现能多选的情况。但其实是name值不一样导致分组不一样。
###### 多选按钮属性
<table>
<caption>多选按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>多选按钮取值，后端数据需要</td>
</tr>
<tr>
<td>checked</td>
<td>表示默认情况已选中,只要有checked即默认被选中，无论其值为何(值应该为后端所需)</td>
</tr>
</tbody>
</table>
&nbsp;&nbsp;&nbsp;&nbsp;由于复选框没有name属性，所以没有文本。使用时必须加入`<label>`标签的`for`属性指向复选框的`id`属性**。(与javascript有关？？？？？)**
`<input type="checkbox" id="checkbox1" value="choose1" checked="checked"/><label for="checkbox1">CheckBox1</label>`
###### 普通按钮
<table>
<caption>按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>按钮文字</td>
</tr>
<tr>
<td>onclick</td>
<td>JavaScript脚本程序</td>
</tr>
</tbody>
</table>
&nbsp;&nbsp;&nbsp;&nbsp;普通按钮一般要配合JavaScript脚本进行表单实现
###### 提交按钮
&nbsp;&nbsp;&nbsp;&nbsp;可以实现提交表单到服务器，需要配合后端
<table>
<caption>提交按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>按钮文字</td>
</tr>
</tbody>
</table>
###### 重置按钮
&nbsp;&nbsp;&nbsp;&nbsp;清除用户在当前表单(重置按钮所在的form)的输入
<table>
<caption>重置按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>按钮文字</td>
</tr>
</tbody>
</table>
###### 文件
&nbsp;&nbsp;&nbsp;&nbsp;使用时，必须将`<form>`的`enctype`值改为`multipart/form-data`
###### 图片
&nbsp;&nbsp;&nbsp;&nbsp;既有按钮特点，也有图片特点，可以实现按钮的不同样式。但是图片传输数据量大，影响页面加载速度。所以一般能用css实现按钮样式的，不用图片实现。
<table>
<caption>图片按钮属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>src</td>
<td>图片资源地址，可以是相对或绝对路径</td>
</tr>
</tbody>
</table>
###### 隐藏
&nbsp;&nbsp;&nbsp;&nbsp;要提交后端处理的数据，但是不显示在浏览器中被用户看到。很少用
##### textarea多行文本框
&nbsp;&nbsp;&nbsp;&nbsp;不同于单行文本框，多行使用标签`<textarea>`
<table>
<caption>多行文本框属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>rows</td>
<td>行数</td>
</tr>
<tr>
<td>cols</td>
<td>列数</td>
</tr>
</tbody>
</table>
##### 下拉列表
&nbsp;&nbsp;&nbsp;&nbsp;标签`<select>`,具体列表项用表现`<option>`
<table>
<caption>select属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>multiple</td>
<td>可选属性。只有一个值"multiple"，设置该值时才是多个下拉项。不设置只有一项</td>
</tr>
<tr>
<td>size</td>
<td>列表展开后可以显示的列表项数目,其余通过下拉按钮</td>
</tr>
<tr>
<td colspan="2">使用multiple下拉列表以滑动框显示，不使用以一个按钮点击后弹出下拉框<br/>如果有size可以不使用multiple。</td>
</tr>
</tbody>
</table>


<table>
<caption>option属性</caption>
<thead>
<th>属性值</th>
<th>语义</th>
<thead>
<tbody>
<tr>
<td>value</td>
<td>选项值，主要给JavaScript或后端使用</td>
</tr>
<tr>
<td>selected</td>
<td>是否选中。有该属性时即选中了，无论是否设置值。无即未选中。</td>
</tr>
</tbody>
</table>
##### button标签
&nbsp;&nbsp;&nbsp;&nbsp;与`<input>`的`button`属性值不同，标签`<input>`中的文字不能在`button`中显示。而标签`<button>`内的文本则可以直接显示在`button`中。
&nbsp;&nbsp;&nbsp;&nbsp;但是表单的数据是要提交到服务器的，如果使用`<button>`标签不能实现提交功能。因此基本使用`<input>`标签。
&nbsp;&nbsp;&nbsp;&nbsp;注意一个是`button`属性值，一个是`<button>`标签。实际开发中常使用css实现按钮。
