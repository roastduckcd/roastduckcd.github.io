---
title: iOS-URL编码
date: 2019-05-10 12:58:54
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 踩的坑
tags:
- URL编码
---


* iOS9.0 后 URL 字符串编码的方法 `-[NSString stringByAddingPercentEncodingWithAllowedCharacters:]`。

<!--more-->
* 参数类型为 NSCharacterSet，通过该参数指定不需要进行 URL 编码的字符

    ```
    // 注意: \ 带有转义字符
    NSString *string = @"abc123*&+=#%<>[\]{}`|";
    NSCharacterSet *set1 = [NSCharacterSet characterSetWithCharactersInString:@"abc*&]{}"];
    NSString *encoded1 = [string stringByAddingPercentEncodingWithAllowedCharacters:set1];
    
    // 结果, 为方便观察添加了两个空格
    abc  %31%32%33  *&  %2B%3D%23%25%3C%3E%5B%5C  ]{}  %60%7C
    ```
* 类方法集成了部分在 URL 编码时用到的字符串。URL 示例: `http://username:password@www.example.com/index.php?key1=value1#jumpLink`。
	* `URLUserAllowedCharacterSet`  		"#%/:<>?@[\]^`    之外的所有字符，编码位置为 username
	* `URLPasswordAllowedCharacterSet`	"#%/:<>?@[\]^`{|} 之外的所有字符，编码位置为 password
	* `URLHostAllowedCharacterSet`      #"%/<>?@\^`{|}     之外的所有字符，编码位置为 www.example.com
	* `URLPathAllowedCharacterSet`      "#%;<>?[\]^`{|}    之外的所有字符，编码位置为 /index.php
	* `URLQueryAllowedCharacterSet`     "#%<>[\]^`{|}      之外的所有字符，编码位置为 key1=value1
	* `URLFragmentAllowedCharacterSet`  "#%<>[\]^`{|}      之外的所有字符，编码位置为 jumpLink
	
	举个例子
	
	```
	// 注意: \" 和 \\ 带有转义字符
	NSString *string = @"abc123*&+=\"#%<>[\]^`{|}";
	NSCharacterSet *set2 = [NSCharacterSet URLQueryAllowedCharacterSet];
	NSString *encoded2 = [string stringByAddingPercentEncodingWithAllowedCharacters:set2];
	// 结果: 为方便观察添加了两个空格
	abc123*&+=  %22%23%25%3C%3E%5B%5C%5D%5E%60%7B%7C%7D
	```
	再多说一句吧，以 `URLQueryAllowedCharacterSet` 为例。该类方法的**效果**是对 "#%<>[\]^\`{|} 进行编码，但是该方法的**返回值**其实是 "#%<>[\]^\`{|} 在所有URL编码字符中的**补集**。
	
	```objc 手动创建验证一下
	// query 要编码的字符
	NSString *query = @"\"#%<>[\]^`{|}";
	NSCharacterSet *set3 = [NSCharacterSet characterSetWithCharactersInString:query];
	// 取补集
	NSCharacterSet *invertSet3 = set3.invertedSet;
	// 补集中的字符不进行编码
	NSString *encoded3 = [string stringByAddingPercentEncodingWithAllowedCharacters:invertSet3];
		
	if ([encoded2 isEqualToString:encoded3]) {
	    NSLog(@"结果相同");
	}
	```
* 补充几个方法

    ```
    // 取集合补集 NSMutableCharacterSet: NSCharacterSet
    @property (readonly, copy) NSCharacterSet *invertedSet;
    
    // 取并集 NSMutableCharacterSet
    - (void)formUnionWithCharacterSet:(NSCharacterSet *)otherSet;
    
    // 取交集 NSMutableCharacterSet
    - (void)formIntersectionWithCharacterSet:(NSCharacterSet *)otherSet;

    // 取补集 NSMutableCharacterSet
    - (void)invert;
    ```
