# Failure Log

## 2026-07-04

### Project
`/Users/kenta/.claude`

### Task / Issue
Claude側にのみ存在した専門レビュアー4件を、Codex MCP委譲版として追加する。

### Failure
初回実装したCodex専門レビュアーに、レビュー対象を非信頼データとして扱う信頼境界がなく、Claude版のセキュリティレビュー指示から一部の具体的チェックも欠落していた。

### Impact
レビュー対象内の命令をCodexが指示として解釈する余地があり、依存関係・CI/CD・シークレットに関する検出能力もClaude版より低くなる可能性があった。

### Cause
既存のCodex委譲ラッパーの構造を優先して踏襲し、MCPへ渡す入力の信頼境界を設計時に明文化しなかった。また、Claude版の指示を意味的に要約したため、同期対象の具体例と制約を落とした。

### Detection
実装後の `codex-security-reviewer` と `codex-solid-reviewer` 相当の独立レビューで検出した。

### Prevention
MCP委譲ラッパーの構造検証に、非信頼入力、埋め込み命令の無視、読み取り範囲、秘密情報の非出力、生エラー非転記を必須条件として追加する。対になるClaude/Codex指示は要約せず、意味的同等性をレビュー項目に含める。

### Should Update
- [ ] Global AGENTS.md
- [ ] Project AGENTS.md
- [ ] Rules
- [x] Agent
- [x] Skill
- [ ] Hook
- [ ] CI
- [x] Tests

## 2026-10-17

### Project
`/Users/kenta/.claude`

### Task / Issue
Codex CLI v0.154.0 で `codex mcp-server` が削除されたため、Codex系7エージェントを `codex exec` 方式（`scripts/codex-run.sh`）へ移行する。

### Failure
1. 初回計画で、依頼本文（計画・症状・受け入れ条件）を heredoc でBashコマンド文字列へ直接埋め込む設計にした。
2. 改訂計画で、レビュー対象を `git diff HEAD` のみで決めており、未追跡の新規ファイルが対象から漏れていた。
3. 実装で、依頼ファイルの読み取り失敗を検出せず、不完全な依頼のまま成功終了していた。

### Impact
1. 本文中に区切り文字と同じ行があると、残りがシェル命令として実行され得た。また `block-dangerous.mjs` がコマンド全文を検査するため、`DROP TABLE` や `.env` を含む本文だけで起動前に拒否された（再レビュー時に実際に発生）。
2. 移行の中核である新規スクリプトがレビューされないまま PASS になる可能性があった。
3. 受け入れ条件が渡らない不完全なレビューを、正常な結果として返す可能性があった。

### Cause
外部ツールへの委譲ラッパーを設計する際に、「非信頼データをシェルのコード経路に流さない」「レビュー対象に未追跡ファイルを含める」「入力読み取りの失敗を伝播させる」を設計時のチェック項目として持っていなかった。2026-07-04 の記録と同じく、委譲ラッパーの入力の信頼境界が設計段階で明文化されていなかった。

### Detection
1・2は `codex exec` で実行した Codex 計画レビュー（3ラウンド）、3は Codex コードレビュー（2ラウンド）で検出した。

### Prevention
委譲ラッパーでは、可変の本文を必ずファイル経由で受け取り、stdin へ渡す（コマンド文字列に載せない）。レビュー対象の決定ルールに未追跡ファイルを含める。入力ファイルはパイプ前に読み切って失敗を検出し、読み取り不可のテストを追加する。

### Should Update
- [ ] Global CLAUDE.md
- [ ] Project CLAUDE.md
- [ ] Rules
- [x] Agent
- [ ] Skill
- [ ] Hook
- [ ] CI
- [x] Tests
