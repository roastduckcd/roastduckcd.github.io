---
title: Github + Hexo + yilia 主题+ travis 自动部署个人博客(yilia主题待续)
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - hexo
  - yilia
date: 2019-02-17 19:39:44
top:
---
目前已经使用 next 主题，[详情点击](https://roastduckcd.github.io/article/hexo%E5%8D%9A%E5%AE%A2%E6%90%AD%E5%BB%BA%E4%BA%94.html)
### 安装 yilia
* 进入博客根目录

```
git clone https://github.com/roastduckcd/hexo-theme-yilia themes/yilia
```
yilia 的源文件就 clone 到了`thems/yilia`文件夹下<!--more-->
* 配置 _config.yml, 修改 theme 字段

```
theme: yilia
```
* `hexo g` + `hexo s` 本地先查看一下
* 点击”所有文章“，多半会像下面一样，提示缺失模块。

![blog_note_jsonContent](https://i.loli.net/2019/02/17/5c69484eb5ed8.jpg)

```
npm i hexo-generator-json-content --save
```
* 安装好后打开`_config.yml`配置如下内容。

```
jsonContent:
  meta: false
  pages: false
  posts:
    title: true
    date: true
    path: true
    text: false
    raw: false
    content: false
    slug: false
    updated: false
    comments: false
    link: false
    permalink: false
    excerpt: false
    categories: false
    tags: true
```
* 再次`hexo g` + `hexo s` 检查无误后`hexo d`部署到 `Github Pages`。接下来就开始润色博客了。

### 打造自己的博客
* 如何使文章只展示一部分，在你想要展示的部分后面添加标签`<!--more-->`即可。不过这样可能会在网页中出现`more>>`的链接按钮。由于笔者使用的是 yilia 主题，右下角本来就有`展示原文`。如何去掉呢？

> 进入 `themes/yilia` 文件夹下，修改`_config.yml`文件中的`excerpt_link: more`，删掉 more 即可。注意冒号后有一个空格。 

　
> 同时`<!--more-->`标签之前必须有文章内容，但是`front matter`不算。

* 如何在一行输入多个 tag `tags: [tag1, tag2 ···]`
* 开启目录: 在文章中的`front matter`区域添加 `toc: true`，按钮在右下角。样式修改`yilia/layout/_partial/archive.ejs`

* 修改代码块样式: 
    1. 修改的字段：
        * 背景色: 修改`.article-entry .highlight`字段中的`color`属性值。
        * 代码字体颜色: `.article-entry .highlight .line`字段中的 color 值。
    2. 修改的位置：
        * `theme\yilia\source\main.0cf68a.css`修改该文件不需要编译。
        * `yilia\source-src\css\highlight.scss`修改该文件需要编译。

        ```
        npm install
        npm run dev
        npm run dist
        ```
        
### 配置 yilia 时 npm 相关错误
* 第一种错误：由于 `webpack` 的升级导致`yilia/webpack.config.js`配置文件中语法的变化。这种虽然看到一大坨红字，但是下面已经给出了修改提示。
* 第二种错误：`The provided value “*” is not an absolute path!` 需要绝对路径。`yilia/webpack.config.js`顶部引入 `var path = require("path")`
并更改提示需要绝对路径的输出为：

    ```
    path: path.resolve(__dirname, '路径'),
    ```
* 第三种错误：需要安装对应安装包。
    1. 首先升级已有安装包(package.json -> dependences字段)

        ```shell
       // 安装检查更新的插件
       npm install npm-check-updates -g
       // 检查depedencies中的最新版本 
       npm-check-updates  
       // 更新dependencies到最新版本 
       ncu -u 
       // 如果想更新全部depedencies到最新版本（包括当前指定版本范围满足最新版本号）
       ncu -a 
        ``` 
    2. 先再执行`npm install`，如果还有提示`missing modual`就缺啥安啥。
* `Plugin/Preset files are not allowed to export objects, only functions.`
原因可能是包被废弃了。以前的`babel-preset-*`都由`babel-present-env`替代了。
    ```
    // 先卸载原来的包
    npm uninstall --save-dev babel-preset-es2015
    npm install --save-dev babel-preset-env@next
    ```
    然后修改`yilia/.babelrc`文件
    ```
{
  "presets": [ "env" ],
  ...
}
    ```

>`--save--dev`: 保存包信息到`package.json -> devDependences`
>`--save`: 保存包信息到`package.json -> dependences`

* `TypeError: this.setDynamic is not a function`

    ```
    // 我的这个在 package.json -> dependences中，需要放在 package.json -> devDependences
    // 
    npm install --save-dev babel-plugin-transform-runtime
    npm install --save @babel/runtime
    ```