+++
title = "服务端面试之缓存篇"
date = 2025-05-03T20:23:03+08:00
draft = false
description = "Redis、MQ"
subtitle = ""
header_img = ""
short = false
toc = true
tags = []
categories = ["Computer Science"]
series = ["服务端技术系列", "面试复习"]
comment = false
summary = ""
hidden = true
+++

# Redis 核心数据结构与高性能原理

## 一、Redis 为什么快？

- **单线程模型**：避免多线程加锁和上下文切换，基于事件循环 + epoll。
- **纯内存存储**：数据全部在内存中，访问速度快。
- **高效的数据结构**：精心设计的结构匹配不同使用场景。
- **命令执行快**：大多数操作时间复杂度为 O(1) 或 O(logN)。

> 阿里的Tair对在开源redis上做了优化，主要采用了
> `多线程I/O + Worker模型`，多核下读写性能可达redis的3倍。 持久化方面也做了很多优化和扩展。
> 提供丰富的运维工具，top热key，大key监控非常便捷。HA、水平扩展等。

## 二、常见数据结构与底层实现

| 数据类型      | 应用场景 | 底层实现 |
|-----------|----------|----------|
| String    | 计数器、Token、锁 | SDS（简单动态字符串） |
| List      | 消息队列、时间轴 | quicklist（ziplist + 链表） |
| Hash      | 用户信息、配置表 | ziplist / hashtable |
| Set       | 标签、去重集合 | intset / hashtable |
| SortedSet | 排行榜、延时队列 | skiplist + hashtable |
| Bitmap    | 用户打卡、签到 | 位数组 |
| HyperLogLog | UV 统计 | 概率数据结构（误差约 0.81%） |
| Geo       | LBS 应用 | SortedSet 实现 |
| Stream    | 消息队列、日志系统 | 双端链表 + Radix Tree + listpack |

我亲身经历的工作内容：
1. **String** - `计数器`：业务上各种疲劳度计数、库存扣减；`缓存`：不用说了各种配置缓存（当持久化库用的），请求缓存，耗时查询结果缓存。**锁**：worker并发控制，兑换/购买流程请求防重防连击上锁，并发回源数据db保护上锁。
2. **List** - `消息队列`：简易版的，后台多worker处理经验过期，主push到list，多个worker去pop消费。易于控制消费节奏，可以随时查看队列状态。没有mq那么重。**时间轴**兑换x天y次这种疲劳度用list做的
3. **Hash** - `配置表`：也是配置，跟string一样，有些是string存的json，有些是直接用的hash。比较固定的配置就用string的json的，动态快速增长的就用hash了。
4. **SortedSet** - `延时队列` `排行榜`：后台worker任务的时候，为了动态控制worker数量和做一个监控，自己实现了一个小的注册中心，用的就是sortedSet，value是机器IP，score是心跳时间戳，定期去删除过期的。
5. **Bitmap** - 没用过，不过有一阵防黑产的时候考虑过做一个`布隆过滤器`，但是后来没做。主要工作交给网关（霸下）+风控+业务限制了。`点名器`：7日签到业务这种（其他同事的项目中有）

## 三、对象编码机制（redisObject）

| 数据结构 | 编码方式 | 触发条件                              |
|----------|----------|-----------------------------------|
| String   | int / embstr / raw | embstr：短字符串（<= 39 字节）             |
| List     | ziplist / quicklist | 元素较少时使用 ziplist                   |
| Hash     | ziplist / hashtable | 字段少且短时使用 ziplist                  |
| Set      | intset / hashtable | 小整数集合用 intset                     |
| SortedSet| ziplist / skiplist | 数据量小时 ziplist, 正常是skiplist + dict |
| Stream   | listpack / radix tree | 高效压缩消息块存储                         |

