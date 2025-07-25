+++
title = "服务端面试之存储篇"
date = 2025-05-03T16:57:36+08:00
draft = false
description = ""
subtitle = ""
header_img = "/image/2025/fallofconstantinople.png"
short = false
toc = true
tags = []
categories = ["Computer Science"]
series = ["服务端技术系列", "面试复习"]
comment = false
summary = ""
hidden = true
+++

> Richard Phillips Feynman：学习->教学->纠错学习->简化教学


# I.执行流程
## 小目录

- 1. SQL生命周期概览
- 2. 解析阶段（Parse）
- 3. 查询重写阶段（Rewrite）
- 4. 查询优化阶段（Optimize）
- 5. 执行阶段（Execute）
- 6. 存储引擎层操作（Storage Engine）
- 7. 总结与高级扩展

## 1. SQL生命周期概览

> 一条SQL从客户端提交到最终执行完毕，MySQL内部经历以下关键步骤：

```mermaid
flowchart LR
A[客户端发送SQL] --> B[连接管理与权限校验]
B --> C[SQL解析]
C --> D[查询重写]
D --> E[查询优化器选择执行计划]
E --> F[执行器逐步执行]
F --> G[调用存储引擎读写数据]
G --> H[返回结果给客户端]
```

✅ 这条链路任何一个环节出问题都会导致SQL性能差异或异常。

## 2. 解析阶段（Parse）

### 2.1 词法/语法分析

- 词法分析（Lexer）：将SQL语句切分成关键字、表名、字段名等token。
- 语法分析（Parser）：根据SQL语法规则，生成**抽象语法树（AST，Abstract Syntax Tree）**。

✅ 报语法错误（比如漏写WHERE）就是在这个阶段发生。

### 2.2 权限验证

- 检查用户是否有对相关表、字段、操作类型（SELECT/INSERT/UPDATE等）的权限。

## 3. 查询重写阶段（Rewrite）

### 3.1 MySQL内置重写逻辑

- 将某些子查询转换为JOIN（半连接 Semi-Join优化）。
- 将`WHERE a=1 AND a=2`简化。
- 物化（Materialization）：将子查询先执行成临时表。

✅ 重写是为了让优化器更容易生成高效的执行计划。

### 3.2 应用层显式提示（Hint）

- FORCE INDEX、USE INDEX等也是一种"人为参与重写"，告诉优化器倾向选择某索引路径。

## 4. 查询优化阶段（Optimize）

### 4.1 逻辑优化

- 选择最佳JOIN顺序（基于成本估算）。
- 选择最优的索引路径（可能涉及ICP、索引覆盖等）。
- 简化表达式（如WHERE条件提前判断）

### 4.2 物理优化

- 确定访问方法（全表扫描、索引扫描、范围扫描、唯一索引查找）。
- 选择排序方式（索引排序或filesort）。
- 确定是否需要临时表（如GROUP BY大数据时）。

✅ 查询优化器最终生成**执行计划（Execution Plan）**，用于后续执行阶段。

## 5. 执行阶段（Execute）

### 5.1 执行器（Executor）工作流程

- 根据执行计划，按照指定顺序去访问表/索引。
- 每访问一行，进行WHERE条件过滤、GROUP BY聚合、ORDER BY排序等。
- 最终生成结果集，返回客户端或写入临时表等待后续处理。

### 5.2 Buffer Pool与预读优化

- 读页时优先查找Buffer Pool缓存。
- 触发顺序预读、随机预读机制减少磁盘IO。

## 6. 存储引擎层操作（Storage Engine）

### 6.1 读流程

- 根据索引（聚簇索引/二级索引）定位页（Page）。
- 加锁（行锁、间隙锁等）保障事务一致性。
- 应用MVCC（多版本并发控制）返回符合版本的数据。

### 6.2 写流程

- 修改内存中的页数据（Dirty Page）。
- 写入Redo Log（WAL，Write Ahead Log）保证持久性。
- 定时或主动刷脏页到磁盘（Flush Dirty Page）。

✅ 这一层极大影响事务隔离性、写放大、磁盘负载等。

## 7. 总结与高级扩展

### 总体回顾

| 阶段 | 关键点 |
|:---|:---|
| 解析（Parse） | 生成AST，发现语法错误 |
| 重写（Rewrite） | 子查询优化、显式Hint使用 |
| 优化（Optimize） | 生成最优访问路径与执行计划 |
| 执行（Execute） | 根据执行计划调度读写、应用WHERE/ORDER BY等 |
| 存储引擎（Storage） | 数据读写、MVCC、Redo/Undo机制 |

### 延伸思考

- 为什么有时候MySQL执行计划选错索引？（成本估算不准，统计信息过期）
- 为什么临时表影响性能？（临时表通常存在内存不足时落盘，IO慢）
- SQL性能问题应该在哪个阶段定位？（Parse错基本能看，Optimize错需EXPLAIN分析）

# II.索引与优化(ICP/索引覆盖/回表)
## 小目录

