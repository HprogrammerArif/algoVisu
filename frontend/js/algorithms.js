// ═══════════════════════════════════════════════════════════
//  CLIENT-SIDE STEP GENERATORS (one per curated algorithm)
//  ALGO_DATABASE holds the generators; ALGO_REGISTRY (bottom)
//  maps each DB slug to its generator. The DB owns the metadata.
// ═══════════════════════════════════════════════════════════
const ALGO_DATABASE = {};

function addAlgo(id, name, cat, complexity, space, visualizer, generatorFn) {
  ALGO_DATABASE[id] = {
    id, name, category: cat, complexity, space, visualizer,
    generator: generatorFn,
    code: generatorFn.toString()
  };
}

// ───────────────────────────────────────────────────────────
// 1. SORTING (array)
// ───────────────────────────────────────────────────────────
addAlgo('bubble', 'Bubble Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', i: j, j: j + 1, log: `Compare indices ${j} & ${j+1}`, vars: { i, j, valI: arr[j], valJ: arr[j+1] } };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { type: 'swap', i: j, j: j + 1, log: `Swap elements at ${j} & ${j+1}` };
        swapped = true;
      }
    }
    yield { type: 'sorted', index: n - i - 1, log: `Index ${n-i-1} is in final position` };
    if (!swapped) break;
  }
  yield { type: 'done', log: 'Array is fully sorted!' };
});

addAlgo('selection', 'Selection Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    yield { type: 'active', index: i, log: `Set current index ${i} as minimum` };
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', i: minIdx, j, log: `Compare min candidate ${minIdx} with ${j}`, vars: { i, minIdx, j } };
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      yield { type: 'swap', i, j: minIdx, log: `Swap min element into place` };
    }
    yield { type: 'sorted', index: i };
  }
  yield { type: 'sorted', index: n - 1 };
  yield { type: 'done' };
});

addAlgo('insertion', 'Insertion Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* insertionSort(arr) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    yield { type: 'active', index: i, log: `Pick element ${key} at index ${i}` };
    while (j >= 0) {
      yield { type: 'compare', i: j, j: i, log: `Compare arr[${j}]=${arr[j]} with key ${key}`, vars: { i, j, key } };
      if (arr[j] <= key) break;
      arr[j + 1] = arr[j];
      yield { type: 'swap', i: j, j: j + 1, log: `Shift arr[${j}] to index ${j+1}` };
      j--;
    }
    arr[j + 1] = key;
    yield { type: 'sorted', index: j + 1 };
  }
  yield { type: 'done' };
});

addAlgo('merge', 'Merge Sort', 'sort', 'O(n log n)', 'O(n)', 'array', function* mergeSort(arr) {
  function* merge(l, m, r) {
    let left = arr.slice(l, m + 1);
    let right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      yield { type: 'compare', i: l + i, j: m + 1 + j, log: `Compare left subarray element with right subarray`, vars: { l, m, r, i, j } };
      if (left[i] <= right[j]) {
        arr[k++] = left[i++];
      } else {
        arr[k++] = right[j++];
      }
      yield { type: 'swap', i: k - 1, j: k - 1, log: `Overwrote index ${k-1}` };
    }
    while (i < left.length) { arr[k++] = left[i++]; yield { type: 'swap', i: k - 1, j: k - 1 }; }
    while (j < right.length) { arr[k++] = right[j++]; yield { type: 'swap', i: k - 1, j: k - 1 }; }
    for (let x = l; x <= r; x++) yield { type: 'sorted', index: x };
  }
  function* sort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    yield* sort(l, m);
    yield* sort(m + 1, r);
    yield* merge(l, m, r);
  }
  yield* sort(0, arr.length - 1);
  yield { type: 'done' };
});

