// packages/math/pages/sudoku-solver/sudoku-solver.js
const sudoku = require('../../utils/sudoku');
const utils = require('../../../../utils/index');

// CDN 数据源地址
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const DAILY_KEY = 'daily_sudoku';
const DAILY_TS_KEY = 'daily_sudoku_ts';

Page({
  data: {
    board: [],
    solving: false,
    hasSolution: false,
    solutionMessage: '',
    importMode: 'paste',
    pastedText: '',
    showCandidates: false,
    showInputPanel: false,
    selectedCell: { row: -1, col: -1 },
    mode: 'daily', // daily | paste
    dailyInfo: {
      name: '',
      difficulty: '',
      level: ''
    }
  },

  onLoad() {
    this.initBoard();
    wx.setNavigationBarTitle({ title: '数独求解器' });
    // 只加载每日数独，不加载预设数据
    this.loadDailySudoku();
  },

  // 加载每日数独（带缓存功能）
  loadDailySudoku() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    const now = Date.now();
    const cached = wx.getStorageSync(DAILY_KEY);
    const timestamp = wx.getStorageSync(DAILY_TS_KEY);

    // 检查缓存是否有效（每天只缓存当天）
    if (cached && timestamp) {
      const cacheDate = new Date(timestamp).toDateString();
      const todayStr = today.toDateString();
      console.log(`[daily-sudoku] 缓存日期: ${cacheDate}, 今日日期: ${todayStr}`);
      if (cacheDate === todayStr) {
        console.log('[daily-sudoku] 使用今日缓存');
        console.log('[daily-sudoku] 题目名称:', cached.name);
        console.log('[daily-sudoku] 难度:', cached.level, cached.difficulty);
        this.setTodaySudoku(cached);
        return;
      } else {
        console.log('[daily-sudoku] 缓存过期，重新从CDN加载');
      }
    } else {
      console.log('[daily-sudoku] 无缓存或缓存无效，从CDN加载');
    }

    console.log(`[daily-sudoku] 从CDN加载: ${CDN_BASE}/sudoku/${dateStr}.json`);
    console.log(`[daily-sudoku] 当前日期: ${year}-${month}-${day}`);
    
    wx.request({
      url: `${CDN_BASE}/sudoku/${dateStr}.json`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log(`[daily-sudoku] CDN响应状态码: ${res.statusCode}`);
        if (res.statusCode === 200 && res.data) {
          console.log('[daily-sudoku] CDN数据加载成功，保存到缓存');
          console.log('[daily-sudoku] 题目名称:', res.data.name);
          console.log('[daily-sudoku] 难度:', res.data.level, res.data.difficulty);
          console.log('[daily-sudoku] 题目数据:', JSON.stringify(res.data.puzzle));
          // 保存到缓存
          wx.setStorageSync(DAILY_KEY, res.data);
          wx.setStorageSync(DAILY_TS_KEY, now);
          this.setTodaySudoku(res.data);
        } else if (res.statusCode === 404) {
          console.warn('[daily-sudoku] CDN没有对应日期的数据，随机生成题目');
          this.generateRandomSudoku();
        } else {
          console.warn('[daily-sudoku] CDN数据格式错误，使用随机题目');
          this.generateRandomSudoku();
        }
      },
      fail: (err) => {
        console.warn('[daily-sudoku] CDN加载失败', err);
        console.log('[daily-sudoku] 使用随机题目');
        this.generateRandomSudoku();
      }
    });
  },

  // 设置今日数独
  setTodaySudoku(data) {
    if (data && data.puzzle) {
      this.loadPuzzle(data.puzzle);
      this.setData({
        dailyInfo: {
          name: data.name,
          difficulty: data.difficulty,
          level: data.level
        },
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
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // 本地备用数据（新格式）
    const localData = {
      date: `${year}-${month}-${day}`,
      name: `${year}年${month}月${day}日数独`,
      level: '★☆☆☆☆',
      difficulty: '简单',
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
      emptyCells: 35
    };

    this.setTodaySudoku(localData);
  },

  // 随机生成数独题目
  generateRandomSudoku() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    console.log('[daily-sudoku] 开始随机生成数独题目');
    
    try {
      // 使用数独生成器生成题目
      const generatedPuzzle = sudoku.generate({ emptyCells: 40 }); // 生成40个空格的题目
      
      const randomData = {
        date: `${year}-${month}-${day}`,
        name: `${year}年${month}月${day}日随机数独`,
        level: '★★☆☆☆',
        difficulty: '中等',
        puzzle: generatedPuzzle,
        emptyCells: 40
      };
      
      console.log('[daily-sudoku] 随机题目生成成功');
      console.log('[daily-sudoku] 题目名称:', randomData.name);
      console.log('[daily-sudoku] 难度:', randomData.level, randomData.difficulty);
      console.log('[daily-sudoku] 题目数据:', JSON.stringify(randomData.puzzle));
      
      this.setTodaySudoku(randomData);
    } catch (error) {
      console.error('[daily-sudoku] 随机题目生成失败:', error);
      console.log('[daily-sudoku] 使用本地备用数独');
      this.useLocalDailySudoku();
    }
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });
    
    if (mode === 'daily') {
      this.loadDailySudoku();
    } else if (mode === 'paste') {
      this.setData({ pastedText: '' });
    }
  },



  initBoard() {
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push({ value: '', fixed: false, candidates: [] });
      }
      board.push(row);
    }
    this.setData({ 
      board: board, 
      hasSolution: false, 
      solutionMessage: '', 
      selectedPreset: -1,
      selectedCell: { row: -1, col: -1 }
    });
  },

  switchImportMode(e) {
    this.setData({ importMode: e.currentTarget.dataset.mode });
  },

  toggleCandidates(e) {
    const showCandidates = e.detail.value;
    this.setData({ showCandidates: showCandidates });
    if (showCandidates) this.calculateCandidates();
  },

  onPasteInput(e) {
    this.setData({ pastedText: e.detail.value });
  },

  clearPasted() {
    this.setData({ pastedText: '' });
  },

  importPasted() {
    const text = this.data.pastedText.trim();
    if (!text) { utils.showText('请输入数独题目'); return; }
    let puzzle = null;
    if (/^[0-9.]{81}$/.test(text)) puzzle = this.parseString81(text);
    else if (/^\d{81}$/.test(text)) puzzle = this.parsePure81(text);
    else puzzle = this.parseMultiLine(text);
    if (puzzle) { this.loadPuzzle(puzzle); utils.showSuccess('导入成功'); }
    else utils.showText('格式错误');
  },

  parseString81(str) {
    const puzzle = [];
    for (let i = 0; i < 9; i++) {
      const row = [];
      for (let j = 0; j < 9; j++) {
        const ch = str[i * 9 + j];
        const num = (ch === '.' || ch === '0') ? 0 : parseInt(ch, 10);
        row.push(num);
      }
      puzzle.push(row);
    }
    return puzzle;
  },

  parsePure81(str) {
    const puzzle = [];
    for (let i = 0; i < 9; i++) {
      const row = [];
      for (let j = 0; j < 9; j++) {
        const num = parseInt(str[i * 9 + j], 10);
        row.push(num);
      }
      puzzle.push(row);
    }
    return puzzle;
  },

  parseMultiLine(text) {
    const lines = text.split(/[\n\r]+/);
    if (lines.length < 9) return null;
    const puzzle = [];
    for (let i = 0; i < 9; i++) {
      const line = lines[i].replace(/\s+/g, '').replace(/[^0-9.]/g, '');
      if (line.length < 9) return null;
      const row = [];
      for (let j = 0; j < 9; j++) {
        const ch = line[j];
        const num = (ch === '.' || ch === '0') ? 0 : parseInt(ch, 10);
        row.push(num);
      }
      puzzle.push(row);
    }
    return puzzle;
  },



  loadPuzzle(puzzle) {
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const num = puzzle[r][c];
        row.push({ value: num === 0 ? '' : String(num), fixed: num !== 0, candidates: [] });
      }
      board.push(row);
    }
    this.setData({ 
      board: board, 
      hasSolution: false, 
      solutionMessage: '', 
      pastedText: '', 
      selectedCell: { row: -1, col: -1 }
    });
    if (this.data.showCandidates) this.calculateCandidates();
  },

  calculateCandidates() {
    if (!this.data.showCandidates) return;
    console.log('开始计算候选数...');
    
    const board = this.data.board;
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(board[r][c].value ? parseInt(board[r][c].value, 10) : 0);
      }
      grid.push(row);
    }
    
    // 使用与生成器相同的 toDisplayBoard 函数
    const displayBoard = sudoku.toDisplayBoard(grid, true);
    
    // 更新棋盘数据
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        board[r][c].candidates = displayBoard[r][c].candidates;
      }
    }
    
    this.setData({ board: board });
  },

  // 点击格子
  onCellTap(e) {
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    const cell = this.data.board[row][col];
    
    // 如果是固定格子，不允许编辑
    if (cell.fixed) return;
    
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
    
    board[row][col].value = String(num);
    this.setData({ 
      board: board, 
      showInputPanel: false,
      hasSolution: false, 
      solutionMessage: '' 
    });
    this.calculateCandidates();
  },

  // 清除格子
  onClearCell() {
    const { row, col } = this.data.selectedCell;
    const board = this.data.board;
    
    board[row][col].value = '';
    this.setData({ 
      board: board, 
      showInputPanel: false,
      hasSolution: false, 
      solutionMessage: '' 
    });
    this.calculateCandidates();
  },

  // 关闭输入面板
  closeInputPanel() {
    this.setData({ showInputPanel: false });
  },

  clearBoard() {
    this.initBoard();
  },

  solveSudoku() {
    if (this.data.solving) return;
    this.setData({ solving: true, solutionMessage: '' });
    setTimeout(() => {
      const rawBoard = [];
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
          row.push(this.data.board[r][c].value ? parseInt(this.data.board[r][c].value, 10) : 0);
        }
        rawBoard.push(row);
      }
      if (!sudoku.isValidInput(rawBoard)) {
        this.setData({ solving: false, hasSolution: false, solutionMessage: '输入无效' });
        utils.showText('输入无效');
        return;
      }
      let solved = sudoku.solveWithConstraintPropagation(rawBoard.map(r => [...r]));
      if (!solved) {
        solved = rawBoard.map(r => [...r]);
        if (!sudoku.solve(solved)) {
          this.setData({ solving: false, hasSolution: false, solutionMessage: '该数独无解' });
          utils.showText('无解');
          return;
        }
      }
      const board = this.data.board;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!board[r][c].fixed) {
            board[r][c].value = String(solved[r][c]);
            board[r][c].candidates = [];
          }
        }
      }
      this.setData({ 
        board: board, 
        solving: false, 
        hasSolution: true, 
        solutionMessage: '求解成功',
        showCandidates: false 
      });
      utils.showSuccess('求解成功');
    }, 60);
  },

  copyBoard() {
    let str = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        str += this.data.board[r][c].value || '.';
      }
    }
    const copyText = str.match(/.{1,9}/g).join('\n');
    wx.setClipboardData({
      data: copyText,
      success: () => utils.showSuccess('已复制'),
      fail: () => utils.showText('复制失败')
    });
  },

  onShareAppMessage() {
    return { title: '数独求解器 - 快速解决数独难题', path: '/packages/math/pages/sudoku-solver/sudoku-solver' };
  },

  onShareTimeline() {
    return { title: '数独求解器 - 快速解决数独难题' };
  }
});
