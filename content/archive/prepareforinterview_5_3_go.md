+++
title = "5天八股"
date = 2025-05-01T14:07:32+08:00
draft = false
description = ""
subtitle = "之GO篇"
header_img = "/image/2025/battleoflepanto.png"
short = false
toc = true
tags = []
categories = ["计算机"]
series = ["面试", "八股文"]
comment = false
summary = ""
+++

# Go 语言资深开发工程师）

## 1. 语言基础与高级语义（掌握语言行为）

### ✅ 必会核心

* 值类型 vs 引用类型（slice/map/channel 的共享语义）
* slice 底层结构与扩容行为（cap 扩张策略）
* map 的桶结构、哈希冲突、扩容与 rehash 行为（Go 1.9+）

#### 1. ✅ 知识点拆解：值类型 vs 引用类型
| 类型分类 | 示例                               | 传参/赋值行为        | 底层存储            | 变化影响    |
| ---- | -------------------------------- | -------------- | --------------- | ------- |
| 值类型  | int、float、bool、array、struct      | 复制值本身          | 数据直接存在变量中       | 改动互不影响  |
| 引用类型 | slice、map、channel、func、interface | 复制结构体，但结构体中含指针 | 数据存在堆上，通过指针间接访问 | 底层数据可共享 |
#### 2. ✅ 延伸知识点：slice/map/channel 三大引用类型的“共享”特点
| 类型    | 是否引用类型 | 结构中含指针？ | 改动是否影响原值？ | 非共享变更风险         |
| ----- | ------ | ------- | --------- | --------------- |
| slice | ✅ 是    | 指向底层数组  | ✅ 修改元素有效  | append 超容量后可能复制 |
| map   | ✅ 是    | 指向哈希桶   | ✅ 修改/新增有效 | range+修改可能错乱    |
| chan  | ✅ 是    | 指向缓冲队列  | ✅ 写入/关闭生效 | nil chan 特殊行为   |
#### 3. 说明
```python
type slice struct {
    ptr *array // 指向底层数组第一个元素的指针
    len int // 当前元素数量
    cap int // 当前底层数组容量
}

s1 := []int{1, 2, 3, 4, 5}
s2 := s1[3:5] // {4, 5}
s1[0] = 100 // {100, 5}
问 s1 = ？，答案是 {1, 2, 3, 100, 5}
```
- slice是一个结构体，里面存的是底层数组（首元素）的指针，所以即便slice结构体作为入参进行了值复制，新的slice只是复制了三个变量的值，ptr依然是原来数组的指针，

* interface 底层结构：itab 表、动态类型和值分离机制
* nil 接口陷阱：interface==nil 与 (value==nil && type!=nil) 情况
* make/new 区别、逃逸行为影响
* struct 对齐规则、struct{} 内存优化技巧
* defer 与 return 的执行顺序（命名返回值与作用域）
* 类型断言、类型 switch 原理
* go mod 构建与包管理机制

### 💥 高频考点

* defer 与 return
* interface nil 陷阱
* map 扩容机制

## 二、GMP 调度模型与并发原语

### ✅ 必会核心

* GMP 模型全景图：G（goroutine）、M（线程）、P（调度器）角色
* P 本地运行队列与 work-stealing 原理
* 全局 runq、sysmon 管理机制、抢占点
* goroutine 调度点、何时被挂起、何时可并发恢复
* Channel 内部结构、发送接收调度机制、select 如何实现公平性
* Mutex/RWMutex 的语义、CAS 自旋、正常模式与饥饿模式差异
* WaitGroup 实现原理（计数器 + sema）
* sync.Cond 的广播通知机制（典型面试题）
* sync.Pool：本地 slot + 清扫时机 + 不适合连接池的原因
* atomic 操作：CompareAndSwap、atomic.Value

### 💥 高频考点

* GMP 调度原理
* channel 与 select
* sync.Mutex 饥饿模式

## 三、内存管理与 GC（runtime 机制）

### ✅ 必会核心

* 栈与堆的分配策略、动态栈扩容
* 编译期逃逸分析、调试逃逸位置（`-gcflags=-m`）
* 垃圾回收三色标记清除算法：白-灰-黑对象变色流程
* 写屏障机制：混合写屏障、为什么“黑不能指向白”
* 并发标记、两次 STW、GC 调度周期
* runtime.MemStats、手动 GC、gcpercent 调节
* pprof 工具实用（heap、allocs、cpu、block）
* trace 分析调度行为、IO 阻塞、GC 耗时

### 💥 高频考点

* 逃逸分析
* 三色标记 GC + 写屏障
* pprof 使用

## 四、错误处理与标准库机制

### ✅ 必会核心

* panic 与 recover 的作用域规则（只能捕获当前 goroutine）
* goroutine 中异常捕获 best practice（SafeGo）
* error 接口与哨兵错误（sentinel error）设计思想
* 标准库 errors.Wrap 与 `%w` error chain 解构
* context 传递机制：cancel、timeout、deadline 控制流
* 标准库 sync/atomic/net/url/bufio 等底层实现亮点

### 💥 高频考点

* panic/recover 捕获范围
* context 超时链
* error 包装与传播

## 五、Gin 框架核心原理与高频问题

### ✅ 必会核心

* Gin 的 Context 是如何实现的？封装了哪些内容？
* 中间件链路执行机制（Next/Abort 流程控制）
* 路由注册与参数解析机制（树形结构 + 动态参数）
* 请求上下文如何与协程安全结合（Context 对象复用问题）
* 如何安全地设置响应头与状态码？（中间件 vs 业务逻辑）
* Gin 和标准库 net/http 的关系（Handler 封装与兼容性）

### 💥 高频考点

* 中间件机制（Next/Abort 流程）
* Context 对象结构与生命周期
* 路由匹配的前缀树实现机制

## 六、经典手写代码考点（面试常见高频小题）

### ✅ 必会核心

* 手写 channel 超时控制（select + time.After）
* 并发安全计数器（atomic vs mutex）
* 实现 worker pool / goroutine 池模型
* 实现 single flight（避免并发重复请求）
* context 超时控制与 goroutine 泄漏防止
* panic/recover 包装 SafeGo 实现
* 用 sync.Once 实现懒加载初始化
* 实现 map 并发安全封装（基于 RWMutex）
* 模拟实现简单的限流器（令牌桶、滑动窗口）

### 💥 高频考点

* channel 超时控制
* worker pool 实现
* SafeGo 异常封装

