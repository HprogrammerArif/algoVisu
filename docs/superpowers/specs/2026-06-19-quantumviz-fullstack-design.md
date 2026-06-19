# QuantumViz — Full-Stack Architecture Design Spec

- **Date:** 2026-06-19
- **Status:** Approved (design)
- **Author:** QuantumViz team (university IDP project)
- **Supersedes:** the original static-only architecture described in the first `CLAUDE.md`.

---

## 1. Purpose & context

QuantumViz is an **algorithm visualization platform** for teaching and learning. A
student or teacher selects an algorithm (searching, sorting, graph, etc.) and gets:

- a **reversible visual animation** (step forward *and* backward — a time-travel debugger),
- a written **explanation**,
- the **source code** (one or more languages),
- **time & space complexity**, and
- supporting metadata (category, difficulty, tags).

This was originally a single static front-end app. The university IDP requirements now
mandate a **separated frontend and backend** with a real database. This spec defines the
new full-stack architecture.

### University requirements (must satisfy)

| Requirement | How this design satisfies it |
|---|---|
| Separate frontend & backend | Two independent deployables: `frontend/` (static) and `backend/` (Node/Express API). |
| Frontend uses raw code (HTML/CSS/JS, no React/Next) | Vanilla HTML/CSS/JS, no framework, no build step. |
| Backend: Node.js + Express.js | Express REST API under `/api/v1`. |
| Database: Oracle (Oracle SQL only) | Oracle XE 21c via `node-oracledb`; all DDL/DML hand-written Oracle SQL. |
| Clean Architecture | Pragmatic layered Clean Architecture (domain → application → interfaces, with infrastructure implementing domain interfaces). |
| Modular folder structure | Feature-modular layers on the backend; per-type modules on the frontend. |
| Scalable & production-ready | Connection pooling, stateless JWT, env config, central error handling, API versioning, layered/testable code. |
| Normalized schema | 3NF relational schema (see `docs/database-schema.md`). |

---

## 2. Key design decisions

### 2.1 Backend role: content + identity API
The backend owns the **algorithm catalog** (categories, algorithms, explanations,
complexity, code snippets) and **users** (admin / teacher / student) plus user-generated
data (bookmarks, learning progress). It does **not** run the visualization.

### 2.2 The core seam: content in the DB, logic in the client
The single most important architectural decision:

- The **database stores _what to teach_**: algorithm metadata, explanation text,
  Big-O values, and the source-code *text*.
- The **frontend keeps _how to animate_**: the reversible step-generators and the
  visualizer renderers. These must run client-side because the time-travel debugger
  needs every intermediate state available locally and instantly — you would never
  round-trip to Oracle for each animation frame.

They are joined by a stable **`slug`** on each algorithm plus a **`visualizer_type`**.
When the frontend loads `/api/v1/algorithms/binary-search`, it uses the `slug` to look up
the matching client-side step-generator and the `visualizer_type` to pick the renderer.

This keeps the backend a clean content/identity API and keeps the visualization fast and
fully reversible.

### 2.3 Backend architecture style: pragmatic Clean Architecture
Layered with dependency inversion at the data boundary:

```
interfaces (HTTP) ─► application (use-cases) ─► domain (entities + repo interfaces)
                                                      ▲
infrastructure (Oracle repos, JWT, bcrypt) ───────────┘  implements domain interfaces
```

- **Language:** the backend is written in **TypeScript (strict)** — dev via `tsx`, built with
  `tsc` → `dist/`. Repository contracts in `domain/repositories/` are real TS `interface`s,
  so the compiler enforces that each Oracle repository satisfies its contract.
- **Dependency rule:** nothing in an inner layer imports an outer layer.
- **Composition root:** `server.ts` injects Oracle repository implementations into the
  use-cases. Unit tests inject fake in-memory repositories instead.

### 2.4 Auth: JWT, three roles
- Roles: `admin`, `teacher`, `student`.
- Stateless JWT (`Authorization: Bearer <token>`). `authenticate` middleware verifies the
  token; `authorize(role)` middleware enforces role on protected routes.
- Passwords hashed with bcrypt (`bcryptjs`, pure-JS, no native build on Windows).

### 2.5 Frontend: keep & modularize the existing engine
Reuse the existing visualization engine. Split the three large files
(`algorithms.js`, `visualizers.js`, `app.js`) and the single `styles.css` into modular
files, and add an **API client layer** so algorithm *content* arrives from the backend
instead of being hardcoded. No framework, no build step is introduced.

### 2.6 Styling: keep the custom cyberpunk CSS
Reuse the existing neon/CRT theme and CSS custom properties; just reorganize `styles.css`
into modular files. No Tailwind.

---

## 3. High-level architecture

