---
title: CLI Workflows
description: Practical usage patterns for interactive and one-shot agent execution.
---

# CLI Workflows

## Mode A: Interactive Resume (default)

Use native commands. Wrapper auto-runs:

`init -> session:latest/new -> context:pack -> start CLI`

```bash
codex
claude
gemini
```

Best for daily development with automatic startup context.

## Mode B: One-shot Automation

Use when you want a full closed loop in one command:

`init -> session:latest/new -> event:add -> checkpoint -> context:pack`

```bash
scripts/ctx-agent.sh --agent claude-code --prompt "Summarize errors and propose next steps"
scripts/ctx-agent.sh --agent gemini-cli --prompt "Continue implementation from checkpoint"
scripts/ctx-agent.sh --agent codex-cli --prompt "Run tests and update task status"
```

## Cross-CLI Handoff

A common flow is:

1. Analyze with Claude.
2. Implement with Codex.
3. Verify/compare with Gemini.

Because all three read/write the same project ContextDB, handoff stays coherent.

## Pass-through Commands

Management commands are not wrapped and continue to work natively, for example:

```bash
codex mcp
claude doctor
gemini extensions
```