- 1. 回表机制（Back to Primary Lookup）
- 2. 覆盖索引（Covering Index）
- 3. 索引下推（Index Condition Pushdown, ICP）
- 4. 三者关系理解与配合优化
- 5. 执行计划（EXPLAIN）辨别技巧

## 1. 回表机制（Back to Primary Lookup）

### 原理
- 二级索引叶子节点只存储索引列+主键值。
- 查询需要其他字段时，需要通过主键去聚簇索引再次读取完整行数据。

### 问题
- 二级索引扫描时，回表带来大量**随机IO**，性能下降。

### 典型场景
```sql
SELECT * FROM user WHERE name = 'Tom';
```
（如果只有name的索引，需要根据name找到主键，再回表）

## 2. 覆盖索引（Covering Index）

### 原理
- 如果查询需要的所有列，**都在索引中能找到**，则直接在索引层返回结果，无需回表。

### 好处
- 避免回表随机IO，大幅提升查询性能。

### 典型场景
```sql
SELECT name FROM user WHERE name LIKE 'Tom%';
```
（只查name字段，直接覆盖在name索引上完成，无需回表）

### 如何设计覆盖索引
- 查询常用字段单独建联合索引，或者调整索引顺序。
- 查询列顺序无所谓，只要索引包含即可。

## 3. 索引下推（Index Condition Pushdown, ICP）

### 原理
- 让**部分WHERE条件**提前在索引叶子节点上判断，减少无效回表。

### 触发条件
| 条件 | 是否可ICP |
|:---|:---|
| 单列索引精准查找 | 不需要 |
| 单列索引范围查找 | 可以使用 |
| 联合索引前缀精准匹配+后缀过滤 | 不需要 |
| 联合索引前缀范围匹配+后缀过滤 | 可以使用 |

### 典型场景
```sql
SELECT * FROM user WHERE name LIKE 'Tom%' AND age = 30;
```
- `name`是前缀范围匹配，不能继续索引定位；
- `age`可以在索引叶子节点提前做过滤，减少回表。

### 检查是否启用ICP
```sql
EXPLAIN SELECT ...
```
- 看Extra字段是否出现 `Using index condition`

## 4. 三者关系理解与配合优化

| 特性 | 回表机制 | 覆盖索引 | 索引下推ICP |
|:---|:---|:---|:---|
| 目的 | 完整返回需要的数据行 | 避免回表 | 减少回表次数 |
| 是否需要回表 | 是 | 否 | 有可能（更少） |
| 最佳应用场景 | 查询所有字段 | 查询部分字段 | 联合索引+范围查询+后缀列过滤 |
| 典型优化方式 | 建立合理的联合索引 | 让查询字段落在索引内 | 让过滤条件提前下推到索引层 |

✅ 在查询设计时，合理利用**覆盖索引+索引下推**，可以极大提升大表扫描性能。

## 5. 执行计划（EXPLAIN）辨别技巧

| Extra字段 | 含义 |
|:---|:---|
| Using where | 需要在Server层进行WHERE过滤（未用ICP） |
| Using index condition | 触发了ICP，在存储引擎层过滤部分记录 |
| Using index | 覆盖索引，无需回表 |
| Using filesort | 可能存在额外的排序操作，需警惕性能问题 |


## 最后一句话总结

> **索引优化的核心目标是：尽量减少回表次数，能用索引直接返回就用覆盖索引，范围查询时配合索引下推过滤，做到真正利用索引提升IO效率与查询速度。**

# III.事务与隔离级别

## 一、事务核心概念：ACID 原则

| 属性 | 说明 | InnoDB 实现方式 |
|:--|:--|:--|
| 原子性 (Atomicity) | 事务中的所有操作要么全部执行，要么全部不执行 | Undo Log 回滚机制 |
| 一致性 (Consistency) | 数据必须从一个一致性状态转换为另一个一致性状态 | 外键/约束/触发器+事务特性维护 |
| 隔离性 (Isolation) | 并发事务之间互不干扰 | 锁机制 + MVCC + 隔离级别控制 |
| 持久性 (Durability) | 一旦事务提交，其修改是永久性的 | Redo Log + Binlog + Page Flush |

## 二、事务隔离级别详解（标准 vs InnoDB）

### 2.1 四种隔离级别（SQL标准定义）

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|:---|:---|:---|:---|
| Read Uncommitted | ✅ | ✅ | ✅ |
| Read Committed | ❌ | ✅ | ✅ |
| Repeatable Read（默认） | ❌ | ❌ | ✅（InnoDB已解决） |
| Serializable | ❌ | ❌ | ❌ |

### 2.2 InnoDB下各隔离级别的实际行为

- **Read Uncommitted**：
  - 所有操作都读最新数据（包括其他事务未提交）。
  - 实际上很少使用，几乎不隔离。

- **Read Committed**：
  - 每次读取都看到已提交版本（Oracle风格）。
  - 会产生不可重复读，但避免了脏读。

- **Repeatable Read（默认）**：
  - 同一事务内多次读取相同记录，结果一致（读取事务开始时的快照）。
  - InnoDB通过 MVCC + 间隙锁 完美解决幻读。

