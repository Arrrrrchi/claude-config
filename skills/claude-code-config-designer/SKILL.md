---
name: claude-code-config-designer
description: "Design and generate optimal Claude Code configuration files for any project. Takes a dependency file (package.json, composer.json, pyproject.toml, Cargo.toml, etc.) and list of installed Claude Code skills, then produces CLAUDE.md, .claude/rules/*.md rule files, and .claude/settings.json hooks config. Use when a user wants to set up Claude Code for a project, create or improve CLAUDE.md, configure .claude/rules, set up hooks in settings.json, optimize Claude Code behavior for a specific tech stack, or identify gaps between their installed skills and their project needs."
---

# Claude Code Config Designer

## Overview

Analyzes a project's dependency file and installed Claude Code skills to design CLAUDE.md, scoped rule files, and hooks config — verifying all output against live official documentation before generating files.

## Workflow

Config generation follows five sequential phases:

1. **Information Gathering** — Collect project context
2. **Gap Analysis** — Identify what rules are needed
3. **Official Docs Verification** — Fetch live specs (CRITICAL — never skip)
4. **File Design and Generation** — Create all config files (including optional multi-agent TDD setup)
5. **Output and Explanation** — Deliver files with a summary

---

## Phase 1: Information Gathering

Collect the following (extract from conversation if already present):

- **Dependency file content** — package.json, composer.json, pyproject.toml, Cargo.toml, or equivalent
- **Installed or planned Claude Code skills** — list skill names, or "none"
- **Project type** — web app, CLI tool, library, monorepo, API backend, etc.
- **Existing conventions** — formatter, linter, commit format, or architecture rules the team already follows
- **Agent architecture preference** — ask: "Do you want a multi-agent TDD workflow (planner → coder → reviewer) set up in `.claude/agents/` for long-term maintainability?" Default recommendation: yes for projects meeting the criteria in `references/tdd-agents.md`, no for throwaway scripts or prototypes

If the user provides a skills list, read each skill's SKILL.md to understand its coverage areas. Note what each skill already handles so rules are not duplicated.

---

## Phase 2: Gap Analysis

Read `references/llm-pitfalls.md` and cross-reference the project's dependencies against it.

For each installed skill, record its coverage scope. Then identify gaps across these categories:

- **LLM-prone tech mistakes** — tools the project uses that LLMs commonly replace with alternatives (e.g., project uses Biome but LLM suggests ESLint)
- **Version-specific breaking changes** — major version upgrades with incompatible APIs (e.g., Tailwind v4, Zod v4, Next.js 15)
- **Scope design** — which rules should be global vs. path-scoped (DB-only, test-only, CSS-only)
- **Hooks automation candidates** — linting, formatting, type-checking — anything that must run regardless of LLM judgment
- **ORM/DB patterns** — schema migration flows, N+1 risks, transaction patterns
- **Test strategy** — framework usage, file placement, selector priority
- **Architecture** — directory structure, module boundaries, Server/Client Component split (if applicable)
- **Commit conventions** — commitlint format, scope rules
- **Dependency health** — unmaintained packages (no updates for 2+ years, deprecated on registry, moved to a different distribution channel), packages with known security vulnerabilities. Run `npm audit` / `composer audit` or check registry metadata to identify stale or abandoned dependencies
- **OSS license compliance** — run `composer licenses` and/or `npx license-checker --summary` to inventory all dependency licenses. Flag any GPL/AGPL/SSPL packages that would impose copyleft obligations on a commercial project. Note LGPL packages (safe if used as-is, risky if modified). Identify Apache-2.0 and CC-BY-4.0 packages that require attribution notices
- **Agent architecture need** — decide whether the project warrants a planner/coder/reviewer TDD setup. Apply the decision criteria in `references/tdd-agents.md`. Record the decision: generate agents, or skip

### Tier Selection

After listing gaps, select an output **Tier** that matches the project's scale and lifespan. The tier decides which Phase 4 sub-phases run. Do not over-equip a throwaway script; do not under-equip a long-running product.

| Tier | When to pick | Phase 4 sub-phases that run |
|------|------------|----------------------------|
| **Tier 1 — Minimal** | Throwaway script, prototype, < 5 source files, no tests planned | 4a CLAUDE.md only |
| **Tier 2 — Standard** | Normal project, tests exist or planned, 1–3 contributors | 4a CLAUDE.md + 4b rules + 4c hooks + 4e CI/CD + 4f pre-commit |
| **Tier 3 — Full** | Long-running product, multi-contributor, sustained feature growth | All of Tier 2 + 4d TDD agents + 4g docs scaffolding |

