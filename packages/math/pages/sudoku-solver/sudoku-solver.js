Page({
  data: {
    board: [],
    solving: false,
    hasSolution: false,
    solutionMessage: ''
  },

  onLoad() {
    this.initBoard();
  },

  initBoard() {
    const board = [];
    for (let i = 0; i < 9; i++) {
      const row = [];
      for (let j = 0; j < 9; j++) {
        row.push({
          value: '',
          fixed: false
        });
      }
      board.push(row);
    }
    this.setData({ board });
  },

  onInput(e) {
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    let value = e.detail.value;

    if (value && (value < 1 || value > 9 || isNaN(value))) {
      value = '';
    }

    const board = this.data.board;
    board[row][col].value = value;
    board[row][col].fixed = value !== '';
    this.setData({ board });
  },

  clearBoard() {
    this.initBoard();
    this.setData({
      hasSolution: false,
      solutionMessage: ''
    });
  },

  isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }

    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) return false;
      }
    }

    return true;
  },

  solveSudokuHelper(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0 || board[row][col] === '') {
          for (let num = 1; num <= 9; num++) {
            if (this.isSafe(board, row, col, num)) {
              board[row][col] = num;
              if (this.solveSudokuHelper(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  },

  validateBoard(board) {
    const usedRows = new Array(9).fill(0).map(() => new Set());
    const usedCols = new Array(9).fill(0).map(() => new Set());
    const usedBoxes = new Array(9).fill(0).map(() => new Set());

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const num = board[i][j];
        if (num) {
          const boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);
          if (usedRows[i].has(num) || usedCols[j].has(num) || usedBoxes[boxIndex].has(num)) {
            return false;
          }
          usedRows[i].add(num);
          usedCols[j].add(num);
          usedBoxes[boxIndex].add(num);
        }
      }
    }
    return true;
  },

  solveSudoku() {
    this.setData({ solving: true });

    const board = this.data.board.map(row => 
      row.map(cell => cell.value ? parseInt(cell.value) : 0)
    );

    if (!this.validateBoard(board)) {
      this.setData({
        solving: false,
        hasSolution: false,
        solutionMessage: '输入的数独题目无效，请检查！'
      });
      wx.showToast({
        title: '题目无效',
        icon: 'none'
      });
      return;
    }

    const solved = this.solveSudokuHelper(board);

    if (solved) {
      const newBoard = this.data.board;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (!newBoard[i][j].fixed) {
            newBoard[i][j].value = board[i][j].toString();
          }
        }
      }
      this.setData({
        board: newBoard,
        solving: false,
        hasSolution: true,
        solutionMessage: '数独求解成功！'
      });
      wx.showToast({
        title: '求解成功',
        icon: 'success'
      });
    } else {
      this.setData({
        solving: false,
        hasSolution: false,
        solutionMessage: '该数独无解！'
      });
      wx.showToast({
        title: '无解',
        icon: 'none'
      });
    }
  },

  onShareAppMessage() {
    return {
      title: '数独求解器 - 快速解决数独难题',
      path: '/packages/math/pages/sudoku-solver/sudoku-solver'
    }
  }
})
