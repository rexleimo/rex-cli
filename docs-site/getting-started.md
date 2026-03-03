---
title: Quick Start
description: Install, enable wrappers, and run your first project-scoped session.
---

# Quick Start

## Prerequisites

- macOS/Linux shell with `zsh`
- `node` + `npm`
- One or more CLIs installed: `codex`, `claude`, `gemini`

## 1) Build ContextDB CLI

```bash
cd mcp-server
npm install
npm run build
```

## 2) Enable shell wrappers

Add this block to `~/.zshrc`:

```zsh
# >>> contextdb-shell >>>
export ROOTPATH="${ROOTPATH:-$HOME/cool.cnb/rex-ai-boot}"
export CTXDB_WRAP_MODE=opt-in
if [[ -f "$ROOTPATH/scripts/contextdb-shell.zsh" ]]; then
  source "$ROOTPATH/scripts/contextdb-shell.zsh"
fi
# <<< contextdb-shell <<<
```

Reload shell:

```bash
source ~/.zshrc
```

## 3) Enable current project

In each target project root:

```bash
touch .contextdb-enable
```

This prevents accidental cross-project wrapping.

## 4) Start working

```bash
cd /path/to/your/project
codex
# or
claude
# or
gemini
```

## 5) Verify data created

```bash
ls memory/context-db
```

You should see `sessions/`, `index/`, and `exports/`.
