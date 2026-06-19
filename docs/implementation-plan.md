# QuantumViz — Implementation Plan (Master Roadmap)

> **For agentic workers:** each phase below has (or will have) a detailed executable plan
> under `docs/superpowers/plans/`. Use **superpowers:subagent-driven-development** (recommended)
> or **superpowers:executing-plans** to implement a phase task-by-task. Steps in the detailed
> phase plans use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build QuantumViz as a separated frontend + Node/Express + Oracle full-stack app,
migrating the existing client-side visualization engine onto a clean content/identity API.

**Architecture:** Three tiers (static frontend ⇄ Express REST API on pragmatic Clean
Architecture ⇄ Oracle XE). DB stores algorithm *content*; the browser keeps the reversible
animation *logic*; they join on `slug`. See [architecture.md](architecture.md).

**Tech Stack:** Frontend — vanilla HTML/CSS/JS (no build). Backend — Node ≥18 + **TypeScript
(strict)**, Express, `node-oracledb` (thin), `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`,
`express-validator`, `morgan`; dev via `tsx`, build via `tsc` → `dist/`; tests with
`vitest` + `supertest`. DB — Oracle XE 21c.

## Global Constraints

- Frontend: **vanilla only** — no React/Next, no TypeScript, no bundler, no npm, no build step.
- Backend: **TypeScript (strict)** — dev via `tsx`, build via `tsc` → `dist/`, tests via
  `vitest` + `supertest`.
- Backend: **Oracle SQL only**, raw SQL via **bind variables** (no ORM, no string-concatenated SQL).
- Clean Architecture **dependency rule**: inner layers never import outer layers; SQL lives
  only in `infrastructure/database/repositories/`.
- Schema: **3NF**, snake_case plural tables, identity PKs, FK constraints, `CHECK` for enum-like fields.
- Visualizations must remain **reversible** (forward AND backward).
- Keep the existing **neon/CRT** visual identity and CSS custom properties.
- Secrets only in `.env` (git-ignored); commit `.env.example` only.
- **No git commits/pushes unless the user asks.** When asked, branch off `master` first.
- Seed languages to start: **JavaScript + pseudocode** (schema supports python/cpp/java for later).
- Optional `notes`/`tags` tables are **build-if-time stretch** (Phase 10), not core path.

---

## How to use this plan

- **Sequence:** phases are ordered by dependency. Finish a phase (its Definition-of-Done
  passes) before starting dependents.
- **Granularity:** this master file lists **tasks** (each = files + deliverable + tests + a
  commit checkpoint). Each phase's **detailed plan** under `docs/superpowers/plans/` expands
  those tasks into 2–5 minute TDD steps with complete code.
- **Demoable checkpoints:** marked 🎯 — points where you can show working software.

---

## Phase overview

| # | Phase | Depends on | Deliverable | Demo |
|---|---|---|---|---|
| 0 | Scaffolding & repo split | — | `frontend/` + `backend/` skeleton, deps, `.env.example` | |
| 1 | Backend foundation | 0 | Express app boots, `/health` green, error handling, DB pool | 🎯 |
| 2 | Database schema & seeds | 1 | All tables created + seeded via `npm run db:setup` | 🎯 |
| 3 | Auth subsystem | 1,2 | register/login/me, JWT, roles, bcrypt | 🎯 |
| 4 | Catalog read API | 1,2 | `GET /categories`, `/algorithms`, `/algorithms/:slug` | 🎯 |
| 5 | Catalog admin CRUD | 3,4 | admin create/update/delete (transactional) | |
| 6 | User-data API | 3,4 | bookmarks + progress (upsert) | |
| 7 | Frontend migration | 0 | existing app moved into `frontend/`, split into modules, still works | 🎯 |
| 8 | Frontend ↔ API integration | 3,4,6,7 | catalog/auth/bookmarks/progress wired to the API | 🎯 |
| 9 | Integration & hardening | 5,6,8 | full catalog seeded, E2E smoke, polish, run-guide verified | 🎯 |
| 10 | Stretch (optional) | 9 | notes, tags, more languages, Docker compose | |

