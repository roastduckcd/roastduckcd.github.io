---
title: 读一读源码-MJExtension
date: 2019-05-05 22:24:31
comments: true
toc: true
copyright: true
declare: true
top:
categories:
- iOS
- 源码解读
tags:
- MJExtension
---


* `MJExtension`是json转模型相当便捷的一个三方库。本本为一窥其内部奥妙，文中肯定有不足之处，敬请指正。

<!--more-->
* json 的一个`{}`就是一个json对象，对应iOS开发json数据可类比NSDictionary,`{}`就可看做一个模型类，其他json类型就可看做这个模型类的属性。解析是`{}`解析为`NSDictionary`,`[]`为`NSArray`,字符串为`NSString`,数字类型为`NSNumber`。
* 我平时常用MJExtension。其他的比如YYModel，功能上要丰富一些。这里就先看看MJ啦。
* 来看看MJ的结构：
![MJExtension][6]
如果属性名和json数据中的key完全相同，核心模块主要就是红色部分。
* 功能实现都是以`NSObject`的分类实现，所以任何继承自`NSObject`的子类都可调用。

* 我们先来看看如何提供一些自定义功能的，有两种方式：一者通过在模型类实现`MJKeyValue`协议，一者通过`NSObject+MJProperty`和`NSObject+MJClass`中对应的类方法。

* 以下只列出设置属性白名单的代码，其他请自行查看，处理方式大同小异。

 * 协议
```objc
@protocol MJKeyValue <NSObject>
@optional
/**
 *  只有这个数组中的属性名才允许进行字典和模型的转换
 */
+ (NSArray *)mj_allowedPropertyNames;
@end
```
* 因为`NSObject+MJKeyValue`分类已经遵守了协议，所以模型类可以直接实现就是。

 * 类方法
先看调用：
```
[Person mj_setupAllowedPropertyNames:^NSArray *{
            return @[@"name", @"sex"];
        }];
```
* 其实这个方法类似一个setter方法,不过这里是类方法的形式
```
/**
 *  属性白名单配置
 */ 
+ (void)mj_setupAllowedPropertyNames:
   (MJAllowedPropertyNames)allowedPropertyNames {
    // 内部就是将block返回的数组绑定到MJAllowedPropertyNamesKey
    [self mj_setupBlockReturnValue:allowedPropertyNames key:&MJAllowedPropertyNamesKey];
}
/**
 *  利用 runtime 通过 kvc 方式绑定设置的属性白名单到模型类,否则为nil
 */
+ (void)mj_setupBlockReturnValue:(id (^)(void))block key:(const char *)key {
    if (block) {
        objc_setAssociatedObject(self, key, block(), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    } else {
        objc_setAssociatedObject(self, key, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }

    [[self dictForKey:key] removeAllObjects];
}
/**
 *  根据key返回对应的保存自定义数据的字典
 */
+ (NSMutableDictionary *)dictForKey:(const void *)key {
    @synchronized (self) {
        if (key == &MJAllowedPropertyNamesKey)
            return allowedPropertyNamesDict_;
        if (key == &MJIgnoredPropertyNamesKey)
            return ignoredPropertyNamesDict_;
        if (key == &MJAllowedCodingPropertyNamesKey)
            return allowedCodingPropertyNamesDict_;
        if (key == &MJIgnoredCodingPropertyNamesKey)
            return ignoredCodingPropertyNamesDict_;
        return nil;
    }
}
```
* `objc_setAssociatedObject`设置关联，对应`objc_getAssociatedObject`就是获取关联值。
* 这里用到了`runtime`的关联机制，常常看到在分类中添加属性就是利用这个机制。因为这种方式是基于`key`的，所以MJ声明了一些静态全局常量。这里展示的`MJAllowedPropertyNamesKey`就是一个`char`型静态全局常量，作用是作为关联block返回值的key。当然还有其他的key，这里不一一列举。
* 同时也声明一个静态全局字典`allowedPropertyNamesDict_`，目的是以当前类名作为`key`，将当前类及父类中关联的block返回值保存。
* 这里字典的初始化MJ放在了分类的`+(void)load`方法中，该方法只在App启动时加载一次。如果父类，子类和分类都实现了该方法，执行顺序是父类>子类>分类。执行该方法时，程序必定会阻塞，所以要尽量少的在其中执行任务。
* 最后拿到字典进行清空，笔者没猜到意图。牵强地推测下：`allowedPropertyNamesDict_`是全局的，如果有同一个类重复调用setup方法，新的数据会追加在字典中。而如果存在二次调用，应该是不需要之前的自定义数据才是(直接更新自定义就是呗···)。
* 另外`+dictForKey`方法在`NSObject+MJProperty`和`NSObject+MJClass`中都有，笔者在调试时遇到了点小问题。比如在`MJClass`中执行时，`step in`会跳到`MJProperty`中的该方法。

