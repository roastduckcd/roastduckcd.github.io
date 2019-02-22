---
title: Github + Hexo + yilia 主题+ travis 自动部署个人博客(自动部署+双线部署)
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - hexo
  - travis
date: 2019-02-17 19:42:09
top:
---

### 使用 Github 账号登录 travis
* 点击`sign in with Github`, 授权后登入 travis。点击头像就进入Github 仓库列表。点击博客前的按钮激活。<!--more-->
![travis_activite](https://i.loli.net/2019/02/17/5c6948f0a835e.jpg)
有的博客说要进入`settings`选择`build only if .travil.yml presents`，只有 Github 仓中存在 travis 配置文件才构建。不过现在好像是默认了，没有这个选项。要是看到就点上吧。

### 生成 GitHub Access Token
![github_generate_access_token](https://i.loli.net/2019/02/17/5c6948f0e7a83.jpg)
生成 `Access Token` 后一定要复制，一旦离开页面就再看到了，只能重新生成一个。
![copy_access_token](https://i.loli.net/2019/02/17/5c6948f0bf359.jpg)

### 配置 Access Token 到 travis
![config_access_token](https://i.loli.net/2019/02/17/5c6948f0bd8b6.jpg)

### 编辑配置文件 .travis.yml

```
language: node_js             # 指定博客源码语言环境
node_js: 
  - '11'   		  	          # 指定语言版本
cache: npm                    # 指定 npm 缓存方案，会缓存 $HOME/.npm 或 node_modules 文件夹

branches:                     # 指定要构建的分支
  only:                       # only 表示只构建以下分支
  - source					  # Github 源代码分支	
before_install:               # install 阶段之前执行
  - export TZ='Asia/Beijing'  # 设置时区
  - npm install -g hexo-cli   # 全局安装 Hexo 命令行工具

install:                      
  - npm install               # 安装 package.json 中的依赖

script:                      
  - hexo clean
  - hexo generate             # Hexo 常规命令，执行清理和生成

after_success:                # script 阶段成功时执行，构建失败不会执行，其他同上
  - git config --local user.name "roastduckcd"
  - git config --local user.email "sjy457346652@aliyun.com"
  # 配置 hexo _config.yml 中的 deploy 字段。也就是博客部署的分支
  - sed -i'' "s~git@github.com:~https://${GITHUB_TOKEN}@github.com/~" _config.yml
  - hexo deploy 			  # 通过 Hexo 的 deploy 命令部署博客
```
* 注意上面倒数第二句 `sed`命令中 `GITHUB_TOKEN`就是上面配置 Access Token中 的环境变量名
* `branches`中的分支是你的源代码分支。我的情况是只创建了一个 Github 仓，用 master 分支部署博客，另建了一个 source 分支同步源码。
![travis_success](https://i.loli.net/2019/02/17/5c6948f0c68d1.jpg)
部署成功后的页面。如果部署没成功，`Job log` 中会列出错误信息。如果连这个页面都没有，那就到 `Requests` 标签页中查看
![travis_failed](https://i.loli.net/2019/02/17/5c6948f0c333e.jpg)
我这里是因为`.travis.yml`文件中写多了其他命令导致travis 解析配置文件失败。

### 双线部署到腾讯代码仓 https://dev.tencent.com
流程和 Github 大体相同。
* 新建仓库，名字必须为：`用户名.coding.me`，一定要公开源码，不然貌似不能 clone。
* 需要手动到 `pages 服务`中一键开启 pages 服务。
* `Access Token`被叫做 `访问令牌`，位置在`个人设置-访问令牌`。同样只需选择仓库控制一个权限即可。
* 复制访问令牌，add 到 travis 中。这里我取名`CODING_TOKEN`
* 既然要部署两个，那么需要修改博客配置文件`_config.yml`

```
deploy:
  type: git			# 使用 Github 部署
  repo: 
    github: git@github.com:roastduckcd/roastduckcd.github.io.git	
    # 添加 coding 的 git 地址
    coding: git@git.dev.tencent.com:roastduckcd/roastduckcd.coding.me.git
  branch: master
```
* 修改博客根目录下`.travis.yml`，添加一句 sed 命令

```
after_success:               
   - git config --local user.name "roastduckcd"
   - git config --local user.email "sjy457346652@aliyun.com"
   - sed -i'' "s~git@github.com:~https://${GITHUB_TOKEN}@github.com/~" _config.yml
   # 添加下面这句
   - sed -i'' "s~git@git.dev.tencent.com:~https://${CODING_TOKEN}@git.dev.tencent.com/~" _config.yml
   - hexo deploy
```
但是目前 coding 上使用 访问令牌能 clone 不能 push，上面那句会提示输入密码。不知道是不是 coding 的 bug？？？