**关键点说明下**：
1. 底层`sds`就是优化后的`字符串`。
2. 底层`ziplist/listpack(5.0之后)`实际就是优化后的`链表`。
3. 底层`skiplist`实际就是`多级链表`组成的冗余结构，提高查找效率。
3. `List`就是`链表`。但实际上更复杂，外层是大链表，每个链表项又是一个优化后的数组（zipList/listPack），为了内存连续，减少内存碎片。
3. `Hash`就是`字典`。但实际上用两个`字典`维护，渐进式扩容（key比桶数量多了肯定就碰撞多了），字典2（更多的痛）迁移完了跟字典1引用对调一下就行了。
4. `SortedSet`用字典存节点，为了O(1)拿内容。范围是靠多级链表即`跳表`优化查找效率，连续扫描是靠最下层数据的`链表`实现的。

*5.0之后，`ziplist` 开始被 `listpack` 逐渐取代，这哥俩很有意思，他们本质上是优化后的数组，但是在Redis对各种数据结构里充当了非常多的角色:*

- 比如 `Hash` 如果元素数量太少，就用ziplist代替dict；
- 比如 `List` 如果元素太少就用ziplist代替quicklist（真正的链表结构），甚至quicklist内的元素本身不是一个，是多个元素组成的数组，也就是局部用的还是ziplist；
- 比如 `SortedSet` 如果元素太少的话跳表+字典都不用了，直接上ziplist。

究其本质原因，体现了Redis的设计哲学（也是redis为什么快的其中一个原因）
> **用紧凑线性结构（ziplist/listpack）优化小数据，提升 `内存利用率` 和 `CPU缓存局部性`**

## 四、常见缓存一致性问题

| 策略 | 说明 | 优缺点 |
|------|------|--------|
| **Cache Aside（旁路缓存）** | 应用先操作 DB，然后更新/删除缓存 | 常用，简单实用，但有并发风险 |
| **Write Through（写穿）** | 写入先进缓存，再同步 DB | 一致性高，但性能差，写慢 |
| **Write Behind（写回）** | 只写缓存，后台异步写 DB | 延迟高风险，适合非关键数据 |
| **订阅 Binlog / CDC** | 监听 DB 变更自动更新缓存 | 技术复杂，适用于读多写少且强一致需求 |

>最常用的是**Cache Aside**即改请求 `写库，删缓存` -> 查请求 `读库，写缓存` 配合完成缓存更新，适配大多数场景。 不过极端高并发情况下，确实会有极小概率导致不一致

**掰开了详细捋一遍**，`写库人-w` 和 `读库人-r` 是两个线程，假如他们实际发生的顺序是：
1. r读缓存，未命中（假设这个数据很久没读了，就是没有缓存）。 
2. w业务更新，开始事务写数据库，还未提交。 
3. r回源读库，读到value=old，准备接下来去写缓存，这个时候网络抖动了下... 
4. w事务已经提交，此时value=new，接下来去删除缓存。 
5. w删除缓存成功。 
6. r抖动结束，开始写缓存，把value=old写入缓存。

>所以，本身db和redis异构系统，除非引入非常复杂的分布式事务工具，不然解决不了墙一致性问题，但是有很多方法可以保证最终一致性：
1. 本身ttl时间很短，一会过期就好了，最终会一致。（我们绝大多数业务都这么干的，省事。）
2. 如果ttl不能太短，可以采取借助另一个后台线程扫描修正保证一致性。（我们很多配置缓存都这么干的，方便安全，key不多，10秒一扫db和redis都没压力。）
3. 延迟双删，上面的`写库人-w`增加一步，`写库` + `删缓存` + `1秒后再次删缓存`。（Go实现起来却是很方便，起个goroutine就行了，但不是极高并发、很强一致性要求的情况下不用这么复杂。）



