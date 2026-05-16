/**
 * 战舰 (Battleship Solitaire) 游戏 - CDN版
 * 规则：
 * 1. 根据边缘数字找出所有战舰位置
 * 2. 战舰形状：1×1(⚓), 1×2(🚢), 1×3(🛳️), 1×4(🚤)
 * 3. 边缘数字表示该行/列的战舰格子数
 * 4. 战舰不能重叠，但对角相邻是允许的
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/battleship';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

const CELL_EMPTY = 0;
const CELL_SHIP = 1;
const CELL_WATER = 2;

const utils = require('../../../../utils/index');
const { playSound, preloadSounds } = utils;

Page({
  behaviors: [adBehavior],
  data: {
    rows: 6,
    cols: 6,
    grid: [],           // grid[r][c] = CELL_EMPTY/CELL_SHIP/CELL_WATER
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
    shipCount: 0,
    rowHints: [],
    colHints: []
  },

  timer: null,
  _currentPuzzle: null,
  _loadId: 0,
  _pageId: 'battleship',

  onLoad(options) {
    const saved = wx.getStorageSync('battleship_saved');
    if (saved && saved.grid) {
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false
      });
      this._currentPuzzle = { grid: saved.grid };
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      this.loadPuzzle(difficulty, 0);
    }
  },

  onUnload() {
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      wx.setStorageSync('battleship_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        grid: this.data.grid,
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
    
    this.setData({ isPlaying: false, isComplete: false, showAnswer: false });

    const filename = difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_battleship_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      cached._loadId = loadId;
      this._applyPuzzle(cached, difficulty, puzzleId, maxPuzzles);
      return;
    }

    wx.request({
      url: CDN_BASE + '/' + filename + '?t=' + Date.now(),
      method: 'GET',
      timeout: 10000,
      success(res) {
        if (loadId !== self._loadId) return;
        if (res.statusCode === 200 && res.data && res.data.grid) {
          wx.setStorageSync(cacheKey, res.data);
          res.data._loadId = loadId;
          self._applyPuzzle(res.data, difficulty, puzzleId, maxPuzzles);
        } else {
          self._loadFallback(difficulty, puzzleId, maxPuzzles);
        }
      },
      fail(err) {
        if (loadId !== self._loadId) return;
        self._loadFallback(difficulty, puzzleId, maxPuzzles);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles) {
    const size = puzzleData.size || 6;
    const rows = size, cols = size;

    let grid = puzzleData.grid;
    if (typeof grid[0][0] === 'string') {
      grid = grid.map(row => row.map(cell => cell === 'S' ? CELL_SHIP : CELL_EMPTY));
    }

    const displayGrid = Array(rows).fill(null).map(() => Array(cols).fill(CELL_EMPTY));

    let shipCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === CELL_SHIP) shipCount++;
      }
    }

    this._currentPuzzle = { grid };

    const cellSize = this._calcCellSize(rows, cols);

    const rowHints = puzzleData.rowCounts || Array(rows).fill(0);
    const colHints = puzzleData.colCounts || Array(cols).fill(0);

    this.setData({
      rows,
      cols,
      grid: displayGrid,
      difficulty,
      puzzleId,
      jumpInputValue: '',
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      cellSize,
      shipCount: 0,
      maxPuzzles,
      rowHints,
      colHints
    });

    this.startTimer();
  },

  _calcCellSize(rows, cols) {
    const sysInfo = wx.getSystemInfoSync();
    const maxW = sysInfo.windowWidth - 40;
    const maxH = sysInfo.windowHeight - 300;
    const sizeByW = Math.floor(maxW / cols);
    const sizeByH = Math.floor(maxH / rows);
    return Math.max(25, Math.min(sizeByW, sizeByH, 50));
  },

  _loadFallback(difficulty, puzzleId, maxPuzzles) {
    const size = difficulty === 'easy' ? 6 : (difficulty === 'medium' ? 8 : 10);
    const rows = size, cols = size;

    const grid = Array(rows).fill(null).map(() => Array(cols).fill(CELL_EMPTY));

    const ships = [];
    const shipTypes = difficulty === 'easy' 
      ? [3, 2, 2, 1, 1]
      : difficulty === 'medium' 
        ? [4, 3, 2, 2, 1, 1]
        : [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

    for (const length of shipTypes) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const isHorizontal = Math.random() > 0.5;
        const r = Math.floor(Math.random() * (rows - (isHorizontal ? 0 : length - 1)));
        const c = Math.floor(Math.random() * (cols - (isHorizontal ? length - 1 : 0)));

        let canPlace = true;
        for (let i = 0; i < length; i++) {
          const nr = isHorizontal ? r : r + i;
          const nc = isHorizontal ? c + i : c;
          if (nr >= rows || nc >= cols || grid[nr][nc] === CELL_SHIP) {
            canPlace = false;
            break;
          }
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const checkR = nr + dr;
              const checkC = nc + dc;
              if (checkR >= 0 && checkR < rows && checkC >= 0 && checkC < cols && grid[checkR][checkC] === CELL_SHIP) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < length; i++) {
            const nr = isHorizontal ? r : r + i;
            const nc = isHorizontal ? c + i : c;
            grid[nr][nc] = CELL_SHIP;
          }
          ships.push({ r, c, length, isHorizontal });
          placed = true;
        }
      }
    }

    const rowCounts = Array(rows).fill(0);
    const colCounts = Array(cols).fill(0);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === CELL_SHIP) {
          rowCounts[r]++;
          colCounts[c]++;
        }
      }
    }

    const puzzleData = { size, grid, rowCounts, colCounts };
    puzzleData._loadId = this._loadId;
    this._applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles);
  },

  startTimer() {
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
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onCellTap(e) {
    if (this.data.isComplete) return;
    const { row, col } = e.currentTarget.dataset;
    const { grid } = this.data;

    grid[row][col] = grid[row][col] === CELL_EMPTY ? CELL_SHIP : (grid[row][col] === CELL_SHIP ? CELL_WATER : CELL_EMPTY);

    let shipCount = 0;
    for (let r = 0; r < this.data.rows; r++) {
      for (let c = 0; c < this.data.cols; c++) {
        if (grid[r][c] === CELL_SHIP) shipCount++;
      }
    }

    this.setData({ grid, shipCount });
    playSound('click', { pageId: this._pageId });
    this.checkCompletion();
  },

  checkCompletion() {
    const { rows, cols, grid, rowHints, colHints } = this.data;
    const solution = this._currentPuzzle.grid;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === CELL_SHIP && solution[r][c] !== CELL_SHIP) {
          return;
        }
        if (grid[r][c] !== CELL_SHIP && solution[r][c] === CELL_SHIP) {
          return;
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      let cnt = 0;
      for (let c = 0; c < cols; c++) { if (grid[r][c] === CELL_SHIP) cnt++; }
      if (cnt !== rowHints[r]) return;
    }

    for (let c = 0; c < cols; c++) {
      let cnt = 0;
      for (let r = 0; r < rows; r++) { if (grid[r][c] === CELL_SHIP) cnt++; }
      if (cnt !== colHints[c]) return;
    }

    playSound('win', { vibrate: true, pageId: this._pageId });
    this.setData({ isComplete: true });
    this.stopTimer();
    wx.removeStorageSync('battleship_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '下一题'
    }).then(() => this.nextPuzzle());
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
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
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(difficulty, nextId);
  },

  onJumpInputInline(e) {
    const v = e.detail.value;
    const max = this.data.maxPuzzles;
    let jumpInputValue = v;
    if (v && parseInt(v) > max) jumpInputValue = String(max);
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
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(this.data.difficulty, targetId);
  },

  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      const solution = this._currentPuzzle.grid;
      let shipCount = 0;
      for (let r = 0; r < this.data.rows; r++) {
        for (let c = 0; c < this.data.cols; c++) {
          if (solution[r][c] === CELL_SHIP) shipCount++;
        }
      }
      this.setData({ showAnswer, grid: solution, shipCount });
    } else {
      const { rows, cols } = this.data;
      const grid = Array(rows).fill(null).map(() => Array(cols).fill(CELL_EMPTY));
      this.setData({ showAnswer, grid, shipCount: 0 });
    }
  },

  onShowRules() {
    this.setData({ showRules: true });
  },

  onHideRules() {
    this.setData({ showRules: false });
  },

  stopPropagation() {},

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
});
const adBehavior = require('../../../../utils/ad-behavior');