- **Serializable**：
  - 所有读都变成加锁的读（隐式 FOR UPDATE）。
  - 并发性能差，事务串行执行，几乎不用。

## 三、MVCC 实现原理（核心）

### 3.1 MVCC 的目标

- 实现 **非阻塞读（Consistent Read）**，提高并发性能。
- 在不加锁的情况下，提供事务一致性视图。

### 3.2 关键组件

| 组件 | 功能 |
|:--|:--|
| Undo Log | 保存数据的旧版本，实现回滚和一致性读 |
| ReadView | 事务读取时创建的快照视图，定义当前可见版本范围 |
| trx_id | 每个事务启动时分配的唯一递增ID，用于判断版本可见性 |

### 3.3 MVCC 工作流程

- InnoDB使用两个隐藏列维护版本信息：`trx_id`, `roll_pointer`。
- 读操作（非锁定）：根据 ReadView 判断记录版本是否可见。
- 写操作：分配新的 `trx_id`，并写入 Undo Log 保存旧版本。

## 四、幻读问题处理机制

### 4.1 幻读定义
- 在同一个事务中，先执行某条件查询，接着执行相同条件的插入，再次查询时多出数据。
- 通常出现在 **范围查询 + 插入** 的组合。

### 4.2 解决方式对比

| 方法 | 能否防止幻读 | 开销 |
|:--|:--|:--|
| Serializable 隔离级别 | ✅ | 高，强制加表锁或范围锁 |
| Repeatable Read + Next-Key Lock（InnoDB） | ✅ | 中，锁定记录及其间隙，防止插入 |
| Read Committed | ❌ | 无法防止幻读，需要额外手段 |

## 五、ReadView 判定规则（是否可见）

InnoDB 使用以下条件判断某行版本是否对当前事务可见：

```text
版本可见的条件：
1. 数据版本的 trx_id < ReadView.min_trx_id（已提交） ✅
2. 数据版本的 trx_id == 当前事务ID（自身创建） ✅
3. 数据版本的 trx_id ∈ ReadView.active_trx_ids（未提交） ❌
```

## 六、事务隔离相关面试常见问题

| 问题 | 要点回答 |
|:---|:---|
| InnoDB 是如何实现事务隔离的？ | MVCC+锁机制。RR隔离级别配合Next-Key Lock解决幻读。 |
| 什么是 ReadView？ | 一致性读视图，用于判断记录版本是否可见，是MVCC的核心。 |
| Repeatable Read 如何避免幻读？ | InnoDB通过Next-Key Lock锁定间隙防止插入实现。 |
| Serializable 隔离级别的实现方式？ | 强制读加锁，事务串行执行，极大降低并发。 |
| Undo Log 与 Redo Log 有何区别？ | Undo用于回滚与一致性读，Redo用于持久性保证与崩溃恢复。 |
| MySQL 默认隔离级别为什么选RR？ | 能避免幻读同时性能优于Serializable，是兼顾一致性与性能的折中。 |

# IV.锁
## 1. 分类
| 分类方式 | 锁类型 | 说明 |
|:---|:---|:---|
| 按操作对象粒度 | 表级锁 | 锁整张表，MyISAM默认。适合读多写少。 |
|  | 行级锁 | 锁定单行，InnoDB支持。高并发首选。 |
| 按锁行为 | 共享锁 (S Lock) | 读锁，多个事务可同时持有，阻塞写。 |
|  | 排他锁 (X Lock) | 写锁，独占资源，阻塞其他读写。 |
| 按加锁方式 | 自动加锁 | InnoDB根据SQL语义自动加锁。 |
|  | 显式加锁 | 使用 `SELECT ... FOR UPDATE`，`LOCK TABLES` 等。 |


## 2. 行锁分析

### 2.1 Record Lock（行所）
- 精确锁定某条已有记录。
- 精确匹配主键或唯一索引。

### 2.2 Gap Lock（间隙锁）
- 锁定两个记录之间的区间，不包含已有记录。
- 防止其他事务在区间内插入新记录，解决幻读问题。
- 范围查询+FOR UPDATE可能触发。

### 2.3 Next-Key Lock（临键锁）
- 结合Record Lock和Gap Lock：锁定记录及其前后间隙。
- 在RR隔离级别下默认开启，用于彻底防止幻读。
- InnoDB 8.0后在无冲突时可降级为Record Lock或Gap Lock，减少锁冲突。


## 3. 意向锁 (Intent Lock) 解析

- 意向锁是表级锁，标记事务意图，提升加锁冲突检测效率。
- IS（意向共享锁）：表示即将加共享行锁。
- IX（意向排他锁）：表示即将加排他行锁。
- 意向锁和行锁并不互斥，不会导致额外的锁等待，只是加速表锁检查。


## 4. 加锁方式理解

### 4.1 显式加锁SQL

