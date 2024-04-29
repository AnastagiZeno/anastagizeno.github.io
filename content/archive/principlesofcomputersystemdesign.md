+++
title = "MIT RES.6-033"
date = 2024-04-23T11:25:40+08:00
draft = false
description = "Principles Of Computer System Design: An Introduction"
subtitle = ""
header_img = "/image/2024/hadrian_trip.jpg"
short = false
toc = true
tags = []
categories = []
series = []
comment = false

+++

[[MIT]Principles Of Computer System Design: An Introduction](https://ocw.mit.edu/courses/res-6-004-principles-of-computer-system-design-an-introduction-spring-2009/pages/online-textbook/)


[*Textbook PDF(very outdated version)*](/pdf/principles-of-computer-system-design-an-introduction.pdf)

## Ch7
[chapter 7 PDF](/pdf/principles_of_cyd_ch7.pdf)

![~](/image/2024/layered_network.png)

**7.1 Interesting Properties of Networks**

- 7.1.2 介绍了决策缓存区大小和适当丢弃的策略。根据队列理论中M/M/1模型的特征——此模型中消息包到达和处理过程均遵循泊松分布，假设系统利用率为$\rho$，那么*平均队列长度*和*队列长度的方差*均为$\frac{1}{1-\rho}$，假如系统利用率为0.8，那么平均来说队列内的消息为5个。但这只是平均情况，如果希望能对突出的峰值有更好的应对，那么需要预留的buffer显然要比5个更大。
