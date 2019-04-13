---
title: iOS蓝牙开发-后台处理
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - 功能开发
tags:
  - 蓝牙
date: 2019-04-13 23:39:02
top:
---

### 1. 进入后台时启用提示（app未声明后台模式）
如果app没有对后台进行处理，那么进入后台时应该提示用户，提升app可用
使用`connectPeripheral: options:`的`options`提示系统是否进行提醒。
<!--more-->

```
// 连接已经建立，app被挂起，系统是否显示提示框，默认为NO
CBConnectPeripheralOptionNotifyOnConnectionKey
// app和外围设备断连时，app被挂起，系统是否显示提示框
CBConnectPeripheralOptionNotifyOnDisconnectionKey
// 收到外围设备通知时进入后台，系统是否为所有通知显示提示框
CBConnectPeripheralOptionNotifyOnNotificationKey
```

### 2. 如果需要app进入后台后蓝牙仍能继续工作，只需要在`info.plist`中进行声明即可。
![另外你也有可能看到这种][2]
![此处输入图片的描述][3]
只需在`info.plist`中点击右键，选择`show raw keys/values`即可切换。
两个`key`可以同时存在。
这样我们就能在后台和平常一样使用蓝牙大多数蓝牙服务。
但是也有不同：

中心设备

* 调用`scanForPeripheralsWithServices: options:`时不会重复扫描相同设备。即便在`options`中声明了`CBCentralManagerScanOptionAllowDuplicatesKey`。
* 如果有多个app都在使用蓝牙，会导致扫描时间增多，影响发现外围设备的效率。

外围设备

* 广播时只会广播`uuid`，忽略`CBAdvertisementDataLocalNameKey`
* 包含UUID的数组不会通过广播包广播，而是通过一个特殊的“溢出”包，并且它只能被iOS设备发现。
* 如果有多个app都在使用蓝牙，广播频率会增加。

* 提醒
 * 提供界面让用户决定什么时候处理蓝牙事件。
 * 一旦app在后台被唤醒，只有10s时间来处理事件。否则可能被系统干掉。
 * 不能用于唤醒app，却执行与蓝牙无关的任务。

### 3. app被干掉后重新恢复蓝牙
* 使用状态保存
中心设备可保留：
 * 扫描选项和正在扫描的服务
 * 已连接和正在连接的外围设备
 * 订阅过的特征
 
 外围设备可保留：
 * 正在广播的数据
 * 发布到设备数据库的服务和特征
 * 订阅特征的值得中心设备
### 4. 使用
* 第一次初始化时添加用于恢复的唯一标识
```
// 中心设备
self.centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:nil options:@{CBCentralManagerOptionRestoreIdentifierKey: @"uniqueIDForCentral"}];
// 外围设备
self.peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:nil options:@{CBPeripheralManagerOptionRestoreIdentifierKey: @"uniqueIDForPeripheral}];
```
* app重新加载后，根据恢复标识重新初始化
重新恢复标识可以在`didFinishLaunchingWithOptions:`中获得
```
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // 中心设备恢复标识
    NSArray *centralBluetoothRestoreID = launchOptions[UIApplicationLaunchOptionsBluetoothCentralsKey];
    // 外围设备恢复标识
    NSArray *peripheralBluetoothRestoreID = launchOptions[UIApplicationLaunchOptionsBluetoothPeripheralsKey];
    return YES;
}
```
* 实现代理方法
```
// 中心设备
 - (void)centralManager:(CBCentralManager *)central willRestoreState:(NSDictionary<NSString *,id> *)dict {
}
// 外围设备
- (void)peripheralManager:(CBPeripheralManager *)peripheral willRestoreState:(NSDictionary<NSString *, id> *)dict {
}
``` 
 中心设备字典中包含的3个key：

* `CBCentralManagerRestoredStatePeripheralsKey`: app结束时所有已连接和正在连接的外围设备`NSArray<CBPeripheral *>`
* `CBCentralManagerRestoredStateScanServicesKey`: app结束时正在扫描的服务的UUID`NSArray<CBUUID *>`
* `CBCentralManagerRestoredStateScanOptionsKey`: app结束时扫描外围设备时使用的选项`NSDictionary`

外围设备包含2个key：

* `CBPeripheralManagerRestoredStateServicesKey`: app结束时所有已发布的服务`NSArray<CBMutableService *>`
* `CBPeripheralManagerRestoredStateAdvertisementDataKey`: app结束时广播数据时正在使用的选项`NSDictionary`

* 跟踪manager初始化进程


  [2]: http://oyo48xwkg.bkt.clouddn.com/933.png
  [3]: http://oyo48xwkg.bkt.clouddn.com/934.png




