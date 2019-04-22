---
title: 用过的Linux命令(持续更新)
date: 2019-04-22 15:49:35
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 工具
- 实用工具
tags:
- shell
---


#### echo 输出变量值处理特殊字符
* `echo $var` 和 `echo "$var"` 区别：
* 如果是`echo $var`，输出结果为一行，没有换行符
* 如果是`echo "$var"`，显示转义字符。输出结果为多行，有换行符
* 输出到文件
    * echo 123 > rd.txt 覆盖写入
    * echo 123 >> rd.txt 追加写入

#### sed 命令
https://blog.csdn.net/weixin_41579863/article/details/79695379
https://blog.csdn.net/xj626852095/article/details/26101273
* `sed -n 'm, np' filename`：读取文件 filename 中第 m ~ n 行。
* sed 删除时 -n 必须在 -i 之前
`sed -i -n '/~/d' .zsh_history`
* sed: RE error: illegal byte sequence

#### date 获取当期日期
* 直接使用，返回标准时间格式
* 自定义格式，根据需求调整。
    
    ```
    格式：2019-4-3 13:34:33
    date "+%Y-%m-%d %H:%M:%S"
    ```
* 自定义格式中的变量, 区分大小写。
    
    | 变量 | 表述 |
    | --- | --- |
    | D | 完整日期, 04/22/19 |
    | Y | 四位年份, 2019  |
    | y | 两位年份, 19 |
    | m | 数字月份, 4 |
    | h | 英文简写月份, Apr|
    | d | 天 |
    | H | 24小时时钟 |
    | M | 分钟 |
    | S | 秒钟 |
    | a | 英文简写星期, Mon. |
    
    
#### tips
* 在`.bash_profile`或`.zshrc`
    
    ```
    export LC_CTYPE=C 
    export LANG=C
    ```
添加后可能导致`zsh`终端按 tab 键时，重复出现终端输入，而且删不掉。因此需要在用完后注释掉该语句。
