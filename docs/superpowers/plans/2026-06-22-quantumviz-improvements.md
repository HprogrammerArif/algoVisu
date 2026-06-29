# QuantumViz Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the main visualizer page load its algorithm catalog from the Oracle-backed API, ship a small curated set of correct algorithms with working reversible visualizations, and add a light/dark theme plus a DB-driven detail panel.

**Architecture:** The DB is the source of truth for the algorithm list and metadata (name, description, Big-O, code text); the browser keeps the reversible step-generators, joined to DB rows by `slug` (per [docs/data-flow.md](../../data-flow.md) Flow B). The frontend stays vanilla (no build/npm/TS). Theming is CSS-variable based, switched by `data-theme` on `<html>`.

**Tech Stack:** Backend TypeScript (strict) + Express + node-oracledb + vitest. Frontend plain HTML/CSS/vanilla JS, no build step. Oracle XE 21c.

**Reference spec:** [docs/superpowers/specs/2026-06-22-quantumviz-improvements-design.md](../specs/2026-06-22-quantumviz-improvements-design.md)

## Global Constraints

- **Frontend is vanilla:** no React/Next, no TypeScript, no bundler, no npm, no build step. Scripts load via `<script>` tags; cross-file sharing is via `window.QV` / globals. Keep the neon-on-dark monospace identity.
- **No new tooling/dependencies** without asking (frontend has no package manager at all).
- **Backend dependency rule:** inner layers never import outer layers. Raw SQL lives only in `infrastructure/database/repositories/` and always uses bind variables. (This plan only touches `backend/db/seeds/*`, which already runs raw SQL with binds — keep that style.)
- **DB constraints (verbatim):** `visualizer_type IN ('array','grid','graph','matrix','string','math')`; `difficulty IN ('easy','medium','hard')`; snippet `language IN ('javascript','python','cpp','java','pseudocode')` — this plan uses only `javascript` and `pseudocode`; `algorithms.slug` is UNIQUE; `code_snippets` is UNIQUE per `(algorithm_id, language)`.
- **Reversibility:** every generator must replay forward AND backward; the snapshot engine already stores a full state per step — do not break that.
- **Commits:** per project [CLAUDE.md](../../../CLAUDE.md), do NOT commit or push unless the user asks; when asked, branch off `master` first. The `git commit` steps below are the intended cadence — get the user's go-ahead before the first commit.
- **Curated set (15 slugs, exact):** `bubble-sort`, `selection-sort`, `insertion-sort`, `merge-sort`, `quick-sort`, `linear-search`, `binary-search`, `breadth-first-search`, `depth-first-search`, `dijkstra`, `a-star`, `knapsack-01`, `kmp-search`, `sieve-of-eratosthenes`, `tower-of-hanoi`.

---

## File Structure

**Backend**
- Create `backend/db/seeds/catalogData.ts` — exports the typed `ALGORITHMS` array (the 15 curated entries). Pure data, no DB calls — testable.
- Modify `backend/db/seeds/seedCatalog.ts` — import `ALGORITHMS` from `catalogData.ts`; keep the insert logic.
- Modify `backend/db/seeds/seedCategories.ts` — add the `string` category.
- Create `backend/tests/unit/catalogData.test.ts` — validates the curated data shape.

**Frontend**
- Create `frontend/js/theme.js` — shared theme controller (`window.QV.theme`).
- Modify `frontend/styles.css` — hoist colors into `:root[data-theme="dark"|"light"]` variable blocks; theme-aware scanline/glows.
- Modify `frontend/index.html` — load API client scripts + theme.js; add theme toggle; add detail-panel markup; fix stale copy.
- Modify `frontend/account.html` — add theme toggle; load theme.js; variable-ize inline colors.
- Modify `frontend/js/algorithms.js` — add real `graphDFS` + `graphDijkstra`; fix `binarysearch`/`linearsearch` targets; add slug-keyed `ALGO_REGISTRY`.
- Modify `frontend/js/app.js` — fetch catalog/detail from API; render list + detail from API; loading/error/empty states; generator-missing fallback; drive playback from `ALGO_REGISTRY` by slug + `visualizerType` from detail.
- Modify `frontend/js/visualizers.js` — fill rendering gaps for shipped step types.
- Modify `frontend/js/deep-link.js` — slug-based, async-safe selection.

---

## Task 1: Backend — curated catalog data, `string` category, seed refactor

**Files:**
- Create: `backend/db/seeds/catalogData.ts`
- Modify: `backend/db/seeds/seedCatalog.ts:1-345`
- Modify: `backend/db/seeds/seedCategories.ts:3-11`
- Test: `backend/tests/unit/catalogData.test.ts`

**Interfaces:**
- Produces: `export const ALGORITHMS: SeedAlgorithm[]` and `export interface SeedAlgorithm` from `catalogData.ts`. `SeedAlgorithm` = `{ categorySlug: string; slug: string; name: string; summary: string; description: string; visualizerType: 'array'|'grid'|'graph'|'matrix'|'string'|'math'; difficulty: 'easy'|'medium'|'hard'; spaceComplexity: string; time: { best: string; average: string; worst: string }; snippets: { language: 'javascript'|'pseudocode'; code: string }[] }`.
- Consumes (Task 4 frontend, indirectly): the API will serve these 15 slugs + `visualizerType`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/catalogData.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from '../../db/seeds/catalogData';

const EXPECTED_SLUGS = [
  'bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort',
  'linear-search', 'binary-search',
  'breadth-first-search', 'depth-first-search', 'dijkstra',
  'a-star', 'knapsack-01', 'kmp-search',
  'sieve-of-eratosthenes', 'tower-of-hanoi',
];
const VIZ = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
const DIFF = ['easy', 'medium', 'hard'];
const CATS = ['sorting', 'searching', 'graph', 'grid', 'dynamic-programming', 'string', 'math'];

