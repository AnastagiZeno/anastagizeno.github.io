+++
title = "Pgtxrecover"
date = 2025-07-24T11:52:20+08:00
draft = false
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
hidden = false
+++


# PostgreSQL + Golang 客户端事务处理最佳实践

适用于使用 `pgxpool` 作为连接池的 Golang 项目，防止连接泄露、锁悬挂和事务未关闭等问题。

---

## 🢨 三种典型事务异常场景

### 场景 1：忘记 `Commit()` 或 `Rollback()`

```go
tx, _ := db.Begin(ctx)
tx.Exec(ctx, "UPDATE users SET name = 'bob' WHERE id = 1")
// ❌ 忘记 tx.Commit() 或 tx.Rollback()
```

* 持有锁，连接状态为 "idle in transaction"
* 连接无法归还连接池
* 后续 SQL 报错或连接池耗尽

---

### 场景 2：函数内 `panic` 且未处理事务

```go
tx, _ := db.Begin(ctx)
tx.Exec(ctx, "INSERT INTO ...")
panic("unexpected error")
// ❌ 没有 rollback / recover
```

* 若无 `recover`，连接直接泄露
* 若有 `recover` 但未 rollback，连接仍污染
* 后续事务异常行为

---

### 场景 3：服务崩溃（kill -9、OOM）

```go
tx, _ := db.Begin(ctx)
tx.Exec(ctx, "DELETE FROM ...")
os.Exit(1)
```

* PostgreSQL 后端检测连接断开
* ✅ 自动回滚事务
* ✅ 清理连接资源

---

## 🔍 总结对比表

| 情况                   | 连接池污染 | 锁悬挂 | 自动回滚 | 建议处理方式                |
| -------------------- | ----- | --- | ---- | --------------------- |
| 忘记 commit / rollback | ✅ 是   | ✅ 是 | ❌ 否  | `defer tx.Rollback()` |
| panic 未 recover      | ✅ 是   | ✅ 是 | ❌ 否  | `recover + rollback`  |
| 服务 crash             | ❌ 否   | ❌ 否 | ✅ 是  | 无需干预（Postgres 自动处理）   |

---

## ✅ PostgreSQL 推荐配置

```ini
# 避免 idle in transaction 状态挂死连接
idle_in_transaction_session_timeout = 30000  # 单位: 毫秒
```

---

## ✅ 安全封装 WithTransaction 函数（大型项目适用）

```go
import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// WithTransaction 封装事务控制，确保自动 rollback 与 recover，适用于大型项目
func WithTransaction(
	ctx context.Context,
	db *pgxpool.Pool,
	fn func(tx pgx.Tx) error,
) (err error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}

	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback(ctx)
			panic(r)
		}
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	if err = fn(tx); err != nil {
		return err
	}

	if commitErr := tx.Commit(ctx); commitErr != nil {
		return fmt.Errorf("commit tx: %w", commitErr)
	}

	return nil
}
```

---

## ✅ 使用示例

```go
err := WithTransaction(ctx, db, func(tx pgx.Tx) error {
	_, err := tx.Exec(ctx, "UPDATE users SET name=$1 WHERE id=$2", "alice", 42)
	return err
})
if err != nil {
	log.Fatalf("事务失败: %v", err)
}
```

---

## 🧐 实践建议

* 所有事务使用 `WithTransaction` 统一封装
* 配置 `idle_in_transaction_session_timeout`
* 设置连接池 MaxConnLifetime
* 对事务操作增加 trace / 日志监控
* 高应用场景下务必保证快速提交或明确回滚

