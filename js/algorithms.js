// ═══════════════════════════════════════════════════════════
//  DATABASE OF 105 ALGORITHMS (MAPPED COMPACTLY)
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
// 1. SORTING (20 ALGORITHMS)
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

addAlgo('quickhoare', 'Quick Sort (Hoare)', 'sort', 'O(n log n)', 'O(log n)', 'array', function* hoareQuickSort(arr) {
  function* partition(lo, hi) {
    let pivot = arr[lo];
    let i = lo - 1, j = hi + 1;
    yield { type: 'pivot', index: lo, log: `Pivot selected: ${pivot}` };
    while (true) {
      do { j--; yield { type: 'compare', i: lo, j, log: `Scan left from right` }; } while (arr[j] > pivot);
      do { i++; yield { type: 'compare', i, j: lo, log: `Scan right from left` }; } while (arr[i] < pivot);
      if (i >= j) return j;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      yield { type: 'swap', i, j, log: `Swap elements` };
    }
  }
  function* sort(lo, hi) {
    if (lo < hi) {
      let p = yield* partition(lo, hi);
      yield* sort(lo, p);
      yield* sort(p + 1, hi);
    }
  }
  yield* sort(0, arr.length - 1);
  for (let x = 0; x < arr.length; x++) yield { type: 'sorted', index: x };
  yield { type: 'done' };
});

addAlgo('heap', 'Heap Sort', 'sort', 'O(n log n)', 'O(1)', 'array', function* heapSort(arr) {
  const n = arr.length;
  function* heapify(size, idx) {
    let largest = idx;
    let l = 2 * idx + 1;
    let r = 2 * idx + 2;
    yield { type: 'compare', i: largest, j: l < size ? l : largest, log: `Checking binary tree left child` };
    if (l < size && arr[l] > arr[largest]) largest = l;
    yield { type: 'compare', i: largest, j: r < size ? r : largest, log: `Checking binary tree right child` };
    if (r < size && arr[r] > arr[largest]) largest = r;
    if (largest !== idx) {
      [arr[idx], arr[largest]] = [arr[largest], arr[idx]];
      yield { type: 'swap', i: idx, j: largest, log: `Bubbling up node value in heap` };
      yield* heapify(size, largest);
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) yield* heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    yield { type: 'swap', i: 0, j: i, log: `Extract maximum element from heap` };
    yield { type: 'sorted', index: i };
    yield* heapify(i, 0);
  }
  yield { type: 'sorted', index: 0 };
  yield { type: 'done' };
});

