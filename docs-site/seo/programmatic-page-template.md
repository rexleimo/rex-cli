# Programmatic Page Template (Feature Output SEO/GEO)

Use this template for **feature documentation pages**, not marketing-only posts.

## Frontmatter

```yaml
---
title: "<feature + intent title>"
description: "<who + outcome + platform>"
---
```

## Required Structure

1. `Quick Answer (AI Search)`
: 1-2 sentences that can be quoted directly by AI search.
2. `When to use`
: explicit scenarios and constraints.
3. `Steps / Commands`
: copy-paste runnable examples.
4. `FAQ`
: at least 3 query-style questions.
5. `Related links`
: Quick Start, Changelog, Troubleshooting.

## GEO Checklist

- Stable entity naming (`Codex CLI`, `Claude Code`, `Gemini CLI`, `MCP`, `ContextDB`)
- One page = one dominant task intent
- Include command snippets for desktop and Windows when behavior differs
- Keep answers concise before long explanations
- Add changelog reference when behavior/version changed

## Internal Linking Rule

Each feature page links to:
1. one setup page
2. one troubleshooting page
3. one changelog/release entry
