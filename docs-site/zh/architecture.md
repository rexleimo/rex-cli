---
title: 架构
description: wrapper、runner 与 ContextDB 的运行关系。
---

# 架构

## 组件

- `scripts/contextdb-shell.zsh`：接管 `codex/claude/gemini`
- `scripts/ctx-agent.sh`：统一运行器
- `mcp-server/src/contextdb/*`：ContextDB 核心与 CLI

## 运行链路

```text
用户命令
  -> zsh wrapper
  -> ctx-agent.sh
  -> contextdb CLI
  -> 启动原生 CLI（注入 context）
```

## 作用域控制

- `all`：所有 git 项目启用
- `repo-only`：仅 `ROOTPATH` 项目启用
- `opt-in`：仅含 `.contextdb-enable` 的项目启用
- `off`：关闭包装
