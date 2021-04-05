---
title: Redis 命令大全
date: 2021-04-05 15:35
categories: 技术
tags: [redis] 
---

#### String

- `SET key value [EX seconds] [PX milliseconds] [XX|NX]` 为字符串键设置值, O(1)

- `GET key` 获取字符串键的值, O(1)

- `GETSET` 获取旧值并设置新值, O(1)

- `MSET key value [key value ...]` 一次为多个字符串键设置值, O(N), N 为用户指定的字符串键数量

- `MGET key [key ...]` 一次获取多个字符串键的值, O(N), N 为用户指定的字符串键数量

- `MSET key value [key value ...]` 只有键不存在的情况下,一次为多个字符串键设置值, O(N), N 为用户指定的字符串键数量

- `STRLEN key` 获取字符串值的字节长度, O(1)

- `GETRANGE key start end` 获取字符串值指定索引范围上的内容, O(N), N 为被返回内容的长度

- `SETRANGE key index substitute` 对字符串值的指定索引范围进行设置, O(N), N 为被修改内容的长度

- `APPEND key suffix` 追加新内容到值的末尾, O(N), N 为新追加内容的长度

- `INCRBY key increment` `DECRBY key increment` 对整数值执行加法操作和减法操作, O(1)

- `INCR key` `DECR key` 对整数值执行加 1 操作和减 1 操作, O(1)

- `INCRBYFLOAT key increment` 对整数值执行浮点数加法操作, O(1)    

- 缓存, 锁, ID 生成器, 计数器, 限速器

#### Hash

- `HSET hash field value` 为字段设置值, O(1)

- `HSETNX hash field value` 只有字段不存在的情况下为它设置值, O(1)

- `HGET hash field` 获取字段的值, O(1)

- `HINCRBY hash field increment` 对字段存储的整数执行加法或减法操作, O(1)

- `HINCRBYFLOAT hash field increment` 对字段存储的数字值执行浮点数加法或减法操作, O(1)

- `HSTRLEN hash field` 获取字段值的字节长度, O(1)

- `HEXISTS hash field` 检查字段是否存在, O(1)

- `HDEL hash field` 删除字段, O(1)

- `HLEN hash` 获取散列包含的字段数量, O(1)

- `HMSET hash field value [field value ...]` 一次为多个字段设置值, O(N), N 为被设置的字段数量

- `HMGET hash field [field ...]` 一次获取多个字段的值, O(N), N 为用户给定的字段数量

- `HKEYS hash` `HVALS hash` `HGETALL hash` 获取所有字段, 所有值, 所有字段和值, O(N), N 为散列包含的字段数量

- `HSCAN hash cursor [MATCH pattern] [COUNT number]` 以渐进的方式迭代给定散列包含的键值对, O(N), N 为被迭代元素的数量

- 短网址, 用户登录会话, 存储图数据

#### List

- `LPUSH list item [item ...]` 将元素推入列表左端, O(N), N 为被推入列表的元素数量

- `RPUSH list item [item ...]` 将元素推入列表右端, O(N), N 为被推入列表的元素数量

- `LPUSHX list item` `RPUSHX list item` 只对已存在的列表执行推入操作, O(1)

- `LPOP list` 弹出列表最左端的元素, O(1)

- `RPOP list` 弹出列表最右端的元素, O(1)

- `RPOPLPUSH source target` 将右端弹出的元素推入左端, O(1)

- `LLEN list` 获取列表的长度, O(1)

- `LINDEX list index` 获取指定索引上的元素, O(N), N 为给定列表的长度

- `LRANGE list start end` 获取指定索引范围上的元素, O(N), N 为给定列表的长度

- `LSET list index new_element` 为指定索引设置新元素, O(N), N 为给定列表的长度

- `LINSERT list BEFORE|AFTER target_element new_element` 将元素插入列表, O(N), N 为给定列表的长度 

- `LTRIM list start end` 修建列表, O(N), N 为给定列表的长度 

- `LREM list count element` 从列表中移除指定元素, O(N), N 为给定列表的长度 

- `BLPOP list [list ...] timeout` 阻塞式左端弹出操作, O(N), N 为用户给定的列表数量

- `BRPOP list [list ...] timeout` 阻塞式右端弹出操作, O(N), N 为用户给定的列表数量

