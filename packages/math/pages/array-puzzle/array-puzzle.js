// 数组迷宫 - 数织Nonogram
// 唯一解生成 · 滑动标记 · 无限关卡 · 自适应屏幕

// ─── 工具函数 ───────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function calcHints(line) {
  const h = [];
  let c = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i]) { c++; }
    else if (c) { h.push(c); c = 0; }
  }
  if (c) h.push(c);
  return h.length ? h : [0];
}

// ─── 唯一解验证 ─────────────────────────────────────────────
function hasUniqueSolution(rowHints, colHints, size) {
  const board = Array.from({ length: size }, () => new Array(size).fill(0));

  function lineSolve(hints, line) {
    const n = line.length;
    const result = new Array(n).fill(0);
    const total = hints.reduce((a, b) => a + b, 0) + hints.length - 1;
    if (total > n) return result;
    const placements = [];
    function place(idx, pos, cur) {
      if (idx === hints.length) {
        const full = cur.slice();
        for (let i = pos; i < n; i++) full[i] = -1;
        placements.push(full);
        return;
      }
      const len = hints[idx];
      const maxP = n - (hints.slice(idx).reduce((a, b) => a + b, 0) + hints.length - idx - 1);
      for (let p = pos; p <= maxP; p++) {
        const c2 = cur.slice();
        for (let i = pos; i < p; i++) c2[i] = -1;
        for (let i = p; i < p + len; i++) c2[i] = 1;
        place(idx + 1, p + len + 1, c2);
      }
    }
    place(0, 0, new Array(n).fill(0));
    if (!placements.length) return result;
    const valid = placements.filter(p => p.every((v, i) => line[i] === 0 || line[i] === v));
    if (!valid.length) return null;
    for (let i = 0; i < n; i++) {
      const vals = valid.map(p => p[i]);
      if (vals.every(v => v === 1)) result[i] = 1;
      else if (vals.every(v => v === -1)) result[i] = -1;
    }
    return result;
  }

  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < size; r++) {
        const res = lineSolve(rowHints[r], board[r].slice());
        if (!res) return false;
        for (let c = 0; c < size; c++) {
          if (res[c] !== 0 && board[r][c] === 0) { board[r][c] = res[c]; changed = true; }
        }
      }
      for (let c = 0; c < size; c++) {
        const col = board.map(r => r[c]);
        const res = lineSolve(colHints[c], col);
        if (!res) return false;
        for (let r = 0; r < size; r++) {
          if (res[r] !== 0 && board[r][c] === 0) { board[r][c] = res[r]; changed = true; }
        }
      }
    }
    return true;
  }

  let count = 0;
  function bt() {
    if (count >= 2) return;
    if (!propagate()) return;
    let fr = -1, fc = -1;
    for (let r = 0; r < size && fr === -1; r++)
      for (let c = 0; c < size; c++)
        if (board[r][c] === 0) { fr = r; fc = c; break; }
    if (fr === -1) { count++; return; }
    const saved = board.map(r => r.slice());
    board[fr][fc] = 1; bt();
    if (count >= 2) { for (let r = 0; r < size; r++) board[r] = saved[r]; return; }
    for (let r = 0; r < size; r++) board[r] = saved[r].slice();
    board[fr][fc] = -1; bt();
    for (let r = 0; r < size; r++) board[r] = saved[r];
  }
  bt();
  return count === 1;
}

// ─── 谜题生成 ───────────────────────────────────────────────
function generatePuzzle(size, seed) {
  const rand = seededRand(seed);
  const density = size <= 5 ? 0.55 : size <= 8 ? 0.5 : 0.45;
  for (let attempt = 0; attempt < 300; attempt++) {
    const answer = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rand() < density ? 1 : 0)
    );
    let ok = true;
    for (let r = 0; r < size; r++) if (!answer[r].some(v => v)) { ok = false; break; }
    if (ok) for (let c = 0; c < size; c++) if (!answer.some(r => r[c])) { ok = false; break; }
    if (!ok) continue;
    const rh = answer.map(row => calcHints(row));
    const ch = Array.from({ length: size }, (_, c) => calcHints(answer.map(r => r[c])));
    if (hasUniqueSolution(rh.map(h => h.slice()), ch.map(h => h.slice()), size)) {
      return { answer, rowHints: rh, colHints: ch };
    }
  }
  // 兜底
  const answer = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => (r + c) % 2));
  return { answer, rowHints: answer.map(r => calcHints(r)), colHints: Array.from({ length: size }, (_, c) => calcHints(answer.map(r => r[c]))) };
}

// ─── 页面配置 ───────────────────────────────────────────────
const SIZES = { easy: 5, medium: 8, hard: 10 };

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

  // ─── 新游戏 ───────────────────────────────────────────────
  newGame(level) {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0;
    this._timerRunning = false;

    const size = SIZES[this.data.difficulty];
    this._gridSize = size;
    const diffKey = this.data.difficulty;
    const seed = level * 31337 + (diffKey === 'easy' ? 1 : diffKey === 'medium' ? 1000 : 2000);
    const puzzle = generatePuzzle(size, seed);

    // 自适应布局计算（全用 px）
    this._calcLayout(puzzle.rowHints, puzzle.colHints, size);

    const grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ s: 0 }))  // 0=空 1=填 2=标记
    );
    let totalFill = 0;
    puzzle.answer.forEach(r => r.forEach(v => { if (v) totalFill++; }));

    this.setData({
      level, grid, answer: puzzle.answer,
      rowHints: puzzle.rowHints, colHints: puzzle.colHints,
      showWin: false, timerText: '0:00', filledCount: 0, totalFill,
    });
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
