/**
 * 灯塔 (Akari / Light Up) 游戏
 * 规则：
 * 1. 在白格放置灯塔，照亮所有白格
 * 2. 灯塔之间不能互相照亮
 * 3. 黑格数字表示四周灯塔数
 */

const { playSound, preloadSounds, isPageSoundEnabled } = require('../../../utils/index');

// 格子类型
const CELL_WHITE = 0;    // 白格
const CELL_BLACK = 1;    // 黑格（无数字）
const CELL_BLACK_0 = 2;  // 黑格数字0
const CELL_BLACK_1 = 3;  // 黑格数字1
const CELL_BLACK_2 = 4;  // 黑格数字2
const CELL_BLACK_3 = 5;  // 黑格数字3
const CELL_BLACK_4 = 6;  // 黑格数字4

// 题库
const PUZZLES = {
  easy: [
    // 7x7 简单
    {
      rows: 7, cols: 7,
      grid: [
        [0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [3, 0, 0, 1, 0, 0, 2],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 0, 0, 3, 0, 0, 0]
      ]
    },
    {
      rows: 7, cols: 7,
      grid: [
        [0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0]
      ]
    }
  ],
  medium: [
    // 10x10 中等
    {
      rows: 10, cols: 10,
      grid: [
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
      ]
    }
  ],
  hard: [
    // 12x12 困难
    {
      rows: 12, cols: 12,
      grid: [
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0]
      ]
    }
  ]
};

Page({
  data: {
    rows: 7,
    cols: 7,
    grid: [],           // 格子类型
    lights: [],         // 灯塔位置 light[r][c] = true/false
    lit: [],            // 被照亮的位置 lit[r][c] = true/false
    difficulty: 'easy',
    puzzleId: 0,
    time: 0,
    isPlaying: false,
    isComplete: false,
    cellSize: 40
  },

  timer: null,
  pageId: 'akari',

  onLoad(options) {
    // 恢复进度
    const saved = wx.getStorageSync('akari_saved');
    if (saved && saved.lights) {
      this.setData({
        ...saved,
        isPlaying: true
      });
      this.updateLit();
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
      wx.setStorageSync('akari_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        grid: this.data.grid,
        lights: this.data.lights,
        difficulty: this.data.difficulty,
        puzzleId: this.data.puzzleId,
        time: this.data.time
      });
    }
  },

  // 加载题目
  loadPuzzle(difficulty, puzzleId) {
    const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
    const puzzle = puzzles[puzzleId % puzzles.length];

    const lights = Array(puzzle.rows).fill(null).map(() => Array(puzzle.cols).fill(false));

    this.setData({
      rows: puzzle.rows,
      cols: puzzle.cols,
      grid: puzzle.grid,
      lights,
      lit: [],
      difficulty,
      puzzleId,
      time: 0,
      isPlaying: true,
      isComplete: false
    });

    this.updateLit();
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

  // 点击格子
  onCellTap(e) {
    if (this.data.isComplete) return;

    const { row, col } = e.currentTarget.dataset;
    const { grid, lights } = this.data;

    // 黑格不能放灯塔
    if (grid[row][col] >= CELL_BLACK) return;

    // 切换灯塔
    lights[row][col] = !lights[row][col];
    this.setData({ lights });

    // 更新照亮状态
    this.updateLit();
    this.playSoundIfEnabled('click');

    // 检查完成
    this.checkCompletion();
  },

  // 更新照亮状态
  updateLit() {
    const { rows, cols, grid, lights } = this.data;
    const lit = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // 标记所有灯塔照亮的位置
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lights[r][c]) {
          // 灯塔本身被照亮
          lit[r][c] = true;

          // 向四个方向照亮
          const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              // 遇到黑格停止
              if (grid[nr][nc] >= CELL_BLACK) break;
              lit[nr][nc] = true;
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }

    this.setData({ lit });
  },

  // 检查是否完成
  checkCompletion() {
    const { rows, cols, grid, lights, lit } = this.data;

    // 1. 检查灯塔是否互相照亮
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lights[r][c]) {
          // 检查四个方向是否有其他灯塔
          const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (grid[nr][nc] >= CELL_BLACK) break;
              if (lights[nr][nc]) return false; // 灯塔互相照亮
              nr += dr;
              nc += dc;
            }
          }
        }
      }
    }

    // 2. 检查黑格数字约束
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell >= CELL_BLACK_0) {
          const required = cell - CELL_BLACK_0; // 0-4
          // 计算四周灯塔数
          let count = 0;
          if (r > 0 && lights[r - 1][c]) count++;
          if (r < rows - 1 && lights[r + 1][c]) count++;
          if (c > 0 && lights[r][c - 1]) count++;
          if (c < cols - 1 && lights[r][c + 1]) count++;
          if (count !== required) return false;
        }
      }
    }

    // 3. 检查所有白格都被照亮
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] < CELL_BLACK && !lit[r][c]) {
          return false;
        }
      }
    }

    // 完成！
    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');
    wx.removeStorageSync('akari_saved');

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

  // 切换难度
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
  },

  // 获取黑格数字显示
  getBlackNumber(cell) {
    if (cell >= CELL_BLACK_0) {
      return cell - CELL_BLACK_0;
    }
    return null;
  }
});
