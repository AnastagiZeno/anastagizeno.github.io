+++
title = "系统设计之点赞系统（B站）"
date = 2025-05-12T15:49:51+08:00
draft = false
description = ""
subtitle = ""
header_img = ""
short = false
toc = true
tags = ["系统设计"]
categories = ["Computer Science"]
series = ["系统设计实战系列", "面试复习"]
comment = false
summary = ""
hidden = true
+++

# 点赞系统设计全流程复盘（详细版）

> 面试岗位：资深 Golang 工程师
> 场景背景：短视频点赞系统设计，真实大厂高频题模拟

## 🌟 总体系统设计题目（入口问题）

### 🧾 原始题干：

> 请你设计一个短视频点赞系统，要求支持：
>
> * 视频点赞/取消点赞
> * 点赞数可实时展示（弱一致可接受）
> * 支持用户点赞列表查询
> * 高并发：千万级 DAU，点赞写入 QPS 万级

### 🗣️ 你的原始回答记录：

首先业务场景要求千万级DAU，万级别DPS。而且我分析此类业务场景一般对一致性的要求都不是特别强一致，通常更看重吞吐、并发以及实时行。那么我自然首先想到通过缓存来抗流量，然后异步去做持久化。那么首先一个视频点赞最重要的就是点赞数的计数或增加、减少，其次是对于单用户的已点赞视频的记录列表这么两个核心场景。我认为这两个功能都可以很容易的通过redis来实现，涉及到数据模型设计先看缓存部分，每个视频都有一个计数器，redis的string的incr和decr可以很容易实现这一点，单key可以比较轻松的抗十万级的流量，而一般集群部署或者大厂常用的分片+主从部署方式可以很容易对大量视频进行打散同时保证高可用。另外对于单视频可以通过bitmap也就是位数组的方式记录点赞此视频的用户，也就是uid通过hash落位到位数组上面。对于单用户而言，也可以同样使用位数组来对他点过赞的视频进行一个标记。以上部分在高并发+准实时方面抗万级QPS通常是没问题的。对于用户点赞的视频列表这一项，热数据（热门视频的介绍、封面等信息）一定是在缓存中，热门视频信息可以通过缓存预热、常驻、复制多key的方式分摊流量、防止击穿等。以上信息的持久化可以通过消息、或者后台任务进行异步汇总入库，尤其像视频点赞数这种可以通过定期同步的方式保证最终一致。随着时间增长、数据热度下降。缓存中的内容已经持久化完整之后，可以考虑淘汰。另外在性能优化方面对于高热视频点赞的请求也可以通过消息队列异步化来达到削峰填谷的目的，保证流量洪峰平稳度过。


### 🧩 回答结构提炼摘要：

* 点赞行为可拆解为两大维度：

  * 视频维度：点赞数统计（Redis + 持久化）
  * 用户维度：点赞状态记录（Bitmap / Set）

* **缓存抗压**：

  * Redis String（INCR/DECR）维护视频点赞数
  * Redis Bitmap 记录用户点赞标记
  * 用户点赞列表用 Set or BitArray 结构标记

* **写入策略**：

  * 写入 Redis 实时更新
  * 异步发送消息队列入库（Kafka/RocketMQ）

* **读取策略**：

  * 展示页读取 Redis 计数器
  * 用户查询点赞列表：冷热数据分离，热门走缓存

* **一致性策略**：

  * Redis 提供“准实时”写快照
  * Kafka 异步落 MySQL，ClickHouse做归档

### 🧠 回答分析与补充建议（关键词：`核心路径拆分` `缓存抗压` `最终一致性` `幂等控制`）

#### 🧾 初步结构评分：

| 模块        | 表现    | 说明                                        |
| --------- | ----- | ----------------------------------------- |
| **场景分析**  | ⭐⭐⭐⭐  | 准确判断弱一致业务优先吞吐，具备 C 端经验视角                  |
| **核心建模**  | ⭐⭐⭐⭐  | 点赞计数 / 用户点赞列表 拆分合理；数据建模专业                 |
| **缓存策略**  | ⭐⭐⭐⭐⭐ | Redis String + Bitmap 使用合理，展现高并发 Redis 经验 |
| **持久化机制** | ⭐⭐⭐⭐  | 异步写库、冷热分层、MQ 削峰等方案结构清晰                    |
| **流量控制**  | ⭐⭐⭐   | 提及削峰填谷，建议更具体化流量防抖、合并策略可加分                 |

