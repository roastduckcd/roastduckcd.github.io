---
title: vps安全
comments: true
toc: true
copyright: true
declare: true
categories:
  - 博客
tags:
  - 博客
  - vps
date: 2019-02-23 01:46:20
top:
---

　　这篇文章是[简书作者@乜明文章](https://www.jianshu.com/p/b35d9a4b4eb5) 的 CentOS 6 64位版本。
#### 修改 ssh 默认端口（远程连接安全）
* 查看要修改的端口是否被占用<!--more-->

    ```
    netstat -anp | grep 2101
    ``` 
* 修改`/etc/ssh/sshd_config`

    ```
    Port 22
    Port 2101
    ```
    先不要关闭22端口，以免出现问题不能登录。
* 重启 ssh 服务

    ```
    /etc/init.d/sshd restart
    ```
* 使用新端口链接

    ```
    ssh -p 2101 root@144.202.39.248
    ```
* 链接成功再去吧22端口删掉，并重启 ssh
* 如果失败，尝试开启 2101 端口并通过防火墙。笔者没用下面这句是成功了，所以并不清楚会出现什么问题。

    ```
    /sbin/iptables -I INPUT -p tcp --dport 2101 -j ACCEPT
    
    service iptables save
    ```
    
#### 禁止非 wheel 组用户提升到 root 权限（服务器主机安全）

　　由于`root`权限身份金贵，一般配置使用普通用户就好。如果有需要高级权限，再通过`su`命令登录为`root`用户。并且还可以指定用户才能`su`,这样就能提高一些安全系数。

* 首先确定除了 `root`之外，你还拥有自己的账户
    
    ```
    cat /etc/passwd
    ```

    然后会列出一堆用户及其信息
    ![linux_get_all_users](https://i.loli.net/2019/02/23/5c7038d932da9.jpg)
    每一行就是一个用户，其格式如下：
    
    ```
    用户名:密码(当然不会明文):用户ID:用户组ID:备注:用户根目录:用户shell脚本目录
    ```
    
* 如果没有自己创建的用户，建议新建一个。如果有，忽略下面这步。
    
    ```
    adduser git
    passwd git
    // 然后按提示输入两次密码
    ```

* 禁止非`wheel`组用户使用`su`命令

    ```
    vi /etc/pam.d/su
    
    打开下面这句的注释，注意看清楚，看清楚，看清楚!!!
    auth required pam_wheel.so use_uid
    ```
    
    保存后，再使用`git`用户登录。即使密码输入正确也会提示错误或者无权限。
    
    ```
    // 登录 git 用户
    su git
    
    // 登录 root 用户
    su
    // su: incorrect passwd
    
    sudo -i
    // git is not in the sudoers file.  This incident will be reported.
    ```
    ![linux_no_wheel_login](https://i.loli.net/2019/02/23/5c7038d913436.jpg)

* 要登录`root`，需要将 `git` 用户添加到 `wheel` 组。再执行上面的命令就 ok。
    
    [usermod命令](https://blog.csdn.net/beitiandijun/article/details/41681215)
    
    [linux用户操作详解](https://www.cnblogs.com/jackyyou/p/5498083.html)
    
    [linux用户操作](https://www.cnblogs.com/xiohao/p/5877256.html)
    
    ```
    // 退回到 root 用户
    exit
    
    // 添加进组
    usermod -G wheel git
    
    // 查看 wheel 组用户
    cat /etc/group | grep wheel
    ```
    ![linux_get_wheel_user](https://i.loli.net/2019/02/23/5c7038d9310b9.jpg)
    好吧，我猜错了，总之`su`是登录不上了。查了一下，`sudo -i`需要修改`/etc/sudoers`文件。[解决 is not in the sudoers file](https://blog.csdn.net/gouxf_0219/article/details/80592773)
    
* 这里只是记录命令，如何将用户移出组和删除用户。

    ```
    // 将用户移出wheel组，如果前面使用的是 usermod -G 
    gpasswd -d test_user sheel
    
    // 修改用户所属组，如果前面使用的是 usermod -g
    usermod -g git:git
    
    // 删除用户及其下的目录
    userdel -r test_user
    ```

#### 禁止 ssh 以 root 用户登录，需要在 root 下操作。（远程连接安全）

* 前提你要有其他用户可以ssh

    ```
    vi /etc/ssh/sshd_config
    
    // 打开下面的注释，并将值修改为no
    PermitRootLogin no
    
    // 重启 ssh 服务
    service sshd restart
    ```
    ![forbid_ssh_root](https://i.loli.net/2019/02/23/5c7038d92e29f.jpg)

* 现在笔者就只能使用 git 用户登录了
    ![ssh_login_git](https://i.loli.net/2019/02/23/5c7038d933123.jpg)
    
#### 设置 ssh 免密登录并禁止密码登录（远程连接安全）

　　密码登录有一定风险，万一泄露或者黑客暴力破解就不好了。使用 RSA 就不容易破解了，除非黑客又黑掉你本地电脑，拿到你的私钥文件。

　　注意以下操作是基于服务器登录用户为 `git`。

* 本地生成密钥对

    ```
    cd ~/.ssh
    ssh-keygen -t rsa -b 4096 -C "你的邮箱，随意" -f server_rsa
    ```
    接下来一直回车即可。`~/.ssh`目录下生成`server_rsa.pub`和`server_rsa`文件。
    
* 将本地公钥复制到服务器 `git` 用户`~/.ssh/authorized_keys`文件中

    ```
    ssh-copy-id -i ~/.ssh/server_rsa.pub -p 端口号 git@服务器IP
    ```
* 传输过程跟网速有关，最后会需要输入 `git` 用户的密码。完成后就可以免密登录。

    ![ssh-copy-id](https://i.loli.net/2019/02/23/5c7038d9564b0.jpg)
    
* 设置别名登录

	上面的方式每次登录都需要输入端口号和 IP，略显麻烦。本地编辑`~/.ssh/config`文件

    ```
    ###### for personal server
    Host vultr   # 别名
      HostName 服务器IP
      User git   # 登录用户名
      Port 端口号
      PreferredAuthentications publickey
      IdentityFile ~/.ssh/blog_server_rsa # 本地私钥文件路径
    ```
现在就可以使用`ssh vultr`免密登录了。

* 禁止密码登录

	`git`用户登录服务端设置

    ```
    // 切换到 root 用户
    su
    
    // 修改配置文件
    vi /etc/ssh/sshd_config
    
    // 打开以下注释, 并将其值改为 no
    PasswordAuthentication no
    
    // 重启 ssh 服务
    service sshd restart
    ```
     
        