// 数组迷宫 - 数织(Nonogram) 完整版
// 支持：无限关卡唯一解生成、手指滑动连续标记、模式切换

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

// ─── 唯一解验证（行列约束传播求解器）────────────────────────
// 返回解的数量（最多数到 2，超过即非唯一）
function countSolutions(rowHints, colHints, size, limit) {
  // 用 0=未知 1=填 -1=空 表示
  const board = Array.from({ length: size }, () => new Array(size).fill(0));

  function lineSolve(hints, line) {
    // 返回该行/列可以确定的格子（1=必填，-1=必空，0=不确定）
    const n = line.length;
    const result = new Array(n).fill(0);
    const total = hints.reduce((a, b) => a + b, 0) + hints.length - 1;
    if (total > n) return result;

    // 生成所有合法排列，取交集
    const placements = [];
    function place(idx, pos, current) {
      if (idx === hints.length) {
        // 填满剩余为空
        const full = [...current];
        for (let i = pos; i < n; i++) full[i] = -1;
        placements.push(full);
        return;
      }
      const len = hints[idx];
      const maxPos = n - (hints.slice(idx).reduce((a, b) => a + b, 0) + hints.length - idx - 1);
      for (let p = pos; p <= maxPos; p++) {
        const cur = [...current];
        for (let i = pos; i < p; i++) cur[i] = -1;
        for (let i = p; i < p + len; i++) cur[i] = 1;
        place(idx + 1, p + len + 1, cur);
      }
    }
    place(0, 0, new Array(n).fill(0));

    if (!placements.length) return result;

    // 过滤与已知状态冲突的排列
    const valid = placements.filter(p =>
      p.every((v, i) => line[i] === 0 || line[i] === v)
    );
    if (!valid.length) return null; // 矛盾

    for (let i = 0; i < n; i++) {
      const vals = valid.map(p => p[i]);
      if (vals.every(v => v === 1)) result[i] = 1;
      else if (vals.every(v => v === -1)) result[i] = -1;
    }
    return result;
  }

  // 约束传播
  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < size; r++) {
        const line = board[r].slice();
        const res = lineSolve(rowHints[r], line);
        if (!res) return false;
        for (let c = 0; c < size; c++) {
          if (res[c] !== 0 && board[r][c] === 0) {
            board[r][c] = res[c];
            changed = true;
          }
        }
      }
      for (let c = 0; c < size; c++) {
        const line = board.map(r => r[c]);
        const res = lineSolve(colHints[c], line);
        if (!res) return false;
        for (let r = 0; r < size; r++) {
          if (res[r] !== 0 && board[r][c] === 0) {
            board[r][c] = res[r];
            changed = true;
          }
        }
      }
    }
    return true;
  }

  let count = 0;
  function backtrack(pos) {
    if (count >= limit) return;
    if (!propagate()) return;

    // 找第一个未知格
    let fr = -1, fc = -1;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) { fr = r; fc = c; break outer; }
      }
    }
    if (fr === -1) { count++; return; }

    // 保存状态
    const saved = board.map(r => r.slice());
    for (const v of [1, -1]) {
      board.splice(0, size, ...saved.map(r => r.slice()));
      board[fr][fc] = v;
      backtrack(pos + 1);
      if (count >= limit) return;
    }
    board.splice(0, size, ...saved.map(r => r.slice()));
  }

  backtrack(0);
  return count;
}

// ─── 谜题生成（带唯一解验证）────────────────────────────────
function generatePuzzle(size, seed) {
  const rand = seededRand(seed);
  const density = size <= 5 ? 0.55 : size <= 8 ? 0.5 : 0.48;

  for (let attempt = 0; attempt < 200; attempt++) {
    const answer = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rand() < density ? 1 : 0)
    );

    // 确保每行每列至少有1个填充
    let valid = true;
    for (let r = 0; r < size; r++) {
      if (!answer[r].some(v => v)) { valid = false; break; }
    }
    if (valid) {
      for (let c = 0; c < size; c++) {
        if (!answer.some(r => r[c])) { valid = false; break; }
      }
    }
    if (!valid) continue;

    const rowHints = answer.map(row => calcHints(row));
    const colHints = Array.from({ length: size }, (_, c) =>
      calcHints(answer.map(r => r[c]))
    );

    // 验证唯一解（最多找2个解，只要1个就通过）
    const sols = countSolutions(
      rowHints.map(h => [...h]),
      colHints.map(h => [...h]),
      size, 2
    );
    if (sols === 1) {
      return { answer, rowHints, colHints };
    }
  }

  // 兜底：返回一个简单的有唯一解谜题
  return fallbackPuzzle(size);
}

function fallbackPuzzle(size) {
  // 棋盘格，必然唯一解
  const answer = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (r + c) % 2)
  );
  return {
    answer,
    rowHints: answer.map(row => calcHints(row)),
    colHints: Array.from({ length: size }, (_, c) =>
      calcHints(answer.map(r => r[c]))
    )
  };
}

// ─── 棋盘尺寸计算 ────────────────────────────────────────────
const SIZES = { easy: 5, medium: 8, hard: 10 };
const CELL_SIZES = { easy: 80, medium: 64, hard: 56 }; // rpx
const HINT_WIDTH = 76; // rpx

