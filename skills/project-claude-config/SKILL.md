---
name: project-claude-config
description: "Design the project-specific .claude layer on top of an already-installed global harness. The global ~/.claude already owns developer behavior, the Work Flow, the Review Matrix, and all reviewer/plan/debug agents — this skill does NOT regenerate any of those. It generates only the per-project delta: a thin project CLAUDE.md (@dependency-file + commands + stack-specific constraints + domain terms), path-scoped .claude/rules/*.md, .claude/settings.json formatter hooks + permissions, and (optionally) CI/CD and pre-commit configs. Use when setting up Claude Code for a specific project, creating or improving a project CLAUDE.md, configuring .claude/rules, adding formatter hooks, or aligning CI/pre-commit. Triggers: 'プロジェクトの .claude を整えて', 'このリポジトリ用の設定を作って', 'set up Claude Code for this project', 'create project CLAUDE.md', 'configure .claude/rules', 'プロジェクト固有のガードレール'."
---

# Project Claude Config

グローバルハーネスを前提に、**各プロジェクト固有の `.claude` 周辺だけ**を設計・生成する。

## 前提: グローバルハーネスが既に所有しているもの（再生成しない）

このスキルは `~/.claude`（グローバル）に共通ハーネスが導入済みであることを前提にする。
まず存在を確認し、**以下はグローバルが所有するので一切再生成しない**:

| 層 | 所有者（グローバル） | このスキルの扱い |
|---|---|---|
| 開発者の振る舞い・Core Principles・Prohibitions | `~/.claude/CLAUDE.md` | 再掲しない |
| Work Flow / Planning / Implementation 方針 | `~/.claude/CLAUDE.md` | 再掲しない |
| Review Matrix（どの差分でどのレビュアーを起動するか） | `~/.claude/CLAUDE.md` | 再掲しない |
| レビュアー / プランレビュアー / デバッガー agents | `~/.claude/agents/**` | **生成しない**（名前で参照のみ） |
| 危険コマンド・シークレット等の汎用ガード | `~/.claude/settings.json` + `hooks/block-dangerous.mjs` | プロジェクト側に**重複させない** |

グローバル `CLAUDE.md` が無い/別構成のときは、このスキルは前提を満たさない。ユーザーに知らせて中断するか、グローバル側の整備を先に促す。

## このスキルが生成するもの（プロジェクト層の delta）

| 成果物 | 中身 |
|---|---|
| プロジェクト `CLAUDE.md` | `@依存ファイル` + Commands 表 + スタック固有 Constraints + Domain Terms。**グローバルへの薄い delta のみ** |
| `.claude/rules/*.md` | path-scoped ルール（DB / test / UI / API 境界など）。「LLM が誤りやすい点」を実パスに紐付け |
| `.claude/settings.json` | プロジェクト固有フォーマッタ/リンタの `PostToolUse` hook + `permissions.allow`（汎用ガードは入れない） |
| CI/CD ワークフロー（任意・Tier 2/3） | 既存プロバイダに合わせて lint/test/typecheck |
| pre-commit 設定（任意・Tier 2/3） | staged ファイルへの lint/format |

→ 生成されるプロジェクト `CLAUDE.md` は「グローバルの振る舞いを再掲しない薄い delta」になるのが正解。レビュー使い分けを書きたくなっても、**Review Matrix は再掲せず**、必要なら「DB 層は `<glob>`、UI 層は `<glob>`」と**場所の写像だけ**を 1〜2 行で添える。

## ワークフロー

### Step 1: 前提確認
`~/.claude/CLAUDE.md` と `~/.claude/agents/**` の存在を確認。「振る舞い・agents・Review Matrix は既にグローバルにある。再生成しない」と自分に明示してから進む。

