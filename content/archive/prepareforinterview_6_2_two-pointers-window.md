+++
title = "刷题之双指针、滑动窗口"
date = 2025-05-01T16:02:12+08:00
draft = false
description = ""
subtitle = ""
header_img = ""
short = false
toc = true
tags = ["算法题"]
categories = ["计算机"]
series = ["面试系列"]
comment = false
summary = ""
hidden = true
+++
# 双指针与滑动窗口技巧指南

[刷题记录-简单-双指针和滑动窗口](dogdoor/janus/2025/two_pointer_easy.py)
[刷题记录-中级-双指针和滑动窗口](dogdoor/janus/2025/two_pointer_medium.py)
[刷题记录-高级-双指针和滑动窗口](dogdoor/janus/2025/two_pointer_hard.py)

## 1. 特点与识别

* **对撞/配对**：有序数组，从两端逼近解决`两数之和` `三数之和` `盛水容器`等。
* **快慢指针**：`链表环检测`、`中点查找`、`删除倒数第 K 个节点`，通过不同速度实现跳跃式遍历。
* **滑动窗口**：字符串或数组的连续区间问题，如`最长/最短子串`、`覆盖目标`、`无重复子串`。
* **多指针合并**：同步推进多个指针生成有序序列或`合并多个有序链表/数组`。
* **中心指针两侧扩展** 就他妈一道题，特殊，`5.最长回文子串`

识别特点：
1. 题目的数据结构，是否有序？是否有非显式的内在顺序？是否允许我们自行排序？
2. 求的问题，不管是最长，最大，最宽之类的。是否跟这个顺序有关系？是否跟区间的左右边界有关？
3. 是否明显可以体现出相似子结构问题（递归思想），有的话大概率就是DP问题了。

## 2. 通用解题思路

1. 分析题干：捕获`有序` `连续区间` `环` `覆盖` `去重`等关键词。
2. 确定指针：Head/Tail、Slow/Fast、Left/Right 或多游标。
3. 设计移动：对撞收敛、滑窗扩收、快慢步长、多指针并行。
4. 记录结果：满足条件后保存索引、长度或结果集。
5. 边界处理：考虑空输入、单元素、全相同、极端值。

## 3. 高频经典题目

### 🟢 LeetCode 167 - 两数之和 II

* 📝 **题目**：给定升序列表与目标值，返回一组相加等于目标值的下标，下标从1开始。
* 💡 **思路**：对撞指针从两端开始，依据当前和与目标大小的比较移动指针，直至找到符合条件的两个数。
* 🔑 **技巧**：利用有序数组特性，无需回退指针，保证 O(n) 时间完成。

```python2
def two_sum_ii(numbers, target):
    i, j = 0, len(numbers) - 1
    while i < j:
        s = numbers[i] + numbers[j]
        if s == target:
            return i+1, j+1
        if s < target:
            i += 1
        else:
            j -= 1
```

### 🟢 LeetCode 11 - 盛水容器

* 📝 **题目**：给定列表 `height`，求两条垂直线与 x 轴围成容器的最大水量。
* 💡 **思路**：先计算当前容积，移动高度较低的指针尝试遇到更高边界，并持续更新最大值。
* 🔑 **技巧**：每次移动短板一侧，无需考虑回退，保证线性时间。

```python2
def max_area(height):
    i, j, maxv = 0, len(height)-1, 0
    while i < j:
        area = (j - i) * min(height[i], height[j])
        maxv = max(maxv, area)
        if height[i] < height[j]:
            i += 1
        else:
            j -= 1
    return maxv
```

### 🟡 LeetCode 3 - 无重复字符的最长子串

* 📝 **题目**：给定字符串 `s`，返回最长无重复字符子串的长度。
* 💡 **思路**：滑动窗口向右扩张，遇到重复字符时将左边界直接跳过上一次出现的位置，保持窗口内字符唯一，更新最大长度。
* 🔑 **技巧**：哈希表记录字符最后出现下标，左边界跳转无需逐步移动。

```python2
def length_of_longest_substring(s):
    last, start, ans = {}, 0, 0
    for i, c in enumerate(s):
        if c in last and last[c] >= start:
            start = last[c] + 1
        ans = max(ans, i - start + 1)
        last[c] = i
    return ans
```

### 🟡 LeetCode 76 - 最小覆盖子串

* 📝 **题目**：给定 `s` 和 `t`，在 `s` 中找出包含 `t` 所有字符的最短子串。
* 💡 **思路**：滑动窗口不断扩张直至包含所有字符，再收缩左边界优化最短长度，循环此过程得到最优解。
* 🔑 **技巧**：使用 `valid` 计数判断窗口是否完备，避免每次遍历整个哈希对比。

```python2
from collections import Counter

def min_window_substring(s, t):
    need, window = Counter(t), {}
    valid, left, start, length = 0, 0, 0, float('inf')
    for right, c in enumerate(s):
        if c in need:
            window[c] = window.get(c, 0) + 1
            if window[c] == need[c]:
                valid += 1
        while valid == len(need):
            if right - left + 1 < length:
                start, length = left, right - left + 1
            d = s[left]
            if d in need:
                if window[d] == need[d]:
                    valid -= 1
                window[d] -= 1
            left += 1
    return s[start:start+length] if length != float('inf') else ''
```

### 🟡 LeetCode 438 - 找到所有字母异位词

* 📝 **题目**：给定 `s` 和 `p`，返回 `s` 中所有 `p` 的异位词起始索引。
* 💡 **思路**：固定窗口长度为 `len(p)`，滑动期间更新窗口频次计数和 `valid`，匹配时记录当前左边界。
* 🔑 **技巧**：先扩张再收缩窗口可保持固定长度检验，简化逻辑。

```python2
from collections import Counter

def find_anagrams(s, p):
    need, window, res = Counter(p), {}, []
    left, valid = 0, 0
    for right, c in enumerate(s):
        if c in need:
            window[c] = window.get(c, 0) + 1
            if window[c] == need[c]:
                valid += 1
        if right - left + 1 > len(p):
            d = s[left]
            if d in need:
                if window[d] == need[d]:
                    valid -= 1
                window[d] -= 1
            left += 1
        if valid == len(need):
            res.append(left)
    return res
```

### 🔴 LeetCode 42 - 接雨水

* 📝 **题目**：给定列表 `height`，计算能够接住的雨水总量。
* 💡 **思路**：双指针并行，从两侧同时維護最高水位，较低一侧累加差值并移动指针。
* 🔑 **技巧**：更新最大水位后立即决定移动方向，无需额外比较。

```python2
def trap_rain_water(height):
    l, r, lm, rm, ans = 0, len(height) - 1, 0, 0, 0
    while l < r:
        lm = max(lm, height[l])
        rm = max(rm, height[r])
        if lm < rm:
            ans += lm - height[l]
            l += 1
        else:
            ans += rm - height[r]
            r -= 1
    return ans
```

### 🔴 LeetCode 239 - 滑动窗口最大值

* 📝 **题目**：给定 `nums` 和窗口大小 `k`，返回每个滑动窗口的最大值列表。
* 💡 **思路**：使用单调递减队列存索引，队首为最大值，滑动时更新并记录。
* 🔑 **技巧**：新值进队前剔除所有更小索引，保证队列单调。

```python2
from collections import deque

def max_sliding_window(nums, k):
    q, res = deque(), []
    for i, v in enumerate(nums):
        while q and nums[q[-1]] < v:
            q.pop()
        q.append(i)
        if q[0] == i - k:
            q.popleft()
        if i >= k - 1:
            res.append(nums[q[0]])
    return res
```
