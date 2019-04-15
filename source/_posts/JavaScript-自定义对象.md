---
title: JavaScript-自定义对象
comments: true
toc: true
copyright: true
declare: true
categories:
  - JavaScript
tags:
  - javascript
date: 2019-04-16 00:12:10
top:
---

### 创建自定义对象
这里直接介绍推荐的`构造函数和原型混合`方式创建。简单来说就是使用构造函数方式定义自定义对象的属性，使用原型方式定义自定义对象的方法。
<!--more-->
```
// 语法
function ClassName(property1, arg2···) {
    // 使用构造函数定义属性
    // 通常将对象属性和构造函数的形参声明成一样的名字
    this.property1 = property1
    // 当然不一样也可以
    this.property2 = arg2
    ···
}
// 使用原型方式定义方法
// 在外部定义方法，prototype是js对象的固定属性
ClassName.prototype.functionName = function() {
    // some statement
}
```
```
function Car(sColor,iDoors,iMpg) {
    // 在构造函数内定义属性
    this.color = sColor;
    this.doors = iDoors;
    this.mpg = iMpg;
    this.drivers = new Array("Mike","John");
}
// 在外部定义方法，prototype是js对象的固定属性
Car.prototype.showColor = function() {
  alert(this.color);
};
// 创建对象实例时不要忘了关键字 new
var oCar1 = new Car("red",4,23);
var oCar2 = new Car("blue",3,25);
```
* `prototype` 对象（属性:别忘了一切皆对象lol）是个模板，要实例化的对象都以这个模板为基础。总而言之，`prototype` 对象的任何属性和方法都被传递给那个类的所有实例。
* 子类的所有属性和方法都必须出现在 `prototype` 属性被赋值后(必须是`prototype.属性或方法`)，因为在它之前赋值的所有方法都会被删除。为什么？因为 `prototype` 属性被`替换成了新对象`，添加了新方法的原始对象将被销毁。(可以理解为`prototype`是一个指向对象的指针)
这里只讲了推荐的创建方式，关于`构造函数`和`原型方式`及更多其他创建方式请查阅下面的连接。
http://www.w3school.com.cn/js/pro_js_object_defining.asp
### 修改自定义对象
#### 为已有类添加新方法
* 可以用 `prototype` 属性为任何已有的类定义新方法。
```
// 为上面的Car添加一个时速的方法
Car.prototype.showSpeed = function(speed) {
    alert(speed)
}
```
#### 重命名已有方法
* 其实就是给已有方法加上自定义的壳
```
// 比如 数组 的push方法改个名
Array.prototype.enqueue = function(vItem) {
    // 取个新名字再调用旧方法
    this.push(vItem);
};
```
#### 为所有本地对象添加一个公共方法
* 所有本地对象都是Object对象的子类，所以就是给Object添加一个新方法
```
Object.prototype.showValue = function () {
  alert(this.valueOf());
};
```
#### 覆盖原有方法
* 使用原方法的名字，但是赋值新的函数实现即可
```
Function.prototype.toString = function() {
  return "Function code hidden";
}
```

******
改进：call和apply的介绍放在继承方式之前
******

