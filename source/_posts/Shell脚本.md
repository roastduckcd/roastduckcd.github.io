---
title: Shell脚本
comments: true
toc: true
copyright: true
declare: true
categories:
  - 工具
  - 实用工具
tags:
  - shell
date: 2019-04-20 22:36:35
top:
---

将各类命令预先放入到一个文本文件中，方便一次性执行的一个脚本文件。
本文仅列出笔者使用者遇到的 shell tip或语法。所以命令不是很去全，读者可以自行搜索关键字。推荐[菜鸟Linux教程](http://www.runoob.com/linux/linux-tutorial.html)
<!--more-->

### Shell
* 查看当前 PC 使用的所有 Shell：`cat /etc/shells`
* 切换 shell：`chsh -s 上面查到的Shell路径`
   
### Shell 执行方式
 * `sh 标准后缀.sh`
 * 执行命令 bash、zsh、source、./
    * `source FileName`：在当前shell环境中读取并执行FileName中的命令特点：命令可以强行让一个脚本去立即影响当前的环境（一般用于加载配置文件）。该命令会强制执行脚本中的全部命令,而忽略文件的权限。

    * `bash FileName  、  $zsh FileName`：重新建立一个子shell，在子shell中执行脚本里面的句子。

    * `./FileName`：读取并执行文件中的命令。但有一个前提，脚本文件需要有可执行权限。

### tips
* shell 对空格的使用很严格。比如变量赋值 `t=$(pwd)`不需要；`if [ "string" == $var ]`则前后都要。
* 输入时，输入信息与提示信息保持在同一行。输入的信息被当成字符串处理（这是笔者使用得出的结论，不保证正确···）

    ```
    echo -n 提示信息`           # `-n`表示不换行 
    read 变量
    ```
    如果`-n`命令不生效，就将命令中的`echo`替换为`/bin/echo`。
    直接使用 read 选项
    ```
    read -p 提示信息 变量:       # read 时将提示信息输出
    ```
* 数学表达式需要加关键字 `expr 3 + 2`。操作符前后必须有空格
* 不另开 shell 调用另一个脚本，并传递参数
    
    ```shell first.sh
    source path/second.sh 参数1 参数2···
    ```
    ```shell second.sh
    // 使用 $1,$2,$3,$5···$9,${10},${11}···接收参数
    ```
    [调用另一个 shell 的三种方式](https://blog.csdn.net/simple_the_best/article/details/76285429)

### 语法
#### 变量可以直接声明，但是访问必须要在前面加 `$`

* 定义

    ```
    a = 20
    b = $a
    ```
* 读取变量时推荐使用 `${var}` 的方式，这样能更直观的区分变量范围。

    ```
    rain="cargo"
    
    // 试比较下面语句
    echo "hi, ${rain}boat"
    echo "hi, $rainboat
    ```
    [相关链接](https://blog.csdn.net/qq_23587541/article/details/83038147)
    
* 用变量保存命令运行结果 `$(command)`

    ```
    # 赋值
    t=$(git status | grep master)
    # 输出变量的值
    echo $t
    ```

#### 控制语句
* if 判断语句格式
    https://www.cnblogs.com/aaronLinux/p/7074725.html
    
    ```
    # 中括号两边必须有空格, 比较符号两边也必须有空格
    if [ xx == yy ]; 
        then
            do something
        elif [ aa == bb ]; 
        then
            do something
        else
            do something
    fi
    ```
    
    | if [ -z xxx ] | 判断 xxx 为空 |
    | --- | --- |
    | -a | 与 |
    | -o | 或 |
    | ！ | 非 |
* while 语句
    
    ```
    // 无限循环
    while [ true ]; do
        do something
    done
    ```
* case 语句(其他语言的 switch), `;;`前可以有多条语句。每个条目的换行不是必须的，但是能提高代码可读性。
    
    ```
    index=0
    case $index in
        0 ) sed -i "" -e "s/同级tag1/$tag/" $fullpath
            echo "test"
            ;;
        1 ) sed -i "" -e "s/同级tag2/$tag/" $fullpath
            ;;
    esac
    ```
* 函数
    所有函数在使用前必须定义。所以必须将函数放在脚本开始部分。函数调用直接使用函数名。
    ```
    // 函数定义
    function funName(){
        echo "参数不用形参，使用 $1 获取第一个参数"
        echo "参数不用形参，使用 $2 获取第二个参数"
        echo "参数不用形参，使用 $3 获取第三个参数"
        echo "参数不用形参，使用 ${10} 获取第十个参数"
        echo "参数不用形参，使用 ${11} 获取第十一个参数"
        return $($1+${11})
    }
    // 函数调用
    funName 参数1,参数2,参数3···参数10,参数11,
    ```
    
    1. 可以带`function fun()` 定义，也可以直接`fun()` 定义,不用任何形参。
    2. 可以 return 。如果不加，将以最后一条命令运行结果，作为返回值。 return后跟数值n(0-255)
    3. 当形参个数n < 10时,使用`$n`来获取参数。当 n >= 10时，需要使用`${n}`来获取参数。
    4. 如果传递的参数中含有空格, 一般都是字符串吧，记得要用双引号，否则会认为有多个参数。因为 shell 是以空格来区分参数个数的。
    5. 处理参数的特殊字符：
        
        | $# | 获取传递到脚本的参数个数 |
        | --- | --- |
        | $* | 以一个单字符串显示所有向脚本传递的参数 |
        | $$ | 获取当前运行脚本的进程PID |
        | $! | 获取后台运行的最后一个进程的PID |
        | $@ | 与$*相同，但是输出时加引号，并在引号中返回每个参数 |
        | $- | 显示Shell使用的当前选项，与set命令功能相同。 |
        | $? | 显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。 |
