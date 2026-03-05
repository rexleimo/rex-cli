---
title: Overview
description: Upgrade your existing Codex/Claude/Gemini workflow with OpenClaw-style capabilities.
---

# RexCLI

> Keep your current CLI workflow. Add OpenClaw-style capabilities on top of `codex`, `claude`, and `gemini`.

[Start in 30 seconds](getting-started.md){ .md-button .md-button--primary }
[Project (GitHub)](https://github.com/rexleimo/rex-cli){ .md-button }
[Blog](https://cli.rexai.top/blog/){ .md-button }
[Friends](friends.md){ .md-button }

Project URL: <https://github.com/rexleimo/rex-cli>

`RexCLI` is a local-first workflow layer for four CLI agents:

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

It adds two practical capabilities without replacing native CLIs:

1. **Filesystem ContextDB** for resumable memory across sessions.
2. **Unified wrapper flow** so you still run `codex`, `claude`, or `gemini` directly.

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
- [Blog Site](https://cli.rexai.top/blog/)
- [Friends](friends.md)
- [Project (GitHub)](https://github.com/rexleimo/rex-cli)
- [Changelog](changelog.md)
- [CLI Workflows](use-cases.md)
- [Case Library](case-library.md)
- [Architecture](architecture.md)
- [ContextDB runtime details](contextdb.md)
