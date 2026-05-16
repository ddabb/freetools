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
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/nurikabe/';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

// 格子状态
const CELL_WHITE = 0;
const CELL_BLACK = 1;

// 题库缓存
let puzzleCache = { easy: 0, hard: 0 };

Page({
  behaviors: [adBehavior],
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
    screenWidth: 375,
    maxPuzzles: 1000,
    jumpInputValue: '',
    showRules: false
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
    const sw = this.data.screenWidth || 375;
    const maxGridPx = sw * 0.85; // 稍微缩小一点，确保不超出屏幕
    const rawSize = Math.floor(maxGridPx / Math.max(rows, cols));
    return Math.max(20, Math.min(rawSize, 45)); // 稍微调整最大最小值
  },

  loadPuzzle(difficulty, puzzleId) {
    wx.showLoading({ title: '加载中…' });

    const fileId = String(puzzleId + 1).padStart(4, '0');
    const url = `${CDN_BASE}${difficulty}-${fileId}.json?t=${Date.now()}`;
    console.log('加载题目:', url);

    wx.request({
      url,
      success: (res) => {
        wx.hideLoading();
        console.log('题目数据:', res.data);
        if (res.statusCode !== 200 || !res.data || !res.data.grid) {
          wx.showToast({ title: '加载失败', icon: 'none' });
          return;
        }

        const puzzle = res.data;
        const rows = puzzle.size;
        const cols = puzzle.size;
        const numbers = puzzle.grid;
        const solution = puzzle.solution;
        console.log('solution:', solution);
        const cellSize = this.calcCellSize(rows, cols);

        // 初始化：数字格为白，其他未确定
        const board = Array(rows).fill(null).map((_, r) =>
          Array(cols).fill(null).map((_, c) => CELL_WHITE)
        );

        this.setData({
          rows, cols, numbers, solution, board,
          difficulty,
          puzzleId,
          time: 0,
          timeStr: '0:00',
          cellSize,
          isPlaying: true,
          isComplete: false,
          showAnswer: false,
          maxPuzzles: TOTAL_PUZZLES[difficulty] || 1000
        });

        this.startTimer();
        this.playSoundIfEnabled('click');
      },
      fail: (err) => {
        wx.hideLoading();
        console.log('加载失败:', err);
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
    
    console.log('=== 点击后棋盘状态 ===');
    this.printBoard();
    
    this.checkCompletion();
  },

  printBoard() {
    const { rows, cols, numbers, board } = this.data;
    console.log('Numbers:');
    for (let r = 0; r < rows; r++) {
      let row = '';
      for (let c = 0; c < cols; c++) {
        row += numbers[r][c] ? ` ${numbers[r][c]} ` : ' . ';
      }
      console.log(row);
    }
    console.log('Board:');
    for (let r = 0; r < rows; r++) {
      let row = '';
      for (let c = 0; c < cols; c++) {
        row += board[r][c] === CELL_BLACK ? ' X ' : ' O ';
      }
      console.log(row);
    }
  },

  checkCompletion() {
    const { rows, cols, numbers, board } = this.data;
    console.log('=== 开始检查完成 ===');

    // 检查 2x2 全黑
    console.log('检查 2x2 全黑...');
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        if (board[r][c] === CELL_BLACK &&
            board[r][c + 1] === CELL_BLACK &&
            board[r + 1][c] === CELL_BLACK &&
            board[r + 1][c + 1] === CELL_BLACK) {
          console.log(`❌ 发现 2x2 全黑在 (${r},${c})`);
          return;
        }
      }
    }
    console.log('✅ 2x2 检查通过');

    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const regionOfNumber = Array(rows).fill(null).map(() => Array(cols).fill(-1));

    let regionId = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited[r][c] && board[r][c] === CELL_WHITE) {
          const regionCells = [];
          const queue = [[r, c]];
          visited[r][c] = true;
          while (queue.length > 0) {
            const [cr, cc] = queue.shift();
            regionCells.push([cr, cc]);
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
              const nr = cr + dr, nc = cc + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                  !visited[nr][nc] && board[nr][nc] === CELL_WHITE) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }
          for (const [cr, cc] of regionCells) {
            regionOfNumber[cr][cc] = regionId;
          }
          console.log(`白色区域 ${regionId}: ${regionCells.length} 格`);
          regionId++;
        }
      }
    }

    const numberInRegion = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (numbers[r][c] > 0) {
          const rid = regionOfNumber[r][c];
          console.log(`数字 ${numbers[r][c]} 在 (${r},${c}), 所属区域: ${rid}`);
          if (rid === -1) {
            console.log('❌ 数字格在黑格里');
            return;
          }
          if (numberInRegion[rid] !== undefined) {
            console.log(`❌ 区域 ${rid} 里有多个数字`);
            return;
          }
          numberInRegion[rid] = numbers[r][c];
        }
      }
    }

    let numberCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (numbers[r][c] > 0) numberCount++;
      }
    }

    console.log(`数字总数: ${numberCount}, 白色区域数: ${regionId}`);
    if (Object.keys(numberInRegion).length !== numberCount) {
      console.log('❌ 有数字没在白色区域里');
      return;
    }
    if (regionId !== numberCount) {
      console.log('❌ 区域数与数字数不一致');
      return;
    }

    const regionSizeMap = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (regionOfNumber[r][c] !== -1) {
          const rid = regionOfNumber[r][c];
          regionSizeMap[rid] = (regionSizeMap[rid] || 0) + 1;
        }
      }
    }

    for (const rid in numberInRegion) {
      console.log(`区域 ${rid}: 大小 ${regionSizeMap[rid]}, 数字 ${numberInRegion[rid]}`);
      if (regionSizeMap[rid] !== numberInRegion[rid]) {
        console.log('❌ 区域大小与数字不一致');
        return;
      }
    }

    if (!this.areBlackCellsConnected()) {
      console.log('❌ 黑格不连通');
      return;
    }

    console.log('✅ 所有检查通过！');
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
    this.preloadNext(difficulty, nextId);
    this.setData({ jumpInputValue: '' });
    this.loadPuzzle(difficulty, nextId);
  },

  onJumpInput(e) {
    const value = e.detail.value;
    const max = this.data.maxPuzzles;
    let jumpInputValue = value;
    
    if (value && parseInt(value) > max) {
      jumpInputValue = String(max);
    }
    
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
    this.setData({ jumpInputValue: '' });
    this.loadPuzzle(this.data.difficulty, targetId);
  },

  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    console.log('点击了显示答案');
    console.log('this.data.solution:', this.data.solution);
    
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      const { rows, cols, solution } = this.data;
      if (!solution) {
        wx.showToast({ title: '暂无答案', icon: 'none' });
        return;
      }
      console.log('显示答案:', solution);
      this.setData({ showAnswer, board: solution });
    } else {
      const { rows, cols, numbers } = this.data;
      const board = Array(rows).fill(null).map((_, r) =>
        Array(cols).fill(null).map((_, c) => numbers[r][c] > 0 ? CELL_WHITE : CELL_WHITE)
      );
      console.log('隐藏答案，恢复棋盘:', board);
      this.setData({ showAnswer, board });
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

  onShowRules() {
    this.setData({ showRules: true });
  },

  onHideRules() {
    this.setData({ showRules: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  }
});
const adBehavior = require('../../../../utils/ad-behavior');
