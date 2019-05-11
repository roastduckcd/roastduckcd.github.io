---
title: AliyunSTS策略
date: 2019-05-12 00:08:39
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 踩的坑
tags:
- Aliyun
- STS
---


### 简单概述
* [Demo](https://github.com/roastduckcd/AliyunUploader.git)
* 最近在使用阿里 OSS，需要通过使用 AccessKeyId/ AccessKeySecret 来进行请求验证。这两个字符串有3种级别。
<!--more-->
    * 阿里账号级别：可以访问账号中所有的云资源。
    * RAM角色级别：创建一个 RAM 角色，赋予指定资源的访问权限。该角色下创建的 AccessKeyId/ AccessKeySecret 只能访问指定的资源。
    * STS 临时访问凭证：使用 RAM 角色的 AccessKeyId/ AccessKeySecret 获取临时的 AccessKeyId/ AccessKeySecret 和 SecurityToken。在受限时间内访问指定资源。有效期在 15min ~ 1h 之间。
* 访问阿里 URL 时，需要使用 AccessKeyId/ AccessKeySecret 对 URL 的部分字段进行签名。[访问控制](https://help.aliyun.com/document_detail/31950.html?spm=a2c4g.11186623.6.1138.7559734ccwPv27)
* 处于安全原因，阿里推荐使用 STS 凭证。[STS临时授权访问OSS](https://help.aliyun.com/document_detail/100624.html?spm=5176.10695662.1996646101.searchclickresult.670230bd5sHH06)
    * STS 必须要创建 RAM 角色。
    * 创建 RAM 角色下的 AccessKeyId/ AccessKeySecret
    * 使用 RAM 角色下的 Id 和 Secret 通过 AssumeRole API获取临时凭证(Id,Secret和SecurityToken)。这一步阿里推荐(放弃了 `OSSStsTokenCredentialProvider`类)后端来做，移动端通过后端接口直接拿到临时凭证。原因是避免 Id 和 Secret 放在移动端被逆向出来。
    * 再使用临时凭证访问 OSS
* STS API参考[Aliyun访问控制](https://help.aliyun.com/document_detail/28761.html?spm=a2c4g.11186623.6.703.1c5f3289zht6hs)

### STS api
* 上面提到 STS 逻辑应该后端来做。如果非要前端或移动端处理，阿里也提供了 [API](https://help.aliyun.com/document_detail/28756.html?spm=a2c4g.11186623.6.698.2ac96202twPd7T)

#### endpoint
* 笔者开通的是杭州的服务 `sts.cn-hangzhou.aliyuncs.com`。[这里查询](https://help.aliyun.com/document_detail/66053.html?spm=a2c4g.11186623.6.712.57386a5dIDY2bi)
* http method 可以是 GET 或 POST。这里使用 GET。

#### parameter
* 参数有[公共参数](https://help.aliyun.com/document_detail/28759.html?spm=a2c4g.11186623.6.701.602638dfjhWE9f)和[AssumeRole接口参数](https://help.aliyun.com/document_detail/28763.html?spm=a2c4g.11186623.6.705.73c632894JGarO)。

    ```objc 形成参数字典
    - (NSDictionary *)commonParameter {

        NSMutableDictionary *mDic = [NSMutableDictionary dictionary];
    
        mDic[@"Format"] = @"JSON";
        mDic[@"Version"] = @"2015-04-01";
        mDic[@"SignatureMethod"] = @"HMAC-SHA1";
        mDic[@"SignatureVersion"] = @"1.0";
    
        // 8601标准UTC: YYYY-MM-ddThh:mm:ssZ
        mDic[@"Timestamp"] = [NSDate get8601UTC];
        // 时间戳作随机数
        mDic[@"SignatureNonce"] = [NSDate getTimeStamp];
        mDic[@"AccessKeyId"] = AccessKeyId;
    
        return [mDic copy];
    }
    
    - (NSDictionary *)assumeRoleParameter {

        NSMutableDictionary *mDic = [NSMutableDictionary dictionary];
    
        mDic[@"Action"] = @"AssumeRole";
        mDic[@"RoleArn"] = @"acs:ram::166435498213570:role/roastduck";
        mDic[@"RoleSessionName"] = @"InjectMWeb";
    
        // 临时token的权限, 缺省则为角色指定的所有权限
    //    NSDictionary *policyDic = @{@"Statement":@[@{@"Action":@"oss:*",@"Effect":@"Allow",@"Resource": @"*"}],@"Version": @"1"};
    //    mDic[@"Policy"] = [self dictToJsonString:policyDic];
    
        // 临时 token 生命周期,单位:秒, 15min ~ 1h，默认 1h
    //    mDic[@"DurationSeconds"] = @3600;
    
        return [mDic copy];
    }
    ```
    * `SignatureNonce`是唯一随机字符串，所以笔者使用了时间戳。
    * 上面 `NSDate`的两个方法是笔者自己写的分类。
    * `RoleArn` 可以在角色管理中查看。
    * `RoleSessionName` 根据你的需求来。

#### sign
* [签名步骤](https://help.aliyun.com/document_detail/28761.html?spm=a2c4g.11186623.6.703.780b6d27SsPwg5)
* 签名时，参数字典中不能有 `Signature` 字段，这个最后赋值。
* 对字典排序，排序方式为字典序（英文字母顺序）。由于 NSDictionary 没有排序的方法。因此笔者是对 `allKeys`进行排序，然后遍历数组，根据排好序的 `key` 获取对应的 `object`。

    ```objc 对字典key排序
    - (NSArray *)ascKeysInParameterDic:(NSDictionary *)parameterDic {
    
        NSArray *sortedKeys = [parameterDic.allKeys sortedArrayUsingComparator:^NSComparisonResult(id  _Nonnull obj1, id  _Nonnull obj2) {
            return [obj1 compare:obj2 options:NSLiteralSearch];
        }];
        return sortedKeys;
    }
    ```
    排好序的数组
    ```
    <__NSArrayI 0x60000260cfc0>(
        AccessKeyId,
        Action,
        Format,
        RoleArn,
        RoleSessionName,
        SignatureMethod,
        SignatureNonce,
        SignatureVersion,
        Timestamp,
        Version
    )
    ```
* 按排好序的key获取object, 并对 key 和 value 分别进行 URL 编码。然后用 `=` 将两者连接：`URLEncode(key)=URLEncode(value)`。最后用 `&` 将每对 `URLEncode(key)=URLEncode(value)` 连接。编码规则参照签名步骤中 1 - ii。
    ```objc Ali 指定编码方式
    - (NSString *)encodeURLParameterString:(NSString *)originString {

        NSRange lowerChars = NSMakeRange((unsigned int)'a', 26);
        NSMutableCharacterSet *lowerCharsSet = [NSMutableCharacterSet characterSetWithRange:lowerChars];
    
        NSRange upperChars = NSMakeRange((unsigned int)'A', 26);
        NSMutableCharacterSet *upperCharsSet = [NSMutableCharacterSet characterSetWithRange:upperChars];
    
        // range.location need unicode value
        NSRange numChars = NSMakeRange(48, 10);
        NSMutableCharacterSet *numCharsSet = [NSMutableCharacterSet characterSetWithRange:numChars];
    
        NSMutableCharacterSet *specialSet = [NSMutableCharacterSet characterSetWithCharactersInString:@"-_.~"];
    
        [specialSet formUnionWithCharacterSet:lowerCharsSet];
        [specialSet formUnionWithCharacterSet:upperCharsSet];
        [specialSet formUnionWithCharacterSet:numCharsSet];
    
        NSString *encodedString = [originString stringByAddingPercentEncodingWithAllowedCharacters:specialSet];
    
        encodedString = [encodedString stringByReplacingOccurrencesOfString:@"+" withString:@"%20"];
    
        return encodedString;
    }    
    ```
    > [iOS-URL编码](http://roastduck.xyz/article/iOS-URL编码.html)
    
* 将上面的 `encodedString` 按照 `HTTPMethod`+`&`+`URLENCODE(/)`+`&`+`encodedString` 再拼接即得到待签名字符串。

    ```objc
    NSString *URLStringToSign = [NSString stringWithFormat:@"%@&%@&%@", @"GET", [self encodeURLParameterString:@"/"], encodedString];
    ```
    
* 对 `URLStringToSign` 计算 HMAC-SHA1 值。`AccessKeySecret`+`&` 作为 HMAC 需要的 hmac-key。并且对计算后的原始数据进行 base64 编码。

    ```objc 签名
    #import <CommonCrypto/CommonCrypto.h>
    
    NSString *key = [NSString stringWithFormat:@"%@&", AccessKeySecret];
    
    // 取得二进制数据
    NSData *encodeKey = [key dataUsingEncoding:NSUTF8StringEncoding];
    
    NSData *data = [URLStringToSign dataUsingEncoding:NSUTF8StringEncoding];
    
    unsigned char hmac[CC_SHA1_DIGEST_LENGTH];
    // 系统函数
    CCHmac(kCCHmacAlgSHA1, [encodeKey bytes], encodeKey.length, [data bytes], data.length, &hmac);

    NSData *originData = [NSData dataWithBytes:hmac length:CC_SHA1_DIGEST_LENGTH];
    
    // HMAC计算返回原始二进制数据后进行Base64编码
    NSString *signature = [originData base64EncodedStringWithOptions:0];
    ```
    * 这里计算 Base64 一定是使用原始数据，也就是 hmac的二进制。
    * [千万不要将 hmac 转为 NSString 再进行 base64](http://roastduck.xyz/article/计算hamc再进行base64编码的弯路.html)

* 将 `Signature` 字段添加到参数字典。再按照 `key=value` 的形式拼接到 `https://sts.cn-hangzhou.aliyuncs.com/?`后面。
    
    
