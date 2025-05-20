+++
title = "查分数组"
date = 2025-05-20T12:27:08+08:00
draft = true
description = ""
subtitle = "刷题之差分数组（Difference Array）"
header_img = ""
short = false
toc = true
tags = []
categories = ["Computer Science"]
series = ["算法题系列"]
comment = false
summary = ""
hidden = true
+++

# 差分数组原理与模板

## 一、基础概念

**差分数组**（Difference Array）是用来高效进行“大量区间增减操作”的技巧。

它可以将多次区间操作的复杂往复変成**对较少量的修改，然后通过前置和还原**得到最终结果。

其基本思想是：

> 如果要对数组中一段区间 `[l, r]` 的元素同时 +val，那么只需要进行
>
> ```
> diff[l] += val
> diff[r+1] -= val
> ```
>
> 然后通过前置和就能还原出结果数组。

## 二、基本模板

### 1. 创建 diff 差分数组

```python
# 原始数组 nums
n = len(nums)
diff = [0] * (n + 1)

# 构造 diff
for i in range(n):
    diff[i] = nums[i] - (nums[i - 1] if i > 0 else 0)
```

### 2. 单次区间增减

```python
def range_add(l, r, val):
    diff[l] += val
    if r + 1 < len(diff):
        diff[r + 1] -= val
```

### 3. 还原结果

```python
# 通过前置和还原
res = [0] * n
res[0] = diff[0]
for i in range(1, n):
    res[i] = res[i - 1] + diff[i]
```

## 三、示例题（大量区间 +1）

### 题目

给一个长度为 n 的数组全为 0，对 m 次操作，每次将区间 `[l, r]` 的值 +1，最后返回结果数组。

### 解法

```python
def getModifiedArray(n, operations):
    diff = [0] * (n + 1)

    for l, r in operations:
        diff[l] += 1
        if r + 1 < n:
            diff[r + 1] -= 1

    res = [0] * n
    res[0] = diff[0]
    for i in range(1, n):
        res[i] = res[i - 1] + diff[i]

    return res
```

## 四、常见应用场景

| 场景类型     | 示例                |
| -------- | ----------------- |
| 区间增减类操作  | 进行大量的 range add   |
| 区间出现次数统计 | 统计每个位置被包含次数       |
| 性能优化     | 当直接给 nums 操作性能太低时 |

## 五、小结

差分数组是对区间增减问题的强有力的技巧，配合前置和就能在 O(1) 处理单次区间操作，总处理量在 O(n + m) 。