- `SELECT ... FOR UPDATE`
  - 加排他锁，阻塞其他事务修改或加锁该行。
  - 适合读后即更新的场景，保证读-改-写一致性。比如库存扣减，先读，通过条件判断后进行更改，然后更新db。这个排他锁就是做这个事的，明确向db表达这个含义：我当前读，读后就改。期间阻止一切并发（当前）读/写。

- `SELECT ... LOCK IN SHARE MODE`
  - 加共享锁，允许其他事务加（共享）锁读，但阻止写。
  - 其实感觉没什么实际应用场景，就是读的时候要明确阻止写而已...

### 4.2 何时可能锁表？

- 查询条件无索引或未使用索引导致全表扫描。
- 范围查询未走有效索引，锁范围扩大，导致临时表锁定。
- 外键约束检查导致间接表锁。
- 手动使用LOCK TABLES命令锁表。
- 并发DDL（表结构变更）未开启Online DDL功能时，普通DDL操作会锁表。

### 4.3 保证行锁效率的策略

- 合理设计索引，保证查询条件能命中索引。
- **尽量通过主键或唯一索引定位记录，避免全表锁或范围锁。**
- 控制范围查询粒度，减少锁定记录数目。
- **缩短事务执行时间，快速提交，释放锁资源。**

### 4.4 Online DDL是否锁表？

- MySQL 5.6及以上支持Online DDL：
  - 大多数索引变更操作可以边读写边修改，无需全表锁。
  - 但特定操作（如更改主键、添加全文索引）仍可能需要较大锁粒度或短暂元数据锁（MDL Lock）。
- 实际上线要关注DDL是否 truly online，可以通过 `ALGORITHM=INPLACE` 和 `LOCK=NONE` 选项强制要求。

## 5. 乐观锁与悲观锁深度区分

| 项目 | 乐观锁 | 悲观锁 |
|:---|:---|:---|
| 原理 | 基于版本控制或比较机制避免冲突 | 基于加锁阻止并发冲突 |
| 适用场景 | 高并发，冲突概率低 | 强一致性要求，高冲突场景 |

## 6. 死锁机制与优化
### 6.1 死锁成因

- 不同事务以不同顺序持有锁资源（事务内加锁顺序尽量保持一致），互相等待。
- *大范围范围查询容易引起Next-Key锁竞争死锁。*
- 之前工作中还遇到一个场景，更搞笑，两个事务并发分别命中了同一行数据的两个索引（比如一个a字段的，一个b字段的），互相等待。

### 6.2 死锁排查命令
```sql
SHOW ENGINE INNODB STATUS\G
```
- 查看当前死锁信息，定位涉及的事务和SQL。

### 6.3 死锁优化策略

- 统一事务访问资源顺序。
- 控制事务粒度，减少范围锁、减少锁等待。
- 提前检测冲突（应用层重试机制）。

## 7. 锁的总结

| 问题                           | 要点                                    |
|:-----------------------------|:--------------------------------------|
| 什么情况下InnoDB会锁表？              | 未命中索引、DDL操作、全表扫描、外键检查、行锁扩大。           |
| Next-Key Lock和Gap Lock的本质区别？ | Next-Key锁住记录及前后间隙，Gap Lock只锁区间，不含记录。  |
| SELECT FOR UPDATE为什么要求索引？    | 未命中索引则锁全表或大范围，影响并发性能。                 |
| Online DDL一定不会锁表吗？           | 不是，有些DDL操作仍需要锁表，需查看实际DDL语义。           |
| 如何排查死锁？                      | SHOW ENGINE INNODB STATUS，分析等待链与冲突资源。 |
# V.MySQL 日志三兄弟

主要讲清楚 InnoDB 在事务回滚时，涉及哪些日志，分别处于什么状态，如何协同保证事务的原子性和一致性。这也是主要考察点，其余binlog自己的那些基础知识就不再这记录了。