* 既然上面的方法类似setter，当然就有类似的getter方法了。
```
/**
 *  获取当前类及所有父类的白名单属性
 */
+ (NSMutableArray *)mj_totalAllowedPropertyNames {
    return [self mj_totalObjectsWithSelector:@selector(mj_allowedPropertyNames) key:&MJAllowedPropertyNamesKey];
}
/**
 *  
 */
+ (NSMutableArray *)mj_totalObjectsWithSelector:(SEL)selector key:(const char *)key {
    // 先尝试获取本类的白名单，有则返回，无则通过协议或block获取
    // 其实就是  [dict objectForkey:]
    NSMutableArray *array = [self dictForKey:key][NSStringFromClass(self)];
    if (array) return array;
    
    // 创建、存储
    // 其实就是  [dict setObject: forKey:]
    // 以本类名为key，value为本类及所有父类的属性白名单的数组
    [self dictForKey:key][NSStringFromClass(self)] = array = [NSMutableArray array];
    // 是否响应白名单的协议方法
    if ([self respondsToSelector:selector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        // 拿到白名单
        NSArray *subArray = [self performSelector:selector];
#pragma clang diagnostic pop
        if (subArray) {
            [array addObjectsFromArray:subArray];
        }
    }
    // 向上遍历拿到当前类及所有父类的白名单，并加入数组
    [self mj_enumerateAllClasses:^(__unsafe_unretained Class c, BOOL *stop) {
        NSArray *subArray = objc_getAssociatedObject(c, key);
        [array addObjectsFromArray:subArray];
    }];
    return array;
}
```
* 处理自定义部分的思路：先利用runtime将预定义的全局key和自定义部分(以OC数据结构返回，如NSArray)关联。获取时先尝试从协议方法中获取自定义部分，然后再从本类或父类根据全局key关联的数据结构中获取。
* `+mj_enumerateAllClasses`遍历当前类及其父类，里面就是一个while循环获取父类，就不再多说了。
* 
`#pragma clang diagnostic push`
`#pragma clang diagnostic ignored "-Warc-performSelector-leaks"`
`#pragma clang diagnostic pop`
以上3个命令是用来忽略一些编译器警告，push和pop一定搭配使用。
* 由于篇幅太多，这里只看了白名单设置。所有处理自定义部分的思路基本就是上面这些，当然具体细节还有点不同。比如获取时，如果即实现了协议方法和自定义block，白名单包括黑名单设置会将两个部分都保存；而其他如属性替换部分则会执行协议方法，放弃自定义block中的部分。

接下来看看`json`转`model`的调用：
```
Pili *budaixi = [Pili mj_objectWithKeyValues:data];
```
* 工厂方法返回一个转换后的模型实例，来看具体实现：
```
+ (instancetype)mj_objectWithKeyValues:(id)keyValues {
    return [self mj_objectWithKeyValues:keyValues context:nil];
}

+ (instancetype)mj_objectWithKeyValues:(id)keyValues context:(NSManagedObjectContext *)context {
    // 判断传入参数是否已经解析成Json，否则使用NSJsonSerialization解析
    keyValues = [keyValues mj_JSONObject];
    // 判断解析后的数据是否是字典对象,如果不是基本上json数据格式有问题了吧
    // MJ自己实现的断言，满足条件继续执行，否则抛出错误
    MJExtensionAssertError([keyValues isKindOfClass:[NSDictionary class]], nil, [self class], @"keyValues参数不是一个字典");
    // 接下来是和数据库相关的
    if ([self isSubclassOfClass:[NSManagedObject class]] && context) {
        NSString *entityName = [NSStringFromClass(self) componentsSeparatedByString:@"."].lastObject;
        return [[NSEntityDescription insertNewObjectForEntityForName:entityName inManagedObjectContext:context] mj_setKeyValues:keyValues context:context];
    }
    return [[[self alloc] init] mj_setKeyValues:keyValues];
}
```
* 注意`keyValues`是`id`类型,当我们从网络获取到`responseData`后，可以不做处理直接传入。因为`MJExtension`会做json解析。
* 平常`debug`时可以尝试使用断言,设定一些前置条件，可以省去一些调试步骤。一般使用系统的`NSAssert`即可
* 最后初始化并调用实例方法进行转换