License / Dependency Health (see "Dependency Health & License Compliance" in Phase 4) runs **conditionally across all tiers** — whenever Phase 2 detects stale packages, vulnerabilities, or copyleft-license risks. It is not tied to a tier.

Rules of thumb:

- Defaults to **Tier 2** when unsure — it is the cheapest-to-maintain baseline for most projects
- Upgrade to **Tier 3** if the user said "long-term", "team", "product", or the project already has `docs/` conventions
- Downgrade to **Tier 1** only if the user explicitly wants a minimal setup or the code is clearly throwaway
- The user can always opt into a higher tier later; prefer honest scoping over speculative additions

Record the chosen tier in the gap list and carry it into Phase 4.

Produce a gap list before proceeding. This list drives Phases 4 and 5.

---

## Phase 3: Official Docs Verification (CRITICAL for Tier 2/3)

Before writing any config file, fetch the live official documentation. Training data contains stale or incorrect information about Claude Code specifications. Fetching live docs prevents writing rules with wrong frontmatter keys, outdated hook syntax, or deprecated patterns.

**Tier 1 exception**: Tier 1 generates only CLAUDE.md and does not touch `.claude/rules/` frontmatter or `settings.json` hooks. For Tier 1, Phase 3 is **optional** — skip 3a/3b unless the user explicitly wants spec verification. Still run 3c if the project pins a major version of a fast-moving dependency. For Tier 2 and Tier 3, Phase 3 is mandatory.

### 3a. Fetch Claude Code memory and rules spec

```
WebFetch https://docs.claude.com/en/docs/claude-code/memory
```

Extract and record:
- Exact frontmatter key name for path scoping (verify: is it `paths:` or `globs:` or another key?)
- How global rules work (no frontmatter vs. some flag)
- @-reference syntax for importing files
- Line limits for CLAUDE.md
- .claude/rules/ directory behavior

**⚠️ CRITICAL — path scoping is unverified in this skill's templates.**
The `paths:` frontmatter key shown in `references/output-spec.md` and in the Phase 4b template is a **placeholder guess**. Do NOT emit scoped rule files with any frontmatter until you have confirmed from the live doc:

1. Whether `.claude/rules/*.md` supports per-file path scoping at all
2. The exact frontmatter key name if it does (`paths`, `globs`, `glob`, `applies_to`, etc.)
3. The expected value shape (array of strings? single string? pattern syntax?)

**Fallback rule**: If the live doc does not document a path-scoping mechanism for `.claude/rules/*.md`, emit **all** generated rule files as global (no frontmatter) and state this limitation explicitly in the Phase 5 output so the user knows why scoping was collapsed.

### 3b. Fetch Claude Code hooks spec

```
WebFetch https://docs.claude.com/en/docs/claude-code/hooks
```

Extract and record:
- settings.json structure
- Available hook event types (PostToolUse, PreToolUse, Stop, Notification, etc.)
- Matcher pattern syntax for tool names
- Command format and available environment variables
- Timeout behavior

### 3c. Fetch version-specific docs for major dependencies (if needed)

For any dependency with a major version that may have breaking changes (Tailwind v4, Zod v4, Next.js 15, Pydantic v2, etc.), fetch the official migration guide or changelog. Do not rely on training data for version-specific API patterns.

If WebFetch fails (network unavailable), warn the user explicitly:

> "Unable to fetch official documentation. Output is based on training data which may be stale. Verify frontmatter key names and hook syntax against the live docs at docs.claude.com/en/docs/claude-code before applying."

Then fall back to `references/output-spec.md` templates as a best-effort starting point.

---

## Phase 4: File Design and Generation

Use the gap list from Phase 2 and the verified specs from Phase 3. Read `references/output-spec.md` for templates, but treat the live-fetched spec as the authoritative source.

### Sub-phase Router

Run the sub-phases below in order, filtered by the Tier selected in Phase 2:

- **Tier 1**: 4a
- **Tier 2**: 4a → 4b → 4c → License/Dependency Health (if Phase 2 flagged risks) → 4e → 4f
- **Tier 3**: 4a → 4b → 4c → License/Dependency Health (if Phase 2 flagged risks) → 4d → 4e → 4f → 4g

License / Dependency Health is conditional on Phase 2 findings, not on tier. Skip any sub-phase whose inputs are absent (e.g., no tsconfig.json → no typecheck job in 4e).

### Phase 4a: CLAUDE.md

Design principles:
- Target: under 200 lines. Ideal: under 50 lines
- Start with `@package.json` (or equivalent) — never restate what's derivable from the dependency file
- Focus on constraints and prohibitions: "Do NOT use X" prevents more LLM mistakes than "use X"
- Include: architecture intent, key constraints, important commands, what must never happen
- Exclude: info in the dependency file, generic best practices, anything a capable LLM already knows

