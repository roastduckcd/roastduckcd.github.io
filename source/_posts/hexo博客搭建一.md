---
title: Github + Hexo + yilia 主题+ travis 自动部署个人博客(搭建)
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客搭建
  - hexo
date: 2019-02-17 19:25:28
top:
---

### 前期准备
* Github 账号注册、仓库建立、SSH 的配置等请参考[这里](https://www.jianshu.com/p/f4cc5866946b)

* 这里说说 SSH 的配置。Github SSH 免密连接和自动部署都需要密钥对(公钥+私钥)，所以有必要命名区分。<!--more-->但是注意如果指定了文件名，密钥对就在当前目录生成。如果没有指定，默认就会在`~/.ssh/`下生成`id_rsa`和`id_rsa.pub`密钥对。这样很可能不小心就覆盖掉，所以推荐自命名。
![gernerate_ssh_rsa_deploy](https://i.loli.net/2019/02/17/5c69431846790.jpg)

### hexo 搭建博客
* 创建一个博客文件夹，我命为 BLOG,以后就称为博客根文件夹。 `cd` 进入

* 安装 hexo

```
// -g 表示命令全局有效
npm install hexo-cli -g
```

* 初始化 hexo

```
hexo init
```
初始化成功后根文件夹的目录
![hexo_init_dir](https://i.loli.net/2019/02/17/5c6943183f9dc.jpg)
* 现在可以本地访问你的博客了

```
hexo server (简写 hexo s)
```
![hexo_s](https://i.loli.net/2019/02/17/5c694317e5c24.jpg)
浏览器中输入`http://localhost:4000`，一个简单博客就呈现了。
![init_default_blog](https://i.loli.net/2019/02/17/5c69431850eba.jpg)
`ctrl+c`退出 hexo server, 博客也就再不能访问。
* 接下来我们将博客部署到 Github，以便网络访问。首先配置根文件夹下的 `_config.yml`。目前我们就配置`deployment`下的就可以。这里先着重说一下 `branch` 字段的配置. 

    * 如果你的仓库名是`用户名.github.io`,那部署博客的 branch 必须为 master。
    * 如果你还像我一样需要将源码上传(之后自动部署要用)，那必须创建新分支，源码 `push` 到新分支。否则 `hexo` 部署时会将 `master` 中的内容覆盖
    * `branch` 不用提前创建，`hexo` 部署时会自动根据你的配置创建或更新 `branch`

**==注意`yml`文件对空格敏感，以下倒数3行前有两个空格，冒号后一个空格。==**

```
# Deployment
## Docs: https://hexo.io/docs/deployment.html
deploy:
  type: git			# 使用 Github 部署
  repo: git@github.com:roastduckcd/roastduckcd.github.io.git  # SSH 方式的 Github 仓
  branch: master		# 博客静态文件部署的分支
```
Github 仓地址：
![get_ssh_repo_url](https://i.loli.net/2019/02/17/5c69431840b89.jpg)


* 安装 Git 发布插件

```
npm install hexo-deployer-git --save
// 上面执行完后如果提示了 npm WARN babel-eslint@10.0.1 requires a peer of eslint@>= 4.12.1 but none is installed
// 再按照这个（根据提示,缺什么装什么）
npm install eslint --save
```
* 发布

```
hexo g -d     // 生成静态网页并发布
```
![deploy_done](https://i.loli.net/2019/02/17/5c69431823157.jpg)
看到图中这个说明部署完成。等上一会就可以访问你的博客`你的用户名.github.io`。万一访问不了，先到仓库看看是什么问题
![repo_setting](https://i.loli.net/2019/02/17/5c694318248d4.jpg)
进入后往下拉，查看 Pages 标签中提示什么问题。
![githubpages_deploy_or_not](https://i.loli.net/2019/02/17/5c6943180d285.jpg)
我这里是博客根目录下`thems/landscape/README.md`文件`GithubPages`读不了。看了下文件，是因为有个 markdown 格式的代码块。毛病!!!可有可无的文件，直接删了即可。
![gitpages_deploy_success](https://i.loli.net/2019/02/17/5c694317e4169.jpg)
点击图中链接访问博客。

**Tip:** 推荐发布前先启用本地服务`hexo s`检查是否能访问博客，提前处理错误。

