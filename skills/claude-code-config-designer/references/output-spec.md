# Output Specification

Best-effort templates for each generated file type. These reflect known patterns at the time of writing.

**CRITICAL**: Always verify against live official docs fetched in Phase 3. If the live spec contradicts anything here, the live spec wins. Update your mental model accordingly before generating files.

Key things to verify in Phase 3:
- Is the path-scoping frontmatter key `paths:` or `globs:` or something else?
- What are the exact hook event type names?
- What is the settings.json top-level structure?

---

## CLAUDE.md Template

```markdown
@package.json

## Architecture

[2-3 sentences describing directory structure and key boundaries that are NOT derivable from package.json]

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Type check | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |

## Constraints

- Do NOT use [tool/pattern the LLM would wrongly suggest]
- Do NOT add [common LLM mistake for this stack]
- [Project-specific constraint not in package.json]

## [Optional: Architecture notes]

[Server/Client Component boundary, module structure intent, etc.]
```

Guidelines for CLAUDE.md content:
- The `@package.json` line loads package.json into context — do not repeat its contents
- Commands section: only include commands that are non-obvious from package.json scripts
- Constraints section: every item should be something an LLM would actually get wrong for this specific stack
- Omit sections that have nothing non-obvious to add

---

## Global Rule File (no frontmatter)

Use for rules that apply to all files in the project — linter choice, commit format, universal patterns.

```markdown
# [Rule Name]

[1-2 sentences explaining the rule. Use prohibition form: "Do NOT..." or "Never..."]

## [Optional: Specific guidance]

[Additional detail if needed. Keep under 30 lines total.]
```

Example — `linting.md`:
```markdown
# Linting and Formatting

Do NOT suggest installing eslint, prettier, or creating .eslintrc / .prettierrc files.
This project uses Biome for both linting and formatting.

Run: `biome check --apply` to lint and format, or `biome format --write` for format only.
Config is in `biome.json`.
```

Example — `commit-conventions.md`:
```markdown
# Commit Message Format

Follow Conventional Commits: `type(scope): description`

Valid types: feat, fix, chore, docs, refactor, test, ci, build, perf, style, revert

- Subject line: 72 characters max, imperative mood, no period
- Breaking changes: add `!` after type or `BREAKING CHANGE:` footer
```

---

## Scoped Rule File (with paths: frontmatter)

Use for rules that only apply when working with specific file paths.

```markdown
---
paths:
  - "prisma/**"
  - "src/**/migrations/**"
---

# Database Patterns

[Rules specific to DB/ORM files]
```

Example — `db-patterns.md` for a Prisma project:
```markdown
---
paths:
  - "prisma/**"
---

# Prisma Patterns

Do NOT modify the database schema directly via SQL or database tools.
All schema changes must go through `prisma/schema.prisma`.

After editing schema.prisma:
1. Run `prisma migrate dev --name <description>` for development
2. Run `prisma generate` to update the Prisma Client

Do NOT write raw SQL for queries that Prisma can express. Use the Prisma Client API.
Avoid N+1: use `include` or `select` in the initial query to load relations.
```

Example — `test-conventions.md` for a Vitest project:
```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Test Conventions

Do NOT use `jest.mock()` or `@types/jest`. This project uses Vitest.
Use `vi.mock()`, `vi.fn()`, `vi.spyOn()`.

Test file naming: `ComponentName.test.tsx` co-located with the source file.
Do NOT create a separate `__tests__/` directory.

Selector priority (Testing Library): getByRole > getByLabelText > getByText > getByTestId
```

---

## .claude/settings.json Hooks Template

Verify the exact structure by fetching `https://code.claude.com/docs/en/hooks` in Phase 3.

Best-effort template (as of early 2025):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && pnpm biome check --apply --no-errors-on-unmatched 2>/dev/null || true",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### Hook Command Patterns by Tool

**Biome (lint + format):**
```
cd $CLAUDE_PROJECT_DIR && pnpm biome check --apply --no-errors-on-unmatched 2>/dev/null || true
```

**ESLint:**
```
cd $CLAUDE_PROJECT_DIR && npx eslint --fix $(echo $CLAUDE_TOOL_OUTPUT | jq -r '.path // empty') 2>/dev/null || true
```

**Prettier:**
```
cd $CLAUDE_PROJECT_DIR && npx prettier --write $(echo $CLAUDE_TOOL_OUTPUT | jq -r '.path // empty') 2>/dev/null || true
```

**Ruff (Python lint + format):**
```
cd $CLAUDE_PROJECT_DIR && ruff check --fix . && ruff format . 2>/dev/null || true
```

**PHP-CS-Fixer:**
```
cd $CLAUDE_PROJECT_DIR && ./vendor/bin/php-cs-fixer fix 2>/dev/null || true
```

### Hook Design Principles

- Add `|| true` to prevent hook failures from blocking Claude's operation
- Redirect stderr to `/dev/null` for noisy tools that print warnings on clean code
- Use `$CLAUDE_PROJECT_DIR` to ensure commands run from the project root
- Set `timeout` to the typical worst-case run time for the tool (in milliseconds)
- Only add hooks for tools that are in the project's actual dependencies — do not add ESLint hooks for a Biome project

---

## File Naming Conventions for .claude/rules/

| Concern | Suggested filename |
|---------|--------------------|
| Linting/formatting tool choice | `linting.md` |
| Commit message format | `commit-conventions.md` |
| Database/ORM patterns | `db-patterns.md` |
| Test conventions | `test-conventions.md` |
| API/backend patterns | `api-patterns.md` |
| CSS/styling patterns | `css-patterns.md` |
| Architecture constraints | `architecture.md` |
| Security requirements | `security.md` |
| TypeScript conventions | `typescript.md` |
| Deployment/CI patterns | `deployment.md` |

Use the narrowest scope that makes sense. A rule that only applies to test files should use `paths:` frontmatter targeting test file globs, not be a global rule.
