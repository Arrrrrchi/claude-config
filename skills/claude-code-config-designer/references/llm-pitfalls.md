# LLM Pitfalls by Technology

Common mistakes LLMs make when working with specific tools and frameworks. Use this during Phase 2 gap analysis to identify which rules are needed for the project's specific stack.

Each entry: **WRONG** (what the LLM will suggest) → **CORRECT** (what the project actually uses) → **WHY** (brief context).

> Note: These entries reflect known patterns at the time of writing. Always verify version-specific details against official docs during Phase 3.

---

## JavaScript / TypeScript

### Linting and Formatting

**Biome users:**
- WRONG: Suggest installing `eslint`, `prettier`, `.eslintrc.json`, `.prettierrc`
- CORRECT: Project uses `biome.json` config, run `biome check --apply` or `biome format --write`
- WHY: Biome replaces both ESLint and Prettier in one tool. LLMs default to the ESLint+Prettier combo.

**Rome (legacy) → Biome:**
- WRONG: Reference `rome.json` or `rome` CLI commands
- CORRECT: Rome was renamed to Biome. Config is `biome.json`, CLI is `biome`
- WHY: LLMs trained before the rename still generate `rome` references.

### Package Managers

**pnpm workspaces:**
- WRONG: `npm install --workspace=pkg-name` or `yarn workspace pkg-name add`
- CORRECT: `pnpm --filter pkg-name add dependency` or `pnpm -w add` for root
- WHY: pnpm workspace filter syntax differs from npm/yarn.

**Bun:**
- WRONG: Use `npm install`, `npx`, `node` commands
- CORRECT: Use `bun install`, `bunx`, `bun run`
- WHY: Bun replaces Node.js runtime and package manager.

### Next.js

**App Router (Next.js 13+):**
- WRONG: Use `getServerSideProps`, `getStaticProps`, `useRouter` from `next/router`, `pages/` directory patterns
- CORRECT: Use `async` Server Components, `fetch()` with caching options, `useRouter` from `next/navigation`, `app/` directory
- WHY: App Router is a fundamentally different paradigm. LLMs default to Pages Router patterns.

**Next.js 15 fetch caching:**
- WRONG: Assume `fetch()` is cached by default (Next.js 13-14 behavior)
- CORRECT: In Next.js 15, `fetch()` is no longer cached by default. Use `{ cache: 'force-cache' }` explicitly when caching is needed.
- WHY: Breaking change in Next.js 15.

**Server vs. Client Components:**
- WRONG: Add `'use client'` to every component, or use `useState`/`useEffect` in Server Components
- CORRECT: Default to Server Components; add `'use client'` only when browser APIs or interactivity is needed
- WHY: LLMs over-use `'use client'` because they default to React client-side mental model.

### Tailwind CSS

**Tailwind v4:**
- WRONG: Use `tailwind.config.js`, `@tailwind base/components/utilities` directives, `purge:` or `content:` in config
- CORRECT: Use CSS-first config — import Tailwind via `@import "tailwindcss"` in CSS, configure with `@theme` block in CSS
- WHY: Tailwind v4 eliminated the JS config file for most use cases. Major breaking change.

**Tailwind v4 with Vite:**
- WRONG: Use PostCSS plugin setup from v3
- CORRECT: Use `@tailwindcss/vite` plugin
- WHY: v4 provides a dedicated Vite plugin.

### Zod

