# QuantumViz — Improvements Design Spec (theming, backend-driven catalog, curated algorithms)

- **Date:** 2026-06-22
- **Status:** Approved (design) — pending written-spec review
- **Author:** QuantumViz team (university IDP project)
- **Builds on:** [2026-06-19-quantumviz-fullstack-design.md](2026-06-19-quantumviz-fullstack-design.md)

---

## 1. Purpose & context

The full-stack foundation exists (Express API + Oracle + auth + bookmarks/progress, and an
[account.html](../../../frontend/account.html) page that already talks to the API). This spec
covers a focused round of improvements to the **main visualizer experience**:

1. **Light + dark mode** with a refined visual identity.
2. **Load the algorithm catalog from the backend** (the DB becomes the source of truth for the
   list and metadata), instead of a hardcoded client-side database.
3. **Fix the broken / incorrect algorithms** — most of the current set are fake placeholders.
4. **Make visualization work for every shipped algorithm** (dynamic renderer selection + a safe
   fallback).
5. **Enhance the UI**, primarily a rich algorithm-detail panel fed by DB data.

### Current state (what we're changing)

- The main page ([index.html](../../../frontend/index.html) + [app.js](../../../frontend/js/app.js))
  is **100% client-side**: it reads a hardcoded `ALGO_DATABASE` (~42 entries) in
  [algorithms.js](../../../frontend/js/algorithms.js) and never calls the API. Only
  `account.html` uses the backend.
- The DB seed ([seedCatalog.ts](../../../backend/db/seeds/seedCatalog.ts)) contains **7**
  algorithms; the frontend has ~42. Join keys **don't match**: frontend uses short ids
  (`bubble`), the DB uses slugs (`bubble-sort`).
- **~24 of the ~42 frontend algorithms are fake "stub" placeholders** (e.g. `STUB_GRAPHS`
  renders DFS/Dijkstra/Prim/Kruskal/Tarjan as an identical 3-step fake; `STUB_TREES`,
  `STUB_LISTS`, `STUB_DP`, radix/bucket/ternary/jump search, etc.). This is why "visualization
  isn't working for all."
- [docs/data-flow.md](../../../docs/data-flow.md) **Flow B already specifies** the
  backend-driven flow we want — it was simply never wired into the main page.

---

## 2. Locked design decisions

These were confirmed during brainstorming:

| Decision | Choice |
|---|---|
| Algorithm set | **Curate a small, famous, fully-working set** (~15), all seeded in the DB, each verified to animate. Drop the stubs. |
| The seam | **Metadata from DB, generators stay client-side**, joined by `slug` (matches CLAUDE.md + data-flow.md). No server-side step computation. |
| Theming | **Refine the neon identity + add a real light "daylight lab" mode.** `data-theme` on `<html>`, CSS variables, `localStorage`, system-preference default. |
| UI scope | **Rich detail panel from DB.** Responsive/mobile and keyboard/a11y are explicitly out of scope this round. |

---

## 3. Backend-driven catalog (the seam)

Wire the main page to the API per data-flow Flow B.

### Data flow

- **Boot:** `GET /api/v1/categories` → render category pills (data-driven). `GET /api/v1/algorithms`
  → render the sidebar list.
- **Select:** `GET /api/v1/algorithms/:slug` → render the detail panels → look up the
  client-side generator by `slug` → build the reversible step list → drive playback.
- **Filtering/search:** done **client-side over the fetched list** (simpler, fewer round-trips;
  the set is small). Category pills filter in-memory.

### Generator registry (frontend)

- Replace `ALGO_DATABASE` (keyed by short id, holding metadata + generator + `code` from
  `.toString()`) with a registry **keyed by slug** that holds **only**:
  `{ visualizer, generator }` (plus optional per-algorithm visualizer config such as a default
  array, graph, or grid). Names, Big-O, descriptions, and code text now come from the API.
- A small adapter merges the API detail object with the registry entry to produce what the
  playback engine needs.

