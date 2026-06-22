# Run Guide — QuantumViz

> How to set up and run the whole stack on your machine: Oracle XE → backend → frontend.
> Written for Windows (your environment) with notes for Docker. Nothing here is needed
> until implementation begins, but it documents the target so the build has a clear goal.

---

## 0. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | LTS ≥ 18 | includes `npm`; the backend's TypeScript toolchain (`typescript`, `tsx`, `vitest`) installs via `npm install` |
| Oracle Database XE | 21c | local install **or** Docker (see step 1) |
| A static server | any | VS Code **Live Server**, `npx serve`, or `python -m http.server` |
| Git | any | version control |

> `node-oracledb` v6 runs in **thin mode** by default — you do **not** need Oracle
> Instant Client. Just Node + a reachable Oracle XE.

---

## 1. Install & start Oracle XE 21c

Pick **one** option.

### Option A — Native Windows install
1. Download "Oracle Database 21c Express Edition" for Windows from Oracle.
2. Run the installer; set a password for `SYS` / `SYSTEM` when prompted.
3. After install, the listener runs on port **1521**; the pluggable DB is **`XEPDB1`**.

### Option B — Docker (often easier)
```bash
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=YourSysPassword \
  -e APP_USER=quantumviz \
  -e APP_USER_PASSWORD=YourAppPassword \
  gvenzl/oracle-xe:21-slim
```
The `gvenzl/oracle-xe` image auto-creates the `APP_USER` inside `XEPDB1`. If you use this,
**skip step 2** (the app user already exists).

> 🐳 **New to Docker?** Follow the step-by-step, beginner-friendly
> **[docker-oracle-guide.md](docker-oracle-guide.md)** — it teaches Docker from scratch and
> walks through this exact Oracle setup for QuantumViz.

---

## 2. Create the application schema/user (native install only)

Connect as `SYSTEM` (e.g. via SQL*Plus or SQL Developer) and run:

```sql
ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER quantumviz IDENTIFIED BY "YourAppPassword";
GRANT CONNECT, RESOURCE TO quantumviz;
ALTER USER quantumviz QUOTA UNLIMITED ON USERS;
```

This dedicated schema keeps the app's tables isolated from `SYSTEM`.

**Connect string used by the app:** `localhost:1521/XEPDB1`.

---

## 3. Configure the backend

```bash
cd backend
npm install
cp .env.example .env      # Windows PowerShell: copy .env.example .env
```

Edit `.env`:

```ini
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500     # the origin your static server uses

# Oracle (node-oracledb thin mode)
DB_USER=quantumviz
DB_PASSWORD=YourAppPassword
DB_CONNECT_STRING=localhost:1521/XEPDB1
DB_POOL_MIN=2
DB_POOL_MAX=10

# Auth
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d

# Seed admin (created by db seeds)
ADMIN_EMAIL=admin@quantumviz.local
ADMIN_PASSWORD=ChangeMeAdmin123
```

> `.env` is git-ignored. Never commit real secrets — only `.env.example` is checked in.

---

## 4. Create tables + seed data

```bash
npm run db:setup        # runs db/run.ts (via tsx) → migrations (DDL) then seeds (roles, admin, catalog)
```

This applies `db/migrations/*.sql` in order, then `db/seeds/*.sql`. Re-running is safe if
the scripts are written idempotently (drop-if-exists / merge), per the implementation plan.

---

## 5. Start the backend API

```bash
npm run dev             # tsx watch — runs the TypeScript directly, auto-reload (development)
# or, for a production-style run:
npm run build           # tsc → compiles src/ to dist/
npm start               # node dist/server.js
```

Verify it's up:
```bash
curl http://localhost:3000/api/v1/health
# → { "status": "ok", "uptime": ... }
```

---

## 6. Serve the frontend

The frontend is static — pick any server. From the repo root:

```bash
# Option 1: npx serve
npx serve frontend -l 5500

# Option 2: Python
cd frontend && python -m http.server 5500

# Option 3: VS Code "Live Server" → right-click frontend/index.html → "Open with Live Server"
```

Make sure `frontend/config.js` points at the API:
```js
window.API_BASE_URL = "http://localhost:3000/api/v1";
```
And that the backend `.env` `CORS_ORIGIN` matches the origin your static server prints
(e.g. `http://127.0.0.1:5500`).

Open the printed URL (e.g. `http://127.0.0.1:5500`) in the browser.

---

## 7. Log in

- **Admin:** the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (seeded in step 4).
- **Student:** register a new account from the Register page.

---

## 8. Run the tests (backend)

```bash
cd backend
npm test                # vitest run  (unit + integration)
npm run typecheck       # tsc --noEmit (type-check without building)
```

Unit tests use fake in-memory repositories (no Oracle needed). Integration tests expect a
reachable test schema — see `backend/README.md`.

---

## 9. Common issues

| Symptom | Likely cause / fix |
|---|---|
| `ORA-12541: TNS:no listener` | Oracle XE not running / wrong port. Start the service or container; confirm `1521`. |
| `ORA-01017: invalid username/password` | `DB_USER`/`DB_PASSWORD` wrong, or user not created in `XEPDB1` (step 2). |
| `ORA-12514: service not known` | `DB_CONNECT_STRING` service wrong — use `localhost:1521/XEPDB1`, not `XE`. |
| CORS error in browser console | `CORS_ORIGIN` in `.env` ≠ the static server's origin. Make them match. |
| 401 on bookmark/progress | Not logged in / token expired — log in again. |
| Frontend can't reach API | `config.js` `API_BASE_URL` wrong, or backend not started. |

---

## 10. One-page quick start (after first setup)

```bash
# 1. ensure Oracle XE is running (service or `docker start oracle-xe`)
# 2. backend
cd backend && npm run dev
# 3. frontend (new terminal)
npx serve frontend -l 5500
# 4. open http://127.0.0.1:5500
```
