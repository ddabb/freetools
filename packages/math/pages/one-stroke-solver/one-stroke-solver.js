/**
 * 一笔画 (One-Stroke Path) 游戏
 * 规则：从起点出发，一次经过所有有效格子，不重复，最终回到起点（或不回到起点）。
 * 交互：点击格子按顺序经过
 */

const GridPathFinder = require('../../utils/GridPathFinder');
const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 题库 CDN（本地优先）
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/one-stroke/';
const LOCAL_BASE = '';  // 使用本地 data/one-stroke/ 目录
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

// 难度配置
const DIFFICULTY_CONFIG = {
  easy:   { rows: 6, cols: 6 },
  medium: { rows: 8, cols: 8 },
  hard:   { rows: 10, cols: 10 }
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
  isPlaying: false,
  totalValid: 16
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
  _gridRect: null,        // 棋盘区域位置信息（缓存）
  _lastTouchIdx: null,    // 上次触摸的格子索引
  _touchActive: false,     // 当前是否处于触摸绘制中（防止tap和touch冲突）

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
    // 根据棋盘大小调整最大占用比例
    const maxRatio = rows <= 6 ? 0.92 : (rows <= 8 ? 0.88 : 0.85);
    const maxGridPx = sw * maxRatio;
    const raw = Math.floor(maxGridPx / Math.max(rows, cols));
    // 不同大小棋盘的格子尺寸范围
    const minSize = rows >= 10 ? 26 : (rows >= 8 ? 30 : 32);
    const maxSize = rows <= 6 ? 70 : (rows <= 8 ? 55 : 45);
    return Math.max(minSize, Math.min(raw, maxSize));
  },

  startGame(difficulty, puzzleId) {
    wx.showLoading({ title: '加载中...' });
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
    // 使用 GridPathFinder.generateValidPuzzle 生成有效的一笔画题目
    const holes = GridPathFinder.generateValidPuzzle(rows, cols, 0.3);
    this.initGame(difficulty, 0, holes);
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

  // 判断两个格子是否相邻
  _adjacent(a, b, cols) {
    const ra = Math.floor(a / cols), ca = a % cols;
    const rb = Math.floor(b / cols), cb = b % cols;
    return (Math.abs(ra - rb) === 1 && ca === cb) || (ra === rb && Math.abs(ca - cb) === 1);
  },

  // 点击格子
  onCellTap(e) {
    if (_game.isComplete || !_game.isPlaying) return;
    const idx = e.currentTarget.dataset.idx;
    const { grid, rows, cols, path } = _game;

    // 洞不能点击
    if (grid[idx] === 1) return;

    // 已在路径中 → 点击已绘制的格子，把之后的格子截断
    const existingIdx = path.indexOf(idx);
    if (existingIdx >= 0) {
      _game.path = path.slice(0, existingIdx);
      this._updatePath();
      this.playSoundIfEnabled('click');
      return;
    }

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

    this._updatePath();
    this.playSoundIfEnabled('click');

    // 检查是否完成
    if (_game.path.length === _game.totalValid) {
      this._onComplete();
    }
  },

  // 触摸开始
  onTouchStart(e) {
    if (_game.isComplete || !_game.isPlaying) return;
    this._touchActive = true;

    const idx = e.currentTarget.dataset.idx;
    const { grid, path } = _game;

    // 已在路径中 → 点击已绘制格子，截断路径
    const existingIdx = path.indexOf(idx);
    if (existingIdx >= 0) {
      _game.path = path.slice(0, existingIdx);
      this._updatePath();
      this.playSoundIfEnabled('click');
      this._lastTouchIdx = existingIdx > 0 ? path[existingIdx - 1] : null;
      return;
    }

    // 洞则返回
    if (grid[idx] === 1) return;

    // 第一个格子直接加入
    if (path.length === 0) {
      _game.path = [idx];
      this._updatePath();
      this.playSoundIfEnabled('click');
    }

    // 缓存棋盘区域位置
    this._updateGridRect();
    this._lastTouchIdx = path.length > 0 ? path[path.length - 1] : idx;
  },

  // 触摸移动（滑动连续走格子）
  onTouchMove(e) {
    if (_game.isComplete || !_game.isPlaying || !this._touchActive) return;

    const touch = e.touches[0];
    const idx = this._getCellFromPointSync(touch);
    if (idx === null) return;

    const { grid, rows, cols, path } = _game;

    // 洞或已在路径中则跳过
    if (grid[idx] === 1 || path.indexOf(idx) >= 0) return;

    // 必须与上一个格子相邻
    const last = path.length > 0 ? path[path.length - 1] : null;
    if (last === null || !this._adjacent(last, idx, cols)) return;

    // 防止同一格子重复触发
    if (this._lastTouchIdx === idx) return;

    _game.path.push(idx);
    this._lastTouchIdx = idx;
    this._updatePath();
    this.playSoundIfEnabled('click');

    // 检查完成
    if (_game.path.length === _game.totalValid) {
      this._onComplete();
    }
  },

  // 触摸结束
  onTouchEnd(e) {
    this._touchActive = false;
    this._lastTouchIdx = null;
  },

  // 更新路径显示
  _updatePath() {
    const { grid, rows, cols, path } = _game;
    const gridData = this._buildGridData(grid, rows, cols, path);
    this.setData({ gridData, path: path.slice() });
  },

  // 更新棋盘区域位置缓存
  _updateGridRect() {
    const query = wx.createSelectorQuery();
    query.select('.game-area').boundingClientRect((rect) => {
      this._gridRect = rect;
    }).exec();
  },

  // 根据触摸坐标同步获取格子索引
  _getCellFromPointSync(touch) {
    const { rows, cols, cellSize } = this.data;

    if (!this._gridRect) return null;

    const x = touch.clientX - this._gridRect.left;
    const y = touch.clientY - this._gridRect.top;

    // 计算格子坐标
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    // 边界检查
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;

    return row * cols + col;
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