先看看如何做的json解析
```
- (id)mj_JSONObject
{
    if ([self isKindOfClass:[NSString class]]) {
        // 传入的是一个json字符串,类似@"{\"name\":\"yaya\"}"，先转成Data
        return [NSJSONSerialization JSONObjectWithData:[((NSString *)self) dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:nil];
    } else if ([self isKindOfClass:[NSData class]]) {
        // 如果外部没解析过数据，在这处理
        return [NSJSONSerialization JSONObjectWithData:(NSData *)self options:kNilOptions error:nil];
    }
    // 模型 -> 字典
    return self.mj_keyValues;
}
```
* 该方法有两个作用：一是对源json数据进行解析；二是对自定义模型转字典，如果不是自定义模型则直接返回原数据
* 能使用`self.mj_keyValues`并不是声明了一个属性，而是直接写了一个`getter`形式的方法。目的是用于模型转字典，这里并没有调用，所以我们到后面再说：
```
- (NSMutableDictionary *)mj_keyValues {
    return [self mj_keyValuesWithKeys:nil ignoredKeys:nil];
}
```

然后我们`step out`往后进入核心代码：
```
- (instancetype)mj_setKeyValues:(id)keyValues
{
    return [self mj_setKeyValues:keyValues context:nil];
}

/**
 核心代码：
 */
- (instancetype)mj_setKeyValues:(id)keyValues context:(NSManagedObjectContext *)context
{
    // 获得解析后的JSON对象
    // 在这里其实没做什么
    keyValues = [keyValues mj_JSONObject];
    // 类型判断
    MJExtensionAssertError([keyValues isKindOfClass:[NSDictionary class]], self, [self class], @"keyValues参数不是一个字典");
    
    Class clazz = [self class];
    // 获取当前类及所有父类的白名单属性
    NSArray *allowedPropertyNames = [clazz mj_totalAllowedPropertyNames];
    // 获取当前类及所有父类的黑名单属性
    NSArray *ignoredPropertyNames = [clazz mj_totalIgnoredPropertyNames];
    
    //通过封装的方法回调一个通过运行时编写的，用于返回属性列表的方法。
    // 遍历每一个属性名
    [clazz mj_enumerateProperties:^(MJProperty *property, BOOL *stop) {
    // 核心转换的block，暂时缺省
    ······
    }];
    
    // 转换完毕
    if ([self respondsToSelector:@selector(mj_keyValuesDidFinishConvertingToObject)]) {
        [self mj_keyValuesDidFinishConvertingToObject];
    }
    return self;
}
```
* 注释都在代码中了，核心逻辑就在这里完成，主要就是保证属性和值类型一致，否则赋值为nil。
* 由于block是异步执行的，从业务逻辑上来说block是在`+mj_enumerateProperties`方法之后执行。所以这里暂时缺省，放到后面说。
* `[clazz mj_enumerateProperties:^(MJProperty *property, BOOL *stop) {}`
在这个方法中利用`runtime`获取当前模型类的所有属性，并将属性的** 类型**,**名字**,**类型编码**等分别拆开。用内部模型`MJProperty`保存这些变量。然后在block中对每一个属性进行转换。
* 说一说遍历吧。这里MJ自己写了一个`enumerate`,其实`Foundation`中`NSArray`,`NSDictionary`以及`NSSet`都有`enumerateObjectsUsingBlock`方法（实际名称有所差别）。如果对`index`不感兴趣，使用自带的遍历方法能使代码更加清晰。

来看看`+mj_enumerateProperties`
```
+ (void)mj_enumerateProperties:(MJPropertiesEnumeration)enumeration {
    // 获得本类及父类所有属性,并包装成MJProperty对象
    NSArray *cachedProperties = [self properties];
    
    // 遍历每一个包装的属性,在block中进行类型转换并赋值
    BOOL stop = NO;
    for (MJProperty *property in cachedProperties) {
        enumeration(property, &stop);
        if (stop) break;
    }
}
```
没什么说的，继续深入：
```
/**
 runtime获取当前类的属性,转换成MJProperty对象保存到数组，再将数组关联到本类
 */
+ (NSMutableArray *)properties {
    // 尝试获取已经包装过的属性
    NSMutableArray *cachedProperties = [self dictForKey:&MJCachedPropertiesKey][NSStringFromClass(self)];
    // 没有存储过属性
    if (cachedProperties == nil) {
        cachedProperties = [NSMutableArray array];
        // 遍历本类及所有父类，获取所有属性并拆解包装成MJProperty对象
        [self mj_enumerateClasses:^(__unsafe_unretained Class c, BOOL *stop) {
            // 1.获得所有的成员变量
            unsigned int outCount = 0;
            // 获取当前类的属性列表
            objc_property_t *properties = class_copyPropertyList(c, &outCount);
            
            // 2.遍历每一个成员变量,并打包成一个MJProperty对象
            for (unsigned int i = 0; i<outCount; i++) {
                // 将属性保存为MJProperty对象
                MJProperty *property = [MJProperty cachedPropertyWithProperty:properties[i]];
                // 如果属性所在的类不是自定义模型类就进行下次循环
                if ([MJFoundation isClassFromFoundation:property.srcClass]) continue;

                // 设置属性所在的模型类
                property.srcClass = c;
                // 处理多级映射及替换
                [property setOriginKey:[self propertyKey:property.name] forClass:self];
                // 处理数组中的自定义类型
                [property setObjectClassInArray:[self propertyObjectClassInArray:property.name] forClass:self];
                // 保存对象化的属性
                [cachedProperties addObject:property];
            }
            
            // 3.释放内存
            free(properties);
        }];
        // 就是赋值，将存储属性(MJProperty)的数组根据对应key保存
        [self dictForKey:&MJCachedPropertiesKey][NSStringFromClass(self)] = cachedProperties;
    }
    return cachedProperties;
}
```
* `MJCachedPropertiesKey`也是一个全局key，对应一个字典，该字典的key是本类类名，value是保存包装过的属性的数组。
* `objc_property_t *properties = class_copyPropertyList(c, &outCount)`
声明一个`objc_property_t`类型的指针变量，指向一个同类型的动态分配的指针数组。因此所有class_copy系列使用之后，都要记得free。
[静态指针与动态指针的free][2]

