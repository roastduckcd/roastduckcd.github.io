---
title: 基于Flask的python后端
date: 2019-04-25 00:05:59
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- python
- flask
tags:
- flask
---


<!--more-->
### URL映射 
我们输入的每一个网址，其实对应一个资源路径。该路径经过截取后对应一个函数，这个函数为我们返回请求的文件或者直接返回一堆数据。可以说，我们请求一个网址，就是去调用它映射的一个函数。
* **路由:**实现URL映射的程序即路由，`Flask`利用的是`python`语言特性`装饰器`。路由中的路径可以是静态的也可以是动态(根据路径变化部分作出对应响应)的。动态部分使用尖括号`<>`将其传入函数作为参数进行使用。
* **视图函数:**路径对应映射的函数。
```
# 创建程序实例
app = Flask(__name__)
# 路由:生成映射关系
@app.route(静态路径字符串/<动态路由字符串, name>)
# 视图函数
def function_name(name):
    return "hello, %s" % name
```
也可以通过函数生成
```
def function_name(name):
    return "hello, %s" % name
app.add_url_rule(静态路径字符串/<动态路由字符串, name>, "function_name", function_name)
```
查看映射关系
```
app.url_map

# Map([
#    <Rule '/pic' (OPTIONS, GET, HEAD) -> show_me_a_pic>,
#    <Rule '/static/<filename>' (OPTIONS, GET, HEAD) -> static>,
#    <Rule '/<name>' (OPTIONS, GET, HEAD) -> welcome>
# ])
```
可以看到由三部分组成

* `'/pic'`: 路径，也就是我们在浏览器`ip地址:port`后的部分
* `(OPTIONS, GET, HEAD)`: HTTP的参数
* `show_me_a_pic`: 映射的视图函数
### 上下文
　　当我们收到请求后，有时需要访问一些对象(比如Request获取header)。如果将他们作为参数传到视图函数中，每个函数都需要定义相同参数。因此设计上下文方便全局操作这些对象。

* `current_app`: 程序上下文，当前程序实例
* `g`: 程序上下文，处理请求时用作临时存储的对象，每次请求被重设
* `request`: 请求上下文，请求对象，封装客户端发出的http请求
* `session`: 请求上下文，用户会话，用于存储请求之间需要记住的值的词典

　　`Flask`在分发请求之前激活程序和请求上下文，完成处理请求后删除。注意上下文在使用前必须先激活，并且要注意使用时机，否则会报错。
```
from flask import Flask
from flask import current_app
from flask import g
from flask import request
from flask import session

server = Flask(__name__)

@server.route("/<name>")
def welcome(name):
    # 处理请求时可以使用两个请求上下文，也可以使用程序上下文
    print(request)
    print(session)
    return "hello, %s" % name


if __name__ == '__main__':
    # 启动服务器
    server.run(debug=True)
    # 激活上下文
    context = server.app_context()
    # 激活上下文
    context.push()
    # 上下文激活可以使用程序上下文，不能使用请求上下文
    print(current_app)
    print(g)
```
### 请求钩子
　　注册通用函数(类似全局函数)，该函数能在请求开始前或之后被调用。使用修饰器实现。

* `before_first_request`: 在处理第一个请求之前运行
* `before_request`: 在处理每个请求之前运行
* `after_request`: 如果没有异常抛出，在处理每个请求之后运行
* `teardown_request`: 即使有异常抛出，也会在每个请求处理后运行

### 响应
　　视图函数的返回值就是一个请求的响应内容（视图函数的第一个返回值）。该返回值除了返回具体内容外，也可以返回HTTP状态码（第二个返回值）和一个字典(第三个返回值)。该字典中的值满足HTTPHeader，并且会添加到Response的`header`中
```
@server.route("/<name>")
def welcome(name):
    # 三个参数实际是作为一个元祖返回
    return "hello, %s" % name, 200, {"Accept-Type": "image/png"}
```
　　有时我们需要设置响应的header或cookie等属性，可以通过将上面的元祖换成Response对象返回。
```
@server.route("/<name>")
def welcome(name):
    # 使用 response, 也能接收3个参数
    response = make_response("hello, %s" % name, 200, {"Accept-Type": "image/png"})
    # 一个 set_cookie 只能对应一条cookie的存储
    # cookie 参数key, value及其他属性， key ，value都是字符串，使用其他类型浏览器报TypeError
    response.set_cookie("lalalal", "520")
    return response
```
#### header - 重定向
* 1. 使用第三个参数的字典, 重定向状态码为302
* 2. 专用函数
```
@server.route("/redirect")
def my_redirect():
    # 一定要加上 http:// 或 https://
    # return "some to redirect", 302, {"Location": "http://www.baidu.com"}
    return redirect("http://www.baidu.com")
```
## 模板(响应呈现的文件)
* 默认在程序文件夹下的`templates`文件夹中寻找模板。
```
# 模板文件 html
<!DOCTYPE html>
<html>
    <head>
        
    </head>
    <body>
        # 注意变量使用 两对 花括号
        <h1>hello, {{name}}!</h1>
    </body>
</html>
```
```
# python 文件
# 使用模板形式返回内容
@server.route("/user/<name>")
def t_welcome(name):
    return render_template("welcome.html", name=name)
```
`render_template`参数：
* 第一个是模板文件
* 之后可以接多个键值对参数`name=name`，也就是模板文件需要的变量。这些参数是关键字参数，而`关键字就来自模板中两对花括号间的变量`。

### 渲染 
jinja2: 变量识别，变量过滤(进一步的处理)，
