+++
title = "5天八股"
date = 2025-04-29T20:23:03+08:00
draft = false
description = ""
subtitle = "之Redis篇"
header_img = ""
short = false
toc = true
tags = []
categories = []
series = []
comment = false
summary = ""
+++

# Redis 核心数据结构与高性能原理

## 一、Redis 为什么快？

- **单线程模型**：避免多线程加锁和上下文切换，基于事件循环 + epoll。
- **纯内存存储**：数据全部在内存中，访问速度快。
- **高效的数据结构**：精心设计的结构匹配不同使用场景。
- **命令执行快**：大多数操作时间复杂度为 O(1) 或 O(logN)。

## 二、常见数据结构与底层实现

| 数据类型 | 应用场景 | 底层实现 |
|----------|----------|----------|
| String   | 计数器、Token、锁 | SDS（简单动态字符串） |
| List     | 消息队列、时间轴 | quicklist（ziplist + 链表） |
| Hash     | 用户信息、配置表 | ziplist / hashtable |
| Set      | 标签、去重集合 | intset / hashtable |
| SortedSet| 排行榜、延时队列 | skiplist + hashtable |
| Bitmap   | 用户打卡、签到 | 位数组 |
| HyperLogLog | UV 统计 | 概率数据结构（误差约 0.81%） |
| Geo      | LBS 应用 | SortedSet 实现 |
| Stream   | 消息队列、日志系统 | 双端链表 + Radix Tree + listpack |

## 三、对象编码机制（redisObject）

| 数据结构 | 编码方式 | 触发条件 |
|----------|----------|----------|
| String   | int / embstr / raw | embstr：短字符串（<= 39 字节） |
| List     | ziplist / quicklist | 元素较少时使用 ziplist |
| Hash     | ziplist / hashtable | 字段少且短时使用 ziplist |
| Set      | intset / hashtable | 小整数集合用 intset |
| SortedSet| ziplist / skiplist | 数据量小时 ziplist |
| Stream   | listpack / radix tree | 高效压缩消息块存储 |

## 四、内存优化机制

- **Jemalloc 内存分配器**：减少碎片，提高分配效率。
- **对象共享机制**：小整数值复用，节省内存。
- **惰性删除 + 定期删除**：处理过期键，减少阻塞。
- **压缩结构使用**：如 ziplist、intset 节省内存空间。

## 五、常见面试问题

1. **Redis 为什么是单线程还这么快？**  
   >因为 Redis 是纯内存操作 + 使用 epoll 实现的事件驱动模型，大多数命令是 O(1) 或 O(logN)，避免了多线程锁竞争和上下文切换。

2. **为什么 SortedSet 用 skiplist 而不是平衡树？**  
   >skiplist 插入/删除效率稳定（O(logN)），实现简单，支持范围查询更方便；相比平衡树更容易实现有序遍历。

3. **ziplist 和 hashtable 是如何切换的？**  
   >Hash 类型在字段数较少（默认 < 512）且字段和值较短（< 64字节）时使用 ziplist，否则切换为 hashtable。

4. **为什么 String 类型不直接用 char*，而用 SDS？**  
   >SDS 支持 O(1) 获取长度，自动扩容，避免缓冲区溢出，兼容二进制数据，解决 C 字符串的一些问题。

5. **quicklist 如何优化 List？与链表相比有什么优势？**  
   >quicklist 是 ziplist 与双向链表结合体，减少内存碎片和指针开销，提高 CPU 缓存命中率，同时保留链表快速插入删除特性。


# 自测
1. redis 的底层数据结构有哪些
2. redis 中的 SDS 和 C 语言中的字符串有什么区别，优点是什么 
3. redis 中的字典是如何实现的，如何解决冲突和扩容 
4. redis 的跳表的使用场景是什么，可以实现一下吗 
5. redis 缓存穿透，缓存击穿，缓存雪崩，热点数据集中失效 （常问） 
6. redis 的淘汰策略，来写一下 LRU 吧 
7. redis 的持久化方式，RDB 和 AOF 分别的使用场景 
8. redis 如何处理事务 redis 为什么那么快？ 
9. redis 是单线程为什么还那么快？ 
10. redis 的操作为什么是原子性的，如何保证原子性 
11. redis 集群用过哪些方案，分别怎么做。讲一下一致性哈希 
12. redis 什么情况下会出现性能问题，有什么处理办法？ 有没有使用过 
13. redis 的分布式锁，有什么优缺点 说一下 
14. redis 的内存模型 说一下 
15. redis 和 memcache 的区别 
16. 你用 redis 做过什么？（这里尽量不要讲只做过缓存，可以说一下队列，排行榜/计数器，发布/订阅） 
17. 你用过哪些非关系型数据库，都有什么特点，使用场景分别是什么（体现你技术广度的时刻到了，尽可能多说，但是不会的不要说，防止被问死） 
18. Mongodb 相对于 Mysql 有哪些优势，底层索引使用的数据结构是什么，为什么要使用这个 Mongodb 中的分片是什么意思