> Phases 4 and 6 can be built in parallel after Phase 3. Phase 7 can begin any time after
> Phase 0 (it only touches frontend), but its API wiring (Phase 8) needs 3/4/6.

---

## Phase 0 — Scaffolding & repo split

**Goal:** create the two-app skeleton without breaking the existing prototype.

- **Task 0.1 — Create folder skeletons.** Create `frontend/` and `backend/` trees per
  [folder-structure.md](folder-structure.md) (empty dirs + `.gitkeep` where needed). Leave
  the existing root `index.html`/`styles.css`/`js/` untouched for now (migrated in Phase 7).
- **Task 0.2 — Backend project init (TypeScript).** Create `backend/package.json` with deps
  (incl. `typescript`, `tsx`, `vitest`, `@types/*`) and scripts (`dev`, `build`, `start`,
  `typecheck`, `db:setup`, `db:migrate`, `db:seed`, `test`); `backend/tsconfig.json` (strict);
  `backend/.gitignore` (`node_modules`, `dist`, `.env`, `logs`); `backend/.env.example`
  (all vars from [run-guide.md](run-guide.md) §3). See the Phase 1 detailed plan for exact contents.
- **Task 0.3 — Frontend config stub.** Create `frontend/config.js` (`window.API_BASE_URL`)
  and `frontend/README.md` (how to serve).
- **DoD:** `cd backend && npm install` succeeds; folders match the documented tree.
- **Commit checkpoint:** `chore: scaffold frontend/backend project structure`.

---

## Phase 1 — Backend foundation

> Detailed executable plan: `docs/superpowers/plans/2026-06-19-phase-1-backend-foundation.md`.

**Goal:** a bootable Express app with config, DB connection pool, central error handling,
and a health endpoint — the spine everything else hangs on.

- **Task 1.1 — Config loader.** `src/config/index.ts` (load + validate `.env`, throw on
  missing required vars), `src/config/database.ts` (pool settings). Test: missing var throws;
  valid env parses.
- **Task 1.2 — Shared errors + async wrapper.** `src/shared/errors/AppError.ts`
  (`statusCode`, `code`, `message`), `src/shared/utils/asyncHandler.ts`. Test: AppError fields;
  asyncHandler forwards rejections to `next`.
- **Task 1.3 — Error handler + 404 middleware.** `src/interfaces/http/middlewares/errorHandler.ts`
  and a not-found handler. Test: AppError → its status + `{error:{code,message}}`; unknown → 500.
- **Task 1.4 — DB connection pool.** `src/infrastructure/database/connection.ts`
  (`initPool`, `getConnection`, `closePool` using `oracledb`, thin mode). Test: module loads;
  `initPool` is callable (live-DB test gated/skipped if no Oracle).
- **Task 1.5 — Express app assembly.** `src/app.ts` (cors, `express.json`, morgan, mount
  `/api/v1` router, 404, errorHandler) + `src/interfaces/http/routes/index.ts` with
  `GET /health`. Test (`supertest`): `GET /api/v1/health` → 200 `{status:"ok"}`; unknown → 404.
- **Task 1.6 — Server bootstrap (composition root).** `src/server.ts` (load config → init
  pool → start listening → graceful shutdown). Manual run check.
- 🎯 **DoD:** `npm run dev` boots; `curl /api/v1/health` → ok; `npm test` green.
- **Commit checkpoints:** one per task (`feat(core): ...`).

---

## Phase 2 — Database schema & seeds

**Goal:** all tables exist and are seeded by a single command.

- **Task 2.1 — Migration runner.** `db/run.ts` (run via `tsx`; read `db/migrations/*.sql`
  then `db/seeds/*.sql` in filename order, execute each against a connection; split on
  statement terminator; log progress). Scripts: `db:migrate`, `db:seed`, `db:setup`.