- `BRPOPLPUSH source target timeout` 阻塞式弹出并推入操作, O(1)

- 消息队列, 分页, 待办事项列表

#### Set

- `SADD set element [element ...]` 将元素添加到集合, O(N), N 为用户给定的元素数量

- `SREM set element [element ...]` 从集合中移除元素, O(N), N 为用户给定的元素数量

- `SMOVE source target element` 将元素从一个集合移动到另一个集合, O(1)

- `SMEMBERS set` 获取集合包含的所有元素, O(N), N 为集合包含的元素数量

- `SCARD set` 获取集合包含的元素数量, O(1)

- `SISMEMBER set element` 检查给定元素是否存在于集合, O(1)

- `SRANDMEMBER set [count]` 随机获取集合中的元素, O(N), N 为被返回的元素数量

- `SPOP key [count]` 随机地从集合中移除指定数量的元素, O(N), N 为被移除的元素数量

- `SINTERSTORE [destination_key] set [set ...]` 对集合执行交集计算, O(N*M), N 为给定集合的数量, M 为给定集合中, 包含元素最少的那个集合的大小

- `SUNION [destination_key] set [set ...]` 对集合执行并集计算, O(N), N 为所有给定集合包含的元素数量总和

- `SIDFF [destination_key] set [set ...]` 对集合执行差集计算, O(N), N 为所有给定集合包含的元素数量总和

- `SSCAN hash cursor [MATCH pattern] [COUNT number]` 以渐进的方式迭代给定集合包含的元素, O(N), N 为被迭代元素的数量

- 唯一计数器, 打标签, 点赞, 投票, 社交关系, 抽奖, 共同关注与推荐关注, 商品筛选器


#### Sorter Set

- `ZADD sorted_set [XX|NX] [CH] score member [score member ...]` 添加或更新成员, O(M*log(N)), M 为给定成员的数量, N 为有序集合包含的成员数量

- `ZREM sorted_set member [member ...]` 移除指定的成员, O(M*log(N)), M 为给定成员的数量, N 为有序集合包含的成员数量

- `ZSCORE sorted_set member` 获取成员的分值, O(1)

- `ZINCRBY sorted_set increment member` 对成员的分值执行自增或自减操作, O(log(N)), N 为有序集合包含的成员数量

- `ZCARD sorted_set` 获取有序集合的大小, O(1)

- `Z[REV]RANK sorted_set member` 获取成员在有序集合中的排名, O(log(N)), N 为有序集合包含的成员数量

- `Z[REV]RANGE sorted_set start end [WITHSCORES]` 获取指定索引范围内的成员, O(log(N) + M), N 为有序集合包含的成员数量, M 为命令返回的成员数量

- `Z[REV]RANGEBYSCORE sorted_set max min [WITHSCORES] [LIMIT offset count]` 获取指定分值范围内的成员, O(log(N) + M), N 为有序集合包含的成员数量, M 为命令返回的成员数量

- `ZCOUNT sorted_set min max` 统计指定分值范围内的成员数量, O(log(N)), N 为有序集合包含的成员数量

- `ZREMRANGEBYRANK sorted_set start end` 移除指定排名范围内的成员, O(log(N) + M), N 为有序集合包含的成员数量, M 为被移除的成员数量

- `ZREMRANGEBYSCORE sorted_set min max` 移除指定分值范围内的成员, O(log(N) + M), N 为有序集合包含的成员数量, M 为被移除的成员数量

- `ZUNIONSTORE destination numbers sorted_set [sorted_set ...] [AGGRECATE SUM|MIN|MAX] [WEIGHTS weight [weight ...]]` 有序集合的并集运算, O(N*log(N)), N 为给定的有序集合的成员总数量

- `ZINTERSTORE destination numbers sorted_set [sorted_set ...] [AGGRECATE SUM|MIN|MAX] [WEIGHTS weight [weight ...]]` 有序集合的交集运算, O(N\*log(N)\*M), N 为所有给定的有序集合中,基数最小的那个有序集合的基数,M 为给定有序集合的数量

- `Z[REV]RANGEBYLEX sorted_set min max [LIMIT offset count]` 返回指定字典序范围内的成员, O(log(N) + M), N 为有序集合包含的元素数量, M 为命令返回的成员数量

