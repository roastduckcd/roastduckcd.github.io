---
title: iOS蓝牙开发-本机作为外围设备角色开发
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 功能开发
tags:
  - 蓝牙
date: 2019-03-18 23:10:26
top:
---

本机作为服务提供者。

`CBPeripheralManager`对象表示外围设备（当前提供服务的app）。用于发布和广播服务，响应中心设备发来的读写请求。
`CBCentral`对象表示中心设备。我们需要处理它发过来的`request`。<!--more-->
![][1]

## CBPeripheralManagerDelegate协议

### 1. 创建外围设备管理对象
```
/*
 @param options 一个字典值
 *  用于在实例化时，蓝牙断开是否提示用户，默认为NO
 *  CBPeripheralManagerOptionShowPowerAlertKey : NSNumber Bool
 *  用于唯一标识外围设备对象的字符串 : NSString * (16位或32位或者是蓝牙技术联盟规定的16位标识)
 *  CBPeripheralManagerOptionRestoreIdentifierKey
 */
self.peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil options:nil];
```
创建好后调用代理方法检查蓝牙状态
```
/**
 *  成功实例化一个外围设备对象时调用，确定设备是否支持蓝牙以及是否可用
 */
- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral {
    // 判断状态
}
```
状态参数具体查看[相关概念章节中的CBManagerState部分][2]
### 2. 创建特征
```
/**
 创建一个特征
 */
- (CBMutableCharacteristic *)createCharacteristicWithUUID:(CBUUID *)uuid {
    CBMutableCharacteristic *characteristic =
      [[CBMutableCharacteristic alloc] initWithType:uuid
        properties:
         CBCharacteristicPropertyRead | CBCharacteristicPropertyWrite
        value:[@"songyang" dataUsingEncoding:NSUTF8StringEncoding]
        permissions:CBAttributePermissionsReadable];
        
    return characteristic;
}
```
`UUID`：特征的唯一标识，UUID相关请参看相关概念章节
`properties`：特征的属性，具体查看[相关概念章节中的CBCharacteristicProperties部分][2]
`value`：特征的值，如果在此处设置了值，那么值会被缓存并且properties和ermissions被设为只读。如果需要值可写或者值能动态变化，就需要实例化时置value为nil。
`permissions`：特征的值的权限。具体查看[相关概念章节中的CBAttributePermissions部分][2]。

`Tip`：两个特征的建议配置

* 订阅方式能使中心设备以较节能的方式获取值，这样外围设备也能做到在需要的时候才响应请求。所以苹果鼓励使用`CBCharacteristicPropertyNotify`。
* 为了保证安全，建议使用`CBCharacteristicPropertyNotifyEncryptionRequired`或者`CBCharacteristicPropertyIndicateEncryptionRequired`，只允许受信任设备交互，尤其是特征的值能被写入的情况。这样才会在链接时看到是否允许配对的界面框???。
* 另外要记得保持一致。总不能`properties`设了只读，然后`pemissions`又设成可写吧。
### 3. 创建服务
```
/**
 创建一个服务

 @param uuid 唯一标识
  param primary YES为主服务，用于描述一个设备的主要功能。主服务可以被其他服务引用。
                NO为次要服务,用于描述一个被它引用的其他服务的相关功能
                如计步器主要服务是记录步数，次要服务可以是记录时间，距离等。
 */
- (CBMutableService *)createServiceWithUUID:(CBUUID *)uuid {
    CBMutableService *service = [[CBMutableService alloc] initWithType:uuid primary:YES];
    return service;
}
```
将服务和特征进行关联
```
// 一个服务可以有多个特征
service.characteristics = @[characteristic];
```
### 4. 发布服务
```
/**
 发布服务
 * 一旦发布服务，服务和它的特征会被缓存，服务不能再被修改
 */
[self.peripheralManager addService:service];
```
 添加服务后调用代理
```
- (void)peripheralManager:(CBPeripheralManager *)peripheral didAddService:(CBService *)service error:(NSError *)error {
    // 处理后续或错误
}
```
### 5. 向外广播服务
　　
```
/**
 广播部分服务和特征。
 */
- (void)adviseServices:(NSArray *)services {
    for (CBMutableService *service in services) {
        // 广播数据
        [self.peripheralManager startAdvertising:@{CBAdvertisementDataServiceUUIDsKey :@[service.UUID]}];
    }
}
```
　　`startAdvertising:`的参数`advertisementData`是一个字典值，其中包含要广播出去的数据和它对应的`key`。需要注意的iOS中这些数据不仅对大小有限制，数据内容也有。比如广告包中虽然可以包含外围设备的很多信息，但是iOS中只能传递以下两个：
```
// CBPeripheralManager 仅支持两个key:
* `CBAdvertisementDataLocalNameKey` : value = 服务名称
* `CBAdvertisementDataServiceUUIDsKey` : value = 服务UUID数组
```
　　对于大小限制，一个广告包为31个字节，除去必要的2个字节作为头信息（数据段的长度和类型），剩下的为数据段。如果app正在运行，以上两个key代表的信息大小限制为28个字节；如果大小不够，在响应包中还能额外使用10个字节，但是仅能用于传递服务名字。
　　不符合已分配空间的UUID会加入一个特殊的“溢出”包，该类型数据包只能被iOS设备扫描？？？（此处还需填坑）。
如果app在后台运行，则只能通过“溢出”包广播服务的UUID。

蓝牙数据包格式：`Bluetooth 4.0 specification, Volume 3, Part C, Section 11`
参考链接:https://www.cnblogs.com/smart-mutouren/p/5882038.html
<br/>
开始广播服务后，会调用代理
```
- (void)peripheralManagerDidStartAdvertising:(CBPeripheralManager *)peripheral error:(NSError *)error {
    // 处理后续或错误
}
```
　　接下来就是等待中心设备扫描和连接。当连接建立后，就可以收到中心设备的请求并开始处理（通过代理方法）。

