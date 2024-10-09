+++
title = "Mysql_overthrough"
date = 2024-08-06T13:36:03+08:00
draft = true
description = ""
subtitle = ""
header_img = ""
short = false
toc = true
tags = []
categories = []
series = []
comment = false
summary = ""
+++


> binlog是Server层做的，而redo-log是引擎层做的（InnoDB特有）

> mysql如何恢复到某一天某个时刻的快照

> 执行一条update操作，binlog和redo-log的写入顺序是什么？谁先被写入磁盘？

> mysql的redo-log两阶段提交是如何保证redo-log和binlog一致的，如果在redo-log处于prepare状态时mysql崩溃了，再次启动后会发生什么


MySQL 的重做日志（redo log）和二进制日志（binlog）在数据库事务的持久性和一致性保证中扮演着关键角色。

##### 1. Redo Log 和 Binlog 的两阶段提交

MySQL 通过两阶段提交协议（Two-phase commit, 2PC）来确保 redo log 和 binlog 的一致性。

1. **Prepare 阶段**：
   - 事务执行过程中，所有的数据修改会被记录到 redo log 中。
   - 当事务准备提交时，会向日志中写入一个 "prepare" 记录，表示这个事务准备好提交。
   - 此时，相应的 binlog 记录也会被写入，这些记录还没有被标记为 "commit"，但已经确定要提交。

2. **Commit 阶段**：
   - 事务在 redo log 中写入数据并落盘，之后写入一个 "commit" 记录。
   - 最后，在 binlog 中也写入一个 "commit" 记录，表示事务已经确认提交。

这种机制保证了在发生崩溃后，从 redo log 和 binlog 中能够准确恢复事务的一致状态。

##### 2. 崩溃后的处理

如果 MySQL 在 redo log 处于 prepare 状态时崩溃，再次启动后，以下是恢复过程的发生流程：

1. **检查 redo log**：
   - MySQL 会在启动时检查 redo log，并查找所有 prepare 状态的事务。

2. **恢复事务**：
   - 对于所有 prepare 记录的事务，MySQL 会重新执行这些事务，以确保其最终提交。如果 redo log 中有 prepare 的记录而没有对应的 commit 记录，那么数据库会认为这些事务处于未决状态。

3. **持久性保证**：
   - MySQL 会根据 redo log 中事物的状态决定是否提交或回滚这些事务。如果 redo log 中没有 commit 记录，那么事务被视为未完成，系统会将这些事务回滚，恢复到之前的状态，从而确保数据一致性。

### 总结

- MySQL 使用两阶段提交协议来确保 redo log 和 binlog 的一致性。
- 如果在 redo log 处于 prepare 状态时崩溃，MySQL 在重启后会重新评估这些未完成事务，将其回滚以确保数据一致性。这样可以避免数据损坏或不一致的情况。


> 使用事务时尽量避免使用长事务，比如在事务中进行rpc调用这种耗时的网络交互或者大量循环去做费时的操作；为什么这样呢？

> online ddl 的设计太优雅了
1.拿MDL写锁
2.马上降级成MDL读锁
3.执行DDL（在影子表）
4.升级MDL写锁，表替换
5.释放MDL锁


