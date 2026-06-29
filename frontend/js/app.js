// ═══════════════════════════════════════════════════════════
//  QUANTUMVIZ CENTRAL APPLICATION CONTROLLER
// ═══════════════════════════════════════════════════════════

// Central Playback & Simulation State
let steps = [];
let stepIdx = 0;
let isPlaying = false;
let playTimer = null;
let selectedSlug = null;
let catalog = [];          // list items from GET /algorithms
let currentDetail = null;  // detail object from GET /algorithms/:slug
let currentVisualizer = 'array';
let isCustomActive = false;
let currentSnippets = {};  // { language: code } for the selected algorithm
let activeCategory = 'all';
let searchQuery = '';
let speedMs = 150;

// Dynamic Input Values
let arrInput = [45, 12, 89, 34, 67, 23, 78, 56, 90, 9];

// 2D Grid Visualizer Configuration State
let gridRows = 12;
let gridCols = 20;
let startNode = [3, 3];
let endNode = [8, 16];
let gridState = []; // Holds 'empty', 'wall', 'weight'
let isDrawingWall = false;
let isDrawingWeight = false;
let isDraggingStart = false;
let isDraggingEnd = false;

// DOM Elements cache
let codeEditor, lineGutter, dynamicInpEl, searchInp, algoListContainer, playBtn;

document.addEventListener('DOMContentLoaded', () => {
  // Grab crucial DOM node handles
  codeEditor = document.getElementById('code-editor');
  lineGutter = document.querySelector('.line-gutter');
  dynamicInpEl = document.getElementById('dynamic-inp');
  searchInp = document.getElementById('search-inp');
  algoListContainer = document.getElementById('algo-list');
  playBtn = document.getElementById('btn-play');

  // Load listeners
  setupEventListeners();
  
  // Grid defaults
  resetGridState();

  // Load the catalog from the backend, then select the first algorithm.
  bootCatalog();
});

