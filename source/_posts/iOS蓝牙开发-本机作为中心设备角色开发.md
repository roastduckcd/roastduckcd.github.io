---
title: iOS蓝牙开发-本机作为中心设备角色开发
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 功能开发
tags:
  - 蓝牙
date: 2019-03-17 23:45:52
top:
---

顾名思义，就是本机搜索其他蓝牙设备进行读写。
`CBCentralManager`对象表示中心设备，用于管理已发现和已连接的外围设备。包括发现外围设备、发起连接、断开连接。
`CBPeripheral`对象表示外围设备。我们要获取数据就需要处理`CBPeripheral`对象中的服务(`CBService `)和特征(`CBCharacteristic`)
<!--more-->
![中心设备角色][1]

## CBCentralManagerDelegate协议部分
### 1. 创建中心设备管理对象
```
dispatch_queue_t queue = dispatch_get_global_queue(0, 0);
// queue 可以为nil，就在主线程中工作
self.centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:queue options:nil];
```
创建对象后会调用下面的代理方法，可以在其中检查蓝牙的状态
```
/**
 创建好中心设备对象后的回调，确定设备是否支持蓝牙以及是否可用

 *  @constant CBManagerStateUnknown      未知状态，立即刷新.
 *  @constant CBManagerStateResetting    重置蓝牙，链接暂时断开，立即刷新.
 *  @constant CBManagerStateUnsupported  设备不支持蓝牙4.0 .
 *  @constant CBManagerStateUnauthorized 应用尚未被授权.
 *  @constant CBManagerStatePoweredOff   蓝牙处于关闭状态.
 *  @constant CBManagerStatePoweredOn    蓝牙处于开启状态.
 */
- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
    // NS_ENUM形式的枚举，使用 == 判断
    if (CBManagerStatePoweredOn == central.state) {
        // do something 可以开始扫描什么的
        [self.centralManager scanForPeripheralsWithServices:nil options:nil]
    }
}
```
### 2. 搜寻外围设备
```
// 搜索给定UUID服务的外围设备，nil表示搜索所有的
[self.centralManager scanForPeripheralsWithServices:nil options:nil];
```
`options`是一个字典，指定两个选项

* `CBCentralManagerScanOptionAllowDuplicatesKey`：默认为NO(需要用NSNumber包装)，表示不会重复扫描已发现蓝牙设备，否则会增加耗电。但是笔者在实现时没发现有什么不同，都在不停扫。o(╯□╰) 关闭蓝牙重新连接就满足要求了 o(╯□╰)o
* `CBCentralManagerScanOptionSolicitedServiceUUIDsKey`：value是一个包含指定UUID服务的数组。

当扫描到一个外围设备时，触发代理。提升`peripheral`为属性以便之后继续使用。
```
/**
 搜寻到外围设备时调用，发现一个调用一次
 
 @param advertisementData 扫描时收到的广告包
 @param RSSI    信号强度，一个负数
 */
- (void)centralManager:(CBCentralManager *)central didDiscoverPeripheral:(CBPeripheral *)peripheral advertisementData:(NSDictionary<NSString *,id> *)advertisementData RSSI:(NSNumber *)RSSI {

    switch (peripheral.state) {
        case CBPeripheralStateDisconnected:
            NSLog(@"链接断开");
            break;
        case CBPeripheralStateConnecting:
            NSLog(@"链接ing");
            break;
        case CBPeripheralStateConnected:
            NSLog(@"链接建立");
            // 找到想要链接的设备时，应该终止搜索以节省电量。
            [self.centralManager stopScan];
            break;
        case CBPeripheralStateDisconnecting:
            NSLog(@"链接正在断开");
            break;
        default:
            break;
    }
    // 连接设备
    [self.centralManager connectPeripheral:peripheral options:nil];
}
```
`Tip`：

* 除非特殊情况（如需要根据信号强度来连接设备等）不对已发现设备重复扫描。
```
// 因为该key默认是NO，所以可以将 options 设为 nil
[self.centralManager scanForPeripheralsWithServices:nil options:@{CBCentralManagerScanOptionAllowDuplicatesKey: [NSNumber numberWithBool:NO]}];
```  
* 由于中心设备开启扫描后不会自动停止，所以苹果推荐在匹配到合适设备时主动停止。可以通过`CBPeripheral`的属性`name`或者`identifier(NSUUID *)`来确定我们需要的设备。一旦确定就可以调用`[self.centralManager stopScan]`终止扫描。

