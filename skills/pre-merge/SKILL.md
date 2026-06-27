---
name: pre-merge
description: マージ前のブランチ準備（developリベース＆スカッシュ＆push）を実行するスキル。「/pre-merge」「マージ前準備」「リベースしてスカッシュ」「PRマージ準備」でトリガー。
---

# Pre Merge

developブランチを最新にし、作業ブランチをリベース＆スカッシュして `--force-with-lease` でpushする。

## ワークフロー

### 引数

- `args` にブランチ名が渡された場合はそのブランチを対象にする
- 省略時は現在のブランチを対象にする（developの場合はエラー）

### 手順

1. **現在の状態を確認**
   - `git status` で未コミットの変更がないか確認
   - 未コミットの変更がある場合はユーザーに警告して中断

2. **developを最新にする**
   - ワークツリー判定: `git worktree list` で現在が worktree かどうかを確認する
   - **通常ワークスペースの場合**:
     ```bash
     git checkout develop
     git pull origin develop
     git checkout <branch-name>
     ```
   - **ワークツリーの場合** (`develop` が別ワークツリーでチェックアウト済みで `git checkout develop` できない):
     ```bash
     git fetch origin develop
     ```
     ローカルの `develop` を更新できないため、以降のリベース・スカッシュ判定では `origin/develop` を基準にする

3. **作業ブランチでリベース**
   - **通常ワークスペースの場合**:
     ```bash
     git rebase develop
     ```
   - **ワークツリーの場合**:
     ```bash
     git rebase origin/develop
     ```
   - コンフリクトが発生した場合は、ユーザーに通知して中断

4. **スカッシュ判定**
   - **通常ワークスペースの場合**: `git log develop..<branch-name> --oneline` でコミット数を確認
   - **ワークツリーの場合**: `git log origin/develop..<branch-name> --oneline` でコミット数を確認
   - **1コミットの場合**: スカッシュ不要、そのまま次のステップへ
   - **2コミット以上の場合**:
     1. 全コミットのメッセージと差分（`git diff --stat`）を確認し、スカッシュ用のコミットメッセージ案を作成する
     2. 作成したコミットメッセージ案を **テキスト出力でユーザーに提示** する（AskUserQuestionのoption内ではなく、通常のテキストとして表示する）
     3. AskUserQuestionで「このメッセージでスカッシュする」「メッセージを変更する」「スカッシュしない」の3択を提示する
     4. 「スカッシュする」の場合: `git reset --soft develop`（ワークツリーの場合は `git reset --soft origin/develop`）→ `git commit` で1コミットにまとめる
     5. 「メッセージを変更する」の場合: ユーザーの入力を待って反映する
     6. 「スカッシュしない」の場合: そのまま次のステップへ

5. **リモートにpush**
   ```bash
   git push --force-with-lease
   ```

6. **完了報告**
   - 実行結果のサマリーを表示

## 注意事項

- developブランチやmainブランチに対しては実行しない
- `--force` は使わない。必ず `--force-with-lease` を使う
- 各ステップでエラーが発生した場合は即座に中断してユーザーに報告する
- コミットメッセージにAI生成の署名（`Co-Authored-By: Claude` 等）は付けない
