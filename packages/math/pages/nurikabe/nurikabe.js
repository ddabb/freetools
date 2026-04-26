/**
 * 数墙 (Nurikabe) 游戏
 * 规则：
 * 1. 每个数字格子属于一个大小等于该数字的白色连通区域
 * 2. 所有黑色格子连通
 * 3. 没有 2×2 的全黑区域
 */

const { playSound, preloadSounds, isPageSoundEnabled } = require('../../../../utils/index');

// 格子状态
const CELL_WHITE = 0;  // 白格（未确定）
const CELL_BLACK = 1;  // 黑格
const CELL_NUMBER = 2; // 数字格（属于白格）

// 题库 - 数字表示该格子所属白色区域的大小
const PUZZLES = {
  easy: [
    {
      rows: 5, cols: 5,
      numbers: [
        [0, 0, 0, 0, 0],
        [0, 2, 0, 0, 1],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 3, 0],
        [0, 0, 0, 0, 0]
      ]
    },
    {
      rows: 5, cols: 5,
      numbers: [
        [0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ]
    }
  ],
  medium: [
    {
      rows: 8, cols: 8,
      numbers: [
        [0, 0, 0, 0, 0, 0, 2, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 3, 0, 0, 0, 0, 0, 0]
      ]
    }
  ],
  hard: [
    {
      rows: 10, cols: 10,
      numbers: [
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 4, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 3, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    }
  ]
};

Page({
  data: {
    rows: 5,
    cols: 5,
    numbers: [],      // 数字提示
    board: [],        // 当前状态 0=白 1=黑
    difficulty: 'easy',
    puzzleId: 0,
    time: 0,
    isPlaying: false,
    isComplete: false,
    cellSize: 50
  },

  timer: null,
  pageId: 'nurikabe',

  onLoad(options) {
    const saved = wx.getStorageSync('nurikabe_saved');
    if (saved && saved.board) {
      this.setData({
        ...saved,
        isPlaying: true
      });
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

  loadPuzzle(difficulty, puzzleId) {
    const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
    const puzzle = puzzles[puzzleId % puzzles.length];

    // 初始化：数字格为白，其他未确定
    const board = Array(puzzle.rows).fill(null).map((_, r) =>
      Array(puzzle.cols).fill(null).map((_, c) =>
        puzzle.numbers[r][c] > 0 ? CELL_WHITE : CELL_WHITE
      )
    );

    this.setData({
      rows: puzzle.rows,
      cols: puzzle.cols,
      numbers: puzzle.numbers,
      board,
      difficulty,
      puzzleId,
      time: 0,
      isPlaying: true,
      isComplete: false
    });

    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.setData({ time: this.data.time + 1 });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // 点击格子切换状态
  onCellTap(e) {
    if (this.data.isComplete) return;

    const { row, col } = e.currentTarget.dataset;
    const { numbers, board } = this.data;

    // 数字格不能涂黑
    if (numbers[row][col] > 0) return;

    // 切换：白 → 黑 → 白
    board[row][col] = board[row][col] === CELL_WHITE ? CELL_BLACK : CELL_WHITE;
    this.setData({ board });
    this.playSoundIfEnabled('click');

    this.checkCompletion();
  },

  // 检查完成
  checkCompletion() {
    const { rows, cols, numbers, board } = this.data;

    // 1. 检查没有 2×2 全黑区域
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        if (board[r][c] === CELL_BLACK &&
            board[r][c + 1] === CELL_BLACK &&
            board[r + 1][c] === CELL_BLACK &&
            board[r + 1][c + 1] === CELL_BLACK) {
          return false;
        }
      }
    }

    // 2. 检查每个数字格的白色区域大小
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (numbers[r][c] > 0) {
          const size = this.countWhiteRegion(r, c, visited);
          if (size !== numbers[r][c]) return false;
        }
      }
    }

    // 3. 检查所有黑格连通
    if (!this.areBlackCellsConnected()) return false;

    // 4. 检查白色区域之间被黑格分隔
    if (!this.areWhiteRegionsSeparated()) return false;

    // 完成！
    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');
    wx.removeStorageSync('nurikabe_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '再来一局'
    }).then(() => {
      this.nextPuzzle();
    });

    return true;
  },

  // BFS 计算白色区域大小
  countWhiteRegion(startR, startC, visited) {
    const { rows, cols, board } = this.data;
    const queue = [[startR, startC]];
    let count = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (visited[r][c]) continue;
      if (board[r][c] === CELL_BLACK) continue;

      visited[r][c] = true;
      count++;

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    return count;
  },

  // 检查所有黑格是否连通
  areBlackCellsConnected() {
    const { rows, cols, board } = this.data;

    // 找第一个黑格
    let startR = -1, startC = -1;
    for (let r = 0; r < rows && startR === -1; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === CELL_BLACK) {
          startR = r;
          startC = c;
          break;
        }
      }
    }

    if (startR === -1) return false; // 没有黑格

    // BFS 统计连通的黑格数
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const queue = [[startR, startC]];
    let connectedCount = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (visited[r][c]) continue;
      if (board[r][c] !== CELL_BLACK) continue;

      visited[r][c] = true;
      connectedCount++;

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    // 统计总黑格数
    let totalBlack = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === CELL_BLACK) totalBlack++;
      }
    }

    return connectedCount === totalBlack;
  },

  // 检查白色区域是否被黑格分隔
  areWhiteRegionsSeparated() {
    const { rows, cols, numbers, board } = this.data;
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    let regionCount = 0;

    // 统计白色区域数量
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited[r][c] && board[r][c] === CELL_WHITE) {
          this.countWhiteRegion(r, c, visited);
          regionCount++;
        }
      }
    }

    // 统计数字数量
    let numberCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (numbers[r][c] > 0) numberCount++;
      }
    }

    return regionCount === numberCount;
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== this.data.difficulty) {
      this.loadPuzzle(difficulty, 0);
    }
  },

  nextPuzzle() {
    const puzzles = PUZZLES[this.data.difficulty] || PUZZLES.easy;
    const nextId = (this.data.puzzleId + 1) % puzzles.length;
    this.loadPuzzle(this.data.difficulty, nextId);
  },

  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
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
