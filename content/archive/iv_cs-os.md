+++
title = "服务端面试之OS篇"
date = 2025-05-05T10:03:45+08:00
draft = false
description = ""
subtitle = ""
header_img = "/image/2025/siegeofmalta.png"
short = false
toc = true
tags = ["操作系统"]
categories = ["Computer Science"]
series = ["计算机基础", "面试复习"]
comment = false
summary = ""
hidden = true
+++

| 模块            | 关键知识点                            | 高频考察内容                   | 是否必备 |
| ------------- | -------------------------------- | ------------------------ | ---- |
| 1. 进程与线程      | 进程与线程的区别、PCB/TCB、线程上下文切换         | goroutine 与系统线程、协程调度机制对比 | ✅    |
| 2. 进程调度       | 调度策略（如 CFS、时间片轮转）、上下文切换开销        | 线程频繁切换带来的性能问题            | ✅    |
| 3. 同步与互斥      | 信号量、互斥锁、自旋锁、读写锁、死锁检测             | 面试中常问 Linux 下的锁机制、死锁场景分析 | ✅    |
| 4. 内存管理       | 虚拟内存、页表、分页、分段、TLB                | 内存访问慢的根本原因、Page Fault 分析 | ✅    |
| 5. 内存回收       | malloc/free、buddy系统、slab分配器      | 应用崩溃时排查内存泄漏的依据           | ✅    |
| 6. 文件系统       | inode、ext4、文件描述符、open/close/read | 文件太多时 inode 用尽的问题分析      | ⚠️   |
| 7. I/O 子系统    | 同步/异步、阻塞/非阻塞、epoll、io\_uring     | 高并发下 I/O 多路复用如何提高吞吐      | ✅    |
| 8. 系统调用与中断    | 系统调用流程、用户态与内核态切换、中断上下文           | QPS 高时频繁陷入内核态的代价         | ✅    |
| 9. 进程间通信      | 管道、共享内存、消息队列、socket              | 多进程架构如何传递结构化数据           | ⚠️   |
| 10. 常用命令与调试工具 | top、strace、lsof、perf、gdb         | 线上定位性能瓶颈或内存泄漏            | ✅    |
