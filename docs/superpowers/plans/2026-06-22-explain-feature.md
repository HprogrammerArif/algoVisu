# "Explain" Feature + Algorithm Cleanup — Implementation Plan

> **For agentic workers:** execute task-by-task; steps use checkbox syntax. Backend is TDD (vitest); frontend is manual-verified (vanilla, no harness).

**Goal:** Add a DB-backed, modal "Explain" panel (5 structured sections per algorithm) to the visualizer, and remove the unused/stub algorithm code from the frontend.

**Spec:** [docs/superpowers/specs/2026-06-22-explain-feature-design.md](../specs/2026-06-22-explain-feature-design.md)

## Global Constraints

- Frontend stays vanilla (no build/npm/TS); share via `window.QV`/globals. Backend strict TS; raw SQL with bind variables only in repositories/seeds.
- DB: new table mirrors `code_snippets` pattern; `body` is CLOB (returned as string via `fetchAsString[CLOB]`).
- **Do NOT remove or edit anything under `docs/`.**
- Commits only when the user asks; do not commit as part of these tasks.
- Curated 15 slugs are fixed (see prior spec). `ALGO_REGISTRY` must resolve all 15 after cleanup.

---

## Task 1: Backend — explanation table, data, seed, API (TDD)

**Files:**
- Create `backend/db/migrations/009_create_algorithm_explanations.sql`
- Create `backend/db/seeds/explanationsData.ts` (15 × 5 sections)
- Create `backend/db/seeds/seedExplanations.ts`
- Modify `backend/db/run.ts` (TABLES_REVERSE + seed())
- Modify `backend/src/domain/entities/Algorithm.ts` (ExplanationSection + explanation field)
- Modify `backend/src/infrastructure/database/repositories/OracleAlgorithmRepository.ts` (loadDetail query)
- Modify `backend/tests/helpers/fakeAlgorithmRepository.ts` (explanation in defaults + create/update)
- Create `backend/tests/unit/explanationsData.test.ts`
- Modify `backend/tests/unit/catalog.test.ts` and `backend/tests/integration/catalog.test.ts` (assert explanation present)

- [ ] **Step 1 (test):** `explanationsData.test.ts` — assert `EXPLANATIONS` covers exactly the 15 slugs, each with 5 sections, each `heading`/`body` non-empty, headings equal the 5 standard headings in order.
- [ ] **Step 2:** run → fails (module missing).
- [ ] **Step 3:** add `ExplanationSection { heading: string; body: string }` and `explanation: ExplanationSection[]` to `AlgorithmDetail` in `Algorithm.ts`.
- [ ] **Step 4:** create `explanationsData.ts` with `EXPLANATIONS` (full authored content for all 15).
- [ ] **Step 5:** create migration `009`; add `algorithm_explanations` to `TABLES_REVERSE` (before `algorithms`) in `run.ts`.
- [ ] **Step 6:** create `seedExplanations.ts` (resolve algorithm_id by slug; insert sections only if algorithm has zero explanation rows; bind variables); call it in `run.ts` `seed()` after `seedCatalog`.
- [ ] **Step 7:** in `OracleAlgorithmRepository.loadDetail`, add `SELECT heading, body FROM algorithm_explanations WHERE algorithm_id = :id ORDER BY display_order` and map to `explanation`. Add `explanation: []` default if no rows.
- [ ] **Step 8:** update `fakeAlgorithmRepository.ts` defaults to include `explanation` (≥1 section) and set `explanation: []` in create/update.
- [ ] **Step 9:** extend `tests/unit/catalog.test.ts` (`getAlgorithmDetail` returns `explanation`) and `tests/integration/catalog.test.ts` (`GET /algorithms/binary-search` body has `explanation` array).
- [ ] **Step 10:** run unit data test → pass; `npm run typecheck`; `npm test` → all pass.
- [ ] **Step 11 (live):** create table 009 on the running DB (guarded; non-destructive) + run `seedExplanations`; `curl /algorithms/bubble-sort` shows 5 sections.

## Task 2: Frontend — Explain button + modal

**Files:** `frontend/index.html`, `frontend/js/app.js`, `frontend/styles.css`

- [ ] **Step 1:** add `#btn-explain` ("📖 Explain") to the `.detail-head` in `index.html`.
- [ ] **Step 2:** add `#explain-modal` overlay markup (title, body container, close button) at end of `<body>`.
- [ ] **Step 3:** `app.js` — `renderDetailPanel` shows/hides `#btn-explain` from `detail.explanation.length`; add `openExplanation()` / `closeExplanation()` building `<section><h4>heading</h4><p>body</p></section>` per section; wire button/X/backdrop/Esc.
- [ ] **Step 4:** `showComingSoon` hides the Explain button.
- [ ] **Step 5:** `styles.css` — theme-aware overlay + dialog + section styles.
- [ ] **Step 6 (manual):** open Explain on bubble-sort, dijkstra, knapsack; all 5 sections render; closes via X/Esc/backdrop; both themes legible.

## Task 3: Cleanup unused algorithms

**Files:** `frontend/js/algorithms.js`

- [ ] **Step 1:** remove all `STUB_*` arrays + their `forEach(addAlgo…)` blocks and the unused real generators (`quickhoare, heap, shell, cocktail, gnome, counting, oddeven, cycle, bogo, twosum, kadane, dutchflag, bstinsert, bfsgrid, gameoflife, gcd, customsort`). Keep the 13 used `addAlgo` defs + `graphDFS`/`graphDijkstra` + `addAlgo`/`ALGO_DATABASE`/`ALGO_REGISTRY`.
- [ ] **Step 2:** fix the stale header comment.
- [ ] **Step 3 (verify):** `node --check`; re-run the Node `ALGO_REGISTRY` check (15 keys, all callable, DFS/Dijkstra valid).

## Task 4: Full verification

- [ ] Backend `npm run typecheck && npm test` green; live `GET /algorithms/:slug` includes 5 explanation sections.
- [ ] Frontend JS parse + registry check pass; DOM-id cross-check for new modal ids.
- [ ] Manual: Explain modal + cleanup didn't break selection (visual, by user/me as feasible).
