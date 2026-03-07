# AIOS Unified TUI Entry (scripts/aios.*) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `scripts/aios.sh` + `scripts/aios.ps1` as a single, cross-platform, full-screen TUI entrypoint that wraps existing lifecycle scripts (`setup-all/update-all/uninstall-all/verify-aios`).

**Architecture:** Implement a small state-machine TUI in Bash and PowerShell (no external deps). The TUI only builds/echoes command lines and delegates execution to existing scripts. Terminal state is always restored.

**Tech Stack:** Bash (`tput`, `stty`), PowerShell (`[Console]::ReadKey()`), existing `scripts/*.sh` and `scripts/*.ps1`.

---

### Task 1: Add Bash unified entry `scripts/aios.sh`

**Files:**
- Create: `scripts/aios.sh`

**Step 1: Add non-interactive wrapper mode**

- Support: `scripts/aios.sh setup|update|uninstall|doctor -- <args...>` as a thin pass-through to existing scripts.
- Support `-h/--help` to print usage.

**Step 2: Implement full-screen TUI**

- Main menu: Setup / Update / Uninstall / Doctor / Exit.
- Config pages for each action per approved design.
- Confirm page prints the exact command to run.
- Execution leaves TUI mode, runs the command, prints exit code, and returns to menu.

**Step 3: Terminal safety**

- Save/restore `stty` settings.
- Hide/show cursor via `tput civis/cnorm` best-effort.
- Trap `EXIT` and `INT` to restore state.

**Step 4: Local smoke**

Run:
- `bash -n scripts/aios.sh`
- `scripts/aios.sh --help`

Manual:
- Run `scripts/aios.sh` and navigate menus without executing (Back/Exit).

---

### Task 2: Add PowerShell unified entry `scripts/aios.ps1`

**Files:**
- Create: `scripts/aios.ps1`

**Step 1: Add non-interactive wrapper mode**

- Support: `.\scripts\aios.ps1 setup|update|uninstall|doctor -- <args...>` pass-through.
- Support `-Help` / `--help`.

**Step 2: Implement full-screen TUI**

- Same menu structure and defaults as Bash.
- Use `[Console]::ReadKey($true)` for key capture and redraw on each event.

**Step 3: Console safety**

- Save/restore `[Console]::CursorVisible` and clear screen on exit.
- Ensure exceptions restore cursor visibility.

**Step 4: Manual smoke (Windows)**

- Open PowerShell and run `.\scripts\aios.ps1`.
- Navigate menus; verify confirm screen prints correct command line.
- Run Doctor via the TUI and confirm it returns to menu.

---

### Task 3: Document the new entrypoint

**Files:**
- Modify: `README.md`
- Modify: `README-zh.md`

**Step 1: Add a short “interactive installer” note**

- macOS/Linux: `scripts/aios.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\aios.ps1`

**Step 2: Keep existing quick start intact**

- Do not remove or rewrite current `setup-all` instructions; just add the new alternative.

---

### Task 4: Verification

**Step 1: Repo verify (macOS/Linux)**

Run:
- `scripts/verify-aios.sh`

**Step 2: (Optional) Typecheck/build**

Already included in `verify-aios`, but if running manually:
- `cd mcp-server && npm run typecheck && npm run build`

---

### Task 5: Optional commit

If user requests a commit:

- `git add -A`
- `git commit -m "feat(onboarding): add unified TUI entry scripts"`