- **Task 2.2 — Core table migrations.** `db/migrations/001_create_roles.sql` …
  `008_create_progress.sql` per [database-schema.md](database-schema.md) §3 (identity PKs,
  FKs, `CHECK`, UNIQUE, indexes). Write **idempotently** (drop-if-exists guard or
  `CREATE ... ` with a documented teardown script).
- **Task 2.3 — Seeds.** `db/seeds/001_seed_roles.sql` (admin/teacher/student),
  `002_seed_admin_user.sql` (admin from env, bcrypt hash generated by a small seed helper),
  `003_seed_categories.sql` (sorting/searching/graph/grid/dynamic-programming/math/lists),
  `004_seed_algorithms.sql` (3–5 algorithms with complexities + JS/pseudocode snippets to start).
- **Task 2.4 — Verify.** Run `npm run db:setup` against Oracle XE; `SELECT` to confirm rows
  and FKs; confirm re-running is safe.
- 🎯 **DoD:** `npm run db:setup` creates + seeds cleanly on a fresh schema and is re-runnable.
- **Commit checkpoints:** `feat(db): migration runner`, `feat(db): core schema`, `feat(db): seeds`.

> **Note:** the admin password is hashed with bcrypt. Because pure SQL can't bcrypt, seeding
> the admin user is done by a tiny TypeScript seed helper (`db/seeds/seedAdmin.ts`) invoked by
> `db/run.ts`, not by raw SQL — document this in the phase plan.

---

## Phase 3 — Auth subsystem

**Goal:** users can register/login; protected routes enforce auth + role.

- **Task 3.1 — Domain.** `src/domain/entities/User.ts`, `src/domain/repositories/IUserRepository.ts`
  (`findByEmail`, `findById`, `create`). Test: entity shape.
- **Task 3.2 — Security infra.** `src/infrastructure/security/password.ts` (bcrypt hash/compare),
  `src/infrastructure/security/jwt.ts` (sign/verify). Tests: hash≠plaintext & compare; sign→verify round-trip.
- **Task 3.3 — Oracle user repo.** `src/infrastructure/database/repositories/OracleUserRepository.ts`
  (bind-variable SQL, joins `roles`). Integration test against test schema (gated).
- **Task 3.4 — Use-cases.** `application/auth/registerUser.ts`, `loginUser.ts`, `getCurrentUser.ts`.
  Unit tests with a **fake in-memory user repo** (no Oracle): duplicate email → 409; bad
  password → 401; happy paths.
- **Task 3.5 — HTTP layer.** `authValidators.ts`, `authController.ts`, `authRoutes.ts`,
  middlewares `authenticate.ts` (JWT → `req.user`) and `authorize(...roles)`. Integration
  tests (`supertest`): register→login→me; 401 without token; 403 wrong role.
- 🎯 **DoD:** full register/login/me works; protected route returns 401/403 correctly; tests green.

---

## Phase 4 — Catalog read API

**Goal:** the frontend can fetch categories and algorithm content.

- **Task 4.1 — Domain.** Entities `Category`, `Algorithm`, `Complexity`, `CodeSnippet`;
  interfaces `ICategoryRepository` (`findAll`), `IAlgorithmRepository`
  (`findAll(filters)`, `findBySlug`).
- **Task 4.2 — Oracle repos.** `OracleCategoryRepository`, `OracleAlgorithmRepository`
  (`findAll` with optional category/difficulty/search filters via bind vars; `findBySlug`
  assembling algorithm + `time_complexities` + `code_snippets`). Integration tests (gated).
- **Task 4.3 — Use-cases.** `listCategories`, `listAlgorithms`, `getAlgorithmDetail`
  (throws `AppError(404,'ALGORITHM_NOT_FOUND')`). Unit tests with fake repos.
- **Task 4.4 — HTTP layer.** `categoryController`/`categoryRoutes`,
  `algorithmController`/`algorithmRoutes` (public GETs). Integration tests: list, filter,
  detail shape matches [api-reference.md](api-reference.md), 404 for bad slug.
