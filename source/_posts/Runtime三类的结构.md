---
title: Runtime三类的结构
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - Runtime
tags:
  - Runtime
date: 2019-03-22 03:08:58
top:
---

* 在 [Runteim一](http://roastduck.xyz/article/Runtime%E4%B8%80%E5%AF%B9%E8%B1%A1%E5%92%8C%E6%96%B9%E6%B3%95%E7%9A%84%E6%9C%AC%E8%B4%A8.html) 中我们已经看到过类的结构体
<!--more-->

    ```objc Object.mm
    typedef struct objc_class *Class;
    ```
    ```c++ objc-rutime-new.h
    struct objc_class : objc_object {
        // Class ISA;       // 继承的 isa；8 bytes
        Class superclass;   // 父类；8 bytes
        cache_t cache;      // 方法缓存；16 bytes
        class_data_bits_t bits;     // 包含类数据的地址
    
        class_rw_t *data() { 
            return bits.data();
        }
        void setData(class_rw_t *newData) {
            bits.setData(newData);
        // 省略一大波
    }
    ```
    
### `cache` 方法缓存
* 方法缓存另讲。这里只看看其成员

    ```c++ objc-runtime-new.h
    typedef uint32_t mask_t;
    
    struct cache_t {
        struct bucket_t *_buckets;  // 8 bytes
        mask_t _mask;       // 4 bytes
        mask_t _occupied;   // 4 bytes
        //省略函数
    }
    ```
    得出该结构体大小 16 bytes，后面我们推断内存地址用。
    ```
    struct bucket_t {
    private:
    #if __arm64__
        MethodCacheIMP _imp;  // 8 bytes 方法实现
        cache_key_t _key;       // 8 bytes 方法编号
    #else
        cache_key_t _key;
        MethodCacheIMP _imp;
    #endif
    ```
    用一个结构体将方法编号和对应的实现互相绑定。ARM64下方法实现在内存中靠前存放，其他架构靠后存放。为什么？

### 成员变量 `bits` 

* 其实 bits 并不能直接得到类数据，还需要和一个 MASK 进行运算。
* 先看一下结构体成员确定内存大小

    ```c++ objc-runtime-new.h
    typedef unsigned long		uintptr_t;
    
    struct class_data_bits_t {
        // Values are the FAST_ flags above.
        uintptr_t bits;
    }
    ```
    64 位下 long 占 8 bytes。也就是结构体的大小。综合一下得出`objc_class`在内存中占 40 bytes。之后验证我们需要根据字节数进行偏移。
    
* 获取类的数据：`objc_class::data()`，该函数又调用了`class_data_bits_t::data()`

    ```c++ objc-runtime-new.h
    #if !__LP64__
        #define FAST_DATA_MASK 0xfffffffc // ARM64
    #elif 1
        #define FAST_DATA_MASK 0x00007ffffffffff8 // X86_64 下和 ISA_MASK 一样的
    #else
    #endif
    
    class_rw_t* data() {
        return (class_rw_t *)(bits & FAST_DATA_MASK);
    }
    ```

### 类的可读可写数据

* 函数最终返回一个结构体指针，这个结构体中就是真正的数据。这里面的数据是可读写的。
    > const 离谁近就修饰的谁

    ```c++ objc-runtime-new.h
    struct class_rw_t {
        uint32_t flags;             // 
        uint32_t version;           // 版本号
    
        const class_ro_t *ro;       // 只读数据
    
        method_array_t methods;     // 方法列表
        property_array_t properties;// 属性列表
        protocol_array_t protocols; // 协议列表
    
        Class firstSubclass;        // 当前类的首个子类
        Class nextSiblingClass;     // 姊妹类（当前类和这个继承自同一个类）
    
        char *demangledName;        //类的符号名
    }
    ```
    数据中我们重点关注 `ro`, `methods`, `properties`，`protocols`。
    
    首先 LLDB 调试一下，验证内存是否如此分布。调试还是在 X86_64 环境下进行。验证代码在[文末](#调试验证)
    ![class_data_get](https://i.loli.net/2019/03/22/5c93e11b3b50a.jpg)
    ![class_data_detail](https://i.loli.net/2019/03/22/5c93e11b3be8d.jpg)
    
### 类的只读数据 `ro`
* 结构体定义

    ```c++ objc-runtime-new.h
    struct class_ro_t {
        uint32_t flags;
        uint32_t instanceStart; // 存储实例成员的起始内存偏移
        uint32_t instanceSize;  // 实例成员大小
    #ifdef __LP64__
        uint32_t reserved;      // 保留字段，ARM64下没有
    #endif
    
        const uint8_t * ivarLayout; // type-encoding ？
        
        const char * name;          // 类名    
        method_list_t * baseMethodList;
        protocol_list_t * baseProtocols;
        const ivar_list_t * ivars;  // 实例成员列表
    
        const uint8_t * weakIvarLayout; // weak 修饰的成员
        property_list_t *baseProperties;
    
        method_list_t *baseMethods() const {
            return baseMethodList;
        }
    };
    ```
    从这里能得出为什么我们不能在分类添加成员变量的原因。分类加载时，主类已经初始化完毕。实例成员列表 `*ivars` 有 `const`修饰，因此一旦初始化就不能再被更改。属性列表不是只读的，因此分类可以添加属性。但是不能生成成员变量，当然也不会有 setter 和 getter 方法。
    
    > `baseProperties` 在 `class_ro_t`中是一个指针变量。由于 ro 只读，因此该指针变量不可被修改，但是其内容应该是能修改的。 
    
    `ro`的内存分布
    ![class_ro](https://i.loli.net/2019/03/22/5c93e11b2d416.jpg)
    细心的读者可能已经发现，`rw`和`ro`中的方法列表、属性列表和协议列表地址都是相同。笔者没弄明白为什么要这么设计？？？
    `method_list_t`、`ivar_list_t`和`property_list_t` 都是继承自模板结构体`
    
    ```c++ objc-runtime-new.h
    template <typename Element, typename List, uint32_t FlagMask>
    struct entsize_list_tt {
        // entsize_list_tt 的大小:flag
        // method_list_t: 低2位为 flag，高14位为大小	flagMasK 为 0x3
        // ivar和 property list: 4个字节都表示大小	flagMasK 为 0x0
        uint32_t entsizeAndFlags; 
        uint32_t count;     // 方法/成员/属性的数量
        Element first;      // 第一个方法/成员/属性的数据
        
			
        uint32_t entsize() const {
            return entsizeAndFlags & ~FlagMask; 
        }
        
        // 普通打印结构体只能查看第一个元素，对于其他的我们通过调用 get(int)获取。其算法就是在首元素的基础上进行偏移 。
        Element& getOrEnd(uint32_t i) const { 
            assert(i <= count);
            return *(Element *)((uint8_t *)&first + i*entsize()); 
        }
        Element& get(uint32_t i) const { 
            assert(i < count);
            return getOrEnd(i);
        }
    }
    ```
    与之相近的还有`class_rw_t`中的`method_array_t`、`property_array_t`和`protocol_array_t`，但它们是继承自模板类
    
    ```
    template <typename Element, typename List>
    class list_array_tt {
        struct array_t {
            uint32_t count;
            List* lists[0];
        }
    }
    ```
    其中的 `Element` 和 `List` 是泛型，前者继承时会替换为对应的结构体类型，后者会对应替换为`method_list_t`、`ivar_list_t`和`property_list_t`。
    
    ```c++ objc-runtime-new.h
    struct method_t {
        SEL name;           // 方法名
        const char *types;  // type-encoding
        MethodListIMP imp;  // 方法实现
    }
    
    struct ivar_t {
        int32_t *offset;    // 相对于偏移
        const char *name;   // 实例变量名
        const char *type;   // 变量类型
        // alignment is sometimes -1; use alignment() instead
        uint32_t alignment_raw; // 对齐
        uint32_t size;          // 占用内存大小
    }
    
    struct property_t {
        const char *name;       // 属性名
        const char *attributes; // 属性类型，type-encoding
    };
    ```
    
    
    查看一下 method list并遍历出所有方法名
    ![method_list_t](https://i.loli.net/2019/03/22/5c93e11b3a388.jpg)
    遍历出的方法列表中并没有未实现的方法，同时类方法也没有出现。类方法应该出现在元类中。关于类方法其实[上一篇文章翻译的倒数第二段](http://roastduck.xyz/article/Runtime%E4%BA%8C%E5%AF%B9%E8%B1%A1-%E7%B1%BB%E5%AF%B9%E8%B1%A1-%E5%85%83%E7%B1%BB%E5%AF%B9%E8%B1%A1.html)已有提及。感兴趣的读者可以自行尝试。

    
### 调试代码

```objc Person.h
@interface Person : NSObject 

@property (nonatomic, copy) NSString *name;
@property (nonatomic, assign) int age;
    
// 实现
- (void)run:(NSInteger)distance;
+ (void)walk;
    
// 不实现
- (void)sing;
+ (void)eat;

@end
```
    
```objc Person.m
@implementation Person{
    NSString *address;
    bool sex;
}
```
    
```objc main.m
Person *p = [Person alloc];

p.name = @"songyang";
p.age = 20;

[p run:100];
[Person walk];
```
    
    