// 数织 Nonogram - CDN版
// 支持：CDN关卡 · 滑动标记 · 已完成关卡记录

const SIZES = { easy: 5, medium: 8, hard: 10 };
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const DIFF_TEXT = { easy: '简单 5×5', medium: '中等 8×8', hard: '困难 10×10' };
const RECORDS_KEY = 'nonogram_records_v3';

function getRecords() {
  try { return JSON.parse(wx.getStorageSync(RECORDS_KEY) || '{}'); }
  catch { return {}; }
}

function saveRecord(difficulty, level, bestTime) {
  const records = getRecords();
  const key = `${difficulty}_${level}`;
  if (!records[key] || bestTime < records[key]) {
    records[key] = bestTime;
    wx.setStorageSync(RECORDS_KEY, JSON.stringify(records));
  }
}

function getCompletedLevels(difficulty) {
  const records = getRecords();
  const completed = [];
  for (const key in records) {
    if (key.startsWith(`${difficulty}_`)) {
      const lvl = parseInt(key.split('_')[1]);
      if (!isNaN(lvl)) completed.push(lvl);
    }
  }
  return completed.sort((a, b) => a - b);
}

Page({
  data: {
    difficulty: 'easy',
    difficultyText: '简单 5×5',
    currentLevel: 1,
    colHints: [],
    rowHints: [],
    answer: [],
    gridSize: 5,
    rowGroups: [],   // [{rowIdx, cells: [{s, rowIdx, colIdx}]}]
    mode: 'fill',
    showWin: false,
    timerText: '0:00',
    filledCount: 0,
    totalFill: 0,
    cellPx: 40,
    hintPx: 50,
    colHintH: 22,
    boardPx: 300,
    loading: false,
    showLevelSelector: false,
    completedCount: 0,
    levelNumbers: [],
  },

  _timer: null,
  _seconds: 0,
  _timerRunning: false,
  _swipeOp: null,
  _swiped: null,
  _boardRect: null,
  _colHintBottom: 0,

  onLoad() {
    this.newGame(1);
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  // ─── 难度 ────────────────────────────────────────────────
  setDifficulty(e) {
    const d = e.currentTarget.dataset.diff;
    if (d === this.data.difficulty) return;
    this.setData({ difficulty: d, difficultyText: DIFF_TEXT[d] });
    this.newGame(1);
  },

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  // ─── 加载关卡 ───────────────────────────────────────────
  async loadPuzzle(difficulty, level) {
    const cacheKey = `cdn_nonogram_${difficulty}_${String(level).padStart(4, '0')}`;
    const cached = wx.getStorageSync(cacheKey);
    if (cached) return cached;
    const filename = `${difficulty}-${String(level).padStart(4, '0')}.json`;
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${CDN_BASE}/nonogram/${filename}`,
        method: 'GET', timeout: 8000,
        success: res => {
          if (res.statusCode === 200) {
            wx.setStorageSync(cacheKey, res.data);
            resolve(res.data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        },
        fail: reject
      });
    });
  },

  // ─── 新游戏 ─────────────────────────────────────────────
  async newGame(level) {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0;
    this._timerRunning = false;
    this.setData({ loading: true, showWin: false });

    try {
      const difficulty = this.data.difficulty;
      const puzzle = await this.loadPuzzle(difficulty, level);
      const size = puzzle.size;

      this._calcLayout(puzzle.rowHints, puzzle.colHints, size);

      // 构建行组：每个cell带自己的rowIdx和colIdx
      const rowGroups = [];
      for (let r = 0; r < size; r++) {
        const cells = [];
        for (let c = 0; c < size; c++) {
          cells.push({ s: 0, rowIdx: r, colIdx: c });
        }
        rowGroups.push({ rowIdx: r, cells });
      }

      let totalFill = 0;
      puzzle.answer.forEach(r => r.forEach(v => { if (v) totalFill++; }));

      const completed = getCompletedLevels(difficulty);

      this.setData({
        currentLevel: level,
        colHints: puzzle.colHints,
        rowHints: puzzle.rowHints,
        answer: puzzle.answer,
        gridSize: size,
        rowGroups,
        showWin: false,
        timerText: '0:00',
        filledCount: 0,
        totalFill,
        loading: false,
        completedCount: completed.length,
        showLevelSelector: false,
      });
    } catch (err) {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  _calcLayout(rowHints, colHints, size) {
    const sys = wx.getSystemInfoSync();
    const W = sys.windowWidth, H = sys.windowHeight;
    const topH = 50 + 40 + 36, bottomH = 50, padX = 16;
    const numFont = 11;
    let maxRowLen = 0, maxColLen = 0;
    rowHints.forEach(h => { if (h.length > maxRowLen) maxRowLen = h.length; });
    colHints.forEach(h => { if (h.length > maxColLen) maxColLen = h.length; });
    const rowHintW = Math.max(42, maxRowLen * (numFont + 6) + 8);
    const colHintH = Math.max(22, maxColLen * (numFont + 3) + 6);
    const gap = 1.5;
    const availW = W - padX * 2 - rowHintW;
    const availH = H - topH - bottomH - colHintH - 10;
    const cellPx = Math.max(22, Math.min(Math.floor(availW / size), Math.floor(availH / size), 50));
    const boardPx = rowHintW + size * cellPx + (size - 1) * gap;
    this.setData({ cellPx, hintPx: rowHintW, colHintH, boardPx });
  },

  // ─── 触摸 ───────────────────────────────────────────────
  onTouchStart(e) {
    const { row, col } = e.currentTarget.dataset;
    const r = Number(row), c = Number(col);
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;

    // 缓存棋盘位置
    const query = wx.createSelectorQuery().in(this);
    query.select('.board').boundingClientRect();
    query.select('.col-hints-row').boundingClientRect();
    query.exec(res => {
      if (res[0]) this._boardRect = res[0];
      if (res[1]) this._colHintBottom = res[1].bottom;
    });

    const current = this.data.rowGroups[r].cells[c].s;
    const mode = this.data.mode;
    let op;
    if (mode === 'fill') {
      op = current === 1 ? 0 : 1;   // 填充或清除
    } else {
      op = current === 2 ? 0 : 2;   // 标记或清除
    }

    this._swipeOp = op;
    this._swiped = {};
    this._swiped[`${r}_${c}`] = true;
    this._startTimer();
    this._doOp(r, c, op);
  },

  onTouchMove(e) {
    if (!this._swipeOp || !this._boardRect || this.data.loading) return;
    const touch = e.touches[0];
    const br = this._boardRect;
    const size = this.data.gridSize;
    const step = this.data.cellPx + 1.5;

    const col = Math.floor((touch.clientX - br.left - this.data.hintPx) / step);
    const row = Math.floor((touch.clientY - this._colHintBottom) / step);

    if (row >= 0 && row < size && col >= 0 && col < size) {
      const key = `${row}_${col}`;
      if (!this._swiped[key]) {
        this._swiped[key] = true;
        this._doOp(row, col, this._swipeOp);
      }
    }
  },

  onTouchEnd() {
    this._swipeOp = null;
    this._swiped = null;
  },

  _doOp(r, c, op) {
    if (this.data.loading || !this.data.rowGroups.length) return;
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;

    // 深拷贝行组
    const groups = this.data.rowGroups.map(g => ({
      rowIdx: g.rowIdx,
      cells: g.cells.map(cell => ({ s: cell.s, rowIdx: cell.rowIdx, colIdx: cell.colIdx }))
    }));

    const old = groups[r].cells[c].s;
    if (old === op) return;

    groups[r].cells[c].s = op;

    let filledCount = 0;
    groups.forEach(g => g.cells.forEach(cell => { if (cell.s === 1) filledCount++; }));

    this.setData({ rowGroups: groups, filledCount });

    // 通关判断：所有应该填的格子(answer=1)都填了(s=1)就通关，标记(s=2)不算错
    const { answer, gridSize } = this.data;
    let win = true;
    outer: for (let rr = 0; rr < gridSize && win; rr++) {
      for (let cc = 0; cc < gridSize; cc++) {
        if (answer[rr][cc] === 1 && groups[rr].cells[cc].s !== 1) {
          win = false;
          break outer;
        }
      }
    }

    if (win) {
      if (this._timer) clearInterval(this._timer);
      saveRecord(this.data.difficulty, this.data.currentLevel, this._seconds);
      this.setData({ showWin: true, completedCount: getCompletedLevels(this.data.difficulty).length });
    }
  },

  // ─── 关卡选择器 ─────────────────────────────────────────
  openLevelSelector() {
    const size = SIZES[this.data.difficulty];
    this.setData({
      showLevelSelector: true,
      levelNumbers: Array.from({ length: size }, (_, i) => i + 1)
    });
  },

  closeLevelSelector() {
    this.setData({ showLevelSelector: false });
  },

  selectLevel(e) {
    const lvl = Number(e.currentTarget.dataset.l);
    this.setData({ showLevelSelector: false });
    this.newGame(lvl);
  },

  isCompleted(level) {
    return !!getRecords()[`${this.data.difficulty}_${level}`];
  },

  // ─── 操作 ────────────────────────────────────────────────
  undo() { this.newGame(this.data.currentLevel); },
  nextLevel() { this.setData({ showWin: false }); this.newGame(this.data.currentLevel + 1); },
  closeWin() { this.setData({ showWin: false }); },

  // ─── 计时 ───────────────────────────────────────────────
  _startTimer() {
    if (this._timerRunning) return;
    this._timerRunning = true;
    this._timer = setInterval(() => {
      this._seconds++;
      const m = Math.floor(this._seconds / 60);
      const s = this._seconds % 60;
      this.setData({ timerText: `${m}:${s < 10 ? '0' : ''}${s}` });
    }, 1000);
  }
});
