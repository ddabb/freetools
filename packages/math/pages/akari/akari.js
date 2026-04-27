/**
 * 灯塔 (Akari / Light Up) 游戏 - CDN版
 * 规则：
 * 1. 在白格放置灯塔，照亮所有白格
 * 2. 灯塔之间不能互相照亮
 * 3. 黑格数字表示四周灯塔数
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/akari';
const _totalPuzzles = { easy: 1000, medium: 1000, hard: 1000 };

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 格子类型
const CELL_WHITE = 0;    // 白格
const CELL_BLACK = 1;    // 黑格（无数字）
const CELL_BLACK_0 = 2;  // 黑格数字0
const CELL_BLACK_1 = 3;  // 黑格数字1
const CELL_BLACK_2 = 4;  // 黑格数字2
const CELL_BLACK_3 = 5;  // 黑格数字3
const CELL_BLACK_4 = 6;  // 黑格数字4

// CDN数据格式映射：将CDN数据格式转换为内部常量
// CDN格式：" "=白格, 0-4=黑格数字0-4
function mapCell(cell) {
  if (cell === " ") return CELL_WHITE;      // 白格
  // cell是0-4，表示黑格数字0-4
  return CELL_BLACK_0 + cell;  // 0→2, 1→3, 2→4, 3→5, 4→6
}

const DIFFICULTY_CONFIG = {
  easy: { text: '7×7 简单', size: 7 },
  medium: { text: '10×10 中等', size: 10 },
  hard: { text: '12×12 困难', size: 12 }
};

// TOTAL_PUZZLES 已废弃，使用 _totalPuzzles

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
    timeStr: '0:00',   // 格式化的时间字符串
    isPlaying: false,
    isComplete: false,
    cellSize: 40,
    showAnswer: false   // 显示答案
  },

  timer: null,
  pageId: 'akari',
  _currentPuzzle: null,
  _loadId: 0,

  onLoad(options) {
    // 恢复进度
    const saved = wx.getStorageSync('akari_saved');
    if (saved && saved.grid) {
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false
      });
      this._currentPuzzle = { grid: saved.grid };
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

  /**
   * 从CDN加载题目
   */
  loadPuzzle(difficulty, puzzleId) {
    const self = this;
    const filename = difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_akari_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    // 尝试缓存
    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      cached._loadId = self._loadId;
      self._applyPuzzle(cached, difficulty, puzzleId);
      return;
    }

    // 递增请求ID，用于防止竞态条件
    const loadId = ++this._loadId;

    self.setData({ isPlaying: false });

    wx.request({
      url: CDN_BASE + '/' + filename + '?t=' + Date.now(),
      method: 'GET',
      timeout: 10000,
      success(res) {
        // 检查是否是最新请求
        if (loadId !== self._loadId) return;
        
        if (res.statusCode === 200 && res.data && res.data.grid) {
          wx.setStorageSync(cacheKey, res.data);
          res.data._loadId = loadId;
          self._applyPuzzle(res.data, difficulty, puzzleId);
        } else {
          console.warn('[akari] CDN数据格式错误', res.statusCode, res.data);
          self._loadFallback(difficulty, puzzleId);
        }
      },
      fail(err) {
        // 检查是否是最新请求
        if (loadId !== self._loadId) return;
        
        console.warn('[akari] CDN请求失败', err);
        self._loadFallback(difficulty, puzzleId);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId) {
    // 检查是否是最新请求（防止竞态条件）
    if (this._loadId && puzzleData._loadId !== this._loadId) return;

    const size = puzzleData.size || 7;
    const rows = size, cols = size;

    // 映射CDN数据格式到内部常量
    const grid = puzzleData.grid.map(row => row.map(cell => mapCell(cell)));

    const lights = Array(rows).fill(null).map(() => Array(cols).fill(false));

    this._currentPuzzle = { grid };

    this.setData({
      rows,
      cols,
      grid,
      lights,
      lit: [],
      difficulty,
      puzzleId,
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      verifyMsg: ''
    });

    this.updateLit();
    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  _loadFallback(difficulty, puzzleId) {
    // 生成一个简单的备用题目
    const size = DIFFICULTY_CONFIG[difficulty].size;
    const rows = size, cols = size;

    // 创建简单的棋盘：四周是黑格数字0，中间是白格
    const gridData = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          row.push(0); // 黑格数字0
        } else {
          row.push(" "); // 白格
        }
      }
      gridData.push(row);
    }

    this._applyPuzzle({ size, grid: gridData }, difficulty, puzzleId);
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
      confirmText: '再来一局',
      success: () => {
        this.nextPuzzle();
      }
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
    const total = _totalPuzzles[this.data.difficulty] || 1000;
    const nextId = (this.data.puzzleId + 1) % total;
    this.setData({ isComplete: false });
    this.loadPuzzle(this.data.difficulty, nextId);
  },

  onReset() {
    this.setData({ verifyMsg: '' });
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  // 验证答案
  onVerify() {
    const { rows, cols, grid, lights, lit } = this.data;
    const errors = [];

    // 1. 检查灯塔互相照亮
    let lightConflict = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (lights[r][c]) {
          const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (grid[nr][nc] >= CELL_BLACK) break;
              if (lights[nr][nc]) { lightConflict++; break; }
              nr += dr; nc += dc;
            }
          }
        }
      }
    }
    if (lightConflict > 0) errors.push(`${lightConflict} 对灯塔互相照亮`);

    // 2. 检查黑格数字约束
    let numErrors = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell >= CELL_BLACK_0) {
          const required = cell - CELL_BLACK_0;
          let count = 0;
          if (r > 0 && lights[r - 1][c]) count++;
          if (r < rows - 1 && lights[r + 1][c]) count++;
          if (c > 0 && lights[r][c - 1]) count++;
          if (c < cols - 1 && lights[r][c + 1]) count++;
          if (count !== required) numErrors++;
        }
      }
    }
    if (numErrors > 0) errors.push(`${numErrors} 个数字黑格不满足`);

    // 3. 检查未照亮的白格
    let unlitCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] < CELL_BLACK && !lit[r][c]) unlitCount++;
      }
    }
    if (unlitCount > 0) errors.push(`${unlitCount} 个白格未被照亮`);

    if (errors.length === 0) {
      wx.showModal({ title: '✅ 验证通过', content: '当前答案正确！', showCancel: false });
    } else {
      wx.showModal({ title: '❌ 还有问题', content: errors.join('\n'), showCancel: false });
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
  },

  // 获取黑格数字显示
  getBlackNumber(cell) {
    if (cell >= CELL_BLACK_0) {
      return cell - CELL_BLACK_0;
    }
    return null;
  }
});