addAlgo('quick', 'Quick Sort (Lomuto)', 'sort', 'O(n log n)', 'O(log n)', 'array', function* quickSort(arr) {
  function* partition(lo, hi) {
    let pivot = arr[hi];
    let pi = lo;
    yield { type: 'pivot', index: hi, log: `Select pivot element ${pivot} at index ${hi}`, vars: { lo, hi, pivot } };
    for (let j = lo; j < hi; j++) {
      yield { type: 'compare', i: pi, j, log: `Compare arr[${j}]=${arr[j]} with pivot ${pivot}`, vars: { j, pi, pivot } };
      if (arr[j] <= pivot) {
        if (pi !== j) {
          [arr[pi], arr[j]] = [arr[j], arr[pi]];
          yield { type: 'swap', i: pi, j, log: `Swap elements at ${pi} & ${j}` };
        }
        pi++;
      }
    }
    [arr[pi], arr[hi]] = [arr[hi], arr[pi]];
    yield { type: 'swap', i: pi, j: hi, log: `Place pivot at index ${pi}` };
    yield { type: 'sorted', index: pi };
    return pi;
  }
  function* sort(lo, hi) {
    if (lo >= hi) {
      if (lo >= 0 && lo < arr.length) yield { type: 'sorted', index: lo };
      return;
    }
    let p = yield* partition(lo, hi);
    yield* sort(lo, p - 1);
    yield* sort(p + 1, hi);
  }
  yield* sort(0, arr.length - 1);
  yield { type: 'done' };
});

// ───────────────────────────────────────────────────────────
// 2. SEARCHING (array)
// ───────────────────────────────────────────────────────────
addAlgo('linearsearch', 'Linear Search', 'search', 'O(n)', 'O(1)', 'array', function* linearSearch(arr) {
  const target = arr[arr.length - 2] !== undefined ? arr[arr.length - 2] : arr[0];
  yield { type: 'active', index: 0, log: `Look for target ${target}`, vars: { target } };
  for (let i = 0; i < arr.length; i++) {
    yield { type: 'compare', i, j: i, log: `Compare arr[${i}]=${arr[i]} with target`, vars: { index: i, val: arr[i] } };
    if (arr[i] === target) {
      yield { type: 'sorted', index: i, log: `Target found at index ${i}!` };
      yield { type: 'done' };
      return;
    }
  }
  yield { type: 'done', log: 'Target not found' };
});

addAlgo('binarysearch', 'Binary Search', 'search', 'O(log n)', 'O(1)', 'array', function* binarySearch(arr) {
  arr.sort((a, b) => a - b);
  const target = arr[Math.floor(arr.length / 2)]; // guaranteed present
  let low = 0, high = arr.length - 1;
  yield { type: 'active', index: 0, log: `Sorted input. Search for ${target}`, vars: { target } };
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    yield { type: 'compare', i: low, j: high, log: `Active search space: bounds [${low}, ${high}]`, vars: { low, high, mid, midVal: arr[mid] } };
    yield { type: 'pivot', index: mid, log: `Calculated middle point index ${mid}` };
    if (arr[mid] === target) {
      yield { type: 'sorted', index: mid, log: `Found target at index ${mid}!` };
      yield { type: 'done' };
      return;
    }
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  yield { type: 'done', log: 'Target not found' };
});

// ───────────────────────────────────────────────────────────
// 3. STRING MATCHING (string)
// ───────────────────────────────────────────────────────────
addAlgo('kmp', 'KMP Pattern Search', 'str', 'O(n+m)', 'O(m)', 'string', function* kmpSearch(arr) {
  const text = "AABAACAADAABAABA";
  const pat = "AABA";
  yield { type: 'initString', text, pattern: pat, log: 'Initialize KMP text matcher' };

  const n = text.length, m = pat.length;
  let lps = Array(m).fill(0);
  let len = 0, i = 1;
  while (i < m) {
    if (pat[i] === pat[len]) {
      len++; lps[i] = len; i++;
    } else {
      if (len !== 0) len = lps[len - 1];
      else { lps[i] = 0; i++; }
    }
  }

  i = 0; let j = 0;
  while (i < n) {
    yield { type: 'charMatch', textIdx: i, patIdx: j, matches: text[i] === pat[j], vars: { textIdx: i, patIdx: j, activeLps: lps[j] } };
    if (pat[j] === text[i]) {
      i++; j++;
    }
    if (j === m) {
      yield { type: 'matchFound', index: i - j, log: `MATCH FOUND AT INDEX ${i-j}!` };
      j = lps[j - 1];
    } else if (i < n && pat[j] !== text[i]) {
      if (j !== 0) j = lps[j - 1];
      else i++;
    }
  }
  yield { type: 'done' };
});