- `ZLEXCOUNT sorted_set min max` 统计位于字典序指定范围内的成员数量, O(log(N)), N 为有序集合中包含的成员数量

- `ZREMRANGEBYLEX sorted_set min max` 移除位于字典序指定范围内的成员, O(log(N) + M), N 为有序集合包含的元素数量, M 为被移除的成员数量

- `ZPOP[MAX|MIN] sorted_set [count]` 弹出分值最高和最低的成员, O(N), N 为命令移除的元素数量

- `BZPOP[MAX|MIN] sorted_set [sorted_set ...] timeout` 阻塞式弹出分值最高和最低的成员, O(N), N 为命令移除的元素数量

- `ZSCAN hash cursor [MATCH pattern] [COUNT number]` 以渐进的方式迭代给定有序集合包含的成员和分值, O(N), N 为被迭代元素的数量

- 排行榜, 时间线, 商品推荐, 自动补全


#### HyperLogLog

- `PFADD hyperloglog element [element ...]` 对集合元素进行计数, O(N), N 为用户给定的元素数量

- `PFCOUNT hyperloglog [hyperloglog ...]` 返回集合的近似基数, O(N), N 为用户给定的 HyperLogLog 数量

- `PFMERGE destination hyperloglog [hyperloglog ...]` 计算多个 HyperLogLog 的并集, O(N), N 为用户给定的 HyperLogLog 数量

- 唯一计数器, 检测重复信息, 每周/月度/年度计数器


#### Bitmap

- `SETBIT bitmap offset value` 设置二进制位的值, O(1)

- `GETBIT bitmap offset` 获取二进制位的值, O(1)

- `BITCOUNT key [start end]` 统计被设置的二进制位数量, O(N), N 为被统计字节的数量

- `BITPOS bitmap value [start end]` 查找第一个指定的二进制位值, O(N), N 为查找涉及的字节数量 

- `BITOP [AND|OR|XOR|NOT] result_key bitmap [bitmap ...]` 执行二进制位运算, O(N), N 为查找涉及的字节总数量 

- `BITFIELD bitmap [SET|GET|INCRBY|OVERFLOW]` 在位图中存储整数值, O(N), N 为用户给定的子命令数量

- 用户行为记录器, 0-1 矩阵, 紧凑计数器

#### GEO

- `GEOADD location_set longitude latitude name [longitude latitude name ...]` 存储坐标, O(log(N) * M), N 为位置集合目前包含的位置数量, M 为用户给定的位置数量

- `GEOPOS location_set name [name ...]` 获取指定位置的坐标, O(log(N) * M), N 为位置集合目前包含的位置数量, M 为用户给定的位置数量

- `GEODIST location_set name1 name2 [m|km|mi|ft]` 计算两个位置之间的直线距离, O(log(N)), N 为位置集合目前包含的位置数量

- `GEORADIUS location_set longitude latitude redius unit [WITHHASH] [WITHDIST] [WITHCOORD] [ASC|DESC] [COUNT n]` 查找指定坐标半径范围内的其他位置, O(N), N 为命令实施范围查找时检查的位置数量

- `GEORADIUSBYMEMBER location_set name radius unit [WITHHASH] [WITHDIST] [WITHCOORD] [ASC|DESC] [COUNT n]` 查找指定位置半径范围内的其他位置, O(N), N 为命令实施范围查找时检查的位置数量

- `GEOHASH location_set name [name ...]` 获取指定位置的 Geohash 值, O(N), N 为用户给定的位置数量 

- 用户地理位置, 查找附近用户

#### Stream

- `XADD stream [MAXLEN len] id field value [field value ...]` 追加新元素到流的末尾, O(log(N)), N 为流目前包含的元素数量

- `XTRIM stream MAXLEN len` 对流进行修剪, O(log(N) + M), N 为执行修剪操作前流包含的元素数量, M 为被移除元素的数量

- `XDEL stream [id id ... id]` 移除指定元素, O(log(N) + M), N 为流包含的元素数量, M 为被移除元素的数量

- `XLEN strem` 获取流包含的元素数量, O(1)

- `X[REV]RANGE stream start-id end-id [COUNT n]` 访问流中的元素, O(log(N) + M), N 为流包含的元素数量, M 为命令返回的元素数量

