---
name: quality-learner
description: "Learn from recurring code review findings and fold them back into the right layer so the same defect is not caught twice. Aligned with the global harness: general, cross-project defect classes are promoted into the global reviewer agents (~/.claude/agents/review/*.md — code-reviewer, security/db/cwv/solid), while project-specific defects are promoted into that project's .claude/rules/*.md or CLAUDE.md (the 'catch earlier' layer; there is no coder/planner agent because implementation is main-thread TDD and planning is plan mode). Use after a review session, after a PR cycle with multiple review rounds, when the [[failure-log]] ledger (docs/failure-log.md) records the same defect class for the 2nd time, or when the user says 'we keep getting the same feedback', 'update the reviewers based on recent reviews', 'learn from this review', or 'add this to the reviewer checklist'. Reads review history (failure-log ledger, git log, PR comments, recent chat), clusters recurring defect classes, and proposes concrete edits. Never edits agent or rule files without user confirmation."
---

# Quality Learner

## Purpose

Turn review findings into rules. Every time the same class of defect is
caught twice or more, it should stop being a surprise and start being a
pre-flight check. This skill analyzes recent review activity, identifies
recurring patterns, and proposes edits so future runs avoid the defect and
future reviews catch it earlier — promoting each finding to the **right
layer of the global harness**.

This is the "learning loop" complement to the harness installed in
`~/.claude` (global developer behavior, Review Matrix, and reviewer agents)
and to the per-project layer produced by [[project-claude-config]].

## Where findings get promoted (harness-aligned)

The global harness has no `coder.md` / `planner.md` (implementation is
main-thread TDD; planning is plan mode). So the promotion targets are:

