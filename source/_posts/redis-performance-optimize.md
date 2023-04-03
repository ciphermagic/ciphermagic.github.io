---
title: Redis 性能优化
date: 2022-05-02 17:31
categories: 技术
tags: [redis] 
---

#### 阻塞点

- 集合全量查询和聚合操作；
- bigkey 删除；
- 清空数据库；
- AOF 日志同步写；
- 从库加载 RDB 文件；

#### 异步机制处理阻塞点

- bigkey 删除、清空数据库：4.0版本后支持异步删除数据（`UNLINK`、`FLUSHDB ASYNC`），旧版本可以先`SCAN`读取数据，再进行删除；
- AOF 日志同步写：AOF 日志配置成 everysec 选项后，可以异步执行；

#### 无法异步处理的阻塞点优化

- 集合全量查询和聚合操作：先`SCAN`读取数据，再在客户端计算；
- 从库加载 RDB 文件：主库数据量控制在 2-4GB 左右；

#### CPU 多核对 Redis 性能的影响

Redis 实例被频繁调度到不同 CPU 核上运行，导致上下文切换频繁。

解决：通过`taskset`命令把 Redis 实例绑定到一个物理核上。

#### CPU 的 NUMA 架构对 Redis 性能的影响

如果网络中断处理程序和 Redis 实例各自绑定的 CPU 核不在同一个 CPU Socket 上，那么 Redis 读取网络数据时，就要跨 CPU Socket 访问内存。

解决：把 Redis 实例和网络中断处理程序绑在同一个 CPU Socket 下的不同核行。

#### Redis 性能调优

- 获取 Redis 实例在当前环境下的基准性能`redis-cli --intrinsic-latency 120`
- 排查慢查询命令
- 排查过期 key 的时间设置
- 排查 bigkey
- 排查 AOF 配置级别
- 排查操作系统 swap
- 排查操作系统大页机制，大页机制影响 Redis 的 copy on write
- 主从集群时控制主库 RDB 大小
- 把 Redis 实例绑定物理核，和网络中断处理程序绑定在同一个 CPU Socket 上

#### Redis 自动内存碎片清理

- `info`： 查看碎片率
- `config set activefrag yes` ：开启自动清理
- `active-defrag-ignore-bytes 100mb`：表示内存碎片的字节数达到 100MB 时，开始清理；
- `active-defrag-threshold-lower 10`：表示内存碎片空间占操作系统分配给 Redis 的总空间比例达到 10% 时，开始清理；
- `active-defrag-cycle-min 25`：表示自动清理过程所用 CPU 时间的比例不低于 25%，保证清理能正常开展；
- `active-defrag-cycle-max 75`：表示自动清理过程所用 CPU 时间的比例不高于 75%，一旦超过，就停止清理，从而避免在清理时，大量的内存拷贝阻塞 Redis，导致响应延迟升高；