- 🎯 **DoD:** the three GET endpoints return correct JSON from seeded data.

---

## Phase 5 — Catalog admin CRUD

**Goal:** admins manage the catalog; writes are transactional.

- **Task 5.1 — Repo writes.** Extend category/algorithm repos with `create`/`update`/`delete`.
  Algorithm create/update wraps INSERTs into `algorithms` + `time_complexities` +
  `code_snippets` in **one transaction** (`autoCommit:false`, commit/rollback). Integration
  test: rollback leaves no partial rows.
- **Task 5.2 — Use-cases.** `manageCategory` (create/update/delete; 409 if in use),
  `manageAlgorithm` (create/update/delete; 409 on slug clash). Unit tests with fake repos.
- **Task 5.3 — HTTP layer.** `algorithmValidators.ts`; admin routes guarded by
  `authorize('admin')`. Integration tests: admin can create; student gets 403; validation 400.
- **DoD:** admin CRUD works end-to-end; non-admin blocked; transaction integrity verified.

---

## Phase 6 — User-data API (bookmarks + progress)

**Goal:** logged-in users bookmark algorithms and track progress.

- **Task 6.1 — Domain.** Entities `Bookmark`, `Progress`; `IBookmarkRepository`
  (`findByUser`, `add`, `remove`), `IProgressRepository` (`findByUser`, `upsert`).
- **Task 6.2 — Oracle repos.** `OracleBookmarkRepository` (insert idempotent on UNIQUE),
  `OracleProgressRepository` (`upsert` via Oracle `MERGE`). Integration tests (gated).
- **Task 6.3 — Use-cases.** `listBookmarks`/`addBookmark`/`removeBookmark`,
  `getProgress`/`upsertProgress` (validate status enum). Unit tests with fake repos.
- **Task 6.4 — HTTP layer.** controllers + routes (all behind `authenticate`). Integration
  tests: add/list/remove bookmark; upsert progress changes status; 401 unauthenticated.
- **DoD:** bookmarks + progress persist per user; re-bookmark idempotent; tests green.

---

## Phase 7 — Frontend migration & modularization

**Goal:** move the existing app into `frontend/` and split it into modules **without changing
behavior** (pure refactor; still runs on hardcoded data — no API yet).

- **Task 7.1 — Move files.** Relocate root `index.html` → `frontend/index.html`,
  `styles.css` → `frontend/` (temp), `js/*` → `frontend/js/` (temp). Verify it still opens & runs.
- **Task 7.2 — Split CSS.** `styles.css` → `css/{variables,base,layout,components,visualizers}.css`;
  update `<link>`s. Visual regression check (looks identical).
- **Task 7.3 — Split visualizers.** `visualizers.js` → `js/visualizers/{array,grid,graph,matrix,string,math}.js`.
- **Task 7.4 — Split algorithms.** `algorithms.js` → `js/algorithms/{sorting,searching,graph,grid,dp,math}.js`
  (step-generators only). Keep a registry mapping `slug → generator`.
- **Task 7.5 — Split app.js.** → `js/core/{engine,state}.js`, `js/ui/{sidebar,controls,codePanel}.js`,
  `js/main.js`. Fix script load order in `index.html`.
- 🎯 **DoD:** the app works exactly as before, now modular; behavior unchanged (manual regression
  against the pre-migration build). Reversibility intact.

> This phase is a refactor; if any frontend unit tests exist for step-generators, keep them green.

---

## Phase 8 — Frontend ↔ API integration

**Goal:** content comes from the backend; auth and per-user features are live.

- **Task 8.1 — API client.** `js/api/client.js` (base URL from `config.js`, JWT header from
  `localStorage`, JSON parse, error normalization), `authApi`, `algorithmsApi`,
  `bookmarksApi`, `progressApi`.
