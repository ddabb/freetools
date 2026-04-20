// 数组迷宫 - 数织Nonogram
// CDN数据加载 · 滑动标记 · 无限关卡 · 自适应屏幕

// ─── 页面配置 ───────────────────────────────────────────────
const SIZES = { easy: 5, medium: 8, hard: 10 };
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const CACHE_PREFIX = 'cdn_nonogram_';

// 获取缓存键
function getCacheKey(difficulty, level) {
  return `${CACHE_PREFIX}${difficulty}_${String(level).padStart(6, '0')}`;
}

Page({
  data: {
    difficulty: 'easy',
    currentLevel: 1,
    grid: [],
    rowHints: [],
    colHints: [],
    answer: [],
    mode: 'fill',
    showWin: false,
    timerText: '0:00',
    filledCount: 0,
    totalFill: 0,
    cellPx: 40,      // px
    hintPx: 50,      // px
    boardPx: 300,    // px
    loading: false,
  },

  // 实例属性（不放入 data 避免不必要渲染）
  _timer: null,
  _seconds: 0,
  _timerRunning: false,
  _gridSize: 5,
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

  // ─── 难度 / 模式 ──────────────────────────────────────────
  setDifficulty(e) {
    const d = e.currentTarget.dataset.diff;
    if (d === this.data.difficulty) return;
    this.setData({ difficulty: d });
    this.newGame(1);
  },

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  // ─── 从 CDN 加载谜题（带缓存） ─────────────────────────────
  async loadPuzzle(difficulty, level) {
    return new Promise((resolve, reject) => {
      const cacheKey = getCacheKey(difficulty, level);
      const cached = wx.getStorageSync(cacheKey);
      
      if (cached) {
        console.debug('[nonogram] 使用缓存数据:', difficulty, level);
        resolve(cached);
        return;
      }

      const filename = `${difficulty}-${String(level).padStart(6, '0')}.json`;
      const url = `${CDN_BASE}/nonogram/${difficulty}/${filename}`;

      wx.request({
        url,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            console.debug('[nonogram] CDN数据加载成功，保存到缓存');
            wx.setStorageSync(cacheKey, res.data);
            resolve(res.data);
          } else {
            reject(new Error('Failed to load puzzle'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // ─── 新游戏 ───────────────────────────────────────────────
  async newGame(level) {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0;
    this._timerRunning = false;

    this.setData({ loading: true });

    try {
      const difficulty = this.data.difficulty;
      const puzzle = await this.loadPuzzle(difficulty, level);
      const size = puzzle.size;
      this._gridSize = size;

      // 自适应布局计算（全用 px）
      this._calcLayout(puzzle.rowHints, puzzle.colHints, size);

      const grid = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => ({ s: 0 }))  // 0=空 1=填 2=标记
      );
      let totalFill = 0;
      puzzle.answer.forEach(r => r.forEach(v => { if (v) totalFill++; }));

      this.setData({
        currentLevel: level, grid, answer: puzzle.answer,
        rowHints: puzzle.rowHints, colHints: puzzle.colHints,
        showWin: false, timerText: '0:00', filledCount: 0, totalFill, loading: false,
      });
    } catch (err) {
      console.error('加载谜题失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  _calcLayout(rowHints, colHints, size) {
    const sys = wx.getSystemInfoSync();
    const W = sys.windowWidth;
    const H = sys.windowHeight;
    const dpr = sys.pixelRatio || 2;

    // UI 元素预留高度（px）
    const topH = 56 + 36 + 36; // 难度栏 + 关卡栏 + 模式栏
    const bottomH = 50;         // 操作按钮
    const padX = 16;            // 水平内边距

    // 计算提示区域大小
    const numFont = 11; // 提示数字字号 px
    let maxRowLen = 0, maxColLen = 0;
    rowHints.forEach(h => { if (h.length > maxRowLen) maxRowLen = h.length; });
    colHints.forEach(h => { if (h.length > maxColLen) maxColLen = h.length; });

    const hintCellW = numFont + 5;  // 每个提示数字宽度
    const hintCellH = numFont + 3;  // 每个提示数字高度
    const hintGap = 2;

    const rowHintW = Math.max(40, maxRowLen * (hintCellW + hintGap) + 6);
    const colHintH = Math.max(20, maxColLen * hintCellH + 6);

    const gap = 1.5;

    // 根据宽度计算格子大小
    const availW = W - padX * 2 - rowHintW;
    const cellFromW = Math.floor((availW - (size - 1) * gap) / size);

    // 根据高度计算格子大小
    const availH = H - topH - bottomH - colHintH - 8;
    const cellFromH = Math.floor((availH - (size - 1) * gap) / size);

    // 取较小值，限制范围
    const cellPx = Math.max(22, Math.min(cellFromW, cellFromH, 52));
    const boardPx = rowHintW + size * cellPx + (size - 1) * gap;

    this.setData({ cellPx, hintPx: rowHintW, boardPx });
  },

  // ─── 触摸事件 ─────────────────────────────────────────────
  onTouchStart(e) {
    const { row, col } = e.currentTarget.dataset;
    const r = Number(row), c = Number(col);

    // 缓存棋盘位置（供 onTouchMove 使用）
    const query = wx.createSelectorQuery().in(this);
    query.select('.board').boundingClientRect();
    query.select('.col-hints-row').boundingClientRect();
    query.exec(res => {
      if (res[0]) this._boardRect = res[0];
      if (res[1]) this._colHintBottom = res[1].bottom;
    });

    const cell = this.data.grid[r][c];
    const mode = this.data.mode;
    let op;
    if (mode === 'fill') op = cell.s === 1 ? 0 : 1;       // 填充 / 清除
    else op = cell.s === 2 ? 0 : 2;                        // 标记 / 清除

    this._swipeOp = op;
    this._swiped = {};
    this._swiped[`${r}_${c}`] = true;

    this._startTimer();
    this._doOp(r, c, op);
  },

  onTouchMove(e) {
    if (!this._swipeOp || !this._boardRect) return;
    const touch = e.touches[0];
    const br = this._boardRect;
    const size = this._gridSize;
    const gap = 1.5;
    const step = this.data.cellPx + gap;

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
    const grid = this.data.grid.map(row => row.map(cell => ({ s: cell.s })));
    const old = grid[r][c].s;
    if (old === op) return; // 无变化
    grid[r][c].s = op;

    let filledCount = 0;
    grid.forEach(row => row.forEach(cell => { if (cell.s === 1) filledCount++; }));
    this.setData({ grid, filledCount });

    // 判断通关
    const { answer } = this.data;
    let win = true;
    for (let rr = 0; rr < this._gridSize && win; rr++)
      for (let cc = 0; cc < this._gridSize && win; cc++)
        if ((grid[rr][cc].s === 1) !== (answer[rr][cc] === 1)) win = false;
    if (win) {
      if (this._timer) clearInterval(this._timer);
      this.setData({ showWin: true });
    }
  },

  // ─── 撤销 / 重置 / 下一关 ─────────────────────────────────
  undo() { this.newGame(this.data.currentLevel); },
  reset() { this.newGame(this.data.currentLevel); },
  nextLevel() { this.setData({ showWin: false }); this.newGame(this.data.currentLevel + 1); },
  closeWin() { this.setData({ showWin: false }); },

  // ─── 计时器 ───────────────────────────────────────────────
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
