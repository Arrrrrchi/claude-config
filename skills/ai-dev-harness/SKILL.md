---
name: ai-dev-harness
description: Set up the deck-compliant Claude Code dev harness (main-thread TDD implementation + review/isolation sub-agents + path-scoped rules + deterministic hooks) in any project. Use when bootstrapping or upgrading a repo's .claude/ — creating agents (code-reviewer, security/db/cwv/solid reviewers, tester, debugger, codex-plan-reviewer), rules (review-workflow + path-scoped guidelines), a lean CLAUDE.md, and settings.json hooks. Triggers on "set up Claude Code for this project", "同じ開発環境を入れて", "ガードレールを作って", "bootstrap .claude".
---

# AI Dev Harness セットアップ

社内デッキ「Claude Code による AI 駆動開発 v2」準拠の `.claude/` 一式を任意プロジェクトに導入する。

## 設計の核（これを崩さない）

- **実装はメインスレッド**で TDD。実装専用エージェント（coder/implementer）は作らない。
- 調査は**内蔵 Explore**、計画は **plan mode**。planner/explorer エージェントは作らない。
- サブエージェントは「**隔離・並列・専門化**」のみ:
  - レビュー: `code-reviewer`（本命・fresh context・`memory: project`）＋ 専門レビュアー（security/db/cwv/solid）
  - 隔離: `tester`（テスト出力）/ `debugger`（ログ）
  - 計画レビュー: `codex-plan-reviewer`（任意・Codex MCP 前提）
- **レビュアーは `tools` から Write/Edit を外す**（編集を物理的に禁止）。
- `CLAUDE.md` は ≤50 行・LLM が誤りやすい点に集約。rules は always-on と path-scoped に分離。
- Hooks は**決定論的処理専用**（危険コマンドブロック・フォーマッタ）。LLM 判定 hook は作らない。

## 手順

### 1. 情報収集
- 依存ファイルを読む: `package.json` / `composer.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` 等。
- パッケージマネージャ・テストランナー・リンタ/フォーマッタ・型チェッカ・主要フレームワークを特定。
- 既存の `.claude/`・`CLAUDE.md`・`AGENTS.md` があれば読み、慣習と「LLM が誤りやすい点」を拾う。
- 導入済みスキル（`~/.claude/skills` とプロジェクト `.claude/skills`）を確認し、レビュアーの `skills:` に紐付けられるものを把握。

### 2. ギャップ分析（このプロジェクト向けに調整）
- path-scoped rules の glob をプロジェクト構成に合わせる（例: `src/**`, `app/**`, `**/migrations/**`, `**/*.test.*`）。`references/rules/path-scoped-examples/` を雛形に。
- 必須コマンド（test/lint/typecheck/build/dev）を実際のスクリプト名に置換。
- Codex MCP が無い環境では `codex-plan-reviewer` を省く（plan レビューは plan mode + ユーザー確認に縮退）か、別モデルに置換。

### 3. ファイル配置（ターゲットの `.claude/` と `CLAUDE.md` へドラフト生成）
- `references/agents/*.md` → `.claude/agents/`。frontmatter の `model` / `skills` / プレースホルダを調整。
- `references/rules/review-workflow.md` → `.claude/rules/`（always-on）。フローとレビュー表をスタックに合わせる。
- `references/rules/commit-conventions.md` / `linting.md` → 必要に応じて配置・編集。
- `references/CLAUDE.md.template` → ルートの `CLAUDE.md`（依存ファイルは `@package.json` 等で参照、再掲しない）。
- `references/settings.json.template` → `.claude/settings.json`。フォーマッタコマンド・対象拡張子を置換。

### 4. Git とメモリ設定
- `.gitignore` に追記: `/.claude/settings.local.json`、`/.claude/agent-memory-local/`。
- `.claude/`（agents/rules/skills/hooks/settings.json）は**コミットして共有**。`agent-memory/`（project スコープ）も追跡=チーム資産。
- 秘密情報・個人パスの混入を確認（API キーは env 参照に統一）。

### 5. 出力と説明
- 生成物の各ファイルが「なぜそうしたか」を簡潔に説明する。
- **「ドラフトなのでプロジェクトの慣習に合わせ必ず手直しすること」**と明記する。
- 反映には `/agents` 実行かセッション再起動が必要と伝える。

## 注意
- `references/` のテンプレートは特定スタック非依存。`<...>` プレースホルダ（コマンド名・glob・model）は必ず実値へ置換。
- 既存 `claude-code-config-designer`（設計ウィザード）とは別物。本スキルは**確定済みデッキ構成を配置**する。
