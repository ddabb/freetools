/**
 * 数回 (Slither Link) 游戏 - CDN版
 * 
 * 规则：
 * 1. 在格点之间画线，形成一条闭合回路（不能分叉、不能断开、不能交叉）
 * 2. 格子中的数字表示该格子四周有多少条线段
 * 3. 没有数字的格子，四周线段数不限
 * 4. 只能有一个回路
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/slither-link';

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 边的状态
const EDGE_EMPTY = 0;
const EDGE_LINE = 1;
const EDGE_CROSS = 2;

const DIFFICULTY_CONFIG = {
  easy: { text: '5×5 简单', size: 5 },
  medium: { text: '7×7 中等', size: 7 },
  hard: { text: '10×10 困难', size: 10 }
};

Page({
  data: {
    rows: 5,
    cols: 5,
    hints: [],
    edges: { h: [], v: [] },
    difficulty: 'easy',
    difficultyText: '5×5 简单',
    puzzleId: 0,
    time: 0,
    timeStr: '0:00',
    isPlaying: false,
    isComplete: false,
    cellSize: 50,
    showAnswer: false,
    showRules: false,
    loading: false
  },

  timer: null,
  pageId: 'slither-link',
  _currentPuzzle: null,
  _totalPuzzles: { easy: 200, medium: 100, hard: 50 },

  onLoad(options) {
    const saved = wx.getStorageSync('slither_link_saved');
    if (saved && saved.edges && saved.edges.h && saved.edges.h.length > 0) {
      this.setData({ ...saved, isPlaying: true, showAnswer: false, loading: false });
      const difficulty = saved.difficulty || 'easy';
      const puzzleId = saved.puzzleId || 0;
      this._currentPuzzle = { answer: saved._answer };
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
      wx.setStorageSync('slither_link_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        hints: this.data.hints,
        edges: this.data.edges,
        difficulty: this.data.difficulty,
        puzzleId: this.data.puzzleId,
        time: this.data.time,
        _answer: this._currentPuzzle ? this._currentPuzzle.answer : null
      });
    }
  },

  /**
   * 从CDN加载题目
   */
  loadPuzzle(difficulty, puzzleId) {
    const self = this;
    const filename = difficulty + '/' + difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_slitherlink_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');
    
    // 尝试缓存
    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      self._applyPuzzle(cached, difficulty, puzzleId);
      return;
    }
    
    self.setData({ loading: true });
    
    wx.request({
      url: CDN_BASE + '/' + filename,
      method: 'GET',
      timeout: 8000,
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.grid) {
          wx.setStorageSync(cacheKey, res.data);
          self._applyPuzzle(res.data, difficulty, puzzleId);
        } else {
          console.warn('[slither-link] CDN数据格式错误');
          self._loadFallback(difficulty, puzzleId);
        }
      },
      fail(err) {
        console.warn('[slither-link] CDN请求失败', err);
        self._loadFallback(difficulty, puzzleId);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId) {
    const rows = puzzleData.size || puzzleData.grid.length;
    const cols = puzzleData.grid[0].length;
    const hints = puzzleData.grid;
    const answer = puzzleData.answer || null;
    
    const edges = {
      h: Array(rows + 1).fill(null).map(() => Array(cols).fill(EDGE_EMPTY)),
      v: Array(rows).fill(null).map(() => Array(cols + 1).fill(EDGE_EMPTY))
    };

    this._currentPuzzle = { answer };

    this.setData({
      rows,
      cols,
      hints,
      difficulty,
      difficultyText: DIFFICULTY_CONFIG[difficulty].text,
      puzzleId,
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      showRules: false,
      loading: false
    });
    this.setData({ edges });
    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  _loadFallback(difficulty, puzzleId) {
    // 生成一个简单的备用题目（矩形环路）
    const size = DIFFICULTY_CONFIG[difficulty].size;
    const rows = size, cols = size;
    
    // 矩形环 → hints
    const hints = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1) {
          row.push(c === 0 || c === cols - 1 ? 2 : 1);
        } else {
          row.push(c === 0 || c === cols - 1 ? 1 : 0);
        }
      }
      hints.push(row);
    }
    
    const answer = { h: [], v: [] };
    for (let r = 0; r <= rows; r++) {
      answer.h.push([]);
      for (let c = 0; c < cols; c++) {
        answer.h[r].push((r === 0 || r === rows) ? 1 : 0);
      }
    }
    for (let r = 0; r < rows; r++) {
      answer.v.push([]);
      for (let c = 0; c <= cols; c++) {
        answer.v[r].push((c === 0 || c === cols) ? 1 : 0);
      }
    }
    
    this._applyPuzzle({ size: rows, grid: hints, answer }, difficulty, puzzleId);
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

  onEdgeTap(e) {
    if (this.data.isComplete) return;

    const { type, row, col } = e.currentTarget.dataset;
    const edges = JSON.parse(JSON.stringify(this.data.edges));

    // 循环切换：空 → 线 → 叉 → 空
    const current = edges[type][row][col];
    edges[type][row][col] = (current + 1) % 3;

    this.setData({ edges });
    this.playSoundIfEnabled('click');

    this.checkCompletion();
  },

  checkCompletion() {
    const { rows, cols, hints, edges } = this.data;

    // 1. 检查数字约束
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hint = hints[r][c];
        if (hint !== null && hint !== undefined) {
          const count = (edges.h[r][c] === EDGE_LINE ? 1 : 0) +
                        (edges.h[r + 1][c] === EDGE_LINE ? 1 : 0) +
                        (edges.v[r][c] === EDGE_LINE ? 1 : 0) +
                        (edges.v[r][c + 1] === EDGE_LINE ? 1 : 0);
          if (count !== hint) return false;
        }
      }
    }

    // 2. 检查是否形成单一闭合环路
    if (!this.isSingleLoop()) return false;

    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');

    wx.removeStorageSync('slither_link_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.data.timeStr}`,
      showCancel: false,
      confirmText: '再来一局'
    }).then(() => {
      this.nextPuzzle();
    });

    return true;
  },

  /**
   * 检查线段是否形成单一闭合环路
   */
  isSingleLoop() {
    const { rows, cols, edges } = this.data;

    // 统计每个格点的连接数
    const dotDegree = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(0));

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r][c + 1]++;
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (edges.v[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r + 1][c]++;
        }
      }
    }

    // 找起点
    let startR = -1, startC = -1;
    let totalDotsWithDegree = 0;
    for (let r = 0; r <= rows && startR === -1; r++) {
      for (let c = 0; c <= cols; c++) {
        if (dotDegree[r][c] > 0) {
          if (dotDegree[r][c] !== 2) return false;
          if (startR === -1) { startR = r; startC = c; }
          totalDotsWithDegree++;
        }
      }
    }

    if (startR === -1) return false;

    // 沿连线追踪
    const visited = new Set();
    let r = startR, c = startC;
    let prevR = -1, prevC = -1;
    let steps = 0;

    while (true) {
      const key = `${r},${c}`;
      if (visited.has(key)) {
        return r === startR && c === startC && steps === totalDotsWithDegree;
      }
      visited.add(key);
      steps++;

      let nextR = -1, nextC = -1;

      if (c + 1 <= cols && edges.h[r] && edges.h[r][c] === EDGE_LINE && !(r === prevR && c + 1 === prevC)) {
        nextR = r; nextC = c + 1;
      }
      if (c - 1 >= 0 && edges.h[r] && edges.h[r][c - 1] === EDGE_LINE && !(r === prevR && c - 1 === prevC)) {
        nextR = r; nextC = c - 1;
      }
      if (r + 1 <= rows && edges.v[r] && edges.v[r][c] === EDGE_LINE && !(r + 1 === prevR && c === prevC)) {
        nextR = r + 1; nextC = c;
      }
      if (r - 1 >= 0 && edges.v[r - 1] && edges.v[r - 1][c] === EDGE_LINE && !(r - 1 === prevR && c === prevC)) {
        nextR = r - 1; nextC = c;
      }

      if (nextR === -1) return false;

      prevR = r; prevC = c;
      r = nextR; c = nextC;
    }
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== this.data.difficulty) {
      this.loadPuzzle(difficulty, 0);
    }
  },

  nextPuzzle() {
    const total = this._totalPuzzles[this.data.difficulty] || 100;
    const nextId = (this.data.puzzleId + 1) % total;
    this.loadPuzzle(this.data.difficulty, nextId);
  },

  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      const puzzle = this._currentPuzzle;
      if (puzzle && puzzle.answer) {
        const edges = {
          h: puzzle.answer.h.map(row => row.map(v => v ? EDGE_LINE : EDGE_EMPTY)),
          v: puzzle.answer.v.map(row => row.map(v => v ? EDGE_LINE : EDGE_EMPTY))
        };
        this.setData({ showAnswer, edges });
      } else {
        wx.showToast({ title: '答案数据未加载', icon: 'none' });
      }
    } else {
      this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
    }
  },

  toggleRules() {
    this.setData({ showRules: !this.data.showRules });
  },

  playSoundIfEnabled(name) {
    if (isPageSoundEnabled(this.pageId)) {
      playSound(name, { pageId: this.pageId });
    }
  }
});
