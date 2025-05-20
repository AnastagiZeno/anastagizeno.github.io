+++
title = "刷题之基础数据结构"
date = 2025-05-01T10:02:12+08:00
draft = false
description = ""
subtitle = "树、链表、栈、堆"
header_img = "/image/2025/valter-brani-sarajevo-ogimage.jpg"
short = false
toc = true
tags = ["数据结构"]
categories = ["Computer Science"]
series = ["算法题系列"]
comment = false
summary = ""
hidden = true
+++

# RoadMap
* 题型分类与专属模版

  * 数据结构题（链表、树、栈、队列、图）
  * 双指针与滑动窗口
  * 二分查找
  * 动态规划
  * BFS/DFS
  * 回溯／状态压缩
  ~~* 贪心算法~~
  ~~* 数学与位运算~~
  * 堆与优先队列
  * 并查集

## 🌳 一、树（Tree）相关题型与模板

### 🧩 核心概念：
- 树是一个无环、连通的图结构
- 二叉树是最常见的树类型
- 遍历方式：前序、中序、后序、层序
- 应用：递归、DFS、分治、BST 特性

### 🔍 常见题型：

#### 1. 二叉树的最大深度（LeetCode 104）
> 给定一个二叉树，找出其最大深度。
```python
def maxDepth(root):
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))
```
✅ 技巧：递归地计算左右子树深度，取较大值 +1。

#### 2. 从前序与中序遍历序列构造二叉树（LeetCode 105）
> 给定前序和中序遍历构造唯一的二叉树。
```python
def buildTree(preorder, inorder):
    if not preorder:
        return None
    root = TreeNode(preorder[0])
    idx = inorder.index(preorder[0])
    root.left = buildTree(preorder[1:1+idx], inorder[:idx])
    root.right = buildTree(preorder[1+idx:], inorder[idx+1:])
    return root
```
✅ 技巧：前序首位是根节点，中序将其分为左右子树。

#### 3. 二叉搜索树的最近公共祖先（LeetCode 235）
> 给定一棵 BST，找出两个节点的最近公共祖先。
```python
def lowestCommonAncestor(root, p, q):
    if p.val < root.val and q.val < root.val:
        return lowestCommonAncestor(root.left, p, q)
    if p.val > root.val and q.val > root.val:
        return lowestCommonAncestor(root.right, p, q)
    return root
```
✅ 技巧：利用 BST 性质，往左或往右找。


## 🔗 二、链表（Linked List）相关题型与模板

### 🧩 核心概念：
- 单向链表/双向链表，重要的是节点引用操作
- 常用技巧：快慢指针、虚拟头节点、反转

### 🔍 常见题型：

#### 1. 反转链表（LeetCode 206）
> 将单向链表反转
```python
def reverseList(head):
    prev = None
    curr = head
    while curr:
        tmp = curr.next
        curr.next = prev
        prev = curr
        curr = tmp
    return prev
```
✅ 技巧：迭代中不断调整当前节点指向。

#### 2. 环形链表（LeetCode 141）
> 判断链表中是否有环
```python
def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False
```
✅ 技巧：快慢指针相遇说明有环。

#### 3. 合并两个有序链表（LeetCode 21）
> 合并两个升序链表为一个新的升序链表
```python
def mergeTwoLists(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    while l1 and l2:
        if l1.val < l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next
    curr.next = l1 or l2
    return dummy.next
```
✅ 技巧：归并思想，构造 dummy 节点避免边界问题。


## 📚 三、栈（Stack）相关题型与模板

### 🧩 核心概念：
- LIFO（后进先出）结构
- 常用于：括号匹配、单调栈、前缀中缀后缀表达式

### 🔍 常见题型：

#### 1. 有效的括号（LeetCode 20）
> 判断字符串中括号是否成对匹配。
```python
def isValid(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in mapping:
            if not stack or stack.pop() != mapping[c]:
                return False
        else:
            stack.append(c)
    return not stack
```
✅ 技巧：遇到右括号出栈匹配，最后栈需为空。

#### 2. 每日温度（LeetCode 739）
> 给定每日气温，返回几天后会升温。
```python
def dailyTemperatures(temperatures):
    res = [0] * len(temperatures)
    stack = []
    for i, temp in enumerate(temperatures):
        while stack and temp > temperatures[stack[-1]]:
            idx = stack.pop()
            res[idx] = i - idx
        stack.append(i)
    return res
```
✅ 技巧：单调递减栈，栈里放的是下标。

