/**
 * Slither Link Generator v4 - Reliable Loop Generation
 * Strategy: Build loops from rectangles and bays, verify with solver
 */
const fs = require('fs');
const path = require('path');
const solverCode = fs.readFileSync(path.join(__dirname, 'slitherlink-solver.js'), 'utf8');
eval(solverCode);

const BASE_DIR = __dirname;

function edgesToHintsAnswer(hSet, vSet, rows, cols) {
  const hints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (hSet.has(`${r},${c}`)) count++;
      if (hSet.has(`${r+1},${c}`)) count++;
      if (vSet.has(`${r},${c}`)) count++;
      if (vSet.has(`${r},${c+1}`)) count++;
      row.push(count);
    }
    hints.push(row);
  }
  const ah = Array.from({length: rows+1}, () => Array(cols).fill(0));
  const av = Array.from({length: rows}, () => Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); ah[r][c]=1; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); av[r][c]=1; }
  return { hints, answer: {h: ah, v: av} };
}

/**
 * Generate loop by connecting rectangles with corridors
 * This guarantees a valid single loop
 */
function buildLoopRect(rows, cols) {
  const hSet = new Set(), vSet = new Set();
  
  // Start with outer border (a valid loop)
  for (let c = 0; c < cols; c++) { hSet.add(`0,${c}`); hSet.add(`${rows},${c}`); }
  for (let r = 0; r < rows; r++) { vSet.add(`${r},0`); vSet.add(`${r},${cols}`); }
  
  // Add interior bays to make it interesting
  const numBays = 1 + Math.floor(Math.random() * Math.min(4, Math.floor(rows/2)));
  
  for (let b = 0; b < numBays; b++) {
    const side = Math.floor(Math.random() * 4);
    
    if (side === 0 && rows >= 3) { // Top bay going down
      const w = 2 + Math.floor(Math.random() * (cols - 3));
      const c1 = 1 + Math.floor(Math.random() * (cols - w - 1));
      const depth = 1 + Math.floor(Math.random() * (rows - 2));
      for (let c = c1; c < c1 + w; c++) hSet.delete(`0,${c}`);
      for (let c = c1; c < c1 + w; c++) hSet.add(`${depth},${c}`);
      for (let r = 0; r < depth; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
    } else if (side === 2 && rows >= 3) { // Bottom bay going up
      const w = 2 + Math.floor(Math.random() * (cols - 3));
      const c1 = 1 + Math.floor(Math.random() * (cols - w - 1));
      const depth = 1 + Math.floor(Math.random() * (rows - 2));
      for (let c = c1; c < c1 + w; c++) hSet.delete(`${rows},${c}`);
      for (let c = c1; c < c1 + w; c++) hSet.add(`${rows-depth},${c}`);
      for (let r = rows - depth; r < rows; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
    } else if (side === 3 && cols >= 3) { // Left bay going right
      const h = 2 + Math.floor(Math.random() * (rows - 3));
      const r1 = 1 + Math.floor(Math.random() * (rows - h - 1));
      const depth = 1 + Math.floor(Math.random() * (cols - 2));
      for (let r = r1; r < r1 + h; r++) vSet.delete(`${r},0`);
      for (let r = r1; r < r1 + h; r++) vSet.add(`${r},${depth}`);
      for (let c = 0; c < depth; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
    } else if (side === 1 && cols >= 3) { // Right bay going left
      const h = 2 + Math.floor(Math.random() * (rows - 3));
      const r1 = 1 + Math.floor(Math.random() * (rows - h - 1));
      const depth = 1 + Math.floor(Math.random() * (cols - 2));
      for (let r = r1; r < r1 + h; r++) vSet.delete(`${r},${cols}`);
      for (let r = r1; r < r1 + h; r++) vSet.add(`${r},${cols-depth}`);
      for (let c = cols - depth; c < cols; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
    }
  }
  
  return { hSet, vSet };
}

function verifyLoop(hSet, vSet, rows, cols) {
  // All dots with edges must have degree 2
  const deg = Array.from({length: rows+1}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r][c+1]++; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r+1][c]++; }
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++)
    if (deg[r][c] > 0 && deg[r][c] !== 2) return false;
  
  // Must be a single connected component
  let first = null;
  for (const k of hSet) { first = k; break; }
  if (!first) for (const k of vSet) { first = k; break; }
  if (!first) return false;
  
  const [fr, fc] = first.split(',').map(Number);
  const visited = new Set([`${fr},${fc}`]);
  const queue = [[fr, fc]];
  while (queue.length) {
    const [r, c] = queue.shift();
    const ns = [[r,c+1,'h'],[r,c-1,'h'],[r+1,c,'v'],[r-1,c,'v']];
    for (const [nr,nc,t] of ns) {
      if (nr<0||nr>rows||nc<0||nc>cols) continue;
      const key=`${nr},${nc}`;
      if (visited.has(key)) continue;
      const hasEdge = t==='h' ? hSet.has(`${r},${Math.min(c,nc)}`) : vSet.has(`${Math.min(r,nr)},${c}`);
      if (hasEdge) { visited.add(key); queue.push([nr,nc]); }
    }
  }
  
  const allDots = new Set();
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); allDots.add(`${r},${c}`); allDots.add(`${r},${c+1}`); }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); allDots.add(`${r},${c}`); allDots.add(`${r+1},${c}`); }
  
  return visited.size === allDots.size;
}

function generateOne(rows, cols, id) {
  const deadline = Date.now() + 3000;
  for (let i = 0; i < 500; i++) {
    if (Date.now() > deadline) return null;
    const { hSet, vSet } = buildLoopRect(rows, cols);
    if (!verifyLoop(hSet, vSet, rows, cols)) continue;
    
    const { hints, answer } = edgesToHintsAnswer(hSet, vSet, rows, cols);
    const nonZero = hints.flat().filter(h => h > 0).length;
    const ratio = nonZero / (rows * cols);
    if (ratio < 0.15 || ratio > 0.92) continue;
    
    const result = solve(hints);
    if (!result) continue;
    
    return { id, size: rows, grid: hints, answer: result, seed: Math.floor(Math.random()*999999) };
  }
  return null;
}

// Test first
console.log('=== Testing loop generation ===');
for (const size of [5, 7, 10]) {
  let ok = 0, bad = 0;
  for (let i = 0; i < 20; i++) {
    const { hSet, vSet } = buildLoopRect(size, size);
    if (verifyLoop(hSet, vSet, size, size)) ok++; else bad++;
  }
  console.log(`${size}x${size}: ${ok}/20 valid loops`);
}

// Generate medium
console.log('\n=== Generating medium ===');
const dir = path.join(BASE_DIR, 'medium');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir).filter(f=>f.match(/^\w+-\d{4}\.json$/))) fs.unlinkSync(path.join(dir,f));

const results = [];
const start = Date.now();
for (let i = 0; results.length < 50; i++) {
  process.stdout.write(`\r  ${results.length}/50 (${i+1} attempts)...`);
  const p = generateOne(7, 7, results.length+1);
  if (p) {
    results.push(p);
    fs.writeFileSync(path.join(dir, `medium-${String(p.id).padStart(4,'0')}.json`), JSON.stringify(p));
  }
}
console.log(`\n  Done: ${results.length}/50 in ${((Date.now()-start)/1000).toFixed(1)}s`);
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({total:results.length,difficulty:'medium',gridSize:'7x7',generatedAt:new Date().toISOString(),version:'generator-v4'},null,2));
