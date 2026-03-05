---
title: 概要
description: 既存の Codex/Claude/Gemini ワークフローを OpenClaw スタイル能力で強化する入口。
---

# RexCLI ドキュメント

> 今の CLI 習慣はそのまま。`codex` / `claude` / `gemini` に OpenClaw スタイルの能力レイヤーを追加します。

[30秒で開始（Primary CTA）](getting-started.md){ .md-button .md-button--primary data-rex-track="cta_click" data-rex-location="hero" data-rex-target="quick_start" }
[能力ケースを見る](case-library.md){ .md-button data-rex-track="cta_click" data-rex-location="hero" data-rex-target="case_library" }

プロジェクト URL: <https://github.com/rexleimo/rex-cli>

`RexCLI` は次の CLI 向けローカルワークフローレイヤーです。

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

ネイティブ CLI を置き換えず、次の 2 つを追加します。

1. ファイルシステム ContextDB（セッション記憶）
2. 透過ラッパー（`codex` / `claude` / `gemini` をそのまま利用）

## 運用で何を支援できるか

### 1. LP の転換導線を明確化（見る -> 押す）

- あなたが提供: 現在の LP URL、対象ユーザー、主目的 1 つ（例: クイックスタート）。
- 私が実施: メッセージ断点の特定、CTA の整理、Hero/課題/証拠/行動ブロックの再設計。
- あなたが受け取るもの: 差し替え可能なコピー、CTA 配置案、計測イベント命名表。
- 評価指標: 主 CTA クリック率とケースページ流入率を可視化して改善可能にする。

### 2. 「何ができるか」を 10 秒で伝わる形にする

- あなたが提供: 提供可能なサービス、強い実績、対応しない範囲。
- 私が実施: 抽象的な訴求を「課題 -> 実行 -> 結果」に変換。
- あなたが受け取るもの: 能力マトリクス、対象ユーザー定義、skills 優先リスト。
- 評価指標: 訪問者が 10 秒以内に適合性を判断できる状態を作る。

### 3. ContextDB で複数 CLI 連携を安定化

- あなたが提供: Codex/Claude/Gemini の運用フローと引き継ぎの詰まり点。
- 私が実施: checkpoint 粒度、記憶引き継ぎルール、one-shot/interactive 導線を定義。
- あなたが受け取るもの: 標準引き継ぎコマンド、再開テンプレート、跨セッション運用基準。
- 評価指標: ツール切替時の背景再説明コストを削減。

### 4. 反復運用を再利用可能な skills に変換

- あなたが提供: 週次で繰り返すタスクと現行の手作業フロー。
- 私が実施: 手順分解、ガードレール設計、検証ポイント追加、skills 化。
- あなたが受け取るもの: skill ドキュメント、実行チェックリスト、完了前検証ゲート。
- 評価指標: オンボーディング短縮とチーム品質の安定化。

## 今すぐ使える Skills

- `seo-geo-page-optimization`: LP 構成・文案・SEO/Geo 転換を改善。
- `xhs-ops-methods`: 小紅書運用フローを一気通貫で実行。
- `brainstorming`: 実装前に意図と設計方向を明確化。
- `writing-plans`: 複数ステップ要件を実行計画へ分解。
- `dispatching-parallel-agents`: 独立ドメインを並列実行。
- `systematic-debugging`: 推測ではなく証拠ベースで障害対応。
- `verification-before-completion`: 完了宣言前に必ず検証。

## 30 秒で開始（先に使う）

```bash
git clone https://github.com/rexleimo/rex-cli.git
cd rex-cli
scripts/setup-all.sh --components all --mode opt-in
source ~/.zshrc
codex
```

## すぐに試す

```bash
codex
claude
gemini
```

## 次に読む

- [クイックスタート](getting-started.md)
- [公式ケースライブラリ](case-library.md)
- [ブログサイト](https://cli.rexai.top/blog/ja/)
- [リンク集](friends.md)
- [プロジェクト（GitHub）](https://github.com/rexleimo/rex-cli)
- [変更履歴](changelog.md)
- [CLI ワークフロー](use-cases.md)
- [アーキテクチャ](architecture.md)
- [ContextDB](contextdb.md)
