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
