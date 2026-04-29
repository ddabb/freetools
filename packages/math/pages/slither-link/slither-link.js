/**
 * 数回 (Slither Link) 游戏 - CDN版
 * 
 * 规则：
 * 1. 在格点之间画线，形成一条闭合回路（不能分叉、不能断开、不能交叉）
 * 2. 格子中的数字表示该格子四周有多少条线段
 * 3. 没有数字的格子，四周线段数不限
 * 4. 只能有一个回路
 */

let _touchActive = false;
let _tapHandled = false;
let _lastEdgeType = null;
let _lastEdgeRow = null;
let _lastEdgeCol = null;
let _containerRect = null;

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/slither-link';

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 边的状态：只有空和线两种
const EDGE_EMPTY = 0;
const EDGE_LINE = 1;

const DIFFICULTY_CONFIG = {
  easy: { text: '5×5 简单', size: 5 },
  medium: { text: '7×7 中等', size: 7 },
  hard: { text: '10×10 困难', size: 10 }
};

const TOTAL_PUZZLES = { easy: 200, medium: 100, hard: 50 };

// 动态计算格子大小 - 优先填充屏幕宽度
function computeCellSize(rows, cols) {
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const screenHeight = wx.getSystemInfoSync().windowHeight;
    
    // 预估各部分高度（单位px）
    const headerHeight = 120;      // 顶部栏
    const footerHeight = 140;       // 底部按钮
    const paddingMargin = 60;      // 各种边距和间隙
    
    // 预留高度 = header + footer + padding
    const reservedHeight = headerHeight + footerHeight + paddingMargin;
    const availableHeight = screenHeight - reservedHeight;
    
    // 宽度方向：留20px边距
    const availableWidth = screenWidth - 40;
    
    // 网格实际需要的宽度（包含30px偏移）
    const gridWidth = cols + 2; // cols格 + 2个格点单位
    const gridHeight = rows + 2; // rows格 + 2个格点单位
    
    // 根据宽度优先计算（优先填满宽度）
    let cellSize = Math.floor(availableWidth / gridWidth);
    
    // 如果按宽度计算太高了，再限制高度
    const maxByHeight = Math.floor(availableHeight / gridHeight);
    cellSize = Math.min(cellSize, maxByHeight);
    
    // 限制范围：最小32px，最大50px
    return Math.max(32, Math.min(50, cellSize));
}

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
    containerWidth: 300,
    containerHeight: 300,
    showAnswer: false,
    showRules: false,
    loading: true
  },

  timer: null,
  pageId: 'slither-link',
  _currentPuzzle: null,
  _loadId: 0,

  onLoad(options) {
    // 优先恢复之前的进度
    const saved = wx.getStorageSync('slither_link_saved');
    if (saved && saved.edges && saved.edges.h && saved.edges.h.length > 0) {
      this.setData({ ...saved, isPlaying: true, showAnswer: false, loading: false });
      this._currentPuzzle = { answer: saved._answer };
      this.startTimer();
    } else {
      // 加载简单模式第一题
      this.loadPuzzle('easy', 0);
    }
    preloadSounds(['click', 'win'], this.pageId);

    // 获取游戏容器位置，用于计算触摸坐标对应的边
    const query = wx.createSelectorQuery();
    query.select('#game-container').boundingClientRect((rect) => {
      if (rect) {
        _containerRect = rect;
      }
    }).exec();
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
    const cacheKey = 'cdn_slitherlink_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0') + '_v2';
    
    // 递增请求ID，用于防止竞态条件
    const loadId = ++this._loadId;
    
    // 尝试缓存
    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      cached._loadId = loadId;
      self._applyPuzzle(cached, difficulty, puzzleId);
      return;
    }
    
    self.setData({ loading: true });
    
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
          console.warn('[slither-link] CDN数据格式错误', res.statusCode, res.data);
          self._loadFallback(difficulty, puzzleId);
        }
      },
      fail(err) {
        // 检查是否是最新请求
        if (loadId !== self._loadId) return;
        
        console.warn('[slither-link] CDN请求失败', err);
        self._loadFallback(difficulty, puzzleId);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId) {
    // 检查是否是最新请求（防止竞态条件）
    if (this._loadId && puzzleData._loadId !== this._loadId) return;
    
    const rows = puzzleData.size || puzzleData.grid.length;
    const cols = puzzleData.grid[0].length;
    const hints = puzzleData.grid;
    const answer = puzzleData.answer || null;
    
    // 动态计算格子大小
    const cellSize = computeCellSize(rows, cols);
    
    // 容器需要包含格点偏移量（每边15px）
    const containerWidth = cols * cellSize + 30;
    const containerHeight = rows * cellSize + 30;
    
    const edges = {
      h: Array(rows + 1).fill(null).map(() => Array(cols).fill(EDGE_EMPTY)),
      v: Array(rows).fill(null).map(() => Array(cols + 1).fill(EDGE_EMPTY))
    };

    this._currentPuzzle = { answer };

    this.setData({
      rows,
      cols,
      hints,
      cellSize,
      containerWidth,
      containerHeight,
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
    // 触摸开始时跳过 tap，避免重复触发
    if (_tapHandled) {
      _tapHandled = false;
      return;
    }

    const { type, row, col } = e.currentTarget.dataset;
    const edges = JSON.parse(JSON.stringify(this.data.edges));

    // 循环切换：空 → 线 → 空
    const current = edges[type][row][col];
    edges[type][row][col] = (current + 1) % 2;

    this.setData({ edges });
    this.playSoundIfEnabled('click');
  },

  /**
   * 触摸开始：记录起始边，设置标志阻止 tap
   */
  onTouchStart(e) {
    if (this.data.isComplete) return;
    _touchActive = true;
    _tapHandled = true;

    const touch = e.touches[0];
    const edge = this._getEdgeFromTouch(touch);
    if (!edge) return;

    const { type, row, col } = edge;
    this._toggleEdge(type, row, col);
    _lastEdgeType = type;
    _lastEdgeRow = row;
    _lastEdgeCol = col;
  },

  /**
   * 触摸移动：滑动到新边时自动切换状态
   */
  onTouchMove(e) {
    if (!_touchActive) return;
    const touch = e.touches[0];
    const edge = this._getEdgeFromTouch(touch);
    if (!edge) return;

    const { type, row, col } = edge;
    // 同一格点不重复处理
    if (type === _lastEdgeType && row === _lastEdgeRow && col === _lastEdgeCol) return;

    this._toggleEdge(type, row, col);
    _lastEdgeType = type;
    _lastEdgeRow = row;
    _lastEdgeCol = col;
  },

  /**
   * 触摸结束：重置状态
   */
  onTouchEnd() {
    _touchActive = false;
    // 延迟重置 tap 标志，让下一轮点击正常生效
    setTimeout(() => {
      _tapHandled = false;
    }, 0);
  },

  /**
   * 阻止触摸冒泡，避免页面滚动
   */
  catchtouchmove() {},

  /**
   * 根据触摸坐标计算对应的边
   */
  _getEdgeFromTouch(touch) {
    if (!_containerRect) return null;
    const containerLeft = _containerRect.left;
    const containerTop = _containerRect.top;
    const x = touch.clientX - containerLeft;
    const y = touch.clientY - containerTop;
    const cellSize = this.data.cellSize;
    const edgeThickness = 8;

    // 检查横向边(h)：行r(0~rows)，列c(0~cols-1)
    for (let r = 0; r <= this.data.rows; r++) {
      for (let c = 0; c < this.data.cols; c++) {
        const top = r * cellSize + 15;
        const left = c * cellSize + 15;
        const edgeTop = top - edgeThickness / 2;
        const edgeBottom = top + edgeThickness / 2;
        const edgeLeft = left;
        const edgeRight = left + cellSize;
        if (x >= edgeLeft && x <= edgeRight && y >= edgeTop && y <= edgeBottom) {
          return { type: 'h', row: r, col: c };
        }
      }
    }

    // 检查纵向边(v)：行r(0~rows-1)，列c(0~cols)
    for (let r = 0; r < this.data.rows; r++) {
      for (let c = 0; c <= this.data.cols; c++) {
        const top = r * cellSize + 15;
        const left = c * cellSize + 15;
        const edgeTop = top;
        const edgeBottom = top + cellSize;
        const edgeLeft = left - edgeThickness / 2;
        const edgeRight = left + edgeThickness / 2;
        if (x >= edgeLeft && x <= edgeRight && y >= edgeTop && y <= edgeBottom) {
          return { type: 'v', row: r, col: c };
        }
      }
    }

    return null;
  },

  /**
   * 切换边的状态（空↔线）
   */
  _toggleEdge(type, row, col) {
    const edges = JSON.parse(JSON.stringify(this.data.edges));
    const current = edges[type][row][col];
    edges[type][row][col] = (current + 1) % 2;
    this.setData({ edges });
    this.playSoundIfEnabled('click');
  },

  /**
   * 验证答案（用户手动触发）
   */
  onVerify() {
    if (this.data.isComplete) return;
    const result = this.checkCompletion();
    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none', duration: 2000 });
    }
  },

  /**
   * 检查完成状态，返回详细结果
   */
  checkCompletion() {
    const { rows, cols, hints, edges } = this.data;

    // 1. 检查数字约束
    let wrongHints = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hint = hints[r][c];
        if (hint !== null && hint !== undefined && hint >= 0) {
          const count = (edges.h[r][c] === EDGE_LINE ? 1 : 0) +
                        (edges.h[r + 1][c] === EDGE_LINE ? 1 : 0) +
                        (edges.v[r][c] === EDGE_LINE ? 1 : 0) +
                        (edges.v[r][c + 1] === EDGE_LINE ? 1 : 0);
          if (count !== hint) wrongHints++;
        }
      }
    }

    if (wrongHints > 0) {
      return { success: false, message: `还有 ${wrongHints} 个格子不满足条件` };
    }

    // 2. 统计线段数
    let lineCount = 0;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r][c] === EDGE_LINE) lineCount++;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (edges.v[r][c] === EDGE_LINE) lineCount++;
      }
    }

    if (lineCount === 0) {
      return { success: false, message: '请先画出线段' };
    }

    // 3. 检查是否形成单一闭合环路
    const loopResult = this.isSingleLoop();
    if (!loopResult.valid) {
      return { success: false, message: loopResult.reason };
    }

    // 完成！
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

    return { success: true, message: '完成' };
  },

  /**
   * 检查线段是否形成单一闭合环路
   * 返回 { valid, reason }
   */
  isSingleLoop() {
    const { rows, cols, edges } = this.data;

    // 统计每个格点的连接数
    const dotDegree = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(0));

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r] && edges.h[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r][c + 1]++;
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (edges.v[r] && edges.v[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r + 1][c]++;
        }
      }
    }

    // 检查所有有连接的点是否度数恰好为2
    let startR = -1, startC = -1;
    let totalDotsWithDegree = 0;
    let degreeNot2 = 0;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (dotDegree[r][c] > 0) {
          if (dotDegree[r][c] !== 2) degreeNot2++;
          if (startR === -1) { startR = r; startC = c; }
          totalDotsWithDegree++;
        }
      }
    }

    if (degreeNot2 > 0) {
      return { valid: false, reason: `有 ${degreeNot2} 个交叉点连接数不为2` };
    }

    if (startR === -1) {
      return { valid: false, reason: '没有画出任何线段' };
    }

    // 沿连线追踪，使用 BFS/DFS 检查连通性
    const visited = new Set();
    const queue = [[startR, startC]];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      // 检查4个方向的邻居
      const neighbors = [];
      // 右：h[cr][cc] 连接 (cr,cc) 和 (cr,cc+1)
      if (cc + 1 <= cols && edges.h[cr] && edges.h[cr][cc] === EDGE_LINE) {
        neighbors.push([cr, cc + 1]);
      }
      // 左：h[cr][cc-1] 连接 (cr,cc-1) 和 (cr,cc)
      if (cc - 1 >= 0 && edges.h[cr] && edges.h[cr][cc - 1] === EDGE_LINE) {
        neighbors.push([cr, cc - 1]);
      }
      // 下：v[cr][cc] 连接 (cr,cc) 和 (cr+1,cc)
      if (cr + 1 <= rows && edges.v[cr] && edges.v[cr][cc] === EDGE_LINE) {
        neighbors.push([cr + 1, cc]);
      }
      // 上：v[cr-1][cc] 连接 (cr-1,cc) 和 (cr,cc)
      if (cr - 1 >= 0 && edges.v[cr - 1] && edges.v[cr - 1][cc] === EDGE_LINE) {
        neighbors.push([cr - 1, cc]);
      }

      for (const [nr, nc] of neighbors) {
        const key = `${nr},${nc}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }

    if (visited.size !== totalDotsWithDegree) {
      return { valid: false, reason: '线段未形成单一环路（可能有多条独立线路）' };
    }

    return { valid: true, reason: '' };
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== this.data.difficulty) {
      this.loadPuzzle(difficulty, 0);
    }
  },

  nextPuzzle() {
    const total = TOTAL_PUZZLES[this.data.difficulty] || 100;
    const nextId = (this.data.puzzleId + 1) % total;
    this.setData({ isComplete: false });
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
