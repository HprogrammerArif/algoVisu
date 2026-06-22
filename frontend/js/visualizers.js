// ═══════════════════════════════════════════════════════════
//  VISUALIZER DRAWING ENGINES & ACTIONS
// ═══════════════════════════════════════════════════════════

// Global Drag State for Graphs
let draggedNodeId = null;

// ───────────────────────────────────────────────────────────
// 1. ARRAY 1D VISUALIZER
// ───────────────────────────────────────────────────────────
function drawArray(arr, stepObj) {
  const container = document.getElementById('viz-array');
  container.innerHTML = '';
  
  const maxVal = Math.max(...arr, 1);
  const activeIdx = (stepObj.type === 'active' || stepObj.type === 'compare') ? stepObj.i : null;
  const compareIdx = (stepObj.type === 'compare') ? stepObj.j : null;
  const pivotIdx = (stepObj.type === 'pivot') ? stepObj.index : null;
  const swapPair = (stepObj.type === 'swap') ? [stepObj.i, stepObj.j] : null;

  arr.forEach((val, idx) => {
    const col = document.createElement('div');
    col.className = 'array-bar-col';

    const bar = document.createElement('div');
    bar.className = 'array-bar';

    // Normalize height between 5% and 95%
    const heightPercent = 5 + (val / maxVal) * 85;
    bar.style.height = `${heightPercent}%`;

    // Assign interactive visualizer highlight status classes
    if (swapPair && (idx === swapPair[0] || idx === swapPair[1])) {
      bar.classList.add('state-pivot');           // swapped elements flash
    } else if (idx === activeIdx) {
      bar.classList.add('state-active');
    } else if (idx === compareIdx) {
      bar.classList.add('state-compare');
    } else if (idx === pivotIdx) {
      bar.classList.add('state-pivot');
    } else if (stepObj.type === 'sorted' && idx <= stepObj.index) {
      bar.classList.add('state-sorted');           // sort progress / search hit
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
}

// ───────────────────────────────────────────────────────────
// 2. GRID 2D VISUALIZER
// ───────────────────────────────────────────────────────────
function drawGrid(grid, stepObj) {
  const board = document.getElementById('grid-board');
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Rebuild grid structure if size mismatch
  if (board.children.length !== rows * cols) {
    board.innerHTML = '';
    board.style.gridTemplateRows = `repeat(${rows}, 22px)`;
    board.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const node = document.createElement('div');
        node.className = 'grid-node';
        node.dataset.row = r;
        node.dataset.col = c;
        
        // Listen to mouse actions for painting walls / dragging anchors
        node.addEventListener('mousedown', (e) => handleGridMouseDown(e, r, c));
        node.addEventListener('mouseenter', (e) => handleGridMouseEnter(e, r, c));
        board.appendChild(node);
      }
    }
  }
  
  // Draw node cell styles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cell = board.children[idx];
      cell.className = 'grid-node';
      
      const val = grid[r][c];
      if (val === 'wall') {
        cell.classList.add('node-wall');
      } else if (val === 'weight') {
        cell.classList.add('node-weight');
      }
      
      // Starting / End visual anchor overrides
      if (r === startNode[0] && c === startNode[1]) {
        cell.classList.add('node-start');
      } else if (r === endNode[0] && c === endNode[1]) {
        cell.classList.add('node-end');
      }
    }
  }
  
  // Apply visited path animation classes
  if (stepObj && stepObj.gridState) {
    stepObj.gridState.forEach(st => {
      const idx = st.r * cols + st.c;
      const cell = board.children[idx];
      if (!cell) return;
      
      // Don't paint visited styles on top of starting and ending boundaries
      if ((st.r === startNode[0] && st.c === startNode[1]) || (st.r === endNode[0] && st.c === endNode[1])) return;
      
      if (st.type === 'visit') {
        cell.classList.add('node-visited');
      } else if (st.type === 'enqueue') {
        cell.classList.add('node-frontier');
      } else if (st.type === 'path') {
        cell.classList.add('node-path');
      }
    });
  }
}

