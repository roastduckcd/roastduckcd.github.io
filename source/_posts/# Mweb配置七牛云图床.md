# Mweb配置七牛云图床

注意七牛云只有30天有效期，30天过后使用的连接都将失效。我这里仅作验证用。如果要长期有效，需要自己创建域名，但是要付费。要不就去找其他免费云图床···
* 首先注册和认证七牛云图床, 并且创建新的存储空间
![qiuniu_init_store_space](http://plzdzm54a.bkt.clouddn.com/qiuniu_init_store_space.jpg)
* 由于我用的 Mac 版 Mweb，来到`偏好设置-发布`,点击下面的`qiniu.com`
![MWeb_qiniu_add](http://plzdzm54a.bkt.clouddn.com/MWeb_qiniu_add.jpg)
* `Name`： 可以自定义
* `API URL`： 这里要选上面创建空间时对应的区域。如果没记住，可以在存储空间查看。
![qiniu_area](http://plzdzm54a.bkt.clouddn.com/qiniu_area.jpg)
* `Bucket Name`：空间名称, 一定要和创建空间时自定义的保持一致。
* `Access Key`和 `Secret Key` 可以在七牛`个人面板-密钥管理`中查看
![qiuniu_ak_sk](http://plzdzm54a.bkt.clouddn.com/qiuniu_ak_sk.jpg)
* `Domain`：域名
![qiniu_file_prefix](http://plzdzm54a.bkt.clouddn.com/qiniu_file_prefix.jpg)
* `image URL prefix`: 图片前缀，可不填

* 配置完后就可以使用了
写好文章，贴好图片，MWeb 菜单栏`发布-上传本地图片`
![MWeb_button_upload](http://plzdzm54a.bkt.clouddn.com/MWeb_button_upload.jpg)
* 开始上传图片
![MWeb_upload_image](http://plzdzm54a.bkt.clouddn.com/MWeb_upload_image.jpg)
* 由于 Mweb 并不能直接将文件中的本地图片路径替换为远程图片链接。所以要么自己一个一个复制粘贴，要么直接`Copy Markdown`然后覆盖源文件即可。但是这种情况下，文章编辑时图片不能显示，只有在预览中才能看到。


