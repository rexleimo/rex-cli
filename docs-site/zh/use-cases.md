---
title: CLI 工作流
description: 交互模式与 one-shot 模式的推荐用法。
---

# CLI 工作流

## 模式 A：交互式续跑

直接运行原命令，自动执行：

`init -> session:latest/new -> context:pack -> 启动 CLI`

```bash
codex
claude
gemini
```

## 模式 B：One-shot 自动闭环

一次命令跑完 5 步：

`init -> session:latest/new -> event:add -> checkpoint -> context:pack`

```bash
scripts/ctx-agent.sh --agent claude-code --prompt "总结当前阻塞并给下一步"
scripts/ctx-agent.sh --agent codex-cli --prompt "根据 checkpoint 继续实现"
```

## 跨 CLI 接力

常见链路：Claude 分析 -> Codex 实现 -> Gemini 复核。