### Step 2: 情報収集
- 依存ファイルを読む: `package.json` / `composer.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` 等
- パッケージマネージャ・テストランナー・リンタ/フォーマッタ・型チェッカ・主要 FW を特定
- 既存のプロジェクト `.claude/`・`CLAUDE.md`・`AGENTS.md` があれば読み、慣習と「LLM が誤りやすい点」を拾う
- 導入済みスキル（`~/.claude/skills` とプロジェクト `.claude/skills`）の担当領域を把握し、ルールを重複生成しない

### Step 3: ギャップ分析 & Tier 選定
- `references/llm-pitfalls.md` と依存を突き合わせ、スタック固有の「LLM が誤りやすい点」を抽出
- 必要な path-scoped ルール（DB / test / CSS / API 境界）と hook 自動化候補（フォーマッタ/リンタ）を列挙
- **Tier** を選ぶ（やりすぎ/やらなさすぎを防ぐ）:

| Tier | 対象 | 生成範囲 |
|---|---|---|
| 1 最小 | 使い捨て・プロトタイプ | プロジェクト `CLAUDE.md` のみ |
| 2 標準（既定） | 通常プロジェクト・テストあり | + `.claude/rules` + `.claude/settings.json` + CI + pre-commit |
| 3 フル | 長期運用・複数貢献者 | Tier 2 と同じ（agents はグローバルなので追加しない）+ 必要なら docs 雛形 |

迷ったら **Tier 2**。「長期」「チーム」「プロダクト」なら Tier 3。明示的に最小化したいときだけ Tier 1。

### Step 4: 公式ドキュメント検証（Tier 2/3 必須）
訓練データは陳腐化している。**書く前に**ライブ取得して確定する:
- `WebFetch https://code.claude.com/docs/en/memory` — path-scoping の frontmatter キー名（`paths`）、@参照構文、CLAUDE.md の行制限、`.claude/rules/` の挙動
- `WebFetch https://code.claude.com/docs/en/hooks` — settings.json 構造、hook イベント型（`PostToolUse` 等）、matcher 構文、環境変数、timeout
- 取得失敗時は「訓練データに基づくため要検証」と警告し、`references/` テンプレートにフォールバック
- **バージョン固有制約は検証必須**: `llm-pitfalls.md` 由来のバージョン依存事項（Next.js 16 / Tailwind v4 / Zod v4 等）を書くなら、公式 migration/changelog を確認してから書く。未検証なら**書かない**（推測でスタック制約を断定しない）

### Step 4b: 内部事実の検証（必須）
Step 4 が外部仕様を検証するのに対し、ここでは**コードベース内部の事実**を照合する。生成物に書く具体値は推測せず、必ず実体に当てる:
- **パス・ファイル名・glob は実在確認してから書く** — `ls` / `find` / glob で確認。`app/api/auth` のような「ありそうな場所」を推測で書かない（実体が `app/auth` のことがある）。設定ファイル名も拡張子まで確認（`next.config.ts` ではなく `.mjs` 等）
- **ドメイン用語・計算式は実装から写す** — ユーザーの口頭説明や一般論ではなく、該当ソース（`lib/domain/` 等）を読んで定義・式・単位を写す。実装と説明が食い違うときは断定せずユーザーに確認する
- **スコープ glob は実使用を grep して導く** — 「概念的にここだろう」で paths を書かない。対象 API/シンボル（例: `cookies(` `headers(` `createClient` 等）を grep し、ヒットしたディレクトリを**漏れなく** paths に含める

### Step 5: プロジェクト層のみ生成
検証済み仕様と `references/` テンプレートを使って生成する:
- **`CLAUDE.md`** — `references/claude-md-template.md`（delta のみ。Workflow/Review 節は無い）
- **`.claude/rules/*.md`** — `references/path-scoped-examples/`（db/test/ui）と `references/rules-examples/`（linting/commit）を雛形に、実 glob へ置換。1 ファイル 1 関心・各 30 行以内。グローバルと重複しない範囲で
- **`.claude/settings.json`** — `references/settings-hooks-template.json`（`PostToolUse` フォーマッタ + `permissions.allow` のみ。汎用危険コマンドブロックは入れない）
- **CI / pre-commit**（Tier 2/3）— `references/ci-cd-templates.md` / `references/pre-commit-templates.md`。既存があれば**拡張**、無ければ生成。プロバイダは1つだけ。各層は**スコープが違う同じツール**を使う: CI = full lint/test/typecheck、pre-commit = staged ファイルへの lint/format、Claude hook = 編集ファイルへの formatter/linter。同じ lint/format ツールを共有しつつ、full test/typecheck は CI のみ（pre-commit や hook に入れない＝遅くて回避される）

