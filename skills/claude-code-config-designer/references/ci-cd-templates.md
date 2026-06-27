# CI/CD Templates

Read this file in Phase 4e when the chosen tier (Tier 2 or 3) requires CI/CD
generation.

## Table of Contents

- Provider Selection
- Common Principles
- GitHub Actions Templates
- GitLab CI Template
- Parameter Substitution
- Integration with Hooks

---

## Provider Selection

Pick the CI provider in this order:

1. If the project already contains `.github/workflows/`, `.gitlab-ci.yml`,
   `.circleci/config.yml`, etc. — follow the existing provider. Do not
   introduce a new one.
2. If the repository is hosted on GitHub with no CI yet — default to
   **GitHub Actions**.
3. If the user explicitly names a provider — use it.
4. If the hosting is unknown — ask the user before generating anything.

Never write CI for multiple providers in one project.

---

## Common Principles

- **Reuse the same commands the developer runs** — the CI must execute
  `{LINT_CMD}` and `{TEST_CMD_ALL}` verbatim, not a CI-specific variant
- **One job per concern** — lint, test, build, and (optional) type-check
  are separate jobs so failures are diagnostic, not conflated
- **Cache package manager state** — npm/pnpm/yarn/pip/cargo caches cut
  CI time dramatically; always enable setup-action caching
- **Pin the runtime version from the project** — read the engine from
  `package.json#engines`, `.nvmrc`, `pyproject.toml`, `Cargo.toml`, etc.
  Never hardcode `node-version: 20` if the project specifies otherwise
- **Fail fast** — run the cheapest job first (lint), block test/build on
  it only if the project is small; otherwise run in parallel
- **No secrets unless needed** — do not scaffold AWS/GCP/Vercel deploy
  steps without explicit user intent

---

## GitHub Actions: Node.js / TypeScript

Use when the project has `package.json`. Substitute placeholders from the
table at the bottom of this file.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: {SETUP_NODE_ACTION}
        with:
          node-version-file: {NODE_VERSION_FILE}
          cache: {PKG_MGR}
      - run: {INSTALL_CMD}
      - run: {LINT_CMD}

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: {SETUP_NODE_ACTION}
        with:
          node-version-file: {NODE_VERSION_FILE}
          cache: {PKG_MGR}
      - run: {INSTALL_CMD}
      - run: {TEST_CMD_ALL}

  typecheck:
    name: Type check
    runs-on: ubuntu-latest
    if: {HAS_TYPECHECK}
    steps:
      - uses: actions/checkout@v4
      - uses: {SETUP_NODE_ACTION}
        with:
          node-version-file: {NODE_VERSION_FILE}
          cache: {PKG_MGR}
      - run: {INSTALL_CMD}
      - run: {TYPECHECK_CMD}
```

Notes:

- `{SETUP_NODE_ACTION}` is always `actions/setup-node@v4`
- `{PKG_MGR}` is `pnpm`, `npm`, or `yarn` — matches the lockfile in repo
- For pnpm, add a `pnpm/action-setup@v4` step before `setup-node@v4`
- Omit the `typecheck` job if the project has no `tsconfig.json` or no
  `tsc --noEmit` script

---

## GitHub Actions: Python

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version-file: {PY_VERSION_FILE}
          cache: pip
      - run: {INSTALL_CMD}
      - run: {LINT_CMD}

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version-file: {PY_VERSION_FILE}
          cache: pip
      - run: {INSTALL_CMD}
      - run: {TEST_CMD_ALL}
```

---

## GitHub Actions: Rust

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --check
      - run: cargo clippy -- -D warnings
      - run: cargo test --all-features
```

---

## GitLab CI

```yaml
stages: [lint, test]

default:
  image: {RUNTIME_IMAGE}
  cache:
    paths:
      - {CACHE_PATH}

lint:
  stage: lint
  script:
    - {INSTALL_CMD}
    - {LINT_CMD}

test:
  stage: test
  script:
    - {INSTALL_CMD}
    - {TEST_CMD_ALL}
```

---

## Parameter Substitution

Resolve these placeholders from Phase 1 data before writing the workflow.

| Placeholder | Source |
|------------|--------|
| `{LINT_CMD}` | Project's lint script (e.g., `pnpm lint`) |
| `{TEST_CMD_ALL}` | Project's test script (e.g., `pnpm test:run`) |
| `{TYPECHECK_CMD}` | e.g., `pnpm tsc --noEmit`; omit job if unused |
| `{HAS_TYPECHECK}` | `true` if `tsconfig.json` exists and a tsc script is defined |
| `{INSTALL_CMD}` | `pnpm install --frozen-lockfile`, `npm ci`, `yarn --frozen-lockfile`, `pip install -r requirements.txt`, etc. |
| `{PKG_MGR}` | `pnpm` / `npm` / `yarn` |
| `{NODE_VERSION_FILE}` | `.nvmrc` if present; otherwise `package.json` |
| `{PY_VERSION_FILE}` | `.python-version` or `pyproject.toml` |
| `{RUNTIME_IMAGE}` | Docker image matching the runtime (e.g., `node:20`) |
| `{CACHE_PATH}` | `node_modules/`, `.venv/`, `~/.cargo/`, etc. |

If any placeholder cannot be resolved, ask the user instead of guessing.

---

## Integration with Hooks and Pre-commit

CI is the **outer wall**; Claude Code hooks (settings.json) and pre-commit
hooks are the **inner walls**. They enforce the same commands at different
points in the workflow:

- Pre-commit hook runs `{LINT_CMD}` before `git commit` (developer-side)
- Claude Code hook runs `{LINT_CMD}` after Write/Edit (agent-side)
- CI runs `{LINT_CMD}` on push (repository-side)

All three layers must invoke the same commands. If they diverge, one layer
passes while another fails — which erodes trust in the checks.

In the Phase 5 summary, state explicitly: "lint and test are enforced at
three layers: pre-commit → Claude Code hook → CI".
