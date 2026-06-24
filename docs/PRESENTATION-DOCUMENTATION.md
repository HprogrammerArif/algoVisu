# QuantumViz — Complete Project Documentation (Presentation Guide)

> A single, self-contained walkthrough of the whole system — architecture, backend, frontend,
> database, and every algorithm — written to be presented to a viva / evaluation board.
> Deep-dive companions: [architecture.md](architecture.md), [database-schema.md](database-schema.md),
> [api-reference.md](api-reference.md), [data-flow.md](data-flow.md),
> [folder-structure.md](folder-structure.md), [run-guide.md](run-guide.md).

---

## 1. What the project is

**QuantumViz** is a full-stack **algorithm visualization platform** for teaching and learning.
A user picks an algorithm and gets:

- a **reversible visual animation** (step forward *and* backward — a time-travel debugger),
- a written **explanation** (short summary + an in-depth, multi-section "Explain" panel),
- the **source code** (JavaScript + pseudocode),
- **time & space complexity** (best / average / worst), and
- the ability to **register, log in, bookmark, and track progress**.

It is a **university IDP project** built as **three separate tiers**:

```
  Frontend (static site)  ⇄  Backend (REST API)  ⇄  Oracle XE database
  vanilla HTML/CSS/JS         Node.js + Express        node-oracledb (raw SQL)
```

### The central design idea — "the seam"

The system cleanly splits **what to teach** from **how to animate**:

| Stored in the **database** ("what to teach") | Lives in the **frontend** ("how to animate") |
|---|---|
| name, summary, description, difficulty | the reversible **step-generator** for each algorithm |
| Big-O (best/avg/worst), space complexity | the **visualizer** that draws each step |
| code snippets, the 5 explanation sections | the interactive controls (play, step, speed) |

They are joined by each algorithm's **`slug`** (e.g. `binary-search`). The browser fetches the
metadata from the API, then looks up the matching generator by slug and animates it locally.
This is why the visualization can be reversible and interactive (it runs client-side) while the
content is centrally managed in Oracle.

---

## 2. Technology stack

| Tier | Technology | Notes |
|---|---|---|
| Frontend | **HTML, CSS, vanilla JavaScript** | No React/Next, no TypeScript, **no build step**, no npm. Talks to the API with `fetch`. |
| Backend | **TypeScript (strict) · Node.js · Express** | Pragmatic **Clean Architecture**. JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`). |
| Database | **Oracle XE 21c** via **`node-oracledb`** (thin mode) | **Oracle SQL only**, raw SQL via **bind variables** (no ORM). Normalized to **3NF**. |
| Dev/test | `tsx` (run TS), `tsc` (build/typecheck), **`vitest` + `supertest`** | 61 automated backend tests. |

---

## 3. Architecture & the request lifecycle

The backend follows **Clean Architecture**: dependencies point **inward**, and inner layers never
import outer ones.

```
interfaces/http  (controllers, routes, middleware, validators)   ← HTTP details
      │ calls
application      (use-cases: the business logic)                 ← orchestration
      │ depends on interfaces of
domain           (entities + repository INTERFACES)              ← pure core, no I/O
      ▲ implemented by
infrastructure   (Oracle repositories, JWT, bcrypt)              ← the only place with SQL
```

**A request's journey** (e.g. open an algorithm):

```
Browser  ──fetch GET /api/v1/algorithms/binary-search──►
  Express middleware (cors → json → logging)
  → Route → Controller (interfaces/http)        translate HTTP → call use-case
  → getAlgorithmDetail use-case (application)    business logic
  → IAlgorithmRepository.findBySlug (domain interface)
  → OracleAlgorithmRepository (infrastructure)   the ONLY layer that runs SQL (bind variables)
  → Oracle XE                                    returns rows
  ◄─ rows → entity → JSON ─────────────────────  back out to the browser
