/**
 * Fast Slither Link Puzzle Generator v5
 * Optimized: DFS limited attempts for larger grids, more bay variations
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname);
const CONFIGS = {
  easy:   { rows: 5, cols: 5, count: 200, dfsAttempts: 50 },
  medium: { rows: 7, cols: 7, count: 100, dfsAttempts: 0 },
  hard:   { rows: 10, cols: 10, count: 50, dfsAttempts: 0 }
};

function generateLoopDFS(rows, cols) {
  const visited = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(false));
  const pathArr = [];
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const borderDots = [];
  for (let c = 0; c <= cols; c++) { borderDots.push([0, c]); if (rows > 0) borderDots.push([rows, c]); }
  for (let r = 1; r < rows; r++) { borderDots.push([r, 0]); borderDots.push([r, cols]); }
  const start = borderDots[Math.floor(Math.random() * borderDots.length)];
  // Max loop length for this grid: cover 40-70% of dots
  const totalDots = (rows + 1) * (cols + 1);
  const maxLen = Math.floor(totalDots * 0.75);
  const minLen = Math.floor(totalDots * 0.2);

  function dfs(r, c, depth) {
    if (depth > maxLen) return false;
    visited[r][c] = true;
    pathArr.push([r, c]);
    if (depth >= minLen) {
      for (const [dr, dc] of dirs) {
        if (r + dr === start[0] && c + dc === start[1]) return true;
      }
    }
    const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
    for (const [dr, dc] of shuffled) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr > rows || nc < 0 || nc > cols) continue;
      if (visited[nr][nc]) continue;
      if (dfs(nr, nc, depth + 1)) return true;
    }
    pathArr.pop();
    visited[r][c] = false;
    return false;
  }
  return dfs(start[0], start[1], 0) ? pathArr : null;
}

function generateLoopWithBays(rows, cols) {
  const hEdges = new Set(), vEdges = new Set();
  for (let c = 0; c < cols; c++) { hEdges.add(`0,${c}`); hEdges.add(`${rows},${c}`); }
  for (let r = 0; r < rows; r++) { vEdges.add(`${r},0`); vEdges.add(`${r},${cols}`); }
  const numBays = 1 + Math.floor(Math.random() * 4);
  for (let b = 0; b < numBays; b++) {
    const side = Math.floor(Math.random() * 4);
    const maxD = Math.min(3, Math.floor(Math.min(rows, cols) / 2));
    const depth = 1 + Math.floor(Math.random() * maxD);
    if (side === 0 && cols > 3) {
      const c1 = 1 + Math.floor(Math.random() * (cols - 3));
      const c2 = Math.min(c1 + 2 + Math.floor(Math.random() * 3), cols - 1);
      for (let c = c1; c < c2; c++) hEdges.delete(`0,${c}`);
      for (let c = c1; c < c2; c++) hEdges.add(`${depth},${c}`);
      for (let r = 0; r < depth; r++) { vEdges.add(`${r},${c1}`); vEdges.add(`${r},${c2}`); }
    } else if (side === 2 && cols > 3) {
      const c1 = 1 + Math.floor(Math.random() * (cols - 3));
      const c2 = Math.min(c1 + 2 + Math.floor(Math.random() * 3), cols - 1);
      for (let c = c1; c < c2; c++) hEdges.delete(`${rows},${c}`);
      for (let c = c1; c < c2; c++) hEdges.add(`${rows - depth},${c}`);
      for (let r = rows - depth; r < rows; r++) { vEdges.add(`${r},${c1}`); vEdges.add(`${r},${c2}`); }
    } else if (side === 3 && rows > 3) {
      const r1 = 1 + Math.floor(Math.random() * (rows - 3));
      const r2 = Math.min(r1 + 2 + Math.floor(Math.random() * 3), rows - 1);
      for (let r = r1; r < r2; r++) vEdges.delete(`${r},0`);
      for (let r = r1; r < r2; r++) vEdges.add(`${r},${depth}`);
      for (let c = 0; c < depth; c++) { hEdges.add(`${r1},${c}`); hEdges.add(`${r2},${c}`); }
    } else if (side === 1 && rows > 3) {
      const r1 = 1 + Math.floor(Math.random() * (rows - 3));
      const r2 = Math.min(r1 + 2 + Math.floor(Math.random() * 3), rows - 1);
      for (let r = r1; r < r2; r++) vEdges.delete(`${r},${cols}`);
      for (let r = r1; r < r2; r++) vEdges.add(`${r},${cols - depth}`);
      for (let c = cols - depth; c < cols; c++) { hEdges.add(`${r1},${c}`); hEdges.add(`${r2},${c}`); }
    }
  }
  return { hEdgeSet: hEdges, vEdgeSet: vEdges };
}

function loopPathToEdges(pathArr) {
  const hEdges = new Set(), vEdges = new Set();
  for (let i = 0; i < pathArr.length; i++) {
    const [r1, c1] = pathArr[i];
    const [r2, c2] = pathArr[(i + 1) % pathArr.length];
    if (r1 === r2) hEdges.add(`${r1},${Math.min(c1, c2)}`);
    else vEdges.add(`${Math.min(r1, r2)},${c1}`);
  }
  return { hEdgeSet: hEdges, vEdgeSet: vEdges };
}

function edgesToHintsAndAnswer(hEdgeSet, vEdgeSet, rows, cols) {
  const hints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (hEdgeSet.has(`${r},${c}`)) count++;
      if (hEdgeSet.has(`${r+1},${c}`)) count++;
      if (vEdgeSet.has(`${r},${c}`)) count++;
      if (vEdgeSet.has(`${r},${c+1}`)) count++;
      row.push(count);
    }
    hints.push(row);
  }
  const ah = [], av = [];
  for (let r = 0; r <= rows; r++) {
    ah.push([]);
    for (let c = 0; c < cols; c++) ah[r].push(hEdgeSet.has(`${r},${c}`) ? 1 : 0);
  }
  for (let r = 0; r < rows; r++) {
    av.push([]);
    for (let c = 0; c <= cols; c++) av[r].push(vEdgeSet.has(`${r},${c}`) ? 1 : 0);
  }
  return { hints, answer: { h: ah, v: av } };
}

function generateOne(rows, cols, id, dfsAttempts) {
  for (let attempt = 0; attempt < 100; attempt++) {
    let edgeData;
    if (attempt < dfsAttempts) {
      const loopPath = generateLoopDFS(rows, cols);
      if (loopPath && loopPath.length >= 6) edgeData = loopPathToEdges(loopPath);
    }
    if (!edgeData) edgeData = generateLoopWithBays(rows, cols);
    const { hints, answer } = edgesToHintsAndAnswer(edgeData.hEdgeSet, edgeData.vEdgeSet, rows, cols);
    const nonZero = hints.flat().filter(h => h > 0).length;
    const ratio = nonZero / (rows * cols);
    if (ratio < 0.2 || ratio > 0.9) continue;
    return { id, size: rows, grid: hints, answer, seed: Math.floor(Math.random() * 999999) };
  }
  return null;
}

// ====== MAIN ======
const targetDiff = process.argv[2] || 'all';
const targetCount = parseInt(process.argv[3]) || 0;
const diffs = targetDiff === 'all'
  ? Object.entries(CONFIGS)
  : [[targetDiff, { ...CONFIGS[targetDiff], count: targetCount || CONFIGS[targetDiff].count }]];

let totalGenerated = 0;
const summary = {};

for (const [difficulty, cfg] of diffs) {
  const dir = path.join(BASE_DIR, difficulty);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const old = fs.readdirSync(dir).filter(f => f.match(/^\w+-\d{4}\.json$/));
  for (const f of old) fs.unlinkSync(path.join(dir, f));

  console.log(`\n=== ${difficulty.toUpperCase()} (${cfg.rows}x${cfg.cols}, target: ${cfg.count}) ===`);
  const results = [];
  const start = Date.now();
  let fails = 0;
  const progressInterval = Math.max(10, Math.floor(cfg.count / 10));

  for (let i = 0; results.length < cfg.count && i < cfg.count * 5; i++) {
    const p = generateOne(cfg.rows, cfg.cols, results.length + 1, cfg.dfsAttempts);
    if (p) {
      results.push(p);
      if (results.length % progressInterval === 0) {
        console.log(`  ${results.length}/${cfg.count} (${((Date.now()-start)/1000).toFixed(1)}s)`);
      }
    } else { fails++; }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  Done: ${results.length}/${cfg.count} in ${elapsed}s (${fails} failures)`);
  totalGenerated += results.length;
  summary[difficulty] = results.length;

  for (const p of results) {
    fs.writeFileSync(path.join(dir, `${difficulty}-${String(p.id).padStart(4, '0')}.json`), JSON.stringify(p));
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({
    total: results.length, difficulty, gridSize: `${cfg.rows}x${cfg.cols}`,
    generatedAt: new Date().toISOString(), version: 'fast-v5'
  }, null, 2));
}

const rootFiles = fs.readdirSync(BASE_DIR).filter(f => f.match(/^(easy|medium|hard)-\d{4}\.json$/));
if (rootFiles.length > 0) {
  console.log(`\nCleaning ${rootFiles.length} stale root-level files...`);
  for (const f of rootFiles) fs.unlinkSync(path.join(BASE_DIR, f));
}

fs.writeFileSync(path.join(BASE_DIR, 'index.json'), JSON.stringify({
  total: totalGenerated, difficulties: summary,
  generatedAt: new Date().toISOString(), version: 'fast-v5'
}, null, 2));

console.log(`\nTotal: ${totalGenerated} puzzles`);
console.log('All done!');
