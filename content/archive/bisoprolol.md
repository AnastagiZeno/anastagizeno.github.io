+++
title = "比索洛尔"
date = 2024-04-24T16:21:06+08:00
draft = false
description = ""
subtitle = ""
header_img = "/image/2024/Bisoprolol_ball-and-stick.png"
short = false
toc = true
tags = []
categories = []
series = []
comment = false
+++


#### cheatsheet

[emoji](https://gohugo.io/quick-reference/emojis/)

[latex语法表](https://www.cmor-faculty.rice.edu/~heinken/latex/symbols.pdf)

[正则手册](https://tool.oschina.net/uploads/apidocs/jquery/regexp.html)

①②③④⑤⑥⑦⑧⑨


```javascript
// 在console中执行代码改变Chrome PDF浏览器的背景色

var cover = document.createElement("div");
let css = `
    position: fixed;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #DCE2F1;
    mix-blend-mode: multiply;
    z-index: 1;
`
cover.setAttribute("style", css);
document.body.appendChild(cover);
```


> 在产品设计和开发设计领域，ADR通常是"Architecture Decision Record"的缩写。Architecture Decision Record 是一种记录架构决策的文档，详细描述了在系统、项目或组件设计过程中所做的关键架构选择，包括决策的背景、考虑的选项、权衡取舍和最终选择。
> 使用ADR的主要目的是提供透明度和可追溯性，使团队成员和利益相关者能够理解为什么某个架构决策是如此做出的。这有助于未来在遇到类似问题时有一个参考框架，同时也为新加入的团队成员提供了背景信息，帮助他们快速上手项目。
> 记录的内容通常包括以下几个部分：
- 标题（Title）：简要描述决策的内容。
- 背景（Context）：描述决策的背景和需要解决的问题。
- 决策（Decision）：详细列出所选择的解决方案。
- 权衡（Rationale）：解释为什么做出这个决策，包括考虑过的其他选项及其优缺点。
- 后果（Consequences）：描述此决策的预期影响和可能的后续步骤。
