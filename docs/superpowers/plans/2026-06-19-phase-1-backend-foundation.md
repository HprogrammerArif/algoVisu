# Phase 1 — Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a bootable Express API (in TypeScript) with config loading, an Oracle
connection pool, central error handling, and a health endpoint — the spine every later phase
builds on.

**Architecture:** Pragmatic Clean Architecture. This phase builds the outermost plumbing
(`config`, `shared`, `infrastructure/database`, `interfaces/http`) and the composition root
(`server.ts`). The Express app is created via a `createApp(config)` factory so it can be
tested without a database or real environment.

**Tech Stack:** Node ≥18, **TypeScript (strict)**, Express, `node-oracledb` (thin mode),
`cors`, `morgan`, `dotenv`; dev via **`tsx`**, build via **`tsc`** → `dist/`; tests via
**`vitest` + `supertest`**.

## Global Constraints

(Inherited from [the master plan](../../implementation-plan.md#global-constraints). Most
relevant here:)
- Backend is **TypeScript, strict mode**; source in `src/*.ts`, compiled to `dist/` by `tsc`.
- Backend uses **bind-variable SQL only** (no SQL appears in this phase yet).
- **Dependency rule:** inner layers never import outer layers; SQL lives only in
  `infrastructure/database/`.
- Secrets only in `.env` (git-ignored); commit `.env.example` only.
- **Commits:** this plan includes commit steps; the executor commits per the user's git
  preference (the user runs/authorizes commits — see CLAUDE.md rule 5).

---

## Prerequisites

- Node ≥18 installed (`node --version`).
- Oracle XE 21c reachable and the `quantumviz` app user created in `XEPDB1`
  (see [run-guide.md](../../run-guide.md) §1–2). The schema can be **empty** — Phase 1 only
  needs the pool to connect; tables come in Phase 2.

> All paths below are relative to the repo root. Backend lives in `backend/`.

---

## File structure for this phase

| File | Responsibility |
|---|---|
| `backend/package.json` | deps + npm scripts |
| `backend/tsconfig.json` | TypeScript compiler config (strict) |
| `backend/.env.example` | documents required env (no secrets) |
| `backend/.gitignore` | ignore `node_modules`, `dist`, `.env`, `logs` |
| `backend/src/config/index.ts` | load + validate env → typed config |
| `backend/src/config/database.ts` | build the oracledb pool config |
| `backend/src/shared/errors/AppError.ts` | operational error type |
| `backend/src/shared/utils/asyncHandler.ts` | forward async route errors to `next` |
| `backend/src/interfaces/http/middlewares/errorHandler.ts` | 404 + central error → JSON |
| `backend/src/infrastructure/database/connection.ts` | oracledb pool lifecycle |
| `backend/src/interfaces/http/routes/index.ts` | `/api/v1` router + `/health` |
| `backend/src/app.ts` | `createApp(config)` Express factory |
| `backend/src/server.ts` | composition root: config → pool → listen → shutdown |
| `backend/tests/unit/*.test.ts` | unit tests (config, AppError, asyncHandler, connection) |
| `backend/tests/integration/health.test.ts` | health + 404 via supertest |

---

## Task 1.0: Backend scaffolding (TypeScript)

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/.gitignore`, `backend/.env.example`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `typecheck`, `db:migrate`, `db:seed`, `db:setup`, `test`, `test:watch`.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "quantumviz-backend",
  "version": "1.0.0",
  "description": "QuantumViz REST API",
  "type": "commonjs",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "db:migrate": "tsx db/run.ts --migrate",
    "db:seed": "tsx db/run.ts --seed",
    "db:setup": "tsx db/run.ts --setup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "oracledb": "^6.5.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

> `node-oracledb` and `express-validator` ship their own TypeScript types — no `@types` needed.

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> `tsc` compiles only `src/` → `dist/`. `db/run.ts` runs via `tsx` (no compile needed) and
> tests run via `vitest` (esbuild) — neither needs `tsc`.

- [ ] **Step 3: Create `backend/.gitignore`**

```gitignore
node_modules/
dist/
.env
logs/
*.log
```

- [ ] **Step 4: Create `backend/.env.example`**

```ini
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500

# Oracle (node-oracledb thin mode)
DB_USER=quantumviz
DB_PASSWORD=YourAppPassword
DB_CONNECT_STRING=localhost:1521/XEPDB1
DB_POOL_MIN=2
DB_POOL_MAX=10

# Auth
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d

# Seed admin (used in Phase 2)
ADMIN_EMAIL=admin@quantumviz.local
ADMIN_PASSWORD=ChangeMeAdmin123
```

- [ ] **Step 5: Install dependencies**

Run: `cd backend && npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Create your real `.env`**

Run: `cd backend && cp .env.example .env` (PowerShell: `copy .env.example .env`)
Then edit `.env` with your real `DB_PASSWORD` and a random `JWT_SECRET`.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/.gitignore backend/.env.example
git commit -m "chore(backend): scaffold TypeScript project + dependencies"
```

---

## Task 1.1: Config loader

**Files:**
- Create: `backend/src/config/index.ts`, `backend/src/config/database.ts`
- Test: `backend/tests/unit/config.test.ts`

**Interfaces:**
- Produces:
  - `interface AppConfig { env; port; corsOrigin; db:{user,password,connectString,poolMin,poolMax}; jwt:{secret,expiresIn}; admin:{email?,password?} }`
  - `loadConfig(env?: NodeJS.ProcessEnv): AppConfig` — throws `Error` if any of `DB_USER, DB_PASSWORD, DB_CONNECT_STRING, JWT_SECRET` are missing.
  - `getConfig(): AppConfig` — memoized `loadConfig()` from `process.env`.
  - `oraclePoolConfig(): oracledb.PoolAttributes`.

- [ ] **Step 1: Write the failing test** — `backend/tests/unit/config.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('throws when required vars are missing', () => {
    expect(() => loadConfig({})).toThrow(/Missing required env vars/);
  });

  it('parses a valid environment', () => {
    const cfg = loadConfig({
      NODE_ENV: 'test',
      PORT: '4000',
      DB_USER: 'u',
      DB_PASSWORD: 'p',
      DB_CONNECT_STRING: 'localhost:1521/XEPDB1',
      JWT_SECRET: 's',
    });
    expect(cfg.port).toBe(4000);
    expect(cfg.db.user).toBe('u');
    expect(cfg.db.connectString).toBe('localhost:1521/XEPDB1');
    expect(cfg.jwt.secret).toBe('s');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/unit/config.test.ts`
Expected: FAIL — cannot resolve `../../src/config`.

- [ ] **Step 3: Write `backend/src/config/index.ts`**

```ts
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED = ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING', 'JWT_SECRET'] as const;

export interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string;
  db: {
    user: string;
    password: string;
    connectString: string;
    poolMin: number;
    poolMax: number;
  };
  jwt: { secret: string; expiresIn: string };
  admin: { email?: string; password?: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return {
    env: env.NODE_ENV || 'development',
    port: Number(env.PORT) || 3000,
    corsOrigin: env.CORS_ORIGIN || 'http://127.0.0.1:5500',
    db: {
      user: env.DB_USER as string,
      password: env.DB_PASSWORD as string,
      connectString: env.DB_CONNECT_STRING as string,
      poolMin: Number(env.DB_POOL_MIN) || 2,
      poolMax: Number(env.DB_POOL_MAX) || 10,
    },
    jwt: {
      secret: env.JWT_SECRET as string,
      expiresIn: env.JWT_EXPIRES_IN || '1d',
    },
    admin: {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    },
  };
}

let cached: AppConfig | undefined;
export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
```

- [ ] **Step 4: Write `backend/src/config/database.ts`**

```ts
import type { PoolAttributes } from 'oracledb';
import { getConfig } from './index';

export function oraclePoolConfig(): PoolAttributes {
  const { db } = getConfig();
  return {
    user: db.user,
    password: db.password,
    connectString: db.connectString,
    poolMin: db.poolMin,
    poolMax: db.poolMax,
    poolIncrement: 1,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/unit/config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/config backend/tests/unit/config.test.ts
git commit -m "feat(config): typed env loading + validation"
```

---

## Task 1.2: Shared errors + async wrapper

**Files:**
- Create: `backend/src/shared/errors/AppError.ts`, `backend/src/shared/utils/asyncHandler.ts`
- Test: `backend/tests/unit/appError.test.ts`, `backend/tests/unit/asyncHandler.test.ts`

**Interfaces:**
- Produces:
  - `class AppError extends Error` — `new AppError(statusCode: number, code: string, message: string)`; readonly fields `statusCode`, `code`, `isOperational = true`.
  - `asyncHandler(fn): RequestHandler` — runs `fn` and routes any rejection to `next`.

- [ ] **Step 1: Write the failing tests**

`backend/tests/unit/appError.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/shared/errors/AppError';

describe('AppError', () => {
  it('carries statusCode, code, message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'nope');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('nope');
    expect(err).toBeInstanceOf(Error);
    expect(err.isOperational).toBe(true);
  });
});
```

`backend/tests/unit/asyncHandler.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../src/shared/utils/asyncHandler';

describe('asyncHandler', () => {
  it('forwards a rejected promise to next', async () => {
    const boom = new Error('boom');
    let received: unknown;
    const handler = asyncHandler(async () => { throw boom; });
    await new Promise<void>((resolve) => {
      handler({} as Request, {} as Response, ((e?: unknown) => {
        received = e;
        resolve();
      }) as NextFunction);
    });
    expect(received).toBe(boom);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx vitest run tests/unit/appError.test.ts tests/unit/asyncHandler.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `backend/src/shared/errors/AppError.ts`**

```ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational = true;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    if (Error.captureStackTrace) Error.captureStackTrace(this, AppError);
  }
}
```

- [ ] **Step 4: Write `backend/src/shared/utils/asyncHandler.ts`**

```ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx vitest run tests/unit/appError.test.ts tests/unit/asyncHandler.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/shared backend/tests/unit/appError.test.ts backend/tests/unit/asyncHandler.test.ts
git commit -m "feat(shared): AppError + asyncHandler"
```

---

## Task 1.3: Error-handling middleware

**Files:**
- Create: `backend/src/interfaces/http/middlewares/errorHandler.ts`
- Test: covered by the integration test in Task 1.5 (needs the Express app)

**Interfaces:**
- Consumes: `AppError` (Task 1.2).
- Produces:
  - `notFoundHandler(req, res, next): void` → forwards `new AppError(404, 'NOT_FOUND', ...)`.
  - `errorHandler: ErrorRequestHandler` → `AppError` ⇒ its `statusCode` + `{ error:{ code, message } }`; anything else ⇒ 500 `{ error:{ code:'INTERNAL', message:'Unexpected server error' } }`.

- [ ] **Step 1: Write `backend/src/interfaces/http/middlewares/errorHandler.ts`**

```ts
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../../../shared/errors/AppError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error('[unexpected error]', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error' } });
};
```

> No standalone unit test here — `errorHandler` is verified end-to-end by the 404 case in
> Task 1.5, which exercises both `notFoundHandler` and `errorHandler` through real HTTP.

- [ ] **Step 2: Commit**

```bash
git add backend/src/interfaces/http/middlewares/errorHandler.ts
git commit -m "feat(http): 404 + central error handler"
```

---

## Task 1.4: Oracle connection pool

**Files:**
- Create: `backend/src/infrastructure/database/connection.ts`
- Test: `backend/tests/unit/connection.test.ts` (module-shape only; no live DB)

**Interfaces:**
- Consumes: `oraclePoolConfig()` (Task 1.1).
- Produces:
  - `initPool(): Promise<Pool>` (creates once, idempotent).
  - `getConnection(): Promise<Connection>` (inits pool lazily).
  - `closePool(): Promise<void>` (graceful, 10s drain).

- [ ] **Step 1: Write the failing test** — `backend/tests/unit/connection.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import * as conn from '../../src/infrastructure/database/connection';

describe('connection module', () => {
  it('exposes the pool lifecycle API', () => {
    expect(typeof conn.initPool).toBe('function');
    expect(typeof conn.getConnection).toBe('function');
    expect(typeof conn.closePool).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/unit/connection.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `backend/src/infrastructure/database/connection.ts`**

```ts
import oracledb, { type Pool, type Connection } from 'oracledb';
import { oraclePoolConfig } from '../../config/database';

// Return CLOBs as JS strings and rows as plain objects.
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool: Pool | undefined;

export async function initPool(): Promise<Pool> {
  if (pool) return pool;
  pool = await oracledb.createPool(oraclePoolConfig());
  return pool;
}

export async function getConnection(): Promise<Connection> {
  if (!pool) await initPool();
  return (pool as Pool).getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(10);
    pool = undefined;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/unit/connection.test.ts`
Expected: PASS. (This test does not connect to Oracle; live connectivity is verified by the
manual run in Task 1.6.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/infrastructure/database/connection.ts backend/tests/unit/connection.test.ts
git commit -m "feat(db): oracledb connection pool"
```

---

## Task 1.5: Express app factory + health route

**Files:**
- Create: `backend/src/interfaces/http/routes/index.ts`, `backend/src/app.ts`
- Test: `backend/tests/integration/health.test.ts`

**Interfaces:**
- Consumes: `apiRouter` (this task), `notFoundHandler`/`errorHandler` (Task 1.3).
- Produces:
  - `interface AppDeps { corsOrigin: string; env: string }`.
  - `createApp(config: AppDeps): Express`.
  - `GET /api/v1/health` → 200 `{ status:'ok', uptime:<number> }`.

- [ ] **Step 1: Write the failing test** — `backend/tests/integration/health.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp({ corsOrigin: '*', env: 'test' });

describe('health + 404', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('unknown route returns 404 with the error shape', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/integration/health.test.ts`
Expected: FAIL — cannot resolve `../../src/app`.

- [ ] **Step 3: Write `backend/src/interfaces/http/routes/index.ts`**

```ts
import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

export default router;
```

- [ ] **Step 4: Write `backend/src/app.ts`**

```ts
import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './interfaces/http/routes';
import { notFoundHandler, errorHandler } from './interfaces/http/middlewares/errorHandler';

// createApp takes config (dependency injection) so it can be tested without a real env/DB.
export interface AppDeps {
  corsOrigin: string;
  env: string;
}

export function createApp(config: AppDeps): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.env !== 'test') app.use(morgan('dev'));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run tests/integration/health.test.ts`
Expected: PASS (2 tests). This exercises the router, `notFoundHandler`, and `errorHandler`.

- [ ] **Step 6: Run the whole suite + typecheck**

Run: `cd backend && npm test && npm run typecheck`
Expected: all tests PASS; `tsc --noEmit` reports no type errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/app.ts backend/src/interfaces/http/routes/index.ts backend/tests/integration/health.test.ts
git commit -m "feat(http): app factory + health endpoint"
```

---

## Task 1.6: Server bootstrap (composition root)

**Files:**
- Create: `backend/src/server.ts`

**Interfaces:**
- Consumes: `getConfig` (Task 1.1), `createApp` (Task 1.5), `initPool`/`closePool` (Task 1.4).
- Produces: a runnable process; `npm run dev` (tsx) / `npm run build && npm start`.

- [ ] **Step 1: Write `backend/src/server.ts`**

```ts
import { createApp } from './app';
import { getConfig } from './config';
import { initPool, closePool } from './infrastructure/database/connection';

async function start(): Promise<void> {
  const config = getConfig();
  await initPool();                       // verifies Oracle connectivity at boot
  const app = createApp(config);

  const server = app.listen(config.port, () => {
    console.log(`QuantumViz API listening on http://localhost:${config.port}/api/v1`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Manual run — boot the server (dev)**

Ensure Oracle XE is running and `.env` is filled. Run: `cd backend && npm run dev`
Expected: `QuantumViz API listening on http://localhost:3000/api/v1`.
(If you see `ORA-12541`/`ORA-01017`, fix Oracle/.env per [run-guide.md](../../run-guide.md) §9.)

- [ ] **Step 3: Manual check — hit the health endpoint**

Run (new terminal): `curl http://localhost:3000/api/v1/health`
Expected: `{"status":"ok","uptime":<number>}`. Stop the server with `Ctrl+C` (graceful shutdown logs).

- [ ] **Step 4: Verify the production build works**

Run: `cd backend && npm run build && npm start`
Expected: `dist/` is produced and the compiled server boots identically. Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat(core): server bootstrap + graceful shutdown"
```

---

## Phase 1 Definition of Done 🎯

- `npm test` is green (config, AppError, asyncHandler, connection, health + 404).
- `npm run typecheck` reports no type errors.
- `npm run dev` boots and connects to Oracle XE; `npm run build && npm start` also boots.
- `GET /api/v1/health` returns `{ status: "ok", ... }`.
- Unknown routes return `404 { error: { code: "NOT_FOUND", ... } }`.
- The folder layout matches [folder-structure.md](../../folder-structure.md) for the files in this phase.

**Next:** Phase 2 — Database schema & seeds (`npm run db:setup`). Generate its detailed plan
the same way when ready.

---

## Self-review notes (author)

- **Spec coverage:** implements master-plan Phase 1 tasks 1.1–1.6 + the backend slice of
  Phase 0 (Task 1.0, now TypeScript). Health/error/config/pool/bootstrap all covered.
- **Placeholder scan:** none — every code step contains complete, runnable TypeScript.
- **Type consistency:** `AppConfig` (Task 1.1) is consumed by `getConfig`/`oraclePoolConfig`;
  `createApp(config: AppDeps)` consumes `{ corsOrigin, env }` (Task 1.5), supplied by
  `getConfig()` in Task 1.6 (`AppConfig` is structurally assignable to `AppDeps`). Names
  `loadConfig`/`getConfig`/`oraclePoolConfig`/`initPool`/`getConnection`/`closePool`/
  `AppError`/`asyncHandler`/`notFoundHandler`/`errorHandler` are used consistently across tasks.