describe('curated catalog data', () => {
  it('defines exactly the 15 curated algorithms', () => {
    expect(ALGORITHMS).toHaveLength(15);
    expect(ALGORITHMS.map((a) => a.slug).sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it('has unique slugs', () => {
    const slugs = ALGORITHMS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every entry has valid required fields', () => {
    for (const a of ALGORITHMS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(VIZ).toContain(a.visualizerType);
      expect(DIFF).toContain(a.difficulty);
      expect(CATS).toContain(a.categorySlug);
      expect(a.spaceComplexity.length).toBeGreaterThan(0);
      expect(a.time.best.length).toBeGreaterThan(0);
      expect(a.time.average.length).toBeGreaterThan(0);
      expect(a.time.worst.length).toBeGreaterThan(0);
    }
  });

  it('every entry has javascript + pseudocode snippets', () => {
    for (const a of ALGORITHMS) {
      const langs = a.snippets.map((s) => s.language);
      expect(langs).toContain('javascript');
      expect(langs).toContain('pseudocode');
      for (const s of a.snippets) expect(s.code.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers all six visualizer types', () => {
    const used = new Set(ALGORITHMS.map((a) => a.visualizerType));
    for (const v of VIZ) expect(used).toContain(v);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run tests/unit/catalogData.test.ts`
Expected: FAIL — cannot resolve `../../db/seeds/catalogData` (module does not exist yet).

- [ ] **Step 3: Create `catalogData.ts` with the type + the 7 carried-over entries**

Create `backend/db/seeds/catalogData.ts`. Start with the interface and the 7 entries that already exist in `seedCatalog.ts` today — copy them **verbatim** from `backend/db/seeds/seedCatalog.ts` (the objects for `bubble-sort`, `selection-sort`, `insertion-sort`, `linear-search`, `binary-search`, `breadth-first-search`, `depth-first-search`), wrapped in the new exported array:

```typescript
export type Difficulty = 'easy' | 'medium' | 'hard';
export type VisualizerType = 'array' | 'grid' | 'graph' | 'matrix' | 'string' | 'math';

export interface SeedAlgorithm {
  categorySlug: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  visualizerType: VisualizerType;
  difficulty: Difficulty;
  spaceComplexity: string;
  time: { best: string; average: string; worst: string };
  snippets: { language: 'javascript' | 'pseudocode'; code: string }[];
}

export const ALGORITHMS: SeedAlgorithm[] = [
  // --- 7 carried over verbatim from the old seedCatalog.ts ---
  // bubble-sort, selection-sort, insertion-sort, linear-search, binary-search,
  // breadth-first-search, depth-first-search
  // (paste the existing 7 objects here unchanged)

  // --- 8 new entries below (Step 4) ---
];
```

- [ ] **Step 4: Add the 8 new entries to the array**

Append these 8 objects inside `ALGORITHMS` (after the 7 carried-over):

```typescript
  {
    categorySlug: 'sorting',
    slug: 'merge-sort',
    name: 'Merge Sort',
    summary: 'Divides the array, sorts halves, then merges them in order.',
    description:
      'Merge sort recursively splits the array into halves until each piece has one element, then merges adjacent pieces back together in sorted order. A stable, predictable O(n log n) divide-and-conquer sort that uses O(n) extra space for the merge buffer.',
    visualizerType: 'array',
    difficulty: 'medium',
    spaceComplexity: 'O(n)',
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function mergeSort(a) {',
          '  if (a.length <= 1) return a;',
          '  const mid = a.length >> 1;',
          '  const left = mergeSort(a.slice(0, mid));',
          '  const right = mergeSort(a.slice(mid));',
          '  const out = [];',
          '  let i = 0, j = 0;',
          '  while (i < left.length && j < right.length) {',
          '    out.push(left[i] <= right[j] ? left[i++] : right[j++]);',
          '  }',
          '  return out.concat(left.slice(i), right.slice(j));',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'mergeSort(A):',
          '  if length(A) <= 1 return A',
          '  L = mergeSort(left half); R = mergeSort(right half)',
          '  return merge(L, R)   // merge two sorted lists',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'sorting',
    slug: 'quick-sort',
    name: 'Quick Sort',
    summary: 'Partitions around a pivot, then sorts each side recursively.',
    description:
      'Quick sort picks a pivot and partitions the array so smaller elements go left and larger go right (Lomuto scheme), then recurses on each side. Very fast on average (O(n log n)); degrades to O(n^2) on already-sorted input with a poor pivot. Sorts in place.',
    visualizerType: 'array',
    difficulty: 'medium',
    spaceComplexity: 'O(log n)',
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function quickSort(a, lo = 0, hi = a.length - 1) {',
          '  if (lo >= hi) return a;',
          '  const pivot = a[hi];',
          '  let p = lo;',
          '  for (let j = lo; j < hi; j++) {',
          '    if (a[j] <= pivot) { [a[p], a[j]] = [a[j], a[p]]; p++; }',
          '  }',
          '  [a[p], a[hi]] = [a[hi], a[p]];',
          '  quickSort(a, lo, p - 1);',
          '  quickSort(a, p + 1, hi);',
          '  return a;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'quickSort(A, lo, hi):',
          '  if lo >= hi return',
          '  p = partition(A, lo, hi)   // Lomuto: pivot = A[hi]',
          '  quickSort(A, lo, p-1); quickSort(A, p+1, hi)',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'graph',
    slug: 'dijkstra',
    name: "Dijkstra's Shortest Path",
    summary: 'Finds shortest paths from a source over non-negative weights.',
    description:
      "Dijkstra's algorithm grows a set of finalized vertices, each time picking the unvisited vertex with the smallest tentative distance and relaxing its outgoing edges. It computes shortest paths from one source to all vertices in a graph with non-negative edge weights.",
    visualizerType: 'graph',
    difficulty: 'hard',
    spaceComplexity: 'O(V)',
    time: { best: 'O(E + V log V)', average: 'O(E + V log V)', worst: 'O(E + V log V)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function dijkstra(graph, src) {',
          '  const dist = {}; const done = new Set();',
          '  for (const v in graph) dist[v] = Infinity;',
          '  dist[src] = 0;',
          '  while (done.size < Object.keys(graph).length) {',
          '    let u = null;',
          '    for (const v in graph) if (!done.has(v) && (u === null || dist[v] < dist[u])) u = v;',
          '    if (u === null || dist[u] === Infinity) break;',
          '    done.add(u);',
          '    for (const { to, w } of graph[u]) {',
          '      if (dist[u] + w < dist[to]) dist[to] = dist[u] + w;',
          '    }',
          '  }',
          '  return dist;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'dist[src] = 0; others = infinity',
          'while unfinished vertices remain:',
          '  u = unfinished vertex with smallest dist',
          '  mark u finished',
          '  for each edge (u, v, w): dist[v] = min(dist[v], dist[u] + w)',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'grid',
    slug: 'a-star',
    name: 'A* Pathfinding',
    summary: 'Best-first grid search guided by a heuristic (f = g + h).',
    description:
      'A* searches a grid for the shortest path by always expanding the frontier cell with the lowest f = g + h, where g is the cost so far and h is a heuristic estimate (Manhattan distance) to the goal. With an admissible heuristic it finds an optimal path while exploring far fewer cells than uninformed search.',
    visualizerType: 'grid',
    difficulty: 'hard',
    spaceComplexity: 'O(V)',
    time: { best: 'O(E)', average: 'O(E log V)', worst: 'O(E log V)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function aStar(grid, start, goal) {',
          '  const h = (p) => Math.abs(p[0]-goal[0]) + Math.abs(p[1]-goal[1]);',
          '  const open = [start]; const g = { [start]: 0 }; const came = {};',
          '  while (open.length) {',
          '    open.sort((a, b) => (g[a]+h(a)) - (g[b]+h(b)));',
          '    const cur = open.shift();',
          '    if (cur[0]===goal[0] && cur[1]===goal[1]) return reconstruct(came, cur);',
          '    for (const nb of neighbours(grid, cur)) {',
          '      const t = g[cur] + 1;',
          '      if (g[nb] === undefined || t < g[nb]) { g[nb] = t; came[nb] = cur; open.push(nb); }',
          '    }',
          '  }',
          '  return null;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'open = {start}; g[start] = 0',
          'while open not empty:',
          '  current = node in open with lowest g + h',
          '  if current == goal: return path',
          '  for each neighbour n: relax g[n], add n to open',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'dynamic-programming',
    slug: 'knapsack-01',
    name: '0/1 Knapsack',
    summary: 'Maximizes value within a weight budget; each item taken once.',
    description:
      'The 0/1 knapsack problem fills a table dp[i][w] = the best value achievable using the first i items within capacity w. Each cell either excludes item i (dp[i-1][w]) or includes it (value[i] + dp[i-1][w-weight[i]]) when it fits. The answer is the bottom-right cell.',
    visualizerType: 'matrix',
    difficulty: 'medium',
    spaceComplexity: 'O(nW)',
    time: { best: 'O(nW)', average: 'O(nW)', worst: 'O(nW)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function knapsack(weights, values, W) {',
          '  const n = weights.length;',
          '  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));',
          '  for (let i = 1; i <= n; i++) {',
          '    for (let w = 0; w <= W; w++) {',
          '      dp[i][w] = dp[i - 1][w];',
          '      if (weights[i - 1] <= w) {',
          '        dp[i][w] = Math.max(dp[i][w], values[i - 1] + dp[i - 1][w - weights[i - 1]]);',
          '      }',
          '    }',
          '  }',
          '  return dp[n][W];',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'dp[0][*] = 0',
          'for i in 1..n, for w in 0..W:',
          '  dp[i][w] = dp[i-1][w]',
          '  if weight[i] <= w:',
          '    dp[i][w] = max(dp[i][w], value[i] + dp[i-1][w-weight[i]])',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'string',
    slug: 'kmp-search',
    name: 'KMP Pattern Search',
    summary: 'Substring search that never re-checks characters, via an LPS table.',
    description:
      'The Knuth-Morris-Pratt algorithm preprocesses the pattern into a longest-proper-prefix-suffix (LPS) table, then scans the text once. On a mismatch it consults the LPS table to skip ahead without re-comparing characters already known to match, giving O(n + m) time.',
    visualizerType: 'string',
    difficulty: 'hard',
    spaceComplexity: 'O(m)',
    time: { best: 'O(n)', average: 'O(n + m)', worst: 'O(n + m)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function kmp(text, pat) {',
          '  const lps = Array(pat.length).fill(0);',
          '  for (let i = 1, len = 0; i < pat.length; ) {',
          '    if (pat[i] === pat[len]) lps[i++] = ++len;',
          '    else if (len) len = lps[len - 1];',
          '    else lps[i++] = 0;',
          '  }',
          '  for (let i = 0, j = 0; i < text.length; ) {',
          '    if (text[i] === pat[j]) { i++; j++; if (j === pat.length) return i - j; }',
          '    else if (j) j = lps[j - 1];',
          '    else i++;',
          '  }',
          '  return -1;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'build LPS table for pattern',
          'i = 0 (text), j = 0 (pattern)',
          'on match: advance both; if j == m report match, j = LPS[j-1]',
          'on mismatch: j = LPS[j-1] if j>0 else advance i',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'math',
    slug: 'sieve-of-eratosthenes',
    name: 'Sieve of Eratosthenes',
    summary: 'Finds all primes up to n by crossing out multiples.',
    description:
      'The Sieve of Eratosthenes lists the integers up to n and repeatedly takes the next number still marked prime, crossing out all of its multiples. What remains unmarked are the primes. Runs in O(n log log n).',
    visualizerType: 'math',
    difficulty: 'easy',
    spaceComplexity: 'O(n)',
    time: { best: 'O(n log log n)', average: 'O(n log log n)', worst: 'O(n log log n)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function sieve(n) {',
          '  const isPrime = Array(n + 1).fill(true);',
          '  isPrime[0] = isPrime[1] = false;',
          '  for (let p = 2; p * p <= n; p++) {',
          '    if (isPrime[p]) {',
          '      for (let m = p * p; m <= n; m += p) isPrime[m] = false;',
          '    }',
          '  }',
          '  return isPrime.flatMap((v, i) => (v ? [i] : []));',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'mark all 2..n as prime',
          'for p from 2 while p*p <= n:',
          '  if p is prime: mark p*p, p*p+p, ... as composite',
          'remaining marked numbers are prime',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'math',
    slug: 'tower-of-hanoi',
    name: 'Tower of Hanoi',
    summary: 'Moves a stack of disks between pegs, never placing larger on smaller.',
    description:
      'Tower of Hanoi moves n disks from a source peg to a target peg using one auxiliary peg, moving one disk at a time and never placing a larger disk on a smaller one. The recursive solution moves n-1 disks aside, moves the largest disk, then moves the n-1 back — requiring 2^n - 1 moves.',
    visualizerType: 'math',
    difficulty: 'medium',
    spaceComplexity: 'O(n)',
    time: { best: 'O(2^n)', average: 'O(2^n)', worst: 'O(2^n)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function hanoi(n, from, to, aux, moves = []) {',
          '  if (n === 0) return moves;',
          '  hanoi(n - 1, from, aux, to, moves);',
          '  moves.push([from, to]);',
          '  hanoi(n - 1, aux, to, from, moves);',
          '  return moves;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'hanoi(n, from, to, aux):',
          '  if n == 0 return',
          '  hanoi(n-1, from, aux, to)',
          '  move disk n from `from` to `to`',
          '  hanoi(n-1, aux, to, from)',
        ].join('\n'),
      },
    ],
  },
```

- [ ] **Step 5: Point `seedCatalog.ts` at the new data module**

In `backend/db/seeds/seedCatalog.ts`, delete the local `type Difficulty`, `type VisualizerType`, `interface SeedAlgorithm`, and the entire `const ALGORITHMS: SeedAlgorithm[] = [ ... ]` literal (lines ~3-295). Replace the top of the file so it imports the data instead:

```typescript
import oracledb, { type Connection } from 'oracledb';
import { ALGORITHMS } from './catalogData';
```

Leave the `export async function seedCatalog(conn: Connection)` body unchanged — it already iterates `ALGORITHMS` and inserts algorithm + time_complexities + code_snippets with bind variables.

- [ ] **Step 6: Add the `string` category**

In `backend/db/seeds/seedCategories.ts`, add one entry to the `CATEGORIES` array (before `lists` so display order reads naturally):

```typescript
  { slug: 'string', name: 'Strings', description: 'Pattern matching on text', order: 7 },
  { slug: 'lists', name: 'Lists', description: 'Linked lists and sequences', order: 8 },
```

(Change the existing `lists` entry's `order` from 7 to 8 as shown; the `string` row uses order 7.)

- [ ] **Step 7: Run the data test to verify it passes**

Run: `cd backend && npx vitest run tests/unit/catalogData.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 8: Run typecheck + full unit suite**

Run: `cd backend && npm run typecheck && npx vitest run tests/unit`
Expected: typecheck clean; all unit tests PASS (the existing `catalog.test.ts` uses fakes and is unaffected).

- [ ] **Step 9: (If Oracle XE is running) re-seed and verify via the API**

Run: `cd backend && npm run db:seed`
Then with the server running (`npm run dev`): `curl http://localhost:3000/api/v1/algorithms` should list 15 algorithms; `curl http://localhost:3000/api/v1/algorithms/dijkstra` should return detail with `timeComplexities` and two `codeSnippets`.
If Oracle is not available, note it and rely on Steps 7-8; verify against Oracle before final sign-off.

- [ ] **Step 10: Commit** (only after user authorization — see Global Constraints)

```bash
git add backend/db/seeds/catalogData.ts backend/db/seeds/seedCatalog.ts backend/db/seeds/seedCategories.ts backend/tests/unit/catalogData.test.ts
git commit -m "feat(catalog): curate 15 algorithms in DB seed + add string category"
```

---

## Task 2: Frontend — light/dark theming system

**Files:**
- Create: `frontend/js/theme.js`
- Modify: `frontend/styles.css:1-18` (the `:root` block) and color usages
- Modify: `frontend/index.html` (head + topbar)
- Modify: `frontend/account.html` (head + header)

**Interfaces:**
- Produces: `window.QV.theme = { get(), set(theme), toggle() }` where `theme` is `'dark'|'light'`; persists to `localStorage('qv_theme')`; applies `document.documentElement.dataset.theme`.

- [ ] **Step 1: Create the theme controller**

Create `frontend/js/theme.js`:

```javascript
// Shared light/dark theme controller. No build step — global under window.QV.
(function () {
  'use strict';
  var KEY = 'qv_theme';
  function preferred() {
    var saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === 'dark' ? '☀ LIGHT' : '☾ DARK';
      btns[i].setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
    }
  }
  function set(theme) {
    localStorage.setItem(KEY, theme);
    apply(theme);
  }
  window.QV = window.QV || {};
  window.QV.theme = {
    get: preferred,
    set: set,
    toggle: function () { set(preferred() === 'dark' ? 'light' : 'dark'); },
  };
  // Apply ASAP (script is loaded in <head>); wire up toggles after DOM is ready.
  apply(preferred());
  document.addEventListener('DOMContentLoaded', function () {
    apply(preferred());
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () { window.QV.theme.toggle(); });
    }
  });
})();
```

- [ ] **Step 2: Convert `styles.css` to themed variable blocks**

Replace the existing `:root { ... }` block (lines 1-18) with two theme blocks. Keep the same variable NAMES already used throughout the file so existing rules keep working:

```css
:root[data-theme="dark"] {
  --bg:          #030712;
  --bg-panel:    #090f1d;
  --bg-card:     #0f172a;
  --border:      #1e293b;
  --border-glow: rgba(0, 240, 255, 0.15);
  --neon-cyan:   #00f0ff;
  --neon-pink:   #ff2a5f;
  --neon-green:  #00ff66;
  --neon-gold:   #ffb700;
  --text:        #e2e8f0;
  --text-dim:    #64748b;
  --scanline:    rgba(0, 240, 255, 0.01);
  --glow-strength: 0.4;
  --mono:        'Share Tech Mono', monospace;
  --ui:          'Rajdhani', sans-serif;
}

:root[data-theme="light"] {
  --bg:          #eef2f7;
  --bg-panel:    #ffffff;
  --bg-card:     #f4f7fb;
  --border:      #cbd5e1;
  --border-glow: rgba(2, 132, 199, 0.18);
  --neon-cyan:   #0e7490;
  --neon-pink:   #be123c;
  --neon-green:  #15803d;
  --neon-gold:   #b45309;
  --text:        #0f172a;
  --text-dim:    #64748b;
  --scanline:    rgba(2, 132, 199, 0.015);
  --glow-strength: 0.12;
  --mono:        'Share Tech Mono', monospace;
  --ui:          'Rajdhani', sans-serif;
}

/* Default when no attribute is set yet (matches dark) */
:root { color-scheme: dark; }
```

- [ ] **Step 3: Make the scanline + brand glow theme-aware**

In `styles.css`, update the scanline overlay rule (the `body::after` block, ~line 37-40) to use the variable so light mode softens it:

```css
body::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 99999;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline) 2px, var(--scanline) 4px);
}
```

And change the hardcoded brand text-shadows (around line 50-53) to use the strength variable, e.g.:

```css
.brand { font-family: var(--mono); font-size: 18px; color: var(--neon-cyan);
  text-shadow: 0 0 10px rgba(0,240,255,var(--glow-strength)); letter-spacing: 3px; font-weight: bold; }
```

(Scan `styles.css` for other hardcoded `rgba(0,240,255,0.4)` / `rgba(255,42,95,0.4)` glow shadows and swap the alpha for `var(--glow-strength)`. Leave structural colors that already use the `--` variables alone.)

- [ ] **Step 4: Add the toggle + early theme script to `index.html`**

In `index.html` `<head>`, load `theme.js` BEFORE `styles.css` is not required, but it must run early — add right after the stylesheet link:

```html
  <script src="js/theme.js"></script>
```

In the topbar `.sys-status` block, add a toggle button before the ACCOUNT link:

```html
      <button class="theme-toggle" data-theme-toggle aria-label="Switch theme">☀ LIGHT</button>
      <span>|</span>
```

Add a small style for `.theme-toggle` in `styles.css` (near the topbar rules):

```css
.theme-toggle {
  font-family: var(--mono); font-size: 11px; cursor: pointer;
  background: transparent; color: var(--neon-cyan);
  border: 1px solid var(--border); border-radius: 4px; padding: 3px 8px;
}
.theme-toggle:hover { border-color: var(--neon-cyan); }
```

- [ ] **Step 5: Add the toggle + script to `account.html`**

Load `js/theme.js` in `account.html`'s `<head>` and add a `data-theme-toggle` button in its header. (Account page uses inline styles; the toggle still works because `theme.js` only flips `data-theme`. Where the page hardcodes dark colors inline, replace the most prominent ones — page background, card background, text — with the same CSS variables so light mode is legible. Keep this change minimal.)

- [ ] **Step 6: Manual verification**

Serve the frontend (`npx serve frontend` or any static server) and open `index.html`.
Expected:
- On first load with no saved pref, theme follows the OS setting.
- Clicking the toggle flips dark ⇄ light; the button label updates (☀ LIGHT ⇄ ☾ DARK); colors change with no broken/unreadable panels; no flash of wrong theme on reload.
- Reload keeps the chosen theme (localStorage).
- `account.html` toggles too and stays readable in both themes.

- [ ] **Step 7: Commit** (after authorization)

```bash
git add frontend/js/theme.js frontend/styles.css frontend/index.html frontend/account.html
git commit -m "feat(frontend): add light/dark theme with persistence + toggle"
```

---

## Task 3: Frontend — slug registry, real DFS & Dijkstra, search fixes

**Files:**
- Modify: `frontend/js/algorithms.js` (add two generators near the graph section ~line 688; fix `binarysearch`/`linearsearch` ~lines 380-411; append `ALGO_REGISTRY` at end of file)

**Interfaces:**
- Produces: global `ALGO_REGISTRY` — an object mapping each of the 15 slugs to a generator function. Consumed by `app.js` (Task 4) via `ALGO_REGISTRY[slug]`.
- Consumes: existing `ALGO_DATABASE[id].generator` functions (kept as the implementation store).

- [ ] **Step 1: Implement real DFS**

In `frontend/js/algorithms.js`, add a real DFS generator (place it right after the `graphBFS` `addAlgo(...)` block, ~line 724). It uses the same step protocol as BFS (`initGraph`, `activeNode`, `traverseEdge`, `visitedNode`):

```javascript
function* graphDFS() {
  const nodes = [
    { id: 0, label: 'A', x: 100, y: 150 },
    { id: 1, label: 'B', x: 220, y: 60 },
    { id: 2, label: 'C', x: 220, y: 240 },
    { id: 3, label: 'D', x: 380, y: 60 },
    { id: 4, label: 'E', x: 380, y: 240 },
    { id: 5, label: 'F', x: 500, y: 150 },
  ];
  const edges = [
    { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 4 }, { u: 3, v: 5 }, { u: 4, v: 5 },
  ];
  yield { type: 'initGraph', nodes, edges, log: 'Initialize adjacency list representation' };

  const adj = (id) => edges.filter((e) => e.u === id || e.v === id).map((e) => (e.u === id ? e.v : e.u)).sort((a, b) => a - b);
  const visited = new Set();

  function* visit(curr) {
    visited.add(curr);
    yield { type: 'activeNode', node: curr, log: `Visit vertex ${nodes[curr].label}`, vars: { visited: [...visited].map((x) => nodes[x].label).join(',') } };
    for (const nb of adj(curr)) {
      if (!visited.has(nb)) {
        yield { type: 'traverseEdge', u: curr, v: nb, log: `Descend edge ${nodes[curr].label} → ${nodes[nb].label}` };
        yield* visit(nb);
      }
    }
    yield { type: 'visitedNode', node: curr, log: `Backtrack from ${nodes[curr].label}` };
  }
  yield* visit(0);
  yield { type: 'done', log: 'DFS traversal complete' };
}
```

- [ ] **Step 2: Implement real Dijkstra**

Right after `graphDFS`, add:

```javascript
function* graphDijkstra() {
  const nodes = [
    { id: 0, label: 'A', x: 100, y: 150 },
    { id: 1, label: 'B', x: 240, y: 60 },
    { id: 2, label: 'C', x: 240, y: 240 },
    { id: 3, label: 'D', x: 400, y: 60 },
    { id: 4, label: 'E', x: 400, y: 240 },
    { id: 5, label: 'F', x: 540, y: 150 },
  ];
  const edges = [
    { u: 0, v: 1, w: 4 }, { u: 0, v: 2, w: 2 }, { u: 2, v: 1, w: 1 },
    { u: 1, v: 3, w: 5 }, { u: 2, v: 4, w: 8 }, { u: 3, v: 5, w: 3 }, { u: 4, v: 5, w: 6 },
  ];
  yield { type: 'initGraph', nodes, edges, log: 'Initialize weighted graph' };

  const n = nodes.length;
  const dist = Array(n).fill(Infinity);
  const done = new Set();
  dist[0] = 0;
  const show = () => dist.map((d) => (d === Infinity ? '∞' : d)).join(',');
  yield { type: 'activeNode', node: 0, log: 'Source A distance = 0', vars: { dist: show() } };

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done.has(i) && (u === -1 || dist[i] < dist[u])) u = i;
    if (u === -1 || dist[u] === Infinity) break;
    done.add(u);
    yield { type: 'visitedNode', node: u, log: `Finalize ${nodes[u].label} (dist ${dist[u]})`, vars: { current: nodes[u].label, dist: show() } };

    for (const e of edges) {
      let v = null;
      if (e.u === u) v = e.v; else if (e.v === u) v = e.u; else continue;
      if (done.has(v)) continue;
      yield { type: 'traverseEdge', u, v, log: `Relax ${nodes[u].label} → ${nodes[v].label} (w=${e.w})` };
      if (dist[u] + e.w < dist[v]) {
        dist[v] = dist[u] + e.w;
        yield { type: 'activeNode', node: v, log: `Update ${nodes[v].label} dist = ${dist[v]}`, vars: { node: nodes[v].label, dist: show() } };
      }
    }
  }
  yield { type: 'done', log: 'Shortest distances finalized' };
}
```

- [ ] **Step 3: Fix `binarysearch` to sort input + use a present target**

In the `binarysearch` generator (~line 394), replace the hardcoded `const target = 55;` and add a sort + target derived from the data. Replace the opening of the generator body:

```javascript
addAlgo('binarysearch', 'Binary Search', 'search', 'O(log n)', 'O(1)', 'array', function* binarySearch(arr) {
  arr.sort((a, b) => a - b);
  const target = arr[Math.floor(arr.length / 2)]; // guaranteed present
  let low = 0, high = arr.length - 1;
  yield { type: 'active', index: 0, log: `Sorted input. Search for ${target}`, vars: { target } };
```

(Keep the rest of the loop body as-is.)

- [ ] **Step 4: Fix `linearsearch` to use a present target**

In the `linearsearch` generator (~line 380), replace `const target = 55;` with a value taken from the array so the search succeeds deterministically:

```javascript
addAlgo('linearsearch', 'Linear Search', 'search', 'O(n)', 'O(1)', 'array', function* linearSearch(arr) {
  const target = arr[arr.length - 2] !== undefined ? arr[arr.length - 2] : arr[0];
  yield { type: 'active', index: 0, log: `Look for target ${target}`, vars: { target } };
```

(Keep the rest of the loop body as-is.)

- [ ] **Step 5: Append the slug registry at the end of `algorithms.js`**

At the very end of `frontend/js/algorithms.js`, add:

```javascript
// ═══════════════════════════════════════════════════════════
//  SLUG REGISTRY — joins DB slugs to client-side generators.
//  app.js looks generators up by the DB `slug`; the DB owns the
//  list/metadata, the browser owns the animation.
// ═══════════════════════════════════════════════════════════
const ALGO_REGISTRY = {
  'bubble-sort':           ALGO_DATABASE['bubble'].generator,
  'selection-sort':        ALGO_DATABASE['selection'].generator,
  'insertion-sort':        ALGO_DATABASE['insertion'].generator,
  'merge-sort':            ALGO_DATABASE['merge'].generator,
  'quick-sort':            ALGO_DATABASE['quick'].generator,
  'linear-search':         ALGO_DATABASE['linearsearch'].generator,
  'binary-search':         ALGO_DATABASE['binarysearch'].generator,
  'breadth-first-search':  ALGO_DATABASE['bfs'].generator,
  'depth-first-search':    graphDFS,
  'dijkstra':              graphDijkstra,
  'a-star':                ALGO_DATABASE['astar'].generator,
  'knapsack-01':           ALGO_DATABASE['knapsack'].generator,
  'kmp-search':            ALGO_DATABASE['kmp'].generator,
  'sieve-of-eratosthenes': ALGO_DATABASE['sieve'].generator,
  'tower-of-hanoi':        ALGO_DATABASE['hanoi'].generator,
};
window.ALGO_REGISTRY = ALGO_REGISTRY;
```

- [ ] **Step 6: Manual verification in the browser console**

Open `index.html`, then in the console run:

```javascript
Object.keys(window.ALGO_REGISTRY).length;                 // expect 15
[...window.ALGO_REGISTRY['dijkstra']()].slice(0, 3);      // expect step objects incl. {type:'initGraph', ...}
[...window.ALGO_REGISTRY['depth-first-search']()].length; // expect a finite count > 6 ending with {type:'done'}
```

Expected: 15 keys; both new generators yield a sequence beginning with `initGraph` and ending with a `done` step; no exceptions.

- [ ] **Step 7: Commit** (after authorization)

```bash
git add frontend/js/algorithms.js
git commit -m "feat(frontend): real DFS/Dijkstra, search fixes, slug-keyed generator registry"
```

---

## Task 4: Frontend — wire the main page to the backend API

**Files:**
- Modify: `frontend/index.html` (load API client scripts; loading/error containers)
- Modify: `frontend/js/app.js` (replace the client-side data layer with API fetches)
- Modify: `frontend/js/deep-link.js` (slug-based, async-safe)

**Interfaces:**
- Consumes: `window.QV.algorithmsApi.listCategories()`, `.list(filters)`, `.detail(slug)` (already implemented in `frontend/js/api/algorithmsApi.js`); `window.ALGO_REGISTRY` (Task 3).
- Produces: app reads `selectedSlug`, `state.list` (array of `{slug,name,category,difficulty,visualizerType,summary}`), `state.detail` (full detail with `timeComplexities`, `codeSnippets`, `description`, `spaceComplexity`).

- [ ] **Step 1: Load the API client + config scripts in `index.html`**

In `index.html`, before `<script src="js/algorithms.js">`, add (config first, then client, then api):

```html
  <script src="config.js"></script>
  <script src="js/api/client.js"></script>
  <script src="js/api/algorithmsApi.js"></script>
```

- [ ] **Step 2: Add loading/error/empty containers to the sidebar markup**

In `index.html`, inside `<aside id="sidebar">`, add a status element above `#algo-list`:

```html
      <div id="catalog-status" class="catalog-status" hidden></div>
```

Add styles to `styles.css`:

```css
.catalog-status { padding: 10px 12px; font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
.catalog-status.error { color: var(--neon-pink); border: 1px solid var(--neon-pink); border-radius: 6px; margin: 8px; }
```

- [ ] **Step 3: Replace the boot + data layer in `app.js`**

In `frontend/js/app.js`, change the top-level state and the `DOMContentLoaded` handler. Replace `let selectedAlgoId = 'bubble';` with slug-based state and add catalog state:

```javascript
let selectedSlug = null;
let catalog = [];     // list items from GET /algorithms
let currentDetail = null; // detail object from GET /algorithms/:slug
let currentVisualizer = 'array';
```

Replace the body of the `DOMContentLoaded` listener's tail (the `renderAlgoList(); selectAlgorithm('bubble');` lines) with an async boot:

```javascript
  setupEventListeners();
  resetGridState();
  bootCatalog();
});

async function bootCatalog() {
  setCatalogStatus('Loading algorithms…');
  try {
    catalog = await window.QV.algorithmsApi.list({});
  } catch (err) {
    setCatalogStatus('Cannot reach the API. Is the backend running on localhost:3000? (' + (err.message || err.code) + ')', true);
    return;
  }
  if (!catalog.length) { setCatalogStatus('No algorithms found.'); return; }
  clearCatalogStatus();
  renderAlgoList();
  var initial = (location.hash || '').replace(/^#/, '').trim();
  selectAlgorithm(catalog.some((a) => a.slug === initial) ? initial : catalog[0].slug);
}

function setCatalogStatus(msg, isError) {
  var el = document.getElementById('catalog-status');
  el.hidden = false; el.textContent = msg;
  el.className = 'catalog-status' + (isError ? ' error' : '');
}
function clearCatalogStatus() {
  var el = document.getElementById('catalog-status');
  el.hidden = true; el.textContent = '';
}
```

- [ ] **Step 4: Rewrite `renderAlgoList` to read from `catalog`**

Replace `renderAlgoList()` so it iterates the fetched `catalog` (filtered client-side) instead of `ALGO_DATABASE`:

```javascript
function renderAlgoList() {
  algoListContainer.innerHTML = '';
  catalog.forEach((algo) => {
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || algo.category === activeCategory;
    if (!(matchesSearch && matchesCategory)) return;

    const item = document.createElement('div');
    item.className = `algo-item ${algo.slug === selectedSlug ? 'active' : ''}`;
    const viz = algo.visualizerType;
    let badgeClass = 'badge-arr';
    if (viz === 'grid') badgeClass = 'badge-grid';
    else if (viz === 'graph') badgeClass = 'badge-graph';
    else if (viz === 'matrix') badgeClass = 'badge-mat';
    else if (viz === 'string') badgeClass = 'badge-str';
    else if (viz === 'math') badgeClass = 'badge-math';

    item.innerHTML = `
      <div class="algo-header-row">
        <span class="algo-name">${algo.name}</span>
        <span class="algo-badge ${badgeClass}">${viz}</span>
      </div>
      <div class="algo-subinfo">
        <span>${algo.category}</span>
        <span>${algo.difficulty || ''}</span>
      </div>`;
    item.addEventListener('click', () => selectAlgorithm(algo.slug));
    algoListContainer.appendChild(item);
  });
}
```

- [ ] **Step 5: Rewrite `selectAlgorithm` to fetch detail + resolve the generator**

Replace `selectAlgorithm(key)` with an async slug version that fetches detail, sets the visualizer from the DB, loads the code snippet into the editor, and handles a missing generator:

```javascript
async function selectAlgorithm(slug) {
  selectedSlug = slug;
  try {
    currentDetail = await window.QV.algorithmsApi.detail(slug);
  } catch (err) {
    logMessage('Failed to load ' + slug + ': ' + (err.message || err.code), 'compare');
    return;
  }
  currentVisualizer = currentDetail.visualizerType;

  renderDetailPanel(currentDetail);          // defined in Task 5
  renderInputsPanel(currentVisualizer);      // extracted from old selectAlgorithm
  renderAlgoList();

  const gen = window.ALGO_REGISTRY[slug];
  if (!gen) {
    showComingSoon(currentDetail.name);
    return;
  }
  resetSimulation();
}

function showComingSoon(name) {
  steps = []; stepIdx = 0;
  const channels = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
  channels.forEach((ch) => document.getElementById('viz-' + ch).classList.remove('active'));
  const host = document.getElementById('viz-array');
  host.classList.add('active');
  host.innerHTML = '<div style="margin:auto;color:var(--text-dim);font-family:var(--mono);font-size:12px;">Visualization for ' + name + ' is coming soon.</div>';
}
```

- [ ] **Step 6: Extract `renderInputsPanel(visualizer)` from the old code**

Move the `inputsPanel.innerHTML = ...` branch logic (the block in the old `selectAlgorithm` that set up grid/matrix/string/math/array inputs) into a standalone `renderInputsPanel(visualizer)` that switches on the visualizer string instead of `algo.visualizer`. Keep the array branch's `arr-val-inp` change listener. (Pure relocation — same markup, parameter is `currentVisualizer`.)

- [ ] **Step 7: Point the generator-running engine at the registry + DB visualizer**

In `initSimulation()`, replace `const algo = ALGO_DATABASE[selectedAlgoId];` and the visualizer branch selector to use `currentVisualizer` and `ALGO_REGISTRY[selectedSlug]`. Specifically:

```javascript
function initSimulation() {
  pause();
  const gen = window.ALGO_REGISTRY[selectedSlug];
  if (!gen) return;
  steps = []; stepIdx = 0;
  const algoShim = { generator: gen, visualizer: currentVisualizer, isCustom: false };
  if (currentVisualizer === 'grid') initSnapshotsForGrid(algoShim);
  else if (currentVisualizer === 'matrix') initSnapshotsForMatrix(algoShim);
  else if (currentVisualizer === 'string') initSnapshotsForString(algoShim);
  else if (currentVisualizer === 'math') initSnapshotsForMath(algoShim);
  else if (currentVisualizer === 'graph') initSnapshotsForGraph(algoShim);
  else initSnapshotsForArray(algoShim);
  drawCurrentStep();
  updatePlaybackUI();
}
```

In `initSnapshotsForArray`, replace the custom-code branch condition `if (selectedAlgoId.startsWith('custom') || algo.isCustom)` with `if (algo.isCustom)` (custom is now flagged only via the COMPILE button, Step 9).

In `drawCurrentStep()`, replace `const algo = ALGO_DATABASE[selectedAlgoId]; ... algo.visualizer` references with `currentVisualizer` (both the channel-toggle loop and the dispatch `if` chain).

- [ ] **Step 8: Update the COMPILE & RUN handler**

In `setupEventListeners`, the compile handler references `ALGO_DATABASE[selectedAlgoId]`. Replace its body to flag a session-local custom override without touching `ALGO_DATABASE`:

```javascript
  document.getElementById('btn-compile').addEventListener('click', () => {
    pause();
    window.ALGO_REGISTRY[selectedSlug] = function () { return compileCustomCode([...arrInput]); };
    isCustomActive = true;
    logMessage('Sandboxed custom code compiled. Running simulation…', 'done');
    initSimulation();
  });
```

Add `let isCustomActive = false;` near the top state. In `initSnapshotsForArray`, set `algo.isCustom` from `isCustomActive`. (The custom path only applies to the array visualizer, matching the current behavior.)

- [ ] **Step 8b: Reset custom flag on selection**

In `selectAlgorithm`, set `isCustomActive = false;` at the top so switching algorithms clears any prior sandbox override.

- [ ] **Step 9: Simplify `deep-link.js`**

Replace `frontend/js/deep-link.js` body — boot now handles the initial hash (Step 3), so deep-link only needs to respond to later hash changes:

```javascript
// React to #<slug> changes after boot. Initial hash is handled in bootCatalog().
(function () {
  'use strict';
  window.addEventListener('hashchange', function () {
    try {
      var slug = (location.hash || '').replace(/^#/, '').trim();
      if (slug && typeof selectAlgorithm === 'function' && Array.isArray(catalog) && catalog.some(function (a) { return a.slug === slug; })) {
        selectAlgorithm(slug);
      }
    } catch (_e) { /* never break on a bad hash */ }
  });
})();
```

- [ ] **Step 10: Manual verification (backend must be running + seeded)**

Start backend (`cd backend && npm run dev`) and serve the frontend. Open `index.html`.
Expected:
- Sidebar populates with the 15 algorithms from the API (not the old 42).
- Category pills filter the list; search filters it.
- Selecting each algorithm renders the correct visualizer and plays.
- Stop the backend and reload → the red error banner appears instead of a blank page.

- [ ] **Step 11: Commit** (after authorization)

```bash
git add frontend/index.html frontend/js/app.js frontend/js/deep-link.js frontend/styles.css
git commit -m "feat(frontend): load catalog + detail from backend API with loading/error states"
```

---

## Task 5: Frontend — rich detail panel from DB

**Files:**
- Modify: `frontend/index.html` (detail panel markup in the main panel header area)
- Modify: `frontend/js/app.js` (add `renderDetailPanel`)
- Modify: `frontend/styles.css` (detail panel + snippet tab styles)

**Interfaces:**
- Consumes: `currentDetail` = `{ name, summary, description, difficulty, spaceComplexity, timeComplexities:{best,average,worst}, codeSnippets:[{language,code}], visualizerType }`.
- Produces: `renderDetailPanel(detail)`; populates `#code-editor` from the JS snippet (replacing generator `.toString()` dumping).

- [ ] **Step 1: Add detail markup to `index.html`**

In the main panel, replace the static `<h2 class="panel-title" id="panel-algo-name">…ALGORITHM PLAYBACK ENGINE</h2>` text node content with a dynamic name span, and add a detail block under the panel header (above `#viz-container`):

```html
      <div id="algo-detail" class="algo-detail">
        <div class="detail-head">
          <span id="detail-name" class="detail-name">—</span>
          <span id="detail-difficulty" class="detail-badge"></span>
        </div>
        <p id="detail-summary" class="detail-summary"></p>
        <div id="detail-complexity" class="detail-complexity"></div>
        <p id="detail-description" class="detail-description"></p>
      </div>
```

In the code sandbox header, add language tabs:

```html
        <div class="snippet-tabs">
          <button class="snippet-tab active" data-lang="javascript">JS</button>
          <button class="snippet-tab" data-lang="pseudocode">Pseudocode</button>
        </div>
```

- [ ] **Step 2: Add `renderDetailPanel` to `app.js`**

```javascript
function renderDetailPanel(detail) {
  document.getElementById('detail-name').textContent = detail.name;
  const diff = document.getElementById('detail-difficulty');
  diff.textContent = detail.difficulty || '';
  diff.className = 'detail-badge diff-' + (detail.difficulty || 'na');
  document.getElementById('detail-summary').textContent = detail.summary || '';
  document.getElementById('detail-description').textContent = detail.description || '';
  const t = detail.timeComplexities || {};
  document.getElementById('detail-complexity').innerHTML =
    '<span>Best <b>' + (t.best || '—') + '</b></span>' +
    '<span>Avg <b>' + (t.average || '—') + '</b></span>' +
    '<span>Worst <b>' + (t.worst || '—') + '</b></span>' +
    '<span>Space <b>' + (detail.spaceComplexity || '—') + '</b></span>';
  // Load the JS snippet into the editor (fallback to pseudocode, then empty).
  currentSnippets = {};
  (detail.codeSnippets || []).forEach((s) => { currentSnippets[s.language] = s.code; });
  setSnippetLang(currentSnippets['javascript'] ? 'javascript' : 'pseudocode');
}

let currentSnippets = {};
function setSnippetLang(lang) {
  document.querySelectorAll('.snippet-tab').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  codeEditor.value = currentSnippets[lang] || '// (no snippet available)';
  syncGutterLines();
}
```

- [ ] **Step 3: Wire snippet tab clicks**

In `setupEventListeners`, add:

```javascript
  document.querySelectorAll('.snippet-tab').forEach((b) => {
    b.addEventListener('click', () => setSnippetLang(b.dataset.lang));
  });
```

Note: the COMPILE & RUN sandbox still reads `codeEditor.value`; compiling works only when the editor holds a JS generator. Pseudocode is display-only — that's acceptable (compiling pseudocode throws the existing "Missing generator function" error into the log, which is fine).

- [ ] **Step 4: Add detail + tab styles to `styles.css`**

```css
.algo-detail { padding: 8px 14px; border-bottom: 1px solid var(--border); }
.detail-head { display: flex; align-items: center; gap: 10px; }
.detail-name { font-family: var(--mono); font-size: 15px; color: var(--neon-cyan); }
.detail-badge { font-size: 10px; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--border); text-transform: uppercase; }
.diff-easy { color: var(--neon-green); } .diff-medium { color: var(--neon-gold); } .diff-hard { color: var(--neon-pink); }
.detail-summary { font-size: 12px; color: var(--text); margin: 6px 0; }
.detail-complexity { display: flex; gap: 14px; font-family: var(--mono); font-size: 11px; color: var(--text-dim); }
.detail-complexity b { color: var(--text); }
.detail-description { font-size: 11px; color: var(--text-dim); margin-top: 6px; line-height: 1.5; }
.snippet-tabs { display: inline-flex; gap: 4px; }
.snippet-tab { font-family: var(--mono); font-size: 10px; cursor: pointer; background: transparent; color: var(--text-dim); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; }
.snippet-tab.active { color: var(--neon-cyan); border-color: var(--neon-cyan); }
```

- [ ] **Step 5: Manual verification**

Reload `index.html` (backend running).
Expected: selecting an algorithm shows its name, difficulty badge (color-coded), summary, best/avg/worst + space complexity, and full description; the editor shows the DB JavaScript snippet; the JS/Pseudocode tabs switch the editor text; both themes render the panel legibly.

- [ ] **Step 6: Commit** (after authorization)

```bash
git add frontend/index.html frontend/js/app.js frontend/styles.css
git commit -m "feat(frontend): rich DB-driven detail panel + code snippet tabs"
```

---

## Task 6: Frontend — visualizer engine gap fixes

**Files:**
- Modify: `frontend/js/visualizers.js` (`drawArray` step handling)

**Interfaces:**
- Consumes: step objects with `type` in `{active, compare, pivot, swap, sorted, done}` and indices `i`,`j`,`index`.

- [ ] **Step 1: Make the array renderer highlight `swap` and search-`found` states**

In `drawArray` (`frontend/js/visualizers.js:11-52`), extend the per-bar class logic so `swap` steps highlight both indices and a search `done`/`sorted` "found" index is visible. Replace the class-assignment block:

```javascript
  const swapPair = (stepObj.type === 'swap') ? [stepObj.i, stepObj.j] : null;
  arr.forEach((val, idx) => {
    const col = document.createElement('div');
    col.className = 'array-bar-col';
    const bar = document.createElement('div');
    bar.className = 'array-bar';
    const heightPercent = 5 + (val / maxVal) * 85;
    bar.style.height = `${heightPercent}%`;

    if (swapPair && (idx === swapPair[0] || idx === swapPair[1])) {
      bar.classList.add('state-pivot');
    } else if (idx === activeIdx) {
      bar.classList.add('state-active');
    } else if (idx === compareIdx) {
      bar.classList.add('state-compare');
    } else if (idx === pivotIdx) {
      bar.classList.add('state-pivot');
    } else if (stepObj.type === 'sorted' && idx === stepObj.index) {
      bar.classList.add('state-sorted');
    } else if (stepObj.type === 'sorted' && idx <= stepObj.index) {
      bar.classList.add('state-sorted');
    } else if (stepObj.type === 'done') {
      bar.classList.add('state-sorted');
    }

    const text = document.createElement('div');
    text.className = 'array-val';
    text.innerText = val;
    col.appendChild(bar);
    col.appendChild(text);
    container.appendChild(col);
  });
```

(Remove the now-duplicated original `arr.forEach` block this replaces; keep the `maxVal`/`activeIdx`/`compareIdx`/`pivotIdx` lines above it.)

- [ ] **Step 2: Manual verification**

Reload and play `bubble-sort`, `quick-sort`, `merge-sort` (swap highlight visible), and `linear-search`/`binary-search` (the found index lights up green at the end).
Expected: swaps visibly highlight both bars; the search "found" bar is highlighted; no console errors.

- [ ] **Step 3: Commit** (after authorization)

```bash
git add frontend/js/visualizers.js
git commit -m "fix(frontend): array visualizer highlights swaps and search hits"
```

---

## Task 7: Copy fixes + full verification pass

**Files:**
- Modify: `frontend/index.html` (stale copy)

- [ ] **Step 1: Fix stale copy in `index.html`**

- Search box placeholder: change `⚡ SEARCH 105+ ALGORITHMS...` → `⚡ SEARCH ALGORITHMS...`.
- The hardcoded category pills (`<div class="cat-scroll">…`) include categories that no longer have algorithms (`lists`, `custom`). Trim the pills to those actually shipped: keep `all`, `sort`→`sorting`, `search`→`searching`, `grid`, `graph`, `dp`→`dynamic-programming`, `string`, `math`. Update each pill's `data-cat` to match the API category slug exactly (e.g. `data-cat="sorting"`, `data-cat="dynamic-programming"`, `data-cat="string"`). (The list filters on `algo.category`, which is the category slug.)
- Brand reads `QUANTUM<em>VlZ</em> // v2.0` — leave the stylized brand, but it's fine to correct `VlZ`→`VIZ` if desired.

- [ ] **Step 2: Full manual verification matrix**

With backend running + seeded, serve the frontend and verify **each** of the 15 algorithms:

For every slug: select it → confirm the correct visualizer renders → press PLAY to completion → press BACK repeatedly to confirm reverse playback restores prior states. Then toggle to light theme and re-check a sample from each visualizer type (one array, the grid A*, a graph BFS/DFS/Dijkstra, the matrix knapsack, the string KMP, a math sieve/hanoi).

Checklist (tick when verified forward + reverse, both themes):
- [ ] bubble-sort, selection-sort, insertion-sort, merge-sort, quick-sort (array)
- [ ] linear-search, binary-search (array; target found)
- [ ] breadth-first-search, depth-first-search, dijkstra (graph; Dijkstra shows weights)
- [ ] a-star (grid; paint walls, drag start/end, path found)
- [ ] knapsack-01 (matrix fills)
- [ ] kmp-search (string slides)
- [ ] sieve-of-eratosthenes, tower-of-hanoi (math)
- [ ] Category pills + search filter correctly
- [ ] API-down shows the error banner
- [ ] Theme toggle persists across reload on both pages

- [ ] **Step 3: Backend final check**

Run: `cd backend && npm run typecheck && npm test`
Expected: typecheck clean; all tests pass.

- [ ] **Step 4: Commit** (after authorization)

```bash
git add frontend/index.html
git commit -m "chore(frontend): fix stale copy and align category pills with shipped catalog"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** §3 backend seam → Task 4. §4 curated 15 → Task 1 (+ registry Task 3). §5 dynamic dispatch + fallback → Task 4 (Steps 5,7) + Task 6. §6 algorithm fixes (DFS/Dijkstra, search targets) → Task 3. §7 theming → Task 2. §8 detail panel → Task 5. §9 out-of-scope → nothing planned (correct). §10 file map → matches tasks. §11 verification → Tasks 1/7. All covered.
- **Placeholder scan:** all code steps contain full code; the only "paste existing" instruction (Task 1 Step 3) references the 7 objects already present verbatim in `seedCatalog.ts` and is unambiguous.
- **Type/name consistency:** `ALGO_REGISTRY` (global + `window.ALGO_REGISTRY`), `currentVisualizer`, `currentDetail`, `selectedSlug`, `catalog`, `renderDetailPanel`, `renderInputsPanel`, `setSnippetLang`, `currentSnippets`, `isCustomActive`, `graphDFS`, `graphDijkstra` are defined before use and named identically across tasks. API methods match `algorithmsApi.js` (`list`, `detail`, `listCategories`). `SeedAlgorithm` fields match `seedCatalog.ts`'s insert binds.

---

## Execution Notes

- Frontend has **no automated test harness** (vanilla, no npm) — frontend tasks use explicit manual verification steps, per spec §11 and CLAUDE.md. Backend changes (Task 1) are covered by vitest.
- Oracle XE must be running and seeded for Tasks 4-7 to show real data; if it isn't, complete Task 1's data test (Step 7-8) and defer the live-API verification, noting it honestly.
