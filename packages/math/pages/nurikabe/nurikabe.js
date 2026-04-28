/**
 * 数墙 (Nurikabe) 游戏
 * 规则：
 * 1. 每个数字格子属于一个大小等于该数字的白色连通区域
 * 2. 所有黑色格子连通
 * 3. 没有 2×2 的全黑区域
 */

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// CDN 路径
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/nurikabe/';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

// 格子状态
const CELL_WHITE = 0;
const CELL_BLACK = 1;

// 题库缓存
let puzzleCache = { easy: 0, hard: 0 };

Page({
  data: {
    rows: 5,
    cols: 5,
    numbers: [],
    board: [],
    difficulty: 'easy',
    puzzleId: 0,
    time: 0,
    timeStr: '0:00',
    isPlaying: false,
    isComplete: false,
    cellSize: 50,
    showAnswer: false,
    screenWidth: 375
  },

  timer: null,
  pageId: 'nurikabe',

  onLoad(options) {
    // 获取屏幕宽度用于计算格子大小
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ screenWidth: sysInfo.screenWidth });

    const saved = wx.getStorageSync('nurikabe_saved');
    if (saved && saved.board) {
      this.setData({ ...saved, isPlaying: true });
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      this.loadPuzzle(difficulty, 0);
    }

    preloadSounds(['click', 'win'], this.pageId);
  },

  onUnload() {
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      wx.setStorageSync('nurikabe_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        numbers: this.data.numbers,
        board: this.data.board,
        difficulty: this.data.difficulty,
        puzzleId: this.data.puzzleId,
        time: this.data.time
      });
    }
  },

  // 计算格子大小，适配屏幕
  calcCellSize(rows, cols) {
    const sw = this.data.screenWidth;
    // 游戏区最大占屏幕 95%，两边各留边距
    const maxGridPx = sw * 0.95;
    const rawSize = Math.floor(maxGridPx / Math.max(rows, cols));
    return Math.max(24, Math.min(rawSize, 50));
  },

  loadPuzzle(difficulty, puzzleId) {
    wx.showLoading({ title: '加载中…' });

    const fileId = String(puzzleId + 1).padStart(4, '0');
    const url = `${CDN_BASE}${difficulty}-${fileId}.json?t=${Date.now()}`;

    wx.request({
      url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode !== 200 || !res.data || !res.data.grid) {
          wx.showToast({ title: '加载失败', icon: 'none' });
          return;
        }

        const puzzle = res.data;
        const rows = puzzle.size;
        const cols = puzzle.size;
        const numbers = puzzle.grid;
        const cellSize = this.calcCellSize(rows, cols);

        // 初始化：数字格为白，其他未确定
        const board = Array(rows).fill(null).map((_, r) =>
          Array(cols).fill(null).map((_, c) => CELL_WHITE)
        );

        this.setData({
          rows, cols, numbers, board,
          difficulty,
          puzzleId,
          time: 0,
          timeStr: '0:00',
          cellSize,
          isPlaying: true,
          isComplete: false,
          showAnswer: false
        });

        this.startTimer();
        this.playSoundIfEnabled('click');
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 预加载下一题到缓存
  preloadNext(difficulty, puzzleId) {
    const fileId = String(puzzleId + 1).padStart(4, '0');
    const url = `${CDN_BASE}${difficulty}-${fileId}.json`;
    wx.request({ url, success: () => {} });
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      const time = this.data.time + 1;
      const m = Math.floor(time / 60);
      const s = time % 60;
      this.setData({ time, timeStr: `${m}:${s.toString().padStart(2, '0')}` });
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
    const { numbers, board } = this.data;

    if (numbers[row][col] > 0) return; // 数字格不能涂黑

    board[row][col] = board[row][col] === CELL_WHITE ? CELL_BLACK : CELL_WHITE;
    this.setData({ board });
    this.playSoundIfEnabled('click');
    this.checkCompletion();
  },

  checkCompletion() {
    const { rows, cols, numbers, board } = this.data;

    // 1. 检查没有 2×2 全黑
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        if (board[r][c] === CELL_BLACK &&
            board[r][c + 1] === CELL_BLACK &&
            board[r + 1][c] === CELL_BLACK &&
            board[r + 1][c + 1] === CELL_BLACK) {
          return;
        }
      }
    }

    // 2. 检查每个数字格的白色区域大小
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (numbers[r][c] > 0) {
          if (this.countWhiteRegion(r, c, visited) !== numbers[r][c]) return;
        }
      }
    }

    // 3. 检查所有黑格连通
    if (!this.areBlackCellsConnected()) return;

    // 4. 检查白色区域数量 = 数字数量
    if (!this.areWhiteRegionsSeparated()) return;

    // 完成！
    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');
    wx.removeStorageSync('nurikabe_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '下一题'
    }).then(() => this.nextPuzzle());
  },

  countWhiteRegion(startR, startC, visited) {
    const { rows, cols, board } = this.data;
    const queue = [[startR, startC]];
    let count = 0;
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (visited[r][c] || board[r][c] === CELL_BLACK) continue;
      visited[r][c] = true;
      count++;
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
    return count;
  },

  areBlackCellsConnected() {
    const { rows, cols, board } = this.data;
    let startR = -1, startC = -1;
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === CELL_BLACK) { startR = r; startC = c; break outer; }
      }
    }
    if (startR === -1) return false;

    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const queue = [[startR, startC]];
    let connectedCount = 0;
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (visited[r][c] || board[r][c] !== CELL_BLACK) continue;
      visited[r][c] = true;
      connectedCount++;
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    let totalBlack = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (board[r][c] === CELL_BLACK) totalBlack++;
    return connectedCount === totalBlack;
  },

  areWhiteRegionsSeparated() {
    const { rows, cols, numbers, board } = this.data;
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    let regionCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited[r][c] && board[r][c] === CELL_WHITE) {
          this.countWhiteRegion(r, c, visited);
          regionCount++;
        }
      }
    }
    let numberCount = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (numbers[r][c] > 0) numberCount++;
    return regionCount === numberCount;
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== this.data.difficulty) {
      this.loadPuzzle(difficulty, 0);
    }
  },

  nextPuzzle() {
    const { difficulty, puzzleId } = this.data;
    const total = TOTAL_PUZZLES[difficulty] || 1000;
    const nextId = (puzzleId + 1) % total;
    this.preloadNext(difficulty, nextId);
    this.loadPuzzle(difficulty, nextId);
  },

  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      const { rows, cols, numbers } = this.data;
      const board = Array(rows).fill(null).map((_, r) =>
        Array(cols).fill(null).map((_, c) =>
          numbers[r][c] > 0 ? CELL_WHITE : CELL_BLACK
        )
      );
      this.setData({ showAnswer, board });
    } else {
      this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
    }
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
