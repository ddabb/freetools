/**
 * 数壹（Number One）核心算法 v4
 * 核心剪枝：同行/列数字约束（若某数在某行只出现一次，该格不能变黑）
 * 策略：先随机生成黑格 → 填入1..size数字 → 验证唯一解
 */

const ALL_DIR = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const FOUR_DIR = [[-1,0],[1,0],[0,-1],[0,1]];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 生成随机黑格（不相邻+连通）
 * @param {number} size 网格大小
 * @param {number} ratioLo 黑格比例下限
 * @param {number} ratioHi 黑格比例上限
 * @returns {{r:number,c:number}[]}[] 黑格坐标数组
 */
function generateRandomBlackCells(size, ratioLo, ratioHi) {
  const total = size * size;
  for (let t = 0; t < 800; t++) {
    const ratio = ratioLo + Math.random() * (ratioHi - ratioLo);
    const n = Math.max(1, Math.floor(total * ratio));
    const blackSet = new Set();
    const indices = shuffle(Array.from({ length: total }, (_, i) => i));

    for (const idx of indices) {
      if (blackSet.size >= n) break;
      const r = Math.floor(idx / size), c = idx % size;
      const key = `${r},${c}`;
      let adj = false;
      for (const [dr, dc] of ALL_DIR) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && blackSet.has(`${nr},${nc}`)) { adj = true; break; }
      }
      if (!adj) blackSet.add(key);
    }

    // BFS连通性
    const whiteCount = total - blackSet.size;
    let start = null;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!blackSet.has(`${r},${c}`)) { start = [r, c]; break outer; }
      }
    }
    if (!start) continue;
    const visited = new Set([`${start[0]},${start[1]}`]);
    const queue = [start];
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of FOUR_DIR) {
        const nr = r + dr, nc = c + dc, k = `${nr},${nc}`;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !blackSet.has(k) && !visited.has(k)) {
          visited.add(k); queue.push([nr, nc]);
        }
      }
    }
    if (visited.size === whiteCount) {
      return Array.from(blackSet).map(k => { const [r, c] = k.split(',').map(Number); return { r, c }; });
    }
  }
  return null;
}

/**
 * 生成数独格（行/列1..size不重复）
 */
function generateLatinSquare(size) {
  const board = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    const used = new Set();
    for (let c = 0; c < size; c++) {
      const candidates = [];
      for (let v = 1; v <= size; v++) if (!used.has(v)) candidates.push(v);
      const val = candidates[Math.floor(Math.random() * candidates.length)];
      board[r][c] = val; used.add(val);
    }
  }
  return board;
}

/**
 * 求解数壹：找所有满足条件的黑格集合
 * 关键剪枝：数字唯一约束传播
 */
function solve(board, size, maxSolutions = 2) {
  const N = size;
  const total = N * N;
  const solutions = [];

  // board[r][c]: 0=黑格占位, 1..N=给定数字
  // 约束1：同数字在同行/列至多出现一次（实际上拉丁方已保证）
  // 约束2：同行/列相同数字至少有一个是黑格 → 反过来：若某行/列某数只出现一次，该格不能是白格（必须是黑或不存在）
  // 约束3：黑格不相邻
  // 约束4：白格连通

  // 行/列中每个数字出现的位置
  const rowPos = Array.from({ length: N }, () => new Map()); // rowPos[r][val] = [c1, c2...]
  const colPos = Array.from({ length: N }, () => new Map()); // colPos[c][val] = [r1, r2...]

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[r][c];
      if (v >= 1 && v <= N) {
        if (!rowPos[r].has(v)) rowPos[r].set(v, []);
        rowPos[r].get(v).push(c);
        if (!colPos[c].has(v)) colPos[c].set(v, []);
        colPos[c].get(v).push(r);
      }
    }
  }

  // 预计算：每行/列每个数字的出现次数
  const rowCount = Array.from({ length: N }, () => new Map());
  const colCount = Array.from({ length: N }, () => new Map());
  for (let r = 0; r < N; r++) {
    for (const [v, cs] of rowPos[r]) rowCount[r].set(v, cs.length);
  }
  for (let c = 0; c < N; c++) {
    for (const [v, rs] of colPos[c]) colCount[c].set(v, rs.length);
  }

  // 决策变量：board上哪些格子是黑格
  // 初始：所有格子可黑可白（除了给定的0已经是黑）
  // 用 Set 记录当前决策的黑格
  let blackSet = new Set(); // key="r,c"
  let blackCells = []; // [{r,c}]

  function idx2rc(i) { return [Math.floor(i / N), i % N]; }

  // 约束检查：加入 (r,c) 为黑格后，是否满足数字唯一性
  // 对于行 r：若数字 v 在该行只出现在列 c（即 rowCount[r].get(v)==1 且 c 是唯一列），
  //   那么把 (r,c) 变黑后，该行再无 v，无法满足"同数唯一" → 剪枝
  // 同理对列 c
  function canBeBlack(r, c) {
    const v = board[r][c];
    if (v < 1 || v > N) return true; // 非给定数字，可以变黑

    // 检查行约束
    const rc = rowCount[r].get(v) || 0;
    if (rc === 1) return false; // 该行此数字唯一出现，变黑后无解

    // 检查列约束
    const cc = colCount[c].get(v) || 0;
    if (cc === 1) return false; // 该列此数字唯一出现，变黑后无解

    return true;
  }

  // 当前黑格候选相邻检查
  function isAdjacent(r, c) {
    for (const [dr, dc] of ALL_DIR) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && blackSet.has(`${nr},${nc}`)) return true;
    }
    return false;
  }

  // 连通性快速检查（BFS）
  function isConnected() {
    const whiteCount = total - blackSet.size;
    if (whiteCount === 0) return blackSet.size === total;
    let start = null;
    outer: for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!blackSet.has(`${r},${c}`)) { start = [r, c]; break outer; }
      }
    }
    if (!start) return false;
    const visited = new Set([`${start[0]},${start[1]}`]);
    const queue = [start];
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of FOUR_DIR) {
        const nr = r + dr, nc = c + dc, k = `${nr},${nc}`;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && !blackSet.has(k) && !visited.has(k)) {
          visited.add(k); queue.push([nr, nc]);
        }
      }
    }
    return visited.size === whiteCount;
  }

  // 剪枝：若已选黑格已破坏连通性，提前终止
  function backtrack(idx, depth) {
    if (solutions.length >= maxSolutions) return;
    if (idx === total) {
      if (isConnected()) {
        solutions.push([...blackCells]);
      }
      return;
    }

    const [r, c] = idx2rc(idx);
    const v = board[r][c];

    // 0 表示题目中已经确定的黑格（占位）
    if (v === 0) {
      blackSet.add(`${r},${c}`);
      blackCells.push({ r, c });
      backtrack(idx + 1, depth + 1);
      blackCells.pop();
      blackSet.delete(`${r},${c}`);
      return;
    }

    // 1..N 给定数字：可以变黑（满足约束时），也可以保持白
    // 选项1：变黑
    if (!isAdjacent(r, c) && canBeBlack(r, c)) {
      blackSet.add(`${r},${c}`);
      blackCells.push({ r, c });
      backtrack(idx + 1, depth + 1);
      blackCells.pop();
      blackSet.delete(`${r},${c}`);
    }

    // 选项2：保持白格
    backtrack(idx + 1, depth);
  }

  backtrack(0, 0);
  return solutions;
}

