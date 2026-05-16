// 数织 Nonogram - CDN版（约束传播求解）
var SIZES = { easy: 6, medium: 8, hard: 10 };
var CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data';
var DIFF_TEXT = { easy: '简单 6x6', medium: '中等 8x8', hard: '困难 10x10' };
var TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };
var RECORDS_KEY = 'nonogram_records_v7';

var utils = require('../../../../utils/index');
var playSound = utils.playSound;
var preloadSounds = utils.preloadSounds;

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

function solveLine(hints, line, n, mode) {
  var placements = genPlacements(hints, n);
  if (!placements.length) return { mustFill: [], mustEmpty: [] };
  var valid = [];
  for (var i = 0; i < placements.length; i++) {
    var ok = true;
    for (var j = 0; j < n; j++) {
      if (line[j] === 1 && placements[i][j] !== 1) { ok = false; break; }
      if (line[j] === -1 && placements[i][j] === 1) { ok = false; break; }
    }
    if (ok) valid.push(placements[i]);
  }
  if (!valid.length) {
    return { mustFill: [], mustEmpty: [] };
  }
  var mustFill = [], mustEmpty = [];
  for (var i = 0; i < n; i++) {
    var mustFillFlag = true, mustEmptyFlag = true;
    for (var j = 0; j < valid.length; j++) {
      if (valid[j][i] !== 1) mustFillFlag = false;
      if (valid[j][i] === 1) mustEmptyFlag = false;
    }
    if (mustFillFlag) mustFill.push(i);
    if (mustEmptyFlag) mustEmpty.push(i);
  }
  if (mode === 'fill') {
    var fc = 0;
    for (var fi = 0; fi < n; fi++) { if (line[fi] === 1) fc++; }
    var hs = hints.reduce(function(a, b) { return a + b; }, 0);
    if (fc === hs) {
      var enc = [];
      var runLen = 0, inRun = false;
      for (var ei = 0; ei < n; ei++) {
        if (line[ei] === 1) { inRun = true; runLen++; }
        else { if (inRun) { enc.push(runLen); inRun = false; runLen = 0; } }
      }
      if (inRun) { enc.push(runLen); inRun = false; runLen = 0; }
      var match = (enc.length === hints.length);
      if (match) {
        for (var mi = 0; mi < enc.length; mi++) {
          if (enc[mi] !== hints[mi]) { match = false; break; }
        }
      }
      if (match) {
        for (var xi = 0; xi < n; xi++) {
          if (line[xi] === 0 && mustFill.indexOf(xi) === -1 && mustEmpty.indexOf(xi) === -1) {
            mustEmpty.push(xi);
          }
        }
      }
    }
  }
  return { mustFill: mustFill, mustEmpty: mustEmpty };
}

