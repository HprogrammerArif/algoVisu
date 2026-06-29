# Run Guide — QuantumViz

> **Goal:** Get Oracle XE → backend API → frontend all running locally.
> Written for **Windows + PowerShell**. ~15 min on first setup, ~1 min every return visit.

---

## ✅ Prerequisites checklist

Make sure these are installed before starting:

| Tool | How to check | Install link |
|---|---|---|
| **Node.js ≥ 18 LTS** | `node -v` | https://nodejs.org |
| **Docker Desktop** *(recommended for Oracle)* | `docker -v` | https://www.docker.com/products/docker-desktop |
| **Git** | `git -v` | https://git-scm.com |

> `node-oracledb` runs in **thin mode** — you do **NOT** need Oracle Instant Client.

---

## 🚀 FIRST-TIME SETUP (do this once)

---

### Step 1 — Start Oracle XE via Docker (easiest)

Open **PowerShell** and run:

```powershell
docker run -d --name oracle-xe `
  -p 1521:1521 `
  -e ORACLE_PASSWORD=SysPassword123 `
  -e APP_USER=quantumviz `
  -e APP_USER_PASSWORD=AppPassword123 `
  gvenzl/oracle-xe:21-slim
```

Wait **60–90 seconds** for Oracle to initialize, then confirm it's healthy:

```powershell
docker ps
# STATUS column should show "healthy" or "(healthy)"

docker logs oracle-xe --tail 20
# Look for: "DATABASE IS READY TO USE!"
```

> ✅ The image auto-creates the `quantumviz` user inside `XEPDB1` — no manual SQL needed.
>
> 🐳 **New to Docker?** See [docker-oracle-guide.md](docker-oracle-guide.md) for a beginner walkthrough.
>
> 💻 **Prefer a native install?** Download Oracle XE 21c for Windows from oracle.com, run the
> installer, and then manually create the user (see the SQL block in the old guide).

---

### Step 2 — Install backend dependencies

```powershell
cd d:\UNIVERSITY\algoVisu\backend
npm install
```

---

### Step 3 — Create your `.env` file

```powershell
# Still inside backend/
copy .env.example .env
```

Open `.env` in any editor and fill in the values — **must match what you used in Step 1**:

```ini
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500

# Oracle — match the docker run values above exactly
DB_USER=quantumviz
DB_PASSWORD=AppPassword123
DB_CONNECT_STRING=localhost:1521/XEPDB1
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT — any long random string works here
JWT_SECRET=replace-this-with-any-long-random-string
JWT_EXPIRES_IN=1d

# Default admin account (created by seed)
ADMIN_EMAIL=admin@quantumviz.local
ADMIN_PASSWORD=ChangeMeAdmin123
```

> `.env` is git-ignored — never commit it. Only `.env.example` is tracked.

---

### Step 4 — Create tables and seed data

```powershell
# Still inside backend/
npm run db:setup
```

This runs all **migrations** (creates tables) then **seeds** (inserts roles, admin user, algorithm catalog).
**Re-running is safe** — scripts are idempotent.

✅ Expected output: lines like `✓ migration applied`, `✓ seed applied` — no `ORA-` errors.

---

### Step 5 — Start the backend API

Open a **new PowerShell terminal**:

```powershell
cd d:\UNIVERSITY\algoVisu\backend
npm run dev
```

You should see:
```
[tsx] watching...
Server listening on http://localhost:3000
```

**Sanity check** (in a browser or another terminal):
```powershell
curl http://localhost:3000/api/v1/health
# Expected: { "status": "ok", "uptime": ... }
```

---

### Step 6 — Serve the frontend

Open another **new PowerShell terminal**:

```powershell
npx serve d:\UNIVERSITY\algoVisu\frontend -l 5500
```

Then open **http://127.0.0.1:5500** in your browser.

> **Alternatives if `npx serve` doesn't work:**
> - VS Code: right-click `frontend/index.html` → **"Open with Live Server"**
> - Python: `cd frontend && python -m http.server 5500`

---

### Step 7 — Log in

| Account | Email | Password |
|---|---|---|
| **Admin** | `admin@quantumviz.local` | `ChangeMeAdmin123` |
| **Student** | Register a new account from the UI | — |

---

## ⚡ DAILY QUICK START (after first-time setup)

3 commands in 3 terminals — that's it:

```powershell
# Terminal 1 — ensure Oracle is running
docker start oracle-xe

# Terminal 2 — backend
cd d:\UNIVERSITY\algoVisu\backend
npm run dev

# Terminal 3 — frontend
npx serve d:\UNIVERSITY\algoVisu\frontend -l 5500
```

Then open **http://127.0.0.1:5500** ✅

---

## 🐳 DOCKER COMPOSE — run everything with one command

If you want Oracle + backend + frontend all managed together, use Compose.

### Files added to the repo

| File | Purpose |
|---|---|
| [`docker-compose.yml`](../docker-compose.yml) | Defines all 3 services (oracle, backend, frontend) |
| [`backend/Dockerfile`](../backend/Dockerfile) | Multi-stage build: compile TS → run compiled JS |
| [`backend/.dockerignore`](../backend/.dockerignore) | Excludes `node_modules/`, `dist/`, `.env` from build context |
| [`nginx.conf`](../nginx.conf) | Serves static frontend + proxies `/api/` to backend |

### First-time Compose setup

```powershell
# From the repo root (d:\UNIVERSITY\algoVisu)