```
┌────────────────┐   REST/JSON over HTTP    ┌──────────────────┐   node-oracledb   ┌────────────┐
│   FRONTEND     │  ───────────────────►    │     BACKEND      │  (thin mode)      │  ORACLE XE │
│ static site    │   JWT Bearer auth        │ Node + Express   │  ───────────────► │   21c      │
│ HTML/CSS/JS    │  ◄───────────────────    │ Clean Arch API   │  ◄─────────────── │  (local)   │
│ viz engine     │                          │ /api/v1/...      │   conn. pool      │ XEPDB1     │
└────────────────┘                          └──────────────────┘                   └────────────┘
```

- **frontend/** — static; served by any static server (Live Server, `python -m http.server`, `npx serve`). Talks to the API via `fetch`. Stores JWT in `localStorage`.
- **backend/** — Node + Express REST API. Clean Architecture layers. `node-oracledb` thin mode → Oracle XE. Stateless JWT.
- **Oracle XE 21c** — local (native install or Docker). App connects to the `XEPDB1` pluggable DB with a dedicated app schema/user. SQL migrations + seed scripts live in `backend/db/`.

See `docs/architecture.md` for full detail.

---

## 4. Database schema (summary)

Normalized to 3NF. Core tables:

- `roles` — admin/teacher/student
- `users` — FK→roles
- `categories`
- `algorithms` — FK→categories; holds `slug`, `visualizer_type`, `difficulty`, `description` (CLOB), `space_complexity`
- `time_complexities` — FK→algorithms; one row per `case_type` (best/avg/worst)
- `code_snippets` — FK→algorithms; one row per `language`
- `bookmarks` — users M:N algorithms
- `progress` — users M:N algorithms, with `status`

Optional stretch: `notes`, `tags` + `algorithm_tags`.

Full columns, constraints, ER diagram, and normalization justification: `docs/database-schema.md`.

---

## 5. API surface (v1, summary)

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Categories | `GET /categories`; admin `POST/PUT/DELETE /categories/:id` |
| Algorithms | `GET /algorithms`, `GET /algorithms/:slug`; admin `POST/PUT/DELETE /algorithms/:id` |
| Bookmarks | `GET /bookmarks`, `POST /bookmarks`, `DELETE /bookmarks/:algorithmId` |
| Progress | `GET /progress`, `PUT /progress/:algorithmId` |

Full request/response shapes and status codes: `docs/api-reference.md`.

---

## 6. Folder structure (summary)

- `backend/src/{config,domain,application,infrastructure,interfaces,shared}` + `backend/db/{migrations,seeds}` + `backend/tests`
- `frontend/{index.html,pages,css,js/{core,visualizers,algorithms,api,ui},config.js}`

Full tree with the role of each folder: `docs/folder-structure.md`.

---

## 7. Non-functional / production-readiness

- **Connection pooling** via `oracledb.createPool` (configurable min/max).
- **Config** via `.env` (never commit secrets); `.env.example` checked in.
- **API versioning** (`/api/v1`) for forward compatibility.
- **Stateless JWT** → horizontally scalable (no server session state).
- **Central error handling** → uniform `{ error: { code, message } }`.
- **Input validation** at the HTTP boundary.
- **Layered, dependency-inverted** code → unit-testable use-cases.

---

## 8. Testing strategy

- **Backend unit tests** (`vitest`): use-cases with fake in-memory repositories.
- **Backend integration tests** (`vitest` + `supertest`): routes against a test schema.
- **Frontend (optional):** the step-generators are pure functions and can be unit-tested
  in Node; UI verified manually + smoke checks.

---

## 9. Scope & out-of-scope

**In scope:** catalog API, auth + roles, bookmarks, progress, the migrated/modularized
frontend engine wired to the API, full documentation set, phased implementation plan.

**Out of scope (YAGNI for this IDP):** classes/courses/assignments/quizzes, real-time
collaboration, payment, server-side rendering of the visualization.

**Optional stretch (only if time allows):** `notes`, `tags` search, multi-language code
snippets beyond the seeded set, rate limiting, Docker Compose for one-command bring-up.

---

## 10. Migration note (existing → new)

The current root files move into `frontend/` and are split:

- `js/algorithms.js` → `frontend/js/algorithms/*` (step-generators only) — content moves to DB seeds.
- `js/visualizers.js` → `frontend/js/visualizers/*`.
- `js/app.js` → `frontend/js/core/*` + `frontend/js/ui/*` + `frontend/js/main.js`.
- `styles.css` → `frontend/css/*`.
- `index.html` → `frontend/index.html` (+ new `pages/login.html`, `pages/register.html`).

Detailed phasing in `docs/implementation-plan.md`.
