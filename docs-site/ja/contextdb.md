---
title: ContextDB
description: 5 ステップと主要コマンド。
---

# ContextDB

## 実行 5 ステップ

1. `init`
2. `session:new / session:latest`
3. `event:add`
4. `checkpoint`
5. `context:pack`

## 例

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- context:pack --session <id> --out memory/context-db/exports/<id>-context.md
```
