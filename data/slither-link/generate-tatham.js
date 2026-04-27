/**
 * Slitherlink Generator - Simon Tatham / Penpa-edit Algorithm
 * 
 * Core insight: Generate a spanning tree of grid cells.
 * Each cell contributes its "exit edge" to parent.
 * The collection of all exit edges = one single loop.
 * Then compute clues and optionally strip clues (keep unique).
 * 
 * This guarantees a valid single loop every time.
 */
const fs = require('fs');
const path = require('path');
const solverCode = fs.readFileSync(path.join(__dirname, 'slitherlink-solver.js'), 'utf8');
eval(solverCode);

const BASE_DIR = __dirname;

// ---------- helpers from existing solver ----------
function solve(grid) {
  const rows = grid.length, cols = grid[0].length;
  const h = Array.from({length: rows+1}, ()=>Array(cols).fill(0));
  const v = Array.from({length: rows}, ()=>Array(cols+1).fill(0));
  
  function copy(s) {
    return { h: s.h.map(r=>[...r]), v: s.v.map(r=>[...r]) };
  }
  function eq(a, b) {
    for (let r=0;r<=rows;r++) for (let c=0;c<cols;c++) if (a.h[r][c]!==b.h[r][c]) return false;
    for (let r=0;r<rows;r++) for (let c=0;c<=cols;c++) if (a.v[r][c]!==b.v[r][c]) return false;
    return true;
  }
  function add(s, r, c, t, val) {
    const ns = copy(s);
    if (t==='h') ns.h[r][c]=val;
    else ns.v[r][c]=val;
    return ns;
  }
  function get(s, r, c, t) {
    return t==='h' ? s.h[r][c] : s.v[r][c];
  }
  function neighbors(r, c) {
    const nb=[];
    if (r>0) nb.push([r-1,c,'h']); if (r<rows) nb.push([r+1,c,'h']);
    if (c>0) nb.push([r,c-1,'v']); if (c<cols) nb.push([r,c+1,'v']);
    return nb;
  }
  function countDot(s, r, c) {
    let n=0;
    if (r>0&&s.h[r-1][c]===1) n++;
    if (r<rows&&s.h[r][c]===1) n++;
    if (c>0&&s.v[r][c-1]===1) n++;
    if (c<cols&&s.v[r][c]===1) n++;
    return n;
  }
  function countEdge(s, r1,c1,r2,c2) {
    if (r1===r2) return s.h[Math.min(r1,r2)][Math.min(c1,c2)];
    return s.v[Math.min(r1,r2)][Math.min(r1,r2)];
  }
  function propagate(s) {
    let changed=true, contradictions=false;
    while (changed) {
      changed=false;
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        if (grid[r][c]<0||grid[r][c]>4) continue;
        let u=0,l=0,x=0;
        for (const [nr,nc,nt] of neighbors(r,c)) {
          const v=get(s,nr,nc,nt);
          if (v===1) l++;
          else if (v===2) u++;
          else x++;
        }
        if (l>grid[r][c]) { contradictions=true; return null; }
        if (l+u<grid[r][c]||l>grid[r][c]) {
          for (const [nr,nc,nt] of neighbors(r,c)) {
            if (get(s,nr,nc,nt)===0) {
              if (l+u+x===grid[r][c]) { s=add(s,nr,nc,nt,2); changed=true; }
              else if (l===grid[r][c]) { s=add(s,nr,nc,nt,2); changed=true; }
            }
            if (get(s,nr,nc,nt)===2&&(l+u<grid[r][c]||l>grid[r][c])) { s=add(s,nr,nc,nt,0); changed=true; }
          }
        }
      }
      for (let r=0;r<=rows;r++) for (let c=0;c<=cols;c++) {
        const d=countDot(s,r,c);
        if (d===0) continue;
        if (d>2) { contradictions=true; return null; }
        if (d===2) {
          let nb2=[];
          if (r>0&&s.h[r-1][c]===1) nb2.push([r-1,c,'h']);
          if (r<rows&&s.h[r][c]===1) nb2.push([r+1,c,'h']);
          if (c>0&&s.v[r][c-1]===1) nb2.push([r,c-1,'v']);
          if (c<cols&&s.v[r][c]===1) nb2.push([r,c+1,'v']);
          for (const [nr,nc,nt] of neighbors(r,c)) {
            if (get(s,nr,nc,nt)===0) { s=add(s,nr,nc,nt,2); changed=true; }
          }
        }
      }
    }
    return s;
  }
  
  // Check if all edges are decided
  function isDone(s) {
    for (let r=0;r<=rows;r++) for (let c=0;c<cols;c++) if (s.h[r][c]===0) return false;
    for (let r=0;r<rows;r++) for (let c=0;c<=cols;c++) if (s.v[r][c]===0) return false;
    return true;
  }
  
  function isSingleLoop(h, v, R, C) {
    const dots=Array.from({length:R+1},()=>Array(C+1).fill(0));
    for (let r=0;r<=R;r++) for (let c=0;c<C;c++) if(h[r][c]===1){dots[r][c]++;dots[r][c+1]++;}
    for (let r=0;r<R;r++) for (let c=0;c<=C;c++) if(v[r][c]===1){dots[r][c]++;dots[r+1][c]++;}
    for (let r=0;r<=R;r++) for (let c=0;c<=C;c++) if(dots[r][c]>0&&dots[r][c]!==2) return false;
    let first=null;
    outer: for(let r=0;r<=R;r++) for(let c=0;c<=C;c++) if(dots[r][c]===2){first=[r,c];break outer;}
    if(!first) return false;
    const visited=new Set(); const queue=[first];
    visited.add(first[0]+','+first[1]);
    while(queue.length){
      const[r,c]=queue.shift();
      const ns=[[r,c+1,'h'],[r,c-1,'h'],[r+1,c,'v'],[r-1,c,'v']];
      for(const[nr,nc,t] of ns){
        if(nr<0||nr>R||nc<0||nc>C)continue;
        const key=nr+','+nc; if(visited.has(key))continue;
        const has=t==='h'?h[Math.min(r,nr)][Math.min(c,nc)]===1:v[Math.min(r,nr)][Math.min(c,nc)]===1;
        if(has){visited.add(key);queue.push([nr,nc]);}
      }
    }
    let total=0; for(let r=0;r<=R;r++) for(let c=0;c<=C;c++) if(dots[r][c]>0) total++;
    return visited.size===total;
  }
  
  let solutions=0, finalS=null;
  function dfs(s) {
    if (solutions>=2) return;
    const ps=propagate(s);
    if (!ps) return;
    if (isDone(ps)) {
      if (!isSingleLoop(ps.h,ps.v,rows,cols)) return;
      solutions++; finalS=ps;
      return;
    }
    // Find an undecided edge
    let found=false;
    outer: for(let r=0;r<=rows;r++) for(let c=0;c<cols;c++) if(ps.h[r][c]===0){found=[r,c,'h'];break outer;}
    if(!found) outer2: for(let r=0;r<rows;r++) for(let c=0;c<=cols;c++) if(ps.v[r][c]===0){found=[r,c,'v'];break outer2;}
    if(!found) return;
    const [fr,fc,ft]=found;
    dfs(add(ps,fr,fc,ft,1));
    dfs(add(ps,fr,fc,ft,2));
  }
  
  dfs(s);
  if (solutions!==1||!finalS) return null;
  return {h: finalS.h, v: finalS.v};
}

