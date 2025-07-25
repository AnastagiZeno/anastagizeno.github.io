+++
title = "回溯"
date = 2025-05-02T10:02:12+08:00
draft = false
description = ""
subtitle = "刷题之使用DFS/回溯来应对排列组合问题"
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

# 回溯算法与 DFS 的系统总结

> # `组合`、`排列`、`路径搜索`

## 🧠 一、回溯和 DFS 的关系

| 特性     | DFS                | 回溯（Backtracking）              |
| ------ | ------------------ | ----------------------------- |
| 本质     | 一种遍历方式             | 一种用 DFS 实现的“解空间搜索+撤销”的策略      |
| 使用目的   | 遍历所有路径、节点          | 找到所有**满足条件**的解 / 答案           |
| 是否记录路径 | 通常不记录（可用于判断是否存在路径） | 记录路径（用于找出所有可能的方案）             |
| 是否剪枝   | 观情决定是否剪枝           | 必须剪枝（无解要回退）                   |
| 常见场景   | 图遍历、连通块、路径判断等      | 组合/ 排列/ 子集/ 分割问题、N皇后、数独等构造类问题 |
| 核心机制   | 递归/ 栈              | 递归 + “选择-递归-撤销” 的框架           |

**回溯是 DFS 的一个“特化”版本，专门用于构造类问题的解空间搜索。**

## 📦 二、回溯算法的模板

回溯模版能够使用的核心就是这五点，其中2我认为是最重要的，2觉得了递归函数的入参。
1. path 是什么？（当前构造了什么？）
2. choices 是什么？（接下来还能选什么？）
3. 什么时候结束？（递归终点 + 加入结果）
4. 剪枝能不能提前排除非法？
5. 状态如何恢复？（pop）


```python
def backtrack(path, choices):
    if 满足结束条件:
        res.append(path[:])  # 深拷贝保存路径
        return
    for choice in choices:
        if 剪枝条件:
            continue
        path.append(choice) # 做选择
        backtrack(path, updated_choices)
        path.pop() # 撤销选择

```

**变量说明**：

* `path`: 当前构造的解（例如排列、子集等）
* `choices`: 当前可选的元素（如剩余数字、起始下标等）
* `res`: 最终结果集合

**几种常见情况的补充说明**:
1. python做回溯的时候，path变量可以在闭包外部定义，不用每次在递归中传递。因为有撤销选择时path的pop()操作和进入递归时path[:]深拷贝来保证没问题。
2. 一般数组可以通过起点index来控制choices，所以经常的变体是backtrack(start_idx), backtrack(cur_idx + 1)就一个变量参与递归就够了。
3. 一般剪枝条件可能需要累积计算判断，这样可以在递归时传递一个值，递归前计算，递归后反向计算。一般就是求和之类的。

## 🌟 三、题型分类与识别套路

| 类型   | 模板改动点        | 典型题目                    |
| ---- | ------------ | ----------------------- |
| 子集   | 每个元素选 or 不选  | 78. 子集                  |
| 子集去重 | 排序 + 剪枝跳过重复  | 90. 子集 II               |
| 组合   | 不考虑顺序，从后往前   | 77. 组合、216. 组合总和 III    |
| 排列   | 考虑顺序，需标记使用   | 46. 全排列、47. 全排列 II      |
| 分割   | 分割字符串        | 131. 分割回文串、93. 复原 IP 地址 |
| N皇后  | 按行放皇后，检查列/斜线 | 51. N 皇后                |
| 验证类  | 是否存在某路径满足条件  | 79. 单词搜索、130. 被围绕的区域等   |


## ✂️ 四、常见剪枝技巧

| 类型         | 描述                        |
| ---------- | ------------------------- |
| 排序 + 去重    | 相邻重复元素只保留一个，避免重复解         |
| 剩余元素不足     | 提前判断 path 是否还能继续延伸（如组合大小） |
| 越界判断       | 当前值太大或太小，不再进入递归（如组合总和）    |
| visited 标记 | 用于排列问题避免重复使用同一元素          |


## 🌲 五、回溯搜索树示意（组合总和）

以 `combinationSum([2,3,6,7], target=7)` 为例：

```
                    []
         /      /       \         \
      [2]     [3]      [6]       [7]
      /        |
   [2,2]     [3,3]
    ...
```

每层递归相当于“树的一个深度”，每个选择分支是一条“路径”。

## 📌 六、实战建议

* 回溯问题 = **在解空间树上做 DFS**，到叶子节点检查是否合法

* 通常可归纳为三步：

  1. **选择**：从当前可选列表中挑一个
  2. **递归**：继续搜索
  3. **撤销**：回退这一步，继续试下一个

* 关键是掌握两个概念：

  * “路径”（你构造的部分答案）
  * “选择列表”（你当前还能选谁）


## 🔁 七、建议刷题顺序（从易到难）

1. 组合问题：77. 组合、216. 组合总和 III
2. 排列问题：46. 全排列、47. 全排列 II
3. 子集问题：78. 子集、90. 子集 II
4. 分割问题：131. 分割回文串、93. 复原 IP
5. 板子题练熟后挑战：51. N皇后、37. 数独、79. 单词搜索