## 📌 示例事务

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
ROLLBACK;
```

## ✅ 日志三件套作用速览

| 日志 | 作用 | 写入时机 | 能否回滚 | 属于哪一层 |
|------|------|-----------|-----------|--------------|
| **Undo Log** | 记录旧值，便于回滚 & MVCC | 每次 DML 执行时写 | ✅ 可回滚（逻辑日志） | InnoDB 引擎层 |
| **Redo Log** | 记录数据页物理修改（WAL） | 每次页更新时写 buffer | ✅ 可配合 undo 实现 crash-safe 回滚 | InnoDB 引擎层 |
| **Binlog** | 记录逻辑变化，供复制/备份 | 提交事务时才写 | ❌ 不可回滚 | MySQL Server 层 |

## 🔁 回滚流程分阶段详解

### 🔹 阶段 1：事务开始 + 执行 DML

- 每条 `UPDATE` 会：
  - 生成一条 Undo Log（保存旧值）
  - 修改 Buffer Pool 中的数据页（变成脏页）
  - 写入 Redo Log buffer（页的物理变化）
- Binlog 尚未生成（因为未提交）

状态表：

| 日志类型 | 状态 |
|-----------|--------|
| Undo Log | ✅ 写入（用于回滚） |
| Redo Log | ✅ 写入 buffer（尚未持久化） |
| Binlog   | ❌ 尚未生成 |

### 🔹 阶段 2：ROLLBACK 触发回滚

1. **从 Undo Log 中逐条读取旧值**，按相反操作回退数据页内容；
2. 回退修改时，会再次写入新的 Redo Log（称为“回滚 redo”）
3. Redo Buffer 中“未刷盘”的数据不写入磁盘
4. 脏页可被重置，或后续延迟刷入正确数据
5. Binlog 根本未写，不存在“逻辑提交”

状态变化：

| 日志类型 | 状态 |
|-----------|--------|
| Undo Log | ✅ 被读取并用于回滚，随后可清理 |
| Redo Log | ✅ 写入一批新的 redo（回滚操作） |
| Binlog   | ❌ 未写入（无需撤销） |

## 🧠 为什么回滚不能依赖 Redo Log？

- Redo Log 是 **“重做日志”**，不能还原数据，只能重放最后一次写入；
- 回滚必须依赖 Undo Log 提供“前一个版本” → **原子性保障依赖 Undo，不是 Redo！**

## 🔁 崩溃后恢复场景

若回滚进行中发生宕机：
- Binlog 不存在 → 表示该事务未提交
- Redo Log 里可能存在“回滚之前的物理修改” → 不能直接 replay
- 启动时 InnoDB 会：
  - 检查事务状态未提交
  - 执行 Undo Log 进行回滚恢复
  - 最终数据库状态等于没执行过该事务

## ✅ 回滚日志处理流程总结图

```
[事务执行]
   ↓
 生成 Undo Log + Redo Log
   ↓
 用户触发 ROLLBACK
   ↓
 ← 读取 Undo Log 回滚内存页
   ↓
 写入“回滚用”的 Redo Log
   ↓
 Binlog 无需处理（未生成）
