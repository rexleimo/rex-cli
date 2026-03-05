---
title: 概览
description: 把现有 Codex/Claude/Gemini CLI 升级为 OpenClaw 风格能力的快速入口。
---

# RexCLI 文档

> 不换客户端，不改习惯。把你正在用的 `codex` / `claude` / `gemini` 升级成 OpenClaw 风格能力体验。

[30 秒开始（主 CTA）](getting-started.md){ .md-button .md-button--primary data-rex-track="cta_click" data-rex-location="hero" data-rex-target="quick_start" }
[查看能力案例](case-library.md){ .md-button data-rex-track="cta_click" data-rex-location="hero" data-rex-target="case_library" }

项目地址：<https://github.com/rexleimo/rex-cli>

`RexCLI` 是面向四类 CLI 智能体的本地工作流层：

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

它不替代原生 CLI，而是补充两项能力：

1. 文件系统 ContextDB（可恢复会话记忆）
2. 透明包装流程（继续直接输入 `codex` / `claude` / `gemini`）

## 我能帮你做什么（运营视角）

### 1. 先把首页转化链路做清楚（从“有人看”到“有人点”）

- 你提供：当前首页链接、目标用户、唯一主目标（例如“快速开始”）。
- 我会做：定位信息断点、收敛 CTA、重写 Hero/问题/证据/行动区。
- 你拿到：可直接替换的页面文案块、CTA 位置方案、埋点事件命名表。
- 衡量方式：主 CTA 点击率与案例页进入率可观测、可迭代。

### 2. 把“我能做什么”讲清楚，并且可交付

- 你提供：现有服务能力、最强案例、明确边界（不做什么）。
- 我会做：把泛化描述改写成“问题 -> 动作 -> 结果”的能力表达。
- 你拿到：能力矩阵、适用人群说明、skills 优先级列表。
- 衡量方式：访客 10 秒内能判断“这是不是我需要的能力”。

### 3. 让多 CLI 协作不断片（Codex/Claude/Gemini 可接力）

- 你提供：当前命令习惯与常见中断点。
- 我会做：定义 checkpoint 粒度、ContextDB 交接规则、one-shot/interactive 流程。
- 你拿到：标准接力命令、恢复模板、跨会话执行规范。
- 衡量方式：切工具或重开会话时，不再反复重讲背景。

### 4. 把团队经验沉淀成可复用 skills

- 你提供：每周重复出现的任务流程。
- 我会做：拆步骤、加约束、补验证点，并封装为可复用 skills。
- 你拿到：skills 文档、执行清单、交付前验证门槛。
- 衡量方式：新人上手更快，交付质量更稳定。

## 当前可直接调用的 Skills（高频）

- `seo-geo-page-optimization`：做着陆页结构、文案与 SEO/Geo 转化优化。
- `xhs-ops-methods`：做小红书运营流程（选题、人设、排发互、复盘）。
- `brainstorming`：在改功能和改页面前先收敛目标与设计方向。
- `writing-plans`：把多步骤需求拆成可执行计划。
- `dispatching-parallel-agents`：把独立任务并行推进，提升交付速度。
- `systematic-debugging`：出现异常时走结构化排障，不盲改。
- `verification-before-completion`：交付前强制验证，避免“以为好了”。

## 为什么说是 OpenClaw 风格能力升级？

你得到的是同类核心能力组合：

- 跨会话记忆（ContextDB）
- 浏览器自动化（Playwright MCP）
- 多 CLI 可接力（Codex / Claude / Gemini / OpenCode）
- 技能化流程复用（skills）

这不是“重新做一个聊天壳”，而是给你现有 CLI 直接加能力层。

## 30 秒上手（先用后看原理）

```bash
git clone https://github.com/rexleimo/rex-cli.git
cd rex-cli
scripts/setup-all.sh --components all --mode opt-in
source ~/.zshrc
codex
```

## 你会立刻感受到的变化

| 场景 | 传统 CLI | 升级后（RexCLI） |
|---|---|---|
| 会话恢复 | 常靠手工回忆 | 自动带上项目上下文 |
| 多 CLI 协作 | 切工具容易丢状态 | 同一 ContextDB 接力 |
| 网页操作 | 手动点点点 | `browser_*` 自动化 |
| 复用流程 | 经验散落聊天记录 | skills 可复用沉淀 |

## 快速示例（直接可跑）

```bash
codex
claude
gemini

scripts/ctx-agent.sh --agent codex-cli --prompt "继续上一阶段并执行下一步"
```

## 继续阅读

- [快速开始](getting-started.md)
- [官方案例库](case-library.md)
- [博客站点](https://cli.rexai.top/blog/zh/)
- [友情链接](friends.md)
- [项目地址（GitHub）](https://github.com/rexleimo/rex-cli)
- [更新日志](changelog.md)
- [CLI 工作流](use-cases.md)
- [架构](architecture.md)
- [ContextDB](contextdb.md)