- **Task 8.2 — Catalog from API.** Replace hardcoded sidebar/content with `categoriesApi` +
  `algorithmsApi`; on select, fetch `:slug` detail, render explanation/code/Big-O, then map
  `slug`→generator and `visualizer_type`→renderer to animate.
- **Task 8.3 — Auth UI.** `pages/login.html`, `pages/register.html`, `js/ui/auth.js`; store
  JWT; restore session via `/auth/me` on load; show/hide auth-only controls.
- **Task 8.4 — Bookmarks & progress UI.** bookmark toggle + progress status control wired to
  the API; reflect state on load.
- 🎯 **DoD:** browse → open → animate works off live data; login persists; bookmark/progress
  survive refresh; admin can manage catalog from the UI (if admin UI included) or via API.

---

## Phase 9 — Integration & hardening

**Goal:** demo-ready, production-shaped.

- **Task 9.1 — Seed the full catalog.** Port the remaining algorithms from the old
  `algorithms.js` into seeds (content) + ensure each has a client-side generator.
- **Task 9.2 — E2E smoke + UX states.** Loading/empty/error states in the UI; verify CORS;
  confirm every flow in [data-flow.md](data-flow.md).
- **Task 9.3 — Verify the run-guide.** Follow [run-guide.md](run-guide.md) on a clean setup;
  fix any gaps. Confirm `.env.example` is complete.
- 🎯 **DoD:** a fresh machine can follow the run-guide to a working demo; presentation checklist
  in [presentation-guide.md](presentation-guide.md) passes.

---

## Phase 10 — Stretch (optional, only if time allows)

- `notes` table + endpoints (user 1:M notes per algorithm).
- `tags` + `algorithm_tags` (M:N) + search filtering.
- Additional code-snippet languages (python/cpp/java) in seeds.
- Rate limiting on auth routes; HTTP security headers.
- `docker-compose.yml` (Oracle XE + backend) for one-command bring-up.

---

## Milestones (demoable)

| Milestone | After phase | You can show… |
|---|---|---|
| M1 — API alive | 1 | Express boots, `/health` green |
| M2 — Data layer | 2 | seeded Oracle tables via one command |
| M3 — Secure API | 3–4 | login + catalog endpoints returning real data |
| M4 — Frontend modular | 7 | the visualizer running, now modular |
| M5 — Full stack | 8 | end-to-end: browse → animate → bookmark, off the DB |
| M6 — Demo-ready | 9 | the full presentation flow |

---

## Suggested git strategy (only when you ask to commit)

- Branch per phase off `master`: `feat/phase-1-backend-foundation`, etc.
- Commit per task (the checkpoints above); small, conventional messages.
- Merge a phase to `master` once its DoD passes.

---

## Requirement traceability

| Requirement | Satisfied in |
|---|---|
| Separate frontend & backend | Phase 0 (split), 7 (frontend), 1–6 (backend) |
| Raw HTML/CSS/JS frontend | Phases 7–8 (no build introduced) |
| Node + Express backend | Phases 1, 3–6 |
| Oracle SQL only | Phase 2 (DDL), all repos use bind-variable SQL |
| Clean Architecture | Phases 1, 3–6 (domain/application/infrastructure/interfaces) |
| Modular folder structure | Phase 0 + maintained throughout |
| Normalized (3NF) schema | Phase 2 ([database-schema.md](database-schema.md) §5) |
| Scalable / production-ready | Phase 1 (pool, config, errors), 3 (stateless JWT), 9 |

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Oracle XE setup friction (Windows) | Use the gvenzl Docker image (run-guide §1B); thin mode avoids Instant Client |
| node-oracledb CLOB handling | Fetch CLOBs as strings (`oracledb.fetchAsString=[oracledb.CLOB]`) — note in Phase 4 plan |
| Frontend regression during split (Phase 7) | Refactor in small steps; manual visual + behavior check after each split |
| bcrypt native build issues | Use `bcryptjs` (pure JS) — already chosen |
| Scope creep | `notes`/`tags`/extra languages quarantined to Phase 10 |
