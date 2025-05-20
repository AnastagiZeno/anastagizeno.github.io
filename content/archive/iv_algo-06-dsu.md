+++
title = "并查集"
date = 2025-05-18T17:38:41+08:00
draft = false
description = ""
subtitle = "刷题之DSU问题合集（Disjoint Set Union）"
header_img = ""
short = false
toc = true
tags = ["算法题"]
categories = ["Computer Science"]
series = ["算法题系列"]
comment = false
summary = ""
hidden = true
+++

# 并查集（Union Find）算法专题总结

## 📌 并查集是什么？

并查集（Disjoint Set Union，简称 DSU）是一种用于处理**动态连通性**问题的数据结构，常用于判断元素是否属于同一集合、多个集合的合并问题。

典型应用包括：

* 图的连通性判断（如朋友圈、岛屿数量）
* 集合归并（合并等价类、区间合并）
* 最小生成树（Kruskal 算法）
* 判环（如冗余连接）


## ✅ 并查集核心操作

### 1. `find(x)`：查找元素 `x` 所属集合的代表元素（根）

* 路径压缩优化：将查找路径上的所有节点直接连接到根上，降低查询时间复杂度

### 2. `union(x, y)`：将元素 `x` 和 `y` 所属的两个集合合并为一个

* 按秩合并优化（可选）：让小树接到大树下面，保持集合结构扁平

## 🧱 标准并查集模板

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # 路径压缩
        return self.parent[x]

    def union(self, x, y):
        fx, fy = self.find(x), self.find(y)
        if fx != fy:
            self.parent[fx] = fy
```

## 🌟 高频 Leetcode 题目汇总

| 题号                                                                                  | 题目           | 难度     | 关键点          |
| ----------------------------------------------------------------------------------- | ------------ | ------ | ------------ |
| [547](https://leetcode.cn/problems/number-of-provinces)                             | 省份数量         | Medium | 连通图计数，入门首选   |
| [684](https://leetcode.cn/problems/redundant-connection)                            | 冗余连接         | Medium | 树中添加边，判环     |
| [399](https://leetcode.cn/problems/evaluate-division)                               | 除法求值         | Medium | 带权并查集，路径带权比值 |
| [990](https://leetcode.cn/problems/satisfiability-of-equality-equations)            | 等式方程可满足性     | Medium | 等价类合并        |
| [1319](https://leetcode.cn/problems/number-of-operations-to-make-network-connected) | 网络连通操作数      | Medium | 连通块数量统计      |
| [1202](https://leetcode.cn/problems/smallest-string-with-swaps)                     | 字符串交换得到字典序最小 | Medium | 连通块内排序（拓展应用） |

## 🧠 常见变种与进阶

| 类型    | 描述                | 示例题号      |
| ----- | ----------------- | --------- |
| 基础并查集 | 判断是否连通 / 计数集合     | 547, 1319 |
| 判环    | 添加边是否构成环          | 684       |
| 带权并查集 | 节点之间存在权值（乘法、加法等）  | 399       |
| 等价类合并 | 等式约束 / 相等变量合并     | 990       |
| 集合内操作 | 连通块中排序 / 筛选 / 求最小 | 1202      |

## 📌 时间复杂度

使用路径压缩 + 按秩合并优化后：

* 单次 `find` 和 `union` 操作的时间复杂度趋近于 **O(α(n))**
* α(n) 是反阿克曼函数，在实际数据范围内近似为常数

## ✅ 推荐刷题顺序

1. \[547] 省份数量（基础建模）
2. \[684] 冗余连接（加边判环）
3. \[1319] 网络连接（计数连通块）
4. \[990] 等式约束可满足性（合并关系）
5. \[399] 除法求值（带权并查集）
6. \[1202] 最小字符串交换（连通块操作）

## 🏁 总结

并查集是一种非常高效且结构简单的算法工具，常出现在图、约束类建模问题中，是后端/算法岗中高级题目的“杀手锏”。掌握 find + union 的基本模型和变体之后，大量中高难度题目都可以快速建模解决。
