#!/usr/bin/env node
// グローバル PreToolUse(Bash) 決定論ガード。全プロジェクトで発火する。
// LLM 判定は一切しない（純粋な正規表現マッチ + カレントブランチ判定のみ）。明確に危険な操作を Block する。
//   Block: exit 2 + decision:block で停止する。
// 方針: git commit〜push〜PR 作成は承認不要。PR のマージはユーザーが最終判断するため Block する。
// 追加方針: main/master ブランチ上での git push / git commit は、コマンド文字列に
//   main/master が含まれない場合（bare `git push` 等）でも ask で確認する。
//   コマンド文字列マッチだけでは「今どのブランチにいるか」を判定できず、
//   bare push がガードを素通りする実例があったため。
// permissions.deny と一部重複するが、二重の安全網として許容する。
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"

const input = JSON.parse(readFileSync(0, "utf8"))
const cmd = input?.tool_input?.command ?? ""
const cwd = input?.cwd ?? process.cwd()

const block = (reason) => {
  process.stdout.write(JSON.stringify({ decision: "block", reason }))
  process.exit(2)
}

const ask = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  }))
  process.exit(0)
}

// --- Block: 明確に危険 ---
const blockRules = [
  [/rm\s+-[rRf]{2,}\s+[/~.*]/, "広範囲な rm -rf をブロック"],
  [/(mkfs|dd\s+if=\/dev\/|chmod\s+-R?\s+777)/, "破壊的なシステムコマンドをブロック"],
  [/(DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE)/i, "破壊的 SQL をブロック"],
  // .env / 秘密鍵は cat 等に限らず「あらゆるコマンド」で参照（読み取り）をブロックする。
  // 書き込み（>, >>, tee, cp 先など）も区別なく止まる点に注意。最も安全側に倒した設定。
  // .env.example / .env.sample / .env.template / .env.dist などの非機密テンプレートは除外。
  [/\.env(?!\.(?:example|sample|template|dist)(?:\b|$))(?:\.[\w-]+)?\b/, ".env への参照をブロック（あらゆるコマンドで読み取り禁止）"],
  [/[\w-]\.(?:pem|key)(?:\b|$)/, "秘密鍵らしきファイルへの参照をブロック（あらゆるコマンドで読み取り禁止）"],
  [/git\s+push.*\s(origin\s+)?(HEAD:)?(main|master)(\s|$)/, "main/master への直接 push を禁止。PR 経由で。"],
  [/git\s+reset\s+--hard/, "git reset --hard をブロック（変更が失われる）"],
  [/git\s+clean\s+-[a-z]*f[a-z]*d|git\s+clean\s+-[a-z]*d[a-z]*f/, "git clean -fd をブロック（未追跡ファイルが消える）"],
  [/gh\s+pr\s+merge(\s|$)/, "PR のマージをブロック（マージはユーザーが最終判断する）"],
]
for (const [re, reason] of blockRules) {
  if (re.test(cmd)) block(reason)
}
// force push は --force-with-lease のみ許可
if (/git\s+push.*--force(\s|$)/.test(cmd) && !/--force-with-lease/.test(cmd)) {
  block("Force push をブロック（--force-with-lease を使う）")
}

// --- Ask: カレントブランチが main/master 上での push / commit ---
// コマンド文字列に main/master が現れない場合（bare `git push` 等）を拾うための状態依存チェック。
if (/git\s+push(\s|$)/.test(cmd) || /git\s+commit(\s|$)/.test(cmd)) {
  try {
    const branch = execSync("git branch --show-current", { cwd, encoding: "utf8" }).trim()
    if (branch === "main" || branch === "master") {
      ask(`カレントブランチ "${branch}" 上での ${/git\s+push/.test(cmd) ? "push" : "commit"} です。意図した操作か確認してください。`)
    }
  } catch {
    // git 実行失敗（非 git ディレクトリ等）は安全側で素通し。block ルールが安全網として残る。
  }
}

// git commit〜push〜PR 作成は承認不要のため Warn は設けない。
process.exit(0)
