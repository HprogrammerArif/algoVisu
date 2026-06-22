# QuantumViz Backend

TypeScript + Express REST API on a pragmatic Clean Architecture, backed by Oracle XE.

## Layout

```
src/
  config/          env loading (AppConfig) + oracledb pool config
  domain/          entities + repository interfaces (pure; no Express/Oracle)
  application/     use-cases (auth, categories, algorithms, bookmarks, progress)
  infrastructure/  Oracle repositories, bcrypt, JWT, connection pool
  interfaces/http/ controllers, routes, middlewares, validators
  shared/          AppError, asyncHandler
  app.ts           createApp(deps) — DI composition
  server.ts        composition root (Oracle repos + services) → listen
db/
  migrations/      Oracle DDL (.sql, split on `/`)
  seeds/           TypeScript seeders (bind variables): roles, admin, categories, catalog
  run.ts           --setup | --migrate | --seed | --reset
tests/             vitest unit + integration (supertest); helpers/ in-memory fakes
```

The **dependency rule**: `interfaces → application → domain`; `infrastructure` implements
domain interfaces; raw SQL lives only in `infrastructure/database/repositories`. `createApp`
is dependency-injected so the whole HTTP + use-case stack is tested against in-memory fakes
(no Oracle required for tests).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | run the API with `tsx watch` (auto-reload) |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | run the compiled build (`node dist/server.js`) |
| `npm run typecheck` | `tsc -p tsconfig.check.json` (src + db + tests, no emit) |
| `npm test` | `vitest run` (unit + integration) |
| `npm run db:setup` | drop + create schema + seed (needs Oracle) |
| `npm run db:migrate` | drop + create schema only |
| `npm run db:seed` | seed only |
| `npm run db:reset` | drop all tables |

## Setup

1. `npm install`
2. `cp .env.example .env` and fill in `DB_PASSWORD`, `JWT_SECRET` (see [../docs/run-guide.md](../docs/run-guide.md)).
3. With Oracle XE running and the `quantumviz` schema created: `npm run db:setup`.
4. `npm run dev` → `http://localhost:3000/api/v1`.

## Verification status

- **Tests + typecheck run with no database** and are green (`npm test`, `npm run typecheck`).
  Integration tests exercise the real Express app wired to in-memory fakes via supertest.
- **Oracle-dependent paths** — `db:setup`, the `Oracle*Repository` classes, and the live
  server boot (`initPool`) — are typechecked but require a running Oracle XE to verify at
  runtime. Run `npm run db:setup` then `npm run dev` against your Oracle XE to confirm.

API contract: [../docs/api-reference.md](../docs/api-reference.md).
