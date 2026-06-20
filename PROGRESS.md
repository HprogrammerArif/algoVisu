# PROGRESS — QuantumViz (autonomous build session)

> Snapshot written 2026-06-20 for your review. Work is on branch
> **`feat/phase-1-backend-foundation`** (pushed to GitHub). `master` is untouched, so your
> review gate is intact — nothing is merged.

## TL;DR

- **Backend Phases 1–6 are fully implemented in TypeScript** and **52 tests pass** (`vitest`),
  with a clean `tsc` typecheck — all **without needing Oracle** (the HTTP + use-case stack is
  integration-tested against in-memory fake repositories via a dependency-injected `createApp`).
- **What I could NOT verify here** (no Oracle XE / no browser in this environment): the actual
  `npm run db:setup` against Oracle, the `Oracle*Repository` SQL at runtime, the live server
  boot, and anything in a browser. That code is written and typechecked; you verify it by
  running it (steps below).
- The existing frontend app was **moved into `frontend/`** (still works as before) and a
  **backend API-client layer was added** (`frontend/js/api/*`), ready for Phase 8 wiring.

## What's done (committed on the branch)

| Phase | Scope | Tests | Notes |
|---|---|---|---|
| 1 | Backend foundation: config, AppError, asyncHandler, error handler, oracledb pool, app factory, server bootstrap | ✅ | `/api/v1/health` + 404 |
| — | **DI composition root** refactor (`createApp(deps)`) | ✅ | enables DB-free integration tests |
| 2 | DB: 8 Oracle DDL migrations (3NF) + TypeScript seeders (roles, bcrypt admin, categories, 7-algorithm catalog) + `db/run.ts` (`--setup/--migrate/--seed/--reset`) | ⚠️ typecheck only | **needs Oracle to run** |
| 3 | Auth: register/login/me, JWT, bcrypt, roles | ✅ | unit + integration |
| 4 | Catalog read: categories, algorithms list (filters) + detail | ✅ | unit + integration |
| 5 | Catalog admin CRUD (role-guarded, transactional) | ✅ | admin 201 / student 403 / 400 / 409 |
| 6 | User-data: bookmarks + progress (auth, idempotent/upsert) | ✅ | unit + integration |
| 7 | Frontend moved to `frontend/`; added `config.js` + `js/api/*` client | n/a | **conservative** — see below |

**Test/typecheck commands (run now, no DB needed):**
```bash
cd backend
npm install
npm test          # 52 passing
npm run typecheck # clean
```

## What still needs YOU to verify (Oracle / browser)

1. **Database** — install/start Oracle XE 21c, create the `quantumviz` schema
   (see `docs/run-guide.md` §1–2), set `backend/.env`, then:
   ```bash
   cd backend && npm run db:setup   # creates tables + seeds roles/admin/catalog
   ```
   This is the first time the migrations + Oracle repositories actually hit a database.
2. **Live server** — `cd backend && npm run dev`, then `curl http://localhost:3000/api/v1/health`,
   and try `POST /api/v1/auth/login` with the seeded admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
3. If anything fails, it'll be Oracle-specific SQL/driver details in
   `backend/src/infrastructure/database/repositories/*` or `backend/db/*` — the business
   logic above them is already test-covered.

## Decisions I made while you were away (flagging for review)

- **vitest + supertest** for tests (not `node:test`) — far smoother with TypeScript. One dev dep.
- **DI `createApp(deps)`** composition root — the key enabler for testing the whole stack
  without Oracle. Repos are injected (Oracle in `server.ts`, fakes in tests).
- **Seeds in TypeScript** (bind variables) instead of raw `.sql` — required for bcrypt and
  safe for CLOB code snippets. DDL stays hand-written Oracle SQL. (Docs updated to match.)
- **Repository interfaces include write methods up-front** so the interface didn't churn
  between read (Phase 4) and admin (Phase 5).
- Added **`@types/oracledb`** — oracledb does not ship its own types (corrected the two docs
  that claimed otherwise).
- **Frontend: conservative Phase 7 only.** I moved the working app into `frontend/` (relative
  paths preserved, so it still runs) and added the API client, but did **not** split the big
  JS files or wire the API into the UI — that's Phase 8 and needs a browser + running backend
  to verify, which I can't do here. Didn't want to risk breaking the working visualizer blind.

## Suggested next steps (in order)

1. Run the Oracle verification above; fix any Oracle-specific SQL if needed.
2. **Phase 8** — wire `frontend/js/api/*` into the UI: replace the hardcoded catalog with
   `QV.algorithmsApi`, add login/register pages, bookmark + progress controls. (Needs the
   backend running.)
3. Optionally split the large `frontend/js/*.js` into the modular layout from
   `docs/folder-structure.md` (pure refactor; do it with the app open in a browser).
4. Phase 9 — seed the full catalog, end-to-end smoke, polish.

## Branch / git

- Branch `feat/phase-1-backend-foundation` holds all of this (one commit per phase), pushed to
  `origin`. Merge to `master` when you're happy:
  ```bash
  git checkout master && git merge feat/phase-1-backend-foundation
  ```