接下来进入：
```
+ (void)mj_enumerateClasses:(MJClassesEnumeration)enumeration {
    // 1.没有block就直接返回
    if (enumeration == nil) return;
    
    // 2.停止遍历的标记
    BOOL stop = NO;
    
    // 3.当前正在遍历的类
    Class c = self;
    
    // 4.开始遍历每一个类
    while (c && !stop) {
        // 4.1.执行操作
        enumeration(c, &stop);
        
        // 4.2.获得父类
        c = class_getSuperclass(c);

        // 4.3.如果是OC类，结束循环
        if ([MJFoundation isClassFromFoundation:c]) break;
    }
}
```
* 又是一个while循环获取父类。不同的是多了最后一个Foundation类判断。
```
MJFoundation.m

+ (NSSet *)foundationClasses {
    if (foundationClasses_ == nil) {
        // 集合中没有NSObject，因为几乎所有的类都是继承自NSObject，具体是不是NSObject需要特殊判断
        foundationClasses_ = [NSSet setWithObjects:
                              [NSURL class],
                              [NSDate class],
                              [NSValue class],
                              [NSData class],
                              [NSError class],
                              [NSArray class],
                              [NSDictionary class],
                              [NSString class],
                              [NSAttributedString class], nil];
    }
    return foundationClasses_;
}
/**
 *  判断类型是Foundation类还是自定义类
 */
+ (BOOL)isClassFromFoundation:(Class)c {
    if (c == [NSObject class] || c == [NSManagedObject class]) return YES;
    
    __block BOOL result = NO;
    [[self foundationClasses] enumerateObjectsUsingBlock:^(Class foundationClass, BOOL *stop) {
        if ([c isSubclassOfClass:foundationClass]) {
            result = YES;
            // 结束遍历
            *stop = YES;
        }
    }];
    return result;
}
```
* 这个方法的作用是为了得到自定义的模型类
* `+isSubclassOfClass`判断两个类是否是父子关系或相等。
* 由于很多类都是NSObject的子类，所以排除`NSObject`需要单独判断

接下来看看如何将获取到的属性拆解并包装成MJProperty对象：
```
+ (instancetype)cachedPropertyWithProperty:(objc_property_t)property {
    // 当前属性是否已经缓存过
    // 若是直接返回
    // 若否进行拆解
    MJProperty *propertyObj = objc_getAssociatedObject(self, property);
    if (propertyObj == nil) {
        propertyObj = [[self alloc] init];
        propertyObj.property = property;
        // 呼应上面的objc_get
        objc_setAssociatedObject(self, property, propertyObj, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    }
    return propertyObj;
}
// set方法
- (void)setProperty:(objc_property_t)property
{
    _property = property;
    
    MJExtensionAssertParamNotNil(property);
    
    // 1.属性名
    _name = @(property_getName(property));
    
    // 2. 对属性字符串截取出OC使用的类型
    NSString *attrs = @(property_getAttributes(property));
    NSUInteger dotLoc = [attrs rangeOfString:@","].location;
    NSString *code = nil;
    NSUInteger loc = 1;
    if (dotLoc == NSNotFound) {
        code = [attrs substringFromIndex:loc];
    } else {
        code = [attrs substringWithRange:NSMakeRange(loc, dotLoc - loc)];
    }
    // 3.属性类型:包装成MJPropertyType对象
    _type = [MJPropertyType cachedTypeWithCode:code];
}
```
* `property_getAttributes`获取的属性字符串是经过OC类型编码的
比如 `@property (nonatomic, copy) NSString *name;`
编码 `@"T@\"NSString\",&,N,V_name"`
`T@\"NSString\"`:表示NSString类型
`C`:表示copy关键字
`N`:表示nonatomic关键字
`V_name`:表示属性名name
 * 属性编码一定是`T`开头后面紧跟类型编码，属性名以`V`开头后面紧跟属性名或实例变量名(有`_`)，然后各部分以逗号分隔。属性字符串是含转义字符的，使用`p`命令可以看到。
 * 详情查看开发者官网[Property Type String][3]和[Type Coding][4]
