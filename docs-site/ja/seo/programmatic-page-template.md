# プログラマティックページテンプレート（機能ドキュメント SEO/GEO）

このテンプレートは**機能説明ページ**向けです。マーケティング記事専用ではありません。

## Frontmatter

```yaml
---
title: "<機能名 + 意図>"
description: "<対象ユーザー + 成果 + プラットフォーム>"
---
```

## 必須構成

1. `Quick Answer (AI Search)`
: AI 検索で引用される 1-2 文。
2. `利用シーン`
: 使うべき場面と制約。
3. `手順 / コマンド`
: そのまま実行できる例。
4. `FAQ`
: 問い合わせ形式の質問を 3 つ以上。
5. `関連リンク`
: Quick Start、Changelog、Troubleshooting。

## GEO チェック

- 固有名詞を統一（`Codex CLI`、`Claude Code`、`Gemini CLI`、`MCP`、`ContextDB`）
- 1 ページ 1 主要意図
- OS 差分がある場合は macOS/Linux と Windows の両方を提示
- 長文の前に短い回答を置く
- 振る舞い変更時は Changelog リンクを追加

## 内部リンク規則

各機能ページは次へリンク:
1. セットアップページ
2. トラブルシューティングページ
3. 変更履歴/リリースページ
