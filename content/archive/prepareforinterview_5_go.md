+++
title = "5天八股"
date = 2025-05-01T14:07:32+08:00
draft = false
description = ""
subtitle = "之Go篇"
header_img = ""
short = false
toc = true
tags = []
categories = []
series = []
comment = false
summary = ""
+++

# RoadMap （资深开发工程师）

## 1. 语言基础与高级特性
- 值类型 vs 引用类型（slice、map、channel 的底层结构与共享语义）
- interface 和 type assertion
  - empty interface 本质
  - interface 的动态派发机制
- 方法集与接收者（值接收者 vs 指针接收者）
- defer、panic、recover 机制与应用场景
- reflect 包的使用与底层实现

## 2. 并发模型（CSP 思想）
- goroutine 的 GMP 调度模型
- channel 的本质和实现
  - buffered / unbuffered channel
  - select 实现机制
- context 使用与取消传播原理
- sync 包：
  - sync.WaitGroup
  - sync.Mutex / RWMutex
  - sync.Once / Cond
- atomic 原子操作与 CAS 模型

## 3. 内存管理与性能优化
- 内存分配机制（TINY/MEDIUM/LARGE）
- 垃圾回收（GC）机制
  - 三色标记清除算法
  - STW 与 GC 优化手段
- 逃逸分析与栈/堆分配
- 内存对齐原则
- sync.Pool 的使用与底层原理
- pprof 工具使用（性能剖析、内存分析）

## 4. 工程化能力
- 模块化开发（Go Modules）
- 单元测试与覆盖率分析（`testing` 包、mock 工具）
- benchmark 性能测试
- 项目结构组织（cmd/pkg/internal 的结构约定）
- 错误处理演进
  - 标准错误处理模式
  - `errors.Wrap` vs `fmt.Errorf`
  - Go2 错误处理 proposal

## 5. 标准库与常用工具
- 常用标准库：`io/ioutil`, `bufio`, `net/http`, `json`, `os`, `time`
- go generate, embed 等编译期工具
- 编译器工具链知识：`go build`, `go vet`, `go test`, `go tool compile`

## 6. 系统设计中的 Go 实战应用
- 微服务中的 Go 应用
  - REST + Gin/Echo
  - gRPC + protobuf
- 中间件开发：Handler 链、Context 传递
- 优雅退出与信号处理
- goroutine 泄漏的排查与治理
- 全链路 tracing 与 context 传递（OpenTelemetry 等）

## 7. 常见面试题与手写代码
- 实现一个 goroutine 池
- 并发安全的 map
- 生产者-消费者模型
- goroutine 泄漏如何避免
- 实现限流器（令牌桶、漏桶算法）
- 设计一个高并发日志系统（channel + pipeline）

# 一、语言基础与高级特性

常见的基础与高级特性问题，强调深度理解与实战对比，适当借助 Python/Java/C 等语言进行辅助理解。

---

## 1. 值类型 vs 引用类型

### 1.1 核心区别
| 类型      | 示例                        | 是否引用类型 | 底层是否共享数据 |
|-----------|-----------------------------|----------------|------------------|
| 值类型    | int, float, bool, array, struct | 否             | 否               |
| 引用类型  | slice, map, channel, func, interface | 是             | 是（大多数）       |

### 1.2 Slice 特性深入
- `slice` = 指针 + len + cap（引用到底层数组）
- 拷贝 slice 只是复制元数据，底层数组依然共享
- 对一个 slice 进行 append，若容量不足，可能会分配新数组，变为独立副本

#### 示例：共享陷阱
```go
s1 := []int{1, 2, 3}
s2 := s1[:2]
s2[0] = 100
fmt.Println(s1) // 输出 [100 2 3]
```

### 1.3 map 和 channel 的特性
- map 是引用类型，多个变量指向同一底层哈希表
- channel 同理，多个 goroutine 可以读写同一个通道

## 2. interface 与类型断言

### 2.1 interface 底层结构（重要！）
```go
type iface struct {
    tab  *itab          // 方法表指针
    data unsafe.Pointer // 指向底层数据
}
```

