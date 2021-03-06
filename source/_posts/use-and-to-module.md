---
title: 【Java】使用位运算(&)代替取模运算(%)
date: 2018-10-11 16:43
categories: 技术
tags: [java] 
---

### 介绍
位运算(&)效率要比取模运算(%)高很多，主要原因是位运算直接对内存数据进行操作，不需要转成十进制，因此处理速度非常快。

``` java
a % b == a & (b - 1)
```

**前提：b 为 2^n**

来源自 `HashMap` 中的 `indexFor` 方法：

``` java
static int indexFor(int h, int length) {
   return h & (length-1);
}
```

这个方法是使用哈希值对链表数组的长度取模，得到值所在的索引位置，里面使用位运算（&）代替普通的（%）运算。

### 原理

具体的效率对比这里不赘述，简单说一下为什么 `&` 可以代替 `%` ：

> X % 2^n = X & (2^n - 1)

2^n 表示 2 的 n 次方，也就是说，**一个数对 2^n 取模相当于一个数和 (2^n - 1) 做按位与运算** 。

假设 n 为 3，则 2^3 = 8，表示成 2 进制就是 1000。2^3 - 1 = 7 ，即 0111。

此时 X & (2^3 - 1) 就相当于取 X 的 2 进制的最后三位数。

从 2 进制角度来看，X / 8 相当于 X >> 3，即把 X 右移 3 位，此时得到了 X / 8 的商，而被移掉的部分(后三位)，则是 X % 8，也就是余数。

推广到一般：

对于所有 2^n 的数，二进制表示为：

> 1000...000，1 后面跟 n 个 0

而 2^n - 1 的二进制为：

> 0111...111，0 后面跟 n 个 1

X / 2^n 是 X >> n，那么 X & (2^n - 1) 就是取被移掉的后 n 位，也就是 X % 2^n。



> *https://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650120877&idx=1&sn=401bb7094d41918f1a6e142b6c66aaac&chksm=f36bbf8cc41c369aa44c319942b06ca0f119758b22e410e8f705ba56b9ac6d4042fe686dbed4&mpshare=1&scene=1&srcid=1010L0NNyoRB5lVoryo00awY#rd*