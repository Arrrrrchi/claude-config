---
name: claude-code-config-designer
description: "Design and generate optimal Claude Code configuration files for any project. Takes a dependency file (package.json, composer.json, pyproject.toml, Cargo.toml, etc.) and list of installed Claude Code skills, then produces CLAUDE.md, .claude/rules/*.md rule files, and .claude/settings.json hooks config. Use when a user wants to set up Claude Code for a project, create or improve CLAUDE.md, configure .claude/rules, set up hooks in settings.json, optimize Claude Code behavior for a specific tech stack, or identify gaps between their installed skills and their project needs."
effor: max
---

# Claude Code Config Designer

## Overview

Analyzes a project's dependency file and installed Claude Code skills to design CLAUDE.md, scoped rule files, and hooks config — verifying all output against live official documentation before generating files.

## Workflow

Config generation follows five sequential phases:

1. **Information Gathering** — Collect project context
2. **Gap Analysis** — Identify what rules are needed
3. **Official Docs Verification** — Fetch live specs (CRITICAL — never skip)
4. **File Design and Generation** — Create all config files
5. **Output and Explanation** — Deliver files with a summary

---

## Phase 1: Information Gathering

Collect the following (extract from conversation if already present):

- **Dependency file content** — package.json, composer.json, pyproject.toml, Cargo.toml, or equivalent
- **Installed or planned Claude Code skills** — list skill names, or "none"
- **Project type** — web app, CLI tool, library, monorepo, API backend, etc.
- **Existing conventions** — formatter, linter, commit format, or architecture rules the team already follows

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

Produce a gap list before proceeding. This list drives Phases 4 and 5.

---

## Phase 3: Official Docs Verification (CRITICAL — Never Skip)

Before writing any config file, fetch the live official documentation. Training data contains stale or incorrect information about Claude Code specifications. Fetching live docs prevents writing rules with wrong frontmatter keys, outdated hook syntax, or deprecated patterns.

### 3a. Fetch Claude Code memory and rules spec

```
WebFetch https://code.claude.com/docs/en/memory
```

Extract and record:
- Exact frontmatter key name for path scoping (verify: is it `paths:` or `globs:` or another key?)
- How global rules work (no frontmatter vs. some flag)
- @-reference syntax for importing files
- Line limits for CLAUDE.md
- .claude/rules/ directory behavior

### 3b. Fetch Claude Code hooks spec

```
WebFetch https://code.claude.com/docs/en/hooks
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

> "Unable to fetch official documentation. Output is based on training data which may be stale. Verify frontmatter key names and hook syntax against the live docs at code.claude.com/docs before applying."

Then fall back to `references/output-spec.md` templates as a best-effort starting point.

---

## Phase 4: File Design and Generation

Use the gap list from Phase 2 and the verified specs from Phase 3. Read `references/output-spec.md` for templates, but treat the live-fetched spec as the authoritative source.

### CLAUDE.md

Design principles:
- Target: under 200 lines. Ideal: under 50 lines
- Start with `@package.json` (or equivalent) — never restate what's derivable from the dependency file
- Focus on constraints and prohibitions: "Do NOT use X" prevents more LLM mistakes than "use X"
- Include: architecture intent, key constraints, important commands, what must never happen
- Exclude: info in the dependency file, generic best practices, anything a capable LLM already knows

### .claude/rules/*.md

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

### .claude/settings.json (Hooks)

Design principles:
- Hooks enforce what must not depend on LLM judgment
- Use PostToolUse with Write/Edit/MultiEdit matchers to run linter and formatter after file changes
- Only configure hooks for tools that are in the project's actual dependencies
- Include timeout values appropriate for the tool's typical run time

Verify exact settings.json structure from Phase 3 before writing.

### Dependency Health & License Compliance

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

---

## Phase 5: Output

Generate all files and present them with explanations:

1. **CLAUDE.md** — with a comment on each section explaining the reasoning
2. **Each .claude/rules/*.md** — noting why scoped vs. global, and which gap it addresses
3. **.claude/settings.json** — explaining each hook's purpose and the tools it runs
4. **Summary table** — maps each generated file to the gap it solves, and notes which gaps are covered by installed skills vs. new rules

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
