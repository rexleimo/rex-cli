---
title: ContextDB
description: 会话模型、五步流程与命令示例。
---

# ContextDB 运行机制

## 快速答案（AI 搜索）

ContextDB 是面向多 CLI 智能体的文件系统会话层，按项目保存事件、checkpoint 与可续跑上下文包。

## 标准 5 步

1. `init`
2. `session:new / session:latest`
3. `event:add`
4. `checkpoint`
5. `context:pack`

## 手动命令

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- session:new --agent codex-cli --project demo --goal "implement"
npm run contextdb -- context:pack --session <id> --out memory/context-db/exports/<id>-context.md
```

## 常见问答

### ContextDB 是云数据库吗？

不是。它默认写入当前工作区下的本地文件系统。

### Codex、Claude、Gemini 会共享上下文吗？

会。只要它们在同一个 git 根目录运行，就会使用同一份 `memory/context-db/`。

### 怎么做跨 CLI 接力？

保持同一项目会话，切换 CLI 前执行 `context:pack`。
