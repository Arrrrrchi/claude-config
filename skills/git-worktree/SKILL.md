---
name: git-worktree
description: >
  git worktree を作成して作業環境をセットアップする。
  ブランチ名を引数に渡すと、EnterWorktree でワークツリーを作成し、
  プロジェクト固有の setup-worktree スキルがあればその手順でセットアップを実行する。
argument-hint: "<branch-name>"
user-invocable: true
allowed-tools: EnterWorktree, ExitWorktree, Bash, Read, Glob
---

# git-worktree ワークフロー

`$ARGUMENTS` で渡されたブランチ名を使ってワークツリーを作成し、作業環境を整える。

## ステップ 1: メインリポジトリのパスを記録

現在の作業ディレクトリ（メインリポジトリのルート）を記録する。
この値はステップ 3 でファイルコピー元として使う。

```bash
MAIN_REPO=$(pwd)
```

## ステップ 2: プロジェクト固有セットアップの事前読み込み

**EnterWorktree を呼ぶ前に**、メインリポジトリのセットアップスキルを確認・読み込む。
CWD がワークツリーに切り替わるとスキル検索が効かなくなるため、事前に読む。

```bash
ls "${MAIN_REPO}/.claude/skills/setup-worktree/SKILL.md"
```

- ファイルが存在する場合: Read ツールでその内容を読み込み、手順を把握する
- ファイルが存在しない場合: ステップ 4 でデフォルトセットアップを実行する

## ステップ 3: EnterWorktree でワークツリーを作成

EnterWorktree ツールを呼び出す。`name` パラメータに `$ARGUMENTS` の値をそのまま渡す。

- 例: ユーザーが `/git-worktree feature/add-auth` と入力した場合、`name: "feature/add-auth"` で呼び出す
- EnterWorktree はセッションの作業ディレクトリをワークツリーに自動的に切り替える

## ステップ 4: セットアップの実行

### setup-worktree が存在する場合

ステップ 2 で読み込んだ手順に従ってセットアップを実行する。
手順内の `$MAIN_REPO` はステップ 1 で記録したパスに置き換える。

### setup-worktree が存在しない場合（デフォルト）

以下の汎用セットアップを実行する:

1. `.env` のコピー（元リポジトリに存在する場合）:
   ```bash
   cp "${MAIN_REPO}/.env" .env
   ```

2. パッケージマネージャを自動検出してインストール:
   ```bash
   # 以下の優先順で検出
   # pnpm-lock.yaml → pnpm install
   # yarn.lock → yarn install
   # package-lock.json → npm install
   # Gemfile.lock → bundle install
   # go.sum → go mod download
   ```

## ステップ 5: 完了報告

ワークツリーの作成とセットアップが完了したことをユーザーに報告する。以下の情報を含める:

- ワークツリーのパス（現在の作業ディレクトリ）
- ブランチ名
- 実行したセットアップ手順の概要
- 「作業が終わったら `ExitWorktree` で退出できます（`keep` で保持、`remove` で削除）」という案内
