<!--
プロジェクト CLAUDE.md テンプレート（グローバルハーネスへの delta のみ）。目標 ≤40 行。

前提: グローバル ~/.claude/CLAUDE.md が「開発者の振る舞い・Role・Core Principles・
Prohibitions・Work Flow・Planning・Implementation・Review Matrix」を既に所有している。
このファイルには **それらを再掲しない**。プロジェクト固有の delta だけを書く。

書くもの: 依存ファイル参照 / スタック固有の「LLM が誤りやすい制約」/ 実コマンド /
ドメイン用語 / 誤りやすいアーキ事実。
書かないもの: 開発フロー・レビュー使い分け・レビュアー定義・一般的ベストプラクティス。

剪定テスト: 「この行を消すと Claude がミスするか？ & その内容はグローバルに無いか？」
両方 Yes のときだけ残す。
-->

@<依存ファイル 例: package.json / composer.json / pyproject.toml>

## Architecture
<1〜2 行。詳細はコードに任せる。パスエイリアス等の "誤りやすい" 事実だけ>

## Constraints（LLM が誤りやすい点 — 否定形 + 代替案で書く）
- Do NOT use <Y>. 代わりに <X> を使う
- Do NOT use <禁止 API/パターン>
- <型安全・命名・境界などプロジェクト固有の必須制約>

## Commands
| 用途 | コマンド |
|------|---------|
| test | `<...>` |
| lint | `<...>` |
| typecheck | `<...>` |
| build | `<...>` |
| dev | `<...>` |

## Domain Terms
<推測で実装すると事故るドメイン用語・業務ルールの定義。無ければ節ごと省略>

## Environment
`.env.example` 参照。主要: <主要な環境変数>

<!--
開発フロー・レビュー使い分け・実装方針（メインスレッド TDD / 内蔵 Explore / plan mode）は
グローバル ~/.claude/CLAUDE.md と agents/** が所有するため、ここには書かない。
レビュー使い分けをこのプロジェクトの実パスへ写像したい場合のみ、1〜2 行で
「DB 層は <glob>、UI 層は <glob>」のように **場所だけ** を補い、Review Matrix 自体は再掲しない。
詳細な path-scoped ルールは .claude/rules/*.md に置く。
-->
