/**
 * 数独核心算法工具
 * 提供生成、求解、验证、候选解计算等功能
 */

// Fisher-Yates 洗牌
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// 获取某个位置的候选数字
function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) return [];
  const used = {};
  for (let c = 0; c < 9; c++) if (grid[row][c] !== 0) used[grid[row][c]] = true;
  for (let r = 0; r < 9; r++) if (grid[r][col] !== 0) used[grid[r][col]] = true;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) if (grid[r][c] !== 0) used[grid[r][c]] = true;
  const result = [];
  for (let n = 1; n <= 9; n++) if (!used[n]) result.push(n);
  return result;
}

// 计算所有候选解
function calculateAllCandidates(grid) {
  const result = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      row.push(getCandidates(grid, r, c));
    }
    result.push(row);
  }
  return result;
}

// 转换为显示格式
function toDisplayBoard(grid, showCandidates) {
  showCandidates = showCandidates || false;
  const allCandidates = showCandidates ? calculateAllCandidates(grid) : null;
  const result = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      // 创建固定长度的候选数数组，用0表示占位
      let candidateNumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (showCandidates && grid[r][c] === 0 && allCandidates) {
        // 将实际的候选数放在对应的位置
        allCandidates[r][c].forEach(num => {
          candidateNumbers[num - 1] = num;
        });
      }
      
      row.push({
        value: grid[r][c] === 0 ? '' : String(grid[r][c]),
        fixed: grid[r][c] !== 0,
        candidates: candidateNumbers,
        showCandidates: showCandidates && grid[r][c] === 0
      });
    }
    result.push(row);
  }
  return result;
}

// 验证输入合法性
function isValidInput(grid) {
  const seen = [];
  for (let i = 0; i < 27; i++) seen.push({});
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (seen[r][v] || seen[c + 9][v] || seen[box + 18][v]) return false;
      seen[r][v] = true;
      seen[c + 9][v] = true;
      seen[box + 18][v] = true;
    }
  }
  return true;
}

// 检查放置是否合法
function isSafe(board, row, col, num) {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (board[br + r][bc + c] === num) return false;
  return true;
}

// 统计解的数量
function countSolutions(board, maxCount) {
  maxCount = maxCount || 2;
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
          return;
        }
      }
    }
    count++;
  }
  const copy = board.map(function(r) { return r.slice(); });
  solve(copy);
  return count;
}

// 约束传播求解
function solveWithConstraintPropagation(board) {
  const candidates = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) row.push([1,2,3,4,5,6,7,8,9]);
    candidates.push(row);
  }
  
  function eliminate(b, cand) {
    let filled = true;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (b[r][c] === 0) filled = false;
    if (filled) return true;

    let minR = -1, minC = -1, minLen = 10;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0 && cand[r][c].length < minLen) {
        minLen = cand[r][c].length; minR = r; minC = c;
      }
    }
    if (minR === -1) return true;

    const choices = shuffle(cand[minR][minC].slice());
    for (let i = 0; i < choices.length; i++) {
      const num = choices[i];
      if (isSafe(b, minR, minC, num)) {
        b[minR][minC] = num;
        const newCand = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) row.push(cand[r][c].slice());
          newCand.push(row);
        }
        const br = Math.floor(minR / 3) * 3;
        const bc = Math.floor(minC / 3) * 3;
        function remove(r, c) {
          const idx = newCand[r][c].indexOf(num);
          if (idx !== -1) newCand[r][c].splice(idx, 1);
        }
        for (let k = 0; k < 9; k++) { remove(minR, k); remove(k, minC); }
        for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) remove(r, c);
        if (eliminate(b, newCand)) return true;
        b[minR][minC] = 0;
      }
    }
    return false;
  }
  
  return eliminate(board, candidates) ? board : null;
}

// 快速求解
function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1,2,3,4,5,6,7,8,9]);
        for (let i = 0; i < nums.length; i++) {
          if (isSafe(board, r, c, nums[i])) {
            board[r][c] = nums[i];
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

// 生成完整终盘
function generateFullBoard() {
  const board = [];
  for (let r = 0; r < 9; r++) board.push(Array(9).fill(0));
  
  function fill(row, col) {
    if (row === 9) return true;
    if (col === 9) return fill(row + 1, 0);
    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
    for (let i = 0; i < nums.length; i++) {
      if (isSafe(board, row, col, nums[i])) {
        board[row][col] = nums[i];
        if (fill(row, col + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }
  fill(0, 0);
  return board;
}

// 验证唯一解
function hasUniqueSolution(board) {
  return countSolutions(board, 2) === 1;
}

// 创建谜题
function createPuzzle(fullBoard, removeCount) {
  const puzzle = fullBoard.map(function(r) { return r.slice(); });
  const positions = shuffle(Array.from({length: 81}, function(_, i) { return [Math.floor(i / 9), i % 9]; }));
  let removed = 0;
  for (let i = 0; i < positions.length && removed < removeCount; i++) {
    const r = positions[i][0], c = positions[i][1];
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2) === 1) removed++;
    else puzzle[r][c] = backup;
  }
  return puzzle;
}

module.exports = {
  generateFullBoard: generateFullBoard,
  createPuzzle: createPuzzle,
  solve: solve,
  solveWithConstraintPropagation: solveWithConstraintPropagation,
  isSafe: isSafe,
  isValidInput: isValidInput,
  countSolutions: countSolutions,
  hasUniqueSolution: hasUniqueSolution,
  getCandidates: getCandidates,
  calculateAllCandidates: calculateAllCandidates,
  toDisplayBoard: toDisplayBoard
};
