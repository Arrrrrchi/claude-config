---
name: nextjs-project-setup
description: >
  Next.js プロジェクトの新規セットアップを行う。
  create-next-app を使った初期化、Biome + Vitest の設定、
  ディレクトリ構造の整備、CLAUDE.md や Hooks などのコンテキストエンジニアリング環境を一括構築する。
argument-hint: "<project-name>"
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Next.js プロジェクトセットアップ

新規 Next.js プロジェクトを公式 CLI で作成し、開発環境とコンテキストエンジニアリング環境を一括セットアップする。

## 絶対禁止事項

以下に違反してはならない。違反した場合はセットアップを最初からやり直すこと。

- `npm init` / `yarn init` / `pnpm init` からの手動セットアップ禁止
- `create-next-app` を使わずに `next`, `react`, `react-dom` を個別インストールすることの禁止
- `create-next-app` の実行前に追加パッケージをインストールすることの禁止
- ESLint のインストール禁止（Biome で統一）
- Prettier のインストール禁止（Biome で統一）
- `~/.claude/settings.json` を直接編集することの禁止（Hooks 設定はユーザーに案内のみ）

---

## ステップ 1: ヒアリング

AskUserQuestion ツールを使って以下を確認する。引数 `$ARGUMENTS` でプロジェクト名が指定済みなら、そのまま使用する。

| 項目 | デフォルト |
|------|-----------|
| プロジェクト名 | `$ARGUMENTS` または必須入力 |
| デプロイ先 | Vercel |
| DB/ORM の有無と種類 | なし |
| 認証の有無と方式 | なし |
| CSS フレームワーク | Tailwind CSS |
| パッケージマネージャ | pnpm |

ユーザーの回答が曖昧な場合（例: 「新しいWebアプリを作りたい」）は、Next.js を使うかどうかの確認から始める。

---

## ステップ 2: create-next-app の実行

**【最重要ルール】必ず `create-next-app` を使うこと。手動セットアップは一切禁止。**

以下のコマンドを実行する（パッケージマネージャはヒアリング結果に応じて変更）:

```bash
pnpm create next-app@latest <project-name> \
  --typescript \
  --tailwind \
  --src-dir \
  --app \
  --no-eslint \
  --import-alias "@/*" \
  --use-pnpm
```

- Tailwind 不要の場合は `--tailwind` を外す
- pnpm 以外の場合は `--use-pnpm` を `--use-npm` / `--use-yarn` / `--use-bun` に変更
- **サンドボックス制約により pnpm/npm の実行が失敗する場合**: ユーザーに上記コマンドを手動実行してもらい、完了後に次のステップへ進む

コマンド完了後、生成されたディレクトリに `cd` する。

---

## ステップ 3: 追加パッケージのインストール

create-next-app が**完了した後にのみ**追加パッケージをインストールする。

### 必須パッケージ（常にインストール）

```bash
pnpm add -D @biomejs/biome vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### 任意パッケージ（ヒアリング結果に応じて）

| 条件 | コマンド |
|------|---------|
| バリデーション要 | `pnpm add zod` |
| Prisma | `pnpm add -D prisma && pnpm add @prisma/client && pnpm exec prisma init` |
| Drizzle | `pnpm add drizzle-orm && pnpm add -D drizzle-kit` |
| NextAuth | `pnpm add next-auth` |

**サンドボックス制約でインストールが失敗する場合**: ユーザーにコマンドを手動実行してもらう。

---

## ステップ 4: Biome の初期化と設定

```bash
pnpm exec biome init
```

生成された `biome.json` を以下の内容で上書きする:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

`package.json` の `scripts` に以下を追加:

```json
{
  "lint": "biome check .",
  "lint:fix": "biome check --fix .",
  "format": "biome format --write .",
  "format:check": "biome format ."
}
```

create-next-app が生成した ESLint 関連ファイル（`.eslintrc.json` 等）があれば削除する。

---

## ステップ 5: Vitest の設定

プロジェクトルートに `vitest.config.ts` を作成:

```typescript
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

`vitest.setup.ts` を作成:

```typescript
import "@testing-library/jest-dom/vitest";
```

`package.json` の `scripts` に以下を追加:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## ステップ 6: ディレクトリ構造の整備

`src/` 配下に以下のディレクトリを作成し、空ディレクトリには `.gitkeep` を配置する:

```
src/
├── components/
│   ├── ui/          (.gitkeep)
│   └── features/    (.gitkeep)
├── lib/
│   └── (env.ts は Zod がある場合のみ)
├── hooks/           (.gitkeep)
└── types/           (.gitkeep)
```

Zod をインストールした場合のみ `src/lib/env.ts` を作成:

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // 必要に応じてプロジェクト固有の環境変数を追加
});

export const env = envSchema.parse(process.env);
```

---

## ステップ 7: コンテキストエンジニアリング環境の構築

### 7-1. CLAUDE.md の生成

プロジェクトルートに `CLAUDE.md` を生成する。ヒアリング結果を反映し、以下の構成で記述する:

```markdown
@AGENTS.md

# <プロジェクト名>

<プロジェクトの1行説明>

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router, Turbopack) |
| 言語 | TypeScript (strict) |
| スタイリング | <CSS フレームワーク> |
| リンター/フォーマッター | Biome |
| テスト | Vitest (unit) |
| パッケージ管理 | <パッケージマネージャ> |
(DB/認証がある場合はここに追加)

## ディレクトリ構成

(実際に作成した構成を記載)