// ───────────────────────────────────────────────────────────
// 3. GRAPH SVG VISUALIZER
// ───────────────────────────────────────────────────────────
function drawGraph(graph, stepObj) {
  const svg = document.getElementById('graph-svg');
  svg.innerHTML = '';
  
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  
  // Draw edges
  edges.forEach((edge) => {
    const uNode = nodes.find(n => n.id === edge.u);
    const vNode = nodes.find(n => n.id === edge.v);
    if (!uNode || !vNode) return;
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", uNode.x);
    line.setAttribute("y1", uNode.y);
    line.setAttribute("x2", vNode.x);
    line.setAttribute("y2", vNode.y);
    line.setAttribute("class", "graph-edge");
    
    // Highlights depending on active execution debugger status
    if (stepObj.type === 'traverseEdge' && 
       ((stepObj.u === edge.u && stepObj.v === edge.v) || (stepObj.u === edge.v && stepObj.v === edge.u))) {
      line.classList.add('active');
    }
    
    svg.appendChild(line);
    
    // Optional Edge weight rendering
    if (edge.w !== undefined) {
      const mx = (uNode.x + vNode.x) / 2;
      const my = (uNode.y + vNode.y) / 2;
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", mx);
      txt.setAttribute("y", my - 4);
      txt.setAttribute("class", "edge-weight-text");
      txt.textContent = edge.w;
      svg.appendChild(txt);
    }
  });
  
  // Draw Nodes
  nodes.forEach((n) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = 'grab';
    
    // Draggable element events
    g.addEventListener('mousedown', (e) => {
      draggedNodeId = n.id;
      g.style.cursor = 'grabbing';
      e.stopPropagation();
    });
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", 20);
    circle.setAttribute("class", "graph-node-circle");
    
    // Apply debugger highlight states
    if (stepObj.type === 'activeNode' && stepObj.node === n.id) {
      circle.classList.add('active');
    } else if (stepObj.type === 'compareNode' && stepObj.node === n.id) {
      circle.classList.add('compare');
    } else if (stepObj.type === 'visitedNode' && stepObj.node === n.id) {
      circle.classList.add('visited');
    }
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", n.x);
    text.setAttribute("y", n.y);
    text.setAttribute("class", "graph-node-text");
    text.textContent = n.label;
    
    g.appendChild(circle);
    g.appendChild(text);
    svg.appendChild(g);
  });
  
  // Handle moving vertex positioning
  svg.addEventListener('mousemove', (e) => {
    if (draggedNodeId === null) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const target = nodes.find(n => n.id === draggedNodeId);
    if (target) {
      // Boundaries checks
      target.x = Math.max(20, Math.min(rect.width - 20, x));
      target.y = Math.max(20, Math.min(rect.height - 20, y));
      
      // Update UI lines immediately
      drawGraph(graph, stepObj);
    }
  });
  
  window.addEventListener('mouseup', () => {
    draggedNodeId = null;
  });
}

// ───────────────────────────────────────────────────────────
// 4. MATRIX / DP TABLE VISUALIZER
// ───────────────────────────────────────────────────────────
function drawMatrix(matrix, stepObj) {
  const container = document.getElementById('viz-matrix');
  container.innerHTML = '';
  
  const tbl = document.createElement('table');
  tbl.id = 'matrix-table';
  
  const headerRow = document.createElement('tr');
  const emptyCorner = document.createElement('th');
  headerRow.appendChild(emptyCorner);
  
  matrix.cols.forEach(c => {
    const th = document.createElement('th');
    th.innerText = c;
    headerRow.appendChild(th);
  });
  tbl.appendChild(headerRow);
  
  matrix.rows.forEach((rLabel, rIdx) => {
    const row = document.createElement('tr');
    const th = document.createElement('th');
    th.innerText = rLabel;
    row.appendChild(th);
    
    matrix.cols.forEach((_, cIdx) => {
      const td = document.createElement('td');
      const val = matrix.grid[rIdx][cIdx];
      td.innerText = val !== null ? val : '-';
      
      // Check current lookups and assign color tags
      if (stepObj && stepObj.r === rIdx && stepObj.c === cIdx) {
        if (stepObj.state === 'compare') {
          td.className = 'compare-cell';
        } else if (stepObj.state === 'solved') {
          td.className = 'solved-cell';
        } else {
          td.className = 'active-cell';
        }
      }
      row.appendChild(td);
    });
    tbl.appendChild(row);
  });
  
  container.appendChild(tbl);
}

