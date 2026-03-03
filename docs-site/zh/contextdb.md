---
title: ContextDB
description: 会话模型、五步流程与命令示例。
---

# ContextDB 运行机制

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
