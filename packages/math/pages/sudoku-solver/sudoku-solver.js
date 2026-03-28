// packages/math/pages/sudoku-solver/sudoku-solver.js
const sudoku = require('../../utils/sudoku');
const utils = require('../../../../utils/index');

// 预设数独题目
const presetList = [
  { name: '入门', level: '★☆☆☆☆', puzzle: [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]] },
  { name: '初级', level: '★★☆☆☆', puzzle: [[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]] },
  { name: '中级', level: '★★★☆☆', puzzle: [[0,2,0,6,0,0,8,0,0],[5,8,0,0,0,9,7,0,0],[0,0,0,0,4,0,0,0,0],[3,7,0,0,0,0,5,0,0],[6,0,0,0,0,0,0,0,4],[0,0,8,0,0,0,0,1,3],[0,0,0,0,2,0,0,0,0],[0,0,9,8,0,0,0,3,6],[0,0,0,0,0,0,0,9,0]] },
  { name: '高级', level: '★★★★☆', puzzle: [[0,0,0,0,0,0,2,0,0],[0,0,0,6,0,0,0,0,3],[0,7,4,8,0,0,0,0,0],[8,0,0,0,0,1,0,0,0],[0,4,6,0,0,0,7,0,0],[0,0,0,3,0,0,0,0,5],[0,0,0,0,0,9,6,0,0],[9,0,0,0,0,3,0,0,0],[0,0,1,0,0,0,0,0,0]] },
  { name: '骨灰级', level: '★★★★★', puzzle: [[0,0,0,0,0,0,0,1,2],[0,0,0,0,0,0,0,0,3],[0,0,2,3,0,0,4,0,0],[0,0,1,8,0,0,0,9,0],[0,5,0,0,9,0,0,4,0],[0,4,0,0,0,6,7,0,0],[0,0,8,5,0,0,9,0,0],[2,0,0,0,0,0,0,0,0],[9,1,0,0,0,0,5,0,0]] }
];

Page({
  data: {
    board: [],
    solving: false,
    hasSolution: false,
    solutionMessage: '',
    importMode: 'paste',
    pastedText: '',
    presetList: presetList,
    selectedPreset: -1,
    showCandidates: false,
    showInputPanel: false,
    selectedCell: { row: -1, col: -1 }
  },

  onLoad() {
    this.initBoard();
    wx.setNavigationBarTitle({ title: '数独求解器' });
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

  selectPreset(e) {
    this.setData({ selectedPreset: e.currentTarget.dataset.index });
  },

  importPreset() {
    const index = this.data.selectedPreset;
    if (index < 0) { utils.showText('请先选择题目'); return; }
    this.loadPuzzle(presetList[index].puzzle);
    utils.showSuccess('已加载');
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
      selectedPreset: -1,
      selectedCell: { row: -1, col: -1 }
    });
    if (this.data.showCandidates) this.calculateCandidates();
  },

  calculateCandidates() {
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
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          board[r][c].candidates = candidates[r][c];
        } else {
          board[r][c].candidates = [];
        }
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

  // 点击候选数
  onCandidateTap(e) {
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    const num = e.currentTarget.dataset.num;
    const board = this.data.board;
    
    if (board[row][col].candidates.indexOf(num) !== -1) {
      board[row][col].value = String(num);
      board[row][col].candidates = [];
      this.setData({ board: board, hasSolution: false, solutionMessage: '' });
      this.calculateCandidates();
    }
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
