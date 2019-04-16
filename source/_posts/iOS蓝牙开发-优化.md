---
title: iOS蓝牙开发-优化
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 功能开发
tags:
  - 蓝牙
date: 2019-04-14 23:30:27
top:
---

由于蓝牙广播或扫描时，使用的是设备信号。而设备信号也用于WIFI等其他功能。同时信号强度又会影响电池使用。为减小影响，需要最小化对信号的使用。
？？ 能否在同一设备上打开两个中心设备角色或外围设备角色
<!--more-->
## 本机作为中心设备角色开发优化
### 1. 尽量减少扫描时间
　　中心设备开启扫描后不会自动停止。所以我们需要匹配到合适设备时主动停止。
```
if 匹配到需要的外围设备 {
    [self.centralManager stopScan];
}
```
　　同时在开始扫描时除非特殊情况（如需要根据信号强度来连接设备）不对已发现设备重复扫描。
```
// 因为该key默认是NO，所以可以将 options 设为 nil
[self.centralManager scanForPeripheralsWithServices:nil options:@{CBCentralManagerScanOptionAllowDuplicatesKey: [NSNumber numberWithBool:NO]}];
```
### 2. 通过UUID来获取
　　因为一个外围设备有多个服务，一个服务又有多个特征，而一般我们只需要一部分服务或特征。所以我们在获取服务或特征时，通过UUID仅得到我们需要的即可。
```
// nil 会搜索所有服务，但是耗时耗能，所以尽量传入服务uuid
// 获取服务
[peripheral discoverServices:数组<CBUUID *>];

// 获取指定服务的特征
[peripheral discoverCharacteristics:数组<CBUUID *> forService:service];
```

### 3. 使用订阅的方式读取值
　　一次值读取就是一次交互，就要通过信号。如果一个特征的值可能变化可能不变时，就需要不停调用`readValueForCharacteristic:`方法。当一段时间内保持不变，使用`readValueForCharacteristic:`方法就会造成不必要的数据交互从而消耗电池。
　　如何避免呢？最好就是当特征的值变化时，外围设备通知相应的中心设备，中心设备收到通知在去读取值。
　　如何做到？使用订阅。
```
// 不是所有特征值都可订阅，最好判断一下
if (characteristic.properties & CBCharacteristicPropertyNotify) {
　　[peripheral setNotifyValue:YES forCharacteristic:characteristic];
}
```

### 4. 过河就拆桥
　　为减少信号的使用，当中心设备订阅的特征不再发送通知后（`CBPeripheral`对象的`isNotifying`属性）或者 我们已经拿到所有需要的数据后，应该及时取消订阅然后断开和外围设备的连接。
```
// 为每一个订阅过的特征 设置 值 为 NO
[peripheral setNotifyValue:NO forCharacteristic:characteristic];
```
```
// 断开连接
[self.centralManager cancelPeripheralConnection:self.peripheral];
```