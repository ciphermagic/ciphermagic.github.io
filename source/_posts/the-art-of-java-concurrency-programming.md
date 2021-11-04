---
title: 《Java 并发编程的艺术》读书笔记
date: 2021-05-07 23:29
categories: 技术
tags: [java]
---

*方鹏飞 魏鹏 程晓明 机械工业出版社 2020 年 12 月第 1 版*

<!-- more -->

<br/>
#### 第 1 章 并发编程的挑战 *(多线程会出现什么问题)*

- 上下文切换过多, 解决: 1) 无锁; 2) CAS; 3) 减少线程; 4) 协程;

  ``` shell
  ## 查看线程 dump 信息:
  grep java.lang.Thread.State %{stack.dump} | awk '{print $2$3$4$5}' | sort | uniq -c
  ```

- 死锁

- 软硬件资源限制

<br/>
#### 第 2 章 Java 并发机制的底层实现原理 *(多线程相关操作)*

##### volatile

- 将当前处理器的缓存行回写到内存;
- 使其他处理器缓存了该内存地址的数据无效;

##### synchronized

- 插入字节码 `monitorenter` 和 `monitorexit`
- 锁保存在对象头中

##### 锁

- 偏向锁: 同一线程不需要进行 CAS 操作来加锁和解锁
- 轻量级锁: 使用 CAS 来加锁和解锁, 获取锁不成功时, 会自旋等待
- 重量级锁: 使用 monitor, 获取锁不成功时, 挂起线程

##### 原子操作

- CAS
- ABA 问题, 使用版本号解决, `AtmoicStampedReference`

<br/>
#### <u>第 3 章 Java 内存模型 *(JVM 如何支持多线程)* ---- 重点</u>

##### 线程之间如何通信

- 共享内存（Java采用）
- 消息传递

##### 指令重排

- 编译器优化的重排（编译器重排）
- 指令级并行的重排（处理器重排）
- 内存系统的重排（处理器重排）

##### 数据依赖性

- 写后读
- 写后写
- 读后写

##### 内存屏障（禁止处理器重排）

- LoadLoad：装载先于装载
- StoreStore：存储先于存储
- LoadStore：装载先于存储
- StoreLoad：同时具备以上效果

##### happens-before规则

- 源于JSR-133（JDK5），the first is **visible to** and **ordered before** the scond
- 程序顺序规则：一个线程中的每个操作，happens-before 于该线程中的后续操作
- monitor锁规则：一个锁的解锁，happens-before 于对这个锁的加锁
- volatile变量规则：volatile变量的写，happens-before 于同一个 volatile 变量的读
- start() 规则：线程 A 的 ThreadB.start() 操作，happens-before 于线程 B 中的任意操作
- join() 规则：线程 B 的任意操作，happens-before 于线程 A 的 ThreadB.join() 操作
- 传递性

##### volatile的内存语义

- volatile的写相当于线程发送消息（变量刷新到主内存）
- volatile的读相当于线程接收消息（从主内存中读取变量）

##### 锁的内存语义

- 锁的释放相当于线程发送消息（变量刷新到主内存）
- 锁的获取相当于线程接收消息（从主内存中读取变量）

##### concurrent包的实现

- 声明共享变量为volatile
- 使用 CAS 的原子条件更新来实现线程之间的同步
- 配合 volatile 的读/写和 CAS 所具有的 volatile 读写内存语义来实现线程之间的通信

##### final的内存语义

- 构造函数内对一个 final 域的写入，happens-before 于把这个被构造对象的引用赋值给一个引用变量
- 初次读一个包含 final 域的对象的引用，happens-before 于初次读这个 final 域

##### 双重检查锁定（DCL）的问题

- 创建对象可以分解为三个指令，1）分配内存；2）初始化；3）赋值给引用变量
- 指令2 和 指令3 可能出现重排，导致线程拿到未初始化的对象

##### 解决 DCL 问题

- 使用`volatile`，禁止指令重排
- 使用类初始化机制

##### JMM（Java 内存模型）

- JMM屏蔽了不同处理器内存模型的差异，为程序员呈现一个一致的内存模型

<br/>
#### 第 4 章 Java 并发编程基础 *(线程的实现)*

##### 线程的状态

- `NEW`：初始状态
- `RUNNABLE`：运行状态（`RUNNING`、`READY`）
- `BLOCKED`：阻塞状态，线程阻塞于锁，线程处在对象的同步队列中
- `WAITING`：等待状态，等待其他线程通知或中断，线程处在对象的等待队列中
- `TIME_WAITING`：超时等待状态
- `TERMINATED`：终止状态

