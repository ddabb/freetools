// packages/math/pages/sudoku-generator/sudoku-generator.js
const sudoku = require('../../utils/sudoku');

Page({
  data: {
    board: [],
    difficulty: 'medium',
    showingAnswer: false,
    answerBoard: [],
    generating: false,
    showCandidates: true,
    hasCandidates: false,
    difficulties: [
      { key: 'easy', name: '入门', hint: '⭐ 简单' },
      { key: 'medium', name: '初级', hint: '⭐⭐ 中等' },
      { key: 'hard', name: '高级', hint: '⭐⭐⭐ 困难' }
    ]
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '数独生成器' });
    this.generateSudoku();
  },

  generateSudoku() {
    if (this.data.generating) return;
    this.setData({ generating: true });
    wx.showLoading({ title: '生成中...' });
    
    setTimeout(() => {
      try {
        const fullBoard = sudoku.generateFullBoard();
        const removeCount = { easy: 30, medium: 45, hard: 55 }[this.data.difficulty] || 45;
        const puzzle = sudoku.createPuzzle(fullBoard, removeCount);
        
        // 使用公共方法
        const displayBoard = sudoku.toDisplayBoard(puzzle, this.data.showCandidates);
        const answerStr = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            row.push(String(fullBoard[r][c]));
          }
          answerStr.push(row);
        }

        this.setData({
          board: displayBoard,
          answerBoard: answerStr,
          showingAnswer: false,
          generating: false,
          hasCandidates: this.data.showCandidates
        });

        wx.hideLoading();
        wx.showToast({ title: '生成成功', icon: 'success' });
      } catch (e) {
        wx.hideLoading();
        this.setData({ generating: false });
        wx.showToast({ title: '生成失败', icon: 'none' });
        console.error('Sudoku generate error:', e);
      }
    }, 50);
  },

  setDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty === this.data.difficulty) return;
    this.setData({ difficulty: difficulty });
    this.generateSudoku();
  },

  toggleCandidates(e) {
    const showCandidates = e.detail.value;
    this.setData({ showCandidates: showCandidates });
    this.refreshBoard();
  },

  refreshBoard() {
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const v = this.data.answerBoard[r][c];
        row.push(v ? parseInt(v, 10) : 0);
      }
      grid.push(row);
    }
    const displayBoard = sudoku.toDisplayBoard(grid, this.data.showCandidates);
    this.setData({ board: displayBoard, hasCandidates: this.data.showCandidates });
  },

  toggleAnswer() {
    const { showingAnswer, answerBoard, showCandidates } = this.data;
    
    if (!showingAnswer) {
      // 显示答案
      const grid = [];
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
          row.push(answerBoard[r][c] ? parseInt(answerBoard[r][c], 10) : 0);
        }
        grid.push(row);
      }
      const answerDisplay = sudoku.toDisplayBoard(grid, false);
      this.setData({ board: answerDisplay, showingAnswer: true });
    } else {
      // 隐藏答案
      this.refreshBoard();
      this.setData({ showingAnswer: false });
    }
  },

  onCandidateTap(e) {
    if (this.data.showingAnswer) return;
    
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    const num = e.currentTarget.dataset.num;
    const board = this.data.board;
    
    const candidates = board[row][col].candidates;
    if (candidates && candidates.indexOf(num) !== -1) {
      board[row][col].value = String(num);
      board[row][col].fixed = true;
      board[row][col].candidates = [];
      board[row][col].showCandidates = false;
      this.setData({ board: board });
      this.recalculateCandidates();
    }
  },

  recalculateCandidates() {
    if (!this.data.showCandidates) return;
    
    const board = this.data.board;
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(board[r][c].value ? parseInt(board[r][c].value, 10) : 0);
      }
      grid.push(row);
    }
    
    const candidates = sudoku.calculateAllCandidates(grid);
    let hasCandidates = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          board[r][c].candidates = candidates[r][c];
          board[r][c].showCandidates = true;
          if (candidates[r][c].length > 0) hasCandidates = true;
        }
      }
    }
    this.setData({ board: board, hasCandidates: hasCandidates });
  },

  onShareAppMessage() {
    return { title: '数独生成器 - 随机生成数独题目', path: '/packages/math/pages/sudoku-generator/sudoku-generator' };
  },

  onShareTimeline() {
    return { title: '数独生成器 - 随机生成数独题目' };
  }
});
