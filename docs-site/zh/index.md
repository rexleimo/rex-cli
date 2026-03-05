---
title: 概览
description: 把现有 Codex/Claude/Gemini/OpenCode CLI 升级为 OpenClaw 风格能力的快速入口。
---

# RexCLI 文档

> 不换客户端，不改习惯。把你正在用的 `codex` / `claude` / `gemini` / `opencode` 升级成 OpenClaw 风格能力体验。

[30 秒开始（主 CTA）](getting-started.md){ .md-button .md-button--primary data-rex-track="cta_click" data-rex-location="hero" data-rex-target="quick_start" }
[查看能力案例](case-library.md){ .md-button data-rex-track="cta_click" data-rex-location="hero" data-rex-target="case_library" }

项目地址：<https://github.com/rexleimo/rex-cli>

`RexCLI` 是面向四类 CLI 智能体的本地工作流层：

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

它不替代原生 CLI，而是补充三项能力：

1. 文件系统 ContextDB（可恢复会话记忆）
2. 统一工作流能力层（继续直接输入 `codex` / `claude` / `gemini` / `opencode`）
3. Privacy Guard（在读取配置/密钥类文件前进行脱敏）

## 重点升级：Privacy Guard（`~/.rexcil`）

这是本次版本升级的关键能力。

- 配置路径：`~/.rexcil/privacy-guard.json`
- 默认行为：随 shell 安装自动初始化并启用（敏感文件严格脱敏）
- 目标：避免敏感原文进入日志、提示词和跨会话记忆

读取配置类文件时必须走严格入口：

```bash
aios privacy read --file <path>
```

可选本地模型路径：

```bash
aios privacy ollama-on
# hybrid 模式 + ollama 模型 qwen3.5:4b
```

## 你会得到什么（推广文案）

不换客户端，不改习惯，把你正在用的 `codex` / `claude` / `gemini` / `opencode` 直接升级成“可交付的 AI 工作流”：

- **更快进入产出**：从“问一句”到“落一个可验收的结果”（计划、补丁、验证证据）。
- **更稳可复用**：把一次性的对话沉淀成可重复执行的 skills + checklist，降低交付波动。
- **更安全可分享**：读取配置、贴日志、跨会话恢复时默认脱敏，避免密钥进入提示词与记忆。

### 适合谁

- 想把 AI 变成“能持续交付”的个人开发者/团队
- 需要浏览器自动化与多 CLI 接力的工作流（研究 → 实现 → 验证）
- 对隐私敏感、必须避免配置/密钥泄露的场景

## 当前可复用 Skills（高频）

- `seo-geo-page-optimization`：用于着陆页结构、文案与 SEO/Geo 转化优化。
- `xhs-ops-methods`：用于小红书运营流程（选题、人设、排发互、复盘）。
- `brainstorming`：用于在改功能和改页面前收敛目标与设计方向。
- `writing-plans`：用于把多步骤需求拆成可执行计划。
- `dispatching-parallel-agents`：用于并行推进独立任务并提升交付速度。
- `systematic-debugging`：用于异常场景下的结构化排障。
- `verification-before-completion`：用于交付前强制验证，避免误判完成状态。

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
opencode

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