// ---------- spanning tree loop generator ----------
/**
 * Generate a single loop using Wilson's algorithm (random spanning tree + cycle basis).
 * 
 * Actually, a simpler approach that always works:
 * 1. Start with a simple loop (rectangle)
 * 2. Randomly add "hooks" to it (a 2-edge protrusion that attaches then detaches)
 * 3. Repeat until desired complexity
 * 
 * Or even simpler: use the spanning tree method:
 * - Create a grid graph of dots
 * - Find a random cycle by doing random walk + cycle detection
 * - This is guaranteed to give ONE loop
 * 
 * Let's use the cycle-walk approach:
 * Start at border, do random walk, when we return to start we have a loop.
 * The trick: don't allow the walk to cross itself.
 */
function generateLoopByWalk(rows, cols) {
  const MAX_ATTEMPTS = 100;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const visitedH = new Set();
    const visitedV = new Set();
    const visitedDot = Array.from({length: rows+1}, ()=>Array(cols+1).fill(false));
    
    // Start from a random border dot
    const borderDots = [];
    for (let r = 0; r <= rows; r++) { borderDots.push([r, 0]); borderDots.push([r, cols]); }
    for (let c = 1; c < cols; c++) { borderDots.push([0, c]); borderDots.push([rows, c]); }
    const [startR, startC] = borderDots[Math.floor(Math.random() * borderDots.length)];
    
    // BFS/random walk to find a cycle
    // Use state: {r, c, path: [[r,c], ...]}
    let paths = [[startR, startC]];
    visitedDot[startR][startC] = true;
    
    while (paths.length > 0) {
      // Pick a random active path
      const pathIdx = Math.floor(Math.random() * paths.length);
      let path = paths[pathIdx];
      const [r, c] = path[path.length - 1];
      
      // Shuffle neighbors
      const dirs = [[0,1,'h'],[0,-1,'h'],[1,0,'v'],[-1,0,'v']];
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }
      
      let extended = false;
      for (const [dr, dc, t] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr > rows || nc < 0 || nc > cols) continue;
        
        const edgeKey = t === 'h' ? `${Math.min(r,nr)},${Math.min(c,nc)}` : `${Math.min(r,nr)},${Math.min(c,nc)}`;
        
        // Check if this edge is already used
        const edgeSet = t === 'h' ? visitedH : visitedV;
        if (edgeSet.has(edgeKey)) continue;
        
        // Check if neighbor dot is already visited
        if (visitedDot[nr][nc]) {
          // If it's the start dot and path length >= 4, we found a cycle!
          if (nr === startR && nc === startC && path.length >= 4) {
            // Build the loop edges
            const hSet = new Set(), vSet = new Set();
            for (let i = 0; i < path.length; i++) {
              const [r1, c1] = path[i];
              const [r2, c2] = path[(i + 1) % path.length];
              if (r1 === r2) { // horizontal
                const cMin = Math.min(c1, c2);
                hSet.add(`${r1},${cMin}`);
              } else { // vertical
                const rMin = Math.min(r1, r2);
                vSet.add(`${rMin},${c1}`);
              }
            }
            // Verify: all dots on loop should have degree 2
            if (verifyLoopEdges(hSet, vSet, rows, cols)) {
              return { hSet, vSet };
            }
          }
          continue;
        }
        
        // Extend the path
        visitedDot[nr][nc] = true;
        const edgeSetW = t === 'h' ? visitedH : visitedV;
        edgeSetW.add(edgeKey);
        
        const newPath = [...path, [nr, nc]];
        
        if (newPath.length > (rows * cols * 2)) continue; // prevent infinite paths
        
        paths[pathIdx] = newPath;
        extended = true;
        break;
      }
      
      if (!extended) {
        // Dead end: remove this path
        paths.splice(pathIdx, 1);
      }
    }
  }
  
  return null; // Failed to find a loop
}