### 3. 连接外围设备
```
// 连接设备
[self.centralManager connectPeripheral:peripheral options:nil];
```
遵循协议`CBPeripheralDelegate`，实现对数据的读写
```
/**
 链接外围设备成功时调用，此时可以开始对外围设备进行读写了
 */
- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral {
    // 设定外围设备的代理  
    peripheral.delegate = self;
    [peripheral discoverServices:nil];
}
```

## CBPeripheralDelegate协议部分
### 4. 获取外围设备可用服务
```
// nil 会搜索所有服务
[peripheral discoverServices:nil]
```
成功发现服务时，调用代理
```
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error {
    // 所有可用服务都包含在其中
    for (CBService *service in peripheral.services) {
        // 180A 表示 Device infomation
        if ([service.UUID.UUIDString isEqualToString:@"180A"]) {
            [peripheral discoverCharacteristics:nil forService:service];
        }
    }
}
```
### 5. 获取服务的特征
```
// 获取指定服务的特征, nil 获取所有
[peripheral discoverCharacteristics:nil forService:service]
```
获取成功后，调用代理
```
/**
 发现特征时调用，调用一次
 */
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error {
    // 包含所有特征
    for (CBCharacteristic *characteristic in service.characteristics) {
        // 读取特征值
    }
}
```
`Tip`：因为一个外围设备有多个服务，一个服务又有多个特征，而一般我们只需要一部分服务或特征。所以我们在获取服务或特征时，通过UUID仅得到我们需要的即可。
```
// nil 会搜索所有服务，但是耗时耗能，所以尽量传入服务uuid
// 获取服务
[peripheral discoverServices:数组<CBUUID *>];

// 获取指定服务的特征
[peripheral discoverCharacteristics:数组<CBUUID *> forService:service];
```
### 6. 读写操作
特征中就含有我们需要读写的数据。注意不是所有特征值都可读写，依赖于外围设备对特征的配置。通过`CBCharacteristic`的属性`properties`是否包含以下枚举值来判断是否可读写。这是一个`CBCharacteristicProperties`类型的枚举，`NS_OPTIONS`表示枚举值可以组合。
```
typedef NS_OPTIONS(NSUInteger, CBCharacteristicProperties) {
    // 特征的值通过特征的描述符被广播出去
	CBCharacteristicPropertyBroadcast = 0x01,
	// 可读
	CBCharacteristicPropertyRead = 0x02,    
	// 可写，外围设备不会回传写入是否成功
	CBCharacteristicPropertyWriteWithoutResponse = 0x04,
	// 可写，外围设备告知中心设备写入是否成功，然后CBPeripheral调用相应代理
	CBCharacteristicPropertyWrite = 0x08,
	// 可订阅,中心设备是否收到通知不会告知外围设备
	CBCharacteristicPropertyNotify = 0x10,
	// 可订阅,中心设备是否收到通知会告知外围设备，然后CBCentral调用相应代理
	CBCharacteristicPropertyIndicate = 0x20,
	// 写入不成功时不会回传错误？？
	CBCharacteristicPropertyAuthenticatedSignedWrites = 0x40,
	// 可以在特征的属性描述符中添加额外的特征属性
	CBCharacteristicPropertyExtendedProperties = 0x80,
	// 只能订阅受信任设备广播的特征的值，不会告知外围设备是否收到通知
	CBCharacteristicPropertyNotifyEncryptionRequired NS_ENUM_AVAILABLE(10_9, 6_0) = 0x100,
	// 只能订阅受信任设备广播的特征的值，会告知外围设备是否收到通知
	CBCharacteristicPropertyIndicateEncryptionRequired NS_ENUM_AVAILABLE(10_9, 6_0) = 0x200
};
```
##### 读操作
通过直接读取或订阅的方式获取特征的值。

* 直接读取
```
// NS_OPTIONS形式的枚举，使用 & 判断是否包含
if (characteristic.properties & CBCharacteristicPropertyRead) {
    [peripheral readValueForCharacteristic:characteristic];
}
```

