---
title: {{ title }}
date: {{ date }}
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- 一级分类
- 二级分类
tags:
- 同级tag1
- 同级tag2
---


由于对某款app的租房信息的筛选条件不满意，所以爬取了它的api以便能够根据自己的需求进行筛选。根据自己的初级爬虫经验，为了防止app封禁我的ip，所以准备通过代理服务器去访问。
<!--more-->
过程是相当纠结啊，尝试的太多，这里就只放结论了。

* 先决条件：
1. http方式的代理只能访问http网站。
2. https方式的代理只能访问https网站。
**注：**上面的“只能”指的是访问失败或者能访问但隐藏不了ip。
ps：有时代理稳定性也很重要，不行就换换吧。
* 验证方式：
1. http代理：http://www.whatismyip.com.tw
2. https代理：https://ip.cn
3. 百度搜索“ip”，然后使用浏览器那串网址(嗯···记录时临时想的，我没试过⊙v⊙)。
* 上代码(Swift)：
笔者使用的`URLSession`，初始化前配置`URLSessionConfiguration`对象的`connectionProxyDictionary`即可。
    1. 使用http代理，两种任一
```
{
    String(kCFNetworkProxiesHTTPEnable) : true,
    String(kCFNetworkProxiesHTTPPort) : httpPort,
    String(kCFNetworkProxiesHTTPProxy) : httpHost,
}
```
```
{
    "HTTPEnable" : true,
    "HTTPProxy" : httpHost,
    "HTTPPort" : httpPort
}
```
ps：使用http时，需要添加ATS白名单

    2. 使用https代理
```
{
    "HTTPSEnable" : true,
    "HTTPSProxy" : httpsHost,
    "HTTPSPort" : httpsPort
}
```
**注：**两种代理方式貌似不能同时使用，不确定是因为我测试时上一秒代理还好好的，下一秒就挂了。

* 另外，过程中遇到最多的就是1200错误码：无法与服务器建立安全连接。网上大多数意见是服务器SSL版本不够，因为iOS最低要就使用TLSv1.2的版本。
以下是网上给出的解决方法：(未能验证)
```
<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSExceptionDomains</key>
		<dict>
			<key>your.https.server</key>
			<dict>
				<key>NSExceptionRequiresForwardSecrecy</key>
				<false/>
				<key>NSExceptionAllowsInsecureHTTPLoads</key>
				<true/>
				<key>NSIncludesSubdomains</key>
				<true/>
				<key>NSExceptionMinimumTLSVersion</key>
				<string>TLSv1.0</string>
			</dict>
		</dict>
	</dict>
```
由于我这里是代理字典https key用错了，才导致的1200。所以只能先在这mark一下。
这里推荐一个测试TLS的命令：
`nscurl --ats-diagnostics --verbose https://xxxxxxxxx`
这里能自动测试哪种key能通过，随便找个https的网站试一下吧。


* 最后，这个问题困扰了我一天多。在网上各种找，尝试种种方案，一直报1200的错误。然后，然后我就打开苹果开发者官网搜了下proxy。我只想说What the F···。一般来说官方文档是了解一门技术的最好方式，为什么我才想起呢？
* 再遇到这种牛角尖问题：
 * 借助官方文档!!!
 * 借助官方文档!!!
 * 借助官方文档!!!

附上`connectionProxyDictionary` keys 参见[Table 3-7](https://developer.apple.com/library/content/documentation/Networking/Conceptual/SystemConfigFrameworks/SC_UnderstandSchema/SC_UnderstandSchema.html)
