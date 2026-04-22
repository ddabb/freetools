// 数织 Nonogram - CDN版（约束传播求解）
var SIZES = { easy: 5, medium: 8, hard: 10 };
var CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
var DIFF_TEXT = { easy: '简单 5x5', medium: '中等 8x8', hard: '困难 10x10' };
var RECORDS_KEY = 'nonogram_records_v7';

function getRecords() {
  try { return JSON.parse(wx.getStorageSync(RECORDS_KEY) || '{}'); } catch(e) { return {}; }
}

function saveRecord(d, lvl, t) {
  var r = getRecords();
  var k = d + '_' + lvl;
  if (!r[k] || t < r[k]) { r[k] = t; wx.setStorageSync(RECORDS_KEY, JSON.stringify(r)); }
}

function getCompleted(d) {
  var r = getRecords();
  var c = [];
  for (var k in r) {
    if (k.indexOf(d + '_') === 0) {
      var v = parseInt(k.split('_')[1]);
      if (!isNaN(v)) c.push(v);
    }
  }
  return c.sort(function(a, b) { return a - b; });
}

function genPlacements(hints, n) {
  if (hints.length === 1 && hints[0] === 0) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(-1);
    return [arr];
  }
  var total = 0;
  for (var i = 0; i < hints.length; i++) total = total + hints[i];
  total = total + hints.length - 1;
  if (total > n) return [];
  var results = [];
  function dfs(idx, pos, cur) {
    if (idx === hints.length) {
      var full = cur.slice();
      for (var i = pos; i < n; i++) full[i] = -1;
      results.push(full);
      return;
    }
    var len = hints[idx];
    var rest = 0;
    for (var j = idx; j < hints.length; j++) rest = rest + hints[j];
    var maxPos = n - (rest + hints.length - idx - 1);
    for (var p = pos; p <= maxPos; p++) {
      var cur2 = cur.slice();
      for (var i = pos; i < p; i++) cur2[i] = -1;
      for (var i = p; i < p + len; i++) cur2[i] = 1;
      dfs(idx + 1, p + len + 1, cur2);
    }
  }
  var initArr = [];
  for (var i = 0; i < n; i++) initArr.push(0);
  dfs(0, 0, initArr);
  return results;
}

function solveLine(hints, line, n) {
  var placements = genPlacements(hints, n);
  if (!placements.length) return { mustFill: [], mustEmpty: [] };
  var valid = [];
  for (var i = 0; i < placements.length; i++) {
    var ok = true;
    for (var j = 0; j < n; j++) {
      // line[j]: 0=未知 1=用户填了 -1=用户标了X
      // placement[j]: 1=该填 -1=该空
      if (line[j] === 1 && placements[i][j] !== 1) { ok = false; break; } // 用户填了必须匹配
      if (line[j] === -1 && placements[i][j] !== -1) { ok = false; break; } // 用户标X必须是空格
    }
    if (ok) valid.push(placements[i]);
  }
  // 如果没有合法排列，说明当前行/列已经填满（所有提示数都已满足）
  // 此时所有未知格子都应该打叉
  if (!valid.length) {
    var mf = [];
    for (var k = 0; k < n; k++) { if (line[k] === 0) mf.push(k); }
    return { mustFill: [], mustEmpty: mf };
  }
  var mustFill = [];
  var mustEmpty = [];
  for (var i = 0; i < n; i++) {
    var mustFillFlag = true;
    var mustEmptyFlag = true;
    for (var j = 0; j < valid.length; j++) {
      if (valid[j][i] !== 1) mustFillFlag = false;
      if (valid[j][i] === 1) mustEmptyFlag = false; // 只要有一个placement在该位置填了，就不能mustEmpty
    }
    if (mustFillFlag) mustFill.push(i);
    if (mustEmptyFlag) mustEmpty.push(i);
  }
  return { mustFill: mustFill, mustEmpty: mustEmpty };
}

