---
title: Quick Start
description: One setup flow for macOS, Linux, and Windows with OS tabs.
---

# Quick Start

This page combines macOS, Linux, and Windows setup into one flow. Use the OS tabs when commands differ.

## Quick Answer (AI Search)

`rex-ai-boot` lets you keep using `codex`, `claude`, and `gemini` directly while adding project-scoped ContextDB memory and unified browser MCP setup.

## Prerequisites

- Node.js 18+ and `npm`
- At least one CLI installed: `codex`, `claude`, or `gemini`
- A git repository where you want project-scoped ContextDB memory

## 1) Install Browser MCP

=== "macOS / Linux"

    ```bash
    scripts/install-browser-mcp.sh
    scripts/doctor-browser-mcp.sh
    ```

=== "Windows (PowerShell)"

    ```powershell
    powershell -ExecutionPolicy Bypass -File .\scripts\install-browser-mcp.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\doctor-browser-mcp.ps1
    ```

## 2) Build ContextDB CLI

```bash
cd mcp-server
npm install
npm run build
```

## 3) Enable command wrappers

=== "macOS / Linux (zsh)"

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

=== "Windows (PowerShell)"

    ```powershell
    powershell -ExecutionPolicy Bypass -File .\scripts\install-contextdb-shell.ps1
    . $PROFILE
    $env:CTXDB_WRAP_MODE = "opt-in"
    ```

## 4) Enable current project

=== "macOS / Linux"

    ```bash
    touch .contextdb-enable
    ```

=== "Windows (PowerShell)"

    ```powershell
    New-Item -ItemType File -Path .contextdb-enable -Force
    ```

## 5) Start working

```bash
cd /path/to/your/project
codex
# or
claude
# or
gemini
```

## 6) Verify data created

=== "macOS / Linux"

    ```bash
    ls memory/context-db
    ```

=== "Windows (PowerShell)"

    ```powershell
    Get-ChildItem memory/context-db
    ```

You should see `sessions/`, `index/`, and `exports/`.

## FAQ

### Does this replace native CLI clients?

No. You still run native commands. The wrapper only injects context and keeps compatibility.

### How do I avoid cross-project memory contamination?

Use `CTXDB_WRAP_MODE=opt-in` and create `.contextdb-enable` only in the projects you want.

### Which command should I run first if browser tools fail?

Run `doctor-browser-mcp` first (`scripts/doctor-browser-mcp.sh` or `doctor-browser-mcp.ps1`).