* ✅ 优点：

  * 拆解出视频计数和用户点赞行为两个关键子系统，合理；
  * 合理使用 Redis INCR/DECR、Bitmap、Set，缓存层设计清晰；
  * 有 Kafka 异步落库、冷热分层、消息削峰等关键意识，结构完整。

* ❗️可优化点：

  * 幂等控制逻辑未提及（如何防止重复点赞写入）
  * Redis 写失败 / 丢失后的降级路径、恢复策略未说明
  * Kafka 消费幂等与 DB 落库模型未交代
  * 用户点赞列表未区分“行为 vs 状态”视角，Bitmap 不适合作为唯一判断依据

### ✅ 面试口述推荐总结（关键词：`核心路径拆分` `Redis抗压` `消息解耦` `幂等` `最终一致性`）

> 在设计一个高并发点赞系统时，我会将其拆分为两大核心路径：点赞计数和用户行为状态。
>
> 点赞数使用 Redis 计数器抗压，用户点赞状态可用 Bitmap 或 Set 按 UID 维度存储；所有行为写入消息队列异步落库，数据库做最终一致性兜底。
>
> 热点数据实时可读，冷数据延迟更新。整个链路采用读写解耦、弱一致、幂等保障策略，确保高并发场景下系统的稳定性和可用性。（关键词：`核心路径拆分` `Redis抗压` `消息解耦` `幂等` `最终一致性`）：
> 在设计一个高并发点赞系统时，我会将其拆分为两大核心路径：点赞计数和用户行为状态。点赞数使用 Redis 计数器做前置抗压，用户点赞状态可使用 Bitmap 或 Set 存储，并按 UID 分布。
>
> 所有点赞行为写入 Kafka 等消息队列后异步落库，Redis 提供实时读取性能，数据库保证数据完整一致。整个链路是写快、读快、弱一致；最终通过 Kafka 消息与落库补偿保障最终一致性。读写解耦 + 幂等判断 + 热点削峰构成高可用骨架。


# 追问Q1～Q5高质量问答复盘

### ✅ Q1. Redis 宕机或写失败时系统如何降级？

#### 🗣️ 你的原始回答记录：

Redis 多为主从分布式部署，发生宕机会自动触发主从切换。
对于无法短时间恢复的情况：

* 非核心流量直接降级提示（如活动页）
* 核心路径（热视频点赞）将请求写入消息队列，Redis 恢复后处理消费。
  读取路径提示“数据延迟”，保守估算展示值。
  幂等通过 bitmap 保证，避免重复处理。

#### 🧾 结构评分：

| 模块          | 表现   | 说明                        |
| ----------- | ---- | ------------------------- |
| Redis 高可用机制 | ⭐⭐⭐⭐ | 说明有部署经验，明确主从切换 + 节点容错机制   |
| 写失败降级处理     | ⭐⭐⭐⭐ | 能分级处理（核心 vs 非核心），具备系统恢复思维 |
| 幂等容错理解      | ⭐⭐   | 误以为 bitmap 能保障幂等，存在误区     |
| 数据展示一致性提示   | ⭐⭐⭐  | 弱一致容忍度合适，建议可以补展示层更具体的策略提示 |

#### 💡 点评 + 建议补充：

* Redis 故障容错思路清晰，兼顾高可用与用户体验；
* 可补充 fallback queue 或本地 buffer 作为 Redis 写失败时兜底手段；
* bitmap 是结果结构，不能用作行为幂等判断，应使用 SETNX 或唯一键控制重复。

#### ✅ 面试口述推荐总结（关键词：`Redis容错` `写失败降级` `弱一致提示` `幂等保障`）

> 当 Redis 宕机时，系统优先通过主从切换快速恢复；若仍不可用，核心路径请求进入消息队列异步落库，非核心页面提示降级。
> 展示层采用估算数值 + 延迟提示容忍弱一致；幂等控制不应依赖 bitmap，而通过 SETNX 或数据库唯一键判断是否已处理。

### ✅ Q2. Kafka 是“至少一次”语义，如何避免重复消费落库？

#### 🗣️ 你的原始回答记录：

