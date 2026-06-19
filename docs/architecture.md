# Architecture — QuantumViz

> High-level architecture, components, technology stack, and the principles behind the
> design. For data flow see [data-flow.md](data-flow.md); for the schema see
> [database-schema.md](database-schema.md); for the tree see
> [folder-structure.md](folder-structure.md).

---

## 1. System overview

QuantumViz is split into three independent tiers:

```
┌──────────────────────────┐        ┌──────────────────────────┐        ┌────────────────────┐
│        FRONTEND          │        │         BACKEND          │        │      DATABASE      │
│  (presentation tier)     │        │   (application tier)     │        │    (data tier)     │
│                          │  HTTP  │                          │  SQL   │                    │
│  HTML + CSS + vanilla JS │ ─────► │  Node.js + Express       │ ─────► │  Oracle XE 21c     │
│  reversible viz engine   │ JSON   │  Clean Architecture API  │ oracle │  XEPDB1 + app      │
│  static, no build step   │ ◄───── │  /api/v1  (JWT auth)     │ ◄───── │  schema            │
└──────────────────────────┘  JWT   └──────────────────────────┘  pool  └────────────────────┘
```

Each tier can be developed, run, and reasoned about independently. The frontend knows the
backend only through its REST contract; the backend knows Oracle only through repository
interfaces.

---

## 2. Technology stack

### Frontend (presentation tier)
| Concern | Choice |
|---|---|
| Markup | HTML5 (semantic, single-page workspace + auth pages) |
| Styling | Vanilla CSS with custom properties (the cyberpunk/CRT theme) |
| Logic | Vanilla JavaScript (ES2020+), no framework, no bundler |
| HTTP | `fetch` API via a thin client layer |
| Auth storage | JWT in `localStorage` |
| Serving | Any static server (VS Code Live Server, `python -m http.server`, `npx serve`) |

**No build step, no npm on the frontend** — this is a hard project rule.

### Backend (application tier)
| Concern | Choice |
|---|---|
| Language | **TypeScript** (strict mode) |
| Runtime | Node.js (LTS, ≥ 18) |
| Framework | Express.js |
| Build / dev | `tsc` → `dist/` (production build) · `tsx` (dev/watch, runs TS directly) |
| DB driver | `node-oracledb` (v6+, **thin mode** — no Instant Client needed; ships its own types) |
| Auth | `jsonwebtoken` (JWT) + `bcryptjs` (password hashing) |
| Validation | `express-validator` (HTTP-boundary input validation) |
| Config | `dotenv` |
| CORS | `cors` |
| HTTP logging | `morgan` (optional) |
| Tests | `vitest` (TS-native runner) + `supertest` (integration) |

### Database (data tier)
| Concern | Choice |
|---|---|
| Engine | Oracle Database 21c Express Edition (XE) |
| Target | Pluggable DB `XEPDB1`, dedicated app schema |
| Access | `node-oracledb` connection pool |
| Schema mgmt | Hand-written Oracle SQL migrations + seed scripts in `backend/db/` |

---

## 3. Backend: Clean Architecture layers

The backend follows a **pragmatic Clean Architecture**: concentric layers where
dependencies only point inward, and the database is hidden behind interfaces so it is
swappable and the business logic is testable in isolation.

```
        ┌─────────────────────────────────────────────────────────┐
        │  interfaces/http   (controllers, routes, middlewares)    │   outer
        │  ┌───────────────────────────────────────────────────┐  │
        │  │  application   (use-cases / services)              │  │
        │  │  ┌─────────────────────────────────────────────┐  │  │
        │  │  │  domain  (entities + repository interfaces)  │  │  │   inner / pure
        │  │  └─────────────────────────────────────────────┘  │  │
        │  └───────────────────────────────────────────────────┘  │
        └─────────────────────────────────────────────────────────┘
           infrastructure (Oracle repo impls, jwt, bcrypt, pool)
                          implements domain interfaces ▲
```

