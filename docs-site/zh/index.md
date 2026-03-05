---
title: 概览
description: 把现有 Codex/Claude/Gemini CLI 升级为 OpenClaw 风格能力的快速入口。
---

# RexCLI 文档

> 不换客户端，不改习惯。把你正在用的 `codex` / `claude` / `gemini` 升级成 OpenClaw 风格能力体验。

[30 秒开始](getting-started.md){ .md-button .md-button--primary }
[项目地址（GitHub）](https://github.com/rexleimo/rex-cli){ .md-button }
[博客](https://cli.rexai.top/blog/zh/){ .md-button }
[友情链接](friends.md){ .md-button }

项目地址：<https://github.com/rexleimo/rex-cli>

`RexCLI` 是面向四类 CLI 智能体的本地工作流层：

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

它不替代原生 CLI，而是补充两项能力：

1. 文件系统 ContextDB（可恢复会话记忆）
2. 透明包装流程（继续直接输入 `codex` / `claude` / `gemini`）

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
- [博客站点](https://cli.rexai.top/blog/zh/)
- [友情链接](friends.md)
- [项目地址（GitHub）](https://github.com/rexleimo/rex-cli)
- [更新日志](changelog.md)
- [CLI 工作流](use-cases.md)
- [官方案例库](case-library.md)
- [架构](architecture.md)
- [ContextDB](contextdb.md)