Kafka/RocketMQ 默认至少一次投递。
通过 DB 设计唯一索引 `(uid, vid)` 保证消费幂等。
或者用 Redis 的 SETNX 先判断是否已消费。
超过重试次数则进入死信队列（DLQ），触发报警和人工介入。

#### 🧾 结构评分：

| 模块        | 表现   | 说明                                 |
| --------- | ---- | ---------------------------------- |
| 投递语义理解    | ⭐⭐⭐⭐ | 明确 Kafka/RMQ 是“至少一次”语义             |
| 幂等处理机制    | ⭐⭐⭐⭐ | 使用唯一索引或 SETNX 实现幂等控制，常见正确做法        |
| 重试与死信策略   | ⭐⭐⭐  | 能识别死信队列机制，但未说明失败后是否支持补偿            |
| 消费逻辑通用性抽象 | ⭐⭐   | 未提 handler 层统一逻辑封装策略，可补充说明防重模式复用能力 |

#### 💡 点评 + 建议补充：

* 消息系统的投递语义掌握清晰，幂等点位选择合理（唯一键 + SETNX）
* 建议补充消费 handler 统一封装逻辑（处理幂等、重试、告警一致）
* 可进一步提及 Kafka 幂等 producer、Exactly-Once 保证的适用范围（Kafka→Kafka）

#### ✅ 面试口述推荐总结（关键词：`至少一次语义` `幂等落库` `消费防重` `DLQ容错`）

> Kafka 默认提供至少一次语义，因此消费端要保证幂等。
> 我通常会通过数据库唯一键 `(uid, vid)` 控制重复插入，或在写库前使用 Redis 的 SETNX 判断行为是否已处理。
> 消费 handler 层抽象幂等控制 + 日志埋点逻辑，确保不同业务链路下处理行为一致。
> 消费失败自动重试，达到阈值后写入死信队列，触发报警或由补偿系统统一处理异常消息。


### ✅ Q3. Bitmap 判断是否已点赞是否安全？

#### 🗣️ 你的原始回答记录：

Bitmap 是当前状态的表达，并非行为轨迹。
点赞→取消后 bitmap 仍为 0，但实际发生了两个行为。
如果并发两次点赞请求都读到 0，就会重复写入。

#### 🧾 结构评分：

| 模块         | 表现   | 说明                                          |
| ---------- | ---- | ------------------------------------------- |
| 状态 vs 行为区分 | ⭐⭐⭐⭐ | 明确指出 bitmap 是状态，不是行为记录，认知清晰                 |
| 并发判断意识     | ⭐⭐⭐⭐ | 能识别 GETBIT+SETBIT 的并发时序问题，逻辑严谨              |
| 原子操作理解     | ⭐⭐   | 没有指出 GETBIT+SETBIT 非原子组合，应补充 Lua 或 SETNX 替代 |
| 替代方案提及     | ⭐⭐   | 没有主动提及 Redis 原子方案如 SETNX、Lua 脚本             |

#### 💡 点评 + 建议补充：

* 你识别出了 bitmap 与行为幂等判断之间的鸿沟，重点清晰；
* 并发竞态视角具备，是实际系统中踩过坑的人才有的意识；
* 可加强：指出 Redis 中 GETBIT+SETBIT 是两个指令，非原子，可能导致数据竞争；
* 推荐使用 SETNX 或封装 Lua 脚本实现原子“判断+写入”操作，具备幂等保障能力。

#### ✅ 面试口述推荐总结（关键词：`bitmap误用` `状态与行为分离` `幂等控制` `原子性判断`）

> Redis Bitmap 是表达某用户当前点赞状态的结构，但并不能作为幂等判断依据。
> 在高并发下，两个请求可能同时 GETBIT 为 0 并写入，产生重复写行为。
> 正确做法是使用 Redis SETNX 或 Lua 脚本封装原子判断+写入逻辑，或者通过数据库唯一键保障最终幂等。
> 状态结构与行为判断要分离，才能保证数据语义清晰、写入行为安全。


### ✅ Q4. 本地如何实现轻量级高并发刷赞检测？

#### 🗣️ 你的原始回答记录：