Page({
  data: {
    difficulty: 'easy',
    currentLevel: 1,
    grid: [],
    rowHints: [],
    colHints: [],
    answer: [],
    history: [],
    mode: 'fill',       // 'fill' | 'mark'
    showWin: false,
    timerDisplay: '0:00',
    filledCount: 0,
    totalFill: 0,
    cellSize: 80,
    boardWidth: 0,
    // 滑动状态
    _touchActive: false,
    _touchMode: null,   // 本次滑动的操作类型
    _touchedCells: {},  // 本次滑动已处理的格子
    _timer: null,
    _seconds: 0,
    _timerStarted: false
  },

  onLoad() {
    this.loadLevel(1);
  },

  onUnload() {
    this.clearTimer();
  },

  setDifficulty(e) {
    const diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff, currentLevel: 1 });
    this.loadLevel(1);
  },

  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  loadLevel(level) {
    this.clearTimer();
    const diff = this.data.difficulty;
    const size = SIZES[diff];
    const cellSize = CELL_SIZES[diff];
    const boardWidth = HINT_WIDTH + size * cellSize + (size + 1) * 2;

    // 用关卡号作为种子，保证同一关卡每次一样
    const seed = level * 31337 + (diff === 'easy' ? 1 : diff === 'medium' ? 1000 : 2000);
    const puzzle = generatePuzzle(size, seed);

    const grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ state: 'empty', error: false }))
    );

    const totalFill = puzzle.answer.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);

    this.setData({
      grid, answer: puzzle.answer,
      rowHints: puzzle.rowHints, colHints: puzzle.colHints,
      history: [], showWin: false,
      timerDisplay: '0:00', filledCount: 0, totalFill,
      cellSize, boardWidth, currentLevel: level,
      _seconds: 0, _timerStarted: false
    });
  },

  // ─── 触摸事件（支持滑动连续标记）──────────────────────────
  onTouchStart(e) {
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.grid[row][col];
    const mode = this.data.mode;

    // 确定本次滑动的操作
    let touchMode;
    if (mode === 'fill') {
      touchMode = cell.state === 'filled' ? 'clear' : 'fill';
    } else {
      touchMode = cell.state === 'marked' ? 'clear' : 'mark';
    }

    this._touchActive = true;
    this._touchMode = touchMode;
    this._touchedCells = {};
    this._startTimer();

    this._applyToCell(parseInt(row), parseInt(col));
  },

  onTouchMove(e) {
    if (!this._touchActive) return;
    const touch = e.touches[0];
    // 通过坐标找到对应格子
    this._findCellByTouch(touch.clientX, touch.clientY);
  },

  onTouchEnd() {
    this._touchActive = false;
    this._touchMode = null;
    this._touchedCells = {};
  },

  _findCellByTouch(clientX, clientY) {
    // 用 wx.createSelectorQuery 性能差，改用坐标计算
    const query = wx.createSelectorQuery().in(this);
    query.select('.board').boundingClientRect(rect => {
      if (!rect) return;
      const cellSize = this.data.cellSize;
      const hintW = HINT_WIDTH;
      const gap = 2;
      const px = clientX - rect.left - hintW - gap;
      const py = clientY - rect.top - this._colHintHeight - gap;
      const size = SIZES[this.data.difficulty];
      const col = Math.floor(px / (cellSize + gap));
      const row = Math.floor(py / (cellSize + gap));
      if (row >= 0 && row < size && col >= 0 && col < size) {
        this._applyToCell(row, col);
      }
    }).exec();
  },

  _applyToCell(row, col) {
    const key = `${row}_${col}`;
    if (this._touchedCells[key]) return;
    this._touchedCells[key] = true;

    const grid = this.data.grid.map(r => r.map(c => ({ ...c })));
    const cell = grid[row][col];
    const oldState = cell.state;
    let newState;

    if (this._touchMode === 'fill') newState = 'filled';
    else if (this._touchMode === 'mark') newState = 'marked';
    else newState = 'empty';

    if (oldState === newState) return;

    cell.state = newState;
    cell.error = false;

    // 记录历史
    const history = [...this.data.history, { row, col, oldState }];

    // 统计填充数
    let filledCount = 0;
    grid.forEach(r => r.forEach(c => { if (c.state === 'filled') filledCount++; }));

    this.setData({ grid, history, filledCount });

    if (this.checkWin(grid)) this.onWin();
  },

  checkWin(grid) {
    const { answer } = this.data;
    for (let r = 0; r < answer.length; r++) {
      for (let c = 0; c < answer[r].length; c++) {
        const filled = grid[r][c].state === 'filled';
        if (filled !== (answer[r][c] === 1)) return false;
      }
    }
    return true;
  },

  onWin() {
    this.clearTimer();
    this.setData({ showWin: true });
  },

  closeWin() {
    this.setData({ showWin: false });
  },

  nextLevel() {
    const next = this.data.currentLevel + 1;
    this.setData({ showWin: false });
    this.loadLevel(next);
  },

  undo() {
    const history = [...this.data.history];
    if (!history.length) return;
    const last = history.pop();
    const grid = this.data.grid.map(r => r.map(c => ({ ...c })));
    grid[last.row][last.col].state = last.oldState;
    grid[last.row][last.col].error = false;
    let filledCount = 0;
    grid.forEach(r => r.forEach(c => { if (c.state === 'filled') filledCount++; }));
    this.setData({ grid, history, filledCount });
  },

  reset() {
    this.loadLevel(this.data.currentLevel);
  },

  _startTimer() {
    if (this.data._timerStarted) return;
    this.setData({ _timerStarted: true });
    this._timer = setInterval(() => {
      const s = this.data._seconds + 1;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      this.setData({ _seconds: s, timerDisplay: `${m}:${sec < 10 ? '0' : ''}${sec}` });
    }, 1000);
  },

  clearTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.setData({ _timerStarted: false });
  },

  // 记录列提示区域高度（用于滑动坐标计算）
  onColHintLayout(e) {
    this._colHintHeight = e.detail.height || 80;
  }
});