### Step 5b: 自己レビュー（出力前の必須チェック）
出力前に生成物を自己点検し、1つでも NG なら直してから Step 6 へ進む:
- [ ] **すべての `.claude/rules/*.md` に `paths:` frontmatter があるか**（無いものは CLAUDE.md へ移すか paths を付ける）
- [ ] **書いた全 paths / 許可パス / 設定ファイル名が実在するか**（Step 4b の確認結果と一致）
- [ ] **ドメイン用語・計算式が実装と一致するか**
- [ ] **CLAUDE.md と rules に同一制約のフル重複がないか**（正典は1か所、もう一方はポインタ）

### Step 6: 出力と説明
- 各生成物の意図と、**グローバルハーネスとどう合成されるか**を説明
- 「ドラフトなので各プロジェクトの慣習に合わせ手直し必須」「反映には `/agents` 実行かセッション再起動が必要」と明記
- hooks/permissions を生成した場合は、ユーザーに「実装後 `@security-reviewer` でガード重複・permission 過剰・コマンド注入を確認する」と促す

## 設計原則
- **「Do NOT use Y」は「use X」より効く** — LLM のミスを防ぐのは禁止形
- **`@依存ファイル` で重複排除** — 依存ファイルから導ける内容は CLAUDE.md に書かない
- **グローバルへの delta だけ書く** — 振る舞い・フロー・Review Matrix・agents はグローバルが所有。再掲は純粋なコスト
- **すべての `.claude/rules/*.md` は `paths:` frontmatter で始める** — スコープが定まらない＝常時必要なら rule にせず CLAUDE.md に置く。db/test/ui 以外の rule を即興生成するときも frontmatter を省かない
- **各事実の正典は1か所** — CLAUDE.md = 常時ロードの最小ガードレール＋「詳細は `.claude/rules/X.md`」ポインタ、rules = 詳細。同じ制約を両方にフル記述しない
- **具体値は推測せず実体に当てる** — パス・ファイル名・glob・ドメイン式は Step 4b で実在/実装を確認してから書く
- **hooks は決定論的処理のみ** — フォーマッタ/リンタ。LLM 判定 hook は作らない
- **ライブ仕様が訓練データに優先** — Step 4 の取得が `references/` と矛盾したら取得結果が勝つ

## References
- `references/llm-pitfalls.md` — Step 3: スタック別「LLM が誤りやすい点」マップ
- `references/claude-md-template.md` — Step 5: プロジェクト CLAUDE.md（delta 版）の雛形
- `references/settings-hooks-template.json` — Step 5: フォーマッタ hook + permissions の雛形
- `references/path-scoped-examples/{db-patterns,test-conventions,ui-guidelines}.md` — Step 5: path-scoped ルール例
- `references/rules-examples/{linting,commit-conventions}.md` — Step 5: グローバルルール例
- `references/ci-cd-templates.md` — Step 5（Tier 2/3）: CI プロバイダ別テンプレート
- `references/pre-commit-templates.md` — Step 5（Tier 2/3）: Husky/Lefthook/pre-commit テンプレート

## When NOT to Use
- グローバルハーネス（`~/.claude/CLAUDE.md` + `agents/**`）が無い → 先にグローバル側を整備する
- レビュアー/デバッガー agent を作りたい → このスキルの対象外（グローバルが所有）
- 開発フロー・レビュー使い分けを変えたい → グローバル `~/.claude/CLAUDE.md` を編集する話