// ───────────────────────────────────────────────────────────
// 4. GRAPHS (graph)
// ───────────────────────────────────────────────────────────
addAlgo('bfs', 'Breadth-First Search (BFS)', 'graph', 'O(V+E)', 'O(V)', 'graph', function* graphBFS(arr) {
  const nodes = [
    { id: 0, label: 'A', x: 100, y: 150 },
    { id: 1, label: 'B', x: 220, y: 60 },
    { id: 2, label: 'C', x: 220, y: 240 },
    { id: 3, label: 'D', x: 380, y: 60 },
    { id: 4, label: 'E', x: 380, y: 240 },
    { id: 5, label: 'F', x: 500, y: 150 }
  ];
  const edges = [
    { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 4 }, { u: 3, v: 5 }, { u: 4, v: 5 }
  ];
  yield { type: 'initGraph', nodes, edges, log: 'Initialize adjacency lists representation' };

  let queue = [0];
  let visited = new Set([0]);
  yield { type: 'activeNode', node: 0, log: 'Enqueued start vertex A', vars: { queue: 'A' } };

  while(queue.length > 0) {
    let curr = queue.shift();
    yield { type: 'visitedNode', node: curr, log: `Dequeue active vertex ${nodes[curr].label}`, vars: { current: nodes[curr].label, queue: queue.map(x=>nodes[x].label).join(',') } };

    let neighbors = [
      {v: 1, e: 0}, {v: 2, e: 1}, {v: 3, e: 2}, {v: 4, e: 3}, {v: 5, e: 4}
    ].filter(nb => edges.some(e => (e.u === curr && e.v === nb.v) || (e.v === curr && e.u === nb.v)));

    for (let nb of neighbors) {
      if (!visited.has(nb.v)) {
        visited.add(nb.v);
        queue.push(nb.v);
        yield { type: 'traverseEdge', u: curr, v: nb.v, log: `Traverse unvisited edge` };
        yield { type: 'activeNode', node: nb.v, log: `Enqueue neighbor ${nodes[nb.v].label}`, vars: { queue: queue.map(x=>nodes[x].label).join(',') } };
      }
    }
  }
  yield { type: 'done' };
});

// Real DFS — recursive traversal over the demo graph (used by the slug registry).
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

// Real Dijkstra — finalizes nearest unvisited vertex, relaxing edges, over a weighted graph.
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

// ───────────────────────────────────────────────────────────
// 5. 2D GRID & PATHFINDING (grid)
// ───────────────────────────────────────────────────────────
addAlgo('astar', 'A* Pathfinding', 'grid', 'O(E log V)', 'O(V)', 'grid', function* aStarGrid(grid, start, end) {
  let rows = grid.length, cols = grid[0].length;
  let openSet = [start];
  let closedSet = new Set();
  let parent = {};
  let gScore = {}, fScore = {};
  let key = (p) => `${p[0]},${p[1]}`;
  let h = (p) => Math.abs(p[0] - end[0]) + Math.abs(p[1] - end[1]);

  gScore[key(start)] = 0;
  fScore[key(start)] = h(start);

  yield { type: 'active', r: start[0], c: start[1], log: 'Queue starting node coordinate' };

  while(openSet.length > 0) {
    openSet.sort((a, b) => fScore[key(a)] - fScore[key(b)]);
    let curr = openSet.shift();

    if (curr[0] === end[0] && curr[1] === end[1]) {
      let path = [];
      let temp = curr;
      while(parent[key(temp)]) {
        path.push(temp);
        temp = parent[key(temp)];
      }
      path.push(start);
      path.reverse();
      for (let p of path) {
        yield { type: 'path', r: p[0], c: p[1], log: 'Backtrace optimal node path' };
      }
      yield { type: 'done', log: 'Shortest path found!' };
      return;
    }

    closedSet.add(key(curr));
    yield { type: 'visit', r: curr[0], c: curr[1], log: `Visit node cell (${curr[0]}, ${curr[1]})`, vars: { openCount: openSet.length } };

    let neighbors = [
      [curr[0]-1, curr[1]], [curr[0]+1, curr[1]],
      [curr[0], curr[1]-1], [curr[0], curr[1]+1]
    ];

    for (let nb of neighbors) {
      let [nr, nc] = nb;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === 'wall') continue;
      if (closedSet.has(key(nb))) continue;

      let tempG = gScore[key(curr)] + (grid[nr][nc] === 'weight' ? 5 : 1);
      if (gScore[key(nb)] === undefined || tempG < gScore[key(nb)]) {
        parent[key(nb)] = curr;
        gScore[key(nb)] = tempG;
        fScore[key(nb)] = tempG + h(nb);

        if (!openSet.some(p => p[0] === nr && p[1] === nc)) {
          openSet.push(nb);
          yield { type: 'enqueue', r: nr, c: nc, log: 'Queue adjacent frontier node' };
        }
      }
    }
  }
  yield { type: 'done', log: 'Finished search. No valid path exists.' };
});

