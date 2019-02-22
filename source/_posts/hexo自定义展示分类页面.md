---
title: hexo自定义展示分类页面
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - hexo
date: 2019-02-22 09:40:04
top:
---

* 需求：笔者想写技术类和碎碎念类文章。但是想把他们分别展示，比如主页就展示技术类，另起一个随笔分类展示碎碎念文章。这是我的[博客地址](http://roastduck.xyz)
<!-- more -->
开始动手

* 修改`themes/next/_config.yml`，在`menu`字段下新增一个`gossip`，使用`categories/gossip`分类。也可以使用中文分类。
    
    ```
    menu:
      home: / || home
      gossip: /categories/gossip || coffee
    ```

* 在`themes/next/languages/zh-CN.yml`中增加对应的中文

    ```
    menu:
      home: 首页
      gossip: 随笔
    ```

* 修改`themes/next/layout/category.swig`，在`entends`后面引入一个模板。[Github代码](https://github.com/roastduckcd/hexo-theme-next/blob/master/layout/category.swig)（由于 `hexo` 使用的 `swig` 模板引擎会解析 `MarkDown`代码块中 swig 语法。所以会受影响的代码块都使用 Github 代码链接代替😔😔😔😔😔😔）

* 我们在点击某一个分类时，它只展示了该分类下的文章`title`

    ![blog_category_only_title](https://i.loli.net/2019/02/22/5c6f5330ba610.jpg)
    因为渲染模板使用的是`post-collapse.swig`。但是笔者想要它像主页一样展示一些摘要。所以在上面引入了`post.swig`模板。
    
* 接下来我们需要添加一个`if`语句，效果是只在笔者`gossip`分类下使用`post.swig`，其他分类还是使用原来的。[Github代码](https://github.com/roastduckcd/hexo-theme-next/blob/master/layout/category.swig)

* 最后这一步必不可少，要在博客根目录下`public/category/`下生成 `gossip`分类。必须至少存在一篇使用该分类的文章。否则出现访问404。

   　　博客根目录下

	```
	hexo new 写一篇占位文章吧.md
	```
	　　打开刚才的文件，在`front-matter`中增加`gossip`分类。
	
	```
	---
	categories:
	  - gossip
	---
	```

* 最后 `hexo g`,`hexo s`本地先查看下。

#### 一些问题，还请不吝赐教
* 最好是自定义一个模板`custom_name.swig`去渲染。但是笔者没找到`category.swig`是`在哪被谁`调用的，所以自定义的模板不知道在哪去`include`。
* BUG: 因为使用的是`category/gossip`，所以点击`gossip`时，`category`分类菜单也会处于选中状态。
* 主页默认展示所有文章，但是在主页好像拿不到文章的分类，所以不能使用`if`语句来屏蔽`gossip`分类下的文章。