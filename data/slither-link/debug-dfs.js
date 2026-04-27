const fs = require('fs');
const solverCode = fs.readFileSync('slitherlink-solver.js', 'utf8');
eval(solverCode);

// Debug DFS loop generation success rate
function generateDFSLoop(rows, cols, maxAttempts) {
  const totalDots = (rows+1)*(cols+1);
  const minLen = Math.floor(totalDots*0.18);
  const maxLen = Math.floor(totalDots*0.9);
  let success = 0, fail = 0;
  
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
      // Verify it's a single loop
      const hSet = new Set(), vSet = new Set();
      for (let i = 0; i < pathArr.length; i++) {
        const [r1,c1] = pathArr[i];
        const [r2,c2] = pathArr[(i+1)%pathArr.length];
        if (r1===r2) hSet.add(`${r1},${Math.min(c1,c2)}`);
        else vSet.add(`${Math.min(r1,r2)},${c1}`);
      }
      // Check all dots degree 2
      const deg = Array.from({length: rows+1}, ()=>Array(cols+1).fill(0));
      for (const k of hSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r][c+1]++; }
      for (const k of vSet) { const [r,c]=k.split(',').map(Number); deg[r][c]++; deg[r+1][c]++; }
      let valid = true;
      for (let r=0; r<=rows && valid; r++) for (let c=0; c<=cols && valid; c++) 
        if (deg[r][c] > 0 && deg[r][c] !== 2) valid = false;
      if (valid) success++; else fail++;
    } else { fail++; }
  }
  return { success, fail, rate: (success/maxAttempts*100).toFixed(1)+'%' };
}

// Test different sizes
for (const size of [5, 7, 10]) {
  const result = generateDFSLoop(size, size, 100);
  console.log(`${size}x${size}: success=${result.success}, fail=${result.fail}, rate=${result.rate}`);
}

// Try with 7x7 more attempts
console.log('\n7x7 with 500 attempts:');
const r7 = generateDFSLoop(7, 7, 500);
console.log(`success=${r7.success}, fail=${r7.fail}, rate=${r7.rate}`);