### 继承
* 本地类(js 内建对象如`Number`,`Array`等)和宿主类(浏览器提供的预定义对象如常用的`document`等)不能作为基类，这样可以防止公用访问编译过的浏览器级的代码，因为这些代码可以被用于恶意攻击。
* 所有属性和方法都是公用的。一般以`_开头的属性`规则表示为私有属性。
* 因为构造函数只是一个函数，所以可使 ClassA 构造函数成为 ClassB 的方法，然后调用它。ClassB 就会收到 ClassA 的构造函数中定义的属性和方法。
* 此处对象的创建使用的是`构造函数`的方式
```
function ClassA(sColor) {
    this.color = sColor;
    this.sayColor = function () {
        alert(this.color);
    };
}

function ClassB(sColor, sName) {
    // 这个原理是把 ClassA 作为常规函数来建立继承机制，而不是作为构造函数。
    this.newMethod = ClassA;
    this.newMethod(sColor);
    // 删除了对 ClassA 的引用，这样以后就不能再调用它。
    // 所有新属性和新方法都必须在删除了新方法的代码行后定义。否则，可能会覆盖超类的相关属性和方法
    delete this.newMethod;
    
    // 多重继承: 添加其他对象的方法
    // 问题：如果ClassC中有方法或属性和ClassA中的相同，会覆盖掉ClassA中的。
    // 因为ClassC中的最后加载
    this.newHi = ClassC;
    this.newHi(bHi);
    delete this.newHi;


    this.name = sName;
    this.sayName = function () {
        alert(this.name);
    };
}
```
#### Function 对象的 call 方法
* 之前提到为所有对象添加公共方法，实际上只要为Object对象添加方法即可，因为其他对象继承自Object。
* 要实现上述目的还有另一种方式，使用Function对象的call方法。一般我们都是定义对象的函数，然后对象调用函数。现在我们能定义一个公共函数，然后将任意对象传给该函数，内部使用对象，实现需求。这样就实现了为所有对象添加方法的效果。
```
/*
-------------- 两种方式实现为所有对象添加公共方法
 */
// 方式一: 为Object添加方法
Object.prototype.everyObjectSayHi = function() {
    alert(this + " says hi!" + this.length);
}

var num = 200;
num.everyObjectSayHi();
var str = "hello";
str.everyObjectSayHi();
```
```
// 方式二: 将对象作为参数传递给函数
// 定义函数
function sayHiWithObject(what) {
    // 还可以使用传入的对象拥有的属性
    alert(this + " says " + what + ", too! " + this.length)
}

// 创建对象
var num = 200;
// call函数调用
// 第一个参数固定为对象，之后可以添加参数，这些参数被用作公共函数的参数。
sayHiWithObject.call(num, "hello")
var str = "hello"
sayHiWithObject.call(str, "你好")
```
* 利用方式二的形式还可以将上面ClassB继承ClassA方法的过程进行简化：
```
function ClassB(sColor, sName, bHi) {
    // this.newMethod = ClassA;
    // this.newMethod(sColor);
    // delete this.newMethod;

    // 重要的是将function ClassA 视作常规函数，常规函数，常规函数
    // 所以可以使用call来传递ClassA的对象
    // B 要调用 A的函数  -->  call()方法传入B对象及A中所调用函数的参数
    // 上面的可以写成
    ClassA.call(this, sColor);


    this.sayColor = function () {
        alert("b'color: " + sColor)
    }

    this.name = sName;
    this.sayName = function () {
        alert("名字" + this.name);
    };
}
```

#### Function 对象的 apply() 方法
* 函数作用和`call`完全一致，不同的是参数传递。`apply`只有两个参数，第一个仍然是传递对象；第二个则是一个数组，数组中是需要传递的参数。
```
// 用apply改写

function sayHiWithObject(what) {
    // 还可以使用传入的对象拥有的属性
    alert(this + " says " + what + ", too! " + this.length)
}

// 创建对象
var num = 200;
// apply函数调用
// 第一个参数固定为对象，传递的参数包装到数组
sayHiWithObject.apply(num, ["hello"])
var str = "hello"
sayHiWithObject.apply(str, ["你好"])
```
```
// 用apply改写
function ClassB(sColor, sName, bHi) {

    // B 要调用 A的函数  -->  call()方法传入B对象及A中所调用函数的参数
    // B 要调用 A的函数  -->  apply()方法传入B对象及A中所调用函数的参数形成的数组
    ClassA.apply(this, [sColor]);
    // 如果B的构造参数需要全部传入A中，可以直接使用arguements
    // 前提是A，B参数的顺序是一致的
    // ClassA.apply(this, arguements);


    this.sayColor = function () {
        alert("b'color: " + sColor)
    }

    this.name = sName;
    this.sayName = function () {
        alert("名字" + this.name);
    };
}
```
#### 原型链继承方式
* 原型链的弊端是不支持多重继承。记住，原型链会用另一类型的对象重写类的 prototype 属性。
#### 混合继承方式
* 用对象冒充继承构造函数的属性，用原型链继承 prototype 对象的方法。

