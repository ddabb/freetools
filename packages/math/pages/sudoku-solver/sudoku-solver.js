const sudoku = require('../../utils/sudoku');

Page({
  data: {
    board: [],
    solving: false,
    hasSolution: false,
    solutionMessage: '',
  },

  onLoad() {
    this.initBoard();
  },

  initBoard() {
    const board = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => ({ value: '', fixed: false }))
    );
    this.setData({ board, hasSolution: false, solutionMessage: '' });
  },

  onInput(e) {
    const { row, col } = e.currentTarget.dataset;
    let value = e.detail.value;

    // 只允许 1-9
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 9) {
      value = '';
    } else {
      value = String(num);
    }

    const board = this.data.board;
    board[row][col].value = value;
    board[row][col].fixed = value !== '';
    this.setData({ board });
  },

  clearBoard() {
    this.initBoard();
  },

  solveSudoku() {
    if (this.data.solving) return;
    this.setData({ solving: true, solutionMessage: '' });

    // 小延迟让按钮状态更新再开始计算
    setTimeout(() => {
      // 将界面 board 转为纯数字 board
      const rawBoard = this.data.board.map(row =>
        row.map(cell => (cell.value ? parseInt(cell.value, 10) : 0))
      );

      // 快速检查输入合法性（行列宫重复检测）
      if (!isValidInput(rawBoard)) {
        this.setData({
          solving: false,
          hasSolution: false,
          solutionMessage: '输入无效：行列宫中有重复数字',
        });
        wx.showToast({ title: '输入无效', icon: 'none' });
        return;
      }

      // 优先用约束传播求解（快），失败再用普通回溯（兜底）
      let solved = sudoku.solveWithConstraintPropagation(rawBoard);
      if (!solved) {
        // 克隆一份再求解，避免修改原数组
        solved = rawBoard.map(r => [...r]);
        if (!sudoku.solve(solved)) {
          this.setData({
            solving: false,
            hasSolution: false,
            solutionMessage: '该数独无解',
          });
          wx.showToast({ title: '无解', icon: 'none' });
          return;
        }
      }

      // 只更新非固定格子（用户输入的格子）
      const board = this.data.board;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!board[r][c].fixed) {
            board[r][c].value = String(solved[r][c]);
          }
        }
      }

      this.setData({
        board,
        solving: false,
        hasSolution: true,
        solutionMessage: '求解成功',
      });
      wx.showToast({ title: '求解成功', icon: 'success' });
    }, 60);
  },

  onShareAppMessage() {
    return {
      title: '数独求解器 - 快速解决数独难题',
      path: '/packages/math/pages/sudoku-solver/sudoku-solver',
    };
  },
});

/**
 * 检查用户输入是否合法（允许空格，不允许重复）
 */
function isValidInput(board) {
  const seen = Array.from({ length: 9 }, () => new Set());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === 0) continue;
      const box = ((r / 3) | 0) * 3 + ((c / 3) | 0);
      if (seen[r].has(v) || seen[c + 9].has(v) || seen[box + 18].has(v)) {
        return false;
      }
      seen[r].add(v);
      seen[c + 9].add(v);
      seen[box + 18].add(v);
    }
  }
  return true;
}