| Layer | Responsibility | Knows about | Must NOT know about |
|---|---|---|---|
| **domain** | Entities (plain data) + repository **interfaces** (contracts). Pure business types. | Nothing external | Express, Oracle, JWT |
| **application** | Use-cases: one action each (`loginUser`, `listAlgorithms`…). Orchestrates repositories via their interfaces. | domain | Express, Oracle |
| **interfaces/http** | Translate HTTP ⇄ use-cases: controllers, routes, middlewares (`authenticate`, `authorize`, `validate`, `errorHandler`). | application, domain | Oracle internals |
| **infrastructure** | Concrete implementations: `Oracle*Repository`, connection pool, JWT signing, bcrypt. Implements domain interfaces. | domain (to implement), oracledb | — |
| **config / shared** | Env loading, constants; cross-cutting errors & utils. | — | — |

### The dependency rule
Inner layers never import outer layers. The domain doesn't import Oracle; instead the
domain *declares* `IAlgorithmRepository` (a real TypeScript `interface`), and
`infrastructure` *implements* it — the compiler enforces that the Oracle repository
satisfies the contract. This is **dependency inversion** — the reason the design is "clean"
and testable.

### Composition root
`src/server.ts` is the only place that wires concrete classes together:

```
1. load config (.env)
2. create the oracledb connection pool
3. construct Oracle repositories (with the pool)
4. inject those repositories into the use-cases
5. mount controllers/routes onto the Express app
6. start listening
```

In tests, steps 2–4 are replaced with fake in-memory repositories — no Oracle required for
unit tests.

---

## 4. Components

### 4.1 Frontend components
- **Viz engine (`js/core`)** — playback loop, app state, the reversible step cursor.
- **Visualizers (`js/visualizers`)** — one renderer per type: array, grid, graph, matrix, string, math.
- **Step-generators (`js/algorithms`)** — pure functions that produce the ordered list of reversible states for an algorithm.
- **API client (`js/api`)** — `client.js` (fetch wrapper + JWT header + error normalization) and per-resource modules (`authApi`, `algorithmsApi`, `bookmarksApi`, `progressApi`).
- **UI glue (`js/ui`)** — sidebar, controls, code panel, auth forms.

### 4.2 Backend components (by feature module)
- **auth** — register, login, current-user; JWT issue/verify; bcrypt.
- **categories** — list (public) + admin CRUD.
- **algorithms** — list & detail (public, joins complexity + code snippets) + admin CRUD.
- **bookmarks** — per-user add/list/remove.
- **progress** — per-user upsert/list of learning status.

Each feature appears consistently across layers (entity → repository interface → Oracle
repository → use-cases → controller → routes).

---

## 5. Cross-cutting concerns

| Concern | Approach |
|---|---|
| **Auth** | JWT bearer; `authenticate` populates `req.user`; `authorize(...roles)` guards routes. |
| **Errors** | `AppError(statusCode, code, message)` thrown anywhere → central `errorHandler` returns `{ error: { code, message } }`. |
| **Validation** | `express-validator` chains + a `validate` middleware reject bad input with 400 before controllers run. |
| **Config** | All secrets/connection details in `.env`; `config/index.ts` validates & exposes them. |
| **DB access** | All SQL lives in `infrastructure/database/repositories`; the rest of the app never sees `oracledb`. |
| **Logging** | `morgan` for HTTP; a small logger util for app events. |
| **CORS** | `cors` configured to allow the frontend origin. |

---

## 6. Why this is scalable & production-ready

- **Stateless backend (JWT)** → run multiple instances behind a load balancer; no sticky sessions.
- **Connection pooling** → bounded, reused Oracle connections under load.
- **Versioned API (`/api/v1`)** → evolve without breaking clients.
- **Layered + dependency-inverted** → features added in isolation; logic unit-tested without a DB.
- **Config-driven** → same code runs in dev/test/prod by changing `.env`.
- **Clear seams** → frontend, backend, and DB evolve independently behind stable contracts.

---

## 7. Constraints & rules (carried into implementation)

- Frontend: vanilla HTML/CSS/JS only. No React/Next, no TypeScript, no bundler, no npm.
- Backend: **TypeScript** (strict) on Node + Express; Oracle SQL only (no other DB, no ORM that hides SQL — raw SQL via `node-oracledb`).
- Keep the existing visual identity (neon-on-dark, monospace, CSS variables).
- Visualizations stay reversible (forward + backward).
