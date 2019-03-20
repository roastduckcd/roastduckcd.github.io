---
title: Runtime底层-alloc和init
comments: true
toc: true
copyright: true
declare: true
categories:
  - iOS
  - Runtime
tags:
  - alloc
  - init
date: 2019-03-12 19:37:44
top:
---

上篇我们创建了一个对象 `Person *person = [[Person alloc] init];`， 在这句前面先打上断点。我们今天就来探索一下对象到底是如何被创建的？

* 对象是在什么时候创建和初始化的
* alloc 做了哪些事
<!-- more -->
> 由于在我们的对象创建前，OC 底层还会创建其他的对象，都会使用 alloc 底层函数。因此断点调试时，如果底层函数有断点，但是获取的值跟实际推论有区别，很有可能调用 alloc 的不是 Person 类。建议调试时，先只启用对象创建这一个断点。等断住后再去启用底层的断点。

## alloc 流程

### 计算对象的实例空间大小

* 创建对象，从底层来说就是开辟一段内存空间，将对应地址的空间初始化，然后将该段内存的首地址赋值给一个对象指针。要开辟内存，就需要先计算出对象需要多大的空间，这其中还需要考虑内存对齐(目前 iOS App 都是64位，所以对象中成员的内存布局以8字节对齐)

* 一路`step into`来到函数`callAlloc`，笔者将其转化成伪代码

    ```c++
    static id
    callAlloc(Class cls, bool checkNil, bool allocWithZone=false)
    {
        
        if 类或父类没有自定义 alloc/allocWithZone 
            开辟新的新的内存空间???
        else 
            // 创建实例并返回
            id obj = class_createInstance(cls, 0);
            return obj;
        
        if (allocWithZone) return [cls allocWithZone:nil];
        return [cls alloc];
    }
    ```

* oc 都是有默认 alloc 的，所以我们直接来到 `class_createInstance`, 最后来到核心函数 `_class_createInstanceFromZone`。代码省略了大部分，只列出了主要流程的函数。

    ```c++
    id _class_createInstanceFromZone(Class cls, size_t extraBytes, void *zone, bool cxxConstruct = true, size_t *outAllocatedSize = nil)
    {
        // 实例空间对齐后的大小
        size_t size = cls->instanceSize(extraBytes);
        // 系统开辟对象所需的内存空间大小
        obj = (id)calloc(1, size);
        // isa 的初始化
        obj->initInstanceIsa(cls, hasCxxDtor);
            
        if (cxxConstruct && hasCxxCtor) {
            obj = _objc_constructOrFree(obj, cls);
        }
    
        return obj;
    }
    ```

* 类数据成员所占实例空间的获取。 oc 对象本质是一个结构体，由于 cpu 运行效率的问题，内存空间的开辟需要涉及到内存对齐。

    ```c++
    size_t instanceSize(size_t extraBytes) {
        // 对齐后的实例空间大小 + 额外指定的大小(这里为0)
        size_t size = alignedInstanceSize() + extraBytes;
        // CoreFoundation 对象至少需要 16 字节空间
        if (size < 16) size = 16;
        return size;
    }
    ```
    进到函数`alignedInstanceSize`中，从类中获取数据成员实际大小(未对齐)，并调用`word_align`进行 8 字节对齐(OC 现在只支持64位 app)。
    
    >问题：未对齐函数结果和对齐的是一样？？属性是一个 nsstring 和 int 。
    
    ```c++
    uint32_t alignedInstanceSize() {
        return word_align(unalignedInstanceSize());
    }

    #   define WORD_MASK 7UL  # 0000 0111 8字节
    
    static inline uint32_t word_align(uint32_t x) { 
        // 8 字节对齐算法 WORD_MASK = 7
        return (x + WORD_MASK) & ~WORD_MASK;
    }
    ```
    以 person 对象为例， `x = 8(NSString *) + 4(int) = 12 bytes`，对齐后的结果就是 16 bytes
    ```
    (12 + 7) & ~7
    
      0001 0011  # 22 + 7
    & 1111 1000  # ~7
      0001 0000  # 10进制的 16
    ```
    自己动手算一算，结果都会是"离待对齐值最近的8的倍数"。
    