### Phase 4b: .claude/rules/*.md

Design principles:
- One file per concern. Target: under 30 lines each
- **Global rules** (apply everywhere): no frontmatter. Use for linter choice, commit format, universal prohibitions
- **Scoped rules** (apply to specific paths): use `paths:` frontmatter with glob patterns
- Name files descriptively in kebab-case: `db-patterns.md`, `test-conventions.md`, `api-error-handling.md`

Frontmatter format (verify exact key name in Phase 3 output before using):
```yaml
---
paths:
  - "prisma/**"
  - "src/**/actions/**"
---
```

### Phase 4c: .claude/settings.json (Hooks)

Design principles:
- Hooks enforce what must not depend on LLM judgment
- Use PostToolUse with Write/Edit/MultiEdit matchers to run linter and formatter after file changes
- Only configure hooks for tools that are in the project's actual dependencies
- Include timeout values appropriate for the tool's typical run time

Verify exact settings.json structure from Phase 3 before writing.

### Phase 4-License: Dependency Health & License Compliance (conditional)

If Phase 2 identified unmaintained packages or license risks, generate the following:

**oss-license-policy.md** (global rule, no frontmatter):
- Whitelist of allowed licenses (MIT, BSD, ISC, Apache-2.0, CC-BY-4.0)
- Blacklist of prohibited licenses (GPL, AGPL, SSPL, BSL) with brief rationale
- Instruction: "When suggesting a new dependency, verify its license is on the whitelist. Do NOT suggest packages licensed under GPL, AGPL, or SSPL"
- Instruction: "Before suggesting a package, verify it is actively maintained (published within the last 2 years, no deprecation notice on the registry)"

**THIRD-PARTY-NOTICES.md** (project root, not a rule file):
- If the project lacks a third-party notices file and uses LGPL, Apache-2.0, or CC-BY-4.0 dependencies, generate one listing package name, version, license, and copyright holder
- If the file already exists, note any missing entries

If unmaintained packages were found, include a **Recommended replacements** section in the Phase 5 output summarizing each stale package and its suggested alternative.

### Phase 4d: Multi-Agent TDD Architecture (optional)

Run this sub-phase only if Phase 2 decided the project warrants a multi-agent
setup. Read `references/tdd-agents.md` for the full templates and parameter
substitution guide.

Generate the following files:

- `.claude/agents/planner.md` — design agent (opus), writes plans to `docs/plans/`
- `.claude/agents/coder.md` — TDD implementation agent (sonnet), one step at a time
- `.claude/agents/reviewer.md` — verification agent (opus), never edits files
- `.claude/rules/workflow.md` — orchestration rules for the main assistant

Resolve all `{PLACEHOLDER}` values from Phase 1 data before writing. If a
placeholder's value is unknown, ask the user — do not guess. For tech stacks
without a given concept (e.g., no Server Components, no ORM), omit the
related placeholder entirely rather than leave it blank.

The `coder.md` self-check table and the `reviewer.md` checklist in the
template already embed the recurring defect classes (type safety, race
condition, accessibility, double-submit, input validation, SOLID/DRY) so
review cycles converge faster from day one.

Instruct the user that these files are living documents: when a review
catches the same defect class twice, add it to `reviewer.md` and the coder
self-check so it is caught at implementation time going forward.

### Phase 4e: CI/CD Workflow (Tier 2 and Tier 3)

Run this sub-phase when the chosen tier is Tier 2 or Tier 3. Read
`references/ci-cd-templates.md` for provider selection, templates, and the
parameter substitution table.

Key decisions:

- Detect the provider from existing files (`.github/workflows/`,
  `.gitlab-ci.yml`, etc.). Never introduce a second provider
- Use the exact commands from `{LINT_CMD}` and `{TEST_CMD_ALL}` — do not
  invent CI-specific variants
- Generate one workflow file only; keep jobs narrow (lint, test, optionally
  typecheck)
- Pin the runtime version by file (`.nvmrc`, `.python-version`, etc.), not
  a hardcoded number

If the project already has a CI file that invokes the same commands, skip
generation and note in Phase 5 that CI is already covered. If it invokes
different commands, offer to align them and wait for user confirmation —
do not overwrite silently.

### Phase 4f: Pre-commit Hooks (Tier 2 and Tier 3)

Run this sub-phase when the chosen tier is Tier 2 or Tier 3. Read
`references/pre-commit-templates.md` for tool selection and templates.

Key decisions:

- Pick exactly one tool: Husky+lint-staged (Node), pre-commit framework
  (Python), or Lefthook (polyglot/Rust/Go)
- If a pre-commit tool already exists in the project, extend its config
  rather than replacing it
- Pre-commit runs the same lint and format commands as CI, scoped to
  staged files only