```

## 一句话总结

> InnoDB 回滚过程依赖 Undo Log 记录旧值并按反向操作恢复页内容，同时生成回滚用的 Redo Log 保证 crash-safe，但不会生成 Binlog。Redo Log 本身不能回滚，仅配合 Undo Log 实现原子性；Binlog仅在提交时写入，因此不会记录失败事务的任何信息。
> 除了三兄弟外，Mysql Server层还其他较重要的日志包括slow query log（慢查询日志，对业务太重要了），error log（对dba挺重要），sql log（对安全统计挺重要）

# VI.主从复制与高可用

# VII.常见面试问题

# VIII.MySQL性能优化

# IX.常见面试问题
~~1. 数据库三范式~~ 
~~2. 分别说一下范式和反范式的优缺点~~
3. Mysql 数据库索引B+ 树和 B 树的区别
4. 为什么 B+ 树比 B 树更适合应用于数据库索引，除了数据库索引，还有什么地方用到了（操作系统的文件索引）
> B+树，高扇出、扁平化结构，只有叶子节点存储数据，中间节点只存储关键值和指针。所以页内可以存储更多关键值（扁平），页内是数组，二分查找效率高。
操作系统的文件系统索引也使用B+树结构。
5. 聚簇索引和非聚簇索引
6. 前缀索引和覆盖索引
> 聚簇索引就是主键索引，叶子节点存储行数据，数据行存储的组织顺序就是按照主键索引顺序来的。非聚簇索引即二级索引叶子节点存储主键索引的指针，
> 查询字段如果不在二级索引上需要回表，回表增加IO降低效率。如果在就是索引覆盖，效率高。另外还有索引下推（IPC），即是在联合索引中，因为使用最左前缀原则，在回表之前如果可以通过右缀索引做了过滤，那么回表效率明显提高。
> 设计SQL的时候，尽量保证，1.一定用上索引。2.最好索引覆盖。3.最好能用上索引下推。
~~7. 介绍一下数据库的事务~~
8. Mysql 有哪些隔离级别
9. Mysql 什么情况会造成脏读、可重复度、幻读？如何解决
10. Mysql 在可重复度的隔离级别下会不会有幻读的情况，为什么？
> ~~未提交读~~，RC，RR，~~串行读~~4种隔离级别；未提交读就是脏读；在RC中a事务两次查询之间有b事务（后开启先提交）新插入了数据被a读到了，就叫幻读。
> 解决幻读需要开启RR, 在RR下也必须使用当前读（select...for update）才可以通过Next-key-lock(间隙锁) + MVCC机制（利用undo-log）来避免幻读。
> RC无论如何也解决不了幻读，因为RC没有间隙锁机制，而且RC本身也是`读其他人已提交`。RC和RR虽然都使用MVCC，但是RC快照是每次读前生成，RR是一开事务立即生成。
11. Mysql 事务是如何实现的
12. Binlog 和 Redo log 的区别是什么，分别是什么用？
>binlog是server层的，记录的时候行数据变更，支持statement，row，mixed格式。主要作用是数据同步，复制，重建。
>redo-log是innodb引擎层的，作用是支持事务和崩溃恢复。
>事务中ddl的执行，先记录到redo-log内。commit之后redo-log先刷盘然后标记prepare状态。
>再之后写binlog，binlog刷盘后数据才算是真正更新完。然后再回去更改redo-log的状态标记成功。
>binlog是没法替代redo-log的。redo-log记录事务的每一步，而且是物理记录（比如某一页的某个offset上数据的改变）。并且redo-log的二阶段提交保证了事务内改变作为一个整体。
>同时回滚也得靠redo-log配合undo-log。
14. 谈一谈 MVCC 多版本并发控制
>在10中已经有描述。MVCC主要是提高读并发，在RC和RR下，可以通过快照读在不加锁的机制下进行select。
14. Innodb 和 MyISAM 的区别是什么
>主要就是支持事务，行锁。另外redo-log可以提供崩溃恢复的能力。 一个为OLTP，一个为OLAP
15. Innodb 的默认加锁方式是什么，是怎么实现的
> InnoDB 默认使用行级锁，并且基于索引记录实现。只有 SQL 命中索引时才能加行锁，否则退化为表锁。锁信息由 InnoDB 的锁管理模块集中维护，并通过记录在索引结构中的位置与事务 ID 映射实现高效加解锁。
16. 如何高效处理大库 DDL
> Online DDL必须用起，对照当前版本online ddl的官方手册看说明（经验：之前有过一次给varchar续长度的，特别巧命中了mysql特殊的case，varchar长度如果从<64 变成 >64, online ddl inplace就会变成copy，主从同步io压力有点大）.
> 绝对不能锁表。高危操作（主键、列类型变更）不要做，改索引的话先加后删。低峰进行，分库分表，叫不准的一定跟DBA进行double check。有风险就要借助工具了。
17. Mysql 索引重建
> 有大量删除操作或者表结构更新。导致索引碎片化（数据磁盘碎片化同理）。直接业务低峰期执行`OPTIMIZE TABLE`就行了，之前我们DBA隔一段时间会提醒。
18. 对于多列索引，哪些情况下能用到索引，哪些情况用不到索引
> 联合索引最左前缀原则。最左侧如果是等值查询，那右边的索引也能用...依此类推。中间如果隔开了，比如`idx(a,b,c) where a=1 and c=3`，那么只能使用最左前缀的a部分索引。但是，可能会用到IPC（索引下推），因为c的值也记录在索引里。
19. 为什么使用数据库索引可以提高效率，在什么情况下会用不到数据库索引？
> 见上方B+树部分，不重复了。用不到索引的场景有几个典型的：1.where条件查找范围太广、使用函数或者类型转换、或者使用 !=, not in, like %xxx这种。2.索引值唯一性太低。3.二级索引查询值太多，回表效率低，选择器可能会选择直接主键索引扫描了。
20. 共享锁和排他锁的使用场景，
> 排它锁，禁止其他事务上锁，不能写/改，不能共享读。select ... for update, 我遇到的主要场景就是事务内先查，紧接着去改。希望整个查-改-写过程是唯一的，扣减积分场景。
> 共享锁，禁止其他事物写/改，但允许加共享锁读。select in share mod，这个我没什么实际场景使用，能想到的就是事务内查，查完了做一些业务判断处理，不希望期间被其他并发改动。
21. 关系型数据库和非关系数据库的优缺点
> 关系型数据库：强一致性，支持事务，表结构固定对于格式化标准的数据很有意义。OLTP的业务大部分都这个。
> 非关系型数据库：最终一致性，Redis, MongoDB, Cassandra这些都是，键值、文档、列式，一般都分片，水平扩展方便，schema不固定。写入/读取性能极高。
22. Mysql 什么情况会造成慢查，如何查看慢查询
23. 如何处理慢查询，你一般是怎么处理慢查询的
> 1.未命中索引或者索引效率低，导致搜索很慢。2.查询数据量大，导致回表太多，并且吞吐也大，慢。
> 3.系统因为其他查询或者宿主机问题什么的导致当前CPU压力非常大，这时候就算正确的查询sql也可能会变成慢查询。
> 4.表太大，列太多，太宽；索引不够高效。 5.事务太大。
> 这都是实际遇到过的。实际应对就是`慢查询日志`+`系统监控日志`两块一起看！慢查询解决思路就是上面说的这些反着来就行了。
24. Mysql 中 varchar 和 char 的区别
> varchar如果太长容易造成`行溢出`和`页分裂`。但是我们从来不用char，定长限制在业务侧做。
25. 数据库外键的优缺点
> 没优点，分库分表，不允许用。
26. 有没有使用过数据库的视图
> 用过，之前b端系统随便玩可以用，c端大流量场景别碰这东西了。权限隔离，隐藏个字段什么的，尤其接入BI工具的时候。
27. Mysql 中插入数据使用自增 id 好还是使用 uuid，为什么？
>自增id, 分库分表用不了自增id，也必须是近自增的BIGINT类型，比如雪花ID，或者阿里sequence这种。因为B+树，顺序插入效率高太多了。而且BIGINT占用空间少。
~~28. Mysql 有哪些数据类型，使用的时候有没有什么注意点~~
> 金额用decimal，其实最好用bigint，存最小单位就行了。时间用datetime，别用时间戳，时间戳有坑，有范围限制，而且有时区信息。text/blob那些尽量少用，一个表显示text这种字段数量，不行就拆表。
29. Mysql 集群有哪几种方式，分别适用于什么场景
30. Mysql 主从模式如何保证主从强一致性
31. Mysql 集群如何保证主从可用性 
> 多少种方式不知道。我们用的是架构是一主+一备，主从分库分表+中间件 -> 8库128表在4个实例上。
> 阿里云上RDS高可用可以选三种方式，1.异步（默认，性能好，主从理论上有小延迟。主挂了可能数据不一致）2.半同步（从必须收到binlog后，主才认为成功，接近强一致）3.MGR 强一致，从必须半数以上check完，主才认为成功。
> 主从高可用架构，多可用区容灾，复制模式与数据一致性，故障检测与自动切换， 监控与管理。这是我在阿里云RDS官网抄的。
32. Mysql 读写分离有哪些解决办法
> 1. 应用层自己写逻辑。 2.中间件走proxy。 全都是坑，有强数据一致性诉求的业务没人用。

# XI.有点东西之Explain详解

| 字段            | 含义 | 典型关注点 |
|:--------------|:---|:---|
| id            | 查询序列号，标识子查询或联合查询中各部分 | id越大越先执行（嵌套查询时） |
| select_type   | 查询类型（SIMPLE/PRIMARY/SUBQUERY/DERIVED等） | 识别普通查询、子查询、派生表 |
| table         | 正在访问的表名或子查询结果 | 当前行对应的表或临时表别名 |
| partitions    | 访问哪些分区（分区表时出现） | 仅分区表关注 |
| **type**      | 访问类型（访问粒度） | 性能影响最大，ALL最差，const/best |
| possible_keys | 可能使用的索引 | 是否有可用索引？ |
| key           | 实际使用的索引 | 确认是否选对索引 |
| key_len       | 索引使用长度（字节数） | 是否利用了全部索引列？ |
| ref           | 索引匹配的列或常数 | 用于索引查找的条件列 |
| rows          | 估算扫描的行数 | 行数大=潜在慢查询风险 |
| filtered      | 过滤率（百分比） | 最后留存记录比例，越低越差 |
| Extra         | 补充信息，如Using index、Using where、Using filesort | 核心，反映执行细节 |

#### 常见执行类型（type）及优化建议

| type | 说明 | 优化建议 |
|:---|:---|:---|
| ALL | 全表扫描 | 加索引，优化WHERE子句 |
| index | 全索引扫描（覆盖索引） | 覆盖索引但仍需注意rows量 |
| range | 索引范围扫描 | 合理利用范围条件（BETWEEN, LIKE 'xxx%'） |
| ref | 非唯一索引扫描，返回多行 | 确保索引选择性好 |
| eq_ref | 唯一索引等值查询，每次返回1行 | 非常好，通常用于主键或唯一索引查询 |
| const/system | 单行查询（常量），系统表访问 | 最优 |
| NULL | 不访问任何表（直接返回结果） | 特殊情况 |

✅ **性能排序（从好到差）：NULL > const > eq_ref > ref > range > index > ALL**

# XII.有点东西之索引查找
你说的是正确的警觉点->**页内查找不免费**<-，但实际上，B+树页内部是数组结构查找，不是链表，查找效率非常高。真正用链表遍历的只有范围/分页查询。
| 行为 | 是不是链表？ | 实现方式 | 查找效率 |
|:---|:---|:---|:---|
| B+树页内查找索引项 | ❌ 不是链表 | 有序数组（二分查找） | 快（O(log 400)） |
| 叶子页之间查找 | ✅ 是链表 | 顺序指针 | 慢（范围查询用） |

# XIII.有点东西之为什么互联网大规模C端系统偏好RC隔离级别 + ROW Binlog格式（而非RR）

## 📌 背景：C 端系统的通用诉求

- 高并发读写：用户量大，请求量高，事务频繁且短。
- 最终一致即可：业务上容忍稍微延迟或结果抖动。
- 异步架构普遍：主从、Binlog 消费、缓存、搜索同步常见。
- 高可用优先：事务死锁、阻塞等不可接受。

### RC 的优点
| 方面 | RC | RR | 对比 |
|:--|:--|:--|:--|
| 并发性能 | 高 | 较低 | RR 有 gap lock 限制并发 |
| 死锁概率 | 小 | 大 | RR 有更多锁竞争（Next-Key Lock） |
| Undo 日志压力 | 小 | 大 | RR 事务保留 snapshot 更久，Undo 增多 |
| MVCC 压力 | 低 | 高 | RC 不保证可重复读，snapshot 生命周期短 |
| 默认支持 | ✅ | ❌ | Oracle、PostgreSQL 默认都是 RC |

### RC 能接受的场景（互联网特点）
- 查询“抖动”可容忍，如分页、列表
- 异步保证最终一致性（消息、补偿、重试）
- 不做银行级别强一致 ACID 要求

### Row Binlog 的好处
- 精准记录每一行变更（insert/update/delete）
- 容易与 Canal、Debezium 等同步中间件集成
- 不受 SQL 写法影响，适合高一致性主从复制
- 明确支持幂等消费逻辑（比如下游构建消息队列或ES）

### RC + ROW 的协同优势

| 点 | RC + Row 组合的意义 |
|:--|:--|
| 高并发能力 | RC 减少锁争用，Row 避免 binlog 歧义冲突 |
| 高可用 | RC 减少死锁，事务短小，复制快 |
| 一致性保证 | Row Binlog 精确描述变更，防止从库偏差 |
| 易与微服务/消息系统集成 | Binlog 可被下游订阅精确消费 |
| 成本低 | RC 容错能力强，少运维事故；Row 格式支持通用同步工具 |

### RC 的问题是否能接受？

| 问题 | 是否严重 | 解决思路 |
|:--|:--|:--|
| 不可重复读 | ✅ 存在 | 业务侧幂等设计 + 异步补偿 |
| 幻读可能 | ✅ 存在 | 一般业务容忍；或加唯一约束规避 |
| 最终一致性 vs 强一致性 | ✅ 有区别 | 使用 MQ + 校验策略即可兜底 |

### ✅ 总结一句话

> 在高并发、高可用、最终一致为主的互联网 C 端系统中，MySQL 的 RC 隔离级别配合 Row 格式 Binlog 是性能、可靠性与可维护性之间的最佳平衡方案。

# XIV.有点东西之事务过程中redo-log和binlog的状态
| 步骤 | 事务动作 | Redo Log 状态 | Binlog 状态 | 说明 |
|------|-----------|----------------|--------------|------|
| ① | `START TRANSACTION` | - | - | 初始化，分配事务 ID（trx_id） |
| ② | 第一条 `UPDATE` 执行 | ✅ 写入内存中的 redo buffer（尚未刷盘） | ❌ 不写入 binlog | Redo Log 每条数据页的修改都生成对应的 redo 物理记录 |
| ③ | 第二条 `UPDATE` 执行 | ✅ 继续写入 redo buffer | ❌ | 所有修改都追加进 redo buffer（事务未提交） |
| ④ | 执行 `COMMIT`，进入两阶段提交： |  |  |  |
| ④-1 | Redo Log 写入 prepare（**刷盘**） | ✅ 写入 redo log file（prepare 标志） | ❌ | 此时 Redo Log 是“可恢复但未提交”的状态 |
| ④-2 | 写入 Binlog（逻辑日志） | - | ✅ 将两条 UPDATE 的变更逻辑写入 Binlog | Server 层生成 Binlog（按行/语句/混合格式）并写入文件 |
| ④-3 | Redo Log 写入 commit（**刷盘**） | ✅ 标记 commit，真正提交完成 | - | 此时 Redo Log 成为“已提交”状态，崩溃后可重放 |
| ✅ ⑤ | COMMIT 完成 | ✅ Redo 全部完成 | ✅ Binlog 写入完成 | 事务正式完成 |

# XV.有点东西之极品死锁问题
>这个问题是现实工作中遇到的，很奇葩。当时发现这个问题的时候惊觉还能这样！？
> 我还记着当时好像是后台任务更新里程明细表，任务并发没控制好，俩worker跑到了同一批数据，后来发生了死锁，排查engine日志才发现怎么回事...很神奇
> 细节记不清了，但意思还记得：

```sql
CREATE TABLE t (
  id INT PRIMARY KEY,
  x INT,
  y INT,
  INDEX idx_x(x),
  INDEX idx_y(y)
);

