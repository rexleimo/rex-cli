---
title: ContextDB
description: Session model, five runtime steps, and command references.
---

# ContextDB Runtime

## Canonical 5 Steps

At runtime, ContextDB can execute this sequence:

1. `init` - ensure DB folders and index exist.
2. `session:new` or `session:latest` - resolve session per `agent + project`.
3. `event:add` - store user/model/tool events.
4. `checkpoint` - write stage summary, status, and next actions.
5. `context:pack` - export markdown packet for next CLI call.

## Interactive vs One-shot

- Interactive mode usually runs steps `1, 2, 5` before opening CLI.
- One-shot mode runs all `1..5` in a single command.

## Manual Command Examples

```bash
cd mcp-server
npm run contextdb -- init
npm run contextdb -- session:new --agent codex-cli --project demo --goal "implement feature"
npm run contextdb -- event:add --session <id> --role user --kind prompt --text "start"
npm run contextdb -- checkpoint --session <id> --summary "phase done" --status running --next "write tests|implement"
npm run contextdb -- context:pack --session <id> --out memory/context-db/exports/<id>-context.md
```

## Session ID Format

Session ids use this style:

`<agent>-<YYYYMMDDTHHMMSS>-<random>`

This keeps chronology obvious and avoids collisions.
