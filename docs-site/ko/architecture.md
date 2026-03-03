---
title: 아키텍처
description: wrapper, runner, ContextDB 구성.
---

# 아키텍처

- `scripts/contextdb-shell.zsh`: CLI 래퍼
- `scripts/ctx-agent.sh`: 통합 러너
- `mcp-server/src/contextdb/*`: ContextDB 구현

```text
사용자 명령 -> zsh wrapper -> ctx-agent.sh -> contextdb CLI -> 네이티브 CLI
```