* 以上面name为例,截取后值剩下`@\"NSString\"`。只需要再截取出`NSString`字符串，然后利用反射机制就能得到`NSString`类型。

对于属性类型，MJ 又包装成了`MJPropertyType`对象：
```
+ (instancetype)cachedTypeWithCode:(NSString *)code {
    MJExtensionAssertParamNotNil2(code, nil);
    @synchronized (self) {
        // 当前类型是否已经缓存过
        // 若是直接返回
        // 若否进行包装
        MJPropertyType *type = types_[code];
        if (type == nil) {
            type = [[self alloc] init];
            type.code = code;
            types_[code] = type;
        }
        return type;
    }
}

- (void)setCode:(NSString *)code
{
    _code = code;
    
    MJExtensionAssertParamNotNil(code);
    
    if ([code isEqualToString:MJPropertyTypeId]) {
        // id 类型
        _idType = YES;
    } else if (code.length == 0) {
        _KVCDisabled = YES;

    } else if (code.length > 3 && [code hasPrefix:@"@\""]) {

        // 去掉 @\" 和 " ，截取中间的类型名称
        _code = [code substringWithRange:NSMakeRange(2, code.length - 3)];
        // 反射机制
        _typeClass = NSClassFromString(_code);
        // 对象类型是否属于Foundation
        _fromFoundation = [MJFoundation isClassFromFoundation:_typeClass];
        // 是否是NSNumber对象
        _numberType = [_typeClass isSubclassOfClass:[NSNumber class]];
        
    } else if ([code isEqualToString:MJPropertyTypeSEL] ||
               [code isEqualToString:MJPropertyTypeIvar] ||
               [code isEqualToString:MJPropertyTypeMethod]) {
        // SEL类型，成员变量，IMP类型
        _KVCDisabled = YES;
    }
    
    // 基本数据类型
    NSString *lowerCode = _code.lowercaseString;
    NSArray *numberTypes = @[MJPropertyTypeInt, MJPropertyTypeShort, MJPropertyTypeBOOL1, MJPropertyTypeBOOL2, MJPropertyTypeFloat, MJPropertyTypeDouble, MJPropertyTypeLong, MJPropertyTypeLongLong, MJPropertyTypeChar];
    if ([numberTypes containsObject:lowerCode]) {
        _numberType = YES;
        
        if ([lowerCode isEqualToString:MJPropertyTypeBOOL1]
            || [lowerCode isEqualToString:MJPropertyTypeBOOL2]) {
            _boolType = YES;
        }
    }
}
```
* 判断具体类型，对象类型利用反射机制形成，基本数据类型不能使用反射机制，所以采用独立标识
* `@synchronized` 同步锁，用于多线程操作时防止多个线程对同一个对象写入。但是这里为什么使用，笔者没搞清楚。如果有人知道请留言告知。(是因为block是异步执行的吗？)
* 之所以会有`_KVCDisabled`属性，是因为 `KVC`的`value`不支持基础数据类型。基础数据类型需使用`NSNumber`包装。

至此对属性的拆解和重新包装就完成了，接下来回到`+ (NSMutableArray *)properties`方法，看看多级映射以及属性和json数据key不一样时的处理。

来看调用：
```
[property setOriginKey:[self propertyKey:property.name] forClass:self];
```
* `+ propertyKey`方法是根据当前属性名获取json数据中要替换的keyPath，如果不需要替换，则直接返回该属性名。内部处理类同开头介绍的白名单获取方式。
 * 需要注意的是获取方式有两个方法`replacedKeyFromPropertyName121`和`replacedKeyFromPropertyName`。
 * 区别
 前者采用`objc_setAssociatedObject`关联block和对应的key时，使用的策略是`OBJC_ASSOCIATION_RETAIN_NONATOMIC`,而后者采用的是`OBJC_ASSOCIATION_COPY_NONATOMIC`。在ARC下，一般没什么差别，因为系统默认对block采用copy操作。而在MRC下，block中如果使用了外部变量，block会存在于栈中。栈中的对象释放由系统控制，所以很可能在block使用前，系统就销毁了对象。此时再使用就可能crash。因此声明block时，最好使用copy，复制到堆中，由程序员控制对象的释放。
[参考链接:iOS 非ARC下的block][5]
 * 因此建议使用`replacedKeyFromPropertyName121`协议或block。