- `XREAD [BLOCK ms] [COUNT n] STREAMS stream1 stream2 ... id1 id2 ...` 以阻塞或非阻塞方式获取流元素, O((log(N) + M) * I), 获取单个流的复杂度为O(log(N) + M), I 为流的数量

- `XGROUP CREATE stream group start_id` 创建消费者组, O(1)

- `XGROUP SETID stream group id` 修改消费者组的最后递送消息 ID, O(1)

- `XGROUP DELCONSUMER stream group consumer` 删除消费者, O(N), N 为被删除消费者正在处理的消息数量

- `XGROUP DESTROY stream group` 删除消费者组, O(N + M), N 为消费者组被删除是, 仍处理'待处理'状态的消息数量, M 为该组属下消费者的数量

- `XREADGROUP GROUP group consumer [COUNT n] [BLOCK ms] STREAMS stream [stream ...] id [id ...]` 读取消费者组,  O((log(N) + M) * I), 获取单个流的复杂度为O(log(N) + M), I 为流的数量

- `XACK stream group id [id id ...]` 消费者确认消息, O(N), N 为用户给定的消息 ID 数量

- `XPENDING stream group [start stop count] [consumer]` 显示待处理消息的相关信息, O(log(N) + M), N 为消费者组目前待处理的消息数量, M 为命令返回的消息数量

- `XCLAIM stream group new_consumer max_pending_time id [id id ...]` 转移消息的归属权, O(N), N 为用户给定的消息 ID 数量

- `XINFO CONSUMERS stream group-name` 查看流和消费者组的相关信息, O(N), N 为消费者组的消费者数量

- 消息队列, 


#### DataBase

- `SELECT db` 切换至指定的数据库, O(1)

- `KEYS pattern` 获取所有与给定匹配符相匹配的键, O(N), N 为数据库包含的键数量

- `SCAN cursor [MATCH pattern] [COUNT number]` 迭代与给定匹配符相匹配的键, O(N), N 为被迭代元素的数量

- `RANDOMKEY` 随机返回一个键, O(1)

- `SORT key [ASC|DESC] [ALPHA] [LIMIT offset count] [[GET pattern] [GET pattern] ...] [STORE destination]` 对键的值进行排序, O(N * log(N) + M), N 为被排序元素的数量, M 为命令返回的元素数量

- `EXISTS key [key ...]` 检查给定键是否存在, O(N), N 为用户给定的键数量

- `DBSIZE` 获取数据库包含的键值对数量, O(1)

- `TYPE key` 查看键的类型, O(1)

- `RENAME[NX] origin new` 修改键名, O(1)

- `MOVE key db` 将给定的键移动到另一个数据库, O(1)

- `DEL key [key ...]` 移除指定的键, O(N), N 为被移除的数量

- `UNLINK key [key ...]` 异步方式移除指定的键, O(N), N 为被移除的数量

- `FLUSHDB [async]` 清空当前数据库, O(N), N 为被清空数据库包含的键值对数量

- `FLUSHALL [async]` 清空所有数据库, O(N), N 为被清空的所有数据库包含的键值对数量

- `SWAPDB x y` 互换数据库, O(1)

- 在线替换数据库


#### Expire

- `[P]EXPIRE key seconds|milliseconds` 设置生存时间, O(1)

- `[P]EXPIREAT key seconds_timestamp|milliseconds_timestamp` 设置过期时间, O(1)

- `[P]TTL key` 获取键的剩余生存时间, O(1)

- 自动过期的登陆会话, 自动淘汰冷门数据


#### Transaction

- `MULTI` 开启事务, O(1)

- `EXEC` 执行事务, 复杂度为事务包含的所有命令的复杂度之和

- `DISCARD` 放弃事务, O(N), N 为事务队列包含的命令数量

- `WATCH key [key ...]` 对键进行监视, O(N), N 为被监视键的数量

- `UNWATCH` 取消对键的监视, O(N), N 为被取消监视的键数量


#### Lua Script

- `EVAL script numkeys key [key ...] arg [arg ...]` 执行脚本

- `SCRIPT LOAD script` 缓存脚本

- `EVALSHA sha1 numkeys key [key ...] arg [arg ...]` 执行已被缓存的脚本

- `SCRIPT EXISTS sha1 [sha1 ...]` 检查脚本是否已被缓存

