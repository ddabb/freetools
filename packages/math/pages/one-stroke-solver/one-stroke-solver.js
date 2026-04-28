/**
 * 一笔画 (One-Stroke Path) 游戏
 * 规则：从起点出发，一次经过所有有效格子，不重复，最终回到起点（或不回到起点）
 * 交互：点击格子按顺序经过
 */

const GridPathFinder = require('../../utils/GridPathFinder');
const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 题库 CDN
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/one-stroke/';
const TOTAL_PUZZLES = { easy: 200, medium: 200, hard: 200 };

// 难度配置
const DIFFICULTY_CONFIG = {
  easy:   { rows: 4, cols: 4 },
  medium: { rows: 5, cols: 5 },
  hard:   { rows: 6, cols: 6 }
};

// 当前游戏状态（内部）
let _game = {
  grid: null,       // 格子状态：0=有效可走，1=洞
  rows: 4,
  cols: 4,
  path: [],         // 当前路径 [idx, idx, ...]
  difficulty: 'easy',
  puzzleId: 0,
  time: 0,
  timer: null,
  isComplete: false,
  isPlaying: false
};

Page({
  data: {
    rows: 4,
    cols: 4,
    gridData: [],
    path: [],
    difficulty: 'easy',
    puzzleId: 0,
    time: 0,
    timeStr: '0:00',
    cellSize: 60,
    isComplete: false,
    isPlaying: false,
    screenWidth: 375,
    totalValid: 16
  },

  pageId: 'one-stroke-solver',

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ screenWidth: sysInfo.screenWidth });

    const saved = wx.getStorageSync('onestroke_saved');
    if (saved && saved.gridData) {
      _game = saved._game;
      this.setData({ ...saved, isPlaying: true });
      this.startTimer();
    } else {
      this.startGame('easy', 0);
    }

    preloadSounds(['click', 'win'], this.pageId);
  },

  onUnload() {
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      wx.setStorageSync('onestroke_saved', {
        ...this.data,
        _game: _game
      });
    }
  },

  calcCellSize(rows, cols) {
    const sw = this.data.screenWidth;
    const maxGridPx = sw * 0.92;
    const raw = Math.floor(maxGridPx / Math.max(rows, cols));
    return Math.max(28, Math.min(raw, 70));
  },

  startGame(difficulty, puzzleId) {
    wx.showLoading({ title: '加载中…' });
    const fileId = String(puzzleId + 1).padStart(4, '0');
    const url = `${CDN_BASE}${difficulty}-${fileId}.json?t=${Date.now()}`;

    wx.request({
      url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode !== 200 || !res.data) {
          // CDN失败，用内置生成器
          this.initLocalGame(difficulty);
          return;
        }

        const puzzle = res.data;
        this.initGame(difficulty, puzzleId, puzzle.holes || []);
      },
      fail: () => {
        wx.hideLoading();
        this.initLocalGame(difficulty);
      }
    });
  },

  initLocalGame(difficulty) {
    const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
    const { rows, cols } = cfg;
    const maxHoles = Math.floor(rows * cols * 0.3);
    const holeCount = Math.floor(Math.random() * (maxHoles + 1));
    const holes = this._generateRandomHoles(rows, cols, holeCount);
    this.initGame(difficulty, 0, holes);
  },

  _generateRandomHoles(rows, cols, count) {
    const total = rows * cols;
    const holes = [];
    while (holes.length < count) {
      const r = Math.floor(Math.random() * total);
      if (holes.indexOf(r) === -1) holes.push(r);
    }
    // 验证连通
    const gp = new GridPathFinder(rows, cols, holes);
    if (gp.isOneStroke()) return holes;
    // 减少洞
    return this._generateRandomHoles(rows, cols, Math.max(0, count - 1));
  },

  initGame(difficulty, puzzleId, holes) {
    const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
    const { rows, cols } = cfg;
    const cellSize = this.calcCellSize(rows, cols);

    // 初始化格子状态
    const grid = Array(rows * cols).fill(0);
    for (const h of holes) grid[h] = 1;

    const totalValid = grid.filter(v => v === 0).length;
    _game = { grid, rows, cols, path: [], difficulty, puzzleId, time: 0, timer: null, isComplete: false, isPlaying: true, totalValid };

    // 构建渲染数据
    const gridData = this._buildGridData(grid, rows, cols, []);

    this.setData({
      rows, cols, gridData, path: [],
      difficulty, puzzleId, cellSize, totalValid,
      time: 0, timeStr: '0:00',
      isComplete: false, isPlaying: true
    });

    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  _buildGridData(grid, rows, cols, path) {
    return grid.map((v, i) => ({
      type: v,       // 0=有效, 1=洞
      visited: path.indexOf(i) >= 0,
      pathIndex: path.indexOf(i)
    }));
  },

  // 判断两格子是否相邻
  _adjacent(a, b, cols) {
    const ra = Math.floor(a / cols), ca = a % cols;
    const rb = Math.floor(b / cols), cb = b % cols;
    return (Math.abs(ra - rb) === 1 && ca === cb) || (ra === rb && Math.abs(ca - cb) === 1);
  },

  onCellTap(e) {
    if (_game.isComplete || !_game.isPlaying) return;
    const idx = e.currentTarget.dataset.idx;
    const { grid, rows, cols, path } = _game;

    // 洞不能点击
    if (grid[idx] === 1) return;

    // 已在路径中
    if (path.indexOf(idx) >= 0) return;

    // 第一个格子：直接加入
    if (path.length === 0) {
      _game.path = [idx];
    } else {
      const last = path[path.length - 1];
      if (!this._adjacent(last, idx, cols)) {
        // 不相邻，提示
        wx.showToast({ title: '只能走相邻格子', icon: 'none', duration: 800 });
        return;
      }
      _game.path.push(idx);
    }

    const totalValid = _game.totalValid;
    const gridData = this._buildGridData(grid, rows, cols, _game.path);
    this.setData({ gridData, path: _game.path });
    this.playSoundIfEnabled('click');

    // 检查是否完成（所有有效格子都走完）
    const currentTotalValid = grid.filter(v => v === 0).length;
    if (_game.path.length === totalValid) {
      this._onComplete();
    }
  },

  _onComplete() {
    _game.isComplete = true;
    this.stopTimer();
    this.setData({ isComplete: true });
    this.playSoundIfEnabled('win');
    wx.removeStorageSync('onestroke_saved');

    wx.showModal({
      title: '🎉 全部通过！',
      content: `用时 ${this.formatTime(_game.time)}`,
      showCancel: false,
      confirmText: '下一题'
    }).then(() => this.nextPuzzle());
  },

  startTimer() {
    this.stopTimer();
    _game.timer = setInterval(() => {
      _game.time++;
      const m = Math.floor(_game.time / 60);
      const s = _game.time % 60;
      this.setData({ time: _game.time, timeStr: `${m}:${s.toString().padStart(2, '0')}` });
    }, 1000);
  },

  stopTimer() {
    if (_game.timer) {
      clearInterval(_game.timer);
      _game.timer = null;
    }
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== _game.difficulty) {
      this.startGame(difficulty, 0);
    }
  },

  nextPuzzle() {
    const { difficulty } = _game;
    const total = TOTAL_PUZZLES[difficulty] || 200;
    const nextId = (_game.puzzleId + 1) % total;
    this.startGame(difficulty, nextId);
  },

  onReset() {
    const { grid, rows, cols, difficulty, puzzleId } = _game;
    _game.path = [];
    _game.time = 0;
    _game.isComplete = false;
    const gridData = this._buildGridData(grid, rows, cols, []);
    this.setData({ gridData, path: [], time: 0, timeStr: '0:00', isComplete: false });
    this.stopTimer();
    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  playSoundIfEnabled(name) {
    if (isPageSoundEnabled(this.pageId)) {
      playSound(name, { pageId: this.pageId });
    }
  }
});