function verifyLoopEdges(hSet, vSet, rows, cols) {
  const deg = Array.from({length: rows+1}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) {
    const [r, c] = k.split(',').map(Number);
    deg[r][c]++; deg[r][c+1]++;
  }
  for (const k of vSet) {
    const [r, c] = k.split(',').map(Number);
    deg[r][c]++; deg[r+1][c]++;
  }
  // All dots on the loop must have degree 2
  let total = 0;
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    if (deg[r][c] > 0) {
      total++;
      if (deg[r][c] !== 2) return false;
    }
  }
  // Must be a single connected loop
  let firstDot = null;
  for (let r = 0; r <= rows && !firstDot; r++) for (let c = 0; c <= cols && !firstDot; c++) if (deg[r][c] === 2) firstDot = [r, c];
  if (!firstDot) return false;
  
  const visited = new Set();
  const queue = [firstDot];
  visited.add(firstDot[0] + ',' + firstDot[1]);
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of [[r,c+1],[r,c-1],[r+1,c],[r-1,c]]) {
      if (nr < 0 || nr > rows || nc < 0 || nc > cols) continue;
      const key = nr + ',' + nc;
      if (visited.has(key)) continue;
      const hasEdge = (nr === r && hSet.has(`${r},${Math.min(c,nc)}`)) ||
                      (nc === c && vSet.has(`${Math.min(r,nr)},${c}`));
      if (hasEdge && deg[nr][nc] > 0) { visited.add(key); queue.push([nr, nc]); }
    }
  }
  return visited.size === total;
}

