<!--
プロジェクト固有の commit 形式だけを書く。
`--no-verify` 禁止・承認なし commit 禁止などの汎用的な振る舞い規律は
グローバル ~/.claude/CLAUDE.md（Prohibitions）が所有するので、ここには再掲しない。
-->

# Commit Message Format

Follow Conventional Commits: `type(scope): description`

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

- Subject: <このプロジェクトの上限文字数 例: 100> characters max, no trailing period
- Do NOT use non-standard types like `update`, `change`, `improvement`
- <プロジェクト固有の scope 一覧（例: api, web, db, infra）>
- <Co-Authored-By・言語・本文フォーマットなどプロジェクト固有の方針>
