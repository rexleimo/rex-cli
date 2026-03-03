---
title: トラブルシューティング
description: よくある問題と対処。
---

# トラブルシューティング

## Browser MCP ツールが使えない

まず実行 (macOS / Linux):

```bash
scripts/doctor-browser-mcp.sh
```

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\doctor-browser-mcp.ps1
```

不足がある場合はインストーラーを実行:

```bash
scripts/install-browser-mcp.sh
```

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\install-browser-mcp.ps1
```

## `EXTRA_ARGS[@]: unbound variable`

古い `ctx-agent.sh` の既知問題です。`main` を最新化してください。

最新版では `ctx-agent-core.mjs` に実行ロジックを統合し、sh/mjs の実装差分を解消しています。

## `search` が空になる

`memory/context-db/index/context.db` が欠損/古い場合:

1. `cd mcp-server && npm run contextdb -- index:rebuild`
2. `search` / `timeline` / `event:get` を再実行

## ラップされない

- git リポジトリ内か確認
- `~/.zshrc` で wrapper が読み込まれているか確認
- `CTXDB_WRAP_MODE` と `.contextdb-enable` を確認
