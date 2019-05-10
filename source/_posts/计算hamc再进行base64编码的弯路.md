---
title: 计算hamc再进行base64编码的弯路
date: 2019-05-10 15:46:12
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 踩的坑
tags:
- 踩的坑
---


* 签名阿里STS URL接口的时候，需要先进行 HMAC，然后对结果再进行 base64 编码。

<!--more-->
* 笔者的做法：计算出 HMAC 值，然后借用了网上的方法将得到的原始值按ASCII值输出成了另一个字符串，然后再转成 NSData 进行 base64 编码。

    ```objc 原始二进制数据以ASCII值保存为NSString
    - (NSString *)stringFromBytes:(uint8_t *)bytes length:(int)length {
        NSMutableString *strM = [NSMutableString string];
        for (int i = 0; i < length; i++) {
            [strM appendFormat:@"%02x", bytes[i]];
        }
        return [strM copy];
    }
    ```
    ```
    NSString *originDataToString = [self stringFromBytes:hmac length:CC_SHA1_DIGEST_LENGTH];
    
    // 此时的 data 是一个长得像原始数据ASCII值的字符串的二进制数据，查看二进制数据实际已经是不同的ASCII值了。
    NSData *data = [originDataToString dataUsingEncoding:NSUTF8StringEncoding];
    // 得到的编码根本不是原始数据的
    NSString *signature = [data base64EncodedStringWithOptions:0];
    ```
    事实上对计算出的 HMAC 值是不能取 NSString的。
    ```
    // 返回值为 nil
    [[NSString alloc] initWithData:originData encoding:NSUTF8StringEncoding]
    ```
* 正确的做法：计算出 HMAC 值，对原始字节数据直接转为 NSData，进行 base64 编码。

    ```
    NSData *originData = [NSData dataWithBytes:hmac length:CC_SHA1_DIGEST_LENGTH];
    // HMAC计算返回原始二进制数据后进行Base64编码
    NSString *signature = [originData base64EncodedStringWithOptions:0];
    ```
