# Data Flow — QuantumViz

> How a request travels through the system, end to end. Read alongside
> [architecture.md](architecture.md) (layers) and [api-reference.md](api-reference.md)
> (endpoint contracts).

---

## 1. The canonical request path

Every API call follows the same layered path. Dependencies point inward; the response
travels back out.

```
Browser (frontend)
   │  fetch(/api/v1/...) + Authorization: Bearer <jwt>
   ▼
Express app  ──►  middleware chain (cors → json parser → morgan)
   │
   ▼
Route  ──►  authenticate ──►  authorize(role) ──►  validate(input)
   │
   ▼
Controller  (interfaces/http)         translate HTTP → call use-case
   │
   ▼
Use-case  (application)               business logic; calls repository INTERFACE
   │
   ▼
Oracle repository  (infrastructure)   the only place with SQL + node-oracledb
   │
   ▼
Oracle XE (XEPDB1)                     executes SQL, returns rows
   │
   ▲  rows → entity → DTO → JSON
   └──────────────────────────────────────────────► back out to the browser
```

If anything throws an `AppError` (or an unexpected error), it skips straight to the central
`errorHandler`, which returns a uniform `{ error: { code, message } }` with the right HTTP
status.

---

## 2. Flow A — Load the catalog (public, no auth)

**Trigger:** app boot / opening the sidebar.

```
FE: GET /api/v1/categories
FE: GET /api/v1/algorithms            (optionally ?category=sorting&search=bin)
        │
   route → algorithmController.list
        → listAlgorithms use-case
        → IAlgorithmRepository.findAll(filters)
        → OracleAlgorithmRepository  (SELECT … JOIN categories …)
        → Oracle
        ← [ {id, slug, name, summary, category, difficulty, visualizer_type}, … ]
   ← 200 JSON
FE: render category pills + algorithm list in the sidebar
```

No token required; these endpoints are public so the catalog is browsable before login.

---

## 3. Flow B — Open an algorithm (the core interaction)

**Trigger:** clicking an algorithm in the sidebar.

```
FE: GET /api/v1/algorithms/binary-search
        → getAlgorithmDetail use-case
        → IAlgorithmRepository.findBySlug('binary-search')
        → OracleAlgorithmRepository runs:
              • SELECT the algorithm row
              • SELECT its time_complexities (best/average/worst)
              • SELECT its code_snippets (per language)
        ← { id, slug, name, description, visualizer_type, difficulty,
            spaceComplexity, timeComplexities:{best,average,worst},
            codeSnippets:[{language,code}, …] }
   ← 200 JSON
FE then:
   1. shows explanation / Big-O / code in the panels
   2. uses `slug`  → look up the matching client-side step-generator in js/algorithms/
   3. uses `visualizer_type` → pick the renderer in js/visualizers/
   4. generates the reversible step list locally and drives the playback engine
```

**This is the content/logic seam in action:** the *text & code* came from Oracle; the
*animation* is computed in the browser. They were joined by the `slug`.

---

## 4. Flow C — Register & login (auth)

```
Register:
FE: POST /api/v1/auth/register { fullName, email, password }
        → validate (email format, password length)
        → registerUser use-case
              • IUserRepository.findByEmail → must be null
              • password.hash(password)  (bcrypt)
              • IUserRepository.create({ …, roleId: student })
        ← 201 { user: { id, fullName, email, role } }

Login:
FE: POST /api/v1/auth/login { email, password }
        → loginUser use-case
              • IUserRepository.findByEmail
              • password.compare(input, hash)  → else 401
              • jwt.sign({ sub:userId, role })  → token
        ← 200 { token, user }
FE: store token in localStorage; attach `Authorization: Bearer` on later calls
```

`GET /api/v1/auth/me` → `authenticate` decodes the JWT, `getCurrentUser` loads the fresh
user record. Used on page load to restore the session.

---

## 5. Flow D — Bookmark / progress (authenticated, per-user)

```
FE: POST /api/v1/bookmarks { algorithmId }
        → authenticate (req.user from JWT)
        → addBookmark use-case
              • IBookmarkRepository.add(userId, algorithmId)   (UNIQUE → idempotent)
        ← 201 { bookmark }

FE: PUT /api/v1/progress/123 { status: "completed" }
        → authenticate
        → upsertProgress use-case
              • IProgressRepository.upsert(userId, algorithmId, status)
                (Oracle MERGE on UNIQUE(user_id, algorithm_id))
        ← 200 { progress }
```

The repository uses an **upsert (Oracle `MERGE`)** so the unique `(user_id, algorithm_id)`
pair is created or updated without duplicate rows.

---

## 6. Flow E — Admin manages the catalog (role-guarded)

```
FE (admin): POST /api/v1/algorithms { categoryId, slug, name, description,
                                      visualizerType, difficulty, spaceComplexity,
                                      timeComplexities, codeSnippets }
        → authenticate → authorize('admin')   (403 if not admin)
        → validate
        → manageAlgorithm.create use-case
              • IAlgorithmRepository.create(...) inside a transaction:
                  INSERT algorithm, INSERT time_complexities, INSERT code_snippets
        ← 201 { algorithm }
```

Writes that touch multiple tables run in a **single Oracle transaction** (commit on
success, rollback on error) so the catalog never ends up half-written.

---

## 7. Error flow

```
anywhere: throw new AppError(404, 'ALGORITHM_NOT_FOUND', 'No algorithm with that slug')
        │  (or an unexpected Error)
        ▼
errorHandler middleware
        • known AppError  → its statusCode + { error:{ code, message } }
        • unknown Error   → 500 + { error:{ code:'INTERNAL', message:'Unexpected error' } }
        • logs the full error server-side
```

| Situation | Status | Code (example) |
|---|---|---|
| Bad/missing input | 400 | `VALIDATION_ERROR` |
| No / invalid token | 401 | `UNAUTHENTICATED` |
| Authenticated but wrong role | 403 | `FORBIDDEN` |
| Resource not found | 404 | `NOT_FOUND` |
| Duplicate (e.g. email) | 409 | `CONFLICT` |
| Unexpected | 500 | `INTERNAL` |

---

## 8. Connection & transaction lifecycle

1. On boot, `server.ts` creates one **oracledb pool**.
2. Each repository call **acquires a connection** from the pool, runs SQL, and **releases**
   it in a `finally` block.
3. Multi-statement writes wrap their statements in a transaction (`autoCommit:false` →
   `connection.commit()` / `connection.rollback()`).
4. On shutdown, the pool is closed gracefully.

This keeps Oracle connections bounded and reused — the basis of the app's scalability.
