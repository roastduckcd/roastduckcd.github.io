---
title: hexo博客之next主题配置
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - hexo
  - next
date: 2019-02-17 19:44:52
top:
---

本文主要参照一下两篇文章，自己边配置边重新记录了下。
* https://blog.csdn.net/kunkun5love/article/category/7416724
* https://blog.csdn.net/qq_33699981/article/details/72716951
<!--more-->
#### 首先推荐异步动画
默认动画是同步的，个人感觉加载有点慢。

修改`themes/next/_config.yml`

```
# Use velocity to animate everything.
motion:
  enable: true      # 启用动画
  async: true       # 异步动画
```

#### 修改网站结构
在主题配置文件`themes/next/_config.yml`中
![blog_change_scheme](https://i.loli.net/2019/02/17/5c694984f0c47.jpg)
如图，next 目前支持4中布局，打开对应的注释即可。
#### 修改网站语言
在 hexo 博客根目录中的`_config.yml`中修改
```
language: zh-CN
```
#### 添加菜单
比如要添加一个标签页(tags),分类(categories)也一样
* 在博客根目录中执行
```
hexo new page tags
```
* 执行后会在`source/tags`下生成`index.md`文件
* 修改`index.md`文件

```
---
title: tags
date: 2019-02-01 23:16:15
type: "tags"    # 如果是分类页，则改为"categories"
comments: false # 关闭评论
---
```
* 然后修改`themes/next/_config.yml`中打开对应的注释。通过调整关键字的顺序可以改变菜单顺序。

| 格式： |  |  |
| --- | --- | --- |
| 菜单名 | 对应index页位置 | 菜单前面的图标  |
| tags | /tags/ | tags |
https://fontawesome.com/ 图标默认来自这个网站，选好后直接修改图标名即可。笔者没有实现自定义图标，有知道的读者请留个言，谢谢。

```yml
menu:
  home: / || home
  tags: /tags/ || tags 
  #categories: /categories/ || th
  archives: /archives/ || archive
  #schedule: /schedule/ || calendar
  #sitemap: /sitemap.xml || sitemap
  #commonweal: /404/ || heartbeat
  about: /about/ || user

# Enable/Disable menu icons / item badges.
menu_settings:
  icons: true
  badges: false
```

#### 站内搜索
* 安装插件

```
npm install hexo-generator-searchdb --save
```
* 修改博客根目录下的配置文件`_config.yml`

```
search:
  path: search.xml
  field: post
  format: html
  limit: 10000
```
* 修改`themes/next/_config.yml`中

```
local_search:
  enable: true
```

#### 网站图标
* 图标默认搜索路径是`themes/next/source`文件夹下
* 在`themes/next/_config.yml`搜索`favicon`
url 使用相对路径

```
favicon:
  small: /images/roastduck16x16.png
  medium: /images/roastduck32x32.png
```
* 这里我只修改了两种图片，位置在`themes/next/source/images`下。

#### 侧边栏头像
* 图标默认搜索路径是`themes/next/source`文件夹下
* 在`themes/next/_config.yml`搜索`avatar`

```
avatar:
  url: /jianxiu.png         # 头像路径
  rounded: false            # 圆角
  opacity: 1                # 透明度
  rotated: false            # 鼠标移入是否旋转
```
* 我这里图片放在了`themes/next/source/`下。

#### 文章设定
以下都是在`themes/next/_config.yml`中配置

##### 保持上一次浏览位置

```
save_scroll: false
```
##### 主页展示文章摘要

```
excerpt_description: true
```
在文章中合适的地方后添加`<!-- more -->`，首页中就只会展示标记之前的文章
##### 文章标记

![post_meta](https://i.loli.net/2019/02/17/5c694984a863b.jpg)
```
# Post meta display settings
post_meta:
  item_text: true       # 标记前面的描述
  created_at: true      # 文章发布时间
  updated_at:           # 文章更新时间
    enabled: false
    another_day: true
  categories: true      # 分类
```
##### 代码块设定

```
# 边框设定
codeblock:
  border_radius: 0          # 代码块圆角大小
  copy_button:          
    enable: true            # 展示复制按钮
    show_result: false
# 背景色: 
# next 提供5种：normal、night、night eighties、night blue、night bright
highlight_theme: normal
```
如果需要自定义样式，可以修改`themes/next/source/css/_custom/custom.styl`，添加以下代码
```
// 小代码块的样式
code {
    color: #ff7600;         // 字体颜色
    background: #fbf7f8;    // 背景色
    margin: 2px;            // 和相邻元素的间距
}
// 大代码块的自定义样式
.highlight, pre {
    margin: 1px 0;
    padding: 1px;
    border-radius: 3px;
    background: #FDF6E4     // 代码块背景色
    // color: #F5390F;      // 字体颜色
}
// 代码前景色
.highlight .code pre {
  background: #FDF6E4
}
// 代码块边框大小、粗细、颜色
.highlight, code, pre {
    border: 1px solid #d6d6d6;  
}
// 代码与边框 margin
.table-container {
    margin: 1px 0;
}
```
##### 版权信息
    
    1. 在目录`themes/next/layout/_macro/`下添加模板`my-copyright.swig`, 复制 [Github代码](https://github.com/roastduckcd/hexo-theme-next/blob/master/layout/_macro/my-copyright.swig)
    2. 在`themes/next/source/css/_common/components/post/`下添加样式`my-post-copyright.styl`, 复制 [Github代码](https://github.com/roastduckcd/hexo-theme-next/blob/master/source/css/_common/components/post/my-post-copyright.styl)
    3. 修改文章模板`next/layout/_macro/post.swig`，在注释
    
    ```
    {#################}
    {### END POST BODY ###}
    {#################}
    ```
    之后加入以下代码
    ```
    <div>
      {% if not is_index %}
        {% include 'my-copyright.swig' %}
      {% endif %}
    </div>
    ```
    最后在`themes/next/source/css/_common/components/post/post.styl`最后一行添加
    ```
    @import "my-post-copyright"
    ```
    使用方法：在文章最前面的`front matter`中添加`copyright: true`即可。
    
#### 添加背景图片
原文链接：https://www.jianshu.com/p/30bf702f533c
* 修改 `themes\next\source\css\ _custom\custom.styl`, 添加

```
// 背景图
body {
    background:url(/images/code_background.jpg);
    background-repeat: no-repeat;
    background-attachment:fixed;
    background-position:50% 50%;
}

// 头部透明
//.header-inner {
//  opacity: 0.1
//}

// 增加背景透明度
.main-inner { 
    margin-top: 60px;
    padding: 60px 60px 60px 60px;
    background: #fff;
    opacity: 0.8;
    min-height: 500px;
}
```
图片可以是网络路径，或者是`themes/next/source`路径下的图片路径。推荐使用网络路径，加载更快。
#### 配置侧边栏个人链接

| 格式： |  |  |
| --- | --- | --- |
| 链接名称 | 链接地址 | 前面的图标  |
https://fontawesome.com/ 图标默认来自这个网站，选好后直接修改图标名即可。
```
# 设定链接
social:
  GitHub: https://github.com/roastduckcd || github
  简书: https://www.jianshu.com/u/8f6ea27db0c7
  
# 链接图片
social_icons:
enable: true
icons_only: false
transition: false
```

#### 文章末尾标签去除"#"
![tag_extra_symbol](https://i.loli.net/2019/02/17/5c694984bbc7b.jpg)
如图所示，"#"影响页面效果。我们可以在`themes/next/layout/_macro/post.swig`中搜索`tag.name`。删掉前面的"#"即可。如果需要在前面加个图标，可以将"#"替换成下面的代码
```
<i class="fa fa-tags"></i>
```
代码来自 https://fontawesome.com/，搜索到想要的图片后, 进入就能看到图片的代码。需要注意的是网站给的代码
```
<i class="fas fa-tags"></i>    // 无效
<i class="fa fa-tags"></i>     // 有效
```
要将 fas 改为 fa，否则无效。不清楚什么原因？？

#### 页面点击小红心
* `/themes/next/source/js/src`下新建`love.js`, 复制[Github代码](https://github.com/roastduckcd/hexo-theme-next/blob/master/source/js/src/love.js)
* 在`themes/next/layout/_layout.swig` 文件, 在标签`</body>`前面添加

```
<script type="text/javascript" src="/js/src/love.js"></script>
```
* 重新生成博客即可。

#### 主页文章添加阴影效果
主页中，文章间默认是看不出分隔的。添加阴影效果来区分以下。
* 在`\themes\next\source\css\_custom\custom.styl`末尾添加如下代码

```
// 主页文章添加阴影效果
 .post {
   margin-top: 10px;
   margin-bottom: 10px;
   padding: 25px;
   -webkit-box-shadow: 0 0 5px rgba(202, 203, 203, .5);
   -moz-box-shadow: 0 0 5px rgba(202, 203, 204, .5);
  }
```

#### Fork me on Github
* 选取样式
    * https://github.blog/2008-12-19-github-ribbons/
    * http://tholman.com/github-corners/

![fork_me_on_github](https://i.loli.net/2019/02/17/5c6949852c62b.jpg)
* 选好后复制旁边的代码，来到`themes/next/layout/_layout.swig`中添加代码，位置如下

```html
<div class="headband"></div>
    ###刚才复制的代码###
<header id="header" class="header" itemscope itemtype="http://schema.org/WPHeader">
    <div class="header-inner">{% include '_partials/header/index.swig' %}</div>
</header>
```
* 重新 `hexo g`生成新的 html 即可。

#### 来必力评论

来必力官网：https://www.livere.com/
注册(貌似有点慢)后来到`管理页面-代码管理`复制UID。
![livere_uid](https://i.loli.net/2019/02/17/5c69498543644.jpg)
由于 next 主题已经集成了来必力，我们只需要在`themes/next/_config.yml`中搜索`livere_uid`配置 uid 即可。
```
livere_uid: 刚才复制的 UID
```

#### 开启分享功能
next 自带 `NeedMoreShare2`，基本 QQ、 微信分享还是有的。
* 在`themes/next`下执行

```
git submodule add https://github.com/theme-next/theme-next-needmoreshare2.git source/lib/needsharebutton
```
* 在`themes/next/_config.yml`中启用。 一种是固定在文章底部`postbottom`，一种是固定在页面左下角`float`。需要哪种修改`enable`为 `ture`即可。
* 另外`postion`选项修改的弹出后菜单的位置。笔者一度以为是个 bug，整半天按钮不挪位置··· 样式看图吧
设置的格式：`top / middle / bottom + Left / Center / Right`

```
needmoreshare2:
  enable: true
  float:
    enable: true
    options:
      iconStyle: box
      boxForm: horizontal
      position: middleRight
      networks: Weibo,Wechat,Douban,QQZone,Twitter,Facebook
```

![share_button_middle_right](https://i.loli.net/2019/02/17/5c69498519479.jpg)

![share_button_top_right](https://i.loli.net/2019/02/17/5c6949851b080.jpg)

#### DaoVoice 在线留言
* 注册 DaoVoice 并获取 appid

![daovoice_appid](https://i.loli.net/2019/02/17/5c694985635dc.jpg)
* 然后打开`/themes/next/layout/_partials/head/head.swig`,在文件末尾添加

```
{% if theme.daovoice %}
<script>
(function(i,s,o,g,r,a,m){i["DaoVoiceObject"]=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;a.charset="utf-8";m.parentNode.insertBefore(a,m)})(window,document,"script",('https:' == document.location.protocol ? 'https:' : 'http:') + "//widget.daovoice.io/widget/58b50729.js","daovoice")
daovoice('init', {
  app_id: "{{theme.daovoice_app_id}}"
});
daovoice('update');
</script>
{% endif %}
```
* 第三步修改`themes/next/_config.yml`, 末尾添加

```
# DaoVoice Online contact 
daovoice: true
daovoice_app_id: 刚才获取的 appid
```
* 默认的刀言图标是在右下角，可以在刀言控制台进行配置

![daovoice_icon_position](https://i.loli.net/2019/02/17/5c694985416c7.jpg)

#### 统计字数
* https://github.com/theme-next/hexo-symbols-count-time
* 博客根目录下安装插件 `npm install hexo-symbols-count-time --save`
* 修改博客根目录下的 `hexo` 配置文件 `_config.yml`

```
symbols_count_time:
  symbols: true     # 开启统计
  time: true        # 文章阅读时间预计
  total_symbols: true   # 博客总字数
  total_time: false     # 博客总阅读时间预计
```
* 修改主题目录下的配置文件 `_config.yml`

```
symbols_count_time:
  separated_meta: false  # 分割线,true无false有···
  item_text_post: true  # 显示中文的"阅读时间"等
  item_text_total: true # 显示中文的"博客总字数"
  awl: 4    # 一个词平均字符长度，中文较多就设为2
  wpm: 275  # 阅读速度
```
* 最后重新`hexo g`生成并部署即可。
* 不过有一点不好的是，默认生成的字段会自动换行。原因是插件作者采用的 `div` 标签。打开`next/layout/_macro/post.swig`, 搜索`symbols_count_time`,修改接下来的第一对`div`标签，改为`span`标签。保存刷新就不会换行了。

#### 实现公益404页面
* 在博客根目录下执行

```
hexo new page 404
```
然后进入博客根目录`source/404/`，修改其中的`index.md`为`index.html`。然后打开文件添加代码
```
< !DOCTYPE html>
<html lang ="en">
<head>
     <meta charset="UTF-8">
     <title>页面暂时飞走了</title>
</head>
<body>
<script type="text/javascript" src="//qzonestyle.gtimg.cn/qzone/hybrid/app/404/search_children.js" charset="utf-8"></script>
</body>

</html>
```

#### 实现 PC 版点击空白区域关闭侧边栏
* 目前 js 小白，如果有更好的方法请不吝赐教。
* 修改`themes/next/source/js/src/motion.js`
搜索`var sidebarToggleMotion`, 提升变量作用域(放到最前面)。这样子就可以在外面拿到关闭侧边栏函数。修改后如下，代码省略了很多

```
var sidebarToggleMotion;
$(document).ready(function() { 
    ········
    sidebarToggleMotion = {····}
});
```
* 还是`motion.js`, 修改 `clickHandler`函数，阻止事件冒泡。这个函数就是右下角控制侧边栏开闭的按钮事件。

```js
// 添加一个函数参数 e，页面点击事件
clickHandler: function(e) {
      this.isSidebarVisible ? this.hideSidebar() : this.showSidebar();
      this.isSidebarVisible = !this.isSidebarVisible;
      // 添加阻止事件冒泡
      e.stopPropagation();
    },
```
* 在`themes/next/source/js/src`下新建一个`close-sidebar.js`文件

```
$(document).ready(function(e){
    $(document.body).on('click', function(e){
        if (sidebarToggleMotion.isSidebarVisible) {
            sidebarToggleMotion.hideSidebar();
            sidebarToggleMotion.isSidebarVisible = !sidebarToggleMotion.isSidebarVisible;
        }
    });
    // 阻止侧边栏的事件冒泡
    sidebarEL = $('.sidebar');
    sidebarEL.on('click', function(e) { 
        e.stopPropagation(); 
    });
});
```
* 在`themes/next/layout_layout.swig`末尾的`</body>标签前添加

```
<!-- 点击窗口关闭侧边栏 -->
<script type="text/javascript" src="/js/src/close-sidebar.js"></script>
```
* 目前存在的 bug：如果点击文章还是会看到侧边栏关闭的动画，应该直接跳转。如果其他 bug 请留言，尽力解决。