// ───────────────────────────────────────────────────────────
// 6. DYNAMIC PROGRAMMING (matrix)
// ───────────────────────────────────────────────────────────
addAlgo('knapsack', '0/1 Knapsack Problem', 'dp', 'O(nW)', 'O(nW)', 'matrix', function* knapsackSolver() {
  const weights = [2, 3, 4, 5];
  const values = [3, 4, 5, 6];
  const W = 5;
  const n = weights.length;

  const rows = ["Row:0", "Item:1", "Item:2", "Item:3", "Item:4"];
  const cols = ["Cap:0", "Cap:1", "Cap:2", "Cap:3", "Cap:4", "Cap:5"];

  yield { type: 'initMatrix', rows, cols, log: 'Initialize DP table: items vs knapsack capacity', vars: { capacity: W, numItems: n } };

  let dp = Array.from({length: n + 1}, () => Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      yield { type: 'cellUpdate', r: i, c: w, val: dp[i-1][w], state: 'compare', log: `Evaluate item ${i} for capacity ${w}`, vars: { itemWeight: weights[i-1], itemVal: values[i-1] } };

      if (weights[i-1] <= w) {
        let include = values[i-1] + dp[i-1][w - weights[i-1]];
        let exclude = dp[i-1][w];
        dp[i][w] = Math.max(include, exclude);
      } else {
        dp[i][w] = dp[i-1][w];
      }
      yield { type: 'cellUpdate', r: i, c: w, val: dp[i][w], state: 'solved' };
    }
  }
  yield { type: 'done', log: `Optimal Knapsack value is ${dp[n][W]}` };
});

// ───────────────────────────────────────────────────────────
// 7. MATH & RECURSION (math)
// ───────────────────────────────────────────────────────────
addAlgo('sieve', 'Sieve of Eratosthenes Primes', 'math', 'O(n log log n)', 'O(n)', 'math', function* sieveSolve() {
  const limit = 50;
  yield { type: 'initSieve', max: limit, log: `Create integer elements grid up to limit ${limit}` };

  let primes = Array(limit + 1).fill(true);
  for (let p = 2; p * p <= limit; p++) {
    if (primes[p] === true) {
      yield { type: 'activePrime', prime: p, log: `Discovered prime seed element ${p}`, vars: { activePrime: p } };
      for (let i = p * p; i <= limit; i += p) {
        primes[i] = false;
        yield { type: 'checkMultiple', index: i, multipleOf: p, log: `Eliminate composite multiple ${i}`, vars: { multiple: i, primeFactor: p } };
      }
    }
  }

  for (let i = 2; i <= limit; i++) {
    if (primes[i]) yield { type: 'markPrime', index: i };
  }
  yield { type: 'done', log: 'Identified all prime numbers successfully!' };
});

addAlgo('hanoi', 'Tower of Hanoi Disk Solver', 'math', 'O(2ⁿ)', 'O(n)', 'math', function* hanoiSolve(arr) {
  const numDisks = 4;
  yield { type: 'initHanoi', disks: numDisks, log: `Initialize 3 pegs with ${numDisks} graded disks` };

  function* moveDisk(n, from, to, aux) {
    if (n === 1) {
      yield { type: 'moveDisk', from, to, log: `Move disk 1 from Peg ${from} to Peg ${to}`, vars: { diskSize: 1, source: from, target: to } };
      return;
    }
    yield* moveDisk(n - 1, from, aux, to);
    yield { type: 'moveDisk', from, to, log: `Move disk ${n} from Peg ${from} to Peg ${to}`, vars: { diskSize: n, source: from, target: to } };
    yield* moveDisk(n - 1, aux, to, from);
  }
  yield* moveDisk(numDisks, 0, 2, 1);
  yield { type: 'done' };
});

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