- 空接口 `interface{}` 可接受任意类型（类似 Python 的 Any 或 Java 的 Object）
- 动态调度：调用接口方法时，根据类型表找到具体方法

### 2.2 方法集决定接口实现
- 值类型实现接口时，其方法集不包括指针接收者方法
- 指针类型则同时包含值接收者和指针接收者方法

```go
type Reader interface {
    Read()
}

type T struct{}
func (t T) Read() {} // T 实现 Reader
func (t *T) Write() {} // *T 实现 Writer
```

### 2.3 类型断言和 type switch
```go
var x interface{} = "hello"
s, ok := x.(string) // 类型断言
```
```go
switch v := x.(type) {
case string:
    fmt.Println("string:", v)
case int:
    fmt.Println("int:", v)
}
```

### 面试常问
- interface 的零值是什么？==》nil（注意：interface 的 data 和 tab 都为 nil 才是完全为 nil）
- 为什么 interface 包装一个 nil 指针不是 nil？==》因为 tab != nil

## 3. 方法与接收者（Method Set）

### 3.1 值接收者 vs 指针接收者
| 类型    | 方法集         |
|---------|----------------|
| T       | T.func()       |
| *T      | T.func(), *T.func() |

- 若接口要求 *T.func()，T 无法满足
- 结构体作为 map 的值时，不能通过引用方式修改字段，除非值为指针类型

#### 示例
```go
type User struct {
    Name string
}
func (u *User) SetName(name string) {
    u.Name = name
}

m := map[string]User{"a": {"bob"}}
m["a"].SetName("alice") // 不会生效！因为复制值到临时变量了
```

## 4. defer, panic, recover

### 4.1 defer 特性（高频考点）
- 注册时参数求值（不是运行时）
- 后进先出执行顺序（LIFO）

#### 示例：参数捕获
```go
func f() (r int) {
    defer func() { r++ }()
    return 1 // 实际返回 2
}
```

### 4.2 panic 和 recover
- panic 会中断当前函数执行，并向上冒泡
- recover 只能在 defer 中使用

```go
func safe() {
    defer func() {
        if err := recover(); err != nil {
            fmt.Println("Recovered from:", err)
        }
    }()
    panic("something wrong")
}
```

### 面试重点：
- defer 注册时参数是否捕获？==》是
- 多个 defer 执行顺序？==》后注册先执行
- recover 什么时候无法生效？==》不在 defer 中调用时

## 5. reflect 机制（动态性）

### 5.1 用途
- 序列化（如 JSON）、ORM、DI 容器等

### 5.2 常用 API
```go
reflect.TypeOf(obj)
reflect.ValueOf(obj)
v.Kind(), v.Interface(), v.Set(), v.Call()
```

### 5.3 高阶
- 是否能修改字段？==》字段需为导出字段、Value 可寻址
- 性能代价？==》显著高于静态调用，应避免过度使用

#### 示例：修改结构体字段
```go
type T struct {
    Name string
}
t := T{"Alice"}
rv := reflect.ValueOf(&t).Elem()
rv.FieldByName("Name").SetString("Bob")
```

## ✅ 总结：高频核心面试问题表

| 主题                  | 是否必须掌握 | 建议掌握深度 |
|-----------------------|----------------|---------------|
| slice/map/channel 引用行为 | ✅ 必须        | ⭐⭐⭐⭐        |
| interface 的实现机制与零值 | ✅ 必须        | ⭐⭐⭐⭐        |
| defer 参数捕获与执行顺序   | ✅ 必须        | ⭐⭐⭐⭐        |
| 方法集与接口实现陷阱       | ✅ 必须        | ⭐⭐⭐         |
| reflect 的常见使用场景     | ⚠️ 可选        | ⭐⭐          |

后续模块预告：
- ✅ 并发模型（GMP、channel、select、sync、context）
- ✅ 内存管理与 GC
- ✅ Go 工程化（测试、性能、模块化）
- ✅ Go 在系统设计中的最佳实践

