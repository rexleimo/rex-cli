---
title: Overview
description: Upgrade your existing Codex/Claude/Gemini workflow with OpenClaw-style capabilities.
---

# RexCLI

> Keep your current CLI workflow. Add OpenClaw-style capabilities on top of `codex`, `claude`, and `gemini`.

[Start in 30 seconds (Primary CTA)](getting-started.md){ .md-button .md-button--primary data-rex-track="cta_click" data-rex-location="hero" data-rex-target="quick_start" }
[See Capability Cases](case-library.md){ .md-button data-rex-track="cta_click" data-rex-location="hero" data-rex-target="case_library" }

Project URL: <https://github.com/rexleimo/rex-cli>

`RexCLI` is a local-first workflow layer for four CLI agents:

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

It adds two practical capabilities without replacing native CLIs:

1. **Filesystem ContextDB** for resumable memory across sessions.
2. **Unified wrapper flow** so you still run `codex`, `claude`, or `gemini` directly.

## What I Can Do for Your Ops Funnel

### 1. Fix the landing conversion path (from views to clicks)

- You provide: current landing URL, one target audience, one primary action.
- I do: identify message drop-off, remove competing CTAs, rewrite hero/problem/proof/action blocks.
- You get: production-ready copy blocks, CTA placement map, event naming sheet.
- Measured by: primary CTA CTR and case-library entry rate become trackable and improvable.

### 2. Make capabilities understandable in 10 seconds

- You provide: your services, strongest cases, and hard boundaries.
- I do: turn generic claims into clear "problem -> action -> output" statements.
- You get: capability matrix, "who this is for" section, prioritized skill list.
- Measured by: less user confusion and better-qualified clicks from hero to next step.

### 3. Stabilize multi-CLI handoff with ContextDB

- You provide: current Codex/Claude/Gemini workflow and handoff pain points.
- I do: define checkpoint granularity, memory handoff rules, one-shot + interactive flow.
- You get: standard handoff commands, restart template, cross-session workflow baseline.
- Measured by: less repeated background explanation when changing tools or sessions.

### 4. Turn repeated team operations into reusable skills

- You provide: weekly recurring tasks and current manual process.
- I do: decompose steps, add guardrails, and encode into reusable skills.
- You get: skill docs, execution checklists, and verification gates before delivery.
- Measured by: faster onboarding and more consistent quality across team members.

## Skills Available Right Now

- `seo-geo-page-optimization`: improve landing structure, copy, and SEO/Geo conversion.
- `xhs-ops-methods`: operate Xiaohongshu growth workflow end to end.
- `brainstorming`: lock intent and design direction before implementation.
- `writing-plans`: turn multi-step requirements into executable plans.
- `dispatching-parallel-agents`: run independent domains in parallel safely.
- `systematic-debugging`: debug with structured evidence, not guesswork.
- `verification-before-completion`: verify before claiming delivery.

## Why this is an OpenClaw-style upgrade

You get the same category of outcomes:

- resumable cross-session memory (ContextDB)
- browser automation (Playwright MCP)
- multi-CLI handoff across Codex/Claude/Gemini/OpenCode
- reusable operational skills

This is not a new chat shell. It is an upgrade layer for tools you already use.

## Start in 30 seconds (use first, read later)

```bash
git clone https://github.com/rexleimo/rex-cli.git
cd rex-cli
scripts/setup-all.sh --components all --mode opt-in
source ~/.zshrc
codex
```

## Immediate before/after

| Scenario | Typical CLI | With RexCLI |
|---|---|---|
| Session resume | manual recall | automatic project context |
| Multi-CLI collaboration | state loss between tools | shared ContextDB handoff |
| Browser operations | manual clicking | `browser_*` automation |
| Process reuse | ad-hoc chat history | reusable skills |

## Quick Command Preview

```bash
# interactive mode (same commands, context injected automatically)
codex
claude
gemini

# one-shot mode (full 5-step pipeline)
scripts/ctx-agent.sh --agent codex-cli --prompt "Continue from latest checkpoint"
```

## Read Next

- [Quick Start](getting-started.md)
- [Case Library](case-library.md)
- [Blog Site](https://cli.rexai.top/blog/)
- [Friends](friends.md)
- [Project (GitHub)](https://github.com/rexleimo/rex-cli)
- [Changelog](changelog.md)
- [CLI Workflows](use-cases.md)
- [Architecture](architecture.md)
- [ContextDB runtime details](contextdb.md)
