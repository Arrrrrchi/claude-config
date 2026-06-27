---
name: failure-log
description: AI が起こした実装ミス・見落とし・誤判断を構造化して記録し、再発防止策をどこ（rules/hooks/agents/skills/CI/tests）に昇格すべきか分類する汎用スキル。「失敗を記録」「record failure」「再発防止」でトリガー。記録フォーマットと昇格判断が責務。実際に agents/rules へ反映する作業は quality-learner スキルが担う。
---

# 失敗ログ（記録 + 昇格先判断）

AI が起こした失敗・見落とし・誤判断を構造化して記録し、**再発防止策をどこに昇格すべきか**を分類する。

## quality-learner との棲み分け

- **このスキル（failure-log）** = 失敗を**記録**し、昇格先を**判断**する（フォーマット＋分類）。
- **`quality-learner` スキル** = 判断した内容を実際に **agents/rules/checklist へ反映**する実行役。
- 流れ: 失敗が起きる → failure-log で記録・分類 → 再発したら quality-learner で各ファイルへ反映。

実際の失敗事例は**プロジェクト側に保存**する（例: リポジトリの `docs/` か agent-memory）。
グローバルにはフォーマットと昇格ルールのみを置く。

## フォーマット

```md
## YYYY-MM-DD

### Project
...

### Task / Issue
...

### Failure
何が起きたか。

### Impact
何に影響したか。

### Cause
なぜ起きたか。

### Detection
どうやって発見したか。

### Prevention
再発防止策。

### Should Update
- [ ] Global CLAUDE.md
- [ ] Project CLAUDE.md
- [ ] Rules
- [ ] Agent
- [ ] Skill
- [ ] Hook
- [ ] CI
- [ ] Tests
```

## 昇格ルール

失敗が一度だけなら、まず記録する。**同じ種類の失敗が再発したら**昇格する。

| 失敗の種類 | 昇格先 |
|---|---|
| 手順漏れ | skill |
| レビュー漏れ | agent / reviewer checklist |
| 危険操作 | hook / permission |
| テスト不足 | test checklist |
| ドメイン誤解 | project rules |
| 全プロジェクト共通の問題 | global CLAUDE.md |

昇格の実行は `quality-learner` スキルに渡す。
