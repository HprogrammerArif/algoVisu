import oracledb, { type Connection } from 'oracledb';

type Difficulty = 'easy' | 'medium' | 'hard';
type VisualizerType = 'array' | 'grid' | 'graph' | 'matrix' | 'string' | 'math';

interface SeedAlgorithm {
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

const ALGORITHMS: SeedAlgorithm[] = [
  {
    categorySlug: 'sorting',
    slug: 'bubble-sort',
    name: 'Bubble Sort',
    summary: 'Repeatedly swaps adjacent out-of-order elements until sorted.',
    description:
      'Bubble sort steps through the list, compares adjacent pairs, and swaps them if they are in the wrong order. After each pass the next largest element "bubbles" to the end. Simple but inefficient on large inputs.',
    visualizerType: 'array',
    difficulty: 'easy',
    spaceComplexity: 'O(1)',
    time: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function bubbleSort(a) {',
          '  for (let i = 0; i < a.length - 1; i++) {',
          '    let swapped = false;',
          '    for (let j = 0; j < a.length - 1 - i; j++) {',
          '      if (a[j] > a[j + 1]) {',
          '        [a[j], a[j + 1]] = [a[j + 1], a[j]];',
          '        swapped = true;',
          '      }',
          '    }',
          '    if (!swapped) break;',
          '  }',
          '  return a;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'for i from 0 to n-2',
          '  for j from 0 to n-2-i',
          '    if A[j] > A[j+1] then swap(A[j], A[j+1])',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'sorting',
    slug: 'selection-sort',
    name: 'Selection Sort',
    summary: 'Selects the minimum of the unsorted part and places it next.',
    description:
      'Selection sort divides the array into a sorted prefix and an unsorted suffix. Each pass finds the minimum of the suffix and swaps it into place. Always O(n^2) comparisons but minimizes the number of swaps.',
    visualizerType: 'array',
    difficulty: 'easy',
    spaceComplexity: 'O(1)',
    time: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function selectionSort(a) {',
          '  for (let i = 0; i < a.length - 1; i++) {',
          '    let min = i;',
          '    for (let j = i + 1; j < a.length; j++) {',
          '      if (a[j] < a[min]) min = j;',
          '    }',
          '    if (min !== i) [a[i], a[min]] = [a[min], a[i]];',
          '  }',
          '  return a;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'for i from 0 to n-2',
          '  min = i',
          '  for j from i+1 to n-1',
          '    if A[j] < A[min] then min = j',
          '  swap(A[i], A[min])',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'sorting',
    slug: 'insertion-sort',
    name: 'Insertion Sort',
    summary: 'Builds the sorted array one element at a time by insertion.',
    description:
      'Insertion sort takes each element and inserts it into its correct position among the already-sorted elements to its left. Efficient for small or nearly-sorted inputs.',
    visualizerType: 'array',
    difficulty: 'easy',
    spaceComplexity: 'O(1)',
    time: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function insertionSort(a) {',
          '  for (let i = 1; i < a.length; i++) {',
          '    const key = a[i];',
          '    let j = i - 1;',
          '    while (j >= 0 && a[j] > key) {',
          '      a[j + 1] = a[j];',
          '      j--;',
          '    }',
          '    a[j + 1] = key;',
          '  }',
          '  return a;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'for i from 1 to n-1',
          '  key = A[i]; j = i-1',
          '  while j >= 0 and A[j] > key',
          '    A[j+1] = A[j]; j = j-1',
          '  A[j+1] = key',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'searching',
    slug: 'linear-search',
    name: 'Linear Search',
    summary: 'Scans each element in turn until the target is found.',
    description:
      'Linear search checks each element from start to end, returning the index of the first match. Works on unsorted data; O(n) in the worst case.',
    visualizerType: 'array',
    difficulty: 'easy',
    spaceComplexity: 'O(1)',
    time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function linearSearch(a, target) {',
          '  for (let i = 0; i < a.length; i++) {',
          '    if (a[i] === target) return i;',
          '  }',
          '  return -1;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: ['for i from 0 to n-1', '  if A[i] == target then return i', 'return -1'].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'searching',
    slug: 'binary-search',
    name: 'Binary Search',
    summary: 'Halves a sorted range each step to find the target in O(log n).',
    description:
      'Binary search repeatedly compares the target to the middle element of a sorted range and discards the half that cannot contain it. Requires sorted input.',
    visualizerType: 'array',
    difficulty: 'easy',
    spaceComplexity: 'O(1)',
    time: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function binarySearch(a, target) {',
          '  let lo = 0, hi = a.length - 1;',
          '  while (lo <= hi) {',
          '    const mid = (lo + hi) >> 1;',
          '    if (a[mid] === target) return mid;',
          '    if (a[mid] < target) lo = mid + 1;',
          '    else hi = mid - 1;',
          '  }',
          '  return -1;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'lo = 0; hi = n-1',
          'while lo <= hi',
          '  mid = (lo + hi) / 2',
          '  if A[mid] == target then return mid',
          '  else if A[mid] < target then lo = mid+1',
          '  else hi = mid-1',
          'return -1',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'graph',
    slug: 'breadth-first-search',
    name: 'Breadth-First Search',
    summary: 'Explores a graph level by level using a queue.',
    description:
      'BFS visits all neighbours of a node before moving to the next level, using a FIFO queue. It finds the shortest path in unweighted graphs.',
    visualizerType: 'graph',
    difficulty: 'medium',
    spaceComplexity: 'O(V)',
    time: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function bfs(graph, start) {',
          '  const visited = new Set([start]);',
          '  const queue = [start];',
          '  const order = [];',
          '  while (queue.length) {',
          '    const node = queue.shift();',
          '    order.push(node);',
          '    for (const next of graph[node]) {',
          '      if (!visited.has(next)) {',
          '        visited.add(next);',
          '        queue.push(next);',
          '      }',
          '    }',
          '  }',
          '  return order;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'enqueue(start); mark start visited',
          'while queue not empty',
          '  node = dequeue()',
          '  for each neighbour of node',
          '    if not visited then mark visited and enqueue(neighbour)',
        ].join('\n'),
      },
    ],
  },
  {
    categorySlug: 'graph',
    slug: 'depth-first-search',
    name: 'Depth-First Search',
    summary: 'Explores as far as possible along each branch before backtracking.',
    description:
      'DFS follows one path to its end, then backtracks to explore alternatives, using a stack (or recursion). Useful for connectivity, cycle detection, and topological sorting.',
    visualizerType: 'graph',
    difficulty: 'medium',
    spaceComplexity: 'O(V)',
    time: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
    snippets: [
      {
        language: 'javascript',
        code: [
          'function dfs(graph, start) {',
          '  const visited = new Set();',
          '  const order = [];',
          '  (function visit(node) {',
          '    visited.add(node);',
          '    order.push(node);',
          '    for (const next of graph[node]) {',
          '      if (!visited.has(next)) visit(next);',
          '    }',
          '  })(start);',
          '  return order;',
          '}',
        ].join('\n'),
      },
      {
        language: 'pseudocode',
        code: [
          'visit(node):',
          '  mark node visited',
          '  for each neighbour of node',
          '    if not visited then visit(neighbour)',
        ].join('\n'),
      },
    ],
  },
];

export async function seedCatalog(conn: Connection): Promise<void> {
  let inserted = 0;
  for (const algo of ALGORITHMS) {
    const existing = await conn.execute<{ CNT: number }>(
      `SELECT COUNT(*) AS CNT FROM algorithms WHERE slug = :slug`,
      { slug: algo.slug },
    );
    if ((existing.rows?.[0]?.CNT ?? 0) > 0) continue;

    const result = await conn.execute(
      `INSERT INTO algorithms
         (category_id, slug, name, summary, description, visualizer_type, difficulty, space_complexity)
       VALUES
         ((SELECT category_id FROM categories WHERE slug = :categorySlug),
          :slug, :name, :summary, :description, :visualizerType, :difficulty, :spaceComplexity)
       RETURNING algorithm_id INTO :id`,
      {
        categorySlug: algo.categorySlug,
        slug: algo.slug,
        name: algo.name,
        summary: algo.summary,
        description: algo.description,
        visualizerType: algo.visualizerType,
        difficulty: algo.difficulty,
        spaceComplexity: algo.spaceComplexity,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    const algorithmId = (result.outBinds as { id: number[] }).id[0];

    for (const caseType of ['best', 'average', 'worst'] as const) {
      await conn.execute(
        `INSERT INTO time_complexities (algorithm_id, case_type, big_o)
         VALUES (:algorithmId, :caseType, :bigO)`,
        { algorithmId, caseType, bigO: algo.time[caseType] },
      );
    }

    for (const snippet of algo.snippets) {
      await conn.execute(
        `INSERT INTO code_snippets (algorithm_id, language, code)
         VALUES (:algorithmId, :language, :code)`,
        { algorithmId, language: snippet.language, code: snippet.code },
      );
    }
    inserted += 1;
  }
  console.log(`  seeded catalog (${inserted} new algorithm(s), ${ALGORITHMS.length} total defined)`);
}