```

If anything throws an `AppError`, a central error handler returns a uniform
`{ error: { code, message } }` with the right HTTP status.

**Why this matters (talking point):** the business logic (use-cases) can be unit-tested with
**fake repositories** — no database needed — which is exactly how the test suite runs. SQL is
isolated to one layer, so the database could be swapped without touching business rules.

---

## 4. Repository structure

```
algoVisu/
├── frontend/                      # Tier 1 — static site (no build)
│   ├── index.html                 # the visualizer workspace
│   ├── account.html               # auth + bookmarks + progress + DB catalog
│   ├── styles.css                 # theme (CSS variables: dark + light)
│   ├── config.js                  # API base URL
│   └── js/
│       ├── theme.js               # light/dark theme controller (shared)
│       ├── algorithms.js          # the 15 step-generators + ALGO_REGISTRY (slug → generator)
│       ├── visualizers.js         # 6 drawing engines (array/grid/graph/matrix/string/math)
│       ├── app.js                 # controller: fetch catalog, playback engine, detail panel, Explain modal
│       ├── deep-link.js           # open index.html#<slug> directly
│       └── api/                   # thin fetch client + per-resource API wrappers
│           ├── client.js          # base URL, JWT header, JSON/error handling
│           ├── algorithmsApi.js   # categories + algorithm list/detail
│           ├── authApi.js · bookmarksApi.js · progressApi.js
│
├── backend/                       # Tier 2 — REST API (TypeScript)
│   ├── src/
│   │   ├── domain/                # entities + repository interfaces (pure core)
│   │   ├── application/           # use-cases (business logic)
│   │   ├── infrastructure/        # Oracle repositories, JWT, bcrypt (SQL lives here)
│   │   ├── interfaces/http/       # controllers, routes, middleware, validators
│   │   ├── config/  · shared/     # env config; AppError, asyncHandler
│   │   ├── app.ts · server.ts     # Express app + bootstrap (creates the Oracle pool)
│   │   └── types/
│   ├── db/
│   │   ├── migrations/*.sql        # Oracle DDL (001…009) — hand-written
│   │   ├── seeds/*.ts              # data seeders (bind variables) + the catalog/explanation datasets
│   │   └── run.ts                  # applies migrations + seeds
│   └── tests/                      # vitest unit + supertest integration
│
└── docs/                          # all project documentation (this file lives here)
```

---

## 5. Backend in detail

### 5.1 Layers (one responsibility each)
- **domain/entities** — plain data shapes (`Algorithm`, `User`, `Category`, `Bookmark`, `Progress`).
- **domain/repositories** — *interfaces* like `IAlgorithmRepository` (no SQL, just method signatures).
- **application** — use-cases: `listAlgorithms`, `getAlgorithmDetail`, `registerUser`, `loginUser`,
  `addBookmark`, `upsertProgress`, `manageAlgorithm`, etc. Pure logic; depends only on interfaces.
- **infrastructure** — `OracleAlgorithmRepository` (and friends) implement those interfaces with raw
  Oracle SQL + bind variables; `jwt.ts` and `password.ts` wrap signing and bcrypt.
- **interfaces/http** — Express controllers/routes; middleware for `authenticate`, `authorize(role)`,
  `validate(input)`, and the central `errorHandler`.

### 5.2 Database (Oracle, 3NF)
Eight tables (see [database-schema.md](database-schema.md) for full DDL):
`roles`, `users`, `categories`, `algorithms`, `time_complexities`, `code_snippets`,
**`algorithm_explanations`**, `bookmarks`, `progress`.

Key design choices to mention:
- **Time complexity is its own table** (`time_complexities`, one row per best/avg/worst) — a clean
  3NF decision because it genuinely varies per case.
- **Code snippets and explanation sections are child tables** (one row per language / per section),
  so adding a language or a section never changes the `algorithms` table.
- **CHECK constraints** model enums (`visualizer_type`, `difficulty`, `case_type`, `status`, …).
- **`slug` is UNIQUE** — it is the join key to the frontend generator.
- User-data FKs (`bookmarks`, `progress`) **cascade on delete**.

### 5.3 API surface (base `…/api/v1`)
Public: `GET /categories`, `GET /algorithms` (filter by `category`/`difficulty`/`search`),
`GET /algorithms/:slug` (full detail incl. `timeComplexities`, `codeSnippets`, **`explanation`**).
Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
Per-user (🔒): `GET/POST/DELETE /bookmarks`, `GET/PUT /progress`.
Admin (👑): create/update/delete `categories` and `algorithms`.
Full contract in [api-reference.md](api-reference.md).

### 5.4 Auth
`register` hashes the password with **bcrypt**; `login` verifies it and returns a **JWT**
(`{ sub: userId, role }`). The frontend stores the token in `localStorage` and sends it as
`Authorization: Bearer <jwt>`; `authenticate` decodes it and `authorize('admin')` guards admin routes.

### 5.5 Seeding
`db/run.ts` applies the `.sql` migrations, then runs the TypeScript seeders in order:
roles → admin user → categories → **catalog (15 algorithms)** → **explanations (5 sections each)**.
Seeders use **bind variables** (safe for CLOB code/explanations and bcrypt hashing). The catalog
dataset is `catalogData.ts`; the explanation dataset is `explanationsData.ts`.

---

## 6. Frontend in detail

### 6.1 No build step
Plain HTML/CSS/JS loaded via `<script>` tags; modules share state through a global `window.QV`
namespace. This satisfies the "raw front-end code" requirement and keeps the project trivially
servable as static files.

### 6.2 Boot & data flow ("loading from the backend")
1. On load, `app.js` calls `GET /categories` and `GET /algorithms` → renders the sidebar list and
   category filters (with loading / error / empty states).
2. Selecting an algorithm calls `GET /algorithms/:slug` → fills the **detail panel** (name,
   difficulty, summary, best/avg/worst + space complexity, description, code snippet tabs).
3. `app.js` looks up the generator in **`ALGO_REGISTRY[slug]`**, runs it to produce a full list of
   **step snapshots**, and drives the playback engine.
4. The **`visualizer_type`** from the DB selects which of the 6 drawing engines renders each step.

### 6.3 The reversible playback engine (the clever bit)
Each generator `yield`s small step objects (`{ type:'compare', i, j, … }`). `app.js` runs the
generator to completion up-front, storing a **complete snapshot of state at every step** in a
`steps[]` array. Playback is then just moving an index through that array — so stepping **backward**
is as cheap and exact as stepping forward (true time-travel). Speed, play/pause, and reset all
operate on this index. *(Talking point: reversibility falls out of snapshotting state per step,
rather than trying to "invert" each operation.)*

### 6.4 The six visualizers
`array` (sorting/searching bars), `grid` (2D pathfinding with paintable walls + draggable
start/end), `graph` (SVG nodes/edges, draggable, weighted), `matrix` (DP tables), `string`
(sliding pattern matcher), `math` (Sieve grid / Tower of Hanoi pegs). New algorithm = new
generator + a DB row; no new visualizer needed if it reuses a type.

### 6.5 Theming (light + dark)
All colours are CSS variables defined twice — `:root[data-theme="dark"]` (neon-on-dark identity)
and `:root[data-theme="light"]` (a clean "daylight" palette). `theme.js` reads
`localStorage('qv_theme')`, defaults to the OS `prefers-color-scheme`, applies the attribute early
to avoid a flash, and the topbar toggle flips it. Both pages share it.

### 6.6 The "Explain" feature
The detail panel has a **📖 Explain** button. Clicking it opens a modal showing the algorithm's five
in-depth sections — *What problem it solves · How it works · Why & when to use it · Complexity
intuition · Real-world uses* — fetched from the DB (`explanation` field). Closes via ✕, `Esc`, or
clicking the backdrop. The content is authored per algorithm and stored in `algorithm_explanations`.

---

## 7. The algorithm catalog (15 algorithms)

Each algorithm = a DB row (metadata, Big-O, snippets, explanation) + a verified client-side
generator + a visualizer.

| # | Algorithm (slug) | Category | Visualizer | Best | Average | Worst | Space |
|---|---|---|---|---|---|---|---|
| 1 | Bubble Sort (`bubble-sort`) | sorting | array | O(n) | O(n²) | O(n²) | O(1) |
| 2 | Selection Sort (`selection-sort`) | sorting | array | O(n²) | O(n²) | O(n²) | O(1) |
| 3 | Insertion Sort (`insertion-sort`) | sorting | array | O(n) | O(n²) | O(n²) | O(1) |
| 4 | Merge Sort (`merge-sort`) | sorting | array | O(n log n) | O(n log n) | O(n log n) | O(n) |
| 5 | Quick Sort (`quick-sort`) | sorting | array | O(n log n) | O(n log n) | O(n²) | O(log n) |
| 6 | Linear Search (`linear-search`) | searching | array | O(1) | O(n) | O(n) | O(1) |
| 7 | Binary Search (`binary-search`) | searching | array | O(1) | O(log n) | O(log n) | O(1) |
| 8 | Breadth-First Search (`breadth-first-search`) | graph | graph | O(V+E) | O(V+E) | O(V+E) | O(V) |
| 9 | Depth-First Search (`depth-first-search`) | graph | graph | O(V+E) | O(V+E) | O(V+E) | O(V) |
| 10 | Dijkstra (`dijkstra`) | graph | graph | O(E+V log V) | O(E+V log V) | O(E+V log V) | O(V) |
| 11 | A* Pathfinding (`a-star`) | grid | grid | O(E) | O(E log V) | O(E log V) | O(V) |
| 12 | 0/1 Knapsack (`knapsack-01`) | dynamic-programming | matrix | O(nW) | O(nW) | O(nW) | O(nW) |
| 13 | KMP Pattern Search (`kmp-search`) | string | string | O(n) | O(n+m) | O(n+m) | O(m) |
| 14 | Sieve of Eratosthenes (`sieve-of-eratosthenes`) | math | math | O(n log log n) | ″ | ″ | O(n) |
| 15 | Tower of Hanoi (`tower-of-hanoi`) | math | math | O(2ⁿ) | O(2ⁿ) | O(2ⁿ) | O(n) |

One-line "what it does" for each is in the **Explain** panel (section "What problem it solves") and
in `explanationsData.ts`.

---

## 8. Correctness — how we know the algorithms are right

Every algorithm was **executed against reference answers**, not just eyeballed. Two independent
audits, both passing:

- **Animation generators** (what the board watches): all 15 verified — the 5 sorts produce correctly
  sorted permutations across 5 input types (random, reverse, duplicates, sorted, single); search
  finds the right index; **BFS** dequeue order `A,B,C,D,E,F`; **DFS** depth-first discovery
  `A,B,D,F,E,C`; **Dijkstra** distances `[0,3,2,8,10,11]` match a reference implementation; **A***
  returns the optimal-length contiguous path; **knapsack** optimal value `7`; **KMP** matches at
  `0,9,12`; **Sieve** the 15 primes ≤ 50; **Hanoi** 15 legal moves (2⁴−1) ending solved.
- **Code snippets** (what you present as "the code"): each runnable JavaScript snippet was executed
  and returns the correct result (sorted arrays, correct indices, correct shortest distances,
  knapsack `7`, correct primes, correct Hanoi move count, A* a valid optimal path).

The Big-O figures in the table above are the standard textbook complexities for each algorithm.

---

## 9. How to run (quick)

1. Start **Oracle XE** (see [docker-oracle-guide.md](docker-oracle-guide.md)).
2. Backend: `cd backend && npm install && npm run db:setup && npm run dev` (API on `:3000`).
3. Frontend: serve the `frontend/` folder statically (e.g. `python -m http.server 5500`) and open
   `index.html`. (`frontend/config.js` points at the API.)
4. Tests: `cd backend && npm test` (vitest) and `npm run typecheck`.

Full setup with troubleshooting: [run-guide.md](run-guide.md).

---

## 10. Likely viva questions (and the short answers)

- **Why separate frontend and backend?** Independent deployables, clear responsibilities, the API can
  serve other clients, and the business logic is testable without a UI.
- **Why is Clean Architecture worth it here?** SQL is isolated to one layer; use-cases are unit-tested
  with fake repositories; the database is swappable without touching business rules.
- **Why keep the animation in the frontend instead of the backend?** Reversibility and interactivity
  (paint walls, drag nodes, scrub the timeline) need to run in the browser; the backend owns the
  *content*, the browser owns the *animation* — joined by `slug`.
- **How is the visualization reversible?** State is snapshotted at every step into an array; playback
  moves an index, so backward = forward.
- **How is the schema normalized?** 3NF: no transitive dependencies — role/category text isn't
  duplicated; per-case complexity, code per language, and explanation per section each live in their
  own child table.
- **Is it secure?** Passwords are bcrypt-hashed; auth is stateless JWT; admin routes are role-guarded;
  all SQL uses bind variables (no injection); errors are returned in a uniform shape.
- **How do you add a new algorithm?** Add a DB row (slug + metadata + snippets + explanation) and a
  matching step-generator keyed by that slug in `algorithms.js`. No schema change, no new visualizer
  if it reuses a type.
