---
title: JavaScript入门
comments: true
toc: true
copyright: true
declare: true
categories:
  - JavaScript
tags:
  - javascript
date: 2019-04-04 22:52:18
top:
---

### 简介
* 　　js是一门脚本语言，可以嵌入html中，最后由浏览器解释并执行位于 `<script>` 和 `</script>`之间的 JavaScript。浏览器执行时按顺序逐行执行，没有传统编程编译步骤。

<!--more-->

* 　　js 脚本必须放在`<script>`html标签中，该标签可以存在于`<head>` `<body>`中，实际测试时貌似可以放在当前html页的任何位置。通常的做法是把函数放入`<head>` 部分中，或者放在页面底部。这样就可以把它们安置到同一处位置，不会干扰页面的内容。
　　也可以将脚本放在外部文件中，文件扩展名为`.js`。只需要把`<script>`的`src`属性设置js文件的路径，然后直接使用即可。注意外部文件的js不使用`<script>`标签。
* 　　以前js脚本需要在`<script>` 标签中使用 `type="text/javascript"`。但是现在浏览器都默认js脚本语言。因此可以不用声明了。
### 语法
#### 变量
* js 中的一切皆对象。声明一个变量即创建了一个对象。
* 关键字 var, 必须以`字母,$,_`三者之一开头，但后两者不推荐
* 如果只是声明变量，必须使用var。如果声明的同时进行初始化，则可以省略var
* js 是动态类型语言，相同变量可以用作不同类型
* js 也可以声明显式类型，使用关键字`new`
* 使用`typeof 变量`可以查看变量类型。这是一个一元操作符
但是采用引用类型存储值会出现一个问题，无论引用的是什么类型的对象，它都返回 "object"。
此时可以使用`要判断的变量 instanceof 目标类型`。所以这是一个二元操作符。
用于判断某个实例是否是某个类型，
```JavaScript
var a;  // 该变量的值为undefined
var x=2;
y = 4.0;
var str = "hello";
// 连续声明
var m, n
p, q;
// 重新声明变量但不赋值，变量仍保留之前的值
var str;  // str 的值仍然是hello
// 动态类型
var str = 3
// 显式声明类型
var str = new String
var isOK = new Boolean
var arr = new Array
```
#### 对象
　　js 对象由`{}`分隔，属性以键值对形式存在。其实和其他语言中说的字典类同，因为js中的对象都是以键值对设计的，所以直接就叫对象了。
　　甚至可以向已存在的对象添加属性和方法。
```
// 声明
var object = new Object
// 赋值
object = {
    "name": "song",
    "age": 18
}
// 声明的同时赋值
person = {"name": "lala", "age": 18}
// 根据key取值的两种方式
name = person.name
// 访问对象的方法
name.toUpperCase() // 将name的值转为大写
```
* 使用构造器创建对象
```
<script>
    function person(firstname,lastname,age,eyecolor)
    {
        // 添加对象的属性
        this.firstname=firstname;
        this.lastname=lastname;
        this.age=age;
        this.eyecolor=eyecolor;
        // 添加对象的方法
        this.changeName = changeName
        // 函数定义在构造器函数内部
        function changeName(name) {
            this.firstname="lalal"
        }
    }
    // 创建对象
    person = new person("song", "yang", 33, "yellow")
    // 使用点语法可以访问或修改对象属性
    person.age = 28
</script>
```
##### 字符串 String
* js 中的字符串可以用单引号或双引号。并且字符串中也可以使用，但是不能互相匹配。也就单引号字符串中不能再用单引号，双引号中不能再用双引号
* 字符串可以直接使用 `+` 拼接
* 如果把数字与字符串相加，结果将成为字符串。
* JavaScript 的字符串是不可变的（immutable），String 类定义的方法都不能改变字符串的内容。像 String.toUpperCase() 这样的方法，返回的是全新的字符串，而不是修改原始字符串。
* 更多属性和方法查阅http://www.w3school.com.cn/jsref/jsref_obj_string.asp
```
// 声明
var str = new String
// 引号问题
var str = "hello, 'baby'"
var str = 'hello, "boy"'
// 拼接
var name = "!"
str = str + name // str 的值变为hello, "boy"!
var a = 5 + "5"  // a 的值为 55 字符串类型
```
##### 数字类型 Number
* js 中只有一种数字类型，不区分整型和实型
* 最多64位数(8字节)的浮点数
* 整数最多15位，超过15的将以小数*指数的形式出现，小数最大17位(连同整数位一起算)。如果小数位超出，多余部分会被截掉，同时该数最后一位一定是5。浮点数的运算不都是十分精确的
* js中规定 以0开始的数为8进制，以0x开始得数为16进制。所以不能随意在数字前面加0。
```
// 声明
var x = new Number
// 一样的类型
var x = 4
var x = 4.0
// 整数.小数
var a = 6.28379486281768273648725348565764
document.write(a + "<br/>")  // 6.2837948628176825
var y = 3.0 + 0.1
document.write(y + "<br/>")  // 0.30000000000000004
```
<table>
  <tr>
    <th style="width:25%">属性</th>
    <th>描述</th>
  </tr>
  <tr>
    <td>MAX_VALUE</td>
    <td>可表示的最大的数。</td>
  </tr>
  <tr>
    <td>MIN_VALUE</td>
    <td>可表示的最小的数。</td>
  </tr>
  <tr>
    <td>NaN</td>
    <td>非数字值。</td>
  </tr>
  <tr>
    <td>NEGATIVE_INFINITY</td>
    <td>负无穷大，溢出时返回该值。</td>
    </tr>
  <tr>
    <td>POSITIVE_INFINITY</td>
    <td>正无穷大，溢出时返回该值。</td>
  </tr>