#### 3. 最小栈（LeetCode 155）
> 实现一个支持获取最小值的栈
```python
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val):
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)

    def pop(self):
        if self.stack.pop() == self.min_stack[-1]:
            self.min_stack.pop()

    def top(self):
        return self.stack[-1]

    def getMin(self):
        return self.min_stack[-1]
```
✅ 技巧：辅助栈存当前最小值。



## 📥 四、队列（Queue）相关题型与模板

### 🧩 核心概念：
- FIFO（先进先出）结构
- 常用于：BFS、滑动窗口、单调队列等

### 🔍 常见题型：

#### 1. 滑动窗口最大值（LeetCode 239）
> 给定一个整数数组 nums，有一个大小为 k 的滑动窗口从数组的最左侧移动到最右侧，返回窗口中的最大值。
```python
# 单调队列：队头始终是窗口内最大值的索引
from collections import deque

def maxSlidingWindow(nums, k):
    q = deque()
    res = []
    for i in range(len(nums)):
        while q and nums[q[-1]] < nums[i]:
            q.pop()
        q.append(i)
        if q[0] <= i - k:
            q.popleft()
        if i >= k - 1:
            res.append(nums[q[0]])
    return res
```
✅ 技巧：用双端队列维护一个**单调递减队列（下标）**，保证窗口最大值总在队首。

#### 2. 打开转盘锁（LeetCode 752）
> 给定一个初始为 "0000" 的锁，通过旋转任意一位可以变成邻近数字，返回最少多少步能到达目标组合。
```python
# BFS 最短路径
from collections import deque

def openLock(deadends, target):
    dead = set(deadends)
    visited = set('0000')
    q = deque([('0000', 0)])
    while q:
        node, step = q.popleft()
        if node in dead:
            continue
        if node == target:
            return step
        for i in range(4):
            for d in (-1, 1):
                n = node[:i] + str((int(node[i]) + d) % 10) + node[i+1:]
                if n not in visited:
                    visited.add(n)
                    q.append((n, step + 1))
    return -1
```
✅ 技巧：标准 BFS 模板，状态压缩可视为图搜索，防止重复访问用 visited 集合。


## 🏔️ 五、堆（Heap）相关题型与模板

### 🧩 核心概念：
- 最小堆 / 最大堆：可快速获取最小（或最大）元素
- Python 中使用 `heapq` 默认是最小堆
- 常用于：Top K 问题、合并多个有序流、优先队列

### 🔍 常见题型：

#### 1. 数组中的第 K 个最大元素（LeetCode 215）
> 给定一个无序数组，找出其中第 k 个最大的元素。
```python
import heapq

def findKthLargest(nums, k):
    return heapq.nlargest(k, nums)[-1]  # 或者手动维护一个最小堆
```
✅ 技巧：使用 `heapq.nlargest(k, nums)` 直接返回前 K 大元素列表。

#### 2. 合并 K 个升序链表（LeetCode 23）
> 将 k 个升序链表合并为一个升序链表，返回合并后的链表。
```python
import heapq

class Solution:
    def mergeKLists(self, lists):
        heap = []
        for i, l in enumerate(lists):
            if l:
                heapq.heappush(heap, (l.val, i, l))

        dummy = ListNode(0)
        curr = dummy
        while heap:
            val, i, node = heapq.heappop(heap)
            curr.next = node
            curr = curr.next
            if node.next:
                heapq.heappush(heap, (node.next.val, i, node.next))
        return dummy.next
```
✅ 技巧：堆中维护每个链表当前节点，利用 Python 最小堆自动排序。加上索引避免值相等时报错。

#### 3. 前 K 个高频元素（LeetCode 347）
> 给定一个非空数组，返回出现频率前 k 高的元素。
```python
from collections import Counter
import heapq

def topKFrequent(nums, k):
    counter = Counter(nums)
    return [item for item, freq in heapq.nlargest(k, counter.items(), key=lambda x: x[1])]
```
✅ 技巧：Counter 统计频率 + `heapq.nlargest` 快速找出 Top K。
