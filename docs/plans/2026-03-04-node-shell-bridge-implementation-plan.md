# Node Shell Bridge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace duplicated shell decision logic with a single Node bridge while keeping `codex`/`claude`/`gemini` transparent usage unchanged.

**Architecture:** Introduce a Node bridge script that decides wrap vs passthrough and executes the target command with inherited stdio. Keep zsh/PowerShell wrappers as thin adapters that only normalize minimal environment and delegate to the Node bridge, with native-command fallback when Node/bridge is unavailable.

**Tech Stack:** Node.js ESM, zsh wrappers, PowerShell wrappers, existing `ctx-agent.mjs`.

---

### Task 1: Add Node bridge core

**Files:**
- Create: `scripts/contextdb-shell-bridge.mjs`

**Step 1: Write the bridge entry + arg parsing**

Implement CLI contract:
- `--agent <codex-cli|claude-code|gemini-cli>`
- `--command <codex|claude|gemini>`
- optional `--cwd <path>`
- passthrough args after `--`.

**Step 2: Implement wrap decision in Node**

Implement logic equivalent to current wrappers:
- blocked subcommands per command
- runner discovery (`CTXDB_RUNNER` then `ROOTPATH/scripts/ctx-agent.mjs`)
- git root workspace detection
- mode gate (`all|repo-only|opt-in|off` with defaults)
- project naming (`CTXDB_REPO_NAME` else workspace basename).

**Step 3: Execute command with inherited stdio**

Use `spawnSync` to run:
- passthrough native command when wrap not allowed
- `node ctx-agent.mjs --workspace ... --agent ... --project ... -- ...` when wrap allowed.

Propagate exit code and print clear stderr on bridge-level argument errors.

### Task 2: Convert zsh wrapper to thin bridge adapter

**Files:**
- Modify: `scripts/contextdb-shell.zsh`

**Step 1: Keep only minimal wrapper responsibilities**

Preserve:
- `CTXDB_LAST_WORKSPACE` cache
- `aios` helper function and aliases
- optional CODEX_HOME normalization helper.

Move all wrap/passthrough decision-making out.

**Step 2: Delegate to Node bridge**

For `codex`/`claude`/`gemini` functions:
- resolve bridge path (`CTXDB_SHELL_BRIDGE` or `$ROOTPATH/scripts/contextdb-shell-bridge.mjs`)
- if `node` and bridge exist -> call bridge
- otherwise fallback to `command <tool> "$@"`.

### Task 3: Convert PowerShell wrapper to thin bridge adapter

**Files:**
- Modify: `scripts/contextdb-shell.ps1`

**Step 1: Keep only minimal PowerShell responsibilities**

Preserve:
- `Normalize-CodexHome`
- `aios` helper function
- `CTXDB_LAST_WORKSPACE`.

Remove duplicated gating/routing functions.

**Step 2: Delegate to Node bridge**

For `codex`/`claude`/`gemini`:
- resolve bridge path (`CTXDB_SHELL_BRIDGE` or `$env:ROOTPATH/scripts/contextdb-shell-bridge.mjs`)
- call `node <bridge> --agent ... --command ... -- <args>`
- fallback to native command when missing.

### Task 4: Verify behavior and regression-safety

**Files:**
- Modify (if needed): `README.md`
- Modify (if needed): `README-zh.md`

**Step 1: Static verification**

Run:
- `node scripts/contextdb-shell-bridge.mjs --help`
- `node scripts/contextdb-shell-bridge.mjs --agent codex-cli --command codex -- --help`

Expected: no runtime errors; passthrough path works.

**Step 2: Existing repo validation**

Run:
- `scripts/doctor-contextdb-shell.sh`
- `scripts/verify-aios.sh` (best effort)

Expected: shell integration remains valid.

**Step 3: Windows verification instructions**

Because this environment may not have PowerShell:
- provide explicit commands for user-side Windows smoke test:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\update-contextdb-shell.ps1`
  - relaunch shell, test `codex --help`, `codex mcp list`, normal `codex`.

