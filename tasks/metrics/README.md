# Growth Metrics Runbook

Use this folder for daily conversion tracking between docs traffic and GitHub stars.

## Files

- `english-growth-daily.csv`: daily stars + traffic summary.
- `cta-experiments.csv`: slot-level CTA variant log and decisions.

## Daily Loop

1. Sync GitHub stars:

```bash
bash scripts/growth-daily-metrics.sh
```

2. Fill traffic and click fields for the same day:

```bash
bash scripts/growth-daily-report.sh --sessions 120 --clicks 8 --notes "GA4 daily export"
```

3. Log one CTA experiment row:

```bash
bash scripts/cta-experiment-log.sh \
  --page index.md \
  --slot home_hero \
  --variant A \
  --utm-content home_hero_star \
  --views 120 \
  --clicks 8 \
  --stars-before 20 \
  --stars-after 23 \
  --decision keep \
  --notes "day1 baseline"
```

4. Generate a daily keep/kill recommendation:

```bash
bash scripts/growth-daily-review.sh --date 2026-03-06 --page index.md --slot home_hero --variant A
```

## Conventions

- Keep one active variant per slot/day.
- Use `decision=running` while data is incomplete.
- Use `decision=keep` or `decision=kill` after at least one full-day sample.
- Avoid commas in notes (or they will be converted to semicolons for CSV safety).
