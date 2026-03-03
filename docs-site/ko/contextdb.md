---
title: ContextDB
description: 5단계 흐름과 명령 예시.
---

# ContextDB

## 실행 5단계

1. `init`
2. `session:new / session:latest`
3. `event:add`
4. `checkpoint`
5. `context:pack`

## 예시

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- context:pack --session <id> --out memory/context-db/exports/<id>-context.md
```