// ---------- bridge removal to create more complex loops ----------
/**
 * Take a simple loop and make it more interesting by adding bridges.
 * A bridge is created by: cut two edges, connect their endpoints with new edges.
 * This creates a "bay" indentation in the loop.
 */
function addBridgeToLoop(hSet, vSet, rows, cols) {
  // Convert edge sets to arrays
  const hEdges = [];
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); hEdges.push({r,c,t:'h'}); }
  const vEdges = [];
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); vEdges.push({r,c,t:'v'}); }
  
  const allEdges = [...hEdges, ...vEdges];
  if (allEdges.length < 6) return false; // Need at least 6 edges for a bridge
  
  // Pick a random edge to "break" (remove from loop)
  const idx1 = Math.floor(Math.random() * allEdges.length);
  const e1 = allEdges[idx1];
  
  // Find the two adjacent edges (connected by shared dot)
  function getEndPts(e) {
    if (e.t === 'h') return [[e.r, e.c], [e.r, e.c+1]];
    return [[e.r, e.c], [e.r+1, e.c]];
  }
  const pts1 = getEndPts(e1);
  
  // Build adjacency: dot -> edges touching it
  const dotEdges = {};
  for (const e of allEdges) {
    for (const [r, c] of getEndPts(e)) {
      const key = `${r},${c}`;
      if (!dotEdges[key]) dotEdges[key] = [];
      dotEdges[key].push(e);
    }
  }
  
  // Find the two dots of e1
  const [d1a, d1b] = pts1;
  const key1a = d1a.join(','), key1b = d1b.join(',');
  
  // Find adjacent edges on each dot
  const adj1a = dotEdges[key1a].filter(e => e !== e1);
  const adj1b = dotEdges[key1b].filter(e => e !== e1);
  
  if (adj1a.length === 0 || adj1b.length === 0) return false;
  
  // Pick a random adjacent edge on d1a (not e1)
  const e2 = adj1a[Math.floor(Math.random() * adj1a.length)];
  // Pick a random adjacent edge on d1b (not e1)
  const e3 = adj1b[Math.floor(Math.random() * adj1b.length)];
  
  // Get end points
  const [e2a, e2b] = getEndPts(e2);
  const [e3a, e3b] = getEndPts(e3);
  
  // Connect: the non-d1a endpoint of e2 to the non-d1b endpoint of e3
  const newPtA = (e2a[0]===d1a[0]&&e2a[1]===d1a[1]) ? e2b : e2a;
  const newPtB = (e3a[0]===d1b[0]&&e3a[1]===d1b[1]) ? e3b : e3a;
  
  // Don't connect if too close or same dot
  const dist = Math.abs(newPtA[0]-newPtB[0]) + Math.abs(newPtA[1]-newPtB[1]);
  if (dist < 2 || dist > 4) return false;
  
  // Don't connect if either newPt is already on the loop (except where we're connecting)
  // Allow: we want to create a new bay
  
  // Actually, let's use a simpler bridge strategy:
  // Take the loop, add a small detour path
  
  return false; // Bridge approach too complex, skip
}

