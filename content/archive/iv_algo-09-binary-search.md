+++
title = "二分查找"
date = 2025-05-20T19:23:26+08:00
draft = false
description = ""
subtitle = "刷题之二分查找"
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

# 边界控制模版在此

| 特性                | 左闭右闭 `[left, right]` | 左闭右开 `[left, right)` |
| ----------------- | -------------------- | -------------------- |
| 最常见场景             | 更直观、易理解              | STL/Java 中习惯         |
| 区间是否包含 right      | ✅ 包含                 | ❌ 不包含                |
| 终止条件              | `left <= right`      | `left < right`       |
| 缩小右边界             | `right = mid - 1`    | `right = mid`        |
| 使用 mid 判断后是否要包含自己 | 不要漏掉 mid             | 保留 mid               |
