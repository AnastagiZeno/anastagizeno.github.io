+++
title = "服务端面试之GO（二）"
date = 2025-05-04T12:26:32+08:00
draft = false
description = ""
subtitle = "实战手撕代码之Channel、并发等"
header_img = ""
short = false
toc = true
tags = ["Go"]
categories = ["Computer Science"]
series = ["计算机基础"]
comment = false
summary = ""
hidden = true
+++

# ROUND-1
### 机制类
| 题号  | 类型  | 面试点核心                                                             |
| --- | --- | ----------------------------------------------------------------- |
| 1️⃣ | 机制题 | 为什么 `map` 遍历是乱序的？请描述 Go map 内部的 bucket 和扩容机制，为什么选择 lazy deletion？ |
| 2️⃣ | 机制题 | Goroutine 是如何被调度的？解释 P 的工作窃取机制，以及为什么 M 数可以大于 GOMAXPROCS？          |
| 3️⃣ | 机制题 | 为什么 `sync.Map` 能支持并发读写？它是如何避免锁竞争的？与普通 `map+mutex` 的比较？            |
| 4️⃣ | 机制题 | select 中多个 case 竞争时是否公平？Go runtime 是如何选择执行分支的？如何避免饥饿？             |
| 5️⃣ | 机制题 | 为什么 Go 中的函数参数在某些情况下会逃逸到堆上？逃逸分析做了哪些判断？                             |

### 实战类
| 题号  | 类型  | 面试点核心                                                                            |
| --- | --- | -------------------------------------------------------------------------------- |
| 6️⃣ | 实战题 | 写一段代码展示 `sync.Once` 被多个 goroutine 并发调用的场景，并解释为什么一定要使用原子变量加锁配合                    |
| 7️⃣ | 实战题 | 给出一段代码，slice append 后原始 slice 被修改，请分析原因并解释底层机制                                   |
| 8️⃣ | 实战题 | 写一段代码，使用 `atomic.Pointer[T]` 实现一个单例对象的安全发布。需要保证构造也只发生一次                          |
| 9️⃣ | 实战题 | 写一段能触发 `fatal error: concurrent map read and map write` 的代码，并解释为何即便读写不重合也会 panic |
| 🔟  | 实战题 | 用 `channel` 实现一个一写多读的广播机制（不能用 sync.Cond），要求读方不会丢事件     