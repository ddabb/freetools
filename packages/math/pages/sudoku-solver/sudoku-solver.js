// packages/math/pages/sudoku-solver/sudoku-solver.js
const sudoku = require('../../utils/sudoku');
const utils = require('../../../../utils/index');
const { playSound } = utils;
const XLSX = require('wechat-xlsx');

// CDN 数据源地址
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const DAILY_CACHE_PREFIX = 'cdn_daily_sudoku_';
const DAILY_TS_PREFIX = 'cdn_daily_sudoku_ts_';
const MIN_DAILY_DATE = '2025-01-01';
const MAX_DAILY_DATE = '2030-12-31';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateValue(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeDateValue(input) {
  if (input instanceof Date) {
    return formatDateValue(input);
  }

  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    if (/^\d{8}$/.test(input)) {
      return `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
    }
  }

  return formatDateValue(new Date());
}

function formatDateKey(dateValue) {
  return normalizeDateValue(dateValue).replace(/-/g, '');
}

function buildDailyDisplay(dateValue) {
  const normalized = normalizeDateValue(dateValue);
  const [year, month, day] = normalized.split('-');
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function getDailyCacheKey(dateValue) {
  return `${DAILY_CACHE_PREFIX}${formatDateKey(dateValue)}`;
}

function getDailyCacheTsKey(dateValue) {
  return `${DAILY_TS_PREFIX}${formatDateKey(dateValue)}`;
}

Page({
  data: {
    board: [],
    solving: false,
    hasSolution: false,
    solutionMessage: '',
    importMode: 'paste',
    pastedText: '',
    showCandidates: false,
    selectedCell: { row: -1, col: -1 },
    mode: 'daily', // daily | paste
    selectedDate: formatDateValue(new Date()),
    todayDate: formatDateValue(new Date()),
    minDailyDate: MIN_DAILY_DATE,
    maxDailyDate: MAX_DAILY_DATE,
    dailyTitle: '',
    dailyLevel: '',
    dailyDifficulty: '',
    dailyDisplayDate: buildDailyDisplay(new Date()),
  },

  onLoad() {
    this.initBoard();
    wx.setNavigationBarTitle({ title: '数独求解器' });
    this.loadDailySudoku(this.data.selectedDate);
  },

  // 加载指定日期的每日数独(带缓存功能)
  loadDailySudoku(targetDate = this.data.selectedDate) {
    const dateValue = normalizeDateValue(targetDate);
    const dateKey = formatDateKey(dateValue);
    const cacheKey = getDailyCacheKey(dateValue);
    const cacheTsKey = getDailyCacheTsKey(dateValue);
    const cached = wx.getStorageSync(cacheKey);

    this.setData({
      selectedDate: dateValue,
      dailyDisplayDate: buildDailyDisplay(dateValue)
    });

    if (cached && cached.puzzle) {
      console.debug('[daily-sudoku] 使用日期缓存:', dateValue);
      this.setTodaySudoku(cached, dateValue);
      return;
    }

    wx.showLoading({ title: '加载数独中...' });
    console.debug(`[daily-sudoku] 从CDN加载: ${CDN_BASE}/sudoku/${dateKey}.json`);
    console.debug(`[daily-sudoku] 目标日期: ${dateValue}`);

    wx.request({
      url: `${CDN_BASE}/sudoku/${dateKey}.json`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        wx.hideLoading();
        console.debug(`[daily-sudoku] CDN响应状态码: ${res.statusCode}`);
        if (res.statusCode === 200 && res.data && res.data.puzzle) {
          console.debug('[daily-sudoku] CDN数据加载成功,保存到缓存');
          console.debug('[daily-sudoku] 题目名称:', res.data.name);
          console.debug('[daily-sudoku] 难度:', res.data.level, res.data.difficulty);
          wx.setStorageSync(cacheKey, res.data);
          wx.setStorageSync(cacheTsKey, Date.now());
          this.setTodaySudoku(res.data, dateValue);
        } else if (res.statusCode === 404) {
          console.warn('[daily-sudoku] CDN没有对应日期的数据,生成备用题目');
          this.generateRandomSudoku(dateValue);
        } else {
          console.warn('[daily-sudoku] CDN数据格式错误,使用备用题目');
          this.generateRandomSudoku(dateValue);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.warn('[daily-sudoku] CDN加载失败', err);
        console.debug('[daily-sudoku] 使用备用题目');
        this.generateRandomSudoku(dateValue);
      }
    });
  },

  // 设置每日数独
  setTodaySudoku(data, selectedDate = this.data.selectedDate) {
    if (data && data.puzzle) {
      const dateValue = normalizeDateValue(selectedDate);
      this.loadPuzzle(data.puzzle);
      this.setData({
        mode: 'daily',
        selectedDate: dateValue,
        dailyDisplayDate: buildDailyDisplay(dateValue),
        dailyTitle: data.name || `${buildDailyDisplay(dateValue)}数独`,
        dailyLevel: data.level || '',
        dailyDifficulty: data.difficulty || ''
      });
    }
  },

  // 本地备用每日数独
  useLocalDailySudoku(targetDate = this.data.selectedDate) {
    const dateValue = normalizeDateValue(targetDate);
    const [year, month, day] = dateValue.split('-');

    const localData = {
      date: dateValue,
      name: `${year}年${Number(month)}月${Number(day)}日数独`,
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

    this.setTodaySudoku(localData, dateValue);
  },

  // 随机生成数独题目
  generateRandomSudoku(targetDate = this.data.selectedDate) {
    const dateValue = normalizeDateValue(targetDate);
    const [year, month, day] = dateValue.split('-');

    console.debug('[daily-sudoku] 开始生成备用数独题目:', dateValue);

    try {
      const fullBoard = sudoku.generateFullBoard();
      const generatedPuzzle = sudoku.createPuzzle(fullBoard, 40);

      const randomData = {
        date: dateValue,
        name: `${year}年${Number(month)}月${Number(day)}日备用数独`,
        level: '★★☆☆☆',
        difficulty: '中等',
        puzzle: generatedPuzzle,
        emptyCells: 40
      };

      console.debug('[daily-sudoku] 备用题目生成成功');
      this.setTodaySudoku(randomData, dateValue);
      utils.showText('该日期暂无预置题目,已为你生成备用数独');
    } catch (error) {
      console.error('[daily-sudoku] 备用题目生成失败:', error);
      console.debug('[daily-sudoku] 使用本地备用数独');
      this.useLocalDailySudoku(dateValue);
      utils.showText('该日期加载失败,已切换为本地备用数独');
    }
  },

  onDailyDateChange(e) {
    const selectedDate = normalizeDateValue(e.detail.value);
    this.loadDailySudoku(selectedDate);
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });

    if (mode === 'daily') {
      this.loadDailySudoku(this.data.selectedDate);
    } else if (mode === 'paste') {
      this.setData({ pastedText: '' });
    }
  },


  initBoard() {
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push({
          value: '',
          fixed: false,
          candidates: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          showCandidates: false
        });
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
    const showCandidates = e && e.detail && typeof e.detail.value === 'boolean'
      ? e.detail.value
      : !this.data.showCandidates;
    this.setData({ showCandidates: showCandidates });
    if (showCandidates) {
      this.calculateCandidates();
    }
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
        const isEmpty = num === 0;
        row.push({
          value: isEmpty ? '' : String(num),
          fixed: !isEmpty,
          candidates: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          showCandidates: false
        });
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
    if (!this.data.showCandidates) {
      console.debug('[候选数] showCandidates 为 false,直接返回');
      return;
    }

    try {
      console.debug('[候选数] ========== 开始计算候选数 ==========');

      const board = this.data.board;
      console.debug('[候选数] board 类型:', typeof board, Array.isArray(board));
      console.debug('[候选数] board 长度:', board ? board.length : 'undefined');

      const grid = [];
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
          const cell = board[r][c];
          const val = cell && cell.value ? parseInt(cell.value, 10) : 0;
          row.push(val);
        }
        grid.push(row);
      }
      console.debug('[候选数] grid 构建完成');

      // 使用与生成器相同的 toDisplayBoard 函数
      const displayBoard = sudoku.toDisplayBoard(grid, true);
      console.debug('[候选数] toDisplayBoard 完成');
      console.debug('[候选数] displayBoard[0][0]:', JSON.stringify(displayBoard[0][0]));

      // 更新棋盘数据(同步候选数和显示状态)
      let emptyCellCount = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          board[r][c].candidates = displayBoard[r][c].candidates;
          board[r][c].showCandidates = displayBoard[r][c].showCandidates;
          if (board[r][c].showCandidates) emptyCellCount++;
        }
      }
      console.debug('[候选数] 更新完成,空格数量:', emptyCellCount);

      this.setData({ board: board }, () => {
        console.debug('[候选数] setData 回调完成');
      });
    } catch (err) {
      console.error('[候选数] 发生错误:', err.message, err.stack);
    }
  },

  // 点击格子
  onCellTap(e) {
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    const cell = this.data.board[row][col];

    // 如果是固定格子,不允许编辑
    if (cell.fixed) return;

    // 选中格子(固定底部面板一直显示)
    this.setData({
      selectedCell: { row, col }
    });
  },

  // 输入数字
  onNumberInput(e) {
    const num = e.currentTarget.dataset.num;
    const { row, col } = this.data.selectedCell;

    // 检查是否选中格子
    if (row === undefined || row === -1) {
      utils.showText('请先点击格子');
      return;
    }

    const board = this.data.board;
    board[row][col].value = String(num);
    playSound('click', { pageId: 'sudoku-solver' });
    this.setData({ 
      board: board, 
      hasSolution: false, 
      solutionMessage: '' 
    });
    this.calculateCandidates();
  },

  // 清除格子
  onClearCell() {
    const { row, col } = this.data.selectedCell;

    // 检查是否选中格子
    if (row === undefined || row === -1) {
      utils.showText('请先点击格子');
      return;
    }

    const board = this.data.board;
    board[row][col].value = '';
    this.setData({
      board: board,
      hasSolution: false,
      solutionMessage: ''
    });
    this.calculateCandidates();
  },

  // 点击候选数填入
  onCandidateTap(e) {
    const row = e.currentTarget.dataset.row;
    const col = e.currentTarget.dataset.col;
    const num = e.currentTarget.dataset.num;
    const board = this.data.board;

    // 检查该候选数是否存在
    if (board[row][col].candidates && board[row][col].candidates.includes(num)) {
      board[row][col].value = String(num);
      board[row][col].candidates = [];
      this.setData({
        board: board,
        selectedCell: { row, col },
        hasSolution: false,
        solutionMessage: ''
      });
      this.calculateCandidates();
    }
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
        this.setData({ solving: false, hasSolution: false, solutionMessage: '' });
        utils.showText('输入无效');
        return;
      }
      const solved = rawBoard.map(r => [...r]);
      if (!sudoku.solve(solved)) {
        this.setData({ solving: false, hasSolution: false, solutionMessage: '该数独无解' });
        utils.showText('无解');
        return;
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
      playSound('win', { pageId: 'sudoku-solver' });
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

  // 导出到Excel(优化边框和背景色)
  exportExcel() {
    const { board } = this.data;

    // 构建9x9棋盘数据
    const aoa = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(board[r][c].value ? parseInt(board[r][c].value, 10) : '');
      }
      aoa.push(row);
    }

    // 导出(带优化边框和背景色)
    this._exportSudokuWithBorder(aoa, `sudoku_${Date.now()}.xlsx`);
  },

  // 导出题目和答案(两个工作表)
  exportPuzzleAndSolution() {
    const { board } = this.data;

    // 构建题目数据(只包含原始题目数字)
    const puzzleAoa = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        if (board[r][c].fixed) {
          row.push(parseInt(board[r][c].value, 10));
        } else {
          row.push('');
        }
      }
      puzzleAoa.push(row);
    }

    // 构建答案数据(先求解数独,然后显示完整答案)
    const solutionAoa = this._getSolvedBoard();

    // 如果求解失败,提示用户
    if (this._isBoardEmpty(solutionAoa)) {
      wx.showModal({
        title: '提示',
        content: '数独求解失败,无法导出答案。请检查输入是否正确。',
        confirmText: '确定',
        showCancel: false,
        success: () => {
          // 用户确认后不进行导出
        }
      });
      return;
    }

    // 直接导出题目和答案
    this._exportPuzzleAndSolution(puzzleAoa, solutionAoa, `sudoku_puzzle_solution_${Date.now()}.xlsx`);
  },

  // 导出带优化边框和背景色的数独棋盘
  _exportSudokuWithBorder(aoa, fileName) {
    try {
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      ws['!cols'] = Array(9).fill({ wch: 8 });
      ws['!rows'] = Array(9).fill({ hpt: 40 });

      // 构建完整样式对象(xlsx.full 要求:ARGB颜色 + patternType: 'solid' + 边框颜色)
      const range = XLSX.utils.decode_range('A1:I9');
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) ws[cellRef] = { v: '' };

          const isOriginal = this.data.board[R][C].fixed;

          // 边框样式(所有边都是黑色)
          const borderStyle = {
            top:    { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left:   { style: 'thin', color: { rgb: 'FF000000' } },
            right:  { style: 'thin', color: { rgb: 'FF000000' } }
          };

          // 3x3宫格右/下边界加粗
          if (C === 2 || C === 5) borderStyle.right  = { style: 'medium', color: { rgb: 'FF000000' } };
          if (R === 2 || R === 5) borderStyle.bottom = { style: 'medium', color: { rgb: 'FF000000' } };
          // 整个棋盘外边框加粗
          if (R === 0) borderStyle.top    = { style: 'medium', color: { rgb: 'FF000000' } };
          if (R === 8) borderStyle.bottom = { style: 'medium', color: { rgb: 'FF000000' } };
          if (C === 0) borderStyle.left   = { style: 'medium', color: { rgb: 'FF000000' } };
          if (C === 8) borderStyle.right  = { style: 'medium', color: { rgb: 'FF000000' } };

          ws[cellRef].s = {
            alignment:  { horizontal: 'center', vertical: 'center' },
            font: {
              name: 'Arial',
              sz:   isOriginal ? 14 : 13,
              bold: isOriginal,
              color: { rgb: 'FF333333' }
            },
            fill: {
              patternType: 'solid',
              fgColor:     { rgb: isOriginal ? 'FFDCE8F5' : 'FFFFFFFF' }  // 固定格浅蓝 / 用户格白色
            },
            border: borderStyle
          };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '数独');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      wx.getFileSystemManager().writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => wx.showToast({ title: '已打开Excel', icon: 'success' }),
            fail: () => wx.showModal({ title: '导出成功', content: `文件已保存为 ${fileName}`, showCancel: false })
          });
        },
        fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
      });
    } catch (err) {
      console.error('[导出Excel] 异常:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  // 导出题目和答案到同一个Excel文件(样式与单sheet导出一致)
  _exportPuzzleAndSolution(puzzleAoa, solutionAoa, fileName) {
    try {
      const wb = XLSX.utils.book_new();

      // 创建题目工作表
      const puzzleWs = XLSX.utils.aoa_to_sheet(puzzleAoa);
      puzzleWs['!cols'] = Array(9).fill({ wch: 8 });
      puzzleWs['!rows'] = Array(9).fill({ hpt: 40 });

      // 创建答案工作表
      const solutionWs = XLSX.utils.aoa_to_sheet(solutionAoa);
      solutionWs['!cols'] = Array(9).fill({ wch: 8 });
      solutionWs['!rows'] = Array(9).fill({ hpt: 40 });

      // 应用题目样式(与单sheet导出风格一致:固定格浅蓝/空格白色)
      const puzzleRange = XLSX.utils.decode_range('A1:I9');
      for (let R = puzzleRange.s.r; R <= puzzleRange.e.r; R++) {
        for (let C = puzzleRange.s.c; C <= puzzleRange.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!puzzleWs[cellRef]) puzzleWs[cellRef] = { v: '' };

          const isOriginal = puzzleAoa[R][C] !== '';  // 题目有数字=原始格
          const borderStyle = this._getSudokuBorderStyle(R, C);
          puzzleWs[cellRef].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            font: {
              name: 'Arial',
              sz:   isOriginal ? 14 : 13,
              bold: isOriginal,
              color: { rgb: isOriginal ? 'FFFFFFFF' : 'FF333333' }
            },
            fill: {
              patternType: 'solid',
              fgColor:     { rgb: isOriginal ? 'FFDCE8F5' : 'FFFFFFFF' }
            },
            border: borderStyle
          };
        }
      }

      // 应用答案样式(固定格样式与题目一致;用户填入格白色)
      const solutionRange = XLSX.utils.decode_range('A1:I9');
      for (let R = solutionRange.s.r; R <= solutionRange.e.r; R++) {
        for (let C = solutionRange.s.c; C <= solutionRange.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!solutionWs[cellRef]) solutionWs[cellRef] = { v: '' };

          const isOriginal = puzzleAoa[R][C] !== '';  // 沿用题目中的原始格信息
          const borderStyle = this._getSudokuBorderStyle(R, C);
          solutionWs[cellRef].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            font: {
              name: 'Arial',
              sz:   isOriginal ? 14 : 13,
              bold: isOriginal,
              color: { rgb: isOriginal ? 'FFFFFFFF' : 'FF333333' }
            },
            fill: {
              patternType: 'solid',
              fgColor:     { rgb: isOriginal ? 'FFDCE8F5' : 'FFFFFFFF' }
            },
            border: borderStyle
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, puzzleWs, '数独题目');
      XLSX.utils.book_append_sheet(wb, solutionWs, '数独答案');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      wx.getFileSystemManager().writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => wx.showToast({ title: '已打开Excel', icon: 'success' }),
            fail: () => wx.showModal({
              title: '导出成功',
              content: `文件已保存为 ${fileName}`,
              showCancel: false
            })
          });
        },
        fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
      });
    } catch (err) {
      console.error('[导出Excel] 异常:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  // 获取数独边框样式(含颜色,xlsx.full 必需)
  _getSudokuBorderStyle(R, C) {
    const borderStyle = {
      top:    { style: 'thin', color: { rgb: 'FF000000' } },
      bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      left:   { style: 'thin', color: { rgb: 'FF000000' } },
      right:  { style: 'thin', color: { rgb: 'FF000000' } }
    };

    // 3x3宫格边框加粗
    if (C === 2 || C === 5) borderStyle.right  = { style: 'medium', color: { rgb: 'FF000000' } };
    if (R === 2 || R === 5) borderStyle.bottom = { style: 'medium', color: { rgb: 'FF000000' } };

    // 整个数独棋盘的外边框加粗
    if (R === 0) borderStyle.top    = { style: 'medium', color: { rgb: 'FF000000' } };
    if (R === 8) borderStyle.bottom = { style: 'medium', color: { rgb: 'FF000000' } };
    if (C === 0) borderStyle.left   = { style: 'medium', color: { rgb: 'FF000000' } };
    if (C === 8) borderStyle.right  = { style: 'medium', color: { rgb: 'FF000000' } };

    return borderStyle;
  },

  // 获取求解后的数独棋盘数据
  _getSolvedBoard() {
    const { board } = this.data;

    // 如果已经求解,直接返回当前棋盘数据
    if (this.data.hasSolution) {
      const solutionAoa = [];
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let c = 0; c < 9; c++) {
          row.push(board[r][c].value ? parseInt(board[r][c].value, 10) : '');
        }
        solutionAoa.push(row);
      }
      return solutionAoa;
    }

    // 如果没有求解,进行求解
    const rawBoard = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(board[r][c].value ? parseInt(board[r][c].value, 10) : 0);
      }
      rawBoard.push(row);
    }

    // 检查输入是否有效
    if (!sudoku.isValidInput(rawBoard)) {
      utils.showText('数独输入无效,无法求解');
      return this._getEmptyBoard();
    }

    // 尝试求解
    const solved = rawBoard.map(r => [...r]);
    if (!sudoku.solve(solved)) {
      utils.showText('该数独无解');
      return this._getEmptyBoard();
    }

    // 构建答案数据
    const solutionAoa = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(solved[r][c] || '');
      }
      solutionAoa.push(row);
    }

    return solutionAoa;
  },

  // 获取空棋盘数据
  _getEmptyBoard() {
    const emptyBoard = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push('');
      }
      emptyBoard.push(row);
    }
    return emptyBoard;
  },

  // 检查棋盘是否为空
  _isBoardEmpty(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== '') {
          return false;
        }
      }
    }
    return true;
  },

  onShareAppMessage() {
    return { title: '数独求解器 - 快速解决数独难题', path: '/packages/math/pages/sudoku-solver/sudoku-solver' };
  },

  onShareTimeline() {
    return { title: '数独求解器 - 快速解决数独难题' };
  }
});