---
title: Runtime一对象和方法的本质
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - Runtime
tags:
  - Runtime
date: 2019-03-17 01:38:45
top:
---


* 在[objc4-750.1源码](https://github.com/roastduckcd/Objc4_750_1.git)自定义`target`中新建`Person`类，写点属性和方法，然后在`main.m`中创建实例并调用方法。
    <!-- more -->
    ```objc Person.h
    @property (nonatomic, copy) NSString *name;
    @property (nonatomic, assign) int age;

    - (void)run:(NSInteger)distance;
    + (void)walk;

    ```
    ```objc main.m
    Person *p = [[Person alloc] init];
    
    [p run:100];
    
    [Person walk];
    ```
### 编译c++代码

* 将`main.m`和`Person.m`编译成`arm64`对应的 c++ 代码。终端执行下面的命令，会在同级目录下生成`main.cpp`和`Person.cpp`的文件。

    ```
    xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc -framework UIKit main.m（Person.m替换）
    ```

* 打开 c++文件，来到`main`函数。以下是去除类型强转后的代码

    ```c++ main.cpp
    int main(int argc, const char * argv[]) {
            
            // 对象的实例化
            Person *p = objc_msgSend(objc_msgSend(objc_getClass("Person"), sel_registerName("alloc")), sel_registerName("init"));
            
            // 对象调用实例方法
            objc_msgSend(p, sel_registerName("run"), 100);
    
            // 类对象调用类方法
            objc_msgSend(objc_getClass("Person"), sel_registerName("walk"));
        }
        return 0;
    }
    ```

### 对象的本质

##### 对象是一个结构体
* 来到 c++ 中对实例对象类型`Person`的声明。

    ```c++ Person.cpp
    typedef struct objc_object Person;
    ```
    很明显，`Person`实例对象其实是个名为`objc_object`结构体

    ```c++ objc-private.h
    struct objc_object {
    private:
        isa_t isa;      
    // 省略一大波
    }
    ```
    平时我们还能听到类对象的说法。通过`[p class]`能获取实例对象的类，它的返回值类型为 `Class`。

    ```objc Object.mm
    typedef struct objc_class *Class;
    ```
    ```c++ objc-rutime-new.h
    struct objc_class : objc_object {
        // Class ISA;       // 继承的 isa
        Class superclass;   // 父类
        cache_t cache;      // 方法缓存
        class_data_bits_t bits;     // 类数据
    
        class_rw_t *data() { 
            return bits.data();
        }
        void setData(class_rw_t *newData) {
            bits.setData(newData);
        // 省略一大波
    }
    ```
    在 Object2 中类也被当成对象来处理，也有 isa 指向。这也是为什么说 `OC中万物皆对象` 的原因。看完这两个对象结构体能得出`对象都有 isa，只有类对象才有 superclass`。但是我们平常为什么也能调用实例对象的`superclass`方法呢？
    ```objc Object.mm
    - (Class)superclass {
        return [self class]->superclass;
    } 
    
    - (Class)class {
        // 获取对象的 isa 指向
        return object_getClass(self);
    }
    
    Class object_getClass(id obj)
    {
        // 获取 isa 
        if (obj) return obj->getIsa();
        else return Nil;
    }   
    ```
    原来还是获取类对象的`superclass`，而且能得出对象的类的获取是通过 isa 得到的。
    
##### 对象的 isa

* `objc_object`结构体只有有一个`isa`成员变量，其他都是成员函数。`isa` 实际是一个`union`联合体。
    
    ```c++ objc-object.h
    union isa_t {
        // 构造函数
        isa_t() { }
        isa_t(uintptr_t value) : bits(value) { }
    
        Class cls;          // struct objc_class * 指针 8 bytes
        uintptr_t bits;     // unsigned long 8 bytes
    #if defined(ISA_BITFIELD)
        struct {            // 64位的 结构体位域
            ISA_BITFIELD;  // defined in isa.h
        };
    #endif
    }
    ```
    {% blockquote Greg Parker, http://www.sealiesoftware.com/blog/archive/2013/09/24/objc_explain_Non-pointer_isa.html, Non-pointer isa %}
`arm64`下的 `isa`不再只是一个指针。 OC 并没有完全利用64位地址。为了节省内存和提高响应速度 Runtime 利用一些额外二进制位来存储对象的部分信息，比如引用计数或是否是弱引用等等。
    {% endblockquote %}<br/>

    　　联合体包含的3个成员变量`Class`、`uintptr_t`和一个结构体位域都是8个字节，所有该联合体的大小是 8 bytes。~~之前一直以为 isa 是指针所以才是 8 个字节。~~
    
    　　`union` 同一时刻只能操作一个成员，不同时刻可以操作不同成员。 比如我们可以对 bits 赋值，我却可以通过结构体位域去操作一个或几个 bit，得到不同的值，达到存储简单信息的目的。由于成员都是8个字节，我可以一次性赋值或读取，也可以按位赋值或读取。在后面能看到苹果通过不同的 MASK 和 bits 按位与得到不同的值。
    　　
* 位域都是从低地址开始存储。 注意不同 cpu 结构是有区别的。[具体的位域值](http://roastduck.xyz/article/iOS-non-pointer-isa.html)

##### 对象 isa 的获取

* 获取 isa 指向的两个函数：`ISA()`和`getIsa()`。

    ```c++ objc-private.h
    struct objc_object {
    private:
        isa_t isa;      
    public:
        Class ISA();    // 获取 isa 指向
        Class getIsa();
    // 省略一大波
    }
    ```

* 当对象指针不是`taggedPointer`时，`getIsa()`函数也是调用的`ISA()`。这里就不贴代码了，直接到下一步。

* 如何获取 isa 指向的类对象

    ``` c++ objc-object.h
    inline Class objc_object::ISA() 
    {
        assert(!isTaggedPointer()); 
    #if SUPPORT_INDEXED_ISA
        if (isa.nonpointer) {
            uintptr_t slot = isa.indexcls;
            return classForIndex((unsigned)slot);
        }
        return (Class)isa.bits;
    #else
        return (Class)(isa.bits & ISA_MASK);
    #endif
    }
    ```
    `SUPPORT_INDEXED_ISA` 不用理，ARM64、X86_64 不支持。
    
    这里调试下来是执行了 `else` 中的语句。arm64 下`ISA_MASK` 就是 `0x0000000ffffffff8`。 `isa.bits` 就需要了解 `isa`是如何被初始化的。所幸苹果将重要的方法都写在结构体前面的，一眼就找到初始化的几个函数。如果没有，就只能新建对象，一步一步调试了。

    ```c++ objc-private.h
    struct objc_object {
    private:
        isa_t isa;      
    public:
        Class ISA();    // 获取 isa 指向
        Class getIsa();
        // initIsa() 应该仅用于初始化新对象的 isa，也会用于以下情况之外的对象
        // initInstanceIsa(): 初始化没有自定义allocWithZone 和 RR?的实例对象 的 isa （指向所属的类对象）
        // initClassIsa(): 初始化类对象isa  (指向元类对象)
        // initProtocolIsa(): 初始化协议对象的 isa
        void initIsa(Class cls /*nonpointer=false*/);
        void initClassIsa(Class cls /*nonpointer=maybe*/);
        void initProtocolIsa(Class cls /*nonpointer=maybe*/);
        void initInstanceIsa(Class cls, bool hasCxxDtor);
    // 省略一大波
    }
    ```

##### 对象 isa 的初始化

* 上面的各种初始化接口最终调用私有的 `initIsa(Class cls, bool nonpointer, bool hasCxxDtor)`函数。传入参数依次为类对象指针，是否是 nonpointer，是否有自定义析构函数
    
    ```
    inline void objc_object::initIsa(Class cls, bool nonpointer, bool hasCxxDtor) 
    { 
        // 临时变量
        isa_t newisa(0);
        
        // ISA_MAGIC_VALUE : 0x000001a000000001，该值包含了 nonpointer(低第一位)和 magic (第37~第42位)
        newisa.bits = ISA_MAGIC_VALUE;
        
        // 是否有析构函数，根据参数是 0
        newisa.has_cxx_dtor = hasCxxDtor;
        
        // 移除类对象地址后3位的0
        newisa.shiftcls = (uintptr_t)cls >> 3;
        
        isa = newisa;
    ```

* 再看 `isa.bits & ISA_MASK`,  就是将取第0~35位，并将低三位置0了。得到的结果就是(元)类对象的地址。这个过程其实是上面`cls >> 3`的逆过程。至于原因请查看[shiftcls字段的介绍](http://roastduck.xyz/article/iOS-non-pointer-isa.html)

### 方法的本质
* 从编译后代码看到，OC 方法都被编译成了`objc_msgSend`的 c++函数。亦即 OC 方法的本质：消息发送。

* 不管是实例对象还是类本身，都会将调用方法的对象和方法的编号作为该函数的第一、二个实参。如果方法有其他参数，则会从第三个实参开始往后排。

* 按照上面的编译方法将`Person.m`也编译成 c++文件。然后找到实例方法 run 的 c++实现。

    ```c++ main.cpp
    static void _I_Person_run_(Person * self, SEL _cmd, NSInteger dis) {
        NSLog((NSString *)&__NSConstantStringImpl__var_folders_07_13f7q65d7sj09t7q2sj3dymm0000gn_T_Person_390a3b_mi_1, dis);
    }
    ```
    编译后的函数默认添加了`self`和`_cmd`两个形参，然后才是我们自己方法的形参。而`objc_msgSend`函数会根据传入对象的`isa`指针找到对应类，然后根据方法编号`_cmd`去查找对应的实现。所以`self`其实是指向方法调用者的指针，我们才能在方法中使用`self`来调用本类方法和属性。而`_cmd`就是当前方法的编号。这两者和`objc_msgSend`的实参是一一对应的。

#### 方法查询走位
* 向对象发送消息时，先根据对象的 isa 指针查找对象所属类的的方法列表(类的实例方法)，然后根据类的 super_class 指针走父类链直到根类。[走位图](http://roastduck.xyz/article/Runtime%E4%BA%8C%E5%AF%B9%E8%B1%A1-%E7%B1%BB%E5%AF%B9%E8%B1%A1-%E5%85%83%E7%B1%BB%E5%AF%B9%E8%B1%A1.html)
