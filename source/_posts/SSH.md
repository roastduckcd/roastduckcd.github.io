---
title: SSH 连接iPhone
date: 2019-01-28 13:43:47
comments: true
toc: true
top: 15489913271
declare: true
permalink:
tags: 
- 工具
- SSH
---

* `passwd` 修改密码: mobile权限下需要旧密码，root 下直接覆盖原密码，这就是为什么 root 权限不轻易开放的原因。
<!--more-->
#### 登录过程，（RSA， PC 为客户端，手机为服务端）
我这里客户端就是 Mac，服务端就是 5s手机。
* 首先 Mac 发起连接请求，从手机上得到公钥。提示输入密码。(我这里用的 USB 登录演示)
![](https://i.loli.net/2019/01/28/5c4f05cb710aa.jpg)
* 然后 Mac 将输入的密码用手机公钥进行加密，加密后的信息发到手机
* 手机则使用私钥解密，得到登录密码。然后验证密码正确性。
![ssh_login](https://i.loli.net/2019/01/28/5c4f05cb72cbb.gif)


* 为防[中间人攻击](https://roastduckcd.github.io/2019/01/28/中间人攻击/#more)，PC 端将正常登录获取的手机端的公钥以 IP 为 key 都保存在 `~/.ssh/known_hosts` 文件中。登录时进行匹配，如果失败则可能遇到中间人攻击。
* 有时候两台手机可能分配相同的 ip 地址（不同时在一个局域网）。连接后一台手机时 PC 端可能提示中间人攻击。因为PC上同一个 ip 地址已经保存了前一台手机的公钥。这时需要删除之前的公钥才能连接。PC 端通过`ssh-keygen -R 手机端(服务端)ip` 删除对应的公钥。
* 手机端公钥文件就是 `/etc/ssh/ssh_host_rsa_key.pub`文件。
### 配置免密登录(客户端公钥登录)
客户端将自己的公钥发给服务器保存。登录时，服务器发送一段随机字符串给客户端。客户端使用自己的私钥加密后发给服务器，服务器使用客户端公钥进行解密，如果字符串匹配。则说明用户可信，不发起密码登录请求。（RSA 签名与验证）
* 进入 PC 端目录`~/.ssh`
* `ssh-keygen` 生成自己的公钥、私钥。相关信息可以不用输入,直接回车。
跟上`-f othername` 可以生成指定名字的公私钥 ![-w784](https://i.loli.net/2019/01/28/5c4f05cbdc631.jpg)
* `ssh-copy-id 用户名@服务器ip地址`拷贝到服务器(`~/.ssh/authorized_keys`)
![-w1290](https://i.loli.net/2019/01/28/5c4f05cbd2c30.jpg)

### 配置别名登录
##### 使用局域网连接
* 一般登录 `ssh 用户名@ip地址`
* 别名登录 `ssh 别名`, 修改`~/.ssh.config`，没有则创建。

```
Host 别名
Hostname ip地址 
User 用户名
```
##### 使用 USB 连接(推荐)
```
* 127.0.0.1 本地回环地址，网卡地址。ping 不通说明网卡问题。也可以直接写成`localhost`
* 192.168.1.3 ip地址，路由器分配地址。ping不通可能路由器问题等。
发送数据包到 IP地址，先通过127.0.0.1 再到 ip 地址。
```
* 必须先使用 [python脚本](https://github.com/zqxiaojin/sshToIOS)映射usb 硬件端口映射到本地端口。
作者已经将脚本写成可以直接执行的命令。进到`enableUSBSSh.command`的目录下终端直接执行即可。

   每次使用进一长串目录不方便，可以配置脚本或者环境变量。或者像我一样整个快捷方式。`~/.bash_profile`中添加
![-w1440](https://i.loli.net/2019/01/28/5c4f05cba16db.jpg)
接下来就可以在终端直接使用`USBSSH`映射端口。注意默认映射的端口号是 22。你可以使用编辑器打开`enableUSBSSh.command`文件修改。
* 一般登录 `ssh 用户名@localhost`
* 别名登录 `ssh 别名`, 修改`~/.ssh.config`没有则创建。
```
Host 别名
Hostname 127.0.0.1
User 用户名
Port 映射的端口号
```
但USB连接不建议在 config 中取别名。因为如果链接多台手机，又没配置免密登录，PC 端 RSAKEYS 文件中的 127.0.0.1 会对应多个公钥。造成中间人攻击的情况。这种情况推荐使用脚本。

>**补充：**也可以百度`iProxy`工具映射端口。

### 使用脚本快速连接
* 创建 xxx.sh

```
ssh root@localhost
```
这样在脚本目录下，使用终端`sh xxx.sh`即可快速连接。如果没有配置免密登录会提示输入密码。
* 全局配置
在shell 配置文件中添加如下
```
export SHELL=~/Desktop/SHELL
PATH=:${PATH}:/bin:/usr/bin:$SHELL
```
修改路径为你创建 `.sh`的目录即可。`:$SHELL`直接添加到你的`PATH`后。注意`:`和`$`不能少。


~~ * `localhost`和`127.0.0.1`虽然代表同一个地址~~
~~但是在`known_hosts`文件中存储时以字符串保存。所以如~~果~~多台手机使用，出现中间人攻击？？？~~
    