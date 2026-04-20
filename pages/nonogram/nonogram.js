// 数织 Nonogram - CDN版（约束传播求解器）
const SIZES = { easy: 5, medium: 8, hard: 10 };
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const DIFF_TEXT = { easy: '简单 5x5', medium: '中等 8x8', hard: '困难 10x10' };
const RECORDS_KEY = 'nonogram_records_v4';

function getRecords() {
  try { return JSON.parse(wx.getStorageSync(RECORDS_KEY) || '{}'); } catch(e) { return {}; }
}
function saveRecord(d, lvl, t) {
  const r = getRecords();
  const k = d + '_' + lvl;
  if (!r[k] || t < r[k]) { r[k] = t; wx.setStorageSync(RECORDS_KEY, JSON.stringify(r)); }
}
function getCompleted(d) {
  const r = getRecords(), c = [];
  for (const k in r) { if (k.indexOf(d + '_') === 0) { const v = parseInt(k.split('_')[1]); if (!isNaN(v)) c.push(v); } }
  return c.sort((a, b) => a - b);
}

// 生成一行所有合法排列
function genPlacements(hints, n) {
  if (hints.length === 1 && hints[0] === 0) return [new Array(n).fill(-1)];
  let total = hints.reduce((a, b) => a + b, 0) + hints.length - 1;
  if (total > n) return [];
  const results = [];
  function dfs(idx, pos, cur) {
    if (idx === hints.length) {
      const full = cur.slice();
      for (let i = pos; i < n; i++) full[i] = -1;
      results.push(full);
      return;
    }
    const len = hints[idx];
    let rest = 0;
    for (let j = idx; j < hints.length; j++) rest += hints[j];
    const maxPos = n - (rest + hints.length - idx - 1);
    for (let p = pos; p <= maxPos; p++) {
      const cur2 = cur.slice();
      for (let i = pos; i < p; i++) cur2[i] = -1;
      for (let i = p; i < p + len; i++) cur2[i] = 1;
      dfs(idx + 1, p + len + 1, cur2);
    }
  }
  dfs(0, 0, new Array(n).fill(0));
  return results;
}

// 求解一行
function solveLine(hints, line, n) {
  const placements = genPlacements(hints, n);
  if (!placements.length) return { mustFill: [], mustEmpty: [] };
  const valid = placements.filter(p => p.every((v, i) => line[i] === 0 || line[i] === v));
  if (!valid.length) return { mustFill: [], mustEmpty: [] };
  const mustFill = [], mustEmpty = [];
  for (let i = 0; i < n; i++) {
    const vals = valid.map(p => p[i]);
    if (vals.every(v => v === 1)) mustFill.push(i);
    else if (vals.every(v => v === -1)) mustEmpty.push(i);
  }
  return { mustFill, mustEmpty };
}

// 约束传播
function applyConstraints(grid, rowHints, colHints, size) {
  let any = false;
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < size; r++) {
      const line = grid[r].map(c => c === 1 ? 1 : c === 2 ? -1 : 0);
      const { mustFill, mustEmpty } = solveLine(rowHints[r], line, size);
      for (const c of mustFill) { if (grid[r][c] === 0) { grid[r][c] = 1; changed = true; any = true; } }
      for (const c of mustEmpty) { if (grid[r][c] === 0) { grid[r][c] = 2; changed = true; any = true; } }
    }
    for (let c = 0; c < size; c++) {
      const line = [];
      for (let r = 0; r < size; r++) line.push(grid[r][c] === 1 ? 1 : grid[r][c] === 2 ? -1 : 0);
      const { mustFill, mustEmpty } = solveLine(colHints[c], line, size);
      for (const r of mustFill) { if (grid[r][c] === 0) { grid[r][c] = 1; changed = true; any = true; } }
      for (const r of mustEmpty) { if (grid[r][c] === 0) { grid[r][c] = 2; changed = true; any = true; } }
    }
  }
  return any;
}

