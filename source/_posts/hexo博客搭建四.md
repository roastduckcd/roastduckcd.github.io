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

　　先说一下笔者的部署情况：

* 本地博客可以`hexo g -d`发布到服务器，所以已经配置了到服务器的[免密登录，并且使用了别名 ssh 登录](http://roastduck.xyz/article/vps%E5%AE%89%E5%85%A8.html#%E8%AE%BE%E7%BD%AE-ssh-%E5%85%8D%E5%AF%86%E7%99%BB%E5%BD%95%E5%B9%B6%E7%A6%81%E6%AD%A2%E5%AF%86%E7%A0%81%E7%99%BB%E5%BD%95%EF%BC%88%E8%BF%9C%E7%A8%8B%E8%BF%9E%E6%8E%A5%E5%AE%89%E5%85%A8%EF%BC%89)。<!-- more -->

* 笔者需要将源代码上传到 Github。这样每次都要 `git push` 和 `hexo d` 发布。所以想到自动部署，只需要将代码 push 到 Github，travis 监控 git 仓变动，开始自动构建并部署到服务器。 

### 自动部署到 Github 的配置
#### 使用 Github 账号登录 travis
* 点击`sign in with Github`, 授权后登入 travis。点击头像就进入Github 仓库列表。点击博客前的按钮激活。
![travis_activite](https://i.loli.net/2019/02/17/5c6948f0a835e.jpg)
有的博客说要进入`settings`选择`build only if .travil.yml presents`，只有 Github 仓中存在 travis 配置文件才构建。不过现在好像是默认了，没有这个选项。要是看到就点上吧。

#### 生成 GitHub Access Token
![github_generate_access_token](https://i.loli.net/2019/02/17/5c6948f0e7a83.jpg)
生成 `Access Token` 后一定要复制，一旦离开页面就再看到了，只能重新生成一个。
![copy_access_token](https://i.loli.net/2019/02/17/5c6948f0bf359.jpg)

#### 配置 Access Token 到 travis
![config_access_token](https://i.loli.net/2019/02/17/5c6948f0bd8b6.jpg)

#### 编辑配置文件 [.travis.yml](https://github.com/roastduckcd/roastduckcd.github.io/blob/source/.travis.yml)

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

### 自动部署到个人服务器的配置

[个人服务器搭建](http://roastduck.xyz/article/vps服务器搭建hexo博客.html)

* 请先确保本地已经[生成密钥对](http://roastduck.xyz/article/vps%E5%AE%89%E5%85%A8.html#%E8%AE%BE%E7%BD%AE-ssh-%E5%85%8D%E5%AF%86%E7%99%BB%E5%BD%95%E5%B9%B6%E7%A6%81%E6%AD%A2%E5%AF%86%E7%A0%81%E7%99%BB%E5%BD%95%EF%BC%88%E8%BF%9C%E7%A8%8B%E8%BF%9E%E6%8E%A5%E5%AE%89%E5%85%A8%EF%BC%89),并且公钥已经上传到服务器。

* 来到博客根目录下，即`.travis.yml`所在文件夹。终端执行

	```
	// 使用 travis 命令加密私钥
	travis encrypt-file ~/.ssh/blog_server_rsa(私钥文件路径) --add
	```
	　　`travis`会在博客根目录下生成`blog_server_rsa.enc`的文件，该文件不要移动。另外不要把私钥文件放到博客目录中。一旦上传到 Github，别人下载下来就可能用你的私钥登录你的服务器。
	
	　　同时该命令会自动在`.travis.yml`中添加一句`openssl`解密命令。为避免权限问题，我们还需在该条语句后手动加一条`chmod`命令。
	
	```
	before_install:
	  - openssl aes-256-cbc -K $encrypted_d89376f3278d_key -iv $encrypted_d89376f3278d_iv -in id_rsa.enc -out ~/.ssh/id_rsa -d
	  - chmod 600 ~/.ssh/id_rsa
	```

* 由于笔者博客的repo已经配置成了别名方式，在 travis 也需要配置别名

	笔者博客根目录下的`_config.yml`
	
	```
	deploy:
	  - type: git			# 使用 Github 部署
	    repo: 
	      github: git@github.com:roastduckcd/roastduckcd.github.io.git		# SSH 方式的 Github 仓,博客静态文件部署的分支
	      branch: master
	  - type: git
	    repo: vultr:/home/git/repo/hexo.git  # 个人服务器 repo
	```
	　　首先需要在 travis 设置页面中配置敏感字段。比如这里我不想再`.travis.yml`中直接写服务器 IP 和端口号，否则上传到 Github 大家都能看到了。配置方法和上文`配置 Access Token 到 travis`相同。我这里使用的名字是`HostName`和`Port`, 在`.travis.yml`中就可以使用`$变量`的方式取值来代替明文显示。
	　　![travis_environment](https://i.loli.net/2019/02/23/5c70dded85d3b.jpg)
	　　
	　　接下来还是在`.travis.yml`中的`befor_install`字段下配置别名

	```
	# 避免 config 的权限问题
	- chmod 600 ~/.ssh/config
	
	# 配置别名，一定要用  >> 符号表示追加，否则是覆盖文件
	- echo "Host vultr" >> ~/.ssh/config
	- echo "  HostName $HostName" >> ~/.ssh/config
	- echo "  User git" >> ~/.ssh/config
	- echo "  Port $Port" >> ~/.ssh/config
	- echo "  StrictHostKeyChecking no" >> ~/.ssh/config
	- echo "  IdentityFile ~/.ssh/blog_server_rsa" >> ~/.ssh/config
	
	# openssl 解密
	- openssl aes-256-cbc -K $encrypted_2c1446b86c6a_key -iv $encrypted_2c1446b86c6a_iv -in blog_server_rsa.enc -out ~/.ssh/blog_server_rsa -d
	- chmod 600 ~/.ssh/blog_server_rsa
	```

	>小提示:
	>> `>>`一定是两个右尖括号，否则会覆盖原来的文件。
	>
	>问题:
	>>1. 有些博客中将`echo`语句合并一句，使用`\n`隔开。但是笔者试了。travis 报错`Could not resolve hostname devsrv: Name or service not known`然后笔者分段写入，编译成功。出现该问题也可能需要[修改hosts](https://www.cnblogs.com/xiangyangzhu/p/5316041.html)
	>>2. 由于设置了`StrictHostKeyChecking no`, 又出现`Warning: Permanently added (RSA) to the list of known hosts`该警告不影响部署，但是笔者觉得碍眼。改为 `yes`
	>>3. 改为 `yes`后竟然报错···`No RSA host key is known for [[secure]]:[secure] and you have requested strict checking.`。其实`StrictHostKeyChecking` 字段是为防止[中间人攻击](http://roastduck.xyz/article/中间人攻击.html)。值为`yes`时，会在`~/.ssh/known_hosts`中按`IP`寻找保存的公钥，然后和服务器公钥比对，以确定是否遭到中间人攻击。这个报错就是因为没有找到。
　　非要解决的话，笔者思路：复制服务器公钥以 travis 变量方式保存，在`.travis.yml`中使用`$变量`的方式添加到`known_hosts`文件。有兴趣可以自行尝试。这里结论还是改回`no`。
	     
	>参考链接:
	>> [使用 travis 进行持续集成](https://www.liaoxuefeng.com/article/0014631488240837e3633d3d180476cb684ba7c10fda6f6000)
	>>
	>> [使用 Travis 将 GitHub 文件上传传至服务器](https://segmentfault.com/a/1190000009093621)

### 双线部署到[腾讯代码仓](https://dev.tencent.com) (已 Quit)
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
但是目前 coding 上使用 访问令牌能 clone 不能 push，上面那句会提示输入密码。不知道是不是 coding 的 bug？？？提 issue 也没说出到底哪的问题。放弃。