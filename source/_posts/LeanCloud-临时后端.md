---
title: LeanCloud-临时后端
comments: true
toc: true
copyright: true
declare: true
categories:
  - 后端开发
tags:
  - leancloud
date: 2019-03-26 00:02:30
top:
---

###0. 安装
推荐使用cocoaPods安装，在Podfile中加入
```cocoapods
pod 'AVOSCloud'
pod 'AVOSCloudIM'
pod 'AVOSCloudCrashReporting'
```
<!--more-->
###1. 授权
首先LeanCloud新建你的应用，创建授权码
然后在项目中AppDelegate的didFinish中
```swift
AVOSCloud.setApplicationId("dS2R3o4CybP29RwY6sF59eKb-gzGzoHsz", clientKey: "lk6skH8LTD441i3u83DfFN47")
```
###2. 保存数据到云端
`SaveInBackground`  立即保存
`SaveEventually`    自动保存，有网立即，否则先缓存等有网再上传
```swift
func saveToLeanCloud(area: AreaMO) {
    //存储的对象数据必须是不可选的，否则保存出错
    //使用AVObject进行数据归档
    let avObject = AVObject(className: "Area")
    avObject.setObject(area.district! , forKey: "district")
    avObject.setObject(area.imageName!, forKey: "imageName")
    avObject.setObject(area.isWent, forKey: "isWent")
    
    let image = pickImageView.image!
    let factor = (image.size.width) > 1024 ? 1024 / (image.size.width) : 1024
    let scaledImage = UIImage(data: UIImageJPEGRepresentation(image, 1)!, scale: factor)
    let imageFile = AVFile(name: "\(String(describing:area.imageName!)).jpg", data: UIImageJPEGRepresentation(scaledImage!, 0.7)!)
    avObject.setObject(imageFile, forKey: "image")
    //立即保存
    avObject.saveInBackground { (isSuccess, error) in
        if isSuccess {
            print("leanCloud成功")
        }else {
            print(error!)
        }
    }
}
```
###3. 取回数据
```swift
//取回数据,取回的areas当中是Dictionary
//使用AVQuery根据数据表名请求，表明一定在LeanCloud存在
let query = AVQuery(className: "Area")
//默认异步处理,网络请求等耗时操作一般放在异步处理，主线程处理UI相关
//查询所有对象
query.findObjectsInBackground { (objects, error) in
    if let object = objects as? [AVObject] {
        self.areas = object
        //主线程中更新UI
        OperationQueue.main.addOperation {
            self.tableView.reloadData()
        }
    }else {
        print(error ?? "错误了")
    }
}
```
###4. AVFile媒体文件类型
自带的延迟加载图像:后台下载完毕再加载到界面
```swift
//延迟加载图片
//占位图片
cell.imageView?.image = UIImage(named: "photoalbum")
if let imageData = area["image"] as? AVFile{
    imageData.getDataInBackground({ (data, error) in
        if let data = data {
            cell.imageView?.image = UIImage(data: data)
        }else {
            print(error ?? "延迟加载图片出错")
        }
    })
}
```
###5. 数据排序
AVQuery自带排序功能
```swift
//根据创建时间排序
//排序规则名称为LeanCloud数据表列名，可到LeanCloud控制台查询
query.order(byDesending:"createdAt")
```
###6. 使用缓存： 
LeanCloud有查询缓存(默认未开启),获取数据缓存(默认开启)
1. 查询缓存
- 缓存选项
- - cachePolicy：缓存策略
- - - ignoreCache无缓存，查询一次
- - - cacheOnly仅缓存，查询一次
- - - cacheElseNetWork缓存有先，若无从网络查询，查询一次
- - - networkElseCache网络有限，若无从缓存查询，查询一次
- - - cacheThenNetwork先缓存查询一次，再从网络查询一次，查询两次
- maxCacheAge：缓存时间