Page({
  data: {
    difficulty: 'easy',
    difficultyText: '简单 5x5',
    currentLevel: 1,
    colHints: [],
    rowHints: [],
    answer: [],
    gridSize: 5,
    grid: [],
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

  onLoad() { this.newGame(1); },
  onUnload() { if (this._timer) clearInterval(this._timer); },

  setDifficulty(e) {
    const d = e.currentTarget.dataset.diff;
    if (d === this.data.difficulty) return;
    this.setData({ difficulty: d, difficultyText: DIFF_TEXT[d] });
    this.newGame(1);
  },
  setMode(e) { this.setData({ mode: e.currentTarget.dataset.mode }); },

  loadPuzzle(difficulty, level) {
    const key = 'cdn_nonogram_' + difficulty + '_' + String(level).padStart(4, '0');
    const cached = wx.getStorageSync(key);
    if (cached) return Promise.resolve(cached);
    const filename = difficulty + '-' + String(level).padStart(4, '0') + '.json';
    return new Promise((resolve, reject) => {
      wx.request({ url: CDN_BASE + '/nonogram/' + filename, method: 'GET', timeout: 8000,
        success: r => { if (r.statusCode === 200) { wx.setStorageSync(key, r.data); resolve(r.data); } else reject(new Error('HTTP' + r.statusCode)); },
        fail: reject
      });
    });
  },

  newGame(level) {
    const self = this;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0; this._timerRunning = false;
    this.setData({ loading: true, showWin: false });
    this.loadPuzzle(this.data.difficulty, level).then(puzzle => {
      const size = puzzle.size;
      self._calcLayout(puzzle.rowHints, puzzle.colHints, size);
      const grid = [];
      for (let r = 0; r < size; r++) {
        grid.push([]);
        for (let c = 0; c < size; c++) grid[r].push(0);
      }
      let totalFill = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (puzzle.answer[r][c]) totalFill++;
      applyConstraints(grid, puzzle.rowHints, puzzle.colHints, size);
      let filledCount = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] === 1) filledCount++;
      const completed = getCompleted(self.data.difficulty);
      self.setData({
        currentLevel: level, colHints: puzzle.colHints, rowHints: puzzle.rowHints,
        answer: puzzle.answer, gridSize: size, grid,
        showWin: false, timerText: '0:00',
        filledCount, totalFill, loading: false,
        completedCount: completed.length, showLevelSelector: false,
      });
    }).catch(err => {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      self.setData({ loading: false });
    });
  },

  _calcLayout(rowHints, colHints, size) {
    const sys = wx.getSystemInfoSync();
    const W = sys.windowWidth, H = sys.windowHeight;
    const numFont = 11;
    let maxRowLen = 0, maxColLen = 0;
    rowHints.forEach(h => { if (h.length > maxRowLen) maxRowLen = h.length; });
    colHints.forEach(h => { if (h.length > maxColLen) maxColLen = h.length; });
    const rowHintW = Math.max(42, maxRowLen * (numFont + 6) + 8);
    const colHintH = Math.max(22, maxColLen * (numFont + 3) + 6);
    const availW = W - 32 - rowHintW;
    const availH = H - 126 - colHintH;
    const cellPx = Math.max(22, Math.min(Math.floor(availW / size), Math.floor(availH / size), 50));
    const boardPx = rowHintW + size * cellPx + (size - 1);
    this.setData({ cellPx, hintPx: rowHintW, colHintH, boardPx });
  },

  onTouchStart(e) {
    if (this.data.loading || !this.data.grid.length) return;
    const { row, col } = e.currentTarget.dataset;
    const r = Number(row), c = Number(col);
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;
    const self = this;
    const query = wx.createSelectorQuery().in(this);
    query.select('.board').boundingClientRect();
    query.select('.col-hints-row').boundingClientRect();
    query.exec(res => {
      if (res[0]) self._boardRect = res[0];
      if (res[1]) self._colHintBottom = res[1].bottom;
    });
    const current = this.data.grid[r][c];
    const mode = this.data.mode;
    const op = mode === 'fill' ? (current === 1 ? 0 : 1) : (current === 2 ? 0 : 2);
    this._swipeOp = op;
    this._swiped = {};
    this._swiped[r + '_' + c] = true;
    this._startTimer();
    this._doOp(r, c, op);
  },

  onTouchMove(e) {
    if (!this._swipeOp || !this._boardRect || this.data.loading) return;
    const touch = e.touches[0];
    const br = this._boardRect;
    const step = this.data.cellPx + 1;
    const col = Math.floor((touch.clientX - br.left - this.data.hintPx) / step);
    const row = Math.floor((touch.clientY - this._colHintBottom) / step);
    if (row >= 0 && row < this.data.gridSize && col >= 0 && col < this.data.gridSize) {
      const key = row + '_' + col;
      if (!this._swiped[key]) { this._swiped[key] = true; this._doOp(row, col, this._swipeOp); }
    }
  },

  onTouchEnd() { this._swipeOp = null; this._swiped = null; },

  _doOp(r, c, op) {
    if (this.data.loading || !this.data.grid.length) return;
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;
    const size = this.data.gridSize;
    const grid = this.data.grid.map(row => row.slice());
    const old = grid[r][c];
    if (old === op) return;
    grid[r][c] = op;
    applyConstraints(grid, this.data.rowHints, this.data.colHints, size);
    const answer = this.data.answer;
    let win = true;
    outer: for (let rr = 0; rr < size && win; rr++)
      for (let cc = 0; cc < size && win; cc++)
        if (answer[rr][cc] === 1 && grid[rr][cc] !== 1) { win = false; break outer; }
    let filledCount = 0;
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) if (grid[i][j] === 1) filledCount++;
    this.setData({ grid, filledCount });
    if (win) {
      if (this._timer) clearInterval(this._timer);
      saveRecord(this.data.difficulty, this.data.currentLevel, this._seconds);
      this.setData({ showWin: true, completedCount: getCompleted(this.data.difficulty).length });
    }
  },

  openLevelSelector() {
    const size = SIZES[this.data.difficulty];
    this.setData({ showLevelSelector: true, levelNumbers: Array.from({ length: size }, (_, i) => i + 1) });
  },
  closeLevelSelector() { this.setData({ showLevelSelector: false }); },
  selectLevel(e) {
    this.setData({ showLevelSelector: false });
    this.newGame(Number(e.currentTarget.dataset.l));
  },
  isCompleted(level) { return !!getRecords()[this.data.difficulty + '_' + level]; },

  undo() { this.newGame(this.data.currentLevel); },
  nextLevel() { this.setData({ showWin: false }); this.newGame(this.data.currentLevel + 1); },
  closeWin() { this.setData({ showWin: false }); },

  _startTimer() {
    const self = this;
    if (this._timerRunning) return;
    this._timerRunning = true;
    this._timer = setInterval(() => {
      self._seconds++;
      const m = Math.floor(self._seconds / 60), s = self._seconds % 60;
      self.setData({ timerText: m + ':' + (s < 10 ? '0' : '') + s });
    }, 1000);
  }
});