/**
 * 验证解
 */
function isValidSolution(board, blackCells, size) {
  const N = size;
  const blackS = new Set(blackCells.map(c => `${c.r},${c.c}`));
  for (const c of blackCells) {
    for (const [dr, dc] of ALL_DIR) {
      const nr = c.r + dr, nc = c.c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && blackS.has(`${nr},${nc}`)) return false;
    }
  }
  const whiteCount = N * N - blackCells.length;
  let start = null;
  outer: for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!blackS.has(`${r},${c}`)) { start = [r, c]; break outer; }
    }
  }
  if (!start) return false;
  const visited = new Set([`${start[0]},${start[1]}`]);
  const queue = [start];
  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of FOUR_DIR) {
      const nr = r + dr, nc = c + dc, k = `${nr},${nc}`;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && !blackS.has(k) && !visited.has(k)) {
        visited.add(k); queue.push([nr, nc]);
      }
    }
  }
  return visited.size === whiteCount;
}

/**
 * 生成谜题
 */
function generate(size = 6, difficulty = 2) {
  const diffParams = {
    1: { blackRatio: [0.12, 0.25] },
    2: { blackRatio: [0.18, 0.35] },
    3: { blackRatio: [0.22, 0.42] }
  };
  const { blackRatio } = diffParams[difficulty] || diffParams[2];
  const maxAttempts = difficulty === 1 ? 500 : difficulty === 2 ? 800 : 1200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const blackCells = generateRandomBlackCells(size, blackRatio[0], blackRatio[1]);
    if (!blackCells) continue;
    const blackS = new Set(blackCells.map(c => `${c.r},${c.c}`));

    // 生成拉丁方
    const board = generateLatinSquare(size);
    for (const c of blackCells) board[c.r][c.c] = 0;

    const solutions = solve(board, size, 2);
    if (solutions.length === 1) {
      const sol = solutions[0];
      return {
        board,
        solution: sol.map(c => `${c.r},${c.c}`),
        difficulty,
        size,
        blackCount: sol.length,
        blackRatio: Math.round(sol.length / (size * size) * 100)
      };
    }
  }
  return null;
}

/**
 * 批量生成
 */
function generateBatch(count, size = 6, difficulty = 2) {
  const puzzles = [];
  const start = Date.now();
  let fails = 0;
  for (let i = 0; i < count; i++) {
    const puzzle = generate(size, difficulty);
    if (puzzle) {
      puzzle.id = puzzles.length + 1;
      puzzles.push(puzzle);
      process.stdout.write(`\r✓ ${puzzles.length}/${count} fail=${fails} time=${Math.round((Date.now()-start)/1000)}s`);
    } else {
      fails++;
      if (fails % 50 === 0) process.stdout.write(` (fail×${fails})`);
    }
    if (fails > count * 10) { console.log('\n失败过多，停止'); break; }
  }
  console.log(`\n完成：${puzzles.length}/${count}个，失败${fails}次，${Math.round((Date.now()-start)/1000)}s`);
  return puzzles;
}

module.exports = { solve, generate, generateBatch, isValidSolution,
  hasUniqueSolution: (b, s) => solve(b, s, 2).length === 1,
  getUniqueSolution: (b, s) => { const x = solve(b, s, 2); return x.length === 1 ? x[0] : null; }
};
