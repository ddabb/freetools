/**
 * Quick Slither Link Generator v3
 * DFS loop → derive hints → solver verify solvable (skip uniqueness for speed)
 */
const fs = require('fs');
const path = require('path');
const solverCode = fs.readFileSync(path.join(__dirname, 'slitherlink-solver.js'), 'utf8');
eval(solverCode);

const BASE_DIR = __dirname;
const CONFIGS = {
  easy:   { rows: 5,  cols: 5,  count: 50,  dfsMax: 200 },
  medium: { rows: 7,  cols: 7,  count: 50,  dfsMax: 300 },
  hard:   { rows: 10, cols: 10, count: 30, dfsMax: 200 }
};

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

function generateDFSLoop(rows, cols, maxAttempts) {
  const totalDots = (rows+1)*(cols+1);
  const minLen = Math.floor(totalDots*0.18);
  const maxLen = Math.floor(totalDots*0.9);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const visited = Array.from({length: rows+1}, () => Array(cols+1).fill(false));
    const pathArr = [];
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    
    const startR = Math.floor(Math.random()*(rows+1));
    const startC = Math.floor(Math.random()*(cols+1));
    
    const dfs = (r, c, depth) => {
      if (depth > maxLen) return false;
      visited[r][c] = true;
      pathArr.push([r, c]);
      if (depth >= minLen) {
        for (const [dr,dc] of dirs) {
          if (r+dr===startR && c+dc===startC) { pathArr.pop(); visited[r][c]=false; return true; }
        }
      }
      for (const [dr,dc] of dirs.slice().sort(()=>Math.random()-0.5)) {
        const nr=r+dr, nc=c+dc;
        if (nr<0||nr>rows||nc<0||nc>cols||visited[nr][nc]) continue;
        if (dfs(nr, nc, depth+1)) return true;
      }
      pathArr.pop();
      visited[r][c] = false;
      return false;
    };
    
    if (dfs(startR, startC, 0)) {
      const hSet = new Set(), vSet = new Set();
      for (let i = 0; i < pathArr.length; i++) {
        const [r1,c1] = pathArr[i];
        const [r2,c2] = pathArr[(i+1)%pathArr.length];
        if (r1===r2) hSet.add(`${r1},${Math.min(c1,c2)}`);
        else vSet.add(`${Math.min(r1,r2)},${c1}`);
      }
      return { hSet, vSet };
    }
  }
  return null;
}

function generateOne(rows, cols, id, cfg) {
  const deadline = Date.now() + 5000;
  for (let i = 0; i < 500; i++) {
    if (Date.now() > deadline) return null;
    const loop = generateDFSLoop(rows, cols, cfg.dfsMax);
    if (!loop) continue;
    const { hints, answer } = edgesToHintsAnswer(loop.hSet, loop.vSet, rows, cols);
    
    const nonZero = hints.flat().filter(h => h > 0).length;
    const ratio = nonZero / (rows * cols);
    if (ratio < 0.15 || ratio > 0.92) continue;
    
    // Verify solvable (fast, just check if solution exists)
    const result = solve(hints);
    if (!result) continue;
    
    return { id, size: rows, grid: hints, answer: result, seed: Math.floor(Math.random()*999999) };
  }
  return null;
}

const target = process.argv[2] || 'medium';
const diffs = Object.entries(CONFIGS).filter(([d]) => target==='all' || d===target);

let grandTotal = 0;
for (const [diff, cfg] of diffs) {
  const dir = path.join(BASE_DIR, diff);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const existing = fs.readdirSync(dir).filter(f => f.match(/^\w+-\d{4}\.json$/));
  console.log(`\n=== ${diff.toUpperCase()} ${cfg.rows}x${cfg.cols} (existing:${existing.length} target:${cfg.count}) ===`);
  
  // Don't delete existing unless we need to replace
  let results = existing.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  
  const start = Date.now();
  let attempts = 0;
  
  while (results.length < cfg.count && attempts < cfg.count * 30) {
    attempts++;
    if (attempts % 10 === 0) process.stdout.write(`\r  ${results.length}/${cfg.count} (${attempts} attempts)...`);
    const p = generateOne(cfg.rows, cfg.cols, results.length + 1, cfg);
    if (p) {
      results.push(p);
      fs.writeFileSync(path.join(dir, `${diff}-${String(p.id).padStart(4,'0')}.json`), JSON.stringify(p));
    }
  }
  
  // Trim to target count
  if (results.length > cfg.count) results = results.slice(0, cfg.count);
  
  const elapsed = ((Date.now()-start)/1000).toFixed(1);
  console.log(`\n  Done: ${results.length}/${cfg.count} in ${elapsed}s`);
  grandTotal += results.length;
  
  // Rewrite index
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({
    total: results.length, difficulty: diff, gridSize: `${cfg.rows}x${cfg.cols}`,
    generatedAt: new Date().toISOString(), version: 'generator-v3'
  }, null, 2));
}

fs.writeFileSync(path.join(BASE_DIR, 'index.json'), JSON.stringify({
  total: grandTotal, generatedAt: new Date().toISOString(), version: 'generator-v3'
}, null, 2));

console.log('\nAll done! Total:', grandTotal);