```
/**
 将要替换的json的keyPath拆解并持有保存

 @param originKey json数据中要替换的keyPath，若不需替换则为属性本身的名称
 @param c 当前类
 */
- (void)setOriginKey:(id)originKey forClass:(Class)c
{
    // 字符串类型的key：可能是不需替换的或者是json中的keyPath
    if ([originKey isKindOfClass:[NSString class]]) {
        // 拆解keyPath并保存到数组
        NSArray *propertyKeys = [self propertyKeysWithStringKey:originKey];
        if (propertyKeys.count) {
            [self setPorpertyKeys:@[propertyKeys] forClass:c];
        }
    } else if ([originKey isKindOfClass:[NSArray class]]) {
        // 什么情况是数组？一个属性可能对应多个json keyPath
        // 每一个keyPath都要拆解包装并保存在一个数组
        // 再将每一数组按顺序保存到一个数组
        NSMutableArray *keyses = [NSMutableArray array];
        for (NSString *stringKey in originKey) {
            NSArray *propertyKeys = [self propertyKeysWithStringKey:stringKey];
            if (propertyKeys.count) {
                [keyses addObject:propertyKeys];
            }
        }
        if (keyses.count) {
            [self setPorpertyKeys:keyses forClass:c];
        }
    }
}
/**
 *  拆解多级映射的keyPath(包括数组的索引值)，并包装成MJPropertyKey对象，存储到数组中
 */
- (NSArray *)propertyKeysWithStringKey:(NSString *)stringKey
{
    if (stringKey.length == 0) return nil;
    
    NSMutableArray *propertyKeys = [NSMutableArray array];
    // 如果有多级映射
    // 模型属性对应json中第n级key
    // 处理json中的数组对象级
    // 要求写keyPath时采用点语法的形式
    NSArray *oldKeys = [stringKey componentsSeparatedByString:@"."];
    // 遍历每一个path
    for (NSString *oldKey in oldKeys) {
        
        NSUInteger start = [oldKey rangeOfString:@"["].location;
        if (start != NSNotFound) {  
            // 1. 处理数组项
            // 裁减出数组名
            NSString *prefixKey = [oldKey substringToIndex:start];
            NSString *indexKey = prefixKey;
            if (prefixKey.length) {
                MJPropertyKey *propertyKey = [[MJPropertyKey alloc] init];
                propertyKey.name = prefixKey;
                [propertyKeys addObject:propertyKey];
                // 裁剪出索引值
                indexKey = [oldKey stringByReplacingOccurrencesOfString:prefixKey withString:@""];
            }
            
            /** 解析索引 **/
            NSArray *cmps = [[indexKey stringByReplacingOccurrencesOfString:@"[" withString:@""] componentsSeparatedByString:@"]"];
            // cmps数组中只有索引值字符串和一个空字符串
            for (NSInteger i = 0; i<cmps.count - 1; i++) {
                MJPropertyKey *subPropertyKey = [[MJPropertyKey alloc] init];
                subPropertyKey.type = MJPropertyKeyTypeArray;
                subPropertyKey.name = cmps[i];
                [propertyKeys addObject:subPropertyKey];
            }
        } else {
            // 没有索引的json key部分或者是本来不需替换的json key
            MJPropertyKey *propertyKey = [[MJPropertyKey alloc] init];
            propertyKey.name = oldKey;
            [propertyKeys addObject:propertyKey];
        }
    }
    
    return propertyKeys;
}
- (void)setPorpertyKeys:(NSArray *)propertyKeys forClass:(Class)c
{
    if (propertyKeys.count == 0) return;
    self.propertyKeysDict[NSStringFromClass(c)] = propertyKeys;
}
```
* 使用`MJPropertyKey`对象来包装多级映射的每一级path。每个对象都用一个枚举类型属性表明它的使用方式。
```
typedef enum {
    // 表明当前对象的值当做字典的key
    MJPropertyKeyTypeDictionary = 0, 
    // 表明当前对象的值当做数组的索引值使用
    MJPropertyKeyTypeArray 
} MJPropertyKeyType;
```
* 包装MJPropertyKey对象时有一个细节：只有包装索引时设置了它的`MJPropertyKeyType`为`MJPropertyKeyTypeArray`。而却没有看到设置`MJPropertyKeyTypeDictionary`类型的地方。
因为枚举类型的属性，如果不设置，会默认设置成枚举的第一个成员，这里即是默认设置成`MJPropertyKeyTypeDictionary`。
* 至于属性和json key不一致，需要替换的情况。就将json key看做只有一个path的keyPath，仍然采用上面的方法。
* `MJProperty`中声明了一个`propertyKeysDict`属性，以模型类名为key，value为`MJPropertyKey`对象的数组，用来保存每一级path

看完多级映射，现在再回到`+ (NSMutableArray *)properties`方法，看MJ又如何处理数组中的模型, 先看调用：
```
[property setObjectClassInArray:[self propertyObjectClassInArray:property.name] forClass:self];
```
* `+ propertyObjectClassInArray`也是比照白名单获取方式分析。这里是根据属性名获取json中对应的数组的key。
```
- (void)setObjectClassInArray:(Class)objectClass forClass:(Class)c
{
    if (!objectClass) return;
    self.objectClassInArrayDict[NSStringFromClass(c)] = objectClass;
}
```
* 数组中的模型处理要简单的多，直接保存在字典中，key仍然是外部模型类的类名。
* `objectClassInArrayDict`是`MJProperty`的一个字典属性，key是模型类名，value则是数组中的模型类型。

