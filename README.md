# QuantumViz

> A full-stack **algorithm visualization platform** for teaching and learning. Pick an
> algorithm and watch it run — step **forward and backward** — alongside its explanation,
> source code, and time/space complexity.

University IDP project. Vanilla **HTML/CSS/JS** frontend · **TypeScript + Node + Express**
backend on Clean Architecture · **Oracle** database (normalized to 3NF).

---

## Why it exists

Algorithms are hard to learn from static text. QuantumViz makes them *visible*: a reversible
time-travel debugger animates each step while showing the explanation, code, and Big-O — a
tool a student can study with or a teacher can present in class.

---

## Architecture at a glance

```
┌────────────┐   REST/JSON + JWT   ┌──────────────────┐   node-oracledb   ┌────────────┐
│  FRONTEND  │ ──────────────────► │     BACKEND      │ ────────────────► │  ORACLE XE │
│ HTML/CSS/JS│ ◄────────────────── │ Node + Express   │ ◄──────────────── │   (XEPDB1) │
│ viz engine │                     │ Clean Arch /api  │   conn. pool      │            │
└────────────┘                     └──────────────────┘                   └────────────┘
```

**The seam:** the database stores *what to teach* (metadata, explanation, Big-O, code text);
the frontend keeps *how to animate* (reversible step-generators + visualizers, client-side).
They join on each algorithm's `slug`.

---

## Tech stack

| Tier | Tech |
|---|---|
| Frontend | Vanilla HTML, CSS (custom-property theme), JavaScript — no framework, no build step |
| Backend | **TypeScript** on Node.js + Express, pragmatic Clean Architecture, JWT auth (`bcryptjs`) — `tsx` dev, `tsc` build, `vitest` tests |
| Database | Oracle XE 21c via `node-oracledb` (thin mode), 3NF schema |

---

## Repository layout

```
algoVisu/
├── frontend/     # static site (presentation tier)
├── backend/      # Node + Express REST API in TypeScript (application tier) + db/ migrations & seeds
├── docs/         # all documentation (see below)
├── CLAUDE.md     # project rules for Claude Code
└── README.md     # this file
```

Full tree: [docs/folder-structure.md](docs/folder-structure.md).

> Note: implementation hasn't started yet — the `frontend/` and `backend/` folders are
> created during the build (see the implementation plan). The original prototype currently
> lives at the repo root (`index.html`, `styles.css`, `js/`) and migrates into `frontend/`.

---

## Quick start

Full instructions (incl. Oracle XE setup): **[docs/run-guide.md](docs/run-guide.md)**.

```bash
# 1. Oracle XE 21c running locally (native or Docker), app schema created
# 2. Backend
cd backend
npm install
cp .env.example .env        # fill in DB + JWT settings
npm run db:setup            # create tables + seed catalog & admin
npm run dev                 # API on http://localhost:3000/api/v1

# 3. Frontend (separate terminal)
npx serve frontend -l 5500  # then open http://127.0.0.1:5500
```

---

## Documentation

| Doc | What's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | high-level architecture, tech stack, Clean Architecture layers |
| [docs/data-flow.md](docs/data-flow.md) | how requests travel through the system (6 flows) |
| [docs/database-schema.md](docs/database-schema.md) | tables, constraints, ER diagram, normalization (1NF→3NF) |
| [docs/folder-structure.md](docs/folder-structure.md) | full repo tree + the role of every folder |
| [docs/api-reference.md](docs/api-reference.md) | REST endpoints, payloads, status codes |
| [docs/run-guide.md](docs/run-guide.md) | set up & run everything locally |
| [docs/presentation-guide.md](docs/presentation-guide.md) | demo script + requirement-to-evidence map |
| [docs/implementation-plan.md](docs/implementation-plan.md) | phased, step-by-step build plan |
| [docs/superpowers/specs/](docs/superpowers/specs/) | master design spec |

---

## Status

📐 **Design & documentation complete.** Implementation is planned but not yet started — see
[docs/implementation-plan.md](docs/implementation-plan.md).
