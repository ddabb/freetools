/**
 * Reliable Slither Link Generator v2
 * DFS loop generation + solver uniqueness verification
 */
const fs = require('fs');
const path = require('path');

const solverCode = fs.readFileSync(path.join(__dirname, 'slitherlink-solver.js'), 'utf8');
eval(solverCode);

const BASE_DIR = __dirname;
const CONFIGS = {
  easy:   { rows: 5,  cols: 5,  count: 50,  dfsAttempts: 100 },
  medium: { rows: 7,  cols: 7,  count: 50,  dfsAttempts: 150 },
  hard:   { rows: 10, cols: 10, count: 30, dfsAttempts: 80  }
};

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
  const ah = Array.from({ length: rows + 1 }, () => Array(cols).fill(0));
  const av = Array.from({ length: rows }, () => Array(cols + 1).fill(0));
  for (const k of hEdgeSet) { const [r, c] = k.split(',').map(Number); ah[r][c] = 1; }
  for (const k of vEdgeSet) { const [r, c] = k.split(',').map(Number); av[r][c] = 1; }
  return { hints, answer: { h: ah, v: av } };
}

function generateDFSLoop(rows, cols, maxAttempts) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const visited = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(false));
    const pathArr = [];
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const totalDots = (rows + 1) * (cols + 1);
    const minLen = Math.floor(totalDots * 0.2);
    const maxLen = Math.floor(totalDots * 0.9);

    const startR = Math.floor(Math.random() * (rows + 1));
    const startC = Math.floor(Math.random() * (cols + 1));

    function dfs(r, c, depth) {
      if (depth > maxLen) return false;
      visited[r][c] = true;
      pathArr.push([r, c]);
      if (depth >= minLen) {
        for (const [dr, dc] of dirs) {
          if (r + dr === startR && c + dc === startC) {
            pathArr.pop();
            visited[r][c] = false;
            return true;
          }
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

    if (dfs(startR, startC, 0)) {
      // Build edge sets
      const hEdges = new Set(), vEdges = new Set();
      for (let i = 0; i < pathArr.length; i++) {
        const [r1, c1] = pathArr[i];
        const [r2, c2] = pathArr[(i + 1) % pathArr.length];
        if (r1 === r2) hEdges.add(`${Math.min(r1, r2)},${Math.min(c1, c2)}`);
        else vEdges.add(`${Math.min(r1, r2)},${Math.min(c1, c2)}`);
      }
      return { hEdgeSet: hEdges, vEdgeSet: vEdges };
    }
  }
  return null;
}

function generateOne(rows, cols, id, cfg) {
  const deadline = Date.now() + 8000; // 8s timeout per puzzle
  for (let i = 0; i < 500; i++) {
    if (Date.now() > deadline) return null;
    const edgeData = generateDFSLoop(rows, cols, cfg.dfsAttempts);
    if (!edgeData) continue;
    const { hints, answer } = edgesToHintsAndAnswer(edgeData.hEdgeSet, edgeData.vEdgeSet, rows, cols);

    const nonZero = hints.flat().filter(h => h > 0).length;
    const ratio = nonZero / (rows * cols);
    if (ratio < 0.2 || ratio > 0.9) continue;

    const result = checkUnique(hints, 2);
    if (!result.unique || !result.solution) continue;

    return {
      id,
      size: rows,
      grid: hints,
      answer: result.solution,
      seed: Math.floor(Math.random() * 999999)
    };
  }
  return null;
}

// ====== MAIN ======
const target = process.argv[2] || 'all';
const diffs = Object.entries(CONFIGS).filter(([d]) => target === 'all' || d === target);

let grandTotal = 0;
for (const [diff, cfg] of diffs) {
  const dir = path.join(BASE_DIR, diff);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const f of fs.readdirSync(dir).filter(f => f.match(/^\w+-\d{4}\.json$/))) {
    fs.unlinkSync(path.join(dir, f));
  }

  console.log(`\n=== ${diff.toUpperCase()} (${cfg.rows}x${cfg.cols}) target:${cfg.count} ===`);
  const results = [];
  const start = Date.now();
  let attempts = 0;

  while (results.length < cfg.count && attempts < cfg.count * 20) {
    attempts++;
    if (attempts % 5 === 0) process.stdout.write(`\r  progress: ${results.length}/${cfg.count} (${attempts} attempts)... `);
    const p = generateOne(cfg.rows, cfg.cols, results.length + 1, cfg);
    if (p) {
      results.push(p);
      fs.writeFileSync(path.join(dir, `${diff}-${String(p.id).padStart(4, '0')}.json`), JSON.stringify(p));
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n  Done: ${results.length}/${cfg.count} in ${elapsed}s (${attempts} attempts)`);
  grandTotal += results.length;

  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({
    total: results.length, difficulty: diff, gridSize: `${cfg.rows}x${cfg.cols}`,
    generatedAt: new Date().toISOString(), version: 'generator-v2'
  }, null, 2));
}

fs.writeFileSync(path.join(BASE_DIR, 'index.json'), JSON.stringify({
  total: grandTotal, generatedAt: new Date().toISOString(), version: 'generator-v2'
}, null, 2));

console.log('\nAll done! Total:', grandTotal);
