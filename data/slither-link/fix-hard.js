const fs = require('fs'), path = require('path');
const solverCode = fs.readFileSync('slitherlink-solver.js', 'utf8'); eval(solverCode);

const hardDir = 'hard';
const hardFiles = fs.readdirSync(hardDir).filter(f=>f.match(/^\w+-\d{4}\.json$/));
const noSol = [];
for (const f of hardFiles) {
  const p = JSON.parse(fs.readFileSync(path.join(hardDir, f), 'utf8'));
  if (!solve(p.grid)) noSol.push(f);
}
console.log('Hard no-solution files:', noSol.length);
for (const f of noSol) fs.unlinkSync(path.join(hardDir, f));

// --- helpers (copied from generate-v4.js) ---
function buildLoopRect(rows, cols) {
  const hSet = new Set(), vSet = new Set();
  for (let c = 0; c < cols; c++) { hSet.add(`0,${c}`); hSet.add(`${rows},${c}`); }
  for (let r = 0; r < rows; r++) { vSet.add(`${r},0`); vSet.add(`${r},${cols}`); }
  const numBays = 1 + Math.floor(Math.random() * Math.min(4, Math.floor(rows/2)));
  for (let b = 0; b < numBays; b++) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0 && rows >= 3) {
      const w = 2 + Math.floor(Math.random() * (cols - 3)), c1 = 1 + Math.floor(Math.random() * (cols - w - 1)), depth = 1 + Math.floor(Math.random() * (rows - 2));
      for (let c = c1; c < c1 + w; c++) hSet.delete(`0,${c}`);
      for (let c = c1; c < c1 + w; c++) hSet.add(`${depth},${c}`);
      for (let r = 0; r < depth; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
    } else if (side === 2 && rows >= 3) {
      const w = 2 + Math.floor(Math.random() * (cols - 3)), c1 = 1 + Math.floor(Math.random() * (cols - w - 1)), depth = 1 + Math.floor(Math.random() * (rows - 2));
      for (let c = c1; c < c1 + w; c++) hSet.delete(`${rows},${c}`);
      for (let c = c1; c < c1 + w; c++) hSet.add(`${rows-depth},${c}`);
      for (let r = rows - depth; r < rows; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
    } else if (side === 3 && cols >= 3) {
      const h = 2 + Math.floor(Math.random() * (rows - 3)), r1 = 1 + Math.floor(Math.random() * (rows - h - 1)), depth = 1 + Math.floor(Math.random() * (cols - 2));
      for (let r = r1; r < r1 + h; r++) vSet.delete(`${r},0`);
      for (let r = r1; r < r1 + h; r++) vSet.add(`${r},${depth}`);
      for (let c = 0; c < depth; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
    } else if (side === 1 && cols >= 3) {
      const h = 2 + Math.floor(Math.random() * (rows - 3)), r1 = 1 + Math.floor(Math.random() * (rows - h - 1)), depth = 1 + Math.floor(Math.random() * (cols - 2));
      for (let r = r1; r < r1 + h; r++) vSet.delete(`${r},${cols}`);
      for (let r = r1; r < r1 + h; r++) vSet.add(`${r},${cols-depth}`);
      for (let c = cols - depth; c < cols; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
    }
  }
  return { hSet, vSet };
}

function verifyLoop(hSet, vSet, rows, cols) {
  const deg = Array.from({length: rows+1}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r][c+1]++; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r+1][c]++; }
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) if (deg[r][c] > 0 && deg[r][c] !== 2) return false;
  let first = null; for (const k of hSet) { first = k; break; } if (!first) for (const k of vSet) { first = k; break; }
  if (!first) return false;
  const [fr, fc] = first.split(',').map(Number);
  const visited = new Set([`${fr},${fc}`]), queue = [[fr, fc]];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [nr, nc, t] of [[r,c+1,'h'],[r,c-1,'h'],[r+1,c,'v'],[r-1,c,'v']]) {
      if (nr<0||nr>rows||nc<0||nc>cols) continue;
      const key = `${nr},${nc}`; if (visited.has(key)) continue;
      const has = t === 'h' ? hSet.has(`${r},${Math.min(c,nc)}`) : vSet.has(`${Math.min(r,nr)},${c}`);
      if (has) { visited.add(key); queue.push([nr, nc]); }
    }
  }
  const allDots = new Set();
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); allDots.add(`${r},${c}`); allDots.add(`${r},${c+1}`); }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); allDots.add(`${r},${c}`); allDots.add(`${r+1},${c}`); }
  return visited.size === allDots.size;
}

function edgesToHintsAnswer(hSet, vSet, rows, cols) {
  const hints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (hSet.has(`${r},${c}`)) count++; if (hSet.has(`${r+1},${c}`)) count++;
      if (vSet.has(`${r},${c}`)) count++; if (vSet.has(`${r},${c+1}`)) count++;
      row.push(count);
    }
    hints.push(row);
  }
  const ah = Array.from({length: rows+1}, ()=>Array(cols).fill(0)), av = Array.from({length: rows}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); ah[r][c]=1; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); av[r][c]=1; }
  return { hints, answer: {h: ah, v: av} };
}

function generateOneHard(id) {
  for (let i = 0; i < 500; i++) {
    const { hSet, vSet } = buildLoopRect(10, 10);
    if (!verifyLoop(hSet, vSet, 10, 10)) continue;
    const { hints, answer } = edgesToHintsAnswer(hSet, vSet, 10, 10);
    const ratio = hints.flat().filter(h => h > 0).length / 100;
    if (ratio < 0.15 || ratio > 0.92) continue;
    const r = solve(hints); if (!r) continue;
    return { id, size: 10, grid: hints, answer: r, seed: Math.floor(Math.random()*999999) };
  }
  return null;
}

const existing = fs.readdirSync(hardDir).filter(f=>f.match(/^\w+-\d{4}\.json$/)).length;
console.log('Existing hard puzzles:', existing, '/ target: 30');
let results = existing;
const start = Date.now();
while (results < 30) {
  const p = generateOneHard(results + 1);
  if (p) {
    results++;
    fs.writeFileSync(path.join(hardDir, `hard-${String(p.id).padStart(4,'0')}.json`), JSON.stringify(p));
  }
}
console.log(`\nHard: ${results}/30 done in ${((Date.now()-start)/1000).toFixed(1)}s`);
fs.writeFileSync(path.join(hardDir, 'index.json'), JSON.stringify({total: results, difficulty: 'hard', gridSize: '10x10', generatedAt: new Date().toISOString(), version: 'generator-v4'}, null, 2));

// Final verification
console.log('\n=== Final Verification ===');
const { execSync } = require('child_process');
// Run verify script inline
const allFiles = [];
for (const d of ['easy', 'medium', 'hard']) {
  const dir2 = path.join(__dirname, d);
  if (!fs.existsSync(dir2)) continue;
  for (const f of fs.readdirSync(dir2).filter(f=>f.match(/^\w+-\d{4}\.json$/))) {
    const p = JSON.parse(fs.readFileSync(path.join(dir2, f), 'utf8'));
    const r = solve(p.grid);
    if (!r || !isSingleLoop(r.h, r.v, p.size, p.size)) {
      allFiles.push(`${d}/${f}: solver=${!!r} loop=${r ? isSingleLoop(r.h,r.v,p.size,p.size) : false}`);
    }
  }
}
if (allFiles.length === 0) {
  console.log('ALL PUZZLES VALID ✓');
} else {
  console.log('Invalid puzzles:', allFiles.join('\n'));
}