</table>

<table>
  <tr>
    <th style="width:25%">方法</th>
    <th>描述</th>
  </tr>
  <tr>
    <td>toString</td>
    <td>把数字转换为字符串，使用指定的基数。</td>
  </tr>
  <tr>
    <td>toLocaleString</td>
    <td>把数字转换为字符串，使用本地数字格式顺序。</td>
  </tr>
  <tr>
    <td>toFixed(小数点后要展示的位数)</td>
    <td>把数字转换为字符串，结果的小数点后有指定位数的数字。</td>
  </tr>
  <tr>
    <td>toExponential</td>
    <td>把对象的值转换为指数计数法。</td>
  </tr>
  <tr>
    <td>toPrecision</td>
    <td>把数字格式化为指定的长度。</td>
  </tr>
  <tr>
    <td>valueOf</td>
    <td>返回一个 Number 对象的基本数字值。</td>
  </tr>
</table>
##### 算数对象 Math
http://www.w3school.com.cn/jsref/jsref_obj_math.asp
##### 布尔 Boolean
* 如果逻辑对象无初始值或者其值为 0、-0、null、""、false、undefined 或者 NaN，那么对象的值为 false。否则，其值为 true（即使当自变量为字符串 "false" 时）！
* http://www.w3school.com.cn/jsref/jsref_obj_boolean.asp


```
var isRight = new Boolean
isRight = true
```
##### 数组 Array
http://www.w3school.com.cn/jsref/jsref_obj_array.asp
```
// 声明
var array = new Array
// 赋值
array[0] = "boy"
// 声明的同时赋值
var array = new Array(1, 2, 3)
// 也可以使用 []
var array = [2, 3, 4]
// 根据索引取值
array[1]
```
##### 日期 Date
http://www.w3school.com.cn/jsref/jsref_obj_date.asp
##### 正则表达式对象 RegExp
http://www.w3school.com.cn/js/js_obj_regexp.asp
http://www.w3school.com.cn/jsref/jsref_obj_regexp.asp
##### 类型转换
* 所有对象都可转为字符串(包括字符串本身), 调用`toSting()`方法
* 转换成数字


```
// parseInt("原对象", 进制)
// 从左到右转换数字，遇到第一个非整数字结束
parseInt("1234.5red67")  // 1234,整数，所以小数点也不算
parseInt("10", 8) // 8，后面代表8进制
parseInt("010df")   // 8 如果数字以0开头，默认为8进制(0x则16进制)
parseInt("010df", 10) // 10 指定进制后按10进制
```
```
// parseFloat("原对象")
// 对于该函数，字符串必须是10进制形式的，所以没有第二个参数
// 如果有以0开头的数字，直接忽略，不会默认8进制了
// 只认第一个小数点
parseFlaot("0472.24.98sx3") // 472.24
```
* 强制类型转换
    * Boolean(待转换值)
该值是空字符串、数字 0、undefined 或 null，它将返回 false。
    * Number(待转换值)
    * String(待转换值)


#### undefined 和 null ？？？？
* undefined 指变量不含有值
* null 清空变量

#### 运算符
* 算数运算符，三目运算符，逻辑运算符同传统编程语言
* 比较运算符除了`等于`其他也同传统编程语言


```
// 等于 == 不等于 != 
if(5=="5") document.write("居然能等") // 还就等了
// 全等于 === 非全等于 !=== 主要用于判断对象
// 此处判断了值和类型
if(5==="5") document.write("居然能等") // 这就不行了
```
##### 一元运算符(部分)
* `delete 自定义属性或方法名` : 删除**自定义**的属性和方法
* `void(函数调用)` : 强制忽略函数的返回值
* `+` : 除了加法，还能降字符串转换为数字，字符串内容只能是10进制或16进制形式
* `-` : 除了剪发，也能转换数字并求负。


#### 循环
* `for` `while` `do-while` 同传统编程语言
* `for in` 遍历**对象**属性, 需要是集合对象