// ───────────────────────────────────────────────────────────
// 0. BACKEND CATALOG BOOT (async)
// ───────────────────────────────────────────────────────────
async function bootCatalog() {
  setCatalogStatus('Loading algorithms…');
  try {
    catalog = await window.QV.algorithmsApi.list({});
  } catch (err) {
    setCatalogStatus('Cannot reach the API. Is the backend running on localhost:3000? (' + (err.message || err.code) + ')', true);
    return;
  }
  if (!catalog.length) {
    setCatalogStatus('No algorithms found.');
    return;
  }
  clearCatalogStatus();
  renderAlgoList();
  const initial = (location.hash || '').replace(/^#/, '').trim();
  selectAlgorithm(catalog.some((a) => a.slug === initial) ? initial : catalog[0].slug);
}

function setCatalogStatus(msg, isError) {
  const el = document.getElementById('catalog-status');
  el.hidden = false;
  el.textContent = msg;
  el.className = 'catalog-status' + (isError ? ' error' : '');
}
function clearCatalogStatus() {
  const el = document.getElementById('catalog-status');
  el.hidden = true;
  el.textContent = '';
}

// ───────────────────────────────────────────────────────────
// 1. STATE REVERSIBLE PLAYBACK snapshot ENGINE
// ───────────────────────────────────────────────────────────
function initSimulation() {
  pause();
  const gen = window.ALGO_REGISTRY[selectedSlug];
  if (!gen) return;

  steps = [];
  stepIdx = 0;

  // Shim mirrors the old per-algorithm object the snapshot builders expect.
  const algoShim = { generator: gen, visualizer: currentVisualizer, isCustom: isCustomActive };

  // Read inputs according to the DB-declared visualizer type.
  if (currentVisualizer === 'grid') {
    initSnapshotsForGrid(algoShim);
  } else if (currentVisualizer === 'matrix') {
    initSnapshotsForMatrix(algoShim);
  } else if (currentVisualizer === 'string') {
    initSnapshotsForString(algoShim);
  } else if (currentVisualizer === 'math') {
    initSnapshotsForMath(algoShim);
  } else if (currentVisualizer === 'graph') {
    initSnapshotsForGraph(algoShim);
  } else {
    // Array sorting / searching
    initSnapshotsForArray(algoShim);
  }

  drawCurrentStep();
  updatePlaybackUI();
}

function initSnapshotsForArray(algo) {
  let arrayClone = [...arrInput];
  let genRunner;
  
  try {
    if (algo.isCustom) {
      genRunner = compileCustomCode(arrayClone);
    } else {
      genRunner = algo.generator(arrayClone);
    }
  } catch(err) {
    logMessage(`Compilation Error: ${err.message}`, 'compare');
    return;
  }
  
  // Core Snapshot generation loop
  let opsCount = 0;
  let hasMore = true;
  
  // Step 0: Initial Array state
  steps.push({
    array: [...arrayClone],
    log: 'Initial State loaded.',
    vars: { index: 0 },
    ops: 0,
    type: 'init'
  });
  
  while (hasMore && opsCount < 2000) {
    try {
      const res = genRunner.next();
      if (res.done) {
        hasMore = false;
        steps.push({
          array: [...arrayClone],
          log: res.value?.log || 'Simulation completed!',
          vars: res.value?.vars || {},
          ops: ++opsCount,
          type: 'done'
        });
      } else {
        const stepVal = res.value || {};
        steps.push({
          array: [...arrayClone],
          log: stepVal.log || `Execution step: ${opsCount}`,
          vars: stepVal.vars || {},
          ops: ++opsCount,
          type: stepVal.type || 'active',
          i: stepVal.i,
          j: stepVal.j,
          index: stepVal.index
        });
      }
    } catch (err) {
      logMessage(`Runtime Error: ${err.message}`, 'compare');
      hasMore = false;
    }
  }
}

function initSnapshotsForGrid(algo) {
  // Deep clone active grid representation
  let gridClone = gridState.map(row => [...row]);
  let genRunner = algo.generator(gridClone, [...startNode], [...endNode]);
  let opsCount = 0;
  let hasMore = true;
  let activeGridSteps = [];
  
  steps.push({
    grid: gridClone.map(row => [...row]),
    gridState: [],
    log: 'Initialize pathfinder grid grid.',
    vars: { start: startNode.join(','), target: endNode.join(',') },
    ops: 0,
    type: 'init'
  });
  
  while (hasMore && opsCount < 3000) {
    const res = genRunner.next();
    if (res.done) {
      hasMore = false;
      steps.push({
        grid: gridClone.map(row => [...row]),
        gridState: [...activeGridSteps],
        log: res.value?.log || 'Grid traversal resolved.',
        vars: res.value?.vars || {},
        ops: ++opsCount,
        type: 'done'
      });
    } else {
      const stepVal = res.value || {};
      
      // Update cell values for cellular automata
      if (stepVal.type === 'cellularUpdate') {
        gridClone = stepVal.grid.map(row => [...row]);
      } else if (stepVal.r !== undefined && stepVal.c !== undefined) {
        activeGridSteps.push({
          r: stepVal.r, c: stepVal.c, type: stepVal.type
        });
      }
      
      steps.push({
        grid: gridClone.map(row => [...row]),
        gridState: [...activeGridSteps],
        log: stepVal.log || (stepVal.r !== undefined ? `Frontier checked cell (${stepVal.r}, ${stepVal.c})` : `Grid operation completed`),
        vars: stepVal.vars || {},
        ops: ++opsCount,
        type: stepVal.type || 'visit'
      });
    }
  }
}

function initSnapshotsForGraph(algo) {
  const customGraph = {
    nodes: [
      { id: 1, label: 'A', x: 120, y: 80 },
      { id: 2, label: 'B', x: 260, y: 50 },
      { id: 3, label: 'C', x: 260, y: 160 },
      { id: 4, label: 'D', x: 380, y: 80 }
    ],
    edges: [
      { u: 1, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 4 }, { u: 3, v: 4 }
    ]
  };
  
  let genRunner = algo.generator(customGraph);
  let opsCount = 0;
  let hasMore = true;
  
  steps.push({
    graph: JSON.parse(JSON.stringify(customGraph)),
    log: 'Adjacency vertex sets constructed.',
    vars: {},
    ops: 0,
    type: 'init'
  });
  
  while(hasMore && opsCount < 500) {
    const res = genRunner.next();
    if (res.done) {
      hasMore = false;
      steps.push({
        graph: JSON.parse(JSON.stringify(customGraph)),
        log: 'Graph traversal resolved.',
        vars: {},
        ops: ++opsCount,
        type: 'done'
      });
    } else {
      const stepVal = res.value || {};
      if (stepVal.type === 'initGraph') {
        customGraph.nodes = stepVal.nodes;
        customGraph.edges = stepVal.edges;
      }
      steps.push({
        graph: JSON.parse(JSON.stringify(customGraph)),
        log: stepVal.log || 'Evaluating vertex pathways',
        vars: stepVal.vars || {},
        ops: ++opsCount,
        type: stepVal.type,
        node: stepVal.node,
        u: stepVal.u,
        v: stepVal.v
      });
    }
  }
}

function initSnapshotsForMatrix(algo) {
  let matrixState = {
    rows: [], cols: [], grid: []
  };
  let genRunner = algo.generator();
  let opsCount = 0;
  let hasMore = true;
  
  steps.push({
    matrix: JSON.parse(JSON.stringify(matrixState)),
    log: 'Set recurrence grid boundaries.',
    vars: {},
    ops: 0,
    type: 'init'
  });
  
  while(hasMore && opsCount < 1000) {
    const res = genRunner.next();
    if (res.done) {
      hasMore = false;
      steps.push({
        matrix: JSON.parse(JSON.stringify(matrixState)),
        log: res.value?.log || 'DP computation complete!',
        vars: {},
        ops: ++opsCount,
        type: 'done'
      });
    } else {
      const stepVal = res.value || {};
      if (stepVal.type === 'initMatrix') {
        matrixState.rows = stepVal.rows;
        matrixState.cols = stepVal.cols;
        matrixState.grid = Array.from({length: stepVal.rows.length}, () => Array(stepVal.cols.length).fill(null));
      } else if (stepVal.type === 'cellUpdate') {
        matrixState.grid[stepVal.r][stepVal.c] = stepVal.val;
      }
      
      steps.push({
        matrix: JSON.parse(JSON.stringify(matrixState)),
        log: stepVal.log || 'Evaluating matrix recurrence transition',
        vars: stepVal.vars || {},
        ops: ++opsCount,
        type: stepVal.type,
        r: stepVal.r,
        c: stepVal.c,
        state: stepVal.state
      });
    }
  }
}

function initSnapshotsForString(algo) {
  let stringState = { text: '', pattern: '' };
  let genRunner = algo.generator();
  let opsCount = 0;
  let hasMore = true;
  
  steps.push({
    string: { ...stringState },
    log: 'Set comparison string registers.',
    vars: {},
    ops: 0,
    type: 'init'
  });
  
  while(hasMore && opsCount < 500) {
    const res = genRunner.next();
    if (res.done) {
      hasMore = false;
      steps.push({
        string: { ...stringState },
        log: 'String scanning completed.',
        vars: {},
        ops: ++opsCount,
        type: 'done'
      });
    } else {
      const stepVal = res.value || {};
      if (stepVal.type === 'initString') {
        stringState.text = stepVal.text;
        stringState.pattern = stepVal.pattern;
      }
      steps.push({
        string: { ...stringState },
        log: stepVal.log || 'Pattern shifting comparisons',
        vars: stepVal.vars || {},
        ops: ++opsCount,
        type: stepVal.type,
        textIdx: stepVal.textIdx,
        patIdx: stepVal.patIdx,
        matches: stepVal.matches
      });
    }
  }
}

function initSnapshotsForMath(algo) {
  let mathState = { mode: 'sieve', primes: {}, max: 50, pegs: [[], [], []], totalDisks: 4 };
  let genRunner = algo.generator();
  let opsCount = 0;
  let hasMore = true;
  
  steps.push({
    math: JSON.parse(JSON.stringify(mathState)),
    log: 'Initialize computational structures.',
    vars: {},
    ops: 0,
    type: 'init'
  });
  
  while(hasMore && opsCount < 1000) {
    const res = genRunner.next();
    if (res.done) {
      hasMore = false;
      steps.push({
        math: JSON.parse(JSON.stringify(mathState)),
        log: 'Math operations calculated.',
        vars: {},
        ops: ++opsCount,
        type: 'done'
      });
    } else {
      const stepVal = res.value || {};
      
      // Handle Sieve
      if (stepVal.type === 'initSieve') {
        mathState.mode = 'sieve';
        mathState.max = stepVal.max;
        mathState.primes = {};
        for(let x=2; x<=stepVal.max; x++) mathState.primes[x] = true;
      } else if (stepVal.type === 'checkMultiple') {
        mathState.primes[stepVal.index] = false;
      } else if (stepVal.type === 'markPrime') {
        mathState.primes[stepVal.index] = true;
      }
      
      // Handle Hanoi
      else if (stepVal.type === 'initHanoi') {
        mathState.mode = 'hanoi';
        mathState.totalDisks = stepVal.disks;
        mathState.pegs = [Array.from({length: stepVal.disks}, (_, i) => stepVal.disks - i), [], []];
      } else if (stepVal.type === 'moveDisk') {
        const disk = mathState.pegs[stepVal.from].pop();
        mathState.pegs[stepVal.to].push(disk);
      }
      
      steps.push({
        math: JSON.parse(JSON.stringify(mathState)),
        log: stepVal.log || 'Executing math operations',
        vars: stepVal.vars || {},
        ops: ++opsCount,
        type: stepVal.type,
        prime: stepVal.prime,
        index: stepVal.index
      });
    }
  }
}

// ───────────────────────────────────────────────────────────
// 2. RENDERING STEPS DISPATCHER
// ───────────────────────────────────────────────────────────
function drawCurrentStep() {
  if (steps.length === 0) return;
  const stepObj = steps[stepIdx];
  if (!selectedSlug) return;

  // Write variable stats immediately
  document.getElementById('stat-ops').innerText = stepObj.ops;
  document.getElementById('stat-pct').innerText = steps.length > 1 ? `${Math.floor((stepIdx / (steps.length - 1)) * 100)}%` : '0%';
  
  // Log panel updates
  const logPanel = document.getElementById('op-log');
  const logRow = document.createElement('div');
  logRow.className = `log-row ${stepObj.type}`;
  logRow.innerText = `[Step ${stepObj.ops}] ${stepObj.log}`;
  logPanel.appendChild(logRow);
  logPanel.scrollTop = logPanel.scrollHeight;
  
  // Variable variables debugger inspector panel updates
  const varPanel = document.getElementById('var-grid');
  varPanel.innerHTML = '';
  Object.keys(stepObj.vars || {}).forEach(name => {
    const item = document.createElement('div');
    item.className = 'var-item';
    item.innerHTML = `<span class="var-name">${name}:</span> <span class="var-val">${JSON.stringify(stepObj.vars[name])}</span>`;
    varPanel.appendChild(item);
  });
  
  // Toggle visible visualizer canvas matching the algorithm type
  const channels = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
  channels.forEach(ch => {
    const el = document.getElementById(`viz-${ch}`);
    if (ch === currentVisualizer) el.classList.add('active');
    else el.classList.remove('active');
  });

  // Trigger rendering action
  if (currentVisualizer === 'grid') {
    drawGrid(stepObj.grid, stepObj);
  } else if (currentVisualizer === 'graph') {
    drawGraph(stepObj.graph, stepObj);
  } else if (currentVisualizer === 'matrix') {
    drawMatrix(stepObj.matrix, stepObj);
  } else if (currentVisualizer === 'string') {
    drawString(stepObj.string, stepObj);
  } else if (currentVisualizer === 'math') {
    drawMath(stepObj.math, stepObj);
  } else {
    drawArray(stepObj.array, stepObj);
  }
  
  // Highlight matching lines inside code sandbox if index exists
  if (stepObj.vars && stepObj.vars.line !== undefined) {
    highlightEditorLine(stepObj.vars.line);
  } else {
    highlightEditorLine(-1);
  }
}

// ───────────────────────────────────────────────────────────
// 3. CONTROLS INTERACTIVE EVENTS
// ───────────────────────────────────────────────────────────
function play() {
  if (isPlaying || steps.length === 0) return;
  isPlaying = true;
  playBtn.innerHTML = '⚡ PAUSE';
  playBtn.classList.add('active');
  document.getElementById('sys-badge').innerText = 'RUNNING';
  document.getElementById('sys-badge').className = 'panel-status status-running';
  
  playTimer = setInterval(() => {
    if (stepIdx < steps.length - 1) {
      stepIdx++;
      drawCurrentStep();
      updatePlaybackUI();
    } else {
      pause();
      document.getElementById('sys-badge').innerText = 'COMPLETED';
      document.getElementById('sys-badge').className = 'panel-status status-done';
    }
  }, speedMs);
}

function pause() {
  isPlaying = false;
  if (playTimer) clearInterval(playTimer);
  playBtn.innerHTML = '▶ PLAY';
  playBtn.classList.remove('active');
  document.getElementById('sys-badge').innerText = 'PAUSED';
  document.getElementById('sys-badge').className = 'panel-status status-paused';
  updatePlaybackUI();
}

function stepForward() {
  pause();
  if (stepIdx < steps.length - 1) {
    stepIdx++;
    drawCurrentStep();
    updatePlaybackUI();
  }
}

function stepBackward() {
  pause();
  if (stepIdx > 0) {
    // Clear logs backward to matches index
    document.getElementById('op-log').innerHTML = '';
    const targetIdx = stepIdx - 1;
    stepIdx = 0;
    
    // Replay log history snapshots
    while(stepIdx <= targetIdx) {
      drawCurrentStep();
      stepIdx++;
    }
    stepIdx = targetIdx;
    updatePlaybackUI();
  }
}

function resetSimulation() {
  pause();
  document.getElementById('op-log').innerHTML = '';
  initSimulation();
}

function updatePlaybackUI() {
  document.getElementById('btn-step-bk').disabled = (stepIdx === 0);
  document.getElementById('btn-step-fw').disabled = (stepIdx === steps.length - 1);
}

function setSpeed(val) {
  speedMs = 1000 - val;
  document.getElementById('speed-label').innerText = `${val}ms`;
  if (isPlaying) {
    pause();
    play();
  }
}

function logMessage(msg, type = 'active') {
  const panel = document.getElementById('op-log');
  const row = document.createElement('div');
  row.className = `log-row ${type}`;
  row.innerText = `[SYSTEM] ${msg}`;
  panel.appendChild(row);
  panel.scrollTop = panel.scrollHeight;
}

// ───────────────────────────────────────────────────────────
// 4. GRID CANVAS ANCHORS PAINTING & DRAG
// ───────────────────────────────────────────────────────────
function resetGridState() {
  gridState = Array.from({length: gridRows}, () => Array(gridCols).fill('empty'));
}

function handleGridMouseDown(e, r, c) {
  if (r === startNode[0] && c === startNode[1]) {
    isDraggingStart = true;
  } else if (r === endNode[0] && c === endNode[1]) {
    isDraggingEnd = true;
  } else {
    // If Shift key is pressed, place weights, otherwise walls
    if (e.shiftKey) {
      isDrawingWeight = true;
      toggleWeight(r, c);
    } else {
      isDrawingWall = true;
      toggleWall(r, c);
    }
  }
  e.preventDefault();
}

function handleGridMouseEnter(e, r, c) {
  if (isDraggingStart) {
    if (gridState[r][c] !== 'wall' && !(r === endNode[0] && c === endNode[1])) {
      startNode = [r, c];
      drawGrid(gridState, steps[stepIdx] || {});
    }
  } else if (isDraggingEnd) {
    if (gridState[r][c] !== 'wall' && !(r === startNode[0] && c === startNode[1])) {
      endNode = [r, c];
      drawGrid(gridState, steps[stepIdx] || {});
    }
  } else if (isDrawingWall) {
    toggleWall(r, c);
  } else if (isDrawingWeight) {
    toggleWeight(r, c);
  }
}

window.addEventListener('mouseup', () => {
  isDrawingWall = false;
  isDrawingWeight = false;
  isDraggingStart = false;
  isDraggingEnd = false;
  if (currentVisualizer === 'grid') {
    resetSimulation();
  }
});

function toggleWall(r, c) {
  if ((r === startNode[0] && c === startNode[1]) || (r === endNode[0] && c === endNode[1])) return;
  gridState[r][c] = (gridState[r][c] === 'wall') ? 'empty' : 'wall';
  drawGrid(gridState, steps[stepIdx] || {});
}

function toggleWeight(r, c) {
  if ((r === startNode[0] && c === startNode[1]) || (r === endNode[0] && c === endNode[1])) return;
  gridState[r][c] = (gridState[r][c] === 'weight') ? 'empty' : 'weight';
  drawGrid(gridState, steps[stepIdx] || {});
}

// ───────────────────────────────────────────────────────────
// 5. CODE SANDBOX COMPILING INTERACTIVE ENGINE
// ───────────────────────────────────────────────────────────
function syncGutterLines() {
  const lineCount = codeEditor.value.split('\n').length;
  lineGutter.innerHTML = '';
  for (let i = 1; i <= lineCount; i++) {
    const div = document.createElement('div');
    div.innerText = i;
    lineGutter.appendChild(div);
  }
}

function highlightEditorLine(num) {
  const divs = lineGutter.querySelectorAll('div');
  divs.forEach((d, idx) => {
    if (idx === num - 1) d.style.color = 'var(--neon-cyan)';
    else d.style.color = '#334155';
  });
}

function compileCustomCode(args) {
  const srcCode = codeEditor.value;
  // Match generator signature
  let fnNameMatch = srcCode.match(/function\*\s+(\w+)\s*\(/);
  if (!fnNameMatch) {
    throw new Error("Missing generator function! Must declare 'function* myAlgo(arr) { ... }'");
  }
  const fnName = fnNameMatch[1];
  
  // Wrap into dynamic builder function
  const builder = new Function(`${srcCode} return ${fnName};`);
  const generatorCompiled = builder();
  return generatorCompiled(args);
}

// ───────────────────────────────────────────────────────────
// 6. UI COMPONENT INTEGRATION HOOKS
// ───────────────────────────────────────────────────────────
function renderAlgoList() {
  algoListContainer.innerHTML = '';

  catalog.forEach((algo) => {
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = (activeCategory === 'all' || algo.category === activeCategory);
    if (!(matchesSearch && matchesCategory)) return;

    const viz = algo.visualizerType;
    let badgeClass = 'badge-arr';
    if (viz === 'grid') badgeClass = 'badge-grid';
    else if (viz === 'graph') badgeClass = 'badge-graph';
    else if (viz === 'matrix') badgeClass = 'badge-mat';
    else if (viz === 'string') badgeClass = 'badge-str';
    else if (viz === 'math') badgeClass = 'badge-math';

    const item = document.createElement('div');
    item.className = `algo-item ${algo.slug === selectedSlug ? 'active' : ''}`;
    item.innerHTML = `
      <div class="algo-header-row">
        <span class="algo-name">${algo.name}</span>
        <span class="algo-badge ${badgeClass}">${viz}</span>
      </div>
      <div class="algo-subinfo">
        <span>${algo.category}</span>
        <span>${algo.difficulty || ''}</span>
      </div>
    `;
    item.addEventListener('click', () => selectAlgorithm(algo.slug));
    algoListContainer.appendChild(item);
  });
}

async function selectAlgorithm(slug) {
  selectedSlug = slug;
  isCustomActive = false;

  // Fetch the algorithm's metadata + code from the backend.
  try {
    currentDetail = await window.QV.algorithmsApi.detail(slug);
  } catch (err) {
    logMessage('Failed to load ' + slug + ': ' + (err.message || err.code), 'compare');
    return;
  }
  currentVisualizer = currentDetail.visualizerType;

  renderDetailPanel(currentDetail);
  renderInputsPanel(currentVisualizer);
  renderAlgoList();

  const gen = window.ALGO_REGISTRY[slug];
  if (!gen) {
    showComingSoon(currentDetail.name);
    return;
  }
  resetSimulation();
}

// Populate the contextual input controls for the active visualizer type.
function renderInputsPanel(visualizer) {
  const inputsPanel = document.getElementById('dynamic-inputs');
  inputsPanel.innerHTML = '';

  if (visualizer === 'grid') {
    inputsPanel.innerHTML = `
      <label>Grid Size Preset Options</label>
      <div class="presets-row">
        <button class="preset-btn" onclick="resizeGridBoard(8, 12)">Small (8x12)</button>
        <button class="preset-btn" onclick="resizeGridBoard(12, 20)">Medium (12x20)</button>
        <button class="preset-btn" onclick="resizeGridBoard(18, 30)">Large (18x30)</button>
        <button class="preset-btn" onclick="clearActiveGridWalls()">Clear Walls</button>
      </div>
      <div style="font-size:10px; color:var(--text-dim); margin-top:8px;">
        🖱 Click & Drag to paint <b>Walls</b>. Drag anchors to shift start/end. <br>⌨ Hold <b>Shift</b> + drag to paint <b>Weights⚓</b>.
      </div>
    `;
  } else if (visualizer === 'matrix') {
    inputsPanel.innerHTML = `
      <label>Knapsack weights & values</label>
      <input type="text" class="input-field" value="Weights: [2,3,4,5], Values: [3,4,5,6]" disabled>
      <div style="font-size:10px; color:var(--text-dim); margin-top:6px;">DP recursive equations solve optimal cells state values sequentially.</div>
    `;
  } else if (visualizer === 'string') {
    inputsPanel.innerHTML = `
      <label>Pattern text parameters</label>
      <input type="text" class="input-field" value="Ref: AABAACAADAABAABA, Pat: AABA" disabled>
    `;
  } else if (visualizer === 'math') {
    inputsPanel.innerHTML = `
      <label>Math computational modes</label>
      <div class="presets-row">
        <span style="font-size:11px; color:var(--neon-gold); font-family:'Share Tech Mono';">Disks/Grid boundary ranges set programmatically.</span>
      </div>
    `;
  } else {
    inputsPanel.innerHTML = `
      <label>Integer Array Elements preset</label>
      <input type="text" id="arr-val-inp" class="input-field" value="${arrInput.join(', ')}">
      <div class="presets-row" style="margin-top:8px;">
        <button class="preset-btn" onclick="setArrayPreset('random')">Randomize</button>
        <button class="preset-btn" onclick="setArrayPreset('sorted')">Sorted</button>
        <button class="preset-btn" onclick="setArrayPreset('reversed')">Reversed</button>
      </div>
    `;
    document.getElementById('arr-val-inp').addEventListener('change', (e) => {
      arrInput = e.target.value.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
      resetSimulation();
    });
  }
}

// Render the DB-driven detail panel + load the code snippet into the editor.
function renderDetailPanel(detail) {
  const nameEl = document.getElementById('detail-name');
  if (nameEl) nameEl.textContent = detail.name;
  const diff = document.getElementById('detail-difficulty');
  if (diff) {
    diff.textContent = detail.difficulty || '';
    diff.className = 'detail-badge diff-' + (detail.difficulty || 'na');
  }
  const summaryEl = document.getElementById('detail-summary');
  if (summaryEl) summaryEl.textContent = detail.summary || '';
  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = detail.description || '';
  const cplx = document.getElementById('detail-complexity');
  if (cplx) {
    const t = detail.timeComplexities || {};
    cplx.innerHTML =
      '<span>Best <b>' + (t.best || '—') + '</b></span>' +
      '<span>Avg <b>' + (t.average || '—') + '</b></span>' +
      '<span>Worst <b>' + (t.worst || '—') + '</b></span>' +
      '<span>Space <b>' + (detail.spaceComplexity || '—') + '</b></span>';
  }
  // Load snippets; default to JavaScript so the sandbox can compile it.
  currentSnippets = {};
  (detail.codeSnippets || []).forEach((s) => { currentSnippets[s.language] = s.code; });
  setSnippetLang(currentSnippets['javascript'] ? 'javascript' : 'pseudocode');

  // Show the Explain button only when there is explanation content.
  const explainBtn = document.getElementById('btn-explain');
  if (explainBtn) explainBtn.hidden = !(detail.explanation && detail.explanation.length);
}

// Open the in-depth explanation modal for the current algorithm.
function openExplanation() {
  if (!currentDetail || !currentDetail.explanation || !currentDetail.explanation.length) return;
  document.getElementById('explain-title').textContent = currentDetail.name;
  const body = document.getElementById('explain-body');
  body.innerHTML = '';
  currentDetail.explanation.forEach((sec) => {
    const section = document.createElement('section');
    section.className = 'explain-section';
    const h = document.createElement('h4');
    h.textContent = sec.heading;
    const p = document.createElement('p');
    p.textContent = sec.body;
    section.appendChild(h);
    section.appendChild(p);
    body.appendChild(section);
  });
  const modal = document.getElementById('explain-modal');
  modal.hidden = false;
  body.scrollTop = 0;
}

function closeExplanation() {
  const modal = document.getElementById('explain-modal');
  if (modal) modal.hidden = true;
}

function setSnippetLang(lang) {
  document.querySelectorAll('.snippet-tab').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  codeEditor.value = currentSnippets[lang] || '// (no snippet available)';
  syncGutterLines();
}

// Shown when a catalog entry has no client-side generator yet.
function showComingSoon(name) {
  steps = [];
  stepIdx = 0;
  const explainBtn = document.getElementById('btn-explain');
  if (explainBtn) explainBtn.hidden = true;
  const channels = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
  channels.forEach((ch) => document.getElementById('viz-' + ch).classList.remove('active'));
  const host = document.getElementById('viz-array');
  host.classList.add('active');
  host.innerHTML = '<div style="margin:auto;color:var(--text-dim);font-family:var(--mono);font-size:12px;">Visualization for ' + name + ' is coming soon.</div>';
}

function resizeGridBoard(r, c) {
  gridRows = r;
  gridCols = c;
  startNode = [Math.floor(r/3), Math.floor(c/4)];
  endNode = [Math.floor(r*2/3), Math.floor(c*3/4)];
  
  resetGridState();
  
  // Rebuild grid elements immediately
  const board = document.getElementById('grid-board');
  board.innerHTML = '';
  
  initSimulation();
}

function clearActiveGridWalls() {
  resetGridState();
  initSimulation();
}

function setArrayPreset(type) {
  if (type === 'random') {
    arrInput = Array.from({length: 10}, () => Math.floor(Math.random() * 95) + 5);
  } else if (type === 'sorted') {
    arrInput = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  } else if (type === 'reversed') {
    arrInput = [95, 85, 75, 65, 55, 45, 35, 25, 15, 5];
  }
  
  const el = document.getElementById('arr-val-inp');
  if (el) el.value = arrInput.join(', ');
  resetSimulation();
}

// ───────────────────────────────────────────────────────────
// 7. EVENT LISTENERS HOOKS
// ───────────────────────────────────────────────────────────
function setupEventListeners() {
  // Search filter
  searchInp.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderAlgoList();
  });
  
  // Category tab clicks
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(el => el.classList.remove('active'));
      p.classList.add('active');
      activeCategory = p.dataset.cat;
      renderAlgoList();
    });
  });
  
  // Gutter synchronizing key presses inside editor
  codeEditor.addEventListener('input', syncGutterLines);
  codeEditor.addEventListener('scroll', () => {
    lineGutter.scrollTop = codeEditor.scrollTop;
  });
  
  // Compile / Run Sandbox button hook
  document.getElementById('btn-compile').addEventListener('click', () => {
    pause();
    // Flag a session-local custom run for the array visualizer. initSnapshotsForArray
    // compiles the editor's generator when isCustomActive is set; cleared on next select.
    isCustomActive = true;
    logMessage("Sandboxed custom code compiled successfully. Running simulation...", "done");
    initSimulation();
  });
  
  // Playback control event listeners
  playBtn.addEventListener('click', () => {
    if (isPlaying) pause();
    else play();
  });
  
  document.getElementById('btn-step-bk').addEventListener('click', stepBackward);
  document.getElementById('btn-step-fw').addEventListener('click', stepForward);
  document.getElementById('btn-reset').addEventListener('click', resetSimulation);
  
  document.getElementById('speed-range').addEventListener('input', (e) => {
    setSpeed(parseInt(e.target.value, 10));
  });

  // Code snippet language tabs (JS / pseudocode)
  document.querySelectorAll('.snippet-tab').forEach((b) => {
    b.addEventListener('click', () => setSnippetLang(b.dataset.lang));
  });

  // Explanation modal: open, close (X), backdrop click, Esc
  document.getElementById('btn-explain').addEventListener('click', openExplanation);
  document.getElementById('explain-close').addEventListener('click', closeExplanation);
  document.getElementById('explain-modal').addEventListener('click', (e) => {
    if (e.target.id === 'explain-modal') closeExplanation();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeExplanation();
  });
}