// ───────────────────────────────────────────────────────────
// 5. STRING MATCHING VISUALIZER
// ───────────────────────────────────────────────────────────
function drawString(state, stepObj) {
  const container = document.getElementById('viz-string');
  container.innerHTML = '';
  
  // Render main reference String text row
  const textLabel = document.createElement('label');
  textLabel.style = "font-family: 'Share Tech Mono'; color: #64748b; font-size:10px;";
  textLabel.innerText = "REFERENCE TEXT CORPUSE";
  container.appendChild(textLabel);
  
  const textRow = document.createElement('div');
  textRow.className = 'string-row';
  state.text.split('').forEach((char, idx) => {
    const item = document.createElement('div');
    item.className = 'string-char';
    item.innerText = char;
    
    // Highlight indexes based on active step status
    if (stepObj.type === 'charMatch' && stepObj.textIdx === idx) {
      item.classList.add(stepObj.matches ? 'match' : 'mismatch');
    }
    
    textRow.appendChild(item);
  });
  container.appendChild(textRow);
  
  // Render Search Pattern sliding row
  const patLabel = document.createElement('label');
  patLabel.style = "font-family: 'Share Tech Mono'; color: #64748b; font-size:10px;";
  patLabel.innerText = "SEARCH PATTERN QUERY";
  container.appendChild(patLabel);
  
  const patRow = document.createElement('div');
  patRow.className = 'string-row';
  
  // Shift pattern to the right with margin offset for comparative alignment
  const offset = (stepObj.type === 'charMatch') ? stepObj.textIdx - stepObj.patIdx : 0;
  patRow.style.marginLeft = `${offset * 36}px`;
  patRow.style.transition = 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
  
  state.pattern.split('').forEach((char, idx) => {
    const item = document.createElement('div');
    item.className = 'string-char';
    item.innerText = char;
    
    if (stepObj.type === 'charMatch' && stepObj.patIdx === idx) {
      item.classList.add(stepObj.matches ? 'match' : 'mismatch');
    }
    patRow.appendChild(item);
  });
  container.appendChild(patRow);
}

// ───────────────────────────────────────────────────────────
// 6. MATH & TOWER OF HANOI VISUALIZER
// ───────────────────────────────────────────────────────────
function drawMath(state, stepObj) {
  const container = document.getElementById('viz-math');
  container.innerHTML = '';
  
  if (state.mode === 'sieve') {
    const grid = document.createElement('div');
    grid.id = 'sieve-grid';
    
    for (let i = 1; i <= state.max; i++) {
      const cell = document.createElement('div');
      cell.className = 'sieve-cell';
      cell.innerText = i;
      
      if (i === 1) {
        cell.classList.add('composite');
      } else if (state.primes && state.primes[i]) {
        cell.classList.add('prime');
      } else if (state.primes && !state.primes[i]) {
        cell.classList.add('composite');
      }
      
      // Dynamic highlights during prime sieve sweeps
      if (stepObj.type === 'activePrime' && stepObj.prime === i) {
        cell.className = 'sieve-cell active-p';
      } else if (stepObj.type === 'checkMultiple' && stepObj.index === i) {
        cell.className = 'sieve-cell checking';
      }
      grid.appendChild(cell);
    }
    container.appendChild(grid);
  } 
  else if (state.mode === 'hanoi') {
    const canvas = document.createElement('div');
    canvas.id = 'hanoi-canvas';
    
    // Draw 3 Pegs
    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const peg = document.createElement('div');
      peg.className = 'hanoi-peg';
      
      const base = document.createElement('div');
      base.className = 'hanoi-peg-base';
      peg.appendChild(base);
      
      // Draw Peg Disks
      const pegDisks = state.pegs[pIdx] || [];
      pegDisks.forEach((diskSize) => {
        const disk = document.createElement('div');
        disk.className = 'hanoi-disk';
        disk.innerText = diskSize;
        
        // Dynamic width according to size
        const wPercent = 30 + (diskSize / state.totalDisks) * 60;
        disk.style.width = `${wPercent}%`;
        
        // HSL Hue rotation for graded disk rainbow glows
        const hue = (diskSize / state.totalDisks) * 120;
        disk.style.backgroundColor = `hsl(${hue}, 90%, 55%)`;
        disk.style.boxShadow = `0 0 10px hsla(${hue}, 90%, 55%, 0.45)`;
        
        peg.appendChild(disk);
      });
      canvas.appendChild(peg);
    }
    container.appendChild(canvas);
  }
}
