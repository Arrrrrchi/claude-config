#!/usr/bin/env bash
# codex-run.sh のテスト。本物の codex は呼ばず、PATH 先頭に置いた偽 codex で挙動を検証する。
# 実行: bash ~/.claude/scripts/codex-run.test.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SUT="$HERE/codex-run.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

pass=0
fail=0
check() { # check <名前> <条件の終了コード>
  if [ "$2" -eq 0 ]; then pass=$((pass + 1)); echo "ok   - $1"; else fail=$((fail + 1)); echo "FAIL - $1"; fi
}

# --- 偽 codex: stdin と引数を記録し、FAKE_MODE に応じて振る舞う ---
FAKE_BIN="$WORK/bin"
mkdir -p "$FAKE_BIN"
cat >"$FAKE_BIN/codex" <<'FAKE'
#!/usr/bin/env bash
printf '%s\n' "$@" >"$FAKE_LOG_DIR/args"
cat >"$FAKE_LOG_DIR/stdin"
out=""
while [ $# -gt 0 ]; do
  if [ "$1" = "-o" ]; then out="$2"; shift; fi
  shift
done
case "${FAKE_MODE:-ok}" in
  ok) printf '## 判定\nPASS\n' >"$out" ;;
  empty) : >"$out" ;;
  fail) exit 7 ;;
esac
FAKE
chmod +x "$FAKE_BIN/codex"
export FAKE_LOG_DIR="$WORK"
BASE_PATH="/usr/bin:/bin"

# --- フィクスチャ: エージェント定義 ---
AGENT="$WORK/agent.md"
cat >"$AGENT" <<'MD'
---
name: dummy
---
## 手順

### レビュー指示

```
INSTRUCTION-LINE-1
INSTRUCTION-LINE-2
```

### 3. 結果を返す

```
NOT-INSTRUCTION
```
MD

NO_BLOCK="$WORK/noblock.md"
printf -- '---\nname: x\n---\n本文のみ\n' >"$NO_BLOCK"

# 危険に見える文字列を含む依頼本文（シェルに解釈されず、そのまま Codex へ渡ること）
REQ="$WORK/request.md"
{
  echo 'DROP TABLE users;'
  echo 'cat .env'
  echo 'CODEX_PROMPT'
  echo '$(touch '"$WORK"'/pwned)'
} >"$REQ"

run() { PATH="$FAKE_BIN:$BASE_PATH" bash "$SUT" "$@" >"$WORK/stdout" 2>"$WORK/stderr"; }

# T1: 正常系。指示ブロック抽出・依頼本文の連結・read-only 指定・出力のそのまま返却
FAKE_MODE=ok run plan "$AGENT" "$REQ"; rc=$?
check "T1 exit 0" $([ $rc -eq 0 ]; echo $?)
check "T1 stdout は Codex 出力そのまま" $(grep -q '^PASS$' "$WORK/stdout"; echo $?)
check "T1 指示ブロックを渡す" $(grep -q 'INSTRUCTION-LINE-2' "$WORK/stdin"; echo $?)
check "T1 指示ブロック以外のフェンスは渡さない" $(! grep -q 'NOT-INSTRUCTION' "$WORK/stdin"; echo $?)
check "T1 依頼本文を文字どおり渡す" $(grep -qF 'DROP TABLE users;' "$WORK/stdin" && grep -qF '$(touch' "$WORK/stdin"; echo $?)
check "T1 依頼本文はシェル実行されない" $([ ! -e "$WORK/pwned" ]; echo $?)
check "T1 read-only サンドボックス" $(grep -A1 -x -- '-s' "$WORK/args" | grep -qx 'read-only'; echo $?)
check "T1 stdin からプロンプトを読む" $(tail -n1 "$WORK/args" | grep -qx -- '-'; echo $?)

# review 種別: 未追跡ファイルもレビュー対象にする指示を含む
FAKE_MODE=ok run review "$AGENT"; rc=$?
check "review exit 0 (依頼ファイル省略可)" $([ $rc -eq 0 ]; echo $?)
check "review は未追跡ファイルを対象に含める" $(grep -q 'git ls-files --others --exclude-standard' "$WORK/stdin"; echo $?)

# T2: エージェント定義が無い / 指示ブロックが無い
FAKE_MODE=ok run review "$WORK/missing.md"; rc=$?
check "T2 定義ファイル不在で非0" $([ $rc -ne 0 ]; echo $?)
FAKE_MODE=ok run review "$NO_BLOCK"; rc=$?
check "T2 指示ブロック無しで非0" $([ $rc -ne 0 ]; echo $?)

# T3: debug で依頼ファイル無し
FAKE_MODE=ok run debug "$AGENT"; rc=$?
check "T3 debug 依頼無しは exit 3" $([ $rc -eq 3 ]; echo $?)

# T4: codex 実行ファイル不在
PATH="$BASE_PATH" bash "$SUT" review "$AGENT" >"$WORK/stdout" 2>"$WORK/stderr"; rc=$?
check "T4 codex 不在で exit 1" $([ $rc -eq 1 ]; echo $?)

# T4b: codex は成功したが出力が空
FAKE_MODE=empty run review "$AGENT"; rc=$?
check "T4b 出力空で exit 1" $([ $rc -eq 1 ]; echo $?)

# T4d: codex が非0終了
FAKE_MODE=fail run review "$AGENT"; rc=$?
check "T4d codex 失敗で exit 1" $([ $rc -eq 1 ]; echo $?)

# T4c: 指定した依頼ファイルが存在しない
FAKE_MODE=ok run plan "$AGENT" "$WORK/nope.md"; rc=$?
check "T4c 依頼ファイル不在で非0" $([ $rc -ne 0 ]; echo $?)

# T4e: 依頼ファイルが読み取れない（権限不足）
UNREADABLE="$WORK/unreadable.md"
echo 'secret ac' >"$UNREADABLE"
chmod 000 "$UNREADABLE"
FAKE_MODE=ok run plan "$AGENT" "$UNREADABLE"; rc=$?
check "T4e 依頼ファイル読み取り不可で非0" $([ $rc -ne 0 ]; echo $?)
chmod 600 "$UNREADABLE"

# 未知の種別
FAKE_MODE=ok run bogus "$AGENT"; rc=$?
check "未知の種別で非0" $([ $rc -ne 0 ]; echo $?)

echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
