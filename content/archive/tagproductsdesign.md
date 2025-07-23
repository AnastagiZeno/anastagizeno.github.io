+++
title = "Tagproductsdesign"
date = 2025-07-23T19:59:03+08:00
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
hidden = true
+++

## 商品多标签筛选 + 游标分页设计方案（MySQL / PostgreSQL）

### ✅ 问题背景

* 有 1000w 商品，每个商品 0\~20 个标签。
* 希望实现一个橱窗接口：支持标签筛选（可多选），支持下拉滚动分页（游标分页）。
* 当前使用 MySQL 或 PostgreSQL，优先希望不引入 Redis / ES。

---

## ✅ 常规设计

### 数据表结构

#### 1. `product` 表

```sql
CREATE TABLE product (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  image_url VARCHAR(1024),
  price DECIMAL(10, 2),
  status TINYINT,
  created_at DATETIME,
  INDEX idx_created_at (created_at)
);
```

#### 2. `tag` 表

```sql
CREATE TABLE tag (
  id INT PRIMARY KEY,
  name VARCHAR(64)
);
```

#### 3. `product_tag` 表

```sql
CREATE TABLE product_tag (
  product_id BIGINT,
  tag_id INT,
  PRIMARY KEY (product_id, tag_id),
  INDEX idx_tag_id (tag_id),
  INDEX idx_tag_pid (tag_id, product_id)
);
```

---

## ✅ 核心问题：是否可以使用游标分页？

### 🎯 背后冲突

* 要筛选：需要 `tag_id` 作为第一索引列。
* 要游标：需要 `product_id > cursor_id` 排序。

这两个目标无法用一个索引完美满足。

---

## ✅ 多标签筛选 + 游标分页的 3 条路线

### ✅ 路线 A：只支持单标签筛选 + 游标分页

* 使用联合索引 `(tag_id, product_id)`。
* 支持语句：

```sql
SELECT product_id FROM product_tag
WHERE tag_id = :tag_id AND product_id > :last_seen_id
ORDER BY product_id LIMIT 20;
```

* ✅ 高性能、结构简单；❌ 不支持多标签组合。

---

### ✅ 路线 B：多标签 OR 筛选 + OFFSET 分页

```sql
SELECT DISTINCT product_id
FROM product_tag
WHERE tag_id IN (1,3,5)
ORDER BY product_id
LIMIT 20 OFFSET 100;
```

* ✅ 兼容性强，不需改结构。
* ❌ OFFSET 深翻页性能差。
* ✅ PostgreSQL 可配合物化视图或 CTE 缓存优化。

---

### ✅ 路线 C：多标签 + 游标 + 应用层归并排序

流程：

1. 对每个 tag\_id 用索引查询 `product_id > cursor` 的数据。
2. 在业务层进行归并排序 + 去重。
3. 取前 N 条，生成下一页游标。

* ✅ 精准游标、功能完整。
* ❌ 应用层复杂度高。

---

## ✅ PostgreSQL 特有 Bonus：`UNION ALL` 查询合并

```sql
SELECT p.*
FROM (
  SELECT product_id FROM product_tag WHERE tag_id = 1 AND product_id > :cursor
  UNION
  SELECT product_id FROM product_tag WHERE tag_id = 3 AND product_id > :cursor
  UNION
  SELECT product_id FROM product_tag WHERE tag_id = 5 AND product_id > :cursor
) merged
JOIN product p ON p.id = merged.product_id
ORDER BY p.id
LIMIT 20;
```

* PostgreSQL 执行器优化 `UNION` 合并；
* ✅ 不用外部系统；❌ 查询有排序负担，仍非最佳。

---

## ✅ 总结表格

| 方案           | 是否纯 DB 实现 | 优点    | 缺点      | 适用条件     |
| ------------ | --------- | ----- | ------- | -------- |
| 单标签 + 游标     | ✅ 是       | 极快    | 不支持多标签  | 默认推荐     |
| 多标签 + OFFSET | ✅ 是       | 简单、兼容 | 深翻页慢    | 中等数据量可接受 |
| 多标签 + 游标归并   | ✅ 是       | 精准游标  | 应用层处理复杂 | 大量筛选组合需求 |
| Redis/ES     | ❌ 否       | 秒级性能  | 系统复杂度提升 | 超大规模搜索系统 |

---

## ✅ 最终结论

> ❗你没有设计错，也不一定非要 Redis / ES。只是你同时追求：
> **多标签组合筛选 + 游标分页 + 高性能**，这本质上就是数据库索引结构的限制。

你可以在以下三种方式中取舍：

* 限制功能（只支持单标签 / OFFSET）；
* 提升结构复杂度（归并排序）；
* 引入异构系统做加速（Redis / ES）。

