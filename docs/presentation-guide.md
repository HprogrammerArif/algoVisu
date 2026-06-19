# Presentation Guide — QuantumViz (IDP Defense)

> How to demo and defend the project. Includes a requirement-to-evidence map, a timed demo
> script, talking points, and likely examiner questions with answers.

---

## 1. The one-sentence pitch

> "QuantumViz is a full-stack algorithm-visualization platform — a vanilla HTML/CSS/JS
> frontend, a TypeScript Node/Express REST API built on Clean Architecture, and a normalized
> Oracle database — that lets students and teachers *see* how algorithms work, step by step,
> with explanations, code, and complexity."

---

## 2. Requirement → evidence map (show this slide)

| University requirement | Where it's satisfied | What to point at live |
|---|---|---|
| Separate frontend & backend | `frontend/` and `backend/` are independent deployables | Two terminals: API on :3000, static site on :5500 |
| Frontend = raw HTML/CSS/JS (no React/Next) | `frontend/` has no framework, no build, no npm | `frontend/index.html` + plain `js/*` |
| Backend = Node + Express | `backend/src` Express API (TypeScript) | `src/app.ts`, `src/server.ts` |
| Database = Oracle (Oracle SQL only) | Oracle XE; hand-written DDL/DML | `backend/db/migrations/*.sql` |
| Clean Architecture | domain → application → interfaces; infra implements interfaces | `backend/src/{domain,application,infrastructure,interfaces}` |
| Modular folder structure | feature modules per layer | `docs/folder-structure.md` tree |
| Normalized schema | 3NF, justified | `docs/database-schema.md` §5 |
| Scalable / production-ready | pooling, stateless JWT, env config, versioned API, central errors | `docs/architecture.md` §6 |
| High-level architecture | three-tier diagram | `docs/architecture.md` §1 |
| Data-flow explanation | request path + 6 flows | `docs/data-flow.md` |

---

## 3. Demo script (~8–10 minutes)

**Setup before you start:** Oracle XE running, backend (`npm run dev`), frontend served,
browser + an API client (curl/Postman) ready, dev-tools Network tab open.

1. **Architecture slide (1 min)** — show the three-tier diagram; state the content/logic
   seam: "the database stores *what to teach*, the browser computes *how to animate*."
2. **Browse the catalog (1 min)** — open the app; click categories. In the Network tab show
   `GET /api/v1/categories` and `GET /api/v1/algorithms` returning JSON from Oracle.
3. **Open an algorithm (2 min)** — click *Binary Search*. Show `GET /algorithms/binary-search`
   returning explanation + Big-O + code. Then run the visualization forward **and backward**
   (the reversible time-travel debugger) — your standout feature.
4. **Auth (1.5 min)** — register a student, log in; show the JWT in the response and the
   `Authorization: Bearer` header on later calls.
5. **Per-user data (1.5 min)** — bookmark the algorithm, mark progress "completed"; refresh
   to show it persisted in Oracle. Show `403` when a student hits an admin endpoint.
6. **Admin (1.5 min)** — log in as admin; create or edit an algorithm; show it appear in the
   catalog (write path through a transaction into multiple tables).
7. **Database (1 min)** — in SQL Developer / SQL*Plus run a quick `SELECT` joining
   `algorithms` + `categories` + `time_complexities` to prove the normalized schema.

---

## 4. Talking points (the "why", not just the "what")

- **Why is the visualization client-side?** It must be reversible and instant; round-tripping
  to Oracle per animation frame would be slow and pointless. Content belongs in the DB; logic
  belongs in the browser. They meet at the algorithm `slug`.
- **Why Clean Architecture?** The database is hidden behind repository *interfaces*, so the
  business logic (use-cases) is testable without Oracle and Oracle could be swapped without
  touching business rules. Show a unit test using a fake repository.
- **Why is it scalable?** Stateless JWT → run many backend instances; a connection pool →
  bounded Oracle connections; versioned API → evolve without breaking clients.
- **Why is the schema normalized?** Walk 1NF→3NF: no repeating groups (multi-language code is
  rows in `code_snippets`), no transitive dependencies (category/role text isn't duplicated).
  Result: no update/insert/delete anomalies.

---

## 5. Likely examiner questions & answers

| Question | Answer |
|---|---|
| "Why TypeScript on the backend but plain JS on the frontend?" | The requirement was *JavaScript, raw, no build* on the frontend — so it stays vanilla JS. The backend already has a build/toolchain, and TypeScript compiles to the Node the requirement asks for; it makes Clean Architecture stronger because repository contracts are compiler-enforced `interface`s. |
| "Where's the business logic?" | In `application/` use-cases — independent of Express and Oracle. |
| "How do you prevent SQL injection?" | All SQL uses `node-oracledb` **bind variables**, never string concatenation. |
| "How are passwords stored?" | bcrypt hashes (`bcryptjs`) — never plaintext; the hash is in `users.password_hash`. |
| "What makes it 3NF?" | See the normalization table; every non-key attribute depends only on its key. |
| "How would you add a new algorithm type?" | Add a visualizer module + step-generator on the frontend and a seed row in the DB — no schema change. |
| "How do roles work?" | JWT carries the role; `authorize('admin')` middleware guards write routes (demo the 403). |
| "Is there a transaction anywhere?" | Yes — creating an algorithm inserts into three tables in one transaction (commit/rollback). |
| "Could you swap Oracle for Postgres?" | Only the `infrastructure/database` layer changes; domain/application/interfaces are untouched — that's the point of the interfaces. |

---

## 6. Pre-demo checklist

- [ ] Oracle XE up; `db:setup` has been run (catalog + admin seeded).
- [ ] Backend `npm run dev` healthy (`/api/v1/health` returns ok).
- [ ] Frontend served; `config.js` API URL + backend `CORS_ORIGIN` match.
- [ ] Admin and a student account ready.
- [ ] Browser Network tab + SQL client open on a second screen/window.
- [ ] Backup: a short screen-recording of the full flow in case of live-demo failure.
- [ ] The docs in `docs/` open in tabs for the architecture/schema slides.

---

## 7. Suggested report/slide structure

1. Problem & motivation (teaching algorithms visually)
2. Requirements (the university list)
3. High-level architecture (three-tier diagram)
4. Technology choices & justification
5. Database design (ER diagram + normalization)
6. Backend design (Clean Architecture layers + a data-flow example)
7. Frontend design (the reversible engine + API integration)
8. Security (JWT, roles, bcrypt, bind variables)
9. Live demo
10. Challenges, future work (stretch: notes/tags, Docker, more languages), conclusion
