+++
title = "7日刷题"
date = 2025-04-28T10:03:45+08:00
draft = false
description = ""
subtitle = "额外一天：记录"
header_img = ""
short = false
toc = true
tags = []
categories = ["计算机"]
series = ["面试", "算法题"]
comment = false
summary = ""
hidden = true
+++

#### 线段张力
Jerry.ai的面试题，leetcode上没这题，估计起码也得是个Medium，边界case多，调了老半天。
```python
线段是无限长的，初始张力每一处都是0，实现`add(from, to, intensity)`和`set(from, to, intensity)`方法，调整一段线段区间的张力。
`toString`发放用来输出线短张力的显示比如`[[10,1],[30,0]]`表示10到30这一段的张力为1，其余部分都为0.

思路：
1.可以设想线段张力的变化是由每一个点(x,y)来控制的。所以尝试使用链表来维护线段的结构。
2.add和set实际就是插入两个点(x,y), 并且在两个点之间的左闭右开区间内处理y值变化。
3.时间复杂度O(n)， 空间复杂度O(n) 。

class Point:
    def __init__(self, x, y=0):
        self.x = x
        self.y = y
        self.prev = None
        self.next = None


class IntensitySegments:
    def __init__(self):
        self.head = Point(-float('inf'))
        self.tail = Point(float('inf'))
        self.head.next = self.tail
        self.tail.prev = self.head

    def add(self, from_, to, amount):
        # 插入区间节点
        start = self._insert_point(from_)
        end = self._insert_point(to)

        # 更新区间内的y值
        cur = start
        while cur != end:
            cur.y += amount
            cur = cur.next

        self._merge(start, end)

    def set(self, from_, to, amount):
        start = self._insert_point(from_)
        end = self._insert_point(to)

        cur = start
        while cur != end:
            cur.y = amount
            cur = cur.next
        self._merge(start, end)

    def _insert_point(self, pos):
        cur = self.head
        while cur:
            if cur.x == pos:
                return cur
            elif cur.x > pos:
                # y值取前序节点的相同高度
                prev = cur.prev
                point = Point(pos, prev.y)

                prev.next = point
                point.prev = prev
                point.next = cur
                cur.prev = point
                return point
            cur = cur.next
        return None

    # 连续等高区间需要合并处理，此处仅对[start-1, end+1]处理就行
    @staticmethod
    def _merge(start, end):
        cur = start
        while cur != end.next:
            prev = cur.prev
            # 相同的话删除后一个
            if prev.y == cur.y:
                prev.next = cur.next
                cur.next.prev = prev
            cur = cur.next

    # fixme：说明，使用驼峰命名是为了保持与题干中的函数名保持一致
    def toString(self):
        ret = []
        cur = self.head.next
        while cur.next:
            ret.append([cur.x, cur.y])
            cur = cur.next
        return ret


def test_IntensitySegments():
    s = IntensitySegments()

    # Test 1
    assert s.toString() == []

    s.add(10, 30, 1)
    assert s.toString() == [[10, 1], [30, 0]]

    # Test 2
    s = IntensitySegments()
    s.add(10, 30, 1)
    s.add(20, 40, 1)
    assert s.toString() == [[10, 1], [20, 2], [30, 1], [40, 0]]

    # Test 3
    s = IntensitySegments()
    s.add(10, 30, 1)
    s.add(20, 40, 1)
    s.add(10, 40, -2)
    assert s.toString() == [[10, -1], [20, 0], [30, -1], [40, 0]]

    # Test 4
    s = IntensitySegments()
    s.add(10, 30, 1)
    s.add(20, 40, 1)
    s.set(10, 40, 5)
    assert s.toString() == [[10, 5], [40, 0]]

    # Test 5
    s = IntensitySegments()
    s.add(10, 20, 1)
    s.add(30, 40, 2)
    s.set(15, 35, 5)
    assert s.toString() == [[10, 1], [15, 5], [35, 2], [40, 0]]

    # Test 6
    s = IntensitySegments()
    s.add(10, 20, 3)
    s.set(5, 25, 3)
    assert s.toString() == [[5, 3], [25, 0]]
    print("ok")
```