---
title: iOS-non-pointer-isa
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - Runtime
tags:
  - non-pointer
  - isa
date: 2019-03-19 16:29:04
top:
---

* 目前 Apple 无论是 iOS 还是 macOS 都只支持 64 位。但是呢，又没有完全使用 64 位虚拟地址。比如 ARM64 上目前使用33位作为对象地址，X86_64 使用 44 位。为了提升app 运行效率和减少内存消耗，Runtime 利用剩余的 bit 存储一些对象的信息，比如 retain count 或 是否有弱引用指向。
<!--more-->
* 在 ARM64 上，Objective-C 对象的 `isa` 字段不再是指针，而是一个联合体。

    ```c++ objc-private.h
    union isa_t {

        Class cls;          // struct objc_class * 
        uintptr_t bits;     // unsigned long 
    #if defined(ISA_BITFIELD)
        struct {            // 64位的 结构体位域
            ISA_BITFIELD;   // defined in isa.h
        };
    #endif
    }
    ```
    里面定义了一个类指针，一个结构体位域，一个统一描述所有位的 bits 成员。他们都是8个字节。获取对象的 isa 时，使用`object_getClass`而不是`objc->isa`，除非你能确定 isa 中bit 位除了类对象地址不含其它意义。

* 重点看看位域中的 bit 含义

    ```c++ isa.h_ARM64
    #define ISA_BITFIELD 
      uintptr_t nonpointer        : 1;  // 当前 isa 被用作指针还是联合体
      uintptr_t has_assoc         : 1;  // 是否有其他引用指向该对象
      uintptr_t has_cxx_dtor      : 1;  // 是否有析构函数
      uintptr_t shiftcls          : 33; /*MACH_VM_MAX_ADDRESS 0x7fffffe00000*/
      uintptr_t magic             : 6;  // 区分对象是否已经初始化：arm64上为 0x16，x86_64上为 0x3b
      uintptr_t weakly_referenced : 1;  // 是否有 weak 修饰引用指向该对象
      uintptr_t deallocating      : 1;  // 是否正在被释放
      uintptr_t has_sidetable_rc  : 1;  // 引用计数进位，将多出的计数存储到 refcount 中
      uintptr_t extra_rc          : 19   // 存储引用计数。如果 extra_rc = 3, 那么retain_count = 4。如果溢出，has_sidetable_rc 置 1。
    ```

* `nonpointer`（第0位）: 为0时，联合体中存储的内容仅代表一个类对象指针，其他 bit 位不作额外用途。为1时，就可以根据位域中对应的字段获取额外存储的信息。
* `has_assoc`（第1位）: 该对象是否关联其他对象(含有属性之类的)。该 bit 位在调用 `objc_setAssociatedObject`函数时置为1。
* `has_cxx_dtor`（第2位）: 是否有自定义的析构函数。对象没有析构函数释放更快？？？
* `shiftcls`（第3~35位）: 类对象地址。为什么33位? 在 isa 初始化的时候赋值，`newisa.shiftcls = (uintptr_t)cls >> 3;`。为什么右移 3 位？OC 对象的存储是 8 字节对齐，也就意味着对象地址的后三位一定是 0。既然这3位是定值，那为什么要浪费3个 bit 来存储呢。当我们需要取类对象地址的时候，读出该位域字段，然后在左移3位即可得到原地址。但是这不就有两个步骤了吗！优化一下：`shiftcls`之后不正好有 3 bit 吗，我把第 0~36位都读出来，同时将后3位置0不也一样。这就是为什么`ISA()`函数

    ```c++ objc-object.h
    #define ISA_MASK 0x0000000ffffffff8
    Class ISA() {
        return (Class)(isa.bits & ISA_MASK);
    }
    ```
    一个16进制数搞定两个步骤，OC 对内存的优化可见一斑。
* `has_sidetable_rc`和`extra_rc`
    
    MRC 下调用 `- retainCount`方法获取引用计数
    
    ```objc NSObject.mm
    - (NSUInteger)retainCount {
        return ((id)self)->rootRetainCount();
    }
    ```
    ```c++ objc-object.h
    // 代码省略很多
    inline uintptr_t objc_object::rootRetainCount()
    {
        isa_t bits = LoadExclusive(&isa.bits);
        if (bits.nonpointer) {
            uintptr_t rc = 1 + bits.extra_rc;
            if (bits.has_sidetable_rc) {
                rc += sidetable_getExtraRC_nolock();
            }
            return rc;
        }
    }
    ```
    　　这两个都是跟存储引用计数相关的。`extra_rc`虽说存储引用计数，但是真正获取到的要在它的基础上加 1.（为什么？需要查它的赋值）如果 `bits.has_sidetable_rc` 位为1，需要再加上额外存储的引用计数。
    　　先说结论，如果引用计数太大，`extra_rc`不能存储，`has_sidetable_rc`置 1 ，多出的引用计数使用 `struct SideTables`中的`RefcountMap refcnts;`引用计数“表”存储。由于 Runtime 源码是 X86_64 架构的，所以这里只在 mac 下验证。
    ```c++ objc_object.h
    id objc_object::rootRetain(bool tryRetain, bool handleOverflow)
    {
        isa_t oldisa;
        isa_t newisa;
    
        do {
                oldisa = LoadExclusive(&isa.bits);
                newisa = oldisa;
                newisa.bits = addc(newisa.bits, RC_ONE, 0, &carry);  // extra_rc++
            
                if (slowpath(carry)) {
                    newisa.has_sidetable_rc = true;
                }
        }
    }
    ```
   `addc`内部的函数实现看不到，只能手动调试。`has_sidetable_rc`的赋值只有这一个地方。`carry == 1`时才能进入 if 语句。因此我们就验证 carry 什么时候为1即可。这里是强行修改 `extra_rc` 字段，跳出函数后程序是会崩溃。
   > 注意这里应该在`do` 语句之前修改  `isa.extra_rc`，而不是临时变量的。
   
    ![extra_rc_enough_no_carry](https://i.loli.net/2019/03/19/5c90a85e63ac2.jpg)
先修改 `extra_rc`为`0xFE`即254，此时的`retainCount`就该为 255，还未溢出，因此 `carry = 0`。
![extra_rc_need_carry](https://i.loli.net/2019/03/19/5c90a85e5c094.jpg)
接下来修改`extra_rc`为`0xFF`，此时`retainCount`为256，已经溢出，因此`carry = 1`。此时由于 `handleOverflow`为`false`, `rootRetain`会重新被调用并将`handleOverflow`置为 `true`。然后将`has_sidetable_rc = true;`

* 参考链接
    * http://www.sealiesoftware.com/blog/archive/2013/09/24/objc_explain_Non-pointer_isa.html
    * https://github.com/Draveness/Analyze/blob/master/contents/objc/%E4%BB%8E%20NSObject%20%E7%9A%84%E5%88%9D%E5%A7%8B%E5%8C%96%E4%BA%86%E8%A7%A3%20isa.md