* 回到核心函数`_class_createInstanceFromZone`中，`size_t size = 16 bytes` 吗？ 我们使用控制台打印却得到`size = 24`。原因很简单，不要忘了OC 中的对象都是结构体`objc_object`，默认有一个 [isa 的联合体成员变量](http://roastduck.xyz/article/Runtime一对象和方法的本质.html#对象的-isa)。

    ```
    struct objc_object {
        private:
            isa_t isa;
    }
    ```
    因此 OC 对象会自动继承一个 `isa` 成员变量。该联合体中的成员都是 8 bytes，所以整个 `isa` 占 8 个字节。所以 `size = ( 8(isa) + 8(NSSTring *) + 4(int) ) & 字节对齐 = 24 bytes`。
    
### 分配内存空间

* 获取实例空间的大小后，使用`calloc`函数分配真实的内存空间大小。成功分配内存后，该函数会返回该段内存的首地址。我们先看看系统分配了多大的空间

    ![calloc_size](https://i.loli.net/2019/03/20/5c91f52061750.jpg)
    实际内存分配 32 bytes。如何改变的呢？其实是又做了一次 16 字节对齐操作。( OC 对象)

* 该函数属于`libmalloc`库，我们需要另一个项目来调试。打开[可编译的`libmalloc`](https://github.com/roastduckcd/libmalloc)，在`main`函数中直接调用`void *p = calloc(1, 24)`，断点进入。函数内部又使用了其他对象的 `calloc` 函数，因此最好不要使用 Xcode 鼠标单击进入函数，而是利用断点调试。这样才好进入正确的函数，来到最终的对齐函数

    ```
    static MALLOC_INLINE size_t segregated_size_to_fit(nanozone_t *nanozone, size_t size, size_t *pKey)
{
	   size_t k, slot_bytes;

	   if (0 == size) {
		  size = NANO_REGIME_QUANTA_SIZE; // Historical behavior
	   }
	   k = (size + NANO_REGIME_QUANTA_SIZE - 1) >> SHIFT_NANO_QUANTUM; // round up and shift for number of quanta
	   slot_bytes = k << SHIFT_NANO_QUANTUM;							// multiply by power of two quanta size
	   *pKey = k - 1;													// Zero-based!

    	return slot_bytes;
}
    ```
    其实两点：
    * OC 对象最低分配 16 bytes
    * 第二种对齐算法(16字节对齐): `(x + 15) >> 4 << 4`

    >问题：为什么16字节对齐？实例空间按照8字节对齐是因为 64位 系统。笔者没找到资料来解释，难道是王八的屁股？☺☺
    
* 内存空间分配完毕，接下来是 [isa 的初始化](http://roastduck.xyz/article/Runtime%E4%B8%80%E5%AF%B9%E8%B1%A1%E5%92%8C%E6%96%B9%E6%B3%95%E7%9A%84%E6%9C%AC%E8%B4%A8.html#对象-isa-的初始化)了。 `isa`初始完毕，对象就正式存在于内存中了。

### init 做了什么
* 其实到这里一个对象已经创建完毕，已经可以调用方法了。

    ```
    Person *p = [Person alloc];
    p.name = @"songyang";
    p.age = 20;
    ```
    但是为什么还要有个 `init`方法呢？来到 它的底层实现

    ```
    
    - (id)init {
        return _objc_rootInit(self);
    }
    
    id _objc_rootInit(id obj)
    {
        // In practice, it will be hard to rely on this function.
        // Many classes do not properly chain -init calls.
        return obj;
    }
    ```
    　　可以看到最后其实就是将 self 指向的对象( alloc 创建的对象)直接返回。
    　　`init`可以看成是工厂方法，方便子类自定义初始化方法。
    >探讨：既然`alloc`已经将对象创建完毕，笔者在这里认为系统的`init`方法其实可以不用了。由于`objc_msgSend`有默认形参 `self`，它就会指向`alloc`创建的对象。就算是自定义初始化方法，也能在其中使用 `self`。


### 宏定义 `slowpath` 和 `fastpath`

* [相关链接](https://www.jianshu.com/p/2684613a300f)
* 实际是函数 `__builtin_expect(bool, bool)`， 当第二个 bool 值为 0 时是 `slowpath`；为 1 时是 `fastpath`。作用是允许程序员将最有可能执行的分支告诉编译器，以帮助编译器进行汇编代码的优化。