接下来我们来看上面核心代码中缺省的block：
```objc
    // 遍历每一个属性:包装成了MJProperty对象
    [clazz mj_enumerateProperties:^(MJProperty *property, BOOL *stop) {
        @try {
            // 0.检测是否被忽略
            // 属性不在白名单中
            if (allowedPropertyNames.count && ![allowedPropertyNames containsObject:property.name]) return;
            // 属性在黑名单中
            if ([ignoredPropertyNames containsObject:property.name]) return;
            
            // 1.取出属性值
            id value;
            // 获取拆解json keyPath得到的数组，每个path包装成了MJPropertyKey对象
            // 内部就是MJProperty中的propertyKeysDict字典属性
            NSArray *propertyKeyses = [property propertyKeysForClass:clazz];
            for (NSArray *propertyKeys in propertyKeyses) {
                // json对象
                value = keyValues;
                // propertyKeys: 保存一个被拆解的json keyPath
                // propertyKey : json keyPath 中的一个path
                for (MJPropertyKey *propertyKey in propertyKeys) {
                    // kvc 从json字典中取值
                    // 如果是多级映射，每次返回的值为下一级对象，直到需要的值
                    value = [propertyKey valueInObject:value];
                }
                if (value) break;
            }
            /**
             * json数据中获得的值
             * 1. 有自定义的值处理方式，执行自定义
             * 2. 无自定义方式，则将数据的类型转换为属性的类型赋值(保持类型一致)
             */
            
            // 值的进一步处理如将字符串处理成NSURL或NSDate,如果不需处理则直接返回原值
            id newValue = [clazz mj_getNewValueFromObject:self oldValue:value property:property];
            if (newValue != value) { // 有过滤后的新值
                [property setValue:newValue forObject:self];
                return;
            }
            
            // 如果没有值，就直接返回
            if (!value || value == [NSNull null]) return;
            
            // 2.复杂处理 -- 处理模型中的模型和数组中的模型
            // 属性的类型
            MJPropertyType *type = property.type;
            // 属性的类型所属的类,基本数据类型则为nil
            Class propertyClass = type.typeClass;
            // 获取数组中的自定义类型,内部就是一个字典取值
            Class objectClass = [property objectClassInArrayForClass:[self class]];

            // (属性)不可变 -> 可变处理(获取的值)
            if (propertyClass == [NSMutableArray class] && [value isKindOfClass:[NSArray class]]) {
                value = [NSMutableArray arrayWithArray:value];
            } else if (propertyClass == [NSMutableDictionary class] && [value isKindOfClass:[NSDictionary class]]) {
                value = [NSMutableDictionary dictionaryWithDictionary:value];
            } else if (propertyClass == [NSMutableString class] && [value isKindOfClass:[NSString class]]) {
                value = [NSMutableString stringWithString:value];
            } else if (propertyClass == [NSMutableData class] && [value isKindOfClass:[NSData class]]) {
                value = [NSMutableData dataWithData:value];
            }

            if (!type.isFromFoundation && propertyClass) {
                // 自定义的模型类,此处是处理模型中的模型
                // 进一步的json转模型
                value = [propertyClass mj_objectWithKeyValues:value context:context];
            } else if (objectClass) {
                // 数组中的模型
                if (objectClass == [NSURL class] && [value isKindOfClass:[NSArray class]]) {
                    // 数组中的模型是NSURL
                    // string array -> url array
                    NSMutableArray *urlArray = [NSMutableArray array];
                    for (NSString *string in value) {
                        if (![string isKindOfClass:[NSString class]]) continue;
                        [urlArray addObject:string.mj_url];
                    }
                    value = urlArray;
                } else {
                    // 处理数组中嵌套模型，返回的数组中是json转model过的
                    value = [objectClass mj_objectArrayWithKeyValuesArray:value context:context];
                }
            } else {
                if (propertyClass == [NSString class]) {
                    // 属性类型是NSString，值的类型是NSNumber或NSURL
                    if ([value isKindOfClass:[NSNumber class]]) {
                        // NSNumber -> NSString
                        value = [value description];
                    } else if ([value isKindOfClass:[NSURL class]]) {
                        // NSURL -> NSString
                        value = [value absoluteString];
                    }
                } else if ([value isKindOfClass:[NSString class]]) {
                    // 属性类型是基本数据类型或者NSURL，但是对应的json的值是字符串类型
                    if (propertyClass == [NSURL class]) {
                        // NSString -> NSURL
                        // url字符串转码
                        value = [value mj_url];
                        // 基本数据类型不能使用反射机制获取，通过设置标识来确定
                    } else if (type.isNumberType) {
                        // 数字是以字符串形式呈现的
                        NSString *oldValue = value;
                        if (type.typeClass == [NSDecimalNumber class]) {
                            // 浮点数类，提供更精确的浮点数计算方式，不可变类
                            value = [NSDecimalNumber decimalNumberWithString:oldValue];
                        } else {
                            // 字符串转换成数组
                            value = [numberFormatter_ numberFromString:oldValue];
                        }
                        
                        // json中的布尔类型数据是字符串显示的
                        if (type.isBoolType) {
                            // 字符串转BOOL（字符串没有charValue方法）
                            // 系统会调用字符串的charValue转为BOOL类型
                            NSString *lower = [oldValue lowercaseString];
                            if ([lower isEqualToString:@"yes"] || [lower isEqualToString:@"true"]) {
                                value = @YES;
                            } else if ([lower isEqualToString:@"no"] || [lower isEqualToString:@"false"]) {
                                value = @NO;
                            }
                        }
                    }
                }
                
                // value和property类型不匹配
                if (propertyClass && ![value isKindOfClass:propertyClass]) {
                    value = nil;
                }
            }
            
            // 3.赋值
            [property setValue:value forObject:self];
        } @catch (NSException *exception) {
            MJExtensionBuildError([self class], exception.reason);
            MJExtensionLog(@"%@", exception);
        }
    }];
```
* `+mj_getNewValueFromObject` 方法用于对值的进一步处理。内部逻辑和白名单获取方式类似,这里也不再分析。
* 异常捕获--详情可以戳[这个链接@_超][1]

        @try {
            // 可能会发生异常的代码
        } @catch (NSException *exception) {
            // 捕获异常后的处理
        } 
        @try中的代码块如果发生异常，就会被catch捕获并形成NSException对象，可以使用该对象的reason或userInfo查看原因。如果没有异常则不执行catch。此外还有一个@finally（貌似很少用）， 不管是否异常都会执行，即使@try或@catch中有return语句。
