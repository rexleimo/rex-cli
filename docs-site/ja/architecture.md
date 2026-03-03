---
title: アーキテクチャ
description: wrapper / runner / ContextDB の構成。
---

# アーキテクチャ

- `scripts/contextdb-shell.zsh`: CLI ラッパー
- `scripts/ctx-agent.sh`: 実行ランナー
- `mcp-server/src/contextdb/*`: ContextDB 実装

```text
ユーザーコマンド -> zsh wrapper -> ctx-agent.sh -> contextdb CLI -> ネイティブ CLI
```