# 自我测试题目列表
1. redis为什么是单线程还这么快
2. redis 的底层数据结构有哪些
2. redis 中的 SDS 和 C 语言中的字符串有什么区别，优点是什么
> 上方都有，往上翻。
3. redis 中的字典是如何实现的，如何解决冲突和扩容 
> 数据量少的时候使用的ziplist，节约空间，查询时间复杂度O(n)可接受, 量大的话就是用的哈希表了，value（也就是bucket）存储的是链表，处理哈希碰撞。
> 哈希冲突太多（实际的key多于bucket数量）的时候需要扩容，redis字典结构实际是有两个哈希表，一个是当前用的，另一个用于扩容，扩容是渐进式的，全部扩容完毕后，1和2对换一下就行了。
4. redis 的跳表的使用场景是什么，可以实现一下吗
> sortedSet使用跳表，用于高效的范围查询。实现的话就是多层数组（链表）来实现，底层全量，上层越往上越稀疏（跳跃）。
5. redis 缓存穿透，缓存击穿，缓存雪崩，热点数据集中失效 （常问） 
> 穿透：布隆过滤器，或者缓存一个空/假值，过期时间设小点。
> 击穿、雪崩：动态过期时间，热key哈希打散/或者热key常驻，配合本地缓存，回源数据时上锁。
6. redis 的淘汰策略，来写一下 LRU 吧 
> 主要基于LRU，标记。然后有惰性删除和后台线程定期扫描删除。
7. redis 的持久化方式，RDB 和 AOF 分别的使用场景 
> Redis 提供两种持久化方式：RDB 以快照形式周期性保存内存数据，适合冷备与快速恢复；AOF 则记录每条写命令，数据更完整，适合实时性高、要求高可用的场景。通常线上推荐 RDB + AOF 混合使用，兼顾性能和安全。
8. redis 如何处理事务
> ~~Redis 的内存模型主要由数据存储（dict 哈希表）、对象封装（RedisObject）、网络缓冲区、持久化缓冲、内存分配器等构成。Redis 所有 key 和 value 都存放在内存中，为提升性能，使用 jemalloc 做内存管理，同时通过不同编码结构减少内存占用。合理设置淘汰策略和限制 client 缓冲区是控制 Redis 内存的关键。~~
> Redis 使用 MULTI/EXEC 命令实现事务机制，将命令排入队列，统一串行执行。事务不支持回滚，适合执行小规模原子操作。可通过 WATCH 实现乐观锁，确保并发控制。
9. redis 是单线程为什么还那么快？ 
> 单线程模型，配合epoll事件轮询，没有线程间切换和处理锁的开销，所以快。
> redis 6.0之后/或者基于开源redis的定制化优化版本，比如阿里的tair，为了提高多核的效率，在网络层加入了多线程多IO/多worker线程处理任务，提高并发处理效率
10. redis 的操作为什么是原子性的，如何保证原子性 
> redis单线程模型，单个命令都是原子操作。
> 事务、或者lua脚本也都是命令进入队列，redis执行的时候仍然是单线程顺序执行，不会被中断。虽然不支持回滚，算不上是真正的原子性，但却是不能被并发破坏。
11. redis 集群用过哪些方案，分别怎么做。讲一下一致性哈希 
> 一致性哈希就是一个环上有多个点位，哈希值打到环上，找下一个点。扩容的时候只需要挪相邻的节点就行了。但是：一致性哈希为了解决节点变更时的大规模迁移问题，但本身并不能保证 key 均匀分布。为了解决数据倾斜，通常会引入虚拟节点机制：每个物理节点映射多个 hash 点到环上，增强分布均匀性，从而提升负载均衡效果。
12. redis 什么情况下会出现性能问题，有什么处理办法？ 有没有使用过 
> 我们用的tair，有个打分器，基本关注的就是：大key（要拆），热key（本地缓存，或拆），数据/访问倾斜（重新设计下key，争取打散，比如多个常驻key流量高，碰巧好几个都在一个分片上），慢查询：返回内容太多（这个基本没遇到过）
> 系统层面主要关注的就是：cpu（尖刺查问题，长时间太高了得升配），内存（必须预留足够的安全阈值，不然内存不足频繁淘汰扛不住的），网络吞吐、延迟（复制也受影响）。
13. redis 的分布式锁，有什么优缺点 说一下 
> 优点：快，简单，分布式
> 缺点：其实没遇到过缺点，硬说就是不可重入。再有就是复杂功能需要客户端自己实现比如自旋之类的。
14. redis 的内存模型 说一下 
15. redis 和 memcache 的区别
> 没用过memcache，不知道
16. 你用 redis 做过什么？（这里尽量不要讲只做过缓存，可以说一下队列，排行榜/计数器，发布/订阅） 
> 上面写了，锁，计数器，字典配置，延迟队列（排行榜），消息队列（list自己实现的用过，pub/sub也简单用过但当时不支持cluster）都用过了。
17. 你用过哪些非关系型数据库，都有什么特点，使用场景分别是什么（体现你技术广度的时刻到了，尽可能多说，但是不会的不要说，防止被问死） 
> redis, cassandra(pt时候记前端上报的用户行为日志), dynamodb（pt-dd时候记录数据源信息）, odps（amap时候做bi统计）, es（pt-lx时候记录用户行为数据并且做session结算）
18. Mongodb 相对于 Mysql 有哪些优势，底层索引使用的数据结构是什么，为什么要使用这个 Mongodb 中的分片是什么意思
> 精简版：非结构化，横向无限扩展，文档存储
> MongoDB 相比 MySQL 更适合非结构化、动态字段场景，支持横向分片扩展与文档模型；其索引底层基于 B+Tree，便于高性能范围查找；分片机制通过 mongos 路由请求、shard 存储数据，实现水平扩展能力，关键在于合理设计分片键。