| Defect kind | Promote to | Why |
|---|---|---|
| **General / cross-project** defect class (type safety, error handling, test quality, perf, generic correctness) | Global `~/.claude/agents/review/code-reviewer.md` checklist | Every project benefits; the reviewer should catch it everywhere |
| Auth / authz / input validation | Global `~/.claude/agents/review/security-reviewer.md` | Same, security-scoped |
| DB schema / migration / SQL / N+1 | Global `~/.claude/agents/review/db-reviewer.md` | Same, data-layer-scoped |
| a11y / CLS / LCP / image / CSS / font | Global `~/.claude/agents/review/cwv-reviewer.md` | Same, frontend-scoped |
| SRP / DRY / abstraction boundary | Global `~/.claude/agents/review/solid-reviewer.md` | Same, design-scoped |
| **Project-specific** defect (tied to this repo's stack, domain, or paths) | That project's `.claude/rules/*.md` (path-scoped) or `CLAUDE.md` Constraints | Catches it at implementation time; keeps global reviewers free of per-project noise |

**Decision rule:** promote to the **global reviewer** only when the defect
class is **stack-agnostic** — it would recur regardless of framework or
domain (e.g., missing error handling on a thrown path, an untested branch,
an unhandled null). If the defect is tied to a **specific stack, domain, or
path** (e.g., Next.js App Router misuse, Tailwind v4 config, this repo's
`tenant_id` filter), promote it to **that project's `.claude/rules` /
`CLAUDE.md`** — never to a global reviewer, or it pollutes every project's
reviews with stack-specific noise.

## Preconditions

- Global reviewer agents exist at `~/.claude/agents/review/*.md`
  (`code-reviewer.md` + specialists). These ship with the harness.
- For project-specific promotions, the target project should have a
  `.claude/` (or be willing to gain one). If it lacks a project config,
  use [[project-claude-config]] to create the `.claude/rules` / `CLAUDE.md`
  layer first.

## Workflow

Four sequential steps. Do not skip any.

### Step 1: Gather Review Evidence

Collect the raw material to analyze. Prefer multiple sources:

- **failure-log ledger (highest priority)** — read the project's
  `docs/failure-log.md` (or `.claude/failure-log.md` if `docs/` does not
  exist). This is written by the [[failure-log]] skill and already
  contains structured entries with a `Should Update` classification
  (global CLAUDE.md / project CLAUDE.md / rules / agent / skill / hook /
  CI / tests) — reuse that classification directly as the promotion
  target for Step 3 instead of re-deriving it
- **Explicit user input** — if the user pastes review findings or names
  specific issues, use those directly
- **Recent git log on the current branch** — `git log --oneline -30`
  then `git show` on commits with messages containing "fix", "修正",
  "address review", "review feedback", etc.
- **Open PR comments** — `gh pr view <N> --comments` and
  `gh api repos/OWNER/REPO/pulls/N/comments` for inline review comments
- **Recent chat context** — if the current session contains reviewer
  reports (`@codex-code-reviewer` / `@code-reviewer` and specialists),
  use them

Normalize each finding into a short record:

```
- File: <path:line>
- Defect class: <one of: type safety | race condition | a11y | input
  validation | SRP | DRY | error handling | test quality | perf | other>
- Scope: <general (cross-project) | project-specific>
- Specific issue: <short description>
- Source: <git commit / PR comment / user / session>
```

If no evidence can be gathered, ask the user to paste recent review
findings before continuing. Do not proceed with an empty dataset.

### Step 2: Cluster and Rank

Group findings by defect class. Apply these thresholds:

- **Report to the user** any class with **2 or more occurrences**
- **Do not report** one-off findings — they are not yet patterns
- **Always report** any class that caused a Critical or High severity
  report, even as a single occurrence, because the cost is too high to
  wait for recurrence

For each cluster, record:

- Defect class name
- Count and sources
- **Scope** — general vs. project-specific (drives the promotion target)
- One representative example with file path
- Whether the target file (global reviewer or project rule) already has a
  matching checklist item (read the file to check)

### Step 3: Propose Edits

For each cluster that clears the threshold, draft concrete edits to the
target chosen by the decision rule above:

1. **Global reviewer** (`~/.claude/agents/review/<reviewer>.md`) — for a
   general defect class, add a bullet to the relevant checklist section.
   Pick the reviewer by the mapping table (security → security-reviewer,
   DB → db-reviewer, a11y/CWV → cwv-reviewer, design → solid-reviewer,
   else code-reviewer). Write the check in imperative form.

2. **Project rule / CLAUDE.md** — for a project-specific defect, add a
   bullet to the most relevant `.claude/rules/*.md` (path-scoped) in the
   affected project, or a Constraint line to its `CLAUDE.md`. This moves
   the check from "caught in review" to "caught at implementation time"
   without polluting the global reviewers. If the project has no matching
   rule file yet, propose creating one (or defer to
   [[project-claude-config]]).

**Do not edit the files yet.** Present the diffs as proposals.

Format each proposal like this:

```
### Cluster: <defect class> (count: N, scope: <general|project-specific>)

Evidence:
- <path:line> — <short>
- <path:line> — <short>

Proposed edit to <target file>:
  In section "<section>":
  + <new bullet (imperative, names the specific symptom)>
```

### Step 4: Confirm and Apply

Show the user all proposed edits in one batch and ask for confirmation.
Options to offer:

- **Apply all** — edit all proposed targets with the diffs
- **Apply selectively** — user picks which clusters to fold in
- **Skip** — do not edit; user will handle manually

On "apply", use the Edit tool and report each file that changed. On
"skip", record the decision silently and exit.

Never apply edits without an explicit user go-ahead. Global reviewer files
shape **all** future review behavior across every project, so surprise
edits there are especially expensive to undo — be conservative about what
gets promoted to the global layer.

## Output Format

After Step 4, report:

```
## Quality learning summary

Evidence gathered: N findings from <sources>
Clusters identified: M (threshold: 2+ occurrences or 1+ Critical/High)

### Applied
- <defect class> (general): ~/.claude/agents/review/<reviewer>.md
- <defect class> (project-specific): <project>/.claude/rules/<file>.md

### Skipped
- <defect class>: <reason>

Next steps: run the next review cycle and verify the new checks fire at
the right layer (project rule / CLAUDE.md at implementation time → global
reviewer checklist at review time).
```

## Principles

- **Two strikes, one rule** — a single mistake is noise; two is a
  pattern worth encoding
- **Earlier is cheaper** — promote a check toward implementation time
  (project rule / CLAUDE.md) when the defect is project-specific, so it is
  prevented, not just caught
- **Global stays general** — only promote to a global reviewer when the
  defect class is genuinely cross-project. Per-project noise belongs in
  that project's rules, not the shared reviewers
- **Keep it concrete** — bullets should name the specific symptom, not
  restate general principles. "Ensure `useEffect` + fetch uses
  `AbortController` + `ignore`" beats "Handle async correctly"
- **Confirm before editing** — reviewer and rule files are load-bearing;
  never modify them silently
- **Stop the bleeding, then learn** — do not run this skill mid-review;
  run it after the review cycle has concluded and the fixes are merged

## When NOT to Use This Skill

- The global reviewer agents do not exist (the harness is not installed)
- The target project has no `.claude/` for a project-specific promotion —
  use [[project-claude-config]] to create the rules/CLAUDE.md layer first
- The current session is in the middle of implementing a feature —
  wait until the review cycle is complete
- The user only has a single review finding with no recurrence —
  the pattern is not yet established
- The defect is in a one-off script or throwaway code, not in the
  reusable project conventions