用 LRU + Map 记录用户点赞时间窗口计数（如 2 秒内最多 4 次）。
用 atomic.Int64 对每个 uid 的行为计数器做并发加操作。
Map 本身使用 RWMutex 保护。
超频用户加入本地黑名单，并将其 UID 推入 Redis 实时共享给其他实例。

#### 🧾 结构评分：

| 模块       | 表现   | 说明                              |
| -------- | ---- | ------------------------------- |
| 本地限流结构选择 | ⭐⭐⭐⭐ | Map + LRU 合理，思路成熟               |
| 并发安全控制   | ⭐⭐⭐⭐ | 明确 atomic + RWMutex 粒度分离，实践经验感强 |
| 黑名单共享策略  | ⭐⭐⭐  | 用 Redis 做分发共享合理，建议说明 TTL、同步策略   |
| 行为建模能力   | ⭐⭐   | 可进一步建模行为特征（点击间隔、滑窗模型）形成更精准判定    |

#### 💡 点评 + 建议补充：

* LRU 缓存控制了内存占用，atomic + sharding map 可进一步提升并发处理能力；
* 黑名单共享建议明确 TTL 或滑动窗口过期机制，提升治理精准性；
* 可进一步区分 UID vs IP 粒度维度，反制恶意刷脚本用户；
* 建议封装封禁处理逻辑与限流策略于 goroutine 管理协程池，形成隔离层。

#### ✅ 面试口述推荐总结（关键词：`本地限流` `刷赞识别` `atomic并发` `黑名单共享`）

> 在不依赖 Redis 的前提下，我会在每个 Golang 服务实例中构建一个轻量刷赞检测器。
> 使用本地 LRU Map + atomic.Int64 构建 UID 行为频次记录，2 秒内点赞超过阈值即加入本地黑名单。
> 黑名单推送 Redis 实时共享给其他实例；Map 用 RWMutex 保护结构，value 用 atomic 保证更新。
> 整体结构低延迟、可横向扩展，适合热点刷赞突发时的前线快速响应。

### ✅ Q5. 如何设计点赞排行榜系统？

#### 🗣️ 你的原始回答记录：

对于如视频分类、点赞区域、时间段这类大类榜单，使用 Redis ZSet 实时更新：查询性能好、链路短。
对于复杂维度或对实时性要求低的榜单，通过后台定期聚合（ClickHouse 统计 → MySQL 落库 → Redis 缓存刷回）。
热门视频写入通过消息队列削峰降压，实现准实时。
维度复杂场景避免 Redis key 爆炸。

#### 🧾 结构评分：

| 模块       | 表现   | 说明                                  |
| -------- | ---- | ----------------------------------- |
| 实时榜单结构设计 | ⭐⭐⭐⭐ | Redis ZSet 运用合理，典型大厂级实战思路           |
| 离线榜单路径设计 | ⭐⭐⭐⭐ | ClickHouse → MySQL → Redis 缓存回刷链路完整 |
| 维度爆炸规避策略 | ⭐⭐⭐  | 能识别 key 膨胀风险，建议明确降维、限 TTL 策略        |
| 热点削峰写优化  | ⭐⭐⭐⭐ | 提及消息异步化 + 聚合处理，具备实战经验视角             |

#### 💡 点评 + 建议补充：

* 实时/离线分层处理清晰，是高可用大流量系统的合理拆分方式；
* 建议补充 Redis key 命名规范（如：rank\:daily\:entertainment:20250512）防止分布紊乱；
* 建议说明榜单结构 TTL 设定（如保留 3 天），配合数据生命周期治理；
* 热点视频聚合处理建议使用缓冲 map 批量 ZINCRBY 提升吞吐；

#### ✅ 面试口述推荐总结（关键词：`ZSet榜单` `ClickHouse离线聚合` `维度降爆` `热点削峰`）

> 点赞排行榜我采用分层结构设计：对于日榜、分类榜等高频访问的榜单维度，使用 Redis ZSet 实时维护。
> 冷门维度或非热点榜单通过日志上报至 ClickHouse 聚合，结果落入 MySQL，再通过后台任务刷入 Redis 缓存供查询使用。
> 为防止维度爆炸，榜单 key 命名规范化、附带 TTL 控制，避免 Redis 空间膨胀。
> 热点榜单的点赞写入通过消息队列削峰，由聚合 worker 批量 ZINCRBY，确保写入性能与系统稳定。