function applyConstraints(grid, rowHints, colHints, size) {
  var changed = true;
  while (changed) {
    changed = false;
    for (var r = 0; r < size; r++) {
      var line = [];
      for (var c = 0; c < size; c++) {
        if (grid[r][c] === 1) line.push(1);
        else if (grid[r][c] === 2) line.push(-1);
        else line.push(0);
      }
      var res = solveLine(rowHints[r], line, size);
      for (var i = 0; i < res.mustFill.length; i++) {
        var c = res.mustFill[i];
        if (grid[r][c] === 0) { grid[r][c] = 1; changed = true; }
      }
      for (var i = 0; i < res.mustEmpty.length; i++) {
        var c = res.mustEmpty[i];
        if (grid[r][c] === 0) { grid[r][c] = 2; changed = true; }
      }
    }
    for (var c = 0; c < size; c++) {
      var line2 = [];
      for (var r = 0; r < size; r++) {
        if (grid[r][c] === 1) line2.push(1);
        else if (grid[r][c] === 2) line2.push(-1);
        else line2.push(0);
      }
      var res2 = solveLine(colHints[c], line2, size);
      for (var i = 0; i < res2.mustFill.length; i++) {
        var r = res2.mustFill[i];
        if (grid[r][c] === 0) { grid[r][c] = 1; changed = true; }
      }
      for (var i = 0; i < res2.mustEmpty.length; i++) {
        var r = res2.mustEmpty[i];
        if (grid[r][c] === 0) { grid[r][c] = 2; changed = true; }
      }
    }
  }
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
    rowGroups: [],
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

  onLoad: function() { this.newGame(1); },
  onUnload: function() { if (this._timer) clearInterval(this._timer); },

  setDifficulty: function(e) {
    var d = e.currentTarget.dataset.diff;
    if (d === this.data.difficulty) return;
    this.setData({ difficulty: d, difficultyText: DIFF_TEXT[d] });
    this.newGame(1);
  },

  setMode: function(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  loadPuzzle: function(difficulty, level) {
    var key = 'cdn_nonogram_' + difficulty + '_' + String(level).padStart(4, '0');
    var cached = wx.getStorageSync(key);
    if (cached) return Promise.resolve(cached);
    var filename = difficulty + '-' + String(level).padStart(4, '0') + '.json';
    var self = this;
    return new Promise(function(resolve, reject) {
      wx.request({
        url: CDN_BASE + '/nonogram/' + filename,
        method: 'GET',
        timeout: 8000,
        success: function(r) {
          if (r.statusCode === 200) { wx.setStorageSync(key, r.data); resolve(r.data); }
          else reject(new Error('HTTP' + r.statusCode));
        },
        fail: reject
      });
    });
  },

  _calcLayout: function(rowHints, colHints, size) {
    var sys = wx.getSystemInfoSync();
    var W = sys.windowWidth;
    var H = sys.windowHeight;
    var numFont = 11;
    var maxRowLen = 0;
    var maxColLen = 0;
    for (var i = 0; i < rowHints.length; i++) {
      if (rowHints[i].length > maxRowLen) maxRowLen = rowHints[i].length;
    }
    for (var i = 0; i < colHints.length; i++) {
      if (colHints[i].length > maxColLen) maxColLen = colHints[i].length;
    }
    var rowHintW = Math.max(42, maxRowLen * (numFont + 6) + 8);
    var colHintH = Math.max(22, maxColLen * (numFont + 3) + 6);
    var availW = W - 32 - rowHintW;
    var availH = H - 126 - colHintH;
    var cellPx = Math.max(22, Math.min(Math.floor(availW / size), Math.floor(availH / size), 50));
    var boardPx = rowHintW + size * cellPx + (size - 1);
    this.setData({ cellPx: cellPx, hintPx: rowHintW, colHintH: colHintH, boardPx: boardPx });
  },

  _getCellClass: function(s, r, c, size) {
    var cls = 'cell';
    if (s === 1) cls = 'cell cell-filled';
    else if (s === 2) cls = 'cell cell-marked';
    if (r === size - 1) cls = cls + ' cell-row-last';
    if (c === size - 1) cls = cls + ' cell-col-last';
    return cls;
  },

  _buildRowGroups: function(grid, size) {
    var groups = [];
    for (var r = 0; r < size; r++) {
      var cells = [];
      for (var c = 0; c < size; c++) {
        cells.push({ ci: c, s: grid[r][c], cls: this._getCellClass(grid[r][c], r, c, size) });
      }
      groups.push({ ri: r, cells: cells });
    }
    return groups;
  },

  newGame: function(level) {
    var self = this;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0;
    this._timerRunning = false;
    this.setData({ loading: true, showWin: false });
    this.loadPuzzle(this.data.difficulty, level).then(function(puzzle) {
      var size = puzzle.size;
      self._calcLayout(puzzle.rowHints, puzzle.colHints, size);
      var grid = [];
      for (var r = 0; r < size; r++) {
        grid.push([]);
        for (var c = 0; c < size; c++) grid[r].push(0);
      }
      var totalFill = 0;
      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          if (puzzle.answer[r][c]) totalFill++;
        }
      }
      var filledCount = 0;
      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          if (grid[r][c] === 1) filledCount++;
        }
      }
      var rowGroups = self._buildRowGroups(grid, size);
      var completed = getCompleted(self.data.difficulty);
      self.setData({
        currentLevel: level,
        colHints: puzzle.colHints,
        rowHints: puzzle.rowHints,
        answer: puzzle.answer,
        gridSize: size,
        grid: grid,
        rowGroups: rowGroups,
        showWin: false,
        timerText: '0:00',
        filledCount: filledCount,
        totalFill: totalFill,
        loading: false,
        completedCount: completed.length,
        showLevelSelector: false,
      });
    }).catch(function(err) {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      self.setData({ loading: false });
    });
  },

  _refreshRowGroups: function(grid, size) {
    var rowGroups = this._buildRowGroups(grid, size);
    this.setData({ rowGroups: rowGroups });
  },

  onTouchStart: function(e) {
    if (this.data.loading || !this.data.grid.length) return;
    var dataset = e.currentTarget.dataset;
    var r = Number(dataset.row);
    var c = Number(dataset.col);
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;
    var self = this;
    var query = wx.createSelectorQuery().in(this);
    query.select('.board').boundingClientRect();
    query.select('.col-hints-row').boundingClientRect();
    query.exec(function(res) {
      if (res[0]) self._boardRect = res[0];
      if (res[1]) self._colHintBottom = res[1].bottom;
    });
    var current = this.data.grid[r][c];
    var mode = this.data.mode;
    var op;
    if (mode === 'fill') op = (current === 1 ? 0 : 1);
    else op = (current === 2 ? 0 : 2);
    this._swipeOp = op;
    this._swiped = {};
    this._swiped[r + '_' + c] = true;
    this._startTimer();
    this._doOp(r, c, op);
  },

  onTouchMove: function(e) {
    if (!this._swipeOp || !this._boardRect || this.data.loading) return;
    var touch = e.touches[0];
    var br = this._boardRect;
    var step = this.data.cellPx + 1;
    var col = Math.floor((touch.clientX - br.left - this.data.hintPx) / step);
    var row = Math.floor((touch.clientY - this._colHintBottom) / step);
    if (row >= 0 && row < this.data.gridSize && col >= 0 && col < this.data.gridSize) {
      var key = row + '_' + col;
      if (!this._swiped[key]) {
        this._swiped[key] = true;
        this._doOp(row, col, this._swipeOp);
      }
    }
  },

  onTouchEnd: function() { this._swipeOp = null; this._swiped = null; },

  _doOp: function(r, c, op) {
    if (this.data.loading || !this.data.grid.length) return;
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;
    var size = this.data.gridSize;
    var grid = [];
    for (var i = 0; i < size; i++) grid.push(this.data.grid[i].slice());
    var old = grid[r][c];
    if (old === op) return;
    grid[r][c] = op;
    // 仅在同一行+同一列内做约束传播（不影响其他行列）
    // 每轮：先解行→标记→再解列→标记，循环直到收敛
    var changed = true;
    var iter = 0;
    while (changed) {
      iter++;
      changed = false;
      // 求解当前行
      var rowLine = [];
      for (var cc = 0; cc < size; cc++) {
        rowLine.push(grid[r][cc] === 1 ? 1 : grid[r][cc] === 2 ? -1 : 0);
      }
      var rowRes = solveLine(this.data.rowHints[r], rowLine, size);
      var rHints = this.data.rowHints[r];
      var rfc = 0; for (var _i = 0; _i < size; _i++) { if (rowLine[_i] === 1) rfc++; }
      var rhSum = rHints.reduce(function(a, b) { return a + b; }, 0);
      var rowSatisfied = rfc >= rhSum;
      if (rowSatisfied) {
      for (var i = 0; i < rowRes.mustFill.length; i++) {
        var cc = rowRes.mustFill[i];
        if (grid[r][cc] === 0) { grid[r][cc] = 1; changed = true; }
      }
      for (var i = 0; i < rowRes.mustEmpty.length; i++) {
        var cc = rowRes.mustEmpty[i];
        if (grid[r][cc] === 0) { grid[r][cc] = 2; changed = true; }
      }}
      // 求解当前列
      var colLine = [];
      for (var rr = 0; rr < size; rr++) {
        colLine.push(grid[rr][c] === 1 ? 1 : grid[rr][c] === 2 ? -1 : 0);
      }
      var colRes = solveLine(this.data.colHints[c], colLine, size);
      var cHints = this.data.colHints[c];
      var cfc = 0; for (var _j = 0; _j < size; _j++) { if (colLine[_j] === 1) cfc++; }
      var chSum = cHints.reduce(function(a, b) { return a + b; }, 0);
      var colSatisfied = cfc >= chSum;
      if (colSatisfied) {
      for (var i = 0; i < colRes.mustFill.length; i++) {
        var rr = colRes.mustFill[i];
        if (grid[rr][c] === 0) { grid[rr][c] = 1; changed = true; }
      }
      for (var i = 0; i < colRes.mustEmpty.length; i++) {
        var rr = colRes.mustEmpty[i];
        if (grid[rr][c] === 0) { grid[rr][c] = 2; changed = true; }
      }}
      if (iter > 50) break; // 防死循环
    }
    this._refreshRowGroups(grid, size);
    var answer = this.data.answer;
    var win = true;
    outer: for (var rr = 0; rr < size && win; rr++) {
      for (var cc = 0; cc < size && win; cc++) {
        if (answer[rr][cc] === 1 && grid[rr][cc] !== 1) { win = false; break outer; }
      }
    }
    var filledCount = 0;
    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        if (grid[i][j] === 1) filledCount++;
      }
    }
    this.setData({ grid: grid, filledCount: filledCount });
    if (win) {
      if (this._timer) clearInterval(this._timer);
      saveRecord(this.data.difficulty, this.data.currentLevel, this._seconds);
      this.setData({ showWin: true, completedCount: getCompleted(this.data.difficulty).length });
    }
  },

  openLevelSelector: function() {
    var size = SIZES[this.data.difficulty];
    var nums = [];
    for (var i = 1; i <= size; i++) nums.push(i);
    this.setData({ showLevelSelector: true, levelNumbers: nums });
  },

  closeLevelSelector: function() { this.setData({ showLevelSelector: false }); },

  selectLevel: function(e) {
    this.setData({ showLevelSelector: false });
    this.newGame(Number(e.currentTarget.dataset.l));
  },

  isCompleted: function(level) {
    var r = getRecords();
    return !!r[this.data.difficulty + '_' + level];
  },

  undo: function() { this.newGame(this.data.currentLevel); },
  nextLevel: function() { this.setData({ showWin: false }); this.newGame(this.data.currentLevel + 1); },
  closeWin: function() { this.setData({ showWin: false }); },

  _startTimer: function() {
    var self = this;
    if (this._timerRunning) return;
    this._timerRunning = true;
    this._timer = setInterval(function() {
      self._seconds++;
      var m = Math.floor(self._seconds / 60);
      var s = self._seconds % 60;
      self.setData({ timerText: m + ':' + (s < 10 ? '0' : '') + s });
    }, 1000);
  }
});
