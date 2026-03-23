Page({
  data: {
    board: [],
    difficulty: 'medium',
    showingAnswer: false,
    answerBoard: []
  },

  onLoad() {
    this.generateSudoku();
  },

  generateFullBoard() {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    this.solveSudoku(board);
    return board;
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

  solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (let num of nums) {
            if (this.isSafe(board, row, col, num)) {
              board[row][col] = num;
              if (this.solveSudoku(board)) {
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

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  countSolutions(board) {
    let count = 0;
    const solve = (b) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (b[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (this.isSafe(b, row, col, num)) {
                b[row][col] = num;
                solve(b);
                b[row][col] = 0;
              }
            }
            return;
          }
        }
      }
      count++;
    };
    solve(board.map(row => [...row]));
    return count;
  },

  removeNumbers(board, difficulty) {
    const puzzle = board.map(row => [...row]);
    const attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 40 : 50;
    
    const cells = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cells.push([i, j]);
      }
    }
    
    const shuffledCells = this.shuffleArray(cells);
    let removed = 0;

    for (let [row, col] of shuffledCells) {
      if (removed >= attempts) break;
      
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;
      
      const solutions = this.countSolutions(puzzle);
      if (solutions !== 1) {
        puzzle[row][col] = backup;
      } else {
        removed++;
      }
    }

    return puzzle;
  },

  generateSudoku() {
    wx.showLoading({ title: '生成中...' });
    
    setTimeout(() => {
      const fullBoard = this.generateFullBoard();
      const puzzleBoard = this.removeNumbers(fullBoard, this.data.difficulty);

      const displayBoard = puzzleBoard.map(row =>
        row.map(val => ({
          value: val ? val.toString() : '',
          fixed: val !== 0
        }))
      );

      const answerBoard = fullBoard.map(row =>
        row.map(val => val.toString())
      );

      this.setData({
        board: displayBoard,
        answerBoard,
        showingAnswer: false
      });

      wx.hideLoading();
      wx.showToast({
        title: '生成成功',
        icon: 'success'
      });
    }, 100);
  },

  setDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    this.setData({ difficulty });
    this.generateSudoku();
  },

  toggleAnswer() {
    this.setData({
      showingAnswer: !this.data.showingAnswer
    });
  },

  onShareAppMessage() {
    return {
      title: '数独生成器 - 随机生成数独题目',
      path: '/packages/math/pages/sudoku-generator/sudoku-generator'
    }
  }
})
