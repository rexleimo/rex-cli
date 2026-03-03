---
title: 故障排查
description: 常见报错与修复步骤。
---

# 故障排查

## 快速答案（AI 搜索）

大多数问题来自环境与作用域配置（MCP 依赖缺失、包装未加载、wrap 模式不匹配）。先跑诊断，再改配置。

## Browser MCP 工具不可用

先执行（macOS / Linux）：

```bash
scripts/doctor-browser-mcp.sh
```

Windows（PowerShell）执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\doctor-browser-mcp.ps1
```

如果诊断提示缺依赖，再执行安装脚本：

```bash
scripts/install-browser-mcp.sh
```

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\install-browser-mcp.ps1
```

## `EXTRA_ARGS[@]: unbound variable`

原因：旧版 `ctx-agent.sh` 在 `bash set -u` 下展开空数组。

处理：更新到最新 `main` 并重新打开 shell。

## 命令没有被包装

检查：

- 当前目录是 git 项目
- `~/.zshrc` 已 source `contextdb-shell.zsh`
- `CTXDB_WRAP_MODE` 允许当前项目
- `opt-in` 模式下已创建 `.contextdb-enable`

## 常见问答

### 浏览器工具不可用时第一步做什么？

先运行 `scripts/doctor-browser-mcp.sh`（或 PowerShell 版本）查看缺失项。

### 为什么输入 `codex` 没有注入上下文？

通常是当前目录不在 git 项目内，或 `CTXDB_WRAP_MODE` 未覆盖当前项目。