### Robustness (functional, not polish)

Because the list is now async, the following are **required** (not optional UI polish), or the
page breaks silently:

- A **loading** state while the catalog/detail fetch is in flight.
- An **error banner** if the API is unreachable ("Can't reach the API — is the backend
  running on `localhost:3000`?").
- An **empty** state for a search with no matches.
- If a DB algorithm has **no matching generator**, the visualizer shows a clean
  "Visualization for this algorithm is coming soon" panel instead of a blank/broken canvas.
  (With the curated set this should never fire, but it's the safety net that makes the system
  "dynamic as needed.")

---

## 4. Curated algorithm set (15)

Each entry = **DB seed row (slug, metadata, Big-O, code snippets) + a verified client-side
generator + a working renderer**. Famous/canonical only.

| Category (slug) | Algorithm (slug) | Visualizer | Generator status |
|---|---|---|---|
| sorting | `bubble-sort` | array | exists ✓ |
| sorting | `selection-sort` | array | exists ✓ |
| sorting | `insertion-sort` | array | exists ✓ |
| sorting | `merge-sort` | array | exists ✓ |
| sorting | `quick-sort` | array | exists ✓ (Lomuto) |
| searching | `linear-search` | array | exists ✓ (fix target) |
| searching | `binary-search` | array | exists ✓ (fix: sort input + valid target) |
| graph | `breadth-first-search` | graph | exists ✓ |
| graph | `depth-first-search` | graph | **implement** (currently stub) |
| graph | `dijkstra` | graph | **implement** (currently stub) |
| grid | `a-star` | grid | exists ✓ |
| dynamic-programming | `knapsack-01` | matrix | exists ✓ |
| string | `kmp-search` | string | exists ✓ |
| math | `sieve-of-eratosthenes` | math | exists ✓ |
| math | `tower-of-hanoi` | math | exists ✓ |

**Everything else is dropped** from the shipped set (all the trees/lists/stacks/recursion
stubs, radix/bucket/comb/etc., ternary/jump/interpolation search, Prim/Kruskal/Tarjan/Kosaraju
stubs, LCS/edit-distance stubs). The generators may remain in the source file but are not seeded
and not listed.

### Categories

The DB already seeds: sorting, searching, graph, grid, dynamic-programming, math, lists. We
**add a `string` category** (for KMP). `lists` will have no shipped algorithms and simply won't
appear (the pill list is derived from `/categories`, but we can optionally only show categories
that have ≥1 algorithm — decided in the plan).

---

## 5. Dynamic visualizer dispatch & engine fixes

- The renderer is selected from the **DB `visualizer_type`** (array/grid/graph/matrix/string/math),
  not a hardcoded client field. The 6 renderers in [visualizers.js](../../../frontend/js/visualizers.js)
  are kept.
- Fix rendering gaps so **every step type a shipped generator emits is handled** (e.g. array
  `swap` highlight, search "found"/`sorted` state, graph weighted-edge labels for Dijkstra).
- The "coming soon" fallback (section 3) guarantees no broken canvas for any selectable item.

---

## 6. Algorithm correctness fixes

- **Remove** the 24 stub fakes from the shipped/seeded set.
- **Implement DFS** (real recursive/stack traversal over the demo graph, emitting
  `activeNode`/`traverseEdge`/`visitedNode`).
- **Implement Dijkstra** (priority by tentative distance over a small weighted graph; show
  edge weights and relaxation).
- **binary-search:** sort the working array before searching and choose a target that is
  present (or clearly report "not found" deterministically).
- **linear-search / search demos:** derive the target from the actual input instead of the
  hardcoded `55`.
- Re-key all shipped generators to **slugs** matching the DB.

---

## 7. Theming — light + dark

- Promote every hardcoded color in [styles.css](../../../frontend/styles.css) (and the inline
  styles in `account.html`) into **CSS variables**, defined twice:
  `:root[data-theme="dark"]` and `:root[data-theme="light"]`.
  - **Dark** keeps the neon identity (cyan/pink), with softened glows; the CRT scanline overlay
    becomes lighter / theme-aware.
  - **Light** is a clean "daylight lab" palette — light surfaces, accessible contrast, the same
    cyan/pink accents at darker shades, still recognizably QuantumViz.
- A shared **`theme.js`** (loaded on both pages) reads `localStorage('qv_theme')`, falls back to
  `prefers-color-scheme`, sets `document.documentElement.dataset.theme`, and toggles it.
- A **toggle control** (sun/moon) is added to the topbar on both `index.html` and `account.html`.
- To avoid a flash of the wrong theme, the `data-theme` attribute is set as early as possible
  (small inline snippet in `<head>` or first script).

---

## 8. Rich detail panel from DB

The detail panels surface the DB data that is currently unused:

- Full **description** / explanation text.
- A **difficulty** badge (easy/medium/hard).
- **Best / average / worst** time complexities (not just one figure) + **space** complexity.
- **Code snippets** from the DB (JavaScript + pseudocode), shown in the code area, replacing the
  current behavior of dumping the generator's `.toString()`.
- The **COMPILE & RUN sandbox** stays functional (it still compiles a user-edited generator for
  the array visualizer).

---

## 9. Out of scope (YAGNI for this round)

- Responsive / mobile layout.
- Keyboard shortcuts & deep a11y pass.
- Moving generators/step-computation to the backend.
- Reviving the 24 stub algorithms.
- Any new backend endpoints (the existing catalog API is sufficient).

---

## 10. Affected files (change map)

**Backend**
- `backend/db/seeds/seedCatalog.ts` — expand to the 15 curated algorithms with correct slugs,
  summaries, descriptions, difficulty, space, best/avg/worst, and JS + pseudocode snippets.
- `backend/db/seeds/seedCategories.ts` — add the `string` category.
- (Possibly) `backend/db/seeds/*` wiring if a re-seed/idempotency tweak is needed.

**Frontend**
- `frontend/js/algorithms.js` — re-key shipped generators by slug; implement DFS & Dijkstra; fix
  search targets; drop/ignore stubs in the shipped registry.
- `frontend/js/app.js` — fetch categories + list on boot; fetch detail on select; render from API
  data; loading/error/empty states; generator-missing fallback; build playback from registry.
- `frontend/js/visualizers.js` — fill rendering gaps for shipped step types.
- `frontend/js/api/algorithmsApi.js` — reused as-is (already exposes list/detail/categories).
- `frontend/index.html` — theme toggle; detail panel markup; correct copy ("105+" → real count);
  ensure API client scripts are loaded.
- `frontend/account.html` — theme toggle + variable-ize inline colors.
- `frontend/styles.css` — CSS-variable theming (dark + light), refined glows, theme-aware scanline.
- `frontend/js/theme.js` — **new**, shared theme controller.
- `frontend/js/deep-link.js` — update to work with slug-keyed selection + async load.

---

## 11. Verification

- **Backend:** `npm run typecheck`; `vitest` for seed/repository coverage; run the migration +
  seed against Oracle XE and confirm 15 algorithms + categories are present via the API.
- **Frontend (no test harness):** manually exercise **every** shipped algorithm — select it,
  confirm the correct visualizer renders, play forward to completion, and step **backward**
  (reversibility), in **both** light and dark themes. Confirm graceful behavior when the API is
  down. Report results honestly before claiming done.

---

## 12. Risks & notes

- **Slug alignment** is the subtle part: the DB slug, the seed, and the frontend registry key
  must match exactly. A mismatch makes an algorithm appear in the list but fail to animate
  (handled by the fallback, but it would be a regression to verify against).
- **Oracle must be running** to load the catalog; the error banner makes this obvious to the
  user/grader rather than presenting a blank page.
- Dark-theme refinement should stay conservative — keep the project's recognizable identity; this
  is not a full redesign.
