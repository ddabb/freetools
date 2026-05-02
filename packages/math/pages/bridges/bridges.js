/**
 * 桥 (Hashiwokakero / Bridges) 游戏 - CDN版
 * 规则：
 * 1. 连接岛屿，桥只能水平或垂直
 * 2. 两岛之间最多2座桥
 * 3. 桥不能交叉
 * 4. 岛上的数字表示需连接的桥数
 * 5. 所有岛必须连通
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/bridges';
const _totalPuzzles = { easy: 1000, medium: 1000, hard: 1000 };

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

const DIFFICULTY_CONFIG = {
  easy: { text: '7×7 简单', rows: 7, cols: 7, cellSize: 46 },
  medium: { text: '10×10 中等', rows: 10, cols: 10, cellSize: 33 },
  hard: { text: '13×13 困难', rows: 13, cols: 13, cellSize: 25 }
};

// 桥的方向
const DIR_RIGHT = 0;
const DIR_DOWN = 1;

Page({
  data: {
    rows: 7,
    cols: 7,
    cellSize: 46,
    // 岛屿列表 [{r, c, n, id}] — n=需要的桥数, id=索引
    islands: [],
    // 桥列表 [{r1, c1, r2, c2, count}] — count=1或2
    bridges: [],
    difficulty: 'easy',
    puzzleId: 0,
    jumpInputValue: 1,
    maxPuzzles: 1000,
    time: 0,
    timeStr: '0:00',
    isPlaying: false,
    isComplete: false,
    showAnswer: false,
    // 用于WXML渲染的预处理数据
    islandMap: [],     // [r][c] = island index or -1
    bridgeH: [],      // [r][c] = 水平桥数量 (0/1/2) 通过此格
    bridgeV: [],      // [r][c] = 垂直桥数量 (0/1/2) 通过此格
    selectedIsland: -1 // 当前选中的岛屿id
  },

  timer: null,
  pageId: 'bridges',
  _currentPuzzle: null,
  _loadId: 0,
  _dragStart: -1, // 拖拽起始岛id

  onLoad(options) {
    const saved = wx.getStorageSync('bridges_saved');
    if (saved && saved.islands && saved.islands.length > 0) {
      this.setData({ ...saved, isPlaying: true, showAnswer: false });
      this._currentPuzzle = { islands: saved.islands };
      this._rebuildRenderData();
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
      const { rows, cols, islands, bridges, difficulty, puzzleId, time } = this.data;
      wx.setStorageSync('bridges_saved', { rows, cols, islands, bridges, difficulty, puzzleId, time });
    }
  },

  /**
   * 从CDN加载题目
   */
  loadPuzzle(difficulty, puzzleId) {
    const self = this;
    const filename = difficulty + '/' + difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_bridges_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.islands) {
      self._applyPuzzle(cached, difficulty, puzzleId);
      return;
    }

    const loadId = ++this._loadId;
    self.setData({ isPlaying: false });

    wx.request({
      url: CDN_BASE + '/' + filename + '?t=' + Date.now(),
      method: 'GET',
      timeout: 10000,
      success(res) {
        if (loadId !== self._loadId) return;
        if (res.statusCode === 200 && res.data && res.data.islands) {
          wx.setStorageSync(cacheKey, res.data);
          self._applyPuzzle(res.data, difficulty, puzzleId);
        } else {
          console.warn('[bridges] CDN数据格式错误', res.statusCode);
          self._loadFallback(difficulty, puzzleId);
        }
      },
      fail(err) {
        if (loadId !== self._loadId) return;
        console.warn('[bridges] CDN请求失败', err);
        self._loadFallback(difficulty, puzzleId);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId) {
    const config = DIFFICULTY_CONFIG[difficulty];
    const rows = puzzleData.rows || config.rows;
    const cols = puzzleData.cols || config.cols;

    // 岛屿数据
    const islands = (puzzleData.islands || []).map((isl, idx) => ({
      r: isl.r,
      c: isl.c,
      n: isl.n,
      id: idx
    }));

    // 初始化桥
    const bridges = [];

    this._currentPuzzle = { islands, answer: puzzleData.answer || null };

    this.setData({
      rows,
      cols,
      cellSize: config.cellSize,
      islands,
      bridges,
      difficulty,
      puzzleId,
      jumpInputValue: puzzleId + 1,
      maxPuzzles: _totalPuzzles[difficulty] || 1000,
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      selectedIsland: -1
    });

    this._rebuildRenderData();
    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  _loadFallback(difficulty, puzzleId) {
    // 简单备用题目：7x7 棋盘，4个岛
    const islands = [
      { r: 0, c: 0, n: 2, id: 0 },
      { r: 0, c: 3, n: 2, id: 1 },
      { r: 3, c: 0, n: 2, id: 2 },
      { r: 3, c: 3, n: 2, id: 3 }
    ];
    this._applyPuzzle({ rows: 4, cols: 4, islands }, difficulty, puzzleId);
  },

  /**
   * 重建渲染数据（islandMap, bridgeH, bridgeV）
   */
  _rebuildRenderData() {
    const { rows, cols, islands, bridges, cellSize } = this.data;

    // 岛屿地图
    const islandMap = [];
    for (let r = 0; r < rows; r++) {
      islandMap[r] = [];
      for (let c = 0; c < cols; c++) {
        islandMap[r][c] = -1;
      }
    }
    for (const isl of islands) {
      if (isl.r >= 0 && isl.r < rows && isl.c >= 0 && isl.c < cols) {
        islandMap[isl.r][isl.c] = isl.id;
      }
    }

    // 桥渲染数据
    const bridgeH = []; // 水平方向经过 [r][c] 的桥数
    const bridgeV = []; // 垂直方向经过 [r][c] 的桥数
    for (let r = 0; r < rows; r++) {
      bridgeH[r] = [];
      bridgeV[r] = [];
      for (let c = 0; c < cols; c++) {
        bridgeH[r][c] = 0;
        bridgeV[r][c] = 0;
      }
    }

    for (const b of bridges) {
      if (b.r1 === b.r2) {
        // 水平桥
        const row = b.r1;
        const cMin = Math.min(b.c1, b.c2);
        const cMax = Math.max(b.c1, b.c2);
        for (let c = cMin; c <= cMax; c++) {
          bridgeH[row][c] = b.count;
        }
      } else {
        // 垂直桥
        const col = b.c1;
        const rMin = Math.min(b.r1, b.r2);
        const rMax = Math.max(b.r1, b.r2);
        for (let r = rMin; r <= rMax; r++) {
          bridgeV[r][col] = b.count;
        }
      }
    }

    // 更新每个岛的桥数
    for (const isl of islands) {
      isl.bridgeCount = this._getIslandBridgeCount(isl.id);
    }

    // 岛屿实际显示尺寸（cellSize的68%）
    const islandRealSize = Math.round(cellSize * 0.68);
    const islandOffset = Math.round(cellSize * 0.16); // 居中偏移
    const islandCenterOffset = islandOffset + islandRealSize / 2; // 岛屿中心相对于格子的偏移

    // 预生成桥渲染列表
    const bridgeList = [];
    for (const b of bridges) {
      if (b.r1 === b.r2) {
        // 水平桥 — 从左岛边缘到右岛边缘
        const cMin = Math.min(b.c1, b.c2);
        const cMax = Math.max(b.c1, b.c2);
        const gap = (cMax - cMin) * cellSize - islandRealSize;
        if (gap > 0) {
          bridgeList.push({
            type: 'h',
            count: b.count,
            r: b.r1,
            cMin, cMax,
            left: cMin * cellSize + islandCenterOffset,
            top: b.r1 * cellSize + islandCenterOffset - (b.count === 2 ? 7 : 4),
            width: gap
          });
        }
      } else {
        // 垂直桥 — 从上岛边缘到下岛边缘
        const rMin = Math.min(b.r1, b.r2);
        const rMax = Math.max(b.r1, b.r2);
        const gap = (rMax - rMin) * cellSize - islandRealSize;
        if (gap > 0) {
          bridgeList.push({
            type: 'v',
            count: b.count,
            c: b.c1,
            rMin, rMax,
            left: b.c1 * cellSize + islandCenterOffset - (b.count === 2 ? 7 : 4),
            top: rMin * cellSize + islandCenterOffset,
            height: gap
          });
        }
      }
    }

    // 为每个岛屿设置CSS变量（用于动态尺寸）
    for (const isl of islands) {
      isl.islandStyle = `--island-size: ${cellSize}px;`;
    }

    this.setData({ islandMap, bridgeH, bridgeV, islands, bridgeList });
  },

  /**
   * 获取岛屿当前已连接的桥数
   */
  _getIslandBridgeCount(islandId) {
    const { islands, bridges } = this.data;
    const isl = islands[islandId];
    if (!isl) return 0;
    let count = 0;
    for (const b of bridges) {
      if ((b.r1 === isl.r && b.c1 === isl.c) || (b.r2 === isl.r && b.c2 === isl.c)) {
        count += b.count;
      }
    }
    return count;
  },

  /**
   * 查找两个岛之间是否已有桥
   */
  _findBridge(r1, c1, r2, c2) {
    const { bridges } = this.data;
    for (let i = 0; i < bridges.length; i++) {
      const b = bridges[i];
      if ((b.r1 === r1 && b.c1 === c1 && b.r2 === r2 && b.c2 === c2) ||
          (b.r1 === r2 && b.c1 === c2 && b.r2 === r1 && b.c2 === c1)) {
        return i;
      }
    }
    return -1;
  },

  /**
   * 检查两个岛之间是否可以连桥（无交叉）
   */
  _canConnect(r1, c1, r2, c2) {
    const { bridges, rows, cols } = this.data;

    if (r1 === r2) {
      // 水平桥 — 检查与现有垂直桥的交叉
      const row = r1;
      const cMin = Math.min(c1, c2);
      const cMax = Math.max(c1, c2);
      for (const b of bridges) {
        if (b.count === 0) continue;
        if (b.r1 === b.r2) continue; // 水平桥不与水平桥交叉
        // 垂直桥 b: 列=b.c1, 从 b.r1 到 b.r2
        const vCol = b.c1;
        if (vCol > cMin && vCol < cMax) {
          const rMin = Math.min(b.r1, b.r2);
          const rMax = Math.max(b.r1, b.r2);
          if (row >= rMin && row <= rMax) {
            return false; // 交叉
          }
        }
      }
    } else {
      // 垂直桥 — 检查与现有水平桥的交叉
      const col = c1;
      const rMin = Math.min(r1, r2);
      const rMax = Math.max(r1, r2);
      for (const b of bridges) {
        if (b.count === 0) continue;
        if (b.r1 !== b.r2) continue; // 垂直桥不与垂直桥交叉
        // 水平桥 b: 行=b.r1, 从 b.c1 到 b.c2
        const hRow = b.r1;
        if (hRow > rMin && hRow < rMax) {
          const cMin2 = Math.min(b.c1, b.c2);
          const cMax2 = Math.max(b.c1, b.c2);
          if (col >= cMin2 && col <= cMax2) {
            return false; // 交叉
          }
        }
      }
    }
    return true;
  },

  /**
   * 找到与指定岛屿同行/同列的相邻岛屿（直接可见，中间无其他岛）
   */
  _findNeighbors(islandId) {
    const { islands, rows, cols } = this.data;
    const isl = islands[islandId];
    const neighbors = [];

    // 右
    for (let c = isl.c + 1; c < cols; c++) {
      const idx = islands.findIndex(i => i.r === isl.r && i.c === c);
      if (idx >= 0) {
        neighbors.push({ id: idx, dir: 'right' });
        break;
      }
    }
    // 左
    for (let c = isl.c - 1; c >= 0; c--) {
      const idx = islands.findIndex(i => i.r === isl.r && i.c === c);
      if (idx >= 0) {
        neighbors.push({ id: idx, dir: 'left' });
        break;
      }
    }
    // 下
    for (let r = isl.r + 1; r < rows; r++) {
      const idx = islands.findIndex(i => i.c === isl.c && i.r === r);
      if (idx >= 0) {
        neighbors.push({ id: idx, dir: 'down' });
        break;
      }
    }
    // 上
    for (let r = isl.r - 1; r >= 0; r--) {
      const idx = islands.findIndex(i => i.c === isl.c && i.r === r);
      if (idx >= 0) {
        neighbors.push({ id: idx, dir: 'up' });
        break;
      }
    }

    return neighbors;
  },

  /**
   * 点击岛屿 — 选中/连线
   */
  onIslandTap(e) {
    if (this.data.isComplete) return;
    const { id } = e.currentTarget.dataset;
    const { islands, bridges, selectedIsland } = this.data;

    if (selectedIsland === -1) {
      // 没有选中的岛，选中当前
      this.setData({ selectedIsland: id });
      this.playSoundIfEnabled('click');
      return;
    }

    if (selectedIsland === id) {
      // 取消选中
      this.setData({ selectedIsland: -1 });
      return;
    }

    // 已有一个选中，尝试连接
    const isl1 = islands[selectedIsland];
    const isl2 = islands[id];

    // 必须同行或同列
    if (isl1.r !== isl2.r && isl1.c !== isl2.c) {
      // 不在同行/列，切换选中
      this.setData({ selectedIsland: id });
      return;
    }

    // 检查中间是否有其他岛阻挡
    if (!this._areAdjacent(isl1, isl2)) {
      // 中间有岛阻挡，切换选中
      this.setData({ selectedIsland: id });
      return;
    }

    // 尝试添加/增加桥
    const bridgeIdx = this._findBridge(isl1.r, isl1.c, isl2.r, isl2.c);

    if (bridgeIdx >= 0) {
      const existing = bridges[bridgeIdx];
      if (existing.count >= 2) {
        // 已有2座桥，移除
        bridges.splice(bridgeIdx, 1);
      } else {
        // 增加到2
        existing.count = 2;
      }
    } else {
      // 检查交叉
      if (!this._canConnect(isl1.r, isl1.c, isl2.r, isl2.c)) {
        wx.showToast({ title: '桥不能交叉', icon: 'none' });
        this.setData({ selectedIsland: -1 });
        return;
      }
      // 新建1座桥
      bridges.push({ r1: isl1.r, c1: isl1.c, r2: isl2.r, c2: isl2.c, count: 1 });
    }

    this.setData({ bridges, selectedIsland: -1 });
    this._rebuildRenderData();
    this.playSoundIfEnabled('click');
    this.checkCompletion();
  },

  /**
   * 检查两岛之间是否直接相邻（无其他岛阻挡）
   */
  _areAdjacent(isl1, isl2) {
    const { islands } = this.data;
    if (isl1.r === isl2.r) {
      const cMin = Math.min(isl1.c, isl2.c);
      const cMax = Math.max(isl1.c, isl2.c);
      for (const isl of islands) {
        if (isl.r === isl1.r && isl.c > cMin && isl.c < cMax) return false;
      }
      return true;
    }
    if (isl1.c === isl2.c) {
      const rMin = Math.min(isl1.r, isl2.r);
      const rMax = Math.max(isl1.r, isl2.r);
      for (const isl of islands) {
        if (isl.c === isl1.c && isl.r > rMin && isl.r < rMax) return false;
      }
      return true;
    }
    return false;
  },

  /**
   * 点击空格子 — 方向连接模式
   * 点击岛屿旁边的空格，自动向该方向找最近的岛并连桥
   */
  onCellTap(e) {
    // 空格点击暂不处理，只通过岛屿点击交互
  },

  /**
   * 检查是否完成
   */
  checkCompletion() {
    const { islands, bridges } = this.data;

    // 1. 检查每个岛的桥数是否满足
    for (const isl of islands) {
      const count = this._getIslandBridgeCount(isl.id);
      if (count !== isl.n) return false;
    }

    // 2. 检查所有岛连通
    if (!this._checkConnectivity()) return false;

    // 完成！
    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');
    wx.removeStorageSync('bridges_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '再来一局',
      success: () => this.nextPuzzle()
    });

    return true;
  },

  /**
   * 检查连通性 — BFS/DFS
   */
  _checkConnectivity() {
    const { islands, bridges } = this.data;
    if (islands.length === 0) return true;

    const visited = new Set();
    const queue = [0];
    visited.add(0);

    while (queue.length > 0) {
      const curId = queue.shift();
      const cur = islands[curId];
      for (const b of bridges) {
        let neighborId = -1;
        if (b.r1 === cur.r && b.c1 === cur.c) {
          neighborId = islands.findIndex(i => i.r === b.r2 && i.c === b.c2);
        } else if (b.r2 === cur.r && b.c2 === cur.c) {
          neighborId = islands.findIndex(i => i.r === b.r1 && i.c === b.c1);
        }
        if (neighborId >= 0 && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return visited.size === islands.length;
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

  onJumpInputInline(e) {
    let val = parseInt(e.detail.value) || 1;
    const max = _totalPuzzles[this.data.difficulty] || 1000;
    if (val < 1) val = 1;
    if (val > max) val = max;
    this._jumpToId = val - 1;
    if (e.detail.value !== String(val)) {
      this.setData({ jumpInputValue: val });
    }
  },

  onJumpInline() {
    const targetId = this._jumpToId !== undefined ? this._jumpToId : this.data.puzzleId;
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(this.data.difficulty, targetId);
  },

  onReset() {
    this.setData({ bridges: [], selectedIsland: -1 });
    this._rebuildRenderData();
  },

  // 验证答案
  onVerify() {
    const { islands, bridges } = this.data;
    const errors = [];

    for (const isl of islands) {
      const count = this._getIslandBridgeCount(isl.id);
      if (count > isl.n) errors.push(`岛(${isl.r},${isl.c})桥数${count}超过需求${isl.n}`);
      else if (count < isl.n) errors.push(`岛(${isl.r},${isl.c})桥数${count}不足${isl.n}`);
    }

    if (!this._checkConnectivity()) {
      errors.push('岛屿未完全连通');
    }

    if (errors.length === 0) {
      wx.showModal({ title: '✅ 验证通过', content: '当前答案正确！', showCancel: false });
    } else {
      wx.showModal({ title: '❌ 还有问题', content: errors.join('\n'), showCancel: false });
    }
  },

  onToggleAnswer() {
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      this._userBridges = [...this.data.bridges.map(b => ({ ...b }))];
      const puzzle = this._currentPuzzle;
      if (puzzle && puzzle.answer && puzzle.answer.length > 0) {
        this.setData({ showAnswer: true, bridges: puzzle.answer.map(a => ({ ...a })) });
        this._rebuildRenderData();
      } else {
        wx.showToast({ title: '暂无答案', icon: 'none' });
      }
    } else {
      if (this._userBridges) {
        this.setData({ showAnswer: false, bridges: this._userBridges });
        this._rebuildRenderData();
      }
    }
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
