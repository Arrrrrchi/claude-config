# Pre-commit Hook Templates

Read this file in Phase 4f when the chosen tier (Tier 2 or 3) requires
developer-side pre-commit hook setup.

## Table of Contents

- Purpose and Scope
- Tool Selection
- Husky + lint-staged (Node.js)
- Lefthook (any ecosystem)
- pre-commit (Python and polyglot)
- Parameter Substitution
- What Pre-commit Should and Should NOT Do

---

## Purpose and Scope

Pre-commit hooks enforce the same checks as CI, but on the developer's
machine before `git commit` lands. They prevent "red CI" by catching
problems a second earlier — which turns a 5-minute CI round-trip into a
5-second local check.

This is the **third layer** in a three-layer quality wall:

1. **Claude Code hooks** (settings.json) — run after agent file edits
2. **Git pre-commit hooks** — run before developer commits
3. **CI** (Phase 4e) — run on push / PR

All three must invoke the same lint and test commands. Divergence erodes
trust.

---

## Tool Selection

Pick one based on the ecosystem:

| Ecosystem | Recommended | Why |
|-----------|-------------|-----|
| Node.js / TypeScript | **Husky + lint-staged** | Installs via npm/pnpm; lint-staged runs on changed files only |
| Python | **pre-commit (framework)** | Python-native, widely used |
| Rust / Go / mixed / polyglot | **Lefthook** | Language-agnostic, single YAML config |

Never install more than one. If the project already has one, extend it
rather than replace it.

---

## Husky + lint-staged (Node.js)

### Install steps for the Phase 5 summary

```bash
{PKG_MGR} add -D husky lint-staged
{PKG_MGR} exec husky init
```

### `.husky/pre-commit`

```bash
{PKG_MGR} exec lint-staged
```

### `package.json` additions

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["{LINT_STAGED_CMD}"],
    "*.{css,json,md}": ["{FORMAT_STAGED_CMD}"]
  }
}
```

Notes:

- `{LINT_STAGED_CMD}` should be a command that accepts file arguments,
  e.g. `biome check --write --no-errors-on-unmatched` or
  `eslint --fix`
- Do NOT run the full test suite here — tests go in CI and (optionally)
  a `pre-push` hook
- Do NOT run `tsc --noEmit` here on large projects — it is slow; push it
  to CI

---

## Lefthook (any ecosystem)

### Install

```bash
# via binary or via the language package manager of your choice
```

### `lefthook.yml`

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "{LINT_GLOB}"
      run: {LINT_STAGED_CMD} {staged_files}
    format:
      glob: "*.{css,json,md,yml}"
      run: {FORMAT_STAGED_CMD} {staged_files}
```

Notes:

- Lefthook's `{staged_files}` placeholder is literal — keep it as-is
- Use `parallel: true` when the commands are independent
- Add a `pre-push` stage for heavier checks (tests, full typecheck)

---

## pre-commit (Python and polyglot)

### Install

```bash
pip install pre-commit
pre-commit install
```

### `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: {RUFF_VERSION}
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: {PRE_COMMIT_HOOKS_VERSION}
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict
```

Notes:

- Pin `{RUFF_VERSION}` and `{PRE_COMMIT_HOOKS_VERSION}` to the latest
  stable tags (fetch from the repo; never guess)
- Mypy is usually too slow for pre-commit; run in CI

---

## Parameter Substitution

| Placeholder | How to resolve |
|------------|----------------|
| `{PKG_MGR}` | `pnpm` / `npm` / `yarn` based on the lockfile |
| `{LINT_STAGED_CMD}` | Per-file lint command (e.g., `biome check --write`) |
| `{FORMAT_STAGED_CMD}` | Per-file format command |
| `{LINT_GLOB}` | Glob for files to lint (e.g., `*.{ts,tsx,js,jsx}`) |
| `{RUFF_VERSION}` | Latest ruff-pre-commit tag |
| `{PRE_COMMIT_HOOKS_VERSION}` | Latest pre-commit-hooks tag |

If a placeholder cannot be resolved from Phase 1 data, ask the user.

---

## What Pre-commit Should and Should NOT Do

### SHOULD

- Lint changed files (fast, targeted)
- Format changed files
- Reject unresolved merge conflicts / giant files / secrets

### SHOULD NOT

- Run the full test suite (too slow — push to CI or `pre-push`)
- Run type-checking on the whole repo (too slow)
- Generate code or modify files outside the staged set
- Install dependencies (should be done explicitly by the developer)

Pre-commit that takes longer than ~5 seconds will be bypassed with
`--no-verify` and become worthless. Keep it fast. Delegate heavy work
to CI.
