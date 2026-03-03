---
title: トラブルシューティング
description: よくある問題と対処。
---

# トラブルシューティング

## `EXTRA_ARGS[@]: unbound variable`

古い `ctx-agent.sh` の既知問題です。`main` を最新化してください。

## ラップされない

- git リポジトリ内か確認
- `~/.zshrc` で wrapper が読み込まれているか確認
- `CTXDB_WRAP_MODE` と `.contextdb-enable` を確認
