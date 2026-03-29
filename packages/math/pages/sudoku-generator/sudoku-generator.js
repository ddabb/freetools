// packages/math/pages/sudoku-generator/sudoku-generator.js
const sudoku = require('../../utils/sudoku');

Page({
  data: {
    board: [],
    difficulty: 'medium',
    showingAnswer: false,
    answerBoard: [],
    puzzleBoard: [], // 保存原始谜题数据
    userBoard: [], // 保存用户填写的内容
    generating: false,
    showCandidates: true,
    hasCandidates: false,
    difficulties: [
      { key: 'easy', name: '入门', hint: '⭐ 简单' },
      { key: 'medium', name: '初级', hint: '⭐⭐ 中等' },
      { key: 'hard', name: '高级', hint: '⭐⭐⭐ 困难' }
    ],
    showInputPanel: false,
    selectedCell: { row: -1, col: -1 }
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
        
        // 创建自定义的棋盘数据，确保只有原始题目格子是固定的
        const board = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            const num = puzzle[r][c];
            row.push({
              value: num === 0 ? '' : String(num),
              fixed: num !== 0, // 只有原始题目格子是固定的
              candidates: [0, 0, 0, 0, 0, 0, 0, 0, 0],
              showCandidates: this.data.showCandidates && num === 0
            });
          }
          board.push(row);
        }
        
        const answerStr = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            row.push(String(fullBoard[r][c]));
          }
          answerStr.push(row);
        }

        // 保存原始谜题数据
        const puzzleStr = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            row.push(String(puzzle[r][c]));
          }
          puzzleStr.push(row);
        }

        // 初始化用户填写的内容为空
        const userBoard = [];
        for (let r = 0; r < 9; r++) {
          const row = [];
          for (let c = 0; c < 9; c++) {
            row.push('');
          }
          userBoard.push(row);
        }

        this.setData({
          board: board,
          answerBoard: answerStr,
          puzzleBoard: puzzleStr, // 保存谜题数据
          userBoard: userBoard, // 初始化用户填写的内容
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
    // 基于当前棋盘状态计算候选解
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const cell = this.data.board[r][c];
        // 使用当前棋盘的实际值
        if (cell.value) {
          row.push(parseInt(cell.value, 10));
        } else {
          // 使用原始谜题数据
          const v = this.data.puzzleBoard[r][c];
          row.push(v ? parseInt(v, 10) : 0);
        }
      }
      grid.push(row);
    }
    
    const candidates = sudoku.calculateAllCandidates(grid);
    const board = this.data.board;
    
    // 调试：检查候选解数据
    console.log('候选解开关状态:', this.data.showCandidates);
    
    // 确保有候选解时才显示提示
    let hasCandidates = false;
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.data.showCandidates && grid[r][c] === 0) {
          // 创建固定长度的候选数数组
          const candidateNumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0];
          candidates[r][c].forEach(num => {
            candidateNumbers[num - 1] = num;
          });
          
          board[r][c].candidates = candidateNumbers;
          board[r][c].showCandidates = true;
          
          if (candidates[r][c].length > 0) hasCandidates = true;
        } else {
          board[r][c].showCandidates = false;
        }
      }
    }
    
    this.setData({ board: board, hasCandidates: hasCandidates });
  },

  toggleAnswer() {
    const { showingAnswer, answerBoard, puzzleBoard, difficulty, showCandidates } = this.data;
    
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
      // 创建答案棋盘，确保答案单元格有特殊标记
      const answerDisplay = [];
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
          const value = grid[r][c] === 0 ? '' : String(grid[r][c]);
          // 检查是否是原始谜题中的固定数字
          const isFixed = puzzleBoard[r][c] !== '0';
          row.push({
            value: value,
            fixed: isFixed,
            isAnswer: !isFixed, // 标记为答案数字
            candidates: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            showCandidates: false
          });
        }
        answerDisplay.push(row);
      }
      this.setData({ board: answerDisplay, showingAnswer: true });
    } else {
      // 隐藏答案，恢复到原始谜题状态
      this.restorePuzzle();
    }
  },

  // 恢复原始谜题状态，不显示弹窗
  restorePuzzle() {
    const { puzzleBoard, showCandidates, userBoard, answerBoard } = this.data;
    
    // 创建自定义的棋盘数据，确保只有原始题目格子是固定的
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const num = puzzleBoard[r][c];
        // 优先使用用户填写的内容
        const userValue = userBoard[r][c];
        const value = userValue || (num === '0' ? '' : num);
        row.push({
          value: value,
          fixed: num !== '0', // 只有原始题目格子是固定的
          isError: userValue && answerBoard[r][c] !== userValue, // 检查用户填写的是否正确
          candidates: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          showCandidates: showCandidates && !value
        });
      }
      board.push(row);
    }
    
    this.setData({
      board: board,
      showingAnswer: false,
      hasCandidates: showCandidates
    });
  },

  // 点击格子
  onCellTap(e) {
    if (this.data.showingAnswer) return;
    
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    
    // 打开输入面板
    this.setData({ 
      showInputPanel: true,
      selectedCell: { row, col }
    });
  },

  // 输入数字
  onNumberInput(e) {
    const num = e.currentTarget.dataset.num;
    const { row, col } = this.data.selectedCell;
    const board = this.data.board;
    const answerBoard = this.data.answerBoard;
    const userBoard = this.data.userBoard;
    
    board[row][col].value = String(num);
    // 保存用户填写的内容
    userBoard[row][col] = String(num);
    // 检查数字是否正确
    board[row][col].isError = answerBoard[row][col] !== String(num);
    // 不要标记为 fixed，保持可编辑状态
    board[row][col].candidates = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    board[row][col].showCandidates = false;
    
    this.setData({ 
      board: board, 
      userBoard: userBoard,
      showInputPanel: false,
    });
    this.recalculateCandidates();
  },

  // 清除格子
  onClearCell() {
    const { row, col } = this.data.selectedCell;
    const board = this.data.board;
    const userBoard = this.data.userBoard;
    
    board[row][col].value = '';
    // 清除用户填写的内容
    userBoard[row][col] = '';
    board[row][col].fixed = false;
    board[row][col].candidates = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    this.setData({ 
      board: board, 
      userBoard: userBoard,
      showInputPanel: false,
    });
    this.recalculateCandidates();
  },

  // 关闭输入面板
  closeInputPanel() {
    this.setData({ showInputPanel: false });
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
    
    // 使用toDisplayBoard确保数据结构一致
    const displayBoard = sudoku.toDisplayBoard(grid, this.data.showCandidates);
    let hasCandidates = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          board[r][c].candidates = displayBoard[r][c].candidates;
          board[r][c].showCandidates = true;
          if (displayBoard[r][c].candidates.some(num => num !== 0)) hasCandidates = true;
        } else {
          board[r][c].showCandidates = false;
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
