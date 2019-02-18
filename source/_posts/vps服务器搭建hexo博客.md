---
title: vps服务器搭建hexo博客
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - vps
  - 博客搭建
date: 2019-02-19 00:59:27
top:
---

　　一直在 [vultr](https://www.vultr.com) 上用 vps 搭梯子，感觉还挺浪费的。现在将博客拉上来占占空间···不过远程链接，而且是国外，慢是必须的。买国内的 vps 应该要好些，比如[阿里云](https://www.aliyun.com/product/ecs?utm_content=se_1001244619)。
<!--more-->

#### 准备
* 注册、充值、开服务器，就不介绍了。挺容易上手的。另外笔者使用的是 `CentOS 6 64位`，和 `CentOs 7` 的命令有部分不同。

* ssh 链接远程服务器。ip 和密码在服务器开启后可以查看。
	
	本地操作
	
	```	
	ssh root@服务器 ip
	```
* 提示一下，链接后如果长时间不操作，链接会断开。如果嫌麻烦，可以在开启服务器的网页点击`view console`操作。但是个人体验不是很友好···

#### 安装 nginx 服务
	
　　服务器操作

* 安装 nginx

	```
	yum install -y nginx
	```
* 启动 nginx

	```
	// centos 6 系统
	service nginx start
	
	// centos 7 系统
	systemctl start nginx.service
	```

* 设置开机启动 nginx

	```
	// centos 6 系统
	chkconfig --add http
	chkconfig nginx on
	// centos 7 系统
	systemctl enable nginx.service
	```

* 防火墙允许 nginx 通过默认的 80 端口访问

	```
	// centos 6
	// 端口可以改成需要的, 但是这里先暂时不改
	/sbin/iptables -I INPUT -p tcp --dport 80 -j ACCEPT
	// 保存配置
	/etc/rc.d/init.d/iptables save
	
	// centos 7
	firewall-cmd --service=http --add-port=80/tcp --permanent
	firewall-cmd --reload
	```
	　　也有的博客在这一步直接关闭防火墙，个人觉得没那个必要。需要哪个端口允许通过就可了。
https://www.cnblogs.com/eaglezb/p/6073739.html

	```
	// 关闭防火墙的命令
	// centos 6 系统
	/etc/init.d/iptables stop
	
	// centos 7 系统
	firewall-cmd --add-service=http --permanent
	firewall-cmd --reload
	```

* 在浏览器输入 ip，应该能看到 nginx 欢迎信息，nginx 开启成功。相当于建了一个最简单的网站。

	默认网站根目录为`/usr/share/nginx/html`

	默认网站的配置文件是`/etc/nginx/conf.d/default.conf`

#### 配置一个自定义的 nginx 网站
　　服务器操作

* 新建自己的博客文件夹,并添加一个 `index.html`文件。`index.html`内容随意，目前只是用于提示。路径可以自己修改。这个文件夹将来存放我们博客的静态资源。

	```
	mkdir /root/hexo
	cd /root/hexo
	vi index.html
	```
* 开放自定义端口

	>友情提示：不要为了感觉6就使用`6666`端口，由于存在安全风险，部分浏览器禁止访问该端口。浪费我好多时间···[详情点击](http://www.mamicode.com/info-detail-2251143.html)

	```
	// 查看指定端口是否被占用
	netstat -anp | grep 8123
	
	// centos 6系统
	/sbin/iptables -I INPUT -p tcp -m tcp --dport 8123 -j ACCEPT
	/etc/rc.d/init.d/iptables save
	
	// 查看开放的端口
	/etc/init.d/iptables status
	
	// centos 7系统
	semanage port -a -t http_port_t -p tcp 8123
	
	firewall-cmd --service=http --add-port=8123/tcp --permanent
	
	firewall-cmd --reload
	```
	>
	>[iptables 使用一](https://www.cnblogs.com/bethal/p/5806525.html)
	>
	>[iptables 使用二](https://www.cnblogs.com/grimm/p/5362096.html)
	>
	>[端口已通过防火墙,还是不能访问,看这篇文末](https://www.jianshu.com/p/8ded7c5fda1d)

* 修改 nginx 默认配置 `/etc/nginx/conf.d/default.conf`，最好备份一下`cp default.conf default_old.conf`

	```
	# 修改监听端口为刚才新开放的
	# ipv4
	listen       8123 default_server;
	# ipv6
	listen       [::]:8123 default_server;
	
	# 修改网站静态资源文件路径，一定要绝对路径
	root /root/hexo;
	```
	修改完毕后保存，重新加载 nginx 服务`nginx -s reload`。

	此时在浏览器通过`ip:新端口`号访问，如果出现`index.html`中的内容说明配置成功

	>如果出现 403 错误，首先确认`default.conf`正确配置，`root`字段必须是绝对路径，即便`~`路径标识都不行。然后确认绝对路径上的每一个文件夹或文件都有可读权限。
	
	```
	chmod 755 xxx
	```

#### 安装 git 服务，建立服务仓
　　服务端操作

* 安装 git 服务器
       
	```
	yum -y install git
	```
* 添加一个用户 git，在`/home/`下

	```
	adduser git
	```
* 在 git 用户下创建代码仓

	```
	mkdir /home/git/repo
	cd /home/git/repo
	
	// 初始化代码仓, 更改所有者为 git 用户
	git init --bare hexo.git
	chown -R git:git /home/git/repo/hexo.git
	
	// 更改博客资源文件夹所有者为 git 用户
	chown -R git:git /root/hexo
	```
	
* 配置 git 自动部署脚本。我们push代码后，git 自动运行脚本部署到博客资源文件夹

	```
	cd hexo.git/hooks
	
	// 创建配置文件，添加执行权限
	touch post-receive
	chmod +x post-receive
	```
	在配置文件中输入以下命令
		
	```
	git --work-tree=/root/hexo --git-dir=/home/git/repo/hexo.git checkout -f
	```
	
　　`--work-tree`: 博客静态资源文件夹
　　`--git-dir`: 刚才初始化的 git 代码仓
    
#### 配置 `git` 用户 ssh 免密登录
* 服务端在 git 用户文件夹下创建 ssh 配置文件

    ```
    cd /home/git
        
    // 创建 .ssh文件夹，修改权限及所有权
    mkdir .ssh
    chmod 700 /home/git/.ssh
    chown -R git:git /home/git/.ssh  
      
    // 创建 authorized_keys文件，修改权限
    cd .ssh
    touch authorized_keys
    chmod 600 /home/git/.ssh/authorized_keys
    chown -R git:git /home/git/.ssh/authorized_keys
    ```

* 服务端开启权限，修改`/etc/ssh/sshd_config`文件
	
	```
	RSAAuthentication yes  
	PubkeyAuthentication yes
	AuthorizedKeysFile  .ssh/authorized_keys
	```
　　　文件中只是被注释了，打开即可。

* 本地终端生成新的 RSA 密钥对

	```
	cd ~/.ssh
	
	// 生成秘钥对, -f 后的名字可以自定义
	ssh-keygen -t rsa -b 4096 -C "sjy457346652@aliyun.com" -f blog_server_rsa
	```
* 本地复制公钥到刚才服务端新建的`authorized_keys`文件中

	```
	// 本地执行，复制公钥内容到粘贴板
	pbcopy < blog_server_rsa.pub
	```

* 免密登录测试

	```
	ssh git@ip
	```
	> 如果还是需要输入密码
	>> 1.确定 authorized_keys中是对应的公钥
	>> 2.确定权限
	>> 3.以下确定文件及文件夹的拥有者为 git
	>>> * .ssh 文件夹
	>>> * authorized_keys 文件
	>>> * chown -R git:git 要修改拥有者的文件或文件夹

* 设置 ssh 登录别名，自动登录用户设为 git
本地修改`~.ssh/config`文件，增加以下内容

	```
	Host vultr
	   HostName 服务器ip
	   User git 
	   Port 22
	   IdentityFile ~/.ssh/blog_server_rsa
	```
	`Host`: 别名，自定义

	`User`: 必须为 git

	`Port`: ssh 的端口号,`netstat -anp |grep ssh`查看，一般默认22

	`IdentityFile`: 本地私钥文件路径

	注意字段和值之间有一个空格

#### 安装 node.js 

　　服务端

* 各种 node 版本

	https://github.com/nodesource/distributions

	https://nodejs.org/dist

* 安装

	https://www.cnblogs.com/savokiss/p/9692684.html 
	
	如果你用的32位 centos，看这[32位 centos 安装 nodejs](http://www.liuzongyang.com/linux/23.html)
	
	```
	// 用管道将CURL输出的内容（下载下来的脚本）使用Root权限用Bash运行
	curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
	
	// 安装
	yum -y install nodejs
	
	// 检查是否成功
	node -v
	npm -v
	```

#### 本地修改 hexo 博客配置文件
* 修改`_config.yml`

	```
	deploy:
	  - type: git			# 使用 Github 部署
	    repo: 
	      github: git@github.com:roastduckcd/roastduckcd.github.io.git		# SSH 方式的 Github 仓,博客静态文件部署的分支
	    branch: master
	  - type: git           # 自己的服务器部署
	    repo: vultr:/home/git/repo/hexo.git
	```
	`repo`: `自定义ssh别名:服务端代码仓路径`

* 本地部署博客

	```
	hexo g -d
	```

* 浏览器`服务器ip:端口号`访问博客
