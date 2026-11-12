#!/usr/bin/env node
// グローバル Stop フック。返答の終わりに、この番（最後の利用者の発言の後）の返答の文に英語の文が混ざっていないかを調べる。
// 英語の文があれば decision:block で止め、日本語で書き直させる。LLM 判定はしない（文字を数えるだけ）。
// 調べない部分: コードブロック（```〜```）、インラインコード（`〜`）、URL、ファイルのパス。
// 英語の文とみなす行: 日本語の文字（ひらがな・カタカナ・漢字）が1文字も無く、英単語（2文字以上）が6語以上ある行。
// 書き直しの番（stop_hook_active が true）では止めない。止め続けて終われなくなるのを防ぐ。
import { readFileSync } from "node:fs"

const input = JSON.parse(readFileSync(0, "utf8"))
if (input?.stop_hook_active) process.exit(0)

const path = input?.transcript_path
if (!path) process.exit(0)

let entries
try {
  entries = readFileSync(path, "utf8").trim().split("\n").map((line) => {
    try { return JSON.parse(line) } catch { return null }
  }).filter(Boolean)
} catch {
  process.exit(0)
}

// 利用者の発言（ツールの結果やスキルの本文ではないもの）を探す
const isUserTurn = (e) => {
  if (e.type !== "user" || e.isMeta || e.isSidechain) return false
  const c = e.message?.content
  if (typeof c === "string") return true
  return Array.isArray(c) && c.some((b) => b.type === "text") && !c.some((b) => b.type === "tool_result")
}

let start = 0
for (let i = entries.length - 1; i >= 0; i--) {
  if (isUserTurn(entries[i])) { start = i + 1; break }
}

const texts = []
for (const e of entries.slice(start)) {
  if (e.type !== "assistant" || e.isSidechain) continue
  const c = e.message?.content
  if (!Array.isArray(c)) continue
  for (const b of c) if (b.type === "text" && b.text) texts.push(b.text)
}
if (texts.length === 0) process.exit(0)

const japanese = /[぀-ヿ㐀-鿿ｦ-ﾟ]/
const strip = (text) => text
  .replace(/```[\s\S]*?```/g, "\n")
  .replace(/`[^`\n]*`/g, " ")
  .replace(/https?:\/\/\S+/g, " ")
  .replace(/(?:~|\.{1,2})?\/[\w.\-/@]+/g, " ")

const englishLines = []
for (const line of strip(texts.join("\n")).split("\n")) {
  if (japanese.test(line)) continue
  const words = line.match(/[A-Za-z]{2,}/g) ?? []
  if (words.length >= 6) englishLines.push(line.trim())
}
if (englishLines.length === 0) process.exit(0)

const sample = englishLines.slice(0, 3).map((l) => `- ${l.slice(0, 120)}`).join("\n")
process.stdout.write(JSON.stringify({
  decision: "block",
  reason: `返答に英語の文が混ざっています。利用者への返答はすべて日本語で書く決まりです。次の英語の行を含む内容を、日本語で書き直して返答し直してください（コード・コマンド・識別子はそのままでかまいません）。\n${sample}`,
}))
process.exit(0)