```
// 注意得到的x是对象的key
for (x in object) {
    // 执行操作
    value = object[x]
}
// 如果是数组, 得到的x是索引
ll = [1,2,3,4]
for (x in ll) {
    document.write(x + "<br/>") x = 0 1 2 3
}
```
#### 代码块标签 label 结合 break
* 可以理解为一段代码块的别名
* 必须有 `{}` 且break必须在内中，表示break跳出该代码块
* `break` 和 `continue` 的区别
    * continue 语句（带有或不带标签引用）只能用在循环中。
    * break 语句（不带标签引用），只能用在循环或 switch 中。
    * 通过标签引用，break 语句可用于跳出任何 JavaScript 代码块：

    
```
cars=["BMW","Volvo","Saab","Ford"];
list: {
        document.write(cars[0] + "<br>"); 
        document.write(cars[1] + "<br>"); 
        document.write(cars[2] + "<br>"); 
        break list;
        // 后面的不会执行
        document.write(cars[3] + "<br>"); 
        document.write(cars[4] + "<br>"); 
        document.write(cars[5] + "<br>"); 
    }
```

#### 函数
* 关键字`function`
* 作用域
    * 全局变量：在函数外声明的变量，网页上的所有脚本和函数都能访问它。页面关闭以后被删除。   
        * 如果是未声明但直接赋值的变量，将自动作为全局变量 
    * 局部变量：函数内部声明的变量，只能在函数内部访问，函数运行以后被删除。

    
```
// 全局变量
var name;
function funcName(arg1, arg2...) {
    // 要执行的语句
    // 局部变量
    var age
    // 自动作为全局变量
    sex = "male"
    return ret_value // 返回值可有可无，视函数需要
}
```
* 函数中默认有一个`arguments`对象按顺序接收所有参数。使用时可以按照数组的方式使用。
* js 中不会检查形参和实参的个数。实参少于形参，未赋值的形参自动置为`undefined`。实参多余形参，函数自动忽略多余的参数。利用这点，我们可以模拟实现函数的重载。


```
function doAdd() {
  if(arguments.length == 1) {
    alert(arguments[0] + 5);
  } else if(arguments.length == 2) {
    alert(arguments[0] + arguments[1]);
  }
}

doAdd(2)
doAdd(2, 3)
```
* 函数的 `length`属性
返回的是函数定义时声明的参数个数
* 函数的 `toString()` `valueof()`方法
返回的都是函数的源代码，以字符串形式显示。
？？？* 闭包：使用时才会去检查变量的值的函数。简单说就是函数使用的是外部变量。
函数内部的变量在脚本加载到内存时就确定好值，外部的变量使用时才会确定。？？？？？

```
var iBaseNum = 10;

function addNum(iNum1, iNum2) {
  function doAdd() {
    return iNum1 + iNum2 + iBaseNum;
  }
  return doAdd();
}
```
* 对于addNum,调用它时，才会去检查iBaseNum的值。
* 对于doAdd，调用它时，才会去检查3个参数的值

#### 异常捕获
* `try` 和 `catch` 成对出现
* 配合 `throw` 可以控制程序流，并生成自定义错误信息。`throw` 出的可以使 JavaScript 字符串、数字、逻辑值或对象。这些信息将被 `catch`语句捕捉到，然后进行处理。
* `throw` 可以单独存在，但是没有`catch`就抓不到`throw`的信息，当然是能被浏览器捕捉到的，会在控制台输出。`throw`之后的语句不会再执行。


```
try {
  // 定义在执行时进行错误测试的代码块。
  // 不一定是if，根据需求来
  if(...) throw "错了" 
}
catch(err) {
  //定义当 try 代码块发生错误时，所执行的代码块。处理错误
}
```
```
try {
    // 错误的allert函数，执行时被catch住，error就是原因
    if(5!=8) allert("啦") //throw "开玩笑, 当然了"
} catch(error) {
    document.write(error)
}
```

### 使用
* 语句使用分号结束，但是分号是可有可无的
* js 对大小写敏感

#### js 表单验证
* JavaScript 可用来在数据被送往服务器前对 HTML 表单中的这些输入数据进行验证。


```
<!-- .html -->
<!-- html 表单元素中 -->
<!-- 表单的 onsubmit 中返回函数，this代表当前标签即表单元素 -->
<form action="submitpage.htm"onsubmit="return validate_form(this);" method="post">
    表单元素···
</form>
```
```
// .js

/*
    检查输入的数据是否符合电子邮件地址的基本语法。
 */
// 传入表单
function validate_form(thisform)
{
    // 使用表单
    with (thisform)
    {
    if (validate_email(email,"Not a valid e-mail address!")==false)
      {email.focus();return false}
    }
}

/*
    输入的数据必须包含 @ 符号和点号(.)。同时，@ 不可以是邮件地址的首字符，
    并且 @ 之后需有至少一个点号
 */
// 判断指定标签是否满足要求
// field 是指定标签的name属性
// alerttxt 是元素不满足要求时的提示信息
function validate_email(field,alerttxt)
{
    // 使用表单中的元素
    with (field)
    {
    // value 即元素的内容
    apos=value.indexOf("@")
    dotpos=value.lastIndexOf(".")
    if (apos<1||dotpos-apos<2) 
      {alert(alerttxt);return false}
    else {return true}
    }
}
```