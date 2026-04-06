+++
title = "整吧"
date = 2026-01-21T11:22:53+08:00
draft = false
description = ""
subtitle = ""
header_img = ""
short = false
toc = true
tags = []
categories = []
series = []
comment = false
summary = ""
hidden = false
+++

#

https://harness-books.agentway.dev/index.html
https://harness-books.agentway.dev/book1-claude-code/
https://harness-books.agentway.dev/book2-comparing/

# 学习计划

围绕 PPT 中的素材，我把学习顺序拆成三个阶段：先补齐认知与阅读，再熟悉模型与评测方法，最后搭建工具链与自动化体系。下面的列表按这个节奏组织，你可以按章节逐步推进。

## 1. 注意事项
- [Anthropic 是怎么使用 Claude Code](https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf)：讲清楚“写代码 ≠ 交付好软件”的现实，也提醒收益很高、门槛很低，应保持开放心态。

## 2. 理论与案例阅读
### 2.1 必读 / 入门（建议一口气读完）
- [结构化提示词](https://github.com/langgptai/LangGPT)：从提示词工程切入的入门教程。
- [AI 代理的上下文工程](https://manus.im/zh-cn/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)：Manus 的一线经验。
- [Manus AI Agent PPT](https://drive.google.com/file/d/1QGJ-BrdiTGslS71sYH4OJoidsry3Ps9g/view)：配套幻灯，可结合文章食用。
- [Context Rot](https://research.trychroma.com/context-rot)：More Input, More Stupid，解释长上下文的退化现象。
- [评估 LLM 的上下文能力](https://nrehiew.github.io/blog/long_context/)：指出“1M 上下文”更多是宣传。

### 2.2 Anthropic 官方文章（作为一组工作手册）
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Writing effective tools for agents — with agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

### 2.3 进阶延伸（补完认知边界）
- [Cognition｜Don’t Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents)
- [Letta｜Anatomy of a Context Window](https://www.letta.com/blog/guide-to-context-engineering)
- [Letta｜Agent Memory](https://www.letta.com/blog/agent-memory)
- [Letta｜RAG is not Agent Memory](https://www.letta.com/blog/rag-vs-agent-memory)
- [LangChain｜The rise of "context engineering"](https://blog.langchain.com/the-rise-of-context-engineering/)
- [LangChain｜Context Engineering for Agents](https://blog.langchain.com/context-engineering-for-agents/)
- [Github｜12 Factor Agents](https://github.com/humanlayer/12-factor-agents)

## 3. 模型与评测
### 3.1 基本性能指标
- [Token 计算器](https://platform.openai.com/tokenizer)：估算一段代码需要的上下文预算。
- [SWE-Bench](https://www.swebench.com/)：衡量“智力水平”的公共基准，目标是 70%+（配合推理策略）。
- [Claude API 成本页](https://www.claude.com/pricing#api)：结合 Prompt Cache、Reasoning、ToolUse 规划预算。

### 3.2 国际主流模型
- [gpt-5.2-codex](https://openai.com/zh-Hant/index/introducing-gpt-5-2-codex/)：适合修复 BUG，精准但稍慢。
- [Gemini 3.0 Pro](https://aistudio.google.com/models/gemini-3)：对话体验最佳，适合作为常驻副驾。
- [Gemini 3.0 Flash](https://blog.google/products/gemini/gemini-3-flash/)：强调推理速度，可做快速遍历。
- [Opus](https://www.anthropic.com/claude/opus)：当前最强的 coding 模型，可以作为主力 agent。
- [Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5)：“全能模型”，进一步搭配 Haiku 形成梯队。

### 3.3 中国模型
- [Qwen3 Max](https://qwen.ai/blog?id=72071a922385147be2ca81cdfaa50035db6e85d0)：定位“中国特色 Gemini”。
- [Qwen3 Coder Plus](https://qwenlm.github.io/blog/qwen3-coder/)：备用 coder，当占坑模型使用。
- [GLM 4.6](https://docs.z.ai/guides/llm/glm-4.6)：能力不错，但近期表现趋弱，关注版本更新。
- [Minimax-M2](https://www.minimax.io/news/minimax-m2)：推理速度与成本折中，可跑本土合规方案。
- [Kimi K2](https://moonshotai.github.io/Kimi-K2/)：主打长上下文场景，可配合知识库。

## 4. 工具链与平台
### 4.1 Web / Remote Agent
- [v0.dev](https://v0.dev/)、[lovable](https://lovable.dev/)、[Google AI Studio](https://aistudio.google.com/apps)、[bolt.new](https://bolt.new/)：免环境、可在线预览，适合快速验证 DEMO。

### 4.2 VSCode-Fork 工具（商业 + 开源）
- 商业产品：  
  - [Cursor](https://cursor.com/)：当下最流行，开箱即用。  
  - [Antigravity](https://antigravity.google/)：Google 出品，额度阔绰。  
  - [Windsurf](https://windsurf.com/)：功能中规中矩。  
  - [Trae](https://trae.ai/)：字节系方案。  
  - [Qoder](https://qoder.com/) / [CodeBuddy](https://www.codebuddy.com/)：可做 Cursor 替代，对国内更友好。
- 开源项目：  
  - [Void](https://voideditor.com/)（已停止维护）。  
  - [Cline](https://cline.bot/)、[Roo Code](https://roocode.com/)、[Kilo Code](https://kilocode.ai/)、[continue.dev](https://www.continue.dev/)：可自行托管，便于深度定制。

### 4.3 CLI 工具
- [Claude Code](https://www.claude.com/product/claude-code)：特性最丰富、适用场景最广。
- [Codex CLI](https://developers.openai.com/codex/cli/)：功能简洁，主要靠模型力。
- [OpenCode](https://opencode.ai/)：插件设计成熟，适合复杂工作区。
- [iflow](https://iflow.cn/)：国产 Claude Code。
- [gemini cli](https://github.com/google-gemini/gemini-cli)：简单但更新迅速，可抢鲜体验。

### 4.4 个人常用 AI 工具
- [Cherry Studio](https://github.com/CherryHQ/cherry-studio)：跨平台桌面副驾。
- [Gemini](http://gemini.google.com/) Pro 会员：追求高可用的聊天体验。
- [AIHubMix](https://aihubmix.com/models)：托管多模型/多代理，做统一入口。
- [notebooklm](https://notebooklm.google/)：知识库管理。
- [Dify](https://dify.ai/)：快速把简单功能上线。
- [zread](https://zread.ai/) / [deepwiki](https://deepwiki.com/)：分析开源仓库、提炼资料。

## 5. MCP 生态与插件
### 5.1 快速找 MCP
- [官方收录列表](https://github.com/modelcontextprotocol/servers)：第一站，确认官方兼容。
- [Awesome MCP](https://github.com/punkpeye/awesome-mcp-servers)：社区维护的精选合集。
- [smithery.ai](https://smithery.ai/)、[mcp.so](https://mcp.so/zh)、[魔塔 MCP 广场](https://www.modelscope.cn/mcp)：快速检索第三方服务。

### 5.2 常用 MCP（安装优先级）
- [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)：读取控制台 / 网络日志。
- [Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559)：图形交互。
- [K8S MCP](https://github.com/containers/kubernetes-mcp-server)：集群运维，记得 readonly 模式。
- [github MCP](https://github.com/github/github-mcp-server)：操作仓库（如可替换成 `gh` CLI）。 
- [context7](https://github.com/upstash/context7) / [ref.tools](https://ref.tools/)：上下文与文档管理，后者更精准。

## 6. 知识沉淀与 SOP
- [cc-plugin](https://github.com/TokenRollAI/cc-plugin)：把 AI 行为写成 llmdoc，构建“外挂持久化数据层”。
- [recorder](https://recorder.tokenroll.ai/)：自动记录操作轨迹，生成 SOP 日志，配合“commit 前手动总结”机制使用。
