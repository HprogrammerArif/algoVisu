# Folder Structure — QuantumViz

> The full repository layout after the full-stack migration, with the purpose of each
> folder. Frontend and backend are fully separate. The **backend is TypeScript**; the
> **frontend stays vanilla JavaScript**. See [architecture.md](architecture.md) for the
> layering rationale.

---

## 1. Repository root

```
algoVisu/
├── frontend/                  # static site (presentation tier) — vanilla JS, no build, no npm
├── backend/                   # Node + Express API in TypeScript (application tier)
├── docs/                      # all project documentation
├── CLAUDE.md                  # project rules for Claude Code
├── CLAUDE-DEV-GUIDE.md        # personal Claude Code cheat sheet (not project arch)
└── README.md                  # overview + quick start
```

> During migration, the current root `index.html`, `styles.css`, and `js/` move into
> `frontend/` (see the migration note in the design spec).

---

## 2. `frontend/` — presentation tier (vanilla JavaScript)

```
frontend/
├── index.html                 # main workspace shell (sidebar / canvas / right drawer)
├── pages/
│   ├── login.html             # login form
│   └── register.html          # registration form
├── css/                       # styles.css split into focused files
│   ├── variables.css          # CSS custom properties (theme: --neon-green, --mono, …)
│   ├── base.css               # resets, typography, CRT overlay
│   ├── layout.css             # topbar / workspace / sidebar / drawer layout
│   ├── components.css         # buttons, pills, panels, inputs
│   └── visualizers.css        # per-visualizer styling
├── js/
│   ├── core/
│   │   ├── engine.js          # playback loop + reversible step cursor (from app.js)
│   │   └── state.js           # central app state
│   ├── visualizers/           # one renderer per type (from visualizers.js)
│   │   ├── array.js
│   │   ├── grid.js
│   │   ├── graph.js
│   │   ├── matrix.js
│   │   ├── string.js
│   │   └── math.js
│   ├── algorithms/            # client-side reversible step-generators (from algorithms.js)
│   │   ├── sorting.js
│   │   ├── searching.js
│   │   ├── graph.js
│   │   ├── grid.js
│   │   ├── dp.js
│   │   └── math.js
│   ├── api/                   # NEW: talks to the backend
│   │   ├── client.js          # fetch wrapper: base URL, JWT header, error normalization
│   │   ├── authApi.js
│   │   ├── algorithmsApi.js
│   │   ├── bookmarksApi.js
│   │   └── progressApi.js
│   ├── ui/                    # DOM glue
│   │   ├── sidebar.js         # category filter + algorithm list
│   │   ├── controls.js        # playback buttons + speed slider
│   │   ├── codePanel.js       # code/explanation/complexity panels
│   │   └── auth.js            # login/register/session UI
│   └── main.js                # entry point: wires API → state → UI (was app.js)
├── config.js                  # API_BASE_URL and other client config
└── README.md                  # how to serve the frontend
```

**Frontend stays raw** — vanilla JS, no TypeScript, no bundler, no npm, no build step.

**Loading order in `index.html`** (later depends on earlier): `config.js` → `js/api/*`
→ `js/algorithms/*` → `js/visualizers/*` → `js/core/*` → `js/ui/*` → `js/main.js`.

**Key idea:** `js/algorithms/` holds the animation *logic* (pure step-generators); the
algorithm *content* (text, Big-O, code listing) comes from the API via `js/api/`. They
meet at the algorithm `slug`.

---