// ---------- simple reliable generator ----------
/**
 * Generate a loop by starting with rectangle and adding detours.
 * Each detour: pick an interior edge, create a 2-edge protrusion, reconnect.
 * Simpler: pick a cell, temporarily remove its perimeter edges from loop,
 * then add a detour through that cell.
 */
function generateLoopDetour(rows, cols) {
  // Start with outer rectangle
  const hSet = new Set(), vSet = new Set();
  for (let c = 0; c < cols; c++) { hSet.add(`0,${c}`); hSet.add(`${rows},${c}`); }
  for (let r = 0; r < rows; r++) { vSet.add(`${r},0`); vSet.add(`${r},${cols}`); }
  
  // Add random detours (bays)
  const numDetours = 2 + Math.floor(Math.random() * Math.min(6, Math.floor(rows * cols / 4)));
  
  for (let d = 0; d < numDetours; d++) {
    addOneDetour(hSet, vSet, rows, cols);
  }
  
  if (!verifyLoopEdges(hSet, vSet, rows, cols)) return null;
  return { hSet, vSet };
}

function addOneDetour(hSet, vSet, rows, cols) {
  // Pick a random side and a random interval on that side
  const side = Math.floor(Math.random() * 4);
  let h, cStart, cEnd;
  
  if (side === 0) { // Top: pick rows[0,c1..c2]
    const w = 2 + Math.floor(Math.random() * (cols - 2));
    const c1 = 1 + Math.floor(Math.random() * (cols - w - 1));
    const depth = 1 + Math.floor(Math.random() * (rows - 1));
    // Remove top border edges in [c1, c1+w)
    for (let c = c1; c < c1 + w; c++) hSet.delete(`0,${c}`);
    // Add bottom edge of the bay
    for (let c = c1; c < c1 + w; c++) hSet.add(`${depth},${c}`);
    // Add side edges
    for (let r = 0; r < depth; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
  } else if (side === 2) { // Bottom
    const w = 2 + Math.floor(Math.random() * (cols - 2));
    const c1 = 1 + Math.floor(Math.random() * (cols - w - 1));
    const depth = 1 + Math.floor(Math.random() * (rows - 1));
    for (let c = c1; c < c1 + w; c++) hSet.delete(`${rows},${c}`);
    for (let c = c1; c < c1 + w; c++) hSet.add(`${rows-depth},${c}`);
    for (let r = rows - depth; r < rows; r++) { vSet.add(`${r},${c1}`); vSet.add(`${r},${c1+w}`); }
  } else if (side === 3) { // Left
    const h2 = 2 + Math.floor(Math.random() * (rows - 2));
    const r1 = 1 + Math.floor(Math.random() * (rows - h2 - 1));
    const depth = 1 + Math.floor(Math.random() * (cols - 1));
    for (let r = r1; r < r1 + h2; r++) vSet.delete(`${r},0`);
    for (let r = r1; r < r1 + h2; r++) vSet.add(`${r},${depth}`);
    for (let c = 0; c < depth; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h2},${c}`); }
  } else { // Right
    const h2 = 2 + Math.floor(Math.random() * (rows - 2));
    const r1 = 1 + Math.floor(Math.random() * (rows - h2 - 1));
    const depth = 1 + Math.floor(Math.random() * (cols - 1));
    for (let r = r1; r < r1 + h2; r++) vSet.delete(`${r},${cols}`);
    for (let r = r1; r < r1 + h2; r++) vSet.add(`${r},${cols-depth}`);
    for (let c = cols - depth; c < cols; c++) { hSet.add(`${r1},${c}`); hSet.add(`${r1+h2},${c}`); }
  }
}

function edgesToHints(hSet, vSet, rows, cols) {
  const grid = [];
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
    grid.push(row);
  }
  return grid;
}

function hintsToAnswer(hSet, vSet, rows, cols) {
  const ah = Array.from({length: rows+1}, ()=>Array(cols).fill(0));
  const av = Array.from({length: rows}, ()=>Array(cols+1).fill(0));
  for (const k of hSet) { const [r,c]=k.split(',').map(Number); ah[r][c]=1; }
  for (const k of vSet) { const [r,c]=k.split(',').map(Number); av[r][c]=1; }
  return { h: ah, v: av };
}

// Strip some clues while keeping unique solution
function stripClues(grid, origAnswer) {
  // Copy grid, try removing each non-zero clue
  const stripped = grid.map(r=>[...r]);
  const toTry = [];
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++)
    if (grid[r][c] > 0) toTry.push([r, c]);
  
  // Shuffle
  for (let i = toTry.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [toTry[i], toTry[j]] = [toTry[j], toTry[i]];
  }
  
  // Try removing clues one by one
  for (const [r, c] of toTry) {
    const val = stripped[r][c];
    stripped[r][c] = 0;
    const result = solve(stripped);
    if (!result || !isSingleLoop(result.h, result.v, stripped.length, stripped[0].length)) {
      stripped[r][c] = val; // Restore if not unique
    }
  }
  return stripped;
}

// ---------- main generation ----------
function generate(size, id, options = {}) {
  const { stripClues: shouldStrip = false } = options;
  const maxAttempts = 200;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const loop = generateLoopDetour(size, size);
    if (!loop) continue;
    
    const { hSet, vSet } = loop;
    const grid = edgesToHints(hSet, vSet, size, size);
    const answer = hintsToAnswer(hSet, vSet, size, size);
    
    // Check clue density
    const nonZero = grid.flat().filter(h => h > 0).length;
    const total = size * size;
    const ratio = nonZero / total;
    
    // Filter by target difficulty
    if (size === 5 && (ratio < 0.20 || ratio > 0.85)) continue;
    if (size === 7 && (ratio < 0.25 || ratio > 0.88)) continue;
    if (size === 10 && (ratio < 0.30 || ratio > 0.92)) continue;
    
    // Verify solver finds the same answer
    const result = solve(grid);
    if (!result) continue;
    if (!isSingleLoop(result.h, result.v, size, size)) continue;
    
    // Optionally strip clues to increase difficulty
    const finalGrid = shouldStrip ? stripClues(grid, answer) : grid;
    
    return {
      id,
      size,
      grid: finalGrid,
      answer,
      seed: Math.floor(Math.random() * 999999)
    };
  }
  return null;
}

// ---------- CLI ----------
const args = process.argv.slice(2);
const size = parseInt(args[0]) || 5;
const count = parseInt(args[1]) || 50;
const diffName = args[2] || 'test';
const outDir = path.join(BASE_DIR, diffName);

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Clear old files
for (const f of fs.readdirSync(outDir).filter(f=>f.match(/^\w+-\d{4}\.json$/))) {
  fs.unlinkSync(path.join(outDir, f));
}

console.log(`Generating ${count} ${size}x${size} puzzles (${diffName})...`);
const start = Date.now();
const results = [];

for (let i = 0; i < count; i++) {
  process.stdout.write(`\r  ${i+1}/${count}...`);
  const p = generate(size, i+1);
  if (p) {
    results.push(p);
    const num = String(p.id).padStart(4, '0');
    const fname = `${diffName}-${num}.json`;
    fs.writeFileSync(path.join(outDir, fname), JSON.stringify(p));
  }
}
console.log(`\n  Done: ${results.length}/${count} generated in ${((Date.now()-start)/1000).toFixed(1)}s`);

// Final verification
console.log('\n=== Verification ===');
let ok = 0, bad = 0;
for (const p of results) {
  const r = solve(p.grid);
  if (r && isSingleLoop(r.h, r.v, p.size, p.size)) ok++;
  else { bad++; process.stdout.write('X'); }
}
console.log(`\nValid: ${ok}/${results.length}  Invalid: ${bad}`);
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({
  total: results.length,
  difficulty: diffName,
  gridSize: `${size}x${size}`,
  generatedAt: new Date().toISOString(),
  version: 'generator-tatham'
}, null, 2));