**Zod v4:**
- WRONG: `z.string().email()` throws differently, `z.object().strict()` is removed, `ZodError.flatten()` signature changed
- CORRECT: Check [Zod v4 migration guide](https://zod.dev/v4) for specific API changes
- WHY: Zod v4 has multiple breaking changes from v3. LLMs default to v3 patterns.

### Vitest vs. Jest

**Vitest users:**
- WRONG: Configure via `jest.config.ts`, use `jest.mock()`, install `@types/jest`
- CORRECT: Configure via `vitest.config.ts`, use `vi.mock()`, types come from `vitest` package itself
- WHY: Vitest has a Jest-compatible API but different config and globals.

**Vitest in-source testing:**
- WRONG: Create separate `__tests__/` directory
- CORRECT: Can use `if (import.meta.vitest)` blocks in source files
- WHY: Vitest supports in-source testing, which some projects use.

### Prisma

**Schema changes:**
- WRONG: Directly edit DB tables or use raw SQL for schema changes
- CORRECT: Edit `prisma/schema.prisma`, run `prisma migrate dev --name description`
- WHY: Prisma manages schema through migration files; bypassing it breaks the migration history.

**Prisma Client generation:**
- WRONG: Assume Prisma Client is always up to date after schema changes
- CORRECT: Run `prisma generate` after schema changes, or check if `postinstall` script handles it
- WHY: Client must be regenerated to reflect schema changes.

**N+1 queries:**
- WRONG: Loop over records and query relations inside the loop
- CORRECT: Use `include` or `select` in the initial query to load relations
- WHY: Prisma doesn't auto-batch lazy-loaded relations.

### TypeScript

**`noUncheckedIndexedAccess`:**
- WRONG: Access array elements without undefined checks when strict mode includes this option
- CORRECT: Check `tsconfig.json` for `noUncheckedIndexedAccess` and handle `T | undefined` accordingly
- WHY: This strict flag changes array index access return types.

---

## Python

### Linting and Formatting

**Ruff users:**
- WRONG: Suggest installing `flake8`, `black`, `isort`, creating `.flake8` or `setup.cfg` config
- CORRECT: Project uses `ruff` — configure via `pyproject.toml` `[tool.ruff]` section, run `ruff check` and `ruff format`
- WHY: Ruff replaces flake8, black, and isort in one tool. LLMs default to the older separate-tool setup.

### Package Management

**uv users:**
- WRONG: Use `pip install`, `pip-compile`, `python -m venv`, `pip-tools`
- CORRECT: Use `uv add`, `uv sync`, `uv run` — uv manages venv automatically
- WHY: uv is a newer, faster replacement for pip+virtualenv. LLMs default to pip workflows.

**Poetry users:**
- WRONG: Use `pip install`, edit `requirements.txt`, `setup.py`
- CORRECT: Use `poetry add`, `poetry install`, `poetry run` — dependencies in `pyproject.toml`
- WHY: Poetry manages dependencies differently from pip.

### Pydantic

**Pydantic v2:**
- WRONG: Use `validator` decorator, `__fields__`, `.dict()`, `.json()`, `orm_mode = True`
- CORRECT: Use `@field_validator`, `model_fields`, `.model_dump()`, `.model_dump_json()`, `model_config = ConfigDict(from_attributes=True)`
- WHY: Pydantic v2 has major API breaking changes from v1.

### FastAPI

**FastAPI with Pydantic v2:**
- WRONG: Use Pydantic v1 response model patterns
- CORRECT: FastAPI 0.100+ fully supports Pydantic v2 — use v2 patterns throughout
- WHY: LLMs mix v1 and v2 patterns when both are in training data.

**Async patterns:**
- WRONG: Use synchronous DB calls inside `async def` route handlers
- CORRECT: Use async DB libraries (asyncpg, SQLAlchemy async, Tortoise ORM) or run sync calls in a thread pool
- WHY: Sync DB calls block the event loop, defeating async's purpose.

### SQLAlchemy

**SQLAlchemy 2.0:**
- WRONG: Use `session.execute(select(...)).fetchall()`, legacy `Query` API, `Column` import from `sqlalchemy`
- CORRECT: Use `session.scalars(select(...)).all()`, 2.0-style queries, `mapped_column` with `Mapped` type annotations
- WHY: SQLAlchemy 2.0 has a new query API. Legacy API still works but new code should use the new style.

---

## PHP / Laravel

### Laravel

**Laravel 11:**
- WRONG: Use `app/Http/Kernel.php` for middleware registration, separate route service provider
- CORRECT: Use `bootstrap/app.php` for middleware, routes registered directly in `routes/` without a service provider
- WHY: Laravel 11 restructured the application skeleton significantly.

**Eloquent relationships:**
- WRONG: Access relationships as properties without eager loading in loops
- CORRECT: Use `->with(['relation'])` or `->load('relation')` to eager load; avoid N+1
- WHY: Eloquent lazy-loads by default, causing N+1 query problems.

### PHP 8.x

**Named arguments:**
- WRONG: Rely on positional arguments where named arguments clarify intent
- CORRECT: Use named arguments for functions with many optional parameters
- WHY: LLMs sometimes miss PHP 8.0+ named argument syntax.

**Enums (PHP 8.1+):**
- WRONG: Use class constants or string constants for enumerable values
- CORRECT: Use `enum` keyword with `BackedEnum` when string/int values are needed
- WHY: LLMs default to older constant patterns if not guided.

---

## Ruby / Rails

### Rails 7+

**Hotwire/Turbo:**
- WRONG: Add jQuery for AJAX, use Rails UJS `data-remote` attributes, render JS responses
- CORRECT: Use Turbo Frames, Turbo Streams, and Stimulus for interactivity
- WHY: Rails 7 replaced the UJS/jQuery approach with Hotwire. LLMs default to older patterns.

**Import maps:**
- WRONG: Suggest Webpack, webpacker, or npm-based JS bundling
- CORRECT: Rails 7 uses Import Maps by default (`importmap-rails`). Sprockets or jsbundling-rails for custom setups.
- WHY: Rails 7 changed the default JS approach significantly.

---

## CSS / Styling

### CSS Modules

**CSS Modules vs. Tailwind:**
- WRONG: Mix CSS Modules class naming with Tailwind utility classes in the same component
- CORRECT: Pick one approach per project; check if project uses `module.css` files or Tailwind utilities
- WHY: Both work but mixing creates confusion. LLMs sometimes apply both simultaneously.

### Styled Components / Emotion

**Styled Components v6:**
- WRONG: Use `.attrs()` syntax from v5, or assume `styled-components/macro`
- CORRECT: Check v6 migration guide — some APIs changed
- WHY: v6 has breaking changes that LLMs may not know.

---

## Testing

### Testing Library

**Selector priority:**
- WRONG: Use `getByTestId`, `querySelector`, or role-agnostic selectors
- CORRECT: Prefer `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort)
- WHY: Testing Library recommends accessibility-first selectors. `getByTestId` is a maintenance anti-pattern.

### Playwright

**Playwright vs. Cypress:**
- WRONG: Use `cy.get()`, `cy.intercept()`, Cypress plugin patterns
- CORRECT: Use `page.locator()`, `page.route()`, Playwright fixtures
- WHY: Completely different APIs despite similar purpose.

**Playwright locators:**
- WRONG: Use CSS selectors or XPath directly
- CORRECT: Prefer `getByRole`, `getByText`, `getByLabel` — similar priority to Testing Library
- WHY: Playwright's accessibility-based locators are more resilient.

---

## Build Tools

### Vite

**Vite vs. Webpack:**
- WRONG: Use webpack-specific config (webpack.config.js, `require.context`, `process.env` without import.meta)
- CORRECT: Use `vite.config.ts`, `import.meta.env`, Vite plugin ecosystem
- WHY: Vite is a completely different bundler with different config format.

### esbuild / tsup

**Library bundling:**
- WRONG: Configure webpack or rollup for library bundling
- CORRECT: Use tsup (wraps esbuild) for TypeScript library bundling — `tsup.config.ts`
- WHY: tsup is the current standard for TS library bundling. LLMs suggest webpack.

---

## Commit Conventions

### Conventional Commits

**With commitlint:**
- WRONG: Write free-form commit messages
- CORRECT: Follow `type(scope): description` format — `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`
- WHY: commitlint enforces the format. Breaking this fails CI.

**With `@commitlint/config-conventional`:**
- WRONG: Use `update:` or `change:` or `improvement:` as type prefixes
- CORRECT: Only use the defined types: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`
- WHY: Non-standard types fail conventional commit validation.
