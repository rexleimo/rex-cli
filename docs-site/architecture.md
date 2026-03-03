---
title: Architecture
description: Runtime architecture for wrappers, runner, and filesystem ContextDB.
---

# Architecture

## Components

- `scripts/contextdb-shell.zsh`: shell wrappers for `codex/claude/gemini`
- `scripts/ctx-agent.sh`: unified runtime runner
- `mcp-server/src/contextdb/*`: ContextDB core and CLI commands

## Runtime Flow

```text
User command (codex/claude/gemini)
  -> zsh wrapper
  -> ctx-agent.sh
  -> contextdb CLI (init/session/pack/...)
  -> native CLI launch with packed context
```

## Storage Model

Each git project has its own local store:

```text
memory/context-db/
  manifest.json
  index/sessions.jsonl
  sessions/<session_id>/
  exports/<session_id>-context.md
```

## Isolation Controls

Set wrapper scope with `CTXDB_WRAP_MODE`:

- `all`: wrap in all git repos
- `repo-only`: only wrap in `ROOTPATH` repo
- `opt-in`: wrap only when marker exists (default marker: `.contextdb-enable`)
- `off`: disable wrapping

Use `opt-in` if you want strict project-by-project control.