* 通过订阅的方式(推荐)，类似观察者
　　一次值读取就是一次交互，就要使用设备信号。如果一个特征的值可能变化可能不变时，直接读取就需要不停调用`readValueForCharacteristic:`方法。当一段时间内数据保持不变，使用`readValueForCharacteristic:`方法就会造成不必要的数据交互从而消耗电池。
　　如何避免呢？最好就是当特征的值变化时，外围设备通知相应的中心设备，中心设备收到通知在去读取值。
　　如何做到？使用订阅。
```
// 动态变化值使用通知订阅更高效
// 外围设备特征的值改变时，发出通知，订阅了该特征值的中心设备收到通知后更新值
// 不是所有特征值都可订阅，最好判断一下
if (characteristic.properties & CBCharacteristicPropertyNotify) {
　　[peripheral setNotifyValue:YES forCharacteristic:characteristic];
}
```
启用订阅后，调用代理
```
/**
 外围设备收到启用或停止通知请求后会调用
 */
- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {

    
}
```

读取或订阅的特征的值改变后，调用代理
```
/**
 特征值改变时调用, 两种读取方式都要走该代理
 @param error 读取特征值失败时
 */
- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
    // 得到特征值
    NSData *data = characteristic.value;
    NSString *str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}
```
##### 写操作
写入数据时以二进制数据操作，需要使用`NSData`包装。

一个特征是否可写入及写入方式，可通过`properties`是否包含`CBCharacteristicPropertyWriteWithoutResponse`或`CBCharacteristicPropertyWrite`确定。
```
if (characteristic.properties & CBCharacteristicPropertyWrite) {
    [peripheral writeValue:data forCharacteristic:characteristic type:CBCharacteristicWriteWithResponse];
    }
```
`CBCharacteristicWriteWithResponse`和`CBCharacteristicWriteWithoutResponse`，前者写入数据后调用下面的代理方法，告知我们写入是否成功。后者不会调用。
```
/**
 使用 CBCharacteristicWriteWithResponse 写入方式才调用该代理方法
 写入失败，则会通过error提示错误信息
 */
- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {

}
```

### 7. 断开连接

由于蓝牙广播或扫描时，使用的是设备信号。而设备信号也用于WIFI等其他功能。同时信号强度又会影响电池使用。为减小影响，需要最小化对信号的使用。

当中心设备订阅的特征不再发送通知后（`CBPeripheral`对象的`isNotifying`属性）或者 我们已经拿到所有需要的数据后，应该及时取消订阅然后断开和外围设备的连接。
```
// 为每一个订阅过的特征 设置 值 为 NO
[peripheral setNotifyValue:NO forCharacteristic:characteristic];
```
```
// 仅断开当前app与外围设备的连接，不会关闭蓝牙。因为可能有其他app也在使用蓝牙
[self.centralManager cancelPeripheralConnection:self.peripheral];
```
断开连接后，调用代理
```
- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {

    NSLog(@"disconnect error: %@", error.userInfo);
    // 异常断开，可以做重连
}
```
### 8. 重新连接

有三种重新获取外围设备的方式：

* 所需外围设备仅和本地app断连，但并未和中心设备断开连接，则应使用服务(`CBUUID *`)尝试获取`CBPeripheral`。成功 array 就不为空，从中选择需要的 `peripheral`。否则尝试后面两种方法。
```
NSArray *array = [central retrieveConnectedPeripheralsWithServices:数组<CBUUID *>];
```
* 本机保存(`NSUserDefault`等)着连接过的外围设备的(`identifier(NSUUID*`)，通过它尝试获取`CBPeripheral`。成功 array 就不为空，从中选择需要的 peripheral。否则尝试重新扫描。
```
NSArray *array = [central retrievePeripheralsWithIdentifiers:数组<NSUUID *>];
```
* 通过以上方式都未能重新连接，就只有重新扫描
`scanForPeripheralsWithServices: options:` 之后调用代理
`centralManager: didDiscoverPeripheral: advertisementData: RSSI:` 就能获取扫描到的`peripheral`

通过以上三种方式获取到需要的`peripheral`后仍然使用`connectPeripheral: options:`请求重新连接，最后调用相应代理。

     [1]: http://oyo48xwkg.bkt.clouddn.com/1254.png