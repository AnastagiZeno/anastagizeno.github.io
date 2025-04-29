+++
title = "7日刷题"
date = 2025-04-27T10:46:10+08:00
draft = false
description = ""
subtitle = "字节开刷-近30天高频出现"
header_img = ""
short = false
toc = true
tags = []
categories = ["计算机"]
series = ["面试"]
comment = false
summary = ""

+++

### 字节题库
#### 42.接雨水 HARD
#### 3.无重复字符的最长子串
`滑动窗口`, `双指针`
```python
def lengthOfLongestSubstring(s):
    """
    :type s: str
    :rtype: int
    """

    left = right = 0
    ret = 0
    h = {}
    while right < len(s):
        char = s[right]
        if char in h and h[char] >= left:
            left = h[char] + 1
        h[char] = right
        
        if right - left + 1 > ret:
            ret = right - left + 1
        right += 1
    return ret
```

#### 662.二叉树的最大宽度
`二叉树`，`广度优先搜索`
```python
def widthOfBinaryTree(root: Optional[TreeNode]) -> int:
    res = 1
    cur_level = [(root, 1)]
    while cur_level:
        # 装下一层子树
        next_level = []
        for node in cur_level:
            if node[0].left is not None:
                next_level.append((node[0].left, 2 * node[1]))
            if node[0].right is not None:
                next_level.append((node[0].right, 2 * node[1] + 1))
        # 当前层最大距离计算
        res = max(res, cur_level[-1][1] - cur_level[0][1] + 1)
        cur_level = next_level
    return res
```

#### 15.三数之和
`双指针`，`排序`

1. **排序**数组（为了后续双指针 + 去重方便）
2. **固定第一个数**，然后在后面的数组里用双指针找两数之和为`-nums[i]`
3. **跳过重复元素**，避免结果重复

**注意**
外层循环和内层双指针移动都要注意跳过重复元素。
```python
def threeSum(self, nums):
    """
    :type nums: List[int]
    :rtype: List[List[int]]
    """
    # 首先排序，为了后面双指针
    nums.sort()
    ret = []
    for idx, num1 in enumerate(nums):
        # 先确定第一个数，注意去重复
        if idx > 0 and num1 == nums[idx-1]:
            continue
        left = idx + 1
        right = len(nums) - 1
        while left < right: # 左右指针相向移动
            cur = nums[left] + nums[right]
            if cur == 0 - num1:
                ret.append([num1, nums[left], nums[right]])
                # 内层第2数和第3数的去重处理
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif cur < 0 - num1:
                left += 1
            else:
                right -= 1
    return ret
```
#### 1.两数之和 S
`哈希表`
```python
def twoSum(self, nums: List[int], target: int) -> List[int]:
    hm = {}
    for idx, n in enumerate(nums):
        # 找partner
        answer = target - n
        if answer in hm:
            return [hm[answer], idx]
        # 把自己放进字典等待后续被partner找到
        hm[n] = idx
    return []
```

#### 20.有效的括号 S
`栈`
1. 遇到左括号就入栈
2. 遇到右括号就出栈，看是否匹配。

**注意** 边界case，最后的栈必须是弹空的。
```python
def isValid(self, s):
    """
    :type s: str
    :rtype: bool
    """
    stack = []
    rmap = {
        "(":")",
        "{":"}",
        "[":"]"
    }
    for char in s:
        if char in rmap:
            stack.append(char)
        else:
            if not stack:
                return False
            p = stack.pop(-1)
            if char != rmap[p]:
                return False
    return not stack
```

#### 27.移除元素
#### 26.删除有序数组中的重复项
`双指针`

26、27合并了，一模一样俩题，本质还是双指针移动。两种方法都可行：
1. 快慢指针，即从头原地覆盖的方式，如下代码展示的
2. 左右指针, 首位向中间移动，左右互换控制，下方代码未展示
```python
def removeElement(self, nums, val):
    """
    :type nums: List[int]
    :type val: int
    :rtype: int
    """
    idx, ret = 0, 0
    for num in nums:
        if num != val:
            nums[idx] = num
            idx += 1
            ret += 1
    return ret
def removeDuplicates(self, nums):
    """
    :type nums: List[int]
    :rtype: int
    """
    ret, idx = 0, 0
    ha = {}
    for n in nums:
        if not n in ha:
            nums[idx] = n
            idx += 1
            ret += 1
        ha[n] = True
    return ret
```

#### 72.编辑距离
`动态规划` `真恶心`
```python
def minDistance(word1, word2):
    # dp[i][j] 表示从word1的前i个字符 -> word2的j个字符
    # dp数组不是笛卡尔坐标系，第一项索引i是行，构造和遍历的时候是外层循环
    l1, l2 = len(word1), len(word2)
    dp = [[0]*(l2+1) for _ in range(l1+1)]

    for i in range(1, l1+1):
        dp[i][0] = i
    for j in range(1, l2+1):
        dp[0][j] = j
    for i in range(1, l1+1):
        for j in range (1, l2+1):
            # 这块一定要-1，word数组和dp数组的索引含义不要混淆
            if word1[i-1] == word2[j-1]: 
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = min(
                    dp[i-1][j-1],
                    dp[i-1][j],
                    dp[i][j-1],
                ) + 1
    return dp[l1][l2]
```

#### 718.最长重复子数组
`动态规划`

求最值、有子问题模型，动态规划无脑上。核心还是动态转移方程怎么确定的。主要索引下标别搞错。
```python
def findLength(self, nums1, nums2):
    
    # dp[i][j] 表示nums1[i:]和nums2[j:]的最长公共子数组长度

    n1, n2 = len(nums1), len(nums2)
    dp = [[0] * (n2 + 1) for _ in range(n1 + 1)]

    res = 0
    for i in range(1, n1 + 1):
        for j in range (1, n2 + 1):
            if nums1[i-1] == nums2[j-1]: # 第i个nums1数字与第j个nums2数字
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = 0
            res = max(dp[i][j], res)
    return res
```
