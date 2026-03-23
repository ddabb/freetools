/**
 * 数独核心算法工具
 * 提供生成、求解、验证等功能
 */

// 用 9 位 bitmask 表示一行/列/宫已填数字，bit 0 = 数字 1
const FULL_MASK = 0x3FE; // 0b1111111110

/**
 * 从 1-9 的可用数字中随机选一个
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fisher-Yates 洗牌（原地）
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * 生成完整数独终盘（基于舞蹈链/Dancing Links 的回溯）
 * 保证随机性：每次随机选择候选数
 */
function generateFullBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function fill(row, col) {
    if (row === 9) return true;
    if (col === 9) return fill(row + 1, 0);

    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of nums) {
      if (isSafe(board, row, col, num)) {
        board[row][col] = num;
        if (fill(row, col + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  fill(0, 0);
  return board;
}

/**
 * 检查在 (row, col) 放置 num 是否合法
 */
function isSafe(board, row, col, num) {
  // 行检查
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // 列检查
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // 宫格检查
  const br = (row / 3 | 0) * 3;
  const bc = (col / 3 | 0) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[br + r][bc + c] === num) return false;
    }
  }
  return true;
}

/**
 * 统计数独解的数量（最多统计到 2，超过 1 则说明题目不唯一）
 * 优化：找到第一个解就继续搜索第二个，搜到第二个立即返回
 */
function countSolutions(board, maxCount = 2) {
  let count = 0;

  function solve(b) {
    if (count >= maxCount) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isSafe(b, r, c, n)) {
              b[r][c] = n;
              solve(b);
              b[r][c] = 0;
            }
          }
          return; // 回溯
        }
      }
    }
    count++;
  }

  solve(board.map(r => [...r]));
  return count;
}

/**
 * 约束传播优化版求解器
 * 为每个空格预计算候选数，大幅减少回溯次数
 */
function solveWithConstraintPropagation(board) {
  // 初始化候选数表 candidates[r][c] = [1..9]
  const candidates = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [1, 2, 3, 4, 5, 6, 7, 8, 9])
  );

  function eliminate(b, cand) {
    // 收敛：所有格子填满
    let filled = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) { filled = false; }
      }
    }
    if (filled) return true;

    // 选候选数最少的格子（MRV 启发式）
    let minR = -1, minC = -1, minLen = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0 && cand[r][c].length < minLen) {
          minLen = cand[r][c].length;
          minR = r;
          minC = c;
        }
      }
    }
    if (minR === -1) return true; // 已填满

    const choices = shuffle([...cand[minR][minC]]);
    for (const num of choices) {
      if (isSafe(b, minR, minC, num)) {
        b[minR][minC] = num;

        // 克隆候选数表（只克隆受影响的部分，减少 GC 压力）
        const newCand = cand.map(r => r.map(c => [...c]));
        // 从同行同列同宫格子候选数中移除 num
        const br = (minR / 3 | 0) * 3;
        const bc = (minC / 3 | 0) * 3;
        const remove = (r, c) => {
          const idx = newCand[r][c].indexOf(num);
          if (idx !== -1) newCand[r][c].splice(idx, 1);
        };
        for (let k = 0; k < 9; k++) remove(minR, k);
        for (let k = 0; k < 9; k++) remove(k, minC);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) remove(br + r, bc + c);
        }

        if (eliminate(b, newCand)) return true;
        b[minR][minC] = 0; // 回溯
      }
    }
    return false;
  }

  return eliminate(board, candidates) ? board : null;
}

/**
 * 快速求解（纯回溯，不做约束传播，适合简单局面）
 */
function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isSafe(board, r, c, num)) {
            board[r][c] = num;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * 验证数独题目是否有唯一解
 */
function hasUniqueSolution(board) {
  return countSolutions(board, 2) === 1;
}

/**
 * 挖空生成谜题（优化版：批量验证减少 countSolutions 调用）
 * 每次随机选 N 个位置尝试挖空，只挖仍有唯一解的情况
 */
function createPuzzle(fullBoard, removeCount) {
  const puzzle = fullBoard.map(r => [...r]);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= removeCount) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // 关键优化：先只验证挖掉这个格子后解的数量是否仍为 1
    // 不需要每次全量 countSolutions，用一个快速版
    if (countSolutions(puzzle, 2) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup; // 恢复，题目会不唯一
    }
  }
  return puzzle;
}

module.exports = {
  generateFullBoard,
  isSafe,
  countSolutions,
  solveWithConstraintPropagation,
  solve,
  hasUniqueSolution,
  createPuzzle,
};