- Do NOT put the full test suite or project-wide typecheck into pre-commit
  (too slow; developers will bypass)

Output:

- The config file (`.husky/pre-commit`, `lefthook.yml`, or
  `.pre-commit-config.yaml`)
- Any required `package.json` additions
- Install commands for the Phase 5 summary

Explain to the user that pre-commit + Claude Code hooks + CI form a
three-layer wall enforcing the same commands at different points.

### Phase 4g: docs Scaffolding (Tier 3 only)

Run this sub-phase only at Tier 3, and only if Phase 4d generated the TDD
agents. This creates the directories and placeholder files the
planner/coder agents expect to find.

Generate:

```
docs/
├── plans/
│   └── .gitkeep
├── feature/
│   └── .gitkeep
└── README.md
```

`docs/README.md` content (short, ~15 lines):

```markdown
# docs/

This directory holds design artifacts that the planner/coder/reviewer
agents read and write. Do not treat it as user-facing documentation.

## Layout

- **plans/** — Implementation plans produced by @planner. One file per
  feature or refactor. File naming: `<kebab-case-feature-name>.md`
- **feature/** — Per-feature long-form notes, decisions, or migration
  records. Created by @planner or @coder during implementation
- Other top-level files — architectural overviews, RFCs, meeting notes

## Lifecycle

Plans in `plans/` transition from "awaiting review" to "in progress" to
"completed" as the work proceeds. Archive or delete completed plans once
the feature ships and its rationale is captured in git history.
```

If `docs/` already exists, do not overwrite existing files. Only add the
subdirectories and `.gitkeep` markers that are missing, and optionally
propose a `README.md` if none exists.

---

## Phase 5: Output

Generate all files and present them with explanations:

Start the output with the **chosen tier** and the list of sub-phases that ran. Then present each generated artifact:

1. **CLAUDE.md** — with a comment on each section explaining the reasoning
2. **Each .claude/rules/*.md** — noting why scoped vs. global, and which gap it addresses
3. **.claude/settings.json** — explaining each hook's purpose and the tools it runs
4. **.claude/agents/*.md and .claude/rules/workflow.md** (Tier 3, if Phase 4d ran) — explain the planner/coder/reviewer division of labor and the routing rules in workflow.md
5. **CI workflow file** (Tier 2/3, if Phase 4e ran) — explain the chosen provider, which jobs run in parallel, and state that CI uses the exact same commands as local lint/test
6. **Pre-commit config** (Tier 2/3, if Phase 4f ran) — list the chosen tool, the config file, required install commands, and state that it enforces the same commands as CI on the developer side
7. **docs/ scaffolding** (Tier 3 only, if Phase 4g ran) — explain that `docs/plans/` and `docs/feature/` are where planner/coder write their artifacts
8. **Three-layer wall diagram** (Tier 2/3) — one-paragraph recap that pre-commit → Claude Code hook → CI all invoke the same commands
9. **Summary table** — maps each generated file to the gap it solves, and notes which gaps are covered by installed skills vs. new rules

If installed skills were provided, include a coverage table:

| Area | Covered by | File |
|------|-----------|------|
| React patterns | vercel-react-best-practices skill | — |
| Prisma schema changes | (gap) | .claude/rules/db-patterns.md |
| Biome linting | (gap — automated) | .claude/settings.json |
| License compliance | (gap) | .claude/rules/oss-license-policy.md |
| Attribution notices | (gap) | THIRD-PARTY-NOTICES.md |
| Unmaintained deps | (gap — action needed) | Phase 5 replacement table |

---

## Key Principles (apply throughout)

- **"Do NOT use Y"** is more effective than "use X" for preventing LLM mistakes
- **@package.json** (or equivalent) eliminates duplication — never restate what's in the dependency file
- **Hooks enforce mechanics**; rules guide judgment
- **Every rule earns its token cost** — if a capable LLM would follow it anyway, omit it
- **Live docs override training data** — if Phase 3 fetch contradicts output-spec.md, the live spec wins

## References

- **references/llm-pitfalls.md** — Read during Phase 2: technology-to-LLM-mistake mapping by ecosystem
- **references/output-spec.md** — Read during Phase 4: output templates for each file type (best-effort; Phase 3 fetch takes priority)
- **references/tdd-agents.md** — Read during Phase 4d (Tier 3): decision criteria, templates for planner/coder/reviewer agents and workflow.md, plus the parameter substitution guide
- **references/ci-cd-templates.md** — Read during Phase 4e (Tier 2/3): provider-specific CI templates and the parameter substitution table
- **references/pre-commit-templates.md** — Read during Phase 4f (Tier 2/3): tool selection and templates for Husky/Lefthook/pre-commit
