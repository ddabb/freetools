/**
 * 一笔画 (One-Stroke Path) 游戏
 * 规则：从起点出发，一次经过所有有效格子，不重复，最终回到起点（或不回到起点）。
 * 交互：点击格子按顺序经过
 */

const GridPathFinder = require('../../utils/GridPathFinder');
const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 题库 CDN（本地优先）
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/one-stroke/';
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

// 答案动画定时器
let _answerAnimTimer = null;

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
    totalValid: 16,
    showAnswer: false,
    answerPath: [],
    answerAnimIndex: -1,
    maxPuzzles: 1000,
    jumpInputValue: '',
    currentPuzzleIndex: 1
  },

  pageId: 'one-stroke-solver',
  _gridRect: null,        // 棋盘区域位置信息（缓存）
  _lastTouchIdx: null,    // 上次触摸的格子索引
  _tapHandled: false,     // 防止tap和touch重复处理同一次点击

  onLoad(options) {
    console.log('[OneStroke] onLoad options:', options);
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

  preventBubble() {
    // 阻止触摸移动冒泡，防止拖动时页面滚动
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
    console.log('[OneStroke] startGame', difficulty, puzzleId);

    // 清除答案动画定时器
    if (_answerAnimTimer) {
      clearInterval(_answerAnimTimer);
      _answerAnimTimer = null;
    }

    wx.showLoading({ title: '加载中...' });
    const fileId = String(puzzleId + 1).padStart(4, '0');
    const cacheKey = 'cdn_onestroke_' + difficulty + '_' + fileId;
    const url = `${CDN_BASE}${difficulty}-${fileId}.json?t=${Date.now()}`;

    // 尝试缓存
    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.holes && cached.answer) {
      console.log('[OneStroke] 从缓存加载', cacheKey);
      wx.hideLoading();
      this.initGame(difficulty, puzzleId, cached.holes, cached.answer);
      return;
    }

    // 递增请求ID，用于防止竞态条件
    const loadId = ++this._loadId || 1;

    wx.request({
      url,
      success: (res) => {
        console.log('[OneStroke] CDN res', res.statusCode, url);
        wx.hideLoading();
        if (res.statusCode !== 200 || !res.data) {
          // CDN失败，用内置生成器
          this.initLocalGame(difficulty);
          return;
        }

        const puzzle = res.data;
        console.log('[OneStroke] puzzle holes:', puzzle.holes, 'ans:', puzzle.answer);
        console.log('[OneStroke] answer:', JSON.stringify(puzzle.answer));

        // 写入缓存
        if (puzzle.holes && puzzle.answer) {
          wx.setStorageSync(cacheKey, { holes: puzzle.holes, answer: puzzle.answer });
        }

        this.initGame(difficulty, puzzleId, puzzle.holes || [], puzzle.answer || null);
      },
      fail: () => {
        console.log('[OneStroke] CDN fail, local');
        wx.hideLoading();
        this.initLocalGame(difficulty);
      }
    });
  },

  initLocalGame(difficulty) {
    console.log('[OneStroke] initLocalGame', difficulty);
    const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
    const { rows, cols } = cfg;
    try {
      const holes = GridPathFinder.generateValidPuzzle(rows, cols, 0.3);
      console.log('[OneStroke] generate holes', holes);
      const finder = new GridPathFinder(rows, cols, holes);
      let start = 0;
      for (let i = 0; i < rows * cols; i++) {
        if (!holes.includes(i)) { start = i; break; }
      }
      finder.setPassedPotAndPath(0, start, true);
      finder.run(0);
      const answer = finder.getPath();
      console.log('[OneStroke] answer', answer ? answer.length : 'null');
      this.initGame(difficulty, 0, holes, answer);
    } catch (e) {
      console.error('本地生成题目失败:', e);
      wx.showToast({ title: '题目生成失败，请重试', icon: 'none' });
    }
  },

  initGame(difficulty, puzzleId, holes, answer) {
    console.log('[OneStroke] initGame', difficulty, puzzleId, 'holes:', JSON.stringify(holes), 'ans:', JSON.stringify(answer));
    const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
    const { rows, cols } = cfg;
    const cellSize = this.calcCellSize(rows, cols);

    const grid = Array(rows * cols).fill(0);
    for (const h of holes) grid[h] = 1;

    const totalValid = grid.filter(v => v === 0).length;
    _game = { grid, rows, cols, path: [], difficulty, puzzleId, time: 0, timer: null, isComplete: false, isPlaying: true, totalValid };

    if (answer && Array.isArray(answer) && answer.length > 0) {
      _game.answerPath = answer;
    } else {
      try {
        const finder = new GridPathFinder(rows, cols, holes);
        let start = 0;
        for (let i = 0; i < rows * cols; i++) {
          if (grid[i] === 0) { start = i; break; }
        }
        finder.setPassedPotAndPath(0, start, true);
        const hasSolution = finder.run(0);
        console.log('[OneStroke] run result', hasSolution);
        _game.answerPath = hasSolution ? finder.getPath() : null;
        console.log('[OneStroke] answerPath', _game.answerPath ? _game.answerPath.length : 0);
      } catch (e) {
        console.error('计算答案路径失败:', e);
        _game.answerPath = null;
      }
    }

    // 构建渲染数据（初始不显示答案）
    const gridData = this._buildGridData(grid, rows, cols, [], null);

    // 更新题号显示
    const currentPuzzleIndex = puzzleId + 1;
    const maxPuzzles = TOTAL_PUZZLES[difficulty] || 1000;

    this.setData({
      rows, cols, gridData, path: [],
      difficulty, puzzleId, cellSize, totalValid,
      time: 0, timeStr: '0:00',
      isComplete: false, isPlaying: true,
      showAnswer: false, answerPath: [], answerAnimIndex: -1,
      currentPuzzleIndex, maxPuzzles
    });

    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  _buildGridData(grid, rows, cols, path, answerPath, answerAnimIndex = -1) {
    return grid.map((v, i) => {
      const visited = path.indexOf(i) >= 0;
      const pathIndex = visited ? path.indexOf(i) : -1;
      const answerVisited = !visited && answerPath && answerPath.indexOf(i) >= 0;
      const answerPathIndex = answerVisited ? answerPath.indexOf(i) : -1;

      let answerType = '';
      if (answerVisited && answerPath && answerPath.length > 1) {
        const idx = answerPath.indexOf(i);
        if (idx === 0) {
          answerType = 'start';
        } else if (idx === answerPath.length - 1) {
          answerType = 'end';
        } else {
          answerType = 'path';
        }
      }

      const shouldShowAnswer = answerAnimIndex >= 0 && answerVisited && answerPathIndex <= answerAnimIndex;

      return {
        type: v,
        visited,
        pathIndex,
        answerVisited: shouldShowAnswer,
        answerPathIndex,
        answerType
      };
    });
  },

  // 判断两个格子是否相邻
  _adjacent(a, b, cols) {
    const ra = Math.floor(a / cols), ca = a % cols;
    const rb = Math.floor(b / cols), cb = b % cols;
    return (Math.abs(ra - rb) === 1 && ca === cb) || (ra === rb && Math.abs(ca - cb) === 1);
  },

  // 点击格子
  onCellTap(e) {
    console.log('[OneStroke] onCellTap idx:', e.currentTarget.dataset.idx);
    if (_game.isComplete || !_game.isPlaying) return;

    // 防止tap和touch重复处理同一次点击
    // 注意：onTouchStart 设了 _tapHandled=true，但截断操作后已手动重置
    // 这里只在确实是由touch触发的情况下才忽略，避免阻断后续正常点击
    if (this._tapHandled && this._touchActive) {
      this._tapHandled = false;
      return;
    }


    const idx = e.currentTarget.dataset.idx;
    const { grid, rows, cols, path } = _game;

    // 洞不能点击
    if (grid[idx] === 1) return;

    // 已在路径中 → 点击已绘制的格子，把之后的格子截断
    const existingIdx = path.indexOf(idx);
    if (existingIdx >= 0) {
      console.log('[OneStroke] truncate', existingIdx);
      _game.path = path.slice(0, existingIdx);
      this._updatePath();
      this.playSoundIfEnabled('click');
      // 截断后重置标志，允许后续点击正常处理
      this._tapHandled = false;
      return;
    }

    // 第一个格子：直接加入
    if (path.length === 0) {
      console.log('[OneStroke] first', idx);
      _game.path = [idx];
    } else {
      const last = path[path.length - 1];
      if (!this._adjacent(last, idx, cols)) {
        // 不相邻：清空旧路径，以该格子为新起点
        console.log('[OneStroke] reset/adjacent last:', last, 'idx:', idx);
        _game.path = [idx];
      } else {
        console.log('[OneStroke] add', idx);
        _game.path.push(idx);
      }
    }

    this._updatePath();
    this.playSoundIfEnabled('click');

    // 检查是否完成
    console.log('[OneStroke] path len', _game.path.length, 'valid', _game.totalValid);
    if (_game.path.length === _game.totalValid) {
      this._onComplete();
    }
  },

  // 触摸开始
  onTouchStart(e) {
    console.log('[OneStroke] onTouchStart', e.currentTarget.dataset.idx);
    if (_game.isComplete || !_game.isPlaying) return;
    this._tapHandled = true;   // 标记本次点击已被touch处理，阻止onCellTap再次处理
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

    // 第一个格子直接加入，或重置起点
    if (path.length === 0) {
      _game.path = [idx];
      this._updatePath();
      this.playSoundIfEnabled('click');
    } else {
      const last = path[path.length - 1];
      if (!this._adjacent(last, idx, cols) && grid[idx] !== 1) {
        // 不相邻且非洞：重置为新起点
        _game.path = [idx];
        this._updatePath();
        this.playSoundIfEnabled('click');
      }
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

  onTouchEnd(e) {
    this._touchActive = false;
    this._lastTouchIdx = null;
    // 标记本次touch已结束，下次tap可正常处理
    setTimeout(() => { this._tapHandled = false; }, 0);
  },

  // 更新路径显示
  _updatePath() {
    const { grid, rows, cols, path } = _game;
    const answerPath = this.data.showAnswer ? _game.answerPath : null;
    const answerAnimIndex = this.data.showAnswer ? this.data.answerAnimIndex : -1;
    const gridData = this._buildGridData(grid, rows, cols, path, answerPath, answerAnimIndex);
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
      wx.showLoading({ title: '切换难度...' });
      this.startGame(difficulty, 0);
    }
  },

  nextPuzzle() {
    // 清除答案动画定时器
    if (_answerAnimTimer) {
      clearInterval(_answerAnimTimer);
      _answerAnimTimer = null;
    }

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
  },

  // 查看答案：显示可行解路径（带循环动画效果）
  onShowAnswer() {
    if (!_game.answerPath) {
      wx.showToast({ title: '暂无答案', icon: 'none' });
      return;
    }

    // 清除之前的动画定时器
    if (_answerAnimTimer) {
      clearInterval(_answerAnimTimer);
      _answerAnimTimer = null;
    }

    // 保存用户路径，隐藏时需要恢复
    this._savedPath = _game.path.slice();
    this._savedTime = _game.time;

    // 清空用户路径，显示纯答案
    _game.path = [];
    _game.time = 0;
    this.stopTimer();

    this.setData({ showAnswer: true, answerAnimIndex: -1, path: [], time: 0, timeStr: '0:00' });
    this._updatePath();

    // 启动循环动画
    const totalSteps = _game.answerPath.length;

    const runAnimation = () => {
      let animIndex = 0;

      _answerAnimTimer = setInterval(() => {
        animIndex++;
        this.setData({ answerAnimIndex: animIndex });
        this._updatePath();

        if (animIndex >= totalSteps - 1) {
          clearInterval(_answerAnimTimer);
          _answerAnimTimer = null;
          // 等待一小段时间后重新开始动画
          setTimeout(() => {
            if (this.data.showAnswer) {
              runAnimation();
            }
          }, 500);
        }
      }, 150);
    };

    runAnimation();
    this.playSoundIfEnabled('click');
  },

  // 隐藏答案
  onHideAnswer() {
    // 清除动画定时器
    if (_answerAnimTimer) {
      clearInterval(_answerAnimTimer);
      _answerAnimTimer = null;
    }

    // 恢复用户路径
    _game.path = this._savedPath || [];
    _game.time = this._savedTime || 0;
    this._savedPath = null;
    this._savedTime = null;

    const timeStr = this.formatTime(_game.time);

    this.setData({ showAnswer: false, answerAnimIndex: -1, path: _game.path, time: _game.time, timeStr });
    this._updatePath();

    // 恢复计时器
    if (_game.path.length > 0 && !_game.isComplete) {
      this.startTimer();
    }

    this.playSoundIfEnabled('click');
  },

  // 跳关输入
  onJumpInput(e) {
    const value = e.detail.value;
    const max = this.data.maxPuzzles;
    let jumpInputValue = value;
    
    // 实时修正超出范围的值
    if (value && parseInt(value) > max) {
      jumpInputValue = String(max);
    }
    this.setData({ jumpInputValue });
  },

  // 执行跳关
  onJump() {
    const value = parseInt(this.data.jumpInputValue);
    const max = this.data.maxPuzzles;
    
    if (!value || value < 1) {
      this.setData({ jumpInputValue: '' });
      return;
    }
    
    const targetIndex = Math.min(value, max) - 1; // puzzleId 从 0 开始
    this.setData({ jumpInputValue: '', isComplete: false });
    this.startGame(_game.difficulty, targetIndex);
  }
});