## 3. `backend/` — application tier (TypeScript, Clean Architecture)

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts           # loads & validates .env, exposes typed AppConfig
│   │   └── database.ts        # oracledb pool settings (connectString, pool sizes)
│   │
│   ├── domain/                # INNER, PURE — no Express, no Oracle
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Category.ts
│   │   │   ├── Algorithm.ts
│   │   │   ├── Complexity.ts
│   │   │   ├── CodeSnippet.ts
│   │   │   ├── Bookmark.ts
│   │   │   └── Progress.ts
│   │   └── repositories/      # interface contracts (real TS interfaces — what, not how)
│   │       ├── IUserRepository.ts
│   │       ├── ICategoryRepository.ts
│   │       ├── IAlgorithmRepository.ts
│   │       ├── IBookmarkRepository.ts
│   │       └── IProgressRepository.ts
│   │
│   ├── application/           # use-cases (one action per file)
│   │   ├── auth/
│   │   │   ├── registerUser.ts
│   │   │   ├── loginUser.ts
│   │   │   └── getCurrentUser.ts
│   │   ├── categories/
│   │   │   ├── listCategories.ts
│   │   │   └── manageCategory.ts
│   │   ├── algorithms/
│   │   │   ├── listAlgorithms.ts
│   │   │   ├── getAlgorithmDetail.ts
│   │   │   └── manageAlgorithm.ts
│   │   ├── bookmarks/
│   │   │   ├── listBookmarks.ts
│   │   │   ├── addBookmark.ts
│   │   │   └── removeBookmark.ts
│   │   └── progress/
│   │       ├── getProgress.ts
│   │       └── upsertProgress.ts
│   │
│   ├── infrastructure/        # OUTER — concrete implementations
│   │   ├── database/
│   │   │   ├── connection.ts  # creates/closes the oracledb pool
│   │   │   └── repositories/  # implement domain/repositories interfaces
│   │   │       ├── OracleUserRepository.ts
│   │   │       ├── OracleCategoryRepository.ts
│   │   │       ├── OracleAlgorithmRepository.ts
│   │   │       ├── OracleBookmarkRepository.ts
│   │   │       └── OracleProgressRepository.ts
│   │   ├── security/
│   │   │   ├── jwt.ts          # sign/verify tokens
│   │   │   └── password.ts     # bcrypt hash/compare
│   │   └── logger/
│   │       └── logger.ts
│   │
│   ├── interfaces/
│   │   └── http/              # the web boundary
│   │       ├── controllers/
│   │       │   ├── authController.ts
│   │       │   ├── categoryController.ts
│   │       │   ├── algorithmController.ts
│   │       │   ├── bookmarkController.ts
│   │       │   └── progressController.ts
│   │       ├── routes/
│   │       │   ├── index.ts           # mounts all routers under /api/v1
│   │       │   ├── authRoutes.ts
│   │       │   ├── categoryRoutes.ts
│   │       │   ├── algorithmRoutes.ts
│   │       │   ├── bookmarkRoutes.ts
│   │       │   └── progressRoutes.ts
│   │       ├── middlewares/
│   │       │   ├── authenticate.ts    # verify JWT → req.user
│   │       │   ├── authorize.ts       # role check
│   │       │   ├── validate.ts        # run express-validator results
│   │       │   └── errorHandler.ts    # AppError → uniform JSON
│   │       └── validators/
│   │           ├── authValidators.ts
│   │           └── algorithmValidators.ts
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   └── utils/
│   │       └── asyncHandler.ts        # wrap async controllers → forward errors
│   │
│   ├── app.ts                 # build the Express app (middleware + routes)
│   └── server.ts              # composition root: config → pool → repos → use-cases → listen
│
├── db/
│   ├── migrations/            # ordered Oracle DDL (001_…, 002_…) — plain .sql
│   ├── seeds/                 # seed roles, admin (seedAdmin.ts), categories, algorithms
│   └── run.ts                 # apply migrations + seeds in order (run via tsx)
│
├── tests/
│   ├── unit/                  # use-cases with fake in-memory repositories (vitest)
│   └── integration/           # routes via supertest against a test schema (vitest)
│
├── dist/                      # tsc build output (git-ignored)
├── .env.example              # documents required env vars (no secrets)
├── .gitignore                # node_modules, dist, .env, logs
├── tsconfig.json             # TypeScript compiler config (strict)
├── package.json
└── README.md                 # how to install, configure, run, test the backend
```

> **TypeScript notes:** source is `src/**/*.ts`; `tsc` compiles to `dist/` (git-ignored).
> Dev runs straight from TS via `tsx` (no manual compile); tests run via `vitest`. Repository
> *interfaces* in `domain/repositories/` are real TS `interface`s, so the compiler enforces
> that each `Oracle*Repository` implements its contract.

---

## 4. `docs/` — documentation

```
docs/
├── architecture.md            # high-level architecture + tech stack + layers
├── data-flow.md               # request/response & sequence flows
├── database-schema.md         # tables, constraints, ER diagram, normalization
├── folder-structure.md        # this file
├── api-reference.md           # endpoints, payloads, status codes
├── run-guide.md               # how to install/run everything (incl. Oracle XE)
├── presentation-guide.md      # demo script + requirement mapping
├── implementation-plan.md     # phased build plan
└── superpowers/
    ├── specs/
    │   └── 2026-06-19-quantumviz-fullstack-design.md   # master design spec
    └── plans/
        └── 2026-06-19-phase-1-backend-foundation.md    # detailed executable phase plan
```

---

## 5. What goes where — quick rules

| If you're adding… | Put it in… |
|---|---|
| A new SQL table | `backend/db/migrations/NNN_*.sql` (+ entity + repo interface + Oracle repo) |
| A new business action | `backend/src/application/<feature>/<action>.ts` |
| A new endpoint | controller + route under `backend/src/interfaces/http/` (`.ts`) |
| Raw SQL | only inside `backend/src/infrastructure/database/repositories/` |
| A new visualizer type | `frontend/js/visualizers/<type>.js` + a CSS block |
| A new algorithm's animation | `frontend/js/algorithms/<category>.js` (step-generator) + seed row in DB |
| New theme styling | the matching `frontend/css/*.css` file |
