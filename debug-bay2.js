// Test if generateLoopWithBays can produce MULTIPLE disconnected loops
// Each bay creates its OWN closed loop, separate from the border

// Simulate: border + one top bay
const hEdges = new Set(), vEdges = new Set();
const rows = 7, cols = 7;

// Border
for (let c = 0; c < cols; c++) { hEdges.add(`0,${c}`); hEdges.add(`${rows},${c}`); }
for (let r = 0; r < rows; r++) { vEdges.add(`${r},0`); vEdges.add(`${r},${cols}`); }

// One top bay
const c1 = 2, c2 = 5, depth = 2;
for (let c = c1; c < c2; c++) { hEdges.delete(`0,${c}`); }
for (let c = c1; c < c2; c++) { hEdges.add(`${depth},${c}`); }
for (let r = 0; r < depth; r++) { vEdges.add(`${r},${c1}`); vEdges.add(`${r},${c2}`); }

// Count connected components
function getConnectedDots() {
  const visited = new Set();
  const dots = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (hEdges.has(`${r},${c}`) || hEdges.has(`${r},${c-1}`) || 
          vEdges.has(`${r},${c}`) || vEdges.has(`${r-1},${c}`)) {
        dots.push([r, c]);
      }
    }
  }
  return dots;
}

function bfs(startDot, dotsSet) {
  const queue = [startDot];
  const visited = new Set();
  visited.add(startDot.join(','));
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const neighbors = [
      [r, c+1], [r, c-1], [r+1, c], [r-1, c]
    ];
    for (const [nr, nc] of neighbors) {
      if (nr < 0 || nr > rows || nc < 0 || nc > cols) continue;
      const key = nr + ',' + nc;
      if (visited.has(key)) continue;
      const hasH = (nr === r && hEdges.has(`${r},${Math.min(c,nc)}`)) ||
                   (nr === r && hEdges.has(`${r},${Math.min(c,nc)-1}`));
      const hasV = (nc === c && vEdges.has(`${Math.min(r,nr)},${c}`)) ||
                    (nc === c && vEdges.has(`${Math.min(r,nr)-1},${c}`));
      const edgeBetween = (r === nr && hEdges.has(`${r},${Math.min(c,nc)}`)) ||
                          (c === nc && vEdges.has(`${Math.min(r,nr)},${c}`));
      if (edgeBetween) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return visited;
}

const allDots = getConnectedDots();
console.log('Total dots with edges:', allDots.length);

const visitedAll = new Set();
let components = 0;
for (const dot of allDots) {
  const key = dot.join(',');
  if (!visitedAll.has(key)) {
    const comp = bfs(dot, new Set(allDots.map(d => d.join(','))));
    comp.forEach(k => visitedAll.add(k));
    components++;
    console.log(`Component ${components}: ${comp.size} dots`);
  }
}
console.log('Total components:', components);
console.log('Result:', components === 1 ? 'SINGLE LOOP ✓' : 'MULTIPLE LOOPS ✗');

// Now check: are the dots in each component all degree 2?
function getDegree(r, c) {
  let d = 0;
  if (hEdges.has(`${r},${c}`)) d++;
  if (hEdges.has(`${r},${c-1}`)) d++;
  if (vEdges.has(`${r},${c}`)) d++;
  if (vEdges.has(`${r-1},${c}`)) d++;
  return d;
}
const comp1 = bfs(allDots[0], new Set(allDots.map(d => d.join(','))));
let allDeg2 = true;
for (const key of comp1) {
  const [r, c] = key.split(',').map(Number);
  if (getDegree(r, c) !== 2) { allDeg2 = false; console.log('  Dot', key, 'degree != 2:', getDegree(r, c)); }
}
console.log('All degree 2:', allDeg2);

// Count edges in the edge set
let edgeCount = 0;
for (const k of hEdges) edgeCount++;
for (const k of vEdges) edgeCount++;
console.log('Total edges:', edgeCount);
console.log('Expected loop length:', allDots.length, '(one edge per dot in single loop)');
