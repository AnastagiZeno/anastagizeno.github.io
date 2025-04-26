+++
title = "7日刷题"
date = 2025-04-25T13:02:12+08:00
draft = false
description = ""
subtitle = "星期二：字符串、双指针、二分、滑动窗口等题型总结"
header_img = ""
short = false
toc = true
tags = ["面试"]
categories = ["计算机"]
series = ["吃饭的家伙事儿"]
comment = false
summary = ""
+++

## ✂️ 字符串（String）

### 🧩 核心概念：
- 字符串是字符序列，常用于模式匹配、计数、翻转等
- 常见操作：滑动窗口、前缀和、哈希表、KMP
- 字符串不可变，需注意操作效率

### 🔍 常见题型：

#### 1. 无重复字符的最长子串（LeetCode 3）
> 给定一个字符串，找出其中不含重复字符的最长子串长度。
```python
def lengthOfLongestSubstring(s):
    window = set()
    left = res = 0
    for right in range(len(s)):
        while s[right] in window:
            window.remove(s[left])
            left += 1
        window.add(s[right])
        res = max(res, right - left + 1)
    return res
```
✅ 技巧：滑动窗口 + 哈希集合判断重复。

#### 2. 最长回文子串（LeetCode 5）
> 找出给定字符串中的最长回文子串。
```python
def longestPalindrome(s):
    res = ""
    for i in range(len(s)):
        tmp1 = expand(s, i, i)
        tmp2 = expand(s, i, i+1)
        res = max(res, tmp1, tmp2, key=len)
    return res

def expand(s, l, r):
    while l >= 0 and r < len(s) and s[l] == s[r]:
        l -= 1
        r += 1
    return s[l+1:r]
```
✅ 技巧：中心扩展法，枚举中心点。


## 🩵 双指针（Two Pointers）

### 🧩 核心概念：
- 两个指针用于扫描数组，方向可能相同或相反
- 常用于排序数组的合并、滑动窗口、快慢指针

### 🔍 常见题型：

#### 1. 盛水最多的容器（LeetCode 11）
> 给定数组，找出能盛最多水的两条线。
```python
def maxArea(height):
    l, r = 0, len(height) - 1
    res = 0
    while l < r:
        res = max(res, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return res
```
✅ 技巧：左右指针逼近，贪心尝试更大容积。

#### 2. 移除元素（LeetCode 27）
> 原地移除数组中所有等于 val 的元素，返回新长度。
```python
def removeElement(nums, val):
    slow = 0
    for fast in range(len(nums)):
        if nums[fast] != val:
            nums[slow] = nums[fast]
            slow += 1
    return slow
```
✅ 技巧：快慢指针，慢指针指向合法区域。


## 🎯 二分查找（Binary Search）

### 🧩 核心概念：
- 有序数组中查找目标值，时间复杂度 O(log n)
- 模板分为标准二分、左边界/右边界二分

### 🔍 常见题型：

#### 1. 二分查找（LeetCode 704）
> 给定有序数组和目标值，返回目标值索引或 -1。
```python
def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```
✅ 技巧：模板基础版，注意边界条件。

#### 2. 寻找左侧边界（LeetCode 34）
```python
def left_bound(nums, target):
    left, right = 0, len(nums)
    while left < right:
        mid = (left + right) // 2
        if nums[mid] >= target:
            right = mid
        else:
            left = mid + 1
    return left
```
✅ 技巧：用于查找插入位置、左边界。


## 💎 贪心算法（Greedy）

### 🧩 核心概念：
- 每一步都选局部最优解，期望推导出全局最优
- 常与排序、堆、双指针结合

### 🔍 常见题型：

#### 1. 跳跃游戏（LeetCode 55）
> 判断是否可以从起点跳到终点。
```python
def canJump(nums):
    farthest = 0
    for i in range(len(nums)):
        if i > farthest:
            return False
        farthest = max(farthest, i + nums[i])
    return True
```
✅ 技巧：维护能到达的最远位置。

#### 2. 分发饼干（LeetCode 455）
> 分发最少数量的饼干使最多的孩子满足。
```python
def findContentChildren(g, s):
    g.sort()
    s.sort()
    i = j = 0
    while i < len(g) and j < len(s):
        if s[j] >= g[i]:
            i += 1
        j += 1
    return i
```
✅ 技巧：排序 + 贪心匹配最小可满足。

#### 3. 用最少数量的箭引爆气球（LeetCode 452）
> 给定气球的范围，用最少的箭把它们全射爆。
```python
def findMinArrowShots(points):
    points.sort(key=lambda x: x[1])
    arrows = 0
    end = float('-inf')
    for p in points:
        if p[0] > end:
            arrows += 1
            end = p[1]
    return arrows
```
✅ 技巧：区间贪心，按右端排序后贪心选最早的非重叠。

## 🚪 滑动窗口（Sliding Window）

### ✨ 核心概念
- 对于序列/字符串，定长/可变长的子段调整
- 通常配合 HashMap / HashSet 使用
- 常见算法：双指针、总和算法

### 🔍 常见题型

#### 1. 最小子串包含所有字符 (LeetCode 76)
> 给定 s 和 t，找 s 中最短包含 t 全部字符的子串