* 模型中的模型的处理方式就是使用新模型类将整个流程再走一次。
来看看如何从json数据取值
```
- (id)valueInObject:(id)object
{
    if ([object isKindOfClass:[NSDictionary class]] && self.type == MJPropertyKeyTypeDictionary) {
        // 从json字典中根据原始key取值
        return object[self.name];
    } else if ([object isKindOfClass:[NSArray class]] && self.type == MJPropertyKeyTypeArray) {
        // json中的数组对象，index即保存过的索引
        NSArray *array = object;
        NSUInteger index = self.name.intValue;
        if (index < array.count) return array[index];
        return nil;
    }
    return nil;
}
```
接下来就是处理数组中的模型：
```
+ (NSMutableArray *)mj_objectArrayWithKeyValuesArray:(id)keyValuesArray context:(NSManagedObjectContext *)context
{
    // 如果是JSON字符串，新模型的元数据是JSON字符串
    keyValuesArray = [keyValuesArray mj_JSONObject];
    
    // 1.判断真实性
    MJExtensionAssertError([keyValuesArray isKindOfClass:[NSArray class]], nil, [self class], @"keyValuesArray参数不是一个数组");
    
    // 如果数组里面放的是Foundation类的数据
    if ([MJFoundation isClassFromFoundation:self])
        return [NSMutableArray arrayWithArray:keyValuesArray];

    // 2.创建数组保存转换后的模型
    NSMutableArray *modelArray = [NSMutableArray array];
    
    // 3.遍历数组中的每个模型的元数据
    for (NSDictionary *keyValues in keyValuesArray) {
        if ([keyValues isKindOfClass:[NSArray class]]){
            // 数组当中还有模型，递归
            [modelArray addObject:[self mj_objectArrayWithKeyValuesArray:keyValues context:context]];
        } else {
            // 对数组中嵌套的模型进行json-model转换
            id model = [self mj_objectWithKeyValues:keyValues context:context];
            if (model) [modelArray addObject:model];
        }
    }
    
    return modelArray;
}
```
然后就是保证属性的类型和值的类型保持一致，最后通过KVC方式为模型类属性赋值，整个转换就完成了。

  [1]: https://www.jianshu.com/p/f28b9b3f8e44
  [2]: https://zhidao.baidu.com/question/472451228.html
  [3]: https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtPropertyIntrospection.html#//apple_ref/doc/uid/TP40008048-CH101-SW1
  [4]: https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html#//apple_ref/doc/uid/TP40008048-CH100-SW1
  [5]: https://www.mgenware.com/blog/?p=503
  [6]: http://oyo48xwkg.bkt.clouddn.com/MJ%E7%BB%93%E6%9E%84.png