- `SCRIPT FLUSH` 移除所有已缓存脚本

- `SCRIPT KILL` 强制停止正在运行的脚本


#### Persistence

- `SAVE` 阻塞服务器并创建 RDB 文件, O(N), N 为服务器所有数据库包含的键值对总数量

- `BGSAVE` 非阻塞方式创建 RDB 文件, O(N), N 为服务器所有数据库包含的键值对总数量

- `BGREWRITEAOF` 触发 AOF 重写操作, O(N), N 为服务器所有数据库包含的键值对总数量

- `SHUTDOWN [save|nosave]` 关闭服务器


#### Pub / Sub

- `PUBLISH channel message` 向频道发送消息, O(N+M), N 为给定频道的订阅者数量, M 为服务器目前被订阅的模式总数量

- `SUBSCRIBE channel [channel ...]` 订阅频道, O(N), N 为用户输入的频道数量

- `UNSUBSCRIBE channel [channel ...]` 退订频道, O(N), N 为用户输入的频道数量

- `PSUBSCRIBE pattern [pattern ...]` 订阅模式, O(N), N 为用户输入的模式数量

- `PUNSUBSCRIBE pattern [pattern ...]` 退订模式, O(N*M), N 为用户给定的模式数量, M 为服务器目前被订阅的模式总数量

- `PUBSUB CHANNELS [pattern]` 查看被订阅的频道, O(N), N 为服务器目前被订阅的频道总数量

- `PUBSUB NUMSUB [channel channel ...]` 查看频道的订阅者数量, O(N), N 为用户给定的频道数量

- `PUBSUB NUMPAT` 查看被订阅模式的总数量, O(1)

- 广播系统


#### Module

- ReJson

- RediSQL

- RediSearch


#### Replication

- `REPLICAOF host port` 将服务器设置为从服务器

- `REPLICAOF no one` 取消复制

- `ROLE` 查看服务器的角色


#### Sentinel

- `SENTINEL masters` 获取所有被监视主服务器的信息

- `SENTINEL master <master-name>` 获取指定被监视主服务器的信息

- `SENTINEL slaves <master-name>` 获取被监视主服务器的从服务器信息

- `SENTINEL sentinels <master-name>` 获取其他 Sentinel 的相关信息

- `SENTINEL get-master-addr-by-name <master-name>` 获取给定主服务器的 IP 地址和端口号

- `SENTINEL reset <pattern>` 重置主服务器状态

- `SENTINEL failover <master-name>` 强制执行故障转移

- `SENTINEL ckquorum <master-name>` 检查可用 Sentinel 的数量

- `SENTINEL flushconfig` 强制写入配置文件

- `SENTINEL monitor <master-name> <ip> <port> <quorum>` 监视给定主服务器

- `SENTINEL remove <masters-name>` 取消对给定主服务器的监视

- `SENTINEL set <master-name> <option> <value>` 修改 Sentinel 配置选项的值


#### Cluster

- `CLUSTER MEET ip port` 将节点添加至集群

- `CLUSTER NODES` 查看集群内所有节点的相关信息

- `CLUSTER MYID` 查看当前节点的运行 ID

- `CLUSTER INFO` 查看集群信息

- `CLUSTER FORGET node-id` 从集群中移除节点

- `CLUSTER REPLICATE master-id` 将节点变为从节点

- `CLUSTER REPLICAS node-id` 查看给定节点的所有从节点

- `CLUSTER FAILOVER [FORCE|TAKEOVER]` 强制执行故障转移

- `CLUSTER RESET [SOFT|HARD]` 重置节点

- `CLUSTER SLOTS` 查看槽与节点之间的关联信息

- `CLUSTER ADDSLOTS slot [slot ...]` 把槽指派给节点

- `CLUSTER DELSLOTS slot [slot ...]` 撤销对节点的槽指派

- `CLUSTER FLUSHSLOTS` 撤销对节点的所有槽指派

- `CLUSTER KEYSLOT key` 查看键所属的槽

- `CLUSTER COUNTKEYSINSLOT slot` 查看槽包含的键数量

- `CLUSTER GETKEYSINSLOT slot count` 获取槽包含的键

> *参考：《Redis使用手册》黄建宏 机械工业出版社 2019年9月版*