## コマンド一覧

(package.json の scripts を列挙)

## コーディング規約

### 全般
- TypeScript strict mode。`any` 禁止
- コンポーネントは関数コンポーネント + named export のみ（default export は `page.tsx` / `layout.tsx` のみ）
- コミットメッセージは Conventional Commits (`feat:`, `fix:`, `chore:` 等)

### React / Next.js
- Server Components をデフォルトとし、必要な場合のみ `"use client"`
- データフェッチは Server Component 内で行い、Client Component には props で渡す
- `next/image`, `next/link` を使用

### テスト
- ユニットテスト: `src/**/*.test.{ts,tsx}` または `tests/**/*.test.{ts,tsx}`
- テストファイル名: `*.test.ts` / `*.test.tsx`

## 開発フロー

- plan モードで開発計画を立てる
- `feat/<計画名>` でブランチを切る
- 実装前に `docs/plans/` に計画ドキュメントを作成する
- 計画承認後、実装に着手する

## 環境変数

`.env.example` 参照。
(ヒアリング結果に応じて主要変数を列挙)
```

### 7-2. AGENTS.md の生成

プロジェクトルートに `AGENTS.md` を生成する:

```markdown
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

### 7-3. Hooks スクリプトの生成

`.claude/hooks/` ディレクトリを作成し、以下の3ファイルを生成する。各ファイルに `chmod +x` を適用する。

#### `.claude/hooks/guard-dangerous-commands.sh`

```bash
#!/bin/bash
# ガードレール: 危険なコマンドをブロックする

# 本番デプロイをブロック
if echo "$CLAUDE_TOOL_INPUT" | grep -qiE '(vercel\s+--prod|vercel\s+deploy\s+--prod)'; then
  echo "BLOCKED: 本番デプロイは手動で行ってください。"
  exit 2
fi

# 破壊的コマンドをブロック
if echo "$CLAUDE_TOOL_INPUT" | grep -qiE '(rm\s+-rf\s+/|rm\s+-rf\s+\.|DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)'; then
  echo "BLOCKED: 破壊的コマンドが検出されました。"
  exit 2
fi

# .env の内容表示をブロック
if echo "$CLAUDE_TOOL_INPUT" | grep -qiE '(cat\s+\.env|less\s+\.env|head\s+\.env|tail\s+\.env)'; then
  echo "BLOCKED: 環境変数ファイルの直接表示は禁止です。"
  exit 2
fi

# git push --force をブロック
if echo "$CLAUDE_TOOL_INPUT" | grep -qiE 'git\s+push\s+.*--force'; then
  echo "BLOCKED: force push は禁止です。"
  exit 2
fi

exit 0
```

#### `.claude/hooks/auto-format.sh`

```bash
#!/bin/bash
# ファイル編集後に Biome で自動フォーマット

# 編集されたファイルパスを取得
FILE=$(echo "$CLAUDE_TOOL_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]+"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"//')

if [ -z "$FILE" ]; then
  exit 0
fi

# 対象拡張子のみ処理
if echo "$FILE" | grep -qE '\.(ts|tsx|js|jsx|json|css)$'; then
  pnpm exec biome check --fix "$FILE" 2>/dev/null || true
fi

exit 0
```

#### `.claude/hooks/auto-verify.sh`

```bash
#!/bin/bash
# タスク完了時に型チェック + lint + test を自動実行

CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$')
STAGED=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$CHANGED" ] && [ -z "$STAGED" ]; then
  exit 0
fi

echo "=== 自動検証開始 ==="
FAILED=0

echo "--- typecheck ---"
pnpm exec tsc --noEmit 2>&1
if [ $? -ne 0 ]; then FAILED=1; fi

echo "--- lint ---"
pnpm lint 2>&1
if [ $? -ne 0 ]; then FAILED=1; fi

echo "--- test ---"
pnpm test 2>&1
if [ $? -ne 0 ]; then FAILED=1; fi

echo "=== 自動検証完了 ==="

if [ $FAILED -ne 0 ]; then
  echo "FAIL: 検証に失敗しました。上記のエラーを修正してください。"
  exit 1
fi

echo "PASS: すべての検証に成功しました。"
exit 0
```

### 7-4. settings.json 用の Hooks 設定を表示

以下の JSON をユーザーに表示し、`~/.claude/settings.json` の `hooks` セクションに**手動で追加**するよう案内する。絶対に Claude から直接 settings.json を編集してはならない。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/guard-dangerous-commands.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/auto-format.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/auto-verify.sh"
          }
        ]
      }
    ]
  }
}
```

---

## ステップ 8: Git の初期化と初回コミット

create-next-app が既に `git init` を実行済みの場合はスキップ。

```bash
git add .
git commit -m "chore: initial project setup with Next.js + Biome + Vitest + Claude Code environment"
```

---

## ステップ 9: 完了レポート

セットアップ内容のサマリーを表示する。以下の項目を含める:

1. **プロジェクト情報**: 名前、使用した create-next-app のバージョン
2. **インストール済みパッケージ一覧**: dependencies / devDependencies を分けて表示
3. **生成されたファイル一覧**: ステップ 4〜7 で作成・変更したファイル
4. **settings.json への Hooks 追加リマインダー**: ステップ 7-4 の設定を追加するよう再度案内
5. **次のステップの提案**:
   - 「最初の機能を作るなら plan モードから始めましょう」
   - 「`/init-setup-worktree` で worktree スキルも生成できます」
