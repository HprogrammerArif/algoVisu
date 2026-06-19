# CLAUDE.md — Project Rules for QuantumViz

> Read automatically by Claude Code at the start of every session. Standing instructions.
> Keep it short and factual — long files get ignored. Deep detail lives in `docs/`.

## What this project is

QuantumViz is a **full-stack algorithm visualization platform** for teaching/learning.
Users pick an algorithm (sorting, searching, graph, etc.) and get a **reversible** visual
animation plus its explanation, source code, and time/space complexity.

It is a **university IDP project** with a **separated frontend and backend** and an Oracle
database. (This replaces the original static-only design.)

## Architecture (authoritative detail in `docs/`)

- **Three tiers, fully separate:** `frontend/` (static site) ⇄ `backend/` (REST API) ⇄ Oracle XE.
- **The seam:** the **database stores _what to teach_** (algorithm metadata, explanation,
  Big-O, code text); the **frontend keeps _how to animate_** (reversible step-generators +
  visualizers, which run client-side). They join on each algorithm's `slug`.
- Start here: [docs/architecture.md](docs/architecture.md),
  [docs/database-schema.md](docs/database-schema.md),
  [docs/folder-structure.md](docs/folder-structure.md),
  [docs/data-flow.md](docs/data-flow.md), [docs/api-reference.md](docs/api-reference.md),
  [docs/implementation-plan.md](docs/implementation-plan.md),
  [docs/run-guide.md](docs/run-guide.md).

## Tech stack

- **Frontend:** plain HTML, CSS (custom properties; the neon/CRT theme), vanilla JavaScript.
  **No React/Next, no TypeScript, no bundler, no npm, no build step.** Talks to the API via `fetch`.
- **Backend:** **TypeScript (strict)** on Node.js + Express. **Pragmatic Clean Architecture**
  (domain → application → interfaces; infrastructure implements domain interfaces). JWT auth
  (`bcryptjs`). Dev via `tsx`, build via `tsc` → `dist/`, tests via `vitest` + `supertest`.
- **Database:** Oracle XE 21c via `node-oracledb` (thin mode). **Oracle SQL only**, raw SQL
  via bind variables (no ORM). Normalized to 3NF.

## File map

- `frontend/` — `index.html`, `pages/`, `css/` (split theme), `js/{core,visualizers,algorithms,api,ui}`, `config.js`.
- `backend/src/` — `config/`, `domain/`, `application/`, `infrastructure/`, `interfaces/http/`, `shared/`, `app.ts`, `server.ts` (TypeScript).
- `backend/db/` — `migrations/` (Oracle DDL `.sql`), `seeds/`, `run.ts`.
- `docs/` — architecture, schema, data-flow, folder-structure, api-reference, run-guide,
  presentation-guide, implementation-plan; master spec under `docs/superpowers/specs/`.

> The original root `index.html` / `styles.css` / `js/` move into `frontend/` during
> implementation (see the implementation plan). Until then they remain at the root.

## How to run / verify

- Full setup: **[docs/run-guide.md](docs/run-guide.md)** (Oracle XE → backend → frontend).
- Quick: Oracle XE running → `cd backend && npm run dev` → serve `frontend/` statically → open it.
- Backend tests: `cd backend && npm test` (`vitest`); type-check with `npm run typecheck`.
- The in-app "COMPILE & RUN" button is the code sandbox — **not** a project build command.

## Conventions

- Frontend stays **vanilla** (no frameworks/TS/build). Keep the existing neon-on-dark,
  monospace look and the CSS custom properties.
- Backend honors the **dependency rule**: inner layers never import outer layers. **Raw SQL
  lives only in `infrastructure/database/repositories/`** and always uses bind variables.
- Visualizers are modular per type. New algorithm = step-generator in `frontend/js/algorithms/`
  + matching visualizer + a DB seed row (joined by `slug`). No schema change needed.
- Visualizations are **reversible** (forward AND backward); new step logic must replay both ways.
- DB: 3NF, snake_case plural tables, identity PKs, FK constraints, `CHECK` for enum-like fields.

## Working style I expect (rules for Claude)

1. **Read before editing.** Look at the relevant file(s) first.
2. **Small, surgical diffs.** Don't rewrite whole files or refactor unrelated code.
3. **Don't add dependencies or tooling** without asking — except backend npm packages already
   named in the docs (express, oracledb, jsonwebtoken, bcryptjs, dotenv, cors, typescript,
   tsx, vitest, supertest, etc.).
4. **Ask when genuinely ambiguous**, otherwise pick the sensible default and tell me what you chose.
5. **No commits or pushes unless I ask.** When I do ask, branch off `master` first.
6. **Match the surrounding code** — same naming, comment density, and idioms.
7. **Report honestly.** If something doesn't work or you skipped a step, say so.