# 复习中的自问自答

1. redis的`List`为何不直接使用链表，却要把ziplist加入进去，ziplist本质是数组，插入删除是O(n)，同时redis的list也不支持按照索引获取数据（实际支持，但是不推荐用，因为链表O(n)）
> Redis没采用纯链表实现List，是因为链表占用内存高、CPU缓存不友好(因为链表是分散的，不像数组是连续开辟内存)。为了提高内存效率和访问性能，Redis 用 ziplist 存多个元素，再用链表连接多个 ziplist，这种结构称为 quicklist。它兼顾了插入删除效率与空间利用，是 List 的默认实现方式。
> 多说一点，5.0之后，Redis开始弃用ziplist改用listpack（再次优化后的ziplist）

2. 数据结构选型问题，关于跳表
>**sortedList 选择跳表+Hash作为底层数据结构，排序、范围查询主要依赖跳表，那么选择跳表不选择红黑树的原因是？**
>
>| 比较点       | 跳表（SkipList）                        | 红黑树（Red-Black Tree）               |
>|--------------|------------------------------------------|----------------------------------------|
>| 实现复杂度   | 低（无需旋转）                            | 高（插入/删除需维护颜色+旋转）         |
>| 插入/删除性能 | 平均 O(logN)，最坏 O(N)（概率很低）       | 始终 O(logN)，但旋转频繁               |
>| 范围查询     | 非常自然，顺序遍历链表即可                 | 需要中序遍历实现                        |
>| 顺序访问     | ✅ 更适合，天然链表结构                   | ❌ 无法直接按顺序遍历                   |
>| 空间消耗     | 略高（多层指针）                           | 略低                                   |
>| 使用稳定性   | 非常好，均衡性概率控制可调（p, maxLevel） | 旋转逻辑复杂，影响调试与维护           |

>**mysql索引使用B+树，可以用跳表替代吗?**
>
>| 比较点           | 跳表                               | B+ 树（MySQL 索引）                    |
>|------------------|------------------------------------|----------------------------------------|
>| 是否适合磁盘访问 | ❌ 不适合，跳跃节点不连续，随机 I/O 多 | ✅ 适合，页为单位组织数据，节点顺序紧凑 |
>| I/O 次数控制     | 差，访问多层级指针带来随机跳转       | 好，树高低、扇出大，访问次数少（logN）  |
>| 顺序扫描性能     | 差，链表节点分布分散                 | 非常高效，叶子节点双向链表             |
>| 写入放大         | 高，跳表节点变化频繁                 | 控制合理，InnoDB 有插入缓冲            |
>| 查询优化         | 缺少页级管理                         | 支持 Buffer Pool、预读、合并、redo 日志等 |