/*
假设这个t表，两列，两个索引。
行数据
1，1，2
*/

-- 事务 A:
UPDATE t SET z = 100 WHERE x = 1 AND y = 2;

-- 事务 B:
UPDATE t SET z = 200 WHERE x = 1 AND y = 2;

```
巧合来了：

事务`A`：
1. 先执行`WHERE x = 1`，选择了索引`idx_x[x=1]` → 加锁成功
2. 回表 → 尝试锁定主键 `id=1` → 成功加锁
3. 正在准备修改数据，因为要改`y`字段，即将尝试加锁`idx_y[y=2]`

同时事务`B`：
1. 先执行 `WHERE y = 2`，选择了`idx_y[y=2]` → 加锁成功
2. 回表 → 尝试锁定主键`id=1` → ❌失败，被`A`占着 → 被阻塞

此时：
- `A`正在等`B`释放`idx_y[y=2]`
- `B`正在等`A`释放主键行锁

**一句话总结**
俩事务并发改一条数据，第一步拿二级索引上的锁时非常奇葩的选择了不同的二级索引，主键索引上首先成功拿到锁的事务接下来需要另一个二级索引的锁...。

**引发的思考**
虽说为了业务可以牺牲点存储成本，多搞点二级索引给未知业务多行个方便。但如果没仔细考量（也确实难考量）的话，机缘巧合会增加死锁风险