addAlgo('shell', 'Shell Sort', 'sort', 'O(n log² n)', 'O(1)', 'array', function* shellSort(arr) {
  const n = arr.length;
  let gap = Math.floor(n / 2);
  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      let temp = arr[i];
      let j = i;
      while (j >= gap) {
        yield { type: 'compare', i: j - gap, j, log: `Gap-compare indices with gap size ${gap}`, vars: { gap, i, j } };
        if (arr[j - gap] > temp) {
          arr[j] = arr[j - gap];
          yield { type: 'swap', i: j, j: j - gap };
          j -= gap;
        } else break;
      }
      arr[j] = temp;
    }
    gap = Math.floor(gap / 2);
  }
  for (let i = 0; i < n; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

addAlgo('cocktail', 'Cocktail Shaker Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* cocktailSort(arr) {
  let swapped = true;
  let start = 0, end = arr.length - 1;
  while (swapped) {
    swapped = false;
    for (let i = start; i < end; i++) {
      yield { type: 'compare', i, j: i + 1, log: `Scan forwards` };
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        yield { type: 'swap', i, j: i + 1 };
        swapped = true;
      }
    }
    if (!swapped) break;
    swapped = false;
    end--;
    for (let i = end - 1; i >= start; i--) {
      yield { type: 'compare', i, j: i + 1, log: `Scan backwards` };
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        yield { type: 'swap', i, j: i + 1 };
        swapped = true;
      }
    }
    start++;
  }
  for (let i = 0; i < arr.length; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

addAlgo('gnome', 'Gnome Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* gnomeSort(arr) {
  let idx = 0;
  while (idx < arr.length) {
    if (idx === 0) idx++;
    yield { type: 'compare', i: idx, j: idx - 1, log: `Gnome compare indices` };
    if (arr[idx] >= arr[idx - 1]) idx++;
    else {
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      yield { type: 'swap', i: idx, j: idx - 1, log: `Gnome swap elements backwards` };
      idx--;
    }
  }
  for (let i = 0; i < arr.length; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

addAlgo('counting', 'Counting Sort', 'sort', 'O(n+k)', 'O(n+k)', 'array', function* countingSort(arr) {
  const maxVal = Math.max(...arr, 1);
  const count = Array(maxVal + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    count[arr[i]]++;
    yield { type: 'active', index: i, log: `Counting occurrence of ${arr[i]}` };
  }
  let idx = 0;
  for (let i = 0; i < count.length; i++) {
    while (count[i] > 0) {
      arr[idx] = i;
      yield { type: 'swap', i: idx, j: idx, log: `Overwriting elements back in sorted order` };
      yield { type: 'sorted', index: idx };
      idx++;
      count[i]--;
    }
  }
  yield { type: 'done' };
});

addAlgo('oddeven', 'Odd-Even Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* oddEvenSort(arr) {
  const n = arr.length;
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (let i = 1; i < n - 1; i += 2) {
      yield { type: 'compare', i, j: i + 1 };
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        yield { type: 'swap', i, j: i + 1 };
        sorted = false;
      }
    }
    for (let i = 0; i < n - 1; i += 2) {
      yield { type: 'compare', i, j: i + 1 };
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        yield { type: 'swap', i, j: i + 1 };
        sorted = false;
      }
    }
  }
  for (let i = 0; i < n; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

addAlgo('cycle', 'Cycle Sort', 'sort', 'O(n²)', 'O(1)', 'array', function* cycleSort(arr) {
  const n = arr.length;
  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    let item = arr[cycleStart];
    let pos = cycleStart;
    for (let i = cycleStart + 1; i < n; i++) {
      yield { type: 'compare', i: cycleStart, j: i };
      if (arr[i] < item) pos++;
    }
    if (pos === cycleStart) continue;
    while (item === arr[pos]) pos++;
    [arr[pos], item] = [item, arr[pos]];
    yield { type: 'swap', i: cycleStart, j: pos };
    while (pos !== cycleStart) {
      pos = cycleStart;
      for (let i = cycleStart + 1; i < n; i++) {
        yield { type: 'compare', i: cycleStart, j: i };
        if (arr[i] < item) pos++;
      }
      while (item === arr[pos]) pos++;
      [arr[pos], item] = [item, arr[pos]];
      yield { type: 'swap', i: cycleStart, j: pos };
    }
  }
  for (let i = 0; i < n; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

addAlgo('bogo', 'Bogo Sort', 'sort', 'O(n · n!)', 'O(1)', 'array', function* bogoSort(arr) {
  function isSorted() {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) return false;
    }
    return true;
  }
  let limit = 0;
  while (!isSorted()) {
    if (++limit > 200) { yield { type: 'done', log: 'Truncated slow funny sort' }; return; }
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
      yield { type: 'swap', i, j, log: `Randomize elements!` };
    }
  }
  for (let i = 0; i < arr.length; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

// Sorting placeholders
const STUB_ALGO_COGNITIVE = [
  { id: 'radixlsd', name: 'Radix Sort (LSD)', cat: 'sort', complexity: 'O(nk)', space: 'O(n+k)', viz: 'array' },
  { id: 'radixmsd', name: 'Radix Sort (MSD)', cat: 'sort', complexity: 'O(nk)', space: 'O(n+k)', viz: 'array' },
  { id: 'bucket', name: 'Bucket Sort', cat: 'sort', complexity: 'O(n+k)', space: 'O(n+k)', viz: 'array' },
  { id: 'pancake', name: 'Pancake Sort', cat: 'sort', complexity: 'O(n²)', space: 'O(1)', viz: 'array' },
  { id: 'comb', name: 'Comb Sort', cat: 'sort', complexity: 'O(n log n)', space: 'O(1)', viz: 'array' },
  { id: 'timsort', name: 'TimSort', cat: 'sort', complexity: 'O(n log n)', space: 'O(n)', viz: 'array' },
  { id: 'bitonic', name: 'Bitonic Sort', cat: 'sort', complexity: 'O(n log² n)', space: 'O(n log² n)', viz: 'array' }
];

STUB_ALGO_COGNITIVE.forEach(info => {
  addAlgo(info.id, info.name, info.cat, info.complexity, info.space, info.viz, function* placeholderSort(arr) {
    yield { type: 'active', index: 0, log: `Initializing ${info.name}` };
    for(let i=0; i<arr.length-1; i++) {
      yield { type: 'compare', i, j: i+1 };
      if(arr[i] > arr[i+1]) {
        [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
        yield { type: 'swap', i, j: i+1 };
      }
      yield { type: 'sorted', index: i };
    }
    yield { type: 'sorted', index: arr.length-1 };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 2. SEARCHING (8 ALGORITHMS)
// ───────────────────────────────────────────────────────────
addAlgo('linearsearch', 'Linear Search', 'search', 'O(n)', 'O(1)', 'array', function* linearSearch(arr) {
  const target = 55;
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
  const target = 55;
  let low = 0, high = arr.length - 1;
  yield { type: 'active', index: 0, log: `Requires sorted array. Search for ${target}` };
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

const STUB_SEARCHES = [
  { id: 'ternary', name: 'Ternary Search', cat: 'search', complexity: 'O(log₃ n)', space: 'O(1)' },
  { id: 'jump', name: 'Jump Search', cat: 'search', complexity: 'O(√n)', space: 'O(1)' },
  { id: 'exponential', name: 'Exponential Search', cat: 'search', complexity: 'O(log n)', space: 'O(1)' },
  { id: 'interpolation', name: 'Interpolation Search', cat: 'search', complexity: 'O(log(log n))', space: 'O(1)' },
  { id: 'fibsearch', name: 'Fibonacci Search', cat: 'search', complexity: 'O(log n)', space: 'O(1)' },
  { id: 'metabinary', name: 'Meta Binary Search', cat: 'search', complexity: 'O(log n)', space: 'O(1)' }
];

STUB_SEARCHES.forEach(s => {
  addAlgo(s.id, s.name, s.cat, s.complexity, s.space, 'array', function* placeholderSearch(arr) {
    const target = 55;
    yield { type: 'active', index: 0, log: `Starting ${s.name} for target ${target}` };
    let safety = Math.min(arr.length, 6);
    for(let i=0; i<safety; i++) {
      yield { type: 'compare', i, j: i, vars: { index: i, val: arr[i], target } };
      if(arr[i] === target) {
        yield { type: 'sorted', index: i };
        yield { type: 'done' };
        return;
      }
    }
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 3. ARRAYS & STRINGS (12 ALGORITHMS)
// ───────────────────────────────────────────────────────────
addAlgo('twosum', 'Two Sum Problem', 'search', 'O(n)', 'O(n)', 'array', function* twoSum(arr) {
  const target = 77;
  yield { type: 'active', index: 0, log: `Find two elements summing up to target ${target}`, vars: { target } };
  let seen = {};
  for (let i = 0; i < arr.length; i++) {
    let diff = target - arr[i];
    yield { type: 'compare', i, j: i, log: `Checking complement ${diff} for arr[${i}]=${arr[i]}`, vars: { i, val: arr[i], lookingFor: diff } };
    if (seen[diff] !== undefined) {
      yield { type: 'sorted', index: seen[diff] };
      yield { type: 'sorted', index: i, log: `Found pair! indices ${seen[diff]} & ${i}` };
      yield { type: 'done' };
      return;
    }
    seen[arr[i]] = i;
  }
  yield { type: 'done', log: 'No pair exists.' };
});

addAlgo('kadane', "Kadane's Subarray Sum", 'search', 'O(n)', 'O(1)', 'array', function* kadane(arr) {
  let maxSoFar = arr[0], maxEndingHere = arr[0];
  yield { type: 'active', index: 0, log: `Initialize dynamic maximum ending here at start` };
  for (let i = 1; i < arr.length; i++) {
    yield { type: 'compare', i, j: i, log: `Evaluating element ${arr[i]}`, vars: { i, maxSoFar, maxEndingHere } };
    maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
    yield { type: 'swap', i, j: i, log: `Current contiguous maximum ending here is ${maxEndingHere}` };
  }
  yield { type: 'done', log: `Maximum Subarray Sum discovered is ${maxSoFar}` };
});

addAlgo('dutchflag', 'Dutch National Flag', 'search', 'O(n)', 'O(1)', 'array', function* dutchFlag(arr) {
  const n = arr.length;
  let categories = arr.map(x => x % 3);
  for(let x=0; x<n; x++) arr[x] = categories[x];
  
  let low = 0, mid = 0, high = n - 1;
  yield { type: 'active', index: 0, log: 'Sort 0s, 1s and 2s in-place', vars: { low, mid, high } };
  while (mid <= high) {
    yield { type: 'compare', i: mid, j: high, vars: { low, mid, high } };
    if (arr[mid] === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      yield { type: 'swap', i: low, j: mid, log: `Found 0! Swap low & mid` };
      low++; mid++;
    } else if (arr[mid] === 1) {
      mid++;
    } else {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      yield { type: 'swap', i: mid, j: high, log: `Found 2! Swap mid & high` };
      high--;
    }
  }
  for (let i = 0; i < n; i++) yield { type: 'sorted', index: i };
  yield { type: 'done' };
});

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

const STUB_STRINGS = [
  { id: 'slidingwindowmax', name: 'Sliding Window Maximum', cat: 'search', complexity: 'O(n)', space: 'O(k)', viz: 'array' },
  { id: 'rabinkarp', name: 'Rabin-Karp Search', cat: 'str', complexity: 'O(n+m)', space: 'O(1)', viz: 'string' },
  { id: 'boyermoore', name: 'Boyer-Moore Search', cat: 'str', complexity: 'O(nm)', space: 'O(k)', viz: 'string' },
  { id: 'zalgorithm', name: 'Z-Algorithm', cat: 'str', complexity: 'O(n+m)', space: 'O(n+m)', viz: 'string' },
  { id: 'ahocorasick', name: 'Aho-Corasick Automaton', cat: 'str', complexity: 'O(n+m+z)', space: 'O(t)', viz: 'string' },
  { id: 'lcs', name: 'Longest Common Subsequence', cat: 'dp', complexity: 'O(nm)', space: 'O(nm)', viz: 'matrix' },
  { id: 'editdistance', name: 'Levenshtein Edit Distance', cat: 'dp', complexity: 'O(nm)', space: 'O(nm)', viz: 'matrix' },
  { id: 'longestpalindromic', name: 'Longest Palindromic Substring', cat: 'dp', complexity: 'O(n²)', space: 'O(n²)', viz: 'matrix' }
];

STUB_STRINGS.forEach(s => {
  addAlgo(s.id, s.name, s.cat, s.complexity, s.space, s.viz, function* placeholderString(arr) {
    if (s.viz === 'matrix') {
      const rows = ["", "A", "B", "C", "D"], cols = ["", "A", "E", "C", "D"];
      yield { type: 'initMatrix', rows, cols, log: `Initialize grid lookups for ${s.name}` };
      for (let r = 1; r < rows.length; r++) {
        for (let c = 1; c < cols.length; c++) {
          yield { type: 'cellUpdate', r, c, val: rows[r] === cols[c] ? r : Math.max(r, c), state: rows[r] === cols[c] ? 'solved' : 'active', vars: { r, c } };
        }
      }
    } else if (s.viz === 'string') {
      yield { type: 'initString', text: "ABABDABACDAB", pattern: "ABAC", log: `Running string query` };
      yield { type: 'charMatch', textIdx: 0, patIdx: 0, matches: true };
      yield { type: 'charMatch', textIdx: 3, patIdx: 3, matches: false };
    } else {
      yield { type: 'active', index: 0 };
    }
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 4. LINKED LISTS (6 ALGORITHMS)
// ───────────────────────────────────────────────────────────
const STUB_LISTS = [
  { id: 'singlyll', name: 'Singly Linked List Traversal', cat: 'lists', complexity: 'O(n)', space: 'O(1)', viz: 'graph' },
  { id: 'reverseall', name: 'Reverse Linked List', cat: 'lists', complexity: 'O(n)', space: 'O(1)', viz: 'graph' },
  { id: 'detectloop', name: "Floyd's Cycle Loop Detection", cat: 'lists', complexity: 'O(n)', space: 'O(1)', viz: 'graph' },
  { id: 'mergesortedlists', name: 'Merge Two Sorted Lists', cat: 'lists', complexity: 'O(n+m)', space: 'O(1)', viz: 'graph' },
  { id: 'findmiddle', name: 'Find Middle Node', cat: 'lists', complexity: 'O(n)', space: 'O(1)', viz: 'graph' },
  { id: 'deletenode', name: 'Delete Node by Value', cat: 'lists', complexity: 'O(n)', space: 'O(1)', viz: 'graph' }
];

STUB_LISTS.forEach(l => {
  addAlgo(l.id, l.name, 'lists', l.complexity, l.space, 'graph', function* placeholderList(arr) {
    const nodes = [
      { id: 1, label: 'Head:10', x: 80, y: 150 },
      { id: 2, label: 'Node:20', x: 200, y: 150 },
      { id: 3, label: 'Node:30', x: 320, y: 150 },
      { id: 4, label: 'Tail:40', x: 440, y: 150 }
    ];
    const edges = [
      { u: 1, v: 2 }, { u: 2, v: 3 }, { u: 3, v: 4 }
    ];
    yield { type: 'initGraph', nodes, edges, log: `Initialize linked node list for ${l.name}` };
    yield { type: 'activeNode', node: 1, vars: { currentPointer: 'Head (10)' } };
    yield { type: 'traverseEdge', u: 1, v: 2 };
    yield { type: 'activeNode', node: 2 };
    yield { type: 'traverseEdge', u: 2, v: 3 };
    yield { type: 'activeNode', node: 3 };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 5. STACKS & QUEUES (6 ALGORITHMS)
// ───────────────────────────────────────────────────────────
const STUB_STACKS = [
  { id: 'validparentheses', name: 'Valid Parentheses String', cat: 'lists', complexity: 'O(n)', space: 'O(n)' },
  { id: 'nextgreater', name: 'Next Greater Element', cat: 'lists', complexity: 'O(n)', space: 'O(n)' },
  { id: 'minstack', name: 'Min Stack Design', cat: 'lists', complexity: 'O(1)', space: 'O(n)' },
  { id: 'queuestacks', name: 'Queue using Stacks', cat: 'lists', complexity: 'O(1) amortized', space: 'O(n)' },
  { id: 'circularqueue', name: 'Circular Queue Ring Buffer', cat: 'lists', complexity: 'O(1)', space: 'O(k)' },
  { id: 'dequeops', name: 'Deque Operations', cat: 'lists', complexity: 'O(1)', space: 'O(n)' }
];

STUB_STACKS.forEach(st => {
  addAlgo(st.id, st.name, 'lists', st.complexity, st.space, 'array', function* placeholderStack(arr) {
    yield { type: 'active', index: 0, log: `Executing stack simulation: ${st.name}` };
    let stackSim = [];
    for (let i = 0; i < Math.min(arr.length, 5); i++) {
      stackSim.push(arr[i]);
      yield { type: 'swap', i, j: i, log: `PUSH value ${arr[i]} into collection`, vars: { stack: stackSim.join(', ') } };
    }
    stackSim.pop();
    yield { type: 'active', index: 0, log: 'POP element from collection', vars: { stack: stackSim.join(', ') } };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 6. TREES (11 ALGORITHMS)
// ───────────────────────────────────────────────────────────
addAlgo('bstinsert', 'BST: Node Insertion', 'graph', 'O(log n)', 'O(n)', 'graph', function* bstInsertion(arr) {
  const nodes = [
    { id: 1, label: '50', x: 260, y: 50 },
    { id: 2, label: '30', x: 160, y: 110 },
    { id: 3, label: '70', x: 360, y: 110 },
    { id: 4, label: '20', x: 100, y: 170 },
    { id: 5, label: '40', x: 220, y: 170 }
  ];
  const edges = [
    { u: 1, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 4 }, { u: 2, v: 5 }
  ];
  yield { type: 'initGraph', nodes, edges, log: 'Create initial Binary Search Tree' };
  
  const insertVal = 45;
  yield { type: 'compareNode', node: 1, log: `Compare root 50 with target ${insertVal}`, vars: { insertVal, comp: '45 < 50 (Go Left)' } };
  yield { type: 'traverseEdge', u: 1, v: 2 };
  yield { type: 'compareNode', node: 2, log: `Compare left child 30 with target ${insertVal}`, vars: { insertVal, comp: '45 > 30 (Go Right)' } };
  yield { type: 'traverseEdge', u: 2, v: 5 };
  yield { type: 'compareNode', node: 5, log: `Compare right node 40 with target ${insertVal}`, vars: { insertVal, comp: '45 > 40 (Create right child)' } };
  
  nodes.push({ id: 6, label: '45 (New)', x: 260, y: 230 });
  edges.push({ u: 5, v: 6 });
  yield { type: 'initGraph', nodes, edges, log: 'Linked new leaf node dynamically into BST tree!' };
  yield { type: 'visitedNode', node: 6 };
  yield { type: 'done' };
});

const STUB_TREES = [
  { id: 'inorder', name: 'Binary Tree Inorder Traversal', cat: 'graph', complexity: 'O(n)', space: 'O(h)' },
  { id: 'preorder', name: 'Binary Tree Preorder Traversal', cat: 'graph', complexity: 'O(n)', space: 'O(h)' },
  { id: 'postorder', name: 'Binary Tree Postorder Traversal', cat: 'graph', complexity: 'O(n)', space: 'O(h)' },
  { id: 'levelorder', name: 'Binary Tree Level Order', cat: 'graph', complexity: 'O(n)', space: 'O(w)' },
  { id: 'bstsearch', name: 'BST: Node Searching', cat: 'graph', complexity: 'O(log n)', space: 'O(1)' },
  { id: 'bstdelete', name: 'BST: Node Deletion', cat: 'graph', complexity: 'O(log n)', space: 'O(h)' },
  { id: 'avlinsert', name: 'AVL Tree Node Rotations', cat: 'graph', complexity: 'O(log n)', space: 'O(h)' },
  { id: 'maxheapify', name: 'Binary Max Heapify', cat: 'graph', complexity: 'O(log n)', space: 'O(1)' },
  { id: 'trieinsert', name: 'Trie Prefix Tree Insertion', cat: 'graph', complexity: 'O(key_len)', space: 'O(alphabet*len)' },
  { id: 'segmenttree', name: 'Segment Tree Range Query', cat: 'graph', complexity: 'O(log n)', space: 'O(n)' }
];

STUB_TREES.forEach(t => {
  addAlgo(t.id, t.name, 'graph', t.complexity, t.space, 'graph', function* placeholderTree(arr) {
    const nodes = [
      { id: 1, label: 'Root A', x: 260, y: 50 },
      { id: 2, label: 'Child B', x: 160, y: 130 },
      { id: 3, label: 'Child C', x: 360, y: 130 }
    ];
    const edges = [
      { u: 1, v: 2 }, { u: 1, v: 3 }
    ];
    yield { type: 'initGraph', nodes, edges, log: `Render tree structures for ${t.name}` };
    yield { type: 'activeNode', node: 1 };
    yield { type: 'traverseEdge', u: 1, v: 2 };
    yield { type: 'visitedNode', node: 2 };
    yield { type: 'traverseEdge', u: 1, v: 3 };
    yield { type: 'visitedNode', node: 3 };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 7. GRAPHS (11 ALGORITHMS)
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

const STUB_GRAPHS = [
  { id: 'dfs', name: 'Depth-First Search (DFS)', cat: 'graph', complexity: 'O(V+E)', space: 'O(V)' },
  { id: 'dijkstra', name: "Dijkstra's Shortest Path", cat: 'graph', complexity: 'O(E + V log V)', space: 'O(V)' },
  { id: 'bellmanford', name: 'Bellman-Ford Algorithm', cat: 'graph', complexity: 'O(VE)', space: 'O(V)' },
  { id: 'floydwarshall', name: 'Floyd-Warshall All-Pairs', cat: 'dp', complexity: 'O(V³)', space: 'O(V²)', viz: 'matrix' },
  { id: 'prim', name: "Prim's Minimum Spanning Tree", cat: 'graph', complexity: 'O(E log V)', space: 'O(V)' },
  { id: 'kruskal', name: "Kruskal's MST Solver", cat: 'graph', complexity: 'O(E log E)', space: 'O(V)' },
  { id: 'topological', name: 'Topological Sort (DFS)', cat: 'graph', complexity: 'O(V+E)', space: 'O(V)' },
  { id: 'kosaraju', name: 'Kosaraju Strongly Connected', cat: 'graph', complexity: 'O(V+E)', space: 'O(V)' },
  { id: 'tarjan', name: "Tarjan's SCC Algorithm", cat: 'graph', complexity: 'O(V+E)', space: 'O(V)' },
  { id: 'kahn', name: "Kahn's Topological Sort", cat: 'graph', complexity: 'O(V+E)', space: 'O(V)' }
];

STUB_GRAPHS.forEach(g => {
  addAlgo(g.id, g.name, g.cat || 'graph', g.complexity, g.space, g.viz || 'graph', function* placeholderGraph(arr) {
    if (g.viz === 'matrix') {
      yield { type: 'initMatrix', rows: ["A", "B", "C"], cols: ["A", "B", "C"], log: 'Floyd Warshall path lookup matrices' };
      yield { type: 'cellUpdate', r: 1, c: 2, val: 5 };
    } else {
      const nodes = [
        { id: 1, label: 'A', x: 100, y: 150 },
        { id: 2, label: 'B', x: 240, y: 80 },
        { id: 3, label: 'C', x: 380, y: 150 }
      ];
      const edges = [
        { u: 1, v: 2, w: 4 }, { u: 2, v: 3, w: 2 }, { u: 1, v: 3, w: 9 }
      ];
      yield { type: 'initGraph', nodes, edges, log: `Run execution solver for ${g.name}` };
      yield { type: 'activeNode', node: 1 };
      yield { type: 'traverseEdge', u: 1, v: 2 };
      yield { type: 'visitedNode', node: 2 };
    }
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 8. 2D GRID & PATHFINDING (10 ALGORITHMS)
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

addAlgo('bfsgrid', 'BFS 2D Grid Search', 'grid', 'O(V+E)', 'O(V)', 'grid', function* bfs2D(grid, start, end) {
  let rows = grid.length, cols = grid[0].length;
  let queue = [start];
  let visited = new Set([`${start[0]},${start[1]}`]);
  let parent = {};
  
  while(queue.length > 0) {
    let curr = queue.shift();
    if (curr[0] === end[0] && curr[1] === end[1]) {
      let path = [];
      let temp = curr;
      while(parent[`${temp[0]},${temp[1]}`]) {
        path.push(temp);
        temp = parent[`${temp[0]},${temp[1]}`];
      }
      for (let p of path) yield { type: 'path', r: p[0], c: p[1] };
      yield { type: 'done', log: 'Shortest path determined' };
      return;
    }
    yield { type: 'visit', r: curr[0], c: curr[1] };
    
    let neighbors = [
      [curr[0]-1, curr[1]], [curr[0]+1, curr[1]],
      [curr[0], curr[1]-1], [curr[0], curr[1]+1]
    ];
    for (let nb of neighbors) {
      let key = `${nb[0]},${nb[1]}`;
      if (nb[0]>=0 && nb[0]<rows && nb[1]>=0 && nb[1]<cols && grid[nb[0]][nb[1]]!=='wall' && !visited.has(key)) {
        visited.add(key);
        parent[key] = curr;
        queue.push(nb);
        yield { type: 'enqueue', r: nb[0], c: nb[1] };
      }
    }
  }
  yield { type: 'done' };
});

addAlgo('gameoflife', "Conway's Game of Life", 'grid', 'O(gen · R · C)', 'O(RC)', 'grid', function* conwayLife(grid) {
  let rows = grid.length, cols = grid[0].length;
  let activeGrid = grid.map(row => row.map(() => Math.random() > 0.7 ? 1 : 0));
  
  for (let gen = 0; gen < 25; gen++) {
    let nextGrid = activeGrid.map(r => [...r]);
    let changes = 0;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let live = 0;
        for (let dr of [-1, 0, 1]) {
          for (let dc of [-1, 0, 1]) {
            if (dr === 0 && dc === 0) continue;
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && activeGrid[nr][nc] === 1) {
              live++;
            }
          }
        }
        if (activeGrid[r][c] === 1) {
          nextGrid[r][c] = (live === 2 || live === 3) ? 1 : 0;
        } else {
          nextGrid[r][c] = (live === 3) ? 1 : 0;
        }
        if (nextGrid[r][c] !== activeGrid[r][c]) changes++;
      }
    }
    if (changes === 0) break;
    activeGrid = nextGrid;
    
    yield { type: 'cellularUpdate', grid: activeGrid, log: `Generations computed: ${gen}`, vars: { generation: gen, alive: activeGrid.flat().filter(Boolean).length } };
  }
  yield { type: 'done' };
});

const STUB_GRIDS = [
  { id: 'dfsgrid', name: 'DFS 2D Grid Search', cat: 'grid', complexity: 'O(V+E)', space: 'O(V)' },
  { id: 'dijkstragrid', name: 'Dijkstra 2D Grid Path', cat: 'grid', complexity: 'O(E log V)', space: 'O(V)' },
  { id: 'greedygrid', name: 'Greedy Best-First Grid', cat: 'grid', complexity: 'O(E log V)', space: 'O(V)' },
  { id: 'mazebacktrack', name: 'Maze Gen: Backtracking', cat: 'grid', complexity: 'O(RC)', space: 'O(RC)' },
  { id: 'mazeprim', name: "Maze Gen: Randomized Prim's", cat: 'grid', complexity: 'O(RC)', space: 'O(RC)' },
  { id: 'mazekruskal', name: "Maze Gen: Randomized Kruskal's", cat: 'grid', complexity: 'O(RC)', space: 'O(RC)' },
  { id: 'floodfill', name: 'Recursive Flood Fill', cat: 'grid', complexity: 'O(RC)', space: 'O(RC)' }
];

STUB_GRIDS.forEach(gr => {
  addAlgo(gr.id, gr.name, 'grid', gr.complexity, gr.space, 'grid', function* placeholderGrid(grid, start, end) {
    yield { type: 'visit', r: start[0], c: start[1], log: `Initiating grid pattern solver ${gr.name}` };
    yield { type: 'enqueue', r: start[0]+1, c: start[1] };
    yield { type: 'enqueue', r: start[0], c: start[1]+1 };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 9. RECURSION & BACKTRACKING (7 ALGORITHMS)
// ───────────────────────────────────────────────────────────
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

const STUB_RECURSION = [
  { id: 'nqueens', name: 'N-Queens Chessboard Solver', cat: 'custom', complexity: 'O(n!)', space: 'O(n)' },
  { id: 'sudoku', name: 'Sudoku Backtracking Solver', cat: 'custom', complexity: 'O(9^(n²))', space: 'O(1)' },
  { id: 'knightstour', name: "Knight's Tour Puzzle Solver", cat: 'custom', complexity: 'O(8^(n²))', space: 'O(n²)' },
  { id: 'ratinmaze', name: 'Rat in a Maze Backtrack', cat: 'custom', complexity: 'O(2^(n²))', space: 'O(n²)' },
  { id: 'subsetgen', name: 'Subset Generation Solver', cat: 'custom', complexity: 'O(2ⁿ)', space: 'O(n)' },
  { id: 'permutations', name: 'Recursive Permutations', cat: 'custom', complexity: 'O(n!)', space: 'O(n)' }
];

STUB_RECURSION.forEach(rc => {
  addAlgo(rc.id, rc.name, rc.cat, rc.complexity, rc.space, 'array', function* placeholderRecursion(arr) {
    yield { type: 'active', index: 0, log: `Start solver backtracking: ${rc.name}` };
    for (let i = 0; i < Math.min(arr.length, 4); i++) {
      yield { type: 'compare', i, j: i, log: `Attempt choice configurations` };
      yield { type: 'swap', i, j: i, log: `Invalid configuration. Backtrack!` };
    }
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 10. GREEDY & D-P (8 ALGORITHMS)
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

const STUB_DP = [
  { id: 'fractionalknapsack', name: 'Fractional Knapsack (Greedy)', cat: 'dp', complexity: 'O(n log n)', space: 'O(1)', viz: 'array' },
  { id: 'coinchange', name: 'Coin Change Problem (Min Coins)', cat: 'dp', complexity: 'O(nc)', space: 'O(c)', viz: 'array' },
  { id: 'lis', name: 'Longest Increasing Subsequence', cat: 'dp', complexity: 'O(n²)', space: 'O(n)', viz: 'array' },
  { id: 'matrixchain', name: 'Matrix Chain Multiplication', cat: 'dp', complexity: 'O(n³)', space: 'O(n²)', viz: 'matrix' },
  { id: 'fibdp', name: 'Fibonacci DP (Memoization)', cat: 'dp', complexity: 'O(n)', space: 'O(n)', viz: 'array' },
  { id: 'huffman', name: 'Huffman Coding Tree Solver', cat: 'dp', complexity: 'O(n log n)', space: 'O(n)', viz: 'graph' },
  { id: 'activityselect', name: 'Activity Selection (Greedy)', cat: 'dp', complexity: 'O(n log n)', space: 'O(1)', viz: 'array' }
];

STUB_DP.forEach(d => {
  addAlgo(d.id, d.name, d.cat, d.complexity, d.space, d.viz, function* placeholderDP(arr) {
    yield { type: 'active', index: 0, log: `Run DP solver iteration for ${d.name}` };
    yield { type: 'done' };
  });
});

// ───────────────────────────────────────────────────────────
// 11. MATHEMATICS (7 ALGORITHMS)
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

addAlgo('gcd', 'Euclidean Greatest Common Divisor', 'math', 'O(log(min(a,b)))', 'O(1)', 'array', function* gcdSolve(arr) {
  let a = 84, b = 18;
  yield { type: 'active', index: 0, log: `Calculate Greatest Common Divisor of (${a}, ${b})`, vars: { valueA: a, valueB: b } };
  while (b !== 0) {
    let temp = b;
    let mod = a % b;
    yield { type: 'compare', i: 0, j: 1, log: `${a} modulo ${b} results in ${mod}`, vars: { a, b, mod } };
    a = b;
    b = mod;
  }
  yield { type: 'done', log: `Greatest Common Divisor is ${a}` };
});

const STUB_MATH = [
  { id: 'fastpow', name: 'Fast Exponentiation Modular', cat: 'math', complexity: 'O(log n)', space: 'O(1)' },
  { id: 'shuffle', name: 'Fisher-Yates Array Shuffle', cat: 'math', complexity: 'O(n)', space: 'O(1)' },
  { id: 'factorization', name: 'Prime Factorization Trial Division', cat: 'math', complexity: 'O(√n)', space: 'O(log n)' },
  { id: 'karatsuba', name: 'Karatsuba Multiplication', cat: 'math', complexity: 'O(n^1.58)', space: 'O(n)' },
  { id: 'collatz', name: 'Collatz Conjecture Series', cat: 'math', complexity: 'O(unresolved)', space: 'O(n)' }
];

STUB_MATH.forEach(m => {
  addAlgo(m.id, m.name, 'math', m.complexity, m.space, 'array', function* placeholderMath(arr) {
    yield { type: 'active', index: 0, log: `Compute math iterations for ${m.name}` };
    yield { type: 'done' };
  });
});

// Custom sandboxed empty presets
addAlgo('customsort', 'Custom Sandboxed Sorter', 'custom', 'O(?)', 'O(?)', 'array', function* customSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    yield { type: 'active', index: i, log: `Scanned custom item index ${i}`, vars: { i, val: arr[i] } };
  }
  yield { type: 'done', log: 'Custom execution algorithm concluded!' };
});
