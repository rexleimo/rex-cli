# Daily Growth Reporting and CTA Log Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make daily stars/traffic reporting and CTA experiment logging fast, repeatable, and checkpoint-friendly.

**Architecture:** Add two idempotent Bash helpers under `scripts/` that upsert rows in existing CSV trackers (`tasks/metrics/english-growth-daily.csv` and `tasks/metrics/cta-experiments.csv`). Document the runbook in `tasks/metrics/README.md` and verify by running scripts for today.

**Tech Stack:** Bash, awk, csv files in `tasks/metrics`.

---

### Task 1: Daily traffic updater helper

**Files:**
- Create: `scripts/growth-daily-report.sh`
- Modify: `tasks/metrics/english-growth-daily.csv` (via script execution)

**Step 1: Write script behavior**
- Accept `--date`, `--sessions`, `--clicks`, `--notes`.
- Default date to today.
- Upsert row in `english-growth-daily.csv` by date.
- Preserve existing star count and sanitize commas in notes.

**Step 2: Verify command**
Run: `bash scripts/growth-daily-report.sh --date 2026-03-06 --sessions 0 --clicks 0 --notes "baseline update"`
Expected: row updated/created for date with manual fields filled.

### Task 2: CTA experiment logger helper

**Files:**
- Create: `scripts/cta-experiment-log.sh`
- Modify: `tasks/metrics/cta-experiments.csv` (via script execution)

**Step 1: Write script behavior**
- Accept `--date`, `--page`, `--slot`, `--variant`, `--utm-content`, `--views`, `--clicks`, `--stars-before`, `--stars-after`, `--decision`, `--notes`.
- Upsert by `date+page+slot+variant`.
- Auto-compute `ctr=clicks/views` when views > 0.

**Step 2: Verify command**
Run a baseline row update for today and confirm CSV row values.

### Task 3: Runbook + verification

**Files:**
- Create: `tasks/metrics/README.md`

**Step 1: Add routine docs**
- Document daily loop and script usage.

**Step 2: Verify outputs**
Run:
- `bash scripts/growth-daily-metrics.sh`
- `bash scripts/growth-daily-report.sh ...`
- `bash scripts/cta-experiment-log.sh ...`
- `tail -n 5 tasks/metrics/english-growth-daily.csv`
- `tail -n 5 tasks/metrics/cta-experiments.csv`

Expected: updated rows and usable daily workflow.