Page({
  behaviors: [adBehavior],
  data: {
    difficulty: 'easy',
    difficultyText: '简单 6x6',
    currentLevel: 1,
    colHints: [],
    rowHints: [],
    answer: [],
    gridSize: 6,
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
    soundEnabled: true,
    maxPuzzles: 1000,
    jumpInputValue: '',
    currentPuzzleIndex: 1,
    showAnswer: false
  },

  _timer: null,
  _seconds: 0,
  _timerRunning: false,
  _swipeOp: null,
  _swiped: null,
  _boardRect: null,
  _colHintBottom: 0,
  _savedGrid: null,

  onLoad: function() {
    preloadSounds(['click', 'win']);
    var soundEnabled = utils.isPageSoundEnabled('nonogram');
    this.setData({ soundEnabled });
    // 始终从 CDN 加载第1题，不读本地缓存恢复
    this.newGame(1);
  },

  onShow: function() {
    var soundEnabled = utils.isPageSoundEnabled('nonogram');
    this.setData({ soundEnabled });
  },

  toggleSound: function() {
    var newEnabled = !this.data.soundEnabled;
    this.setData({ soundEnabled: newEnabled });
    utils.setPageSoundEnabled('nonogram', newEnabled);
    if (newEnabled) {
      playSound('click', { pageId: 'nonogram' });
    }
  },

  onUnload: function() {
    if (this._timer) clearInterval(this._timer);
    wx.setStorageSync('nonogram_saved', {
      difficulty: this.data.difficulty,
      difficultyText: this.data.difficultyText,
      gridSize: this.data.gridSize,
      grid: this.data.grid,
      colHints: this.data.colHints,
      rowHints: this.data.rowHints,
      answer: this.data.answer,
      currentLevel: this.data.currentLevel,
      currentPuzzleIndex: this.data.currentPuzzleIndex,
      maxPuzzles: this.data.maxPuzzles,
      mode: this.data.mode,
      timerText: this.data.timerText,
      filledCount: this.data.filledCount,
      totalFill: this.data.totalFill,
      completedCount: this.data.completedCount,
    });
  },

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
    var filename = difficulty + '-' + String(level).padStart(4, '0') + '.json';
    var self = this;
    return new Promise(function(resolve, reject) {
      wx.request({
        url: CDN_BASE + '/nonogram/' + filename + '?t=' + Date.now(),
        method: 'GET',
        timeout: 8000,
        success: function(r) {
          if (r.statusCode === 200) { resolve(r.data); }
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
    var availH = H - 160 - colHintH;
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
        cells.push({ ci: c, s: grid[r][c], cls: this._getCellClass(grid[r][c], r, c, size), uid: r + '-' + c });
      }
      groups.push({ ri: r, cells: cells, uid: 'row-' + r });
    }
    return groups;
  },

  // 检查行/列是否已完成（填满且匹配提示数），完成则将剩余空格标记为X
  _checkAndMarkEmpty: function(grid, r, c, size) {
    // 检查行
    var rowHints = this.data.rowHints[r];
    var rowSum = rowHints.reduce(function(a, b) { return a + b; }, 0);
    var rowFilled = 0, rowEmpty = 0;
    for (var cc = 0; cc < size; cc++) {
      if (grid[r][cc] === 1) rowFilled++;
      else if (grid[r][cc] === 2) rowEmpty++;
    }
    if (rowFilled === rowSum && rowFilled + rowEmpty < size) {
      // 填满数等于提示和，但还有空格，检查序列是否匹配
      var enc = [], runLen = 0, inRun = false;
      for (var cc = 0; cc < size; cc++) {
        if (grid[r][cc] === 1) { inRun = true; runLen++; }
        else { if (inRun) { enc.push(runLen); inRun = false; runLen = 0; } }
      }
      if (inRun) enc.push(runLen);
      var match = (enc.length === rowHints.length);
      if (match) {
        for (var i = 0; i < enc.length; i++) {
          if (enc[i] !== rowHints[i]) { match = false; break; }
        }
      }
      if (match) {
        for (var cc = 0; cc < size; cc++) {
          if (grid[r][cc] === 0) grid[r][cc] = 2;
        }
      }
    }
    // 检查列
    var colHints = this.data.colHints[c];
    var colSum = colHints.reduce(function(a, b) { return a + b; }, 0);
    var colFilled = 0, colEmpty = 0;
    for (var rr = 0; rr < size; rr++) {
      if (grid[rr][c] === 1) colFilled++;
      else if (grid[rr][c] === 2) colEmpty++;
    }
    if (colFilled === colSum && colFilled + colEmpty < size) {
      var enc2 = [], runLen2 = 0, inRun2 = false;
      for (var rr = 0; rr < size; rr++) {
        if (grid[rr][c] === 1) { inRun2 = true; runLen2++; }
        else { if (inRun2) { enc2.push(runLen2); inRun2 = false; runLen2 = 0; } }
      }
      if (inRun2) enc2.push(runLen2);
      var match2 = (enc2.length === colHints.length);
      if (match2) {
        for (var i = 0; i < enc2.length; i++) {
          if (enc2[i] !== colHints[i]) { match2 = false; break; }
        }
      }
      if (match2) {
        for (var rr = 0; rr < size; rr++) {
          if (grid[rr][c] === 0) grid[rr][c] = 2;
        }
      }
    }
  },

  newGame: function(level) {
    var self = this;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._seconds = 0;
    this._timerRunning = false;
    this.setData({ loading: true, showWin: false, showAnswer: false });
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
      var rowGroups = self._buildRowGroups(grid, size);
      var completed = getCompleted(self.data.difficulty);
      var maxPuzzles = TOTAL_PUZZLES[self.data.difficulty] || 1000;
      self.setData({
        currentLevel: level,
        currentPuzzleIndex: level,
        colHints: puzzle.colHints,
        rowHints: puzzle.rowHints,
        answer: puzzle.answer,
        gridSize: size,
        grid: grid,
        rowGroups: rowGroups,
        showWin: false,
        timerText: '0:00',
        filledCount: 0,
        totalFill: totalFill,
        loading: false,
        completedCount: completed.length,
        showLevelSelector: false,
        maxPuzzles: maxPuzzles,
        jumpInputValue: '',
        showAnswer: false,
      });
    }).catch(function(err) {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      self.setData({ loading: false });
    });
  },

  onTouchStart: function(e) {
    if (this.data.loading || !this.data.grid.length || this.data.showAnswer) return;
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
    if (mode === 'fill') {
      op = current === 1 ? 0 : 1; // 填充模式: 0→1→0（空→填→空）
    } else {
      if (current === 2) op = 0;
      else op = 2; // 0→2→0
    }
    this._swipeOp = op;
    this._swiped = {};
    this._swiped[r + '_' + c] = true;
    this._startTimer();
    this._doOp(r, c, op);
  },

  onTouchMove: function(e) {
    if (!this._swipeOp || !this._boardRect || this.data.loading || this.data.showAnswer) return;
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

  _checkLineMatch: function(line, hints) {
    var enc = [], runLen = 0, inRun = false;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === 1) { inRun = true; runLen++; }
      else { if (inRun) { enc.push(runLen); inRun = false; runLen = 0; } }
    }
    if (inRun) enc.push(runLen);
    if (enc.length !== hints.length) return false;
    for (var i = 0; i < enc.length; i++) {
      if (enc[i] !== hints[i]) return false;
    }
    return true;
  },

  _doOp: function(r, c, op) {
    if (this.data.loading || !this.data.grid.length) return;
    if (r < 0 || r >= this.data.gridSize || c < 0 || c >= this.data.gridSize) return;
    if (this.data.showAnswer) return;
    playSound('click', { pageId: 'nonogram' });
    var size = this.data.gridSize;
    var mode = this.data.mode;
    var grid = [];
    for (var i = 0; i < size; i++) grid.push(this.data.grid[i].slice());
    var old = grid[r][c];
    if (old === op) return;
    grid[r][c] = op;

    this._checkAndMarkEmpty(grid, r, c, size);
    var autoChanges = [];
    for (var rr = 0; rr < size; rr++) {
      for (var cc = 0; cc < size; cc++) {
        if (this.data.grid[rr][cc] === 0 && grid[rr][cc] !== 0) {
          autoChanges.push({r: rr, c: cc, from: 0, to: grid[rr][cc]});
        }
      }
    }
    var win = true;
    for (var rr = 0; rr < size && win; rr++) {
      if (!this._checkLineMatch(grid[rr], this.data.rowHints[rr])) win = false;
    }
    if (win) {
      for (var cc = 0; cc < size && win; cc++) {
        var colLine = [];
        for (var rr = 0; rr < size; rr++) colLine.push(grid[rr][cc]);
        if (!this._checkLineMatch(colLine, this.data.colHints[cc])) win = false;
      }
    }
    var filledCount = 0;
    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        if (grid[i][j] === 1) filledCount++;
      }
    }
    this.setData({ grid: grid, rowGroups: this._buildRowGroups(grid, size), filledCount: filledCount });
    if (win) {
      if (this._timer) clearInterval(this._timer);
      playSound('win', { pageId: 'nonogram' });
      saveRecord(this.data.difficulty, this.data.currentLevel, this._seconds);
      this.setData({ showWin: true, completedCount: getCompleted(this.data.difficulty).length });
    }
  },

  openLevelSelector: function() {
    var total = TOTAL_PUZZLES[this.data.difficulty] || 1000;
    var nums = [];
    for (var i = 1; i <= total; i++) nums.push(i);
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

  nextLevel: function() {
    this.setData({ showWin: false });
    var next = this.data.currentLevel + 1;
    var max = TOTAL_PUZZLES[this.data.difficulty] || 1000;
    if (next > max) next = 1;
    this.newGame(next);
  },

  closeWin: function() { this.setData({ showWin: false }); },

  // 查看答案
  onShowAnswer: function() {
    var answer = this.data.answer;
    var size = this.data.gridSize;
    var grid = [];
    for (var r = 0; r < size; r++) {
      grid.push([]);
      for (var c = 0; c < size; c++) {
        grid[r].push(answer[r][c] ? 1 : 2);
      }
    }
    this._savedGrid = this.data.grid;
    var rowGroups = this._buildRowGroups(grid, size);
    this.setData({ grid: grid, rowGroups: rowGroups, filledCount: this.data.totalFill, showAnswer: true });
  },

  onHideAnswer: function() {
    if (this._savedGrid) {
      var grid = this._savedGrid;
      this._savedGrid = null;
      var rowGroups = this._buildRowGroups(grid, this.data.gridSize);
      var filledCount = 0;
      for (var i = 0; i < this.data.gridSize; i++) {
        for (var j = 0; j < this.data.gridSize; j++) {
          if (grid[i][j] === 1) filledCount++;
        }
      }
      this.setData({ grid: grid, rowGroups: rowGroups, filledCount: filledCount, showAnswer: false });
    }
  },

  // 跳关
  onJumpInput: function(e) {
    var value = e.detail.value;
    var max = this.data.maxPuzzles;
    if (value && parseInt(value) > max) value = String(max);
    this.setData({ jumpInputValue: value });
  },

  onJump: function() {
    var value = parseInt(this.data.jumpInputValue);
    var max = this.data.maxPuzzles;
    if (!value || value < 1) { this.setData({ jumpInputValue: '' }); return; }
    var target = Math.min(value, max);
    this.setData({ jumpInputValue: '' });
    this.newGame(target);
  },

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
const adBehavior = require('../../../../utils/ad-behavior');