```python
from collections import Counter

def minWindow(s, t):
    need = Counter(t)
    window = {}
    left = right = 0
    valid = 0
    start = 0
    length = float('inf')

    while right < len(s):
        c = s[right]
        right += 1
        if c in need:
            window[c] = window.get(c, 0) + 1
            if window[c] == need[c]:
                valid += 1
        while valid == len(need):
            if right - left < length:
                start = left
                length = right - left
            d = s[left]
            left += 1
            if d in need:
                if window[d] == need[d]:
                    valid -= 1
                window[d] -= 1
    return "" if length == float('inf') else s[start:start+length]
```

✅ 技巧：结合 HashMap，出现 valid == len(need) 时尽量缩小左边界。

#### 2. 查找字符串所有的排列 (LeetCode 567)
> s1 是 s2 的排列子串？

```python
from collections import Counter

def checkInclusion(s1, s2):
    need = Counter(s1)
    window = {}
    left = right = 0
    valid = 0

    while right < len(s2):
        c = s2[right]
        right += 1
        if c in need:
            window[c] = window.get(c, 0) + 1
            if window[c] == need[c]:
                valid += 1

        while right - left >= len(s1):
            if valid == len(need):
                return True
            d = s2[left]
            left += 1
            if d in need:
                if window[d] == need[d]:
                    valid -= 1
                window[d] -= 1
    return False
```

✅ 技巧：控制窗口长度，精确匹配。

#### 3. 最长子串至多包含 K 个不同字符（LeetCode 340）
> 返回最长子串，最多包含 K 个不同字符。

```python
from collections import defaultdict

def lengthOfLongestSubstringKDistinct(s, k):
    left = 0
    counter = defaultdict(int)
    res = 0

    for right in range(len(s)):
        counter[s[right]] += 1
        while len(counter) > k:
            counter[s[left]] -= 1
            if counter[s[left]] == 0:
                del counter[s[left]]
            left += 1
        res = max(res, right - left + 1)
    return res
```

✅ 技巧：维护一个固定条件的窗口，每次调整保证满足条件。

### 📅 模板套路

```python
def sliding_window(s):
    left = right = 0
    window = {}

    while right < len(s):
        c = s[right]
        right += 1
        # 窗口内操作

        while (满足条件):
            # 窗口缩小
            d = s[left]
            left += 1
```

## 🔒 状态压缩 (State Compression)

### ✨ 核心概念
- 用 bitmask 表示多个状态（如选中某个节点）
- 常配 DFS 或 DP
- 复杂度 O(2^n)，适用于 n 较小的情况

### 🔍 常见题型

#### 1. 最短路径打怪 (LeetCode 847)
> 图中每个点都必须经过，最短路径长度

```python
from collections import deque

def shortestPathLength(graph):
    n = len(graph)
    queue = deque()
    visited = set()

    for i in range(n):
        queue.append((i, 1 << i, 0))
        visited.add((i, 1 << i))

    while queue:
        node, mask, dist = queue.popleft()
        if mask == (1 << n) - 1:
            return dist
        for nei in graph[node]:
            next_mask = mask | (1 << nei)
            if (nei, next_mask) not in visited:
                visited.add((nei, next_mask))
                queue.append((nei, next_mask, dist + 1))
```

✅ 技巧：状态 = (当前节点 + 已经过节点的 mask)，完成 mask = (1<<n)-1。

#### 2. 最大跳跃形转 (LeetCode 1345)
> 每步可以前跳、跳到相同值、后跳，求最少步数到终点

```python
from collections import deque, defaultdict

def minJumps(arr):
    n = len(arr)
    if n <= 1:
        return 0
    graph = defaultdict(list)
    for i, v in enumerate(arr):
        graph[v].append(i)

    queue = deque([0])
    visited = {0}
    step = 0

    while queue:
        for _ in range(len(queue)):
            i = queue.popleft()
            if i == n - 1:
                return step
            for j in graph[arr[i]]:
                if j not in visited:
                    visited.add(j)
                    queue.append(j)
            graph[arr[i]].clear()
            if i + 1 < n and i + 1 not in visited:
                visited.add(i + 1)
                queue.append(i + 1)
            if i - 1 >= 0 and i - 1 not in visited:
                visited.add(i - 1)
                queue.append(i - 1)
        step += 1
```

✅ 技巧：同值跳只做一次清空，避免超时。

#### 3. 旅行商问题最小路径（TSP，LeetCode 943）
> 给定字符串数组，找拼接成一个超串的最短路径（包含所有字符串）

```python
from functools import lru_cache

def shortestSuperstring(words):
    n = len(words)

    overlap = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                for k in range(min(len(words[i]), len(words[j])), 0, -1):
                    if words[i].endswith(words[j][:k]):
                        overlap[i][j] = k
                        break

    @lru_cache(None)
    def dp(mask, last):
        if mask == (1 << n) - 1:
            return 0
        res = float('inf')
        for j in range(n):
            if not mask & (1 << j):
                res = min(res, dp(mask | (1 << j), j) + len(words[j]) - overlap[last][j])
        return res

    min_len = float('inf')
    for i in range(n):
        min_len = min(min_len, dp(1 << i, i) + len(words[i]))
    return min_len  # 如果想恢复路径，可加入路径记录
```

✅ 技巧：状态 = (已选字符串集合 + 上一个字符串)，用 LRU 缓存记忆搜索。

### 📅 状压模板套路

```python
# 状态压缩 DFS/DP
state = 0  # 使用 bitmask 表示选中情况

def dfs(state):
    if (符合结束条件):
        return
    for 可选项:
        if (此选项未选中):
            dfs(新状态)
```



