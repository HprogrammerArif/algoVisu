// In-depth, structured explanations for each curated algorithm.
// Kept separate from catalogData.ts (single responsibility). Seeded into the
// algorithm_explanations table by seedExplanations.ts and served on the detail API.

export interface ExplanationSeed {
  slug: string;
  sections: { heading: string; body: string }[];
}

// The 5 standard headings, in order, used for every algorithm.
const PROBLEM = 'What problem it solves';
const HOW = 'How it works';
const WHY = 'Why & when to use it';
const COMPLEXITY = 'Complexity intuition';
const USES = 'Real-world uses';

export const EXPLANATIONS: ExplanationSeed[] = [
  {
    slug: 'bubble-sort',
    sections: [
      { heading: PROBLEM, body: 'Bubble sort puts a list of items into order (smallest to largest, say). It is the classic "first sorting algorithm" — its job is simply to rearrange an array so every element sits in its correct sorted position.' },
      { heading: HOW, body: 'It walks the array from left to right comparing each adjacent pair, swapping them whenever they are out of order. After one full pass the largest remaining value has "bubbled" to the end, so the next pass can ignore it. It repeats passes until a complete pass makes no swaps, which means the array is sorted.' },
      { heading: WHY, body: 'Choose it for teaching and for tiny or nearly-sorted inputs, where its early-exit (stop when a pass has no swaps) makes it genuinely fast. Avoid it for anything large: it does far more work than insertion, merge, or quick sort. Its virtues are that it is stable (equal items keep their order) and sorts in place with no extra memory.' },
      { heading: COMPLEXITY, body: 'Each pass compares up to n−1 pairs and you may need up to n passes, giving O(n²) comparisons in the average and worst cases. The best case is O(n): if the array is already sorted, the first pass makes no swaps and the algorithm stops immediately. Space is O(1) because it only ever swaps within the array.' },
      { heading: USES, body: 'Rarely used in production, but it shows up in classrooms, in coding interviews as a baseline, and occasionally as a simple check or "polish" pass on data that is already almost in order.' },
    ],
  },
  {
    slug: 'selection-sort',
    sections: [
      { heading: PROBLEM, body: 'Selection sort orders an array, like bubble sort, but is built around a different idea: repeatedly find the smallest remaining element and place it next. It answers "what is the minimum I have not placed yet?" over and over.' },
      { heading: HOW, body: 'It splits the array into a sorted part (initially empty) on the left and an unsorted part on the right. Each round it scans the unsorted part to find the minimum, then swaps that minimum into the first unsorted slot, growing the sorted part by one. After n−1 rounds everything is in place.' },
      { heading: WHY, body: 'Its standout property is that it performs at most n−1 swaps — the fewest of the simple sorts — so it is attractive when writing to memory is expensive and reads are cheap. Otherwise it is a poor general choice: it always scans the whole remaining array even if the data is already sorted, and it is not stable in its basic form.' },
      { heading: COMPLEXITY, body: 'Finding each minimum costs a scan of the shrinking unsorted region, summing to about n²/2 comparisons, so it is O(n²) in best, average, and worst cases alike — the data never lets it finish early. Swaps, however, are only O(n). Space is O(1), sorting in place.' },
      { heading: USES, body: 'Used when the number of writes must be minimized (e.g. flash memory with limited write cycles) and the dataset is small, and as a teaching example for the "selection" strategy.' },
    ],
  },
  {
    slug: 'insertion-sort',
    sections: [
      { heading: PROBLEM, body: 'Insertion sort orders an array the way most people sort a hand of playing cards: take one new card at a time and slide it into its correct place among the cards already held.' },
      { heading: HOW, body: 'Starting from the second element, it treats everything to the left as a sorted region. It lifts the current element as a "key", shifts every larger element in the sorted region one slot to the right, and drops the key into the gap that opens up. Repeating for each element leaves the whole array sorted.' },
      { heading: WHY, body: 'It is the go-to simple sort for small or nearly-sorted data: when elements are close to their final positions it does almost no shifting. It is stable, sorts in place, and works online (it can sort items as they arrive). For large random data it is still O(n²) and is outclassed by merge or quick sort — which is why those often switch to insertion sort for tiny sub-arrays.' },
      { heading: COMPLEXITY, body: 'The inner loop shifts elements until the key is in place; on already-sorted input it shifts nothing, giving the O(n) best case. On reverse-sorted input every element shifts past all the others, giving the O(n²) worst (and average) case. Space is O(1).' },
      { heading: USES, body: 'Widely used as the base case inside hybrid sorts (such as Timsort and introsort), for small lists, and for streaming data that must stay sorted as each new value arrives.' },
    ],
  },
  {
    slug: 'merge-sort',
    sections: [
      { heading: PROBLEM, body: 'Merge sort orders an array reliably and predictably, even on huge or adversarial inputs, by using divide-and-conquer instead of element-by-element comparison passes.' },
      { heading: HOW, body: 'It recursively splits the array in half until each piece holds a single element (which is trivially sorted), then merges pieces back together: given two already-sorted halves, it repeatedly takes the smaller front element of the two to build one sorted whole. Merging from the bottom up produces the fully sorted array.' },
      { heading: WHY, body: 'Choose it when you need guaranteed O(n log n) performance regardless of input, stability (equal items keep order), or you are sorting linked lists or data on disk where sequential access suits merging. The cost is O(n) extra memory for the merge buffer, which can rule it out in tight-memory settings.' },
      { heading: COMPLEXITY, body: 'The array is halved about log₂n times (the recursion depth) and each level does O(n) total work to merge, so every case — best, average, worst — is O(n log n). That consistency is its signature strength. Space is O(n) for the temporary buffers used while merging.' },
      { heading: USES, body: 'The standard choice for external sorting of data too large for memory, for stable sorts in language libraries (Timsort, used by Python and Java, is merge-based), and for sorting linked lists.' },
    ],
  },
  {
    slug: 'quick-sort',
    sections: [
      { heading: PROBLEM, body: 'Quick sort orders an array very fast on average and in place, making it the default general-purpose sort in many systems. Like merge sort it is divide-and-conquer, but it partitions instead of merging.' },
      { heading: HOW, body: 'It picks a pivot element and partitions the array so that everything smaller than the pivot ends up on its left and everything larger on its right (the Lomuto scheme scans once, swapping small elements forward). The pivot is now in its final position; the algorithm then recurses on the left and right partitions until each is trivially small.' },
      { heading: WHY, body: 'Pick it when average speed and low memory matter and stability is not required — its tight inner loop and in-place partitioning make it faster in practice than merge sort. Its risk is the O(n²) worst case on bad pivot choices (e.g. already-sorted data with a naive pivot), which good implementations dodge with randomized or median-of-three pivots.' },
      { heading: COMPLEXITY, body: 'A balanced partition halves the problem each time, giving O(n log n) best and average performance. A consistently lopsided partition (pivot always the smallest or largest) degrades to O(n²). Space is O(log n) on average for the recursion stack — much less than merge sort.' },
      { heading: USES, body: 'The workhorse behind many standard library sorts (often as part of introsort, which falls back to heapsort to guarantee O(n log n)), and a frequent interview topic for its partitioning idea.' },
    ],
  },
  {
    slug: 'linear-search',
    sections: [
      { heading: PROBLEM, body: 'Linear search answers "is this value in the collection, and where?" for data that has no particular order. It is the most general way to find something.' },
      { heading: HOW, body: 'It examines each element from the first to the last, comparing it with the target. The moment it finds a match it returns that position; if it reaches the end without a match, the value is not present.' },
      { heading: WHY, body: 'Use it when the data is unsorted, small, or only searched occasionally, or when the structure cannot be indexed (e.g. a singly linked list or a stream). It needs no preprocessing and works on any sequence — but on large sorted data, binary search or a hash lookup is far faster.' },
      { heading: COMPLEXITY, body: 'In the worst case the target is last or absent, so it inspects all n elements: O(n). The best case is O(1) when the target is first. On average it scans about half the list. Space is O(1) — it only tracks the current position.' },
      { heading: USES, body: 'Everywhere small or unsorted lookups happen: scanning an array for a value, checking membership in a short list, finding the first item that matches a condition, and as the fallback when no faster index exists.' },
    ],
  },
  {
    slug: 'binary-search',
    sections: [
      { heading: PROBLEM, body: 'Binary search finds a target in a sorted collection dramatically faster than scanning, by exploiting the order to discard half the remaining candidates at every step.' },
      { heading: HOW, body: 'It tracks a low and high boundary around the search range and looks at the middle element. If the middle equals the target, it is done; if the middle is too small, the target must be in the upper half so it moves low past the middle; if too large, it moves high below the middle. The range halves each step until the value is found or the range is empty.' },
      { heading: WHY, body: 'Use it whenever data is sorted and searched repeatedly — the logarithmic cost is enormous on large inputs. The catch is the precondition: the data must be sorted (an O(n log n) one-time cost), and it needs random access, so it suits arrays, not linked lists.' },
      { heading: COMPLEXITY, body: 'Halving the range each step means it takes at most about log₂n steps, so average and worst cases are O(log n); the best case is O(1) when the middle is the target on the first look. Space is O(1) for the iterative version. For context, finding an item among a billion takes only ~30 comparisons.' },
      { heading: USES, body: 'Foundational across computing: database indexes, dictionary and autocomplete lookups, version-control "bisect" to locate a breaking commit, and the building block for many search and optimization routines (binary search on the answer).' },
    ],
  },
  {
    slug: 'breadth-first-search',
    sections: [
      { heading: PROBLEM, body: 'Breadth-first search explores a graph or network outward from a starting point, level by level. Its key power is finding the shortest path (fewest edges) in an unweighted graph.' },
      { heading: HOW, body: 'It uses a FIFO queue. It marks the start as visited and enqueues it, then repeatedly dequeues a node, looks at all its neighbours, and enqueues each unvisited one (marking it visited so it is never queued twice). Because nodes are processed in the order they were discovered, all distance-1 nodes are visited before any distance-2 node, and so on.' },
      { heading: WHY, body: 'Reach for BFS when you need the shortest number of hops, the connected region around a node, or a level-order traversal. It guarantees shortest paths only when edges are unweighted (every step costs the same); for weighted graphs you need Dijkstra. It can use a lot of memory because a whole "frontier" of nodes may sit in the queue at once.' },
      { heading: COMPLEXITY, body: 'Every vertex is enqueued once and every edge is examined once, giving O(V + E) time, where V is vertices and E is edges. Space is O(V) for the visited set and the queue, which in the worst case holds an entire level of the graph.' },
      { heading: USES, body: 'Shortest paths in mazes and grids, finding people within N connections on social networks, web crawlers exploring links, peer-to-peer discovery, and detecting connected components.' },
    ],
  },
  {
    slug: 'depth-first-search',
    sections: [
      { heading: PROBLEM, body: 'Depth-first search explores a graph by going as deep as possible down one path before backtracking. It is the natural tool for reachability, cycle detection, and ordering problems.' },
      { heading: HOW, body: 'From the current node it picks an unvisited neighbour and dives in, repeating recursively (or with an explicit stack), marking nodes visited as it goes. When a node has no unvisited neighbours it backtracks to the previous node and tries another branch, continuing until everything reachable has been visited.' },
      { heading: WHY, body: 'Use DFS when you need to visit all nodes, detect cycles, find connected components, produce a topological order, or explore exhaustively (backtracking puzzles). It uses less memory than BFS on wide graphs, but it does not find shortest paths, and deep graphs can overflow the recursion stack unless you use an explicit one.' },
      { heading: COMPLEXITY, body: 'Like BFS it touches every vertex and edge once, so it runs in O(V + E). Space is O(V) for the visited set plus the recursion/stack depth, which in the worst case (a long path) is proportional to the number of vertices.' },
      { heading: USES, body: 'Topological sorting of dependencies (build systems, course prerequisites), cycle detection, finding strongly connected components, maze generation and solving, and the backbone of backtracking solvers like Sudoku and N-Queens.' },
    ],
  },
  {
    slug: 'dijkstra',
    sections: [
      { heading: PROBLEM, body: "Dijkstra's algorithm finds the shortest path from one source to every other node in a graph whose edges have non-negative weights (distances, times, costs). BFS only handles equal-weight edges; Dijkstra handles varying costs." },
      { heading: HOW, body: 'It keeps a tentative shortest distance to every node (0 for the source, infinity for the rest) and a set of finalized nodes. Repeatedly it picks the unfinalized node with the smallest tentative distance, finalizes it, and "relaxes" each outgoing edge: if going through this node reaches a neighbour more cheaply, it lowers that neighbour\'s distance. Greedily finalizing the nearest node each time guarantees correct shortest distances.' },
      { heading: WHY, body: 'Use it for weighted shortest paths with non-negative weights — routing, navigation, network latency. It fails if any edge weight is negative (use Bellman-Ford there). With a priority queue it is efficient; with a plain array scan it is simpler but slower, which is the trade-off in implementations.' },
      { heading: COMPLEXITY, body: 'Each node is finalized once and each edge relaxed once; the cost depends on how you find the minimum-distance node. A binary-heap priority queue gives O((V + E) log V); a naive array scan gives O(V²). Space is O(V) for the distance and finalized structures.' },
      { heading: USES, body: 'GPS and map navigation, internet routing protocols (link-state routing), network and game pathfinding, and any "cheapest route" problem over a weighted graph.' },
    ],
  },
  {
    slug: 'a-star',
    sections: [
      { heading: PROBLEM, body: 'A* finds the shortest path between two specific points on a grid or graph, but smarter than Dijkstra: it uses a hint about which direction the goal lies in so it explores far fewer cells.' },
      { heading: HOW, body: 'For each candidate cell it computes f = g + h, where g is the known cost to reach it from the start and h is a heuristic estimate of the remaining cost to the goal (commonly Manhattan distance on a grid). It always expands the open cell with the smallest f, which steers the search toward the goal while still accounting for distance already travelled, until it reaches the target and traces the path back.' },
      { heading: WHY, body: 'Use A* for point-to-point pathfinding when you have a reasonable heuristic — it is the standard in games and robotics. If the heuristic never overestimates the true remaining cost (it is "admissible"), A* is guaranteed to find an optimal path. With h = 0 it degenerates to Dijkstra; a too-aggressive heuristic trades optimality for speed (greedy best-first).' },
      { heading: COMPLEXITY, body: 'Worst case it behaves like Dijkstra at O(E log V), but a good heuristic prunes the search so it typically expands a small fraction of those cells. Both time and memory depend heavily on heuristic quality; in the worst case it can still store O(V) nodes in the open set.' },
      { heading: USES, body: 'Pathfinding for characters and units in video games, robot and drone navigation, route planning, and puzzle solving (e.g. the 15-puzzle) wherever a goal-directed heuristic is available.' },
    ],
  },
  {
    slug: 'knapsack-01',
    sections: [
      { heading: PROBLEM, body: 'The 0/1 knapsack problem asks: given items each with a weight and a value, and a bag that can carry a limited total weight, which items maximize total value? Each item is taken whole or not at all — you cannot take a fraction.' },
      { heading: HOW, body: 'Dynamic programming builds a table dp[i][w] = the best value using only the first i items within capacity w. For each item it chooses the better of two options: skip the item (value dp[i−1][w]) or take it if it fits (its value plus dp[i−1][w − itemWeight]). Filling the table row by row, the bottom-right cell holds the optimal value, and the choices can be traced back to recover which items to take.' },
      { heading: WHY, body: 'Use this DP when items are indivisible and you need a provably optimal selection under a capacity limit. A greedy "best value-per-weight first" approach does NOT work for 0/1 items (that only works for the fractional version), which is exactly why the DP table is needed.' },
      { heading: COMPLEXITY, body: 'The table has n items by W capacity cells and each takes constant work, so time and space are O(nW). Note this is "pseudo-polynomial": it scales with the numeric capacity W, so very large capacities make it expensive despite few items. Space can be reduced to O(W) by keeping only the previous row.' },
      { heading: USES, body: 'Budget-constrained selection: choosing investments or projects under a spending cap, cargo and container loading, resource allocation, and cutting-stock style problems.' },
    ],
  },
  {
    slug: 'kmp-search',
    sections: [
      { heading: PROBLEM, body: 'KMP (Knuth–Morris–Pratt) finds every occurrence of a pattern string inside a larger text efficiently, without the wasteful re-checking that naive substring search does after a mismatch.' },
      { heading: HOW, body: 'It first preprocesses the pattern into an LPS table (longest proper prefix that is also a suffix) for each position. Then it scans the text once: on a mismatch, instead of sliding the pattern back by one and re-comparing characters it already matched, it consults the LPS table to jump the pattern forward to the longest prefix that could still match, so the text pointer never moves backward.' },
      { heading: WHY, body: 'Use KMP when you need guaranteed linear-time matching, especially on patterns with repeated sub-patterns where naive search degrades. It shines when the text is streamed (the text index only moves forward). For typical short patterns, library search or Boyer–Moore may be faster in practice, but KMP gives a clean worst-case guarantee.' },
      { heading: COMPLEXITY, body: 'Building the LPS table is O(m) for a pattern of length m, and scanning the text of length n is O(n) because each character is compared a bounded number of times, for O(n + m) overall. The naive approach is O(n·m) in the worst case. Space is O(m) for the LPS table.' },
      { heading: USES, body: 'Text editors and grep-style search, DNA and protein sequence matching in bioinformatics, intrusion-detection systems scanning network streams for signatures, and plagiarism or duplicate detection.' },
    ],
  },
  {
    slug: 'sieve-of-eratosthenes',
    sections: [
      { heading: PROBLEM, body: 'The Sieve of Eratosthenes lists every prime number up to a limit n efficiently, instead of testing each number for primality one at a time.' },
      { heading: HOW, body: 'It writes down all integers from 2 to n as "possibly prime". Starting at 2, it takes the next number still marked prime and crosses out all of its multiples (4, 6, 8… for 2), since those have a divisor and cannot be prime. It repeats with the next surviving number; once you pass √n, everything still unmarked is prime.' },
      { heading: WHY, body: 'Use the sieve when you need all primes in a range (not just to test one number) — it is far faster than checking each number individually. It trades memory for speed: it needs an array of size n. For testing a single large number, a primality test is better; for generating many primes, the sieve wins.' },
      { heading: COMPLEXITY, body: 'Crossing out multiples of each prime p costs about n/p operations, and summing 1/p over the primes gives the famous O(n log log n) running time — nearly linear. Space is O(n) for the boolean array marking each number prime or composite.' },
      { heading: USES, body: 'Cryptography (generating prime candidates), number-theory and competitive-programming tasks, hash table sizing, and precomputing primes for repeated queries.' },
    ],
  },
  {
    slug: 'tower-of-hanoi',
    sections: [
      { heading: PROBLEM, body: 'Tower of Hanoi is a classic puzzle: move a stack of differently sized disks from one peg to another using a spare peg, moving one disk at a time and never placing a larger disk on a smaller one. It is the canonical demonstration of recursion.' },
      { heading: HOW, body: 'The recursive insight is that moving n disks from source to target reduces to three steps: move the top n−1 disks from source to the spare peg, move the single largest disk from source to target, then move those n−1 disks from the spare onto the target. Each of those n−1 moves is solved the same way, all the way down to the trivial one-disk case.' },
      { heading: WHY, body: 'It is used to teach recursion and divide-and-conquer because the elegant three-line solution mirrors the problem structure exactly. It is not a practical computation, but it perfectly illustrates how a hard problem collapses into smaller identical sub-problems, and how recursion depth and call order work.' },
      { heading: COMPLEXITY, body: 'Solving n disks takes exactly 2ⁿ − 1 moves — the move count doubles for each extra disk, so time is O(2ⁿ), exponential and unavoidable for this puzzle. Space is O(n) for the depth of the recursion (the call stack), not for storing moves.' },
      { heading: USES, body: 'A staple of computer-science teaching and interviews, a benchmark for recursion and stack behaviour, a model in psychological studies of problem solving, and the basis of some backup-rotation schemes.' },
    ],
  },
];
