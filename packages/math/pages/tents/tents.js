/**
 * 帐篷 (Tents) 游戏 - CDN版
 * 规则：
 * 1. 每个树旁必须放一个帐篷
 * 2. 帐篷必须紧邻树（上下左右）
 * 3. 每个树只能有一个帐篷
 * 4. 帐篷之间不能水平或垂直相邻
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/tents';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

const CELL_EMPTY = 0;
const CELL_TREE = 1;

const utils = require('../../../../utils/index');
const { playSound, preloadSounds } = utils;

Page({
  data: {
    rows: 6,
    cols: 6,
    grid: [],           // grid[r][c] = CELL_EMPTY or CELL_TREE
    tents: [],          // tents[r][c] = true/false
    difficulty: 'easy',
    puzzleId: 0,
    jumpInputValue: '',
    time: 0,
    timeStr: '0:00',
    isPlaying: false,
    isComplete: false,
    cellSize: 45,
    showAnswer: false,
    showRules: false,
    maxPuzzles: 1000,
    treeCount: 0,
    tentCount: 0,
    rowHints: [],
    colHints: []
  },

  timer: null,
  _currentPuzzle: null,
  _loadId: 0,
  _pageId: 'tents',

  onLoad(options) {
    console.log('[Tents] onLoad 开始加载页面');
    const saved = wx.getStorageSync('tents_saved');
    if (saved && saved.grid) {
      console.log('[Tents] 使用本地缓存数据');
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false
      });
      this._currentPuzzle = { grid: saved.grid };
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      console.log(`[Tents] 从 ${difficulty} 难度第 1 题开始`);
      this.loadPuzzle(difficulty, 0);
    }
  },

  onUnload() {
    console.log('[Tents] onUnload 页面卸载');
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      console.log('[Tents] 保存游戏状态');
      wx.setStorageSync('tents_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        grid: this.data.grid,
        tents: this.data.tents,
        difficulty: this.data.difficulty,
        puzzleId: this.data.puzzleId,
        time: this.data.time
      });
    }
  },

  loadPuzzle(difficulty, puzzleId) {
    const self = this;
    const loadId = ++this._loadId;
    const maxPuzzles = TOTAL_PUZZLES[difficulty];
    
    console.log(`[Tents] loadPuzzle ${difficulty} 难度第 ${puzzleId + 1}/${maxPuzzles} 题, loadId=${loadId}`);

    this.setData({ isPlaying: false, isComplete: false, showAnswer: false });

    const filename = difficulty + '/' + difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_tents_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      console.log('[Tents] 使用本地缓存的题目');
      cached._loadId = loadId;
      this._applyPuzzle(cached, difficulty, puzzleId, maxPuzzles);
      return;
    }

    wx.request({
      url: CDN_BASE + '/' + filename + '?t=' + Date.now(),
      method: 'GET',
      timeout: 10000,
      success(res) {
        if (loadId !== self._loadId) {
          console.log('[Tents] loadId 不匹配，忽略请求');
          return;
        }

        if (res.statusCode === 200 && res.data && res.data.grid) {
          console.log('[Tents] 从网络加载题目成功，保存缓存');
          wx.setStorageSync(cacheKey, res.data);
          res.data._loadId = loadId;
          self._applyPuzzle(res.data, difficulty, puzzleId, maxPuzzles);
        } else {
          console.error('[Tents] 从网络加载题目失败，状态码:', res.statusCode);
          self._loadFallback(difficulty, puzzleId, maxPuzzles);
        }
      },
      fail(err) {
        if (loadId !== self._loadId) {
          console.log('[Tents] loadId 不匹配，忽略失败');
          return;
        }
        console.error('[Tents] 网络请求失败:', err);
        self._loadFallback(difficulty, puzzleId, maxPuzzles);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles) {
    console.log('[Tents] _applyPuzzle 开始应用题目数据');

    const size = puzzleData.size || 6;
    const rows = size, cols = size;

    let grid = puzzleData.grid;
    if (typeof grid[0][0] === 'string') {
      grid = grid.map(row => row.map(cell => cell === 'T' ? CELL_TREE : CELL_EMPTY));
    }

    const tents = Array(rows).fill(null).map(() => Array(cols).fill(false));

    let treeCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === CELL_TREE) treeCount++;
      }
    }
    console.log(`[Tents] 题目有 ${treeCount} 棵树`);

    const solutionTents = puzzleData.tents;
    const solutionTentsArray = Array(rows).fill(null).map(() => Array(cols).fill(false));
    if (solutionTents) {
      for (const key in solutionTents) {
        const [r, c] = key.split(',').map(Number);
        if (solutionTents[key]) {
          solutionTentsArray[r][c] = true;
        }
      }
    }
    this._currentPuzzle = { grid, tents: solutionTentsArray };

    const cellSize = this._calcCellSize(rows, cols);
    console.log(`[Tents] 计算出的格子大小: ${cellSize}`);

    // 行列提示
    const rowHints = puzzleData.rowCounts || Array(rows).fill(0);
    const colHints = puzzleData.colCounts || Array(cols).fill(0);

    this.setData({
      rows,
      cols,
      grid,
      tents,
      difficulty,
      puzzleId,
      jumpInputValue: '',
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      cellSize,
      treeCount,
      tentCount: 0,
      maxPuzzles,
      rowHints,
      colHints
    });

    this.startTimer();
    console.log('[Tents] 题目加载完成');
  },

  _calcCellSize(rows, cols) {
    const sysInfo = wx.getSystemInfoSync();
    const maxW = sysInfo.windowWidth - 40;
    const maxH = sysInfo.windowHeight - 300;
    const sizeByW = Math.floor(maxW / cols);
    const sizeByH = Math.floor(maxH / rows);
    const cellSize = Math.max(25, Math.min(sizeByW, sizeByH, 50));
    console.log(`[Tents] _calcCellSize 屏幕 ${maxW}x${maxH}, 格子 ${rows}x${cols}, 计算结果 ${cellSize}`);
    return cellSize;
  },

  _loadFallback(difficulty, puzzleId, maxPuzzles) {
    console.log('[Tents] 使用本地随机题目');
    const size = difficulty === 'easy' ? 6 : (difficulty === 'medium' ? 8 : 10);
    const rows = size, cols = size;

    const grid = Array(rows).fill(null).map(() => Array(cols).fill(CELL_EMPTY));

    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push([r, c]);
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const treeCount = Math.min(rows + cols, Math.floor(rows * cols * 0.3));
    for (let i = 0; i < treeCount; i++) {
      grid[cells[i][0]][cells[i][1]] = CELL_TREE;
    }

    const puzzleData = { size, grid, tents: null };
    puzzleData._loadId = this._loadId;
    this._applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles);
  },

  startTimer() {
    console.log('[Tents] startTimer 计时器启动');
    this.stopTimer();
    this.timer = setInterval(() => {
      const time = this.data.time + 1;
      const m = Math.floor(time / 60);
      const s = time % 60;
      this.setData({
        time,
        timeStr: `${m}:${s.toString().padStart(2, '0')}`
      });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      console.log('[Tents] stopTimer 计时器停止');
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onCellTap(e) {
    if (this.data.isComplete) return;
    const { row, col } = e.currentTarget.dataset;
    const { grid, tents } = this.data;

    if (grid[row][col] === CELL_TREE) {
      console.log(`[Tents] onCellTap 不能在树格 (${row},${col}) 放置帐篷`);
      return;
    }

    tents[row][col] = !tents[row][col];

    let tentCount = 0;
    for (let r = 0; r < this.data.rows; r++) {
      for (let c = 0; c < this.data.cols; c++) {
        if (tents[r][c]) tentCount++;
      }
    }

    console.log(`[Tents] onCellTap (${row},${col}) 切换帐篷，当前 ${tentCount} 个`);
    this.setData({ tents, tentCount });
    playSound('click', { pageId: this._pageId });
    this.checkCompletion();
  },

  checkCompletion() {
    console.log('[Tents] checkCompletion 开始检查完成');
    const { rows, cols, grid, tents, rowHints, colHints } = this.data;

    // 1. 每棵树必须有1个帐篷紧邻
    const treeWithTent = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === CELL_TREE) {
          treeWithTent[`${r},${c}`] = false;
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tents[r][c]) {
          let hasAdjacentTree = false;
          const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === CELL_TREE) {
              hasAdjacentTree = true;
              treeWithTent[`${nr},${nc}`] = true;
            }
          }
          if (!hasAdjacentTree) {
            console.log(`[Tents] ❌ 帐篷 (${r},${c}) 旁边没有树`);
            return;
          }
        }
      }
    }

    for (const key in treeWithTent) {
      if (!treeWithTent[key]) {
        const [r, c] = key.split(',').map(Number);
        console.log(`[Tents] ❌ 树 (${r},${c}) 旁边没有帐篷`);
        return;
      }
    }

    // 2. 帐篷之间不能相邻（含对角线）
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tents[r][c]) {
          const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && tents[nr][nc]) {
              console.log(`[Tents] ❌ 帐篷 (${r},${c}) 和 (${nr},${nc}) 相邻`);
              return;
            }
          }
        }
      }
    }

    // 3. 行列提示验证
    if (rowHints && rowHints.length > 0) {
      for (let r = 0; r < rows; r++) {
        let cnt = 0;
        for (let c = 0; c < cols; c++) { if (tents[r][c]) cnt++; }
        if (cnt !== rowHints[r]) {
          console.log(`[Tents] ❌ 第 ${r} 行帐篷数 ${cnt} ≠ 提示 ${rowHints[r]}`);
          return;
        }
      }
    }
    if (colHints && colHints.length > 0) {
      for (let c = 0; c < cols; c++) {
        let cnt = 0;
        for (let r = 0; r < rows; r++) { if (tents[r][c]) cnt++; }
        if (cnt !== colHints[c]) {
          console.log(`[Tents] ❌ 第 ${c} 列帐篷数 ${cnt} ≠ 提示 ${colHints[c]}`);
          return;
        }
      }
    }

    console.log('[Tents] ✅ 所有检查通过！');
    playSound('win', { vibrate: true, pageId: this._pageId });
    this.setData({ isComplete: true });
    this.stopTimer();
    wx.removeStorageSync('tents_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '下一题'
    }).then(() => this.nextPuzzle());
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    console.log(`[Tents] onDifficultyChange 切换到 ${difficulty} 难度`);
    if (difficulty !== this.data.difficulty) {
      const maxPuzzles = TOTAL_PUZZLES[difficulty];
      this.setData({ maxPuzzles, jumpInputValue: '' });
      this.loadPuzzle(difficulty, 0);
    }
  },

  nextPuzzle() {
    const { difficulty, puzzleId } = this.data;
    const total = TOTAL_PUZZLES[difficulty] || 1000;
    const nextId = (puzzleId + 1) % total;
    console.log(`[Tents] nextPuzzle 切换到第 ${nextId + 1} 题`);
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(difficulty, nextId);
  },

  onJumpInputInline(e) {
    const v = e.detail.value;
    const max = this.data.maxPuzzles;
    let jumpInputValue = v;
    if (v && parseInt(v) > max) jumpInputValue = String(max);
    console.log(`[Tents] onJumpInputInline 输入: ${v}, 处理后: ${jumpInputValue}`);
    this.setData({ jumpInputValue });
  },

  onJump() {
    const value = parseInt(this.data.jumpInputValue);
    const max = this.data.maxPuzzles;
    
    if (!value || value < 1) {
      this.setData({ jumpInputValue: '' });
      return;
    }
    
    const targetId = Math.min(value, max) - 1;
    console.log(`[Tents] onJump 跳转到第 ${targetId + 1} 题`);
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(this.data.difficulty, targetId);
  },

  onReset() {
    console.log('[Tents] onReset 重置题目');
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    console.log(`[Tents] onShowAnswer ${showAnswer ? '显示' : '隐藏'}答案`);
    if (showAnswer) {
      const { rows, cols } = this.data;
      const solutionTents = this._currentPuzzle.tents;
      if (solutionTents) {
        console.log('[Tents] 使用题目中的答案');
        this.setData({ showAnswer, tents: solutionTents });
      } else {
        console.log('[Tents] 暂无答案数据');
        wx.showToast({ title: '暂无答案', icon: 'none' });
      }
    } else {
      const { rows, cols, grid } = this.data;
      const tents = Array(rows).fill(null).map(() => Array(cols).fill(false));
      let tentCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tents[r][c]) tentCount++;
        }
      }
      console.log('[Tents] 隐藏答案，清除帐篷');
      this.setData({ showAnswer, tents, tentCount });
    }
  },

  onShowRules() {
    console.log('[Tents] onShowRules 显示规则');
    this.setData({ showRules: true });
  },

  onHideRules() {
    console.log('[Tents] onHideRules 隐藏规则');
    this.setData({ showRules: false });
  },

  stopPropagation() {
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
});