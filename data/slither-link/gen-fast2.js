const fs = require('fs'), path = require('path');
const solverCode = fs.readFileSync('slitherlink-solver.js', 'utf8'); eval(solverCode);

function verifyLoopEdges(hSet, vSet, rows, cols) {
  const deg = Array.from({length: rows+1}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r][c+1]++; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r+1][c]++; }
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) if (deg[r][c]>0 && deg[r][c]!==2) return false;
  let first = null;
  for (let r = 0; r <= rows && !first; r++) for (let c = 0; c <= cols && !first; c++) if (deg[r][c]===2) first = [r,c];
  if (!first) return false;
  const visited = new Set([first[0]+','+first[1]]), queue = [first];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of [[r,c+1],[r,c-1],[r+1,c],[r-1,c]]) {
      if (nr<0||nr>rows||nc<0||nc>cols) continue;
      const key = nr+','+nc; if (visited.has(key)) continue;
      const has = (nr===r && hSet.has(`${r},${Math.min(c,nc)}`) && deg[nr][nc]>0) ||
                  (nc===c && vSet.has(`${Math.min(r,nr)},${c}`) && deg[nr][nc]>0);
      if (has) { visited.add(key); queue.push([nr, nc]); }
    }
  }
  let total = 0; for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) if (deg[r][c]>0) total++;
  return visited.size === total;
}

function addDetour(hSet, vSet, rows, cols, side) {
  if (side === 0 && rows >= 3) {
    const w = 2+Math.floor(Math.random()*(cols-3)), c1 = 1+Math.floor(Math.random()*(cols-w-1)), depth = 1+Math.floor(Math.random()*(rows-2));
    for (let c = c1; c < c1+w; c++) hSet.delete(`0,${c}`);
    for (let c = c1; c < c1+w; c++) hSet.add(`${depth},${c}`);
    for (let r = 0; r < depth; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
  } else if (side === 2 && rows >= 3) {
    const w = 2+Math.floor(Math.random()*(cols-3)), c1 = 1+Math.floor(Math.random()*(cols-w-1)), depth = 1+Math.floor(Math.random()*(rows-2));
    for (let c = c1; c < c1+w; c++) hSet.delete(`${rows},${c}`);
    for (let c = c1; c < c1+w; c++) hSet.add(`${rows-depth},${c}`);
    for (let r = rows-depth; r < rows; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
  } else if (side === 3 && cols >= 3) {
    const h = 2+Math.floor(Math.random()*(rows-3)), r1 = 1+Math.floor(Math.random()*(rows-h-1)), depth = 1+Math.floor(Math.random()*(cols-2));
    for (let r = r1; r < r1+h; r++) vSet.delete(`${r},0`);
    for (let r = r1; r < r1+h; r++) vSet.add(`${r},${depth}`);
    for (let c = 0; c < depth; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
  } else if (side === 1 && cols >= 3) {
    const h = 2+Math.floor(Math.random()*(rows-3)), r1 = 1+Math.floor(Math.random()*(rows-h-1)), depth = 1+Math.floor(Math.random()*(cols-2));
    for (let r = r1; r < r1+h; r++) vSet.delete(`${r},${cols}`);
    for (let r = r1; r < r1+h; r++) vSet.add(`${r},${cols-depth}`);
    for (let c = cols-depth; c < cols; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h},${c}`); }
  }
}

function makeLoop(rows, cols) {
  const hSet = new Set(), vSet = new Set();
  for (let c = 0; c < cols; c++) { hSet.add(`0,${c}`); hSet.add(`${rows},${c}`); }
  for (let r = 0; r < rows; r++) { vSet.add(`${r},0`); vSet.add(`${r},${cols}`); }
  const n = 2 + Math.floor(Math.random() * Math.min(8, Math.floor(rows * cols / 3)));
  for (let i = 0; i < n; i++) addDetour(hSet, vSet, rows, cols, Math.floor(Math.random() * 4));
  if (!verifyLoopEdges(hSet, vSet, rows, cols)) return null;
  return { hSet, vSet };
}

function toHints(hSet, vSet, rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let n = 0;
      if (hSet.has(`${r},${c}`)) n++;
      if (hSet.has(`${r+1},${c}`)) n++;
      if (vSet.has(`${r},${c}`)) n++;
      if (vSet.has(`${r},${c+1}`)) n++;
      row.push(n);
    }
    grid.push(row);
  }
  return grid;
}

function toAns(hSet, vSet, rows, cols) {
  const ah = Array.from({length: rows+1}, ()=>Array(cols).fill(0));
  const av = Array.from({length: rows}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); ah[r][c]=1; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); av[r][c]=1; }
  return { h: ah, v: av };
}

function genOne(size, id) {
  const maxA = 300;
  for (let a = 0; a < maxA; a++) {
    const loop = makeLoop(size, size); if (!loop) continue;
    const { hSet, vSet } = loop;
    const grid = toHints(hSet, vSet, size, size);
    const nz = grid.flat().filter(h => h > 0).length;
    if (nz < 1 || nz > size * size) continue;
    const ans = toAns(hSet, vSet, size, size);
    const r = solve(grid); if (!r) continue;
    if (!isSingleLoop(r.h, r.v, size, size)) continue;
    return { id, size, grid, answer: r, seed: Math.floor(Math.random() * 999999) };
  }
  return null;
}

function genBatch(size, count, prefix, dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir).filter(f=>f.match(/^\w+-\d{4}\.json$/))) fs.unlinkSync(path.join(dir, f));
  const results = []; const t0 = Date.now();
  for (let i = 0; i < count; i++) {
    process.stdout.write(`\r${prefix}: ${i+1}/${count} (${results.length} ok)`);
    const p = genOne(size, i+1);
    if (p) {
      results.push(p);
      fs.writeFileSync(path.join(dir, `${prefix}-${String(p.id).padStart(4,'0')}.json`), JSON.stringify(p));
    }
  }
  console.log('');
  let ok = 0;
  for (const p of results) { const r = solve(p.grid); if (r && isSingleLoop(r.h, r.v, size, size)) ok++; }
  console.log(`${prefix}: ${results.length}/${count} valid=${ok} in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({total: results.length, difficulty: prefix, gridSize: size+'x'+size, generatedAt: new Date().toISOString(), version: 'detour-v2'}));
}

const size = parseInt(process.argv[2]) || 5;
const count = parseInt(process.argv[3]) || 50;
const prefix = process.argv[4] || 'test';
const dir = process.argv[5] || prefix;

genBatch(size, count, prefix, dir);
console.log('Done!');
