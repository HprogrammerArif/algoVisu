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
| 7 | Frontend moved to `frontend/`; added `config.js` + `js/api/*` client | n/a | relative paths preserved — app still runs |
| 8 | **Account / DB-catalog page** (`frontend/account.html` + `js/account-page.js`): register/login, browse Oracle catalog, algorithm detail, bookmarks, progress | ⚠️ contract-verified, browser-unverified | additive — visualizer untouched |

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
3. **Account page (Phase 8) in a browser** — with the backend running, serve the frontend
   (`npx serve frontend -l 5500`) and open `account.html`. Register/login, browse the DB
   catalog, open an algorithm, bookmark it, set progress. The "API: online/offline" badge
   tells you if it reached the backend (check `frontend/config.js` `API_BASE_URL` + backend
   `CORS_ORIGIN`). All JS passes `node --check`; the response shapes it consumes are covered
   by the backend integration tests, but I could not click through it in a browser here.
4. If anything fails, it'll be Oracle-specific SQL/driver details in
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
- **Frontend Phase 8 — additive, not a rewrite.** The client engine has **105** hardcoded
  algorithms; the DB seeds **7**. Replacing the visualizer's catalog with the DB would *gut*
  the rich engine, so instead I added a separate **`account.html`** that exercises the full
  backend (auth + Oracle catalog + bookmarks + progress) through a real UI, and left the
  visualizer untouched (just a nav link + an optional deep-link). This is the safer and,
  given the 105-vs-7 content gap, arguably better architecture for this app. The two are
  linked: account page → "Open in Visualizer" deep-links into `index.html#<id>` for the 6
  seeded algorithms that have a client generator.

## Suggested next steps (in order)

1. Run the Oracle verification above; fix any Oracle-specific SQL if needed.
2. Click through `account.html` in a browser (step 3 above) and confirm the flows.
3. (Optional) Deeper unification: have the visualizer's own sidebar pull metadata from the
   DB for algorithms that exist there, and seed more of the 105 algorithms so bookmarks/
   progress work for all of them (Phase 9 catalog seeding).
4. (Optional) Split the large `frontend/js/*.js` into the modular layout from
   `docs/folder-structure.md` (pure refactor; do it with the app open in a browser).

## Branch / git

- Branch `feat/phase-1-backend-foundation` holds all of this (one commit per phase), pushed to
  `origin`. Merge to `master` when you're happy:
  ```bash
  git checkout master && git merge feat/phase-1-backend-foundation
  ```
