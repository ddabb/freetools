// packages/math/pages/sudoku-generator/sudoku-generator.js
const sudoku = require('../../utils/sudoku');

// CDN 数据源
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data';
const DAILY_KEY = 'daily_sudoku';
const DAILY_TS_KEY = 'daily_sudoku_ts';
const CACHE_EXPIRE = 24 * 60 * 60 * 1000; // 24小时

Page({
  data: {
    board: [],
    difficulty: 'medium',
    difficultyKey: 'medium',
    showingAnswer: false,
    answerBoard: [],
    generating: false,
    showCandidates: true,
    hasCandidates: false,
    mode: 'random', // random | daily
    dailyInfo: {
      name: '',
      difficulty: '',
      level: ''
    },
    difficulties: [
      { key: 'easy', name: '入门', hint: '⭐ 简单' },
      { key: 'medium', name: '初级', hint: '⭐⭐ 中等' },
      { key: 'hard', name: '高级', hint: '⭐⭐⭐ 困难' }
    ]
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '数独生成器' });
    this.loadDailySudoku();
  },

  // 加载每日数独
  loadDailySudoku() {
    const now = Date.now();
    const cached = wx.getStorageSync(DAILY_KEY);
    const timestamp = wx.getStorageSync(DAILY_TS_KEY);

    // 检查缓存是否有效（每天只缓存当天）
    if (cached && timestamp) {
      const cacheDate = new Date(timestamp).toDateString();
      const today = new Date().toDateString();
      if (cacheDate === today) {
        console.log('[daily-sudoku] 使用今日缓存');
        this.setTodaySudoku(cached);
        return;
      }
    }

    console.log('[daily-sudoku] 从CDN加载');
    wx.request({
      url: `${CDN_BASE}/daily-sudoku.json`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.puzzles) {
          // 保存到缓存
          wx.setStorageSync(DAILY_KEY, res.data);
          wx.setStorageSync(DAILY_TS_KEY, now);
          this.setTodaySudoku(res.data);
        }
      },
      fail: (err) => {
        console.warn('[daily-sudoku] CDN加载失败', err);
        // 使用本地备用
        this.useLocalDailySudoku();
      }
    });
  },

  // 设置今日数独
  setTodaySudoku(data) {
    const today = new Date();
    const dayOfYear = this.getDayOfYear(today);
    
    // 查找今天的数独
    let todayPuzzle = data.puzzles.find(p => p.dayOfYear === dayOfYear);
    
    // 如果没找到今天的，找最近的
    if (!todayPuzzle) {
      todayPuzzle = data.puzzles[0];
    }

    if (todayPuzzle) {
      this.setData({
        dailyInfo: {
          name: todayPuzzle.name,
          difficulty: todayPuzzle.difficulty,
          level: todayPuzzle.level
        },
        board: sudoku.toDisplayBoard(todayPuzzle.puzzle, this.data.showCandidates),
        answerBoard: todayPuzzle.solution,
        showingAnswer: false,
        mode: 'daily'
      });
    }
  },

  // 获取今天是第几天
  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  },

  // 本地备用每日数独
  useLocalDailySudoku() {
    const today = new Date();
    const dayOfYear = this.getDayOfYear(today);
    
    // 本地备用数据
    const localData = {
      puzzles: [{
        date: today.toISOString().split('T')[0],
        dayOfYear: dayOfYear,
        name: '3月' + today.getDate() + '日',
        difficulty: '入门',
        level: '★☆☆☆☆',
        puzzle: [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        solution: [
          [5, 3, 4, 6, 7, 8, 9, 1, 2],
          [6, 7, 2, 1, 9, 5, 3, 4, 8],
          [1, 9, 8, 3, 4, 2, 5, 6, 7],
          [8, 5, 9, 7, 6, 1, 4, 2, 3],
          [4, 2, 6, 8, 5, 3, 7, 9, 1],
          [7, 1, 3, 9, 2, 4, 8, 5, 6],
          [9, 6, 1, 5, 3, 7, 2, 8, 4],
          [2, 8, 7, 4, 1, 9, 6, 3, 5],
          [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ]
      }]
    };

    this.setTodaySudoku(localData);
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });
    
    if (mode === 'daily') {
      this.loadDailySudoku();
    }
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
