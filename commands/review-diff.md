---
description: 現在の diff を汎用レビュー（重大な不具合と要件不一致に集中）
---

現在の作業差分を汎用的にレビューしてください。

- `@codex-code-reviewer` を起動し、`git diff` / `git diff --cached` を対象に精査させる。Codex（MCP）が利用不可の場合は `@code-reviewer` にフォールバックする。
- 重大な不具合・要件/受け入れ条件との不一致・既存挙動の破壊に集中する。
- 差分が認証/DB/パフォーマンス等に触れる場合は、該当するCodex専門レビュアー（`@codex-security-reviewer` / `@codex-db-reviewer` / `@codex-cwv-reviewer` / `@codex-solid-reviewer`）の追加起動を提案する。Codex（MCP）が利用不可の場合は対応するClaude自力版にフォールバックする。
- 出力は統一フォーマット（判定 / ブロッキング issue / 指摘 / 再レビュー要否）。修正はメインスレッドで行う。

$ARGUMENTS