# 1. Build images and start all services
docker compose up --build -d

# 2. Wait ~90 s for Oracle to become healthy, then run migrations + seeds
docker compose run --rm backend-setup

# 3. Open in browser
start http://localhost:5500
```

> The `backend-setup` service runs `tsx db/run.ts --setup` inside the compose network
> and exits after seeding. You only need this on first run (or after `docker compose down -v`).

### Daily Compose start (after first-time setup)

```powershell
docker compose up -d          # start all services in background
start http://localhost:5500   # open frontend
```

### Compose logs and status

```powershell
docker compose ps             # show running services
docker compose logs -f        # follow all logs
docker compose logs backend   # backend logs only
docker compose logs oracle    # Oracle logs only
```

### Stop / reset

```powershell
docker compose down           # stop containers (data preserved in volume)
docker compose down -v        # ⚠️  stop AND delete DB data volume (full reset)
```

### Compose vs manual — which to use?

| | Docker Compose | Manual (3-terminal) |
|---|---|---|
| **Setup effort** | One command | Steps 1–6 above |
| **Oracle persistence** | Named volume (automatic) | Container restarted manually |
| **CORS config** | nginx proxies `/api/` — no CORS needed | Must match `CORS_ORIGIN` in `.env` |
| **Hot reload** | ❌ (rebuild image to update) | ✅ `tsx watch` auto-reloads |
| **Best for** | Demo / production-like run | Active development |

> 💡 **Recommended workflow:** use Docker Compose to demo/submit the project, and the
> 3-terminal manual setup for day-to-day development (because of hot reload).

---

## 🛠️ Useful commands reference

| Command | What it does |
|---|---|
| `npm run dev` | Start backend in watch mode (auto-reload on save) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled backend (production-style) |
| `npm run db:setup` | Run all migrations + seeds (safe to re-run) |
| `npm run db:migrate` | Run migrations only |
| `npm run db:seed` | Run seeds only |
| `npm run db:reset` | Drop everything and re-run full setup |
| `npm test` | Run all unit tests (no Oracle needed) |
| `npm run typecheck` | TypeScript type-check without building |
| `docker start oracle-xe` | Start Oracle container (e.g. after a PC reboot) |
| `docker stop oracle-xe` | Stop Oracle container |
| `docker logs oracle-xe` | View Oracle container logs |

---

## 🔴 Common errors and fixes

| Error / Symptom | Cause | Fix |
|---|---|---|
| `ORA-12541: TNS:no listener` | Oracle not running | `docker start oracle-xe`, wait 30 s, retry |
| `ORA-01017: invalid username/password` | `.env` password doesn't match Docker | Make `DB_PASSWORD` in `.env` match `APP_USER_PASSWORD` in `docker run` |
| `ORA-12514: service not known` | Wrong connect string | Use `localhost:1521/XEPDB1` — not `XE` or `localhost:1521/XE` |
| `ORA-01031: insufficient privileges` | User missing grants | Re-create container with `APP_USER` env vars set |
| CORS error in browser console | `CORS_ORIGIN` in `.env` ≠ frontend URL | Set `CORS_ORIGIN=http://127.0.0.1:5500` (or whatever port your server uses) |
| `ECONNREFUSED` / backend unreachable | Backend not started | Run `npm run dev` in `backend/` |
| Frontend blank / can't reach API | Wrong `API_BASE_URL` | Open `frontend/config.js`, confirm it says `http://localhost:3000/api/v1` |
| Docker not found / won't start | Docker Desktop closed | Open Docker Desktop, wait for it to fully start, then retry |

---

## 📁 Project layout (quick reference)

```
algoVisu/
├── frontend/          ← static site — open in browser
│   ├── index.html     ← main algorithm visualizer page
│   ├── account.html   ← login / register / bookmarks page
│   └── config.js      ← set API_BASE_URL here
├── backend/           ← Node + Express REST API (TypeScript)
│   ├── src/           ← application source code
│   ├── db/            ← migrations + seeds
│   ├── .env.example   ← template — copy to .env and fill in
│   └── package.json   ← all npm scripts listed above
└── docs/              ← all documentation
```

---

## 🔗 Related docs

| Doc | What's in it |
|---|---|
| [docker-oracle-guide.md](docker-oracle-guide.md) | Beginner Docker + Oracle XE walkthrough |
| [api-reference.md](api-reference.md) | All REST endpoints with payloads and status codes |
| [architecture.md](architecture.md) | System architecture overview |
| [database-schema.md](database-schema.md) | Tables, ER diagram, 3NF normalization |
| [`../docker-compose.yml`](../docker-compose.yml) | Full-stack Docker Compose config |
| [`../backend/Dockerfile`](../backend/Dockerfile) | Backend multi-stage Docker build |
