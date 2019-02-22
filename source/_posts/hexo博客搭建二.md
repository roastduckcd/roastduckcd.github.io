---
title: Github + Hexo + yilia 主题+ travis 自动部署个人博客(hexo进阶)
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - hexo
date: 2019-02-17 19:37:34
top:
---

### 常用命令
中括号表示可选参数。
* `hexo s`: 开启本地服务，可以通过`http://localhost:4000`访问博客。建议每次发布前使用一次，确定本地文件没有问题。
* `hexo new [layout] 文件名.md`: 创建新的 MarkDown 文件并应用 layout 布局(版式)。😴 网上找个顺手的 MarkDown 软件就好了···<!--more-->
* `hexo g [-d]`: 生成网页文件并立即部署。
* `hexo d [-g]`: 部署到网站前先生成网页。
* `hexo clean`: 清除`public`文件夹，这里面包含所有生成的静态网页。慎用。
* 更多命令，请访问官网[配置](https://hexo.io/zh-cn/docs/commands)。

### _config.yml 配置文件

```
# Site
title: 烤鸭的小火炉       # 博客标题
subtitle: 一只喜欢看布袋戏的烤鸭   # 博客副标题
description: 蹉跎错,消磨过,最是光阴化浮沫  # 博客描述, 硬生生干成座右铭
keywords: iOS, Swift, 程序猿       # 不知道是不是博客的搜索关键字
author: 阳仔            # 博客作者
language:         # 博客使用的语言
timezone:         # 博客使用的时区, 默认使用电脑时区

# URL
## If your site is put in a subdirectory, set url as 'http://yoursite.com/child' and root as '/child/'
url: https://roastduckcd.github.io      # 博客地址
root: /       # 博客根目录
permalink: :year/:month/:day/:title/    # 博客链接的格式
permalink_defaults:

# Directory
source_dir: source        # 源文件夹
public_dir: public        # 静态网页文件夹
tag_dir: tags             # 标签
archive_dir: archives     # 归档
category_dir: categories  # 分类
code_dir: downloads/code  # ？？
i18n_dir: :lang           # 国际化
skip_render:              # 

# Writing
new_post_name: :title.md  # 新 MarkDown 文件名
default_layout: post      # 预设布局（网页版式）
titlecase: false          # 标题首字母大写
external_link: true       # 在新标签中打开链接
filename_case: 0          # 文件名小写(1)大写(2)
render_drafts: false      # 显示草稿
post_asset_folder: false  # 图片上传需要设置为 true
relative_link: false      # 相对路径，默认是绝对路径
future: true              # 显示之后的文件
highlight:                # 代码块设置
  enable: true
  line_number: true
  auto_detect: false
  tab_replace:
  
# Home page setting
index_generator:
  path: ''          # index.html 文件路径
  per_page: 10      # 每页显示博文数量
  order_by: -date   # 博文排序方式，默认日期降序
  
# Category & Tag
default_category: uncategorized   # 博文默认分类
category_map:                     # 分类别名
tag_map:                          # 标签分类

# Date / Time format
## http://momentjs.com/docs/#/displaying/format/
date_format: YYYY-MM-DD   
time_format: HH:mm:ss

# Pagination
## Set per_page to 0 to disable pagination
per_page: 10
pagination_dir: page

# Extensions
## Plugins: https://hexo.io/plugins/
## Themes: https://hexo.io/themes/
# theme: landscape   # 默认主题
theme: yilia

# Deployment
## Docs: https://hexo.io/docs/deployment.html
deploy:
  type: git			# 使用 Github 部署
  repo: git@github.com:roastduckcd/roastduckcd.github.io.git		# SSH 方式的 Github 仓
  branch: master 		# 博客静态文件部署的分支
```

### 插件安装
* 以映射 google 站点地图插件为例

```
// 安装
npm install hexo-generator-sitemap --save
```
选项`--save`会将插件版本信息保存到 `package.json`文件中。
* 插件安装好后需要到 `_config.yml`配置。

```
sitemap:
  path: sitemap.xml
```
配置好后 `hexo g`生成站点地图文件，位置在`public`文件夹下。

* 百度收录 sitemap：https://blog.csdn.net/qq_28804275/article/details/80891969
* 各个插件具体如何配置，需要到插件链接页去自信了解。
* [hexo 官方插件页](https://hexo.io/plugins/)

### front matter 的设置
注意所有冒号后有一个空格
* layout: {{ layout }}
布局
* title: {{ title }}
标题
* toc: true
目录
* date:	 {{ date }}
创建日期
* updated: {{ updated }}
更新日期, 无效？？
* permalink:  `自定义，你想怎样就怎样`
替换默认的文章链接, 规则随意，使用 `/`分隔。
如果你想统一格式，又不想每次都在文章中改。可以修改博客根目录下的`_config.yml`中的字段。
`permalink: article/:year:title.html`
规则也是自定义，我这里 article 自定义，然后使用了 hexo 自带的变量。变量冒号不用空格。
* comments: true
是否开启文章评论,true / false
* categories:
分类,如果有多个分类,第二个之后的会成为第一个的分类

>categories:
\- 分类1
\- 分类2

* tags:
标签

>tags:
\- tag1
\- tag2