![](https://files.ciphermagic.cn/WechatIMG135.jpeg)

##### 启动和终止线程

- 子线程会继承父线程的`daemon`、`priority`、`inheritableThreadLocal`
- `suspend()`、`resume()` 调用后不会释放锁，因此弃用，使用 `wait()`、`notify()` 替代
- `stop()` 调用后不会保证线程资源的正常释放，因此弃用，使用 `interrupt()` 替代

##### 等待/通知机制

- `wait()`、`notify()`、`notifyAll()` 调用前需要先对**调用对象加锁**
- `wait()` 调用后，释放锁，将当前线程放入对象的**等待队列**
- `notify()`、`notifyAll()` 调用后，不会释放锁，将**等待队列**中的线程移到**同步队列**
- `wait()` 方法返回的前提是重新获得调用对象的锁


<br/>
#### 第 5 章 Java 中的锁

##### 队列同步器（AQS）

- 面向同步工具的实现者
- 提供同步状态管理、线程的排队、等待与唤醒等底层操作
- 维护一个FIFO双向队列来管理线程
- 可创建多个条件等待队列

##### 实现

- 定义内部类继承 AQS 并实现它的抽象方法，利用 AQS 实现锁的语义
- 重入锁
- 读写锁


<br/>
#### 第 6 章 Java 并发容器和框架

##### `ConcurrentHashMap`

- `HashMap` 在并发执行 `put` 操作时会导致 `Entry` 链表出现环，形成死循环
- 锁分段技术有效提升并发访问率

##### `ConcurrentLinkedQueue`

- 使用循环 `CAS` 的方式实现非阻塞式线程安全队列

##### 阻塞队列

- `ArrayBlockingQueue`：由数组组成的有界阻塞队列
- `LinkedBlockingQueue`：由链表组成的无界阻塞队列
- `PriorityBlockingQueue`：支持优先级排序的无界阻塞队列
- `DelayQueue`：使用优先级队列实现的无界阻塞队列，支持延时获取元素
- `SynchronousQueue`：不存储元素的阻塞队列
- `LinkedTransferQueue`：：由链表组成的无界阻塞队列
- `LinkedBlockingDeque`：：由链表组成的双向阻塞队列

##### Fork/Join 框架

- 某个线程从其他队列里窃取任务来执行

<br/>
#### 第 7 章 Java 中的原子操作类

##### 原子更新基本类型

- `AtomicBoolean`
- `AtomicInteger`
- `AtomicLong`

##### 原子更新数组

- `AtomicIntegerArray`
- `AtomicLongArray`
- `AtomicReferenceArray`

##### 原子更新引用类型

- `AtomicReference`
- `AtomicReferenceFieldUpdater`
- `AtomicMarkableReference`

##### 原子更新字段

- `AtomicIntegerFieldUpdater`
- `AtomicLongFieldUpdater`
- `AtomicStampedReference`


<br/>
#### 第 8 章 Java 中的并发工具类

- `CountDownLatch`：允许一个或多个线程等待其他线程完成操作
- `CyclicBarrier`：让一组线程到达一个屏障时被阻塞，直到最后一个线程到达
- `Semaphore`：控制同时访问特定资源的线程数量
- `Exchanger`：线程之间通过同步点彼此交换数据


<br/>
#### 第 9 章 Java 中的线程池 *(ThreadPoolExecutor)*

##### 任务队列（用于保存等待执行的任务的阻塞队列）

- `ArrayBlockingQueue`
- `LinkedBlockingQueue`
- `SynchronousQueue`
- `PriorityBlockingQueue`

##### 拒绝策略（队列和线程池饱满后对新任务的策略）

- `AbortPolicy`：直接抛出异常
- `CallerRunsPolicy`：只用调用者所在的线程来执行任务
- `DiscardOldPolicy`：丢弃队列里最近的一个任务，并执行当前任务
- `DiscardPolicy`：不处理，直接丢弃


<br/>
#### 第 10 章 Executor 框架 *(线程池框架)*

- `Executor`：基础接口，将任务的提交和任务的执行分离开来
- `ThreadPoolExecutor`：实现`Executor`，用来执行被提交的任务
- `Runnable` 和 `Callable`：被执行的任务
- `Future` 和 `FutureTask`：任务执行结果


<br/>
#### 第 11 章 Java 并发编程实践 *(应用与问题定位)*

- 生产者和消费者模式
- 异步任务池