　　一旦链接建立，外围设备就不需要再广播广播包。因为设备间可以直接进行数据交互（交互方式？？？）。此时为了节省电量，应该及时停止广播：
```
[self.peripheralManager stopAdvertising];
```

`Tip`：

* 什么时候需要广播广播包？需要和中心设备连接的时候，如果有需要，甚至可以在创建好`CBPeripheralManager`对象后就开始广播。不过扮演外围角色的app并没有探测其他设备的方式，而用户是能直接知道的。所以最好提供一个界面让用户自己选择是否`startAdvitising:`。
* 发布服务和广播服务都必须在`powered on`状态下进行。
* 如果此时app进入后台，而我们又没有进行后台处理，广播会停止。

### 6. 响应中心设备发来的读写请求
##### 响应读取请求(两种方式)
* 中心设备调用`readValueForCharacteristic`发送读取请求，外围设备收到后，会调用代理
```
/**
 收到读取数据的请求
 @param request 读数据的请求，已被包装过（CBATTRequest对象）
 */
- (void)peripheralManager:(CBPeripheralManager *)peripheral didReceiveReadRequest:(CBATTRequest *)request {
    // 根据请求中的信息进行响应
    // 确认请求的特征UUID是否存在
    if ([request.characteristic.UUID isEqual:self.characteristic.UUID])
        {   }
    // 检查读取的偏移量(从哪开始读)是否超出本地数据长度
    if (request.offset > self.characteristic.value.length) {
        // 超出则返回越界错误
        [self.eripheralManager respondToRequest:request withResult:CBATTErrorInvalidOffset];
        return;
    }
    // 从请求的偏移量开始读取之后的数据
    request.value = [self.characteristic.value subdataWithRange:NSMakeRange(request.offset, self.characteristic.value.length - request.offset)];
    // 更新请求的值后，向中心设备回传请求结果（必须调用，成功则返回数据，失败返回错误）
    [self.peripheralManager respondToRequest:request withResult:CBATTErrorSuccess];
}
```
* 中心设备通过订阅方式读取数据
```
/**
 收到中心设备(setNotifyValue:YES forCharacteristic:)调用该代理
 */
- (void)peripheralManager:(CBPeripheralManager *)peripheral central:(CBCentral *)central didSubscribeToCharacteristic:(CBCharacteristic *)characteristic {
    // 修改特征值
    // centrals 为nil，表示向所有订阅了的中心设备发通知。当然也可以通过数组指定通知
    // 当发送通知的队列不足时，该方法返回NO；此时进入等待，当有可用队列时会触发代理peripheralManagerIsReadyToUpdateSubscribers:
    BOOL didSendValue = [myPeripheralManager updateValue:updatedValue forCharacteristic:characteristic onSubscribedCentrals:nil];
    if (!didSendValue) {
        // 将未发送的特征保存，之后重新发送
        [self.shouldSendArray addObject:characteristic];
    }
}
/**
 有可用队列时，调用该代理继续发送通知
 */
- (void)peripheralManagerIsReadyToUpdateSubscribers:(CBPeripheralManager *)peripheral {

    BOOL didSendValue = [self.peripheralManager updateValue:updatedValue forCharacteristic:characteristic onSubscribedCentrals:nil];
}
/**
 收到中心设备(setNotifyValue:NO forCharacteristic:)取消订阅特征的请求
 */
- (void)peripheralManager:(CBPeripheralManager *)peripheral central:(CBCentral *)central didUnsubscribeFromCharacteristic:(CBCharacteristic *)characteristic {

}
```

##### 响应写入请求
收到该请求，调用代理
```
/**
 收到中心设备写入数据的请求
 @param requests 写数据的请求，已被包装过。注意这里是数组，可能包含多个写请求
 */
- (void)peripheralManager:(CBPeripheralManager *)peripheral didReceiveWriteRequests:(NSArray<CBATTRequest *> *)requests {
    // 确认权限后，能写则写。写的时候也需要考虑偏移量
    myCharacteristic.value = request.value;
    // 如果所有请求都被完成，回传写入成功。随便取一个request
    // 如果数组中有任意一个请求完成失败，那么后续请求都不用再响应。直接将失败的原因回传
    // 该方法必须调用
    [self.peripheralManager respondToRequest:requests.firstObject withResult:CBATTErrorSuccess];
}
```

### 7. 调试问题
笔者在设备调试时，曾一直卡在以下问题上。
现填坑如下：

1. `XPC Connection invalid`
　　`CBPeripheralManager`对象需要被全局持有（使用属性）。如果你将Manager封装在B类中，然后在C类中使用；那么C类也需要全局持有B类。原因是`CBPeripheralManager`对象（包括`CBCentralManager`对象）是异步创建的，创建成局部对象会很快被释放。
参考链接：@蒋小飞http://www.jianshu.com/p/ec659ffcacfe的“编码”部分。
2. 设备不支持（state：unsupported）
　　这个一方面可能是你的设备真的不支持BLE（通过你的设备信息去了解），另一方面可能是项目配置问题。
　　笔者使用`mac app`项目作为外部设备，然后用真机作为中心设备。运行`mac app`时一直出现以上两个问题。解决如下：（运行环境macOS 10.13，xcode 9.2 beta）
`Targets`->`Capabilities`中勾选
![][5]


  [1]: http://oyo48xwkg.bkt.clouddn.com/1253.png
  [2]: http://www.jianshu.com/p/71bbf2346034
  [5]: http://oyo48xwkg.bkt.clouddn.com/1436.png