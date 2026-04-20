/**
 * 数壹（Number One）核心算法
 * 
 * 规则：
 * 1. 每行每列中，未被涂黑的数字不能重复
 * 2. 涂黑的格子不能相邻（包括对角）
 * 3. 所有未涂黑的格子必须连通
 */

// 8个方向（包括对角）
const ALL_DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// 4个方向（上下左右）
const FOUR_DIRECTIONS = [
  [-1, 0], [1, 0], [0, -1], [0, 1]
];

/**
 * 检查黑格是否不相邻
 */
function checkBlackNotAdjacent(blackCells, size) {
  const blackSet = new Set(blackCells.map(c => `${c.row},${c.col}`));
  
  for (const cell of blackCells) {
    for (const [dr, dc] of ALL_DIRECTIONS) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (blackSet.has(`${nr},${nc}`)) {
          return false; // 相邻了
        }
      }
    }
  }
  return true;
}

/**
 * 检查白格是否连通
 */
function checkWhiteConnected(board, blackCells, size) {
  const blackSet = new Set(blackCells.map(c => `${c.row},${c.col}`));
  
  // 找一个白格作为起点
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (!blackSet.has(`${r},${c}`)) {
        start = { row: r, col: c };
      }
    }
  }
  
  if (!start) return false; // 全黑
  
  // BFS遍历白格
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.row},${start.col}`);
  
  while (queue.length > 0) {
    const current = queue.shift();
    for (const [dr, dc] of FOUR_DIRECTIONS) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const key = `${nr},${nc}`;
      
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !blackSet.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push({ row: nr, col: nc });
      }
    }
  }
  
  // 检查是否所有白格都被访问
  const totalWhite = size * size - blackCells.length;
  return visited.size === totalWhite;
}

/**
 * 检查每行每列数字是否唯一
 */
function checkNumbersUnique(board, blackCells, size) {
  const blackSet = new Set(blackCells.map(c => `${c.row},${c.col}`));
  
  // 检查每行
  for (let r = 0; r < size; r++) {
    const nums = new Set();
    for (let c = 0; c < size; c++) {
      if (!blackSet.has(`${r},${c}`)) {
        if (nums.has(board[r][c])) return false;
        nums.add(board[r][c]);
      }
    }
  }
  
  // 检查每列
  for (let c = 0; c < size; c++) {
    const nums = new Set();
    for (let r = 0; r < size; r++) {
      if (!blackSet.has(`${r},${c}`)) {
        if (nums.has(board[r][c])) return false;
        nums.add(board[r][c]);
      }
    }
  }
  
  return true;
}

/**
 * 检查是否是有效解
 */
function isValidSolution(board, blackCells, size) {
  if (!checkBlackNotAdjacent(blackCells, size)) return false;
  if (!checkWhiteConnected(board, blackCells, size)) return false;
  if (!checkNumbersUnique(board, blackCells, size)) return false;
  return true;
}

/**
 * 求解器 - 找出所有解
 * @param {number[][]} board - 数字网格
 * @param {number} size - 网格大小
 * @param {number} maxSolutions - 最多找几个解（用于验证唯一解）
 * @returns {Array} 所有解的数组
 */
function solve(board, size, maxSolutions = 2) {
  const solutions = [];
  const totalCells = size * size;
  
  // 将格子索引转换为行列
  function indexToRC(index) {
    return { row: Math.floor(index / size), col: index % size };
  }
  
  // 回溯搜索
  function backtrack(index, blackCells) {
    if (solutions.length >= maxSolutions) return;
    
    if (index === totalCells) {
      // 检查是否是有效解
      if (isValidSolution(board, blackCells, size)) {
        solutions.push([...blackCells]);
      }
      return;
    }
    
    const cell = indexToRC(index);
    
    // 优化：检查当前黑格是否已经相邻
    if (blackCells.length > 0) {
      const lastBlack = blackCells[blackCells.length - 1];
      const dr = Math.abs(cell.row - lastBlack.row);
      const dc = Math.abs(cell.col - lastBlack.col);
      if (dr <= 1 && dc <= 1) {
        // 当前格子与上一个黑格相邻，不能涂黑，只能保留
        backtrack(index + 1, blackCells);
        return;
      }
    }
    
    // 尝试涂黑当前格子
    const newBlackCells = [...blackCells, cell];
    
    // 剪枝：检查黑格不相邻
    if (checkBlackNotAdjacent(newBlackCells, size)) {
      // 剪枝：检查当前已涂黑的情况下，数字是否可能唯一
      // （只检查已处理的部分行和列）
      backtrack(index + 1, newBlackCells);
    }
    
    // 尝试保留当前格子
    backtrack(index + 1, blackCells);
  }
  
  backtrack(0, []);
  return solutions;
}

/**
 * 验证是否有唯一解
 */
function hasUniqueSolution(board, size) {
  const solutions = solve(board, size, 2);
  return solutions.length === 1;
}

/**
 * 获取唯一解
 */
function getUniqueSolution(board, size) {
  const solutions = solve(board, size, 2);
  if (solutions.length === 1) {
    return solutions[0];
  }
  return null;
}

/**
 * 生成谜题（逆向生成法）
 * @param {number} size - 网格大小
 * @param {number} difficulty - 难度 1-3
 * @returns {Object} { board, solution, difficulty }
 */
function generate(size = 6, difficulty = 2) {
  // 难度参数
  const diffParams = {
    1: { numRange: [1, 3], blackRatio: [0.15, 0.25] },  // 简单
    2: { numRange: [1, 4], blackRatio: [0.2, 0.35] },   // 中等
    3: { numRange: [1, 5], blackRatio: [0.25, 0.4] }    // 困难
  };
  
  const params = diffParams[difficulty] || diffParams[2];
  
  // 尝试生成
  for (let attempt = 0; attempt < 1000; attempt++) {
    // 步骤1：随机生成数字网格
    const board = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const num = Math.floor(Math.random() * 
          (params.numRange[1] - params.numRange[0] + 1)) + params.numRange[0];
        row.push(num);
      }
      board.push(row);
    }
    
    // 步骤2：求解验证
    const solutions = solve(board, size, 2);
    
    if (solutions.length === 1) {
      // 唯一解！
      const solution = solutions[0];
      const blackRatio = solution.length / (size * size);
      
      // 检查黑格比例是否在目标范围内
      if (blackRatio >= params.blackRatio[0] && blackRatio <= params.blackRatio[1]) {
        return {
          board,
          solution: solution.map(c => `${c.row},${c.col}`),
          difficulty,
          size,
          blackCount: solution.length,
          blackRatio: Math.round(blackRatio * 100)
        };
      }
    }
  }
  
  // 生成失败，放宽条件重试
  console.log(`生成失败，放宽条件重试...`);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const board = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const num = Math.floor(Math.random() * 4) + 1;
        row.push(num);
      }
      board.push(row);
    }
    
    const solutions = solve(board, size, 2);
    if (solutions.length === 1) {
      const solution = solutions[0];
      return {
        board,
        solution: solution.map(c => `${c.row},${c.col}`),
        difficulty,
        size,
        blackCount: solution.length,
        blackRatio: Math.round(solution.length / (size * size) * 100)
      };
    }
  }
  
  return null;
}

/**
 * 批量生成谜题
 */
function generateBatch(count, size = 6, difficulty = 2) {
  const puzzles = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const puzzle = generate(size, difficulty);
    if (puzzle) {
      puzzle.id = puzzles.length + 1;
      puzzles.push(puzzle);
      console.log(`生成 ${puzzles.length}/${count} - 黑格${puzzle.blackCount}个 (${puzzle.blackRatio}%)`);
    } else {
      console.log(`生成失败，重试...`);
      i--;
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n完成！共生成 ${puzzles.length} 个谜题，耗时 ${elapsed} 秒`);
  
  return puzzles;
}

module.exports = {
  solve,
  hasUniqueSolution,
  getUniqueSolution,
  generate,
  generateBatch,
  isValidSolution,
  checkBlackNotAdjacent,
  checkWhiteConnected,
  checkNumbersUnique
};
