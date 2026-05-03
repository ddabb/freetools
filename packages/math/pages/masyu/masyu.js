/**
 * 珍珠 (Masyu) 游戏 - CDN版
 * 规则：
 * 1. 用线画闭合回路
 * 2. 线条不能交叉或分叉
 * 3. 黑珍珠：线条必须穿过并成直角转弯
 * 4. 白珍珠：线条必须穿过并直线通过
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/masyu';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

const CELL_EMPTY = 0;
const CELL_WHITE = 1;
const CELL_BLACK = 2;

Page({
  data: {
    rows: 6,
    cols: 6,
    grid: [],
    lines: [],
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
    maxPuzzles: 1000
  },

  timer: null,
  _currentPuzzle: null,
  _loadId: 0,

  onLoad(options) {
    console.log('[Masyu] onLoad 开始加载页面');
    const saved = wx.getStorageSync('masyu_saved');
    if (saved && saved.grid) {
      console.log('[Masyu] 使用本地缓存数据');
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false
      });
      this._currentPuzzle = { grid: saved.grid };
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      console.log(`[Masyu] 从 ${difficulty} 难度第 1 题开始`);
      this.loadPuzzle(difficulty, 0);
    }
  },

  onUnload() {
    console.log('[Masyu] onUnload 页面卸载');
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      console.log('[Masyu] 保存游戏状态');
      wx.setStorageSync('masyu_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        grid: this.data.grid,
        lines: this.data.lines,
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

    console.log(`[Masyu] loadPuzzle ${difficulty} 难度第 ${puzzleId + 1}/${maxPuzzles} 题, loadId=${loadId}`);

    this.setData({ isPlaying: false, isComplete: false, showAnswer: false });

    const filename = difficulty + '/' + difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_masyu_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      console.log('[Masyu] 使用本地缓存的题目');
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
          console.log('[Masyu] loadId 不匹配，忽略请求');
          return;
        }

        if (res.statusCode === 200 && res.data && res.data.grid) {
          console.log('[Masyu] 从网络加载题目成功，保存缓存');
          wx.setStorageSync(cacheKey, res.data);
          res.data._loadId = loadId;
          self._applyPuzzle(res.data, difficulty, puzzleId, maxPuzzles);
        } else {
          console.error('[Masyu] 从网络加载题目失败，状态码:', res.statusCode);
          self._loadFallback(difficulty, puzzleId, maxPuzzles);
        }
      },
      fail(err) {
        if (loadId !== self._loadId) {
          console.log('[Masyu] loadId 不匹配，忽略失败');
          return;
        }
        console.error('[Masyu] 网络请求失败:', err);
        self._loadFallback(difficulty, puzzleId, maxPuzzles);
      }
    });
  },

  _applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles) {
    console.log('[Masyu] _applyPuzzle 开始应用题目数据');

    const size = puzzleData.size || 6;
    const rows = size, cols = size;

    let grid = puzzleData.grid;
    if (typeof grid[0][0] === 'string') {
      grid = grid.map(row => row.map(cell => {
        if (cell === 'W') return CELL_WHITE;
        if (cell === 'B') return CELL_BLACK;
        return CELL_EMPTY;
      }));
    }

    const lines = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        top: false, right: false, bottom: false, left: false
      }))
    );

    this._currentPuzzle = { grid, lines: puzzleData.lines };

    const cellSize = this._calcCellSize(rows, cols);
    const DOT_OFFSET = 15;
    const containerWidth = cols * cellSize + DOT_OFFSET * 2;
    const containerHeight = rows * cellSize + DOT_OFFSET * 2;
    console.log(`[Masyu] 计算出的格子大小: ${cellSize}, 容器: ${containerWidth}x${containerHeight}`);

    this.setData({
      rows,
      cols,
      grid,
      lines,
      difficulty,
      puzzleId,
      jumpInputValue: '',
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      cellSize,
      containerWidth,
      containerHeight,
      maxPuzzles
    });

    this.startTimer();
    console.log('[Masyu] 题目加载完成');
  },

  _calcCellSize(rows, cols) {
    const sysInfo = wx.getSystemInfoSync();
    const maxW = sysInfo.windowWidth - 40;
    const maxH = sysInfo.windowHeight - 300;
    const sizeByW = Math.floor(maxW / cols);
    const sizeByH = Math.floor(maxH / rows);
    const cellSize = Math.max(25, Math.min(sizeByW, sizeByH, 50));
    console.log(`[Masyu] _calcCellSize 屏幕 ${maxW}x${maxH}, 格子 ${rows}x${cols}, 计算结果 ${cellSize}`);
    return cellSize;
  },

  _loadFallback(difficulty, puzzleId, maxPuzzles) {
    console.log('[Masyu] 使用本地随机题目');
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

    const pearlCount = Math.min(Math.floor(rows + cols), Math.floor(rows * cols * 0.15));
    for (let i = 0; i < pearlCount; i++) {
      const [r, c] = cells[i];
      grid[r][c] = Math.random() > 0.6 ? CELL_WHITE : CELL_BLACK;
    }

    const puzzleData = { size, grid, lines: null };
    puzzleData._loadId = this._loadId;
    this._applyPuzzle(puzzleData, difficulty, puzzleId, maxPuzzles);
  },

  startTimer() {
    console.log('[Masyu] startTimer 计时器启动');
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
      console.log('[Masyu] stopTimer 计时器停止');
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onEdgeTap(e) {
    if (this.data.isComplete) return;
    const { r, c, dir } = e.currentTarget.dataset;
    const { lines, rows, cols } = this.data;

    let newLines = lines.map(row => row.map(l => ({ ...l })));

    if (dir === 'h') {
      newLines[r][c].right = !newLines[r][c].right;
      if (c + 1 < cols) {
        newLines[r][c + 1].left = !newLines[r][c + 1].left;
      }
    } else {
      newLines[r][c].bottom = !newLines[r][c].bottom;
      if (r + 1 < rows) {
        newLines[r + 1][c].top = !newLines[r + 1][c].top;
      }
    }

    console.log(`[Masyu] onEdgeTap (${r},${c}) ${dir === 'h' ? '横线' : '竖线'}`);
    this.setData({ lines: newLines });
    this.checkCompletion();
  },

  checkCompletion() {
    console.log('[Masyu] checkCompletion 开始检查完成');
    const { rows, cols, grid, lines } = this.data;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const line = lines[r][c];
        const conns = [line.top, line.right, line.bottom, line.left].filter(x => x);
        if (conns.length > 0 && conns.length !== 2) {
          console.log(`[Masyu] ❌ (${r},${c}) 连线数 ${conns.length} 不是2`);
          return;
        }
      }
    }

    let hasLine = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const line = lines[r][c];
        if (line.top || line.right || line.bottom || line.left) {
          hasLine = true;
          break;
        }
      }
      if (hasLine) break;
    }
    if (!hasLine) return;

    let startR = -1, startC = -1;
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const line = lines[r][c];
        if (line.top || line.right || line.bottom || line.left) {
          startR = r;
          startC = c;
          break outer;
        }
      }
    }

    if (startR === -1) return;

    const visited = new Set();
    let prevDir = -1;
    let [cr, cc] = [startR, startC];
    let steps = 0;
    let totalLine = 0;
    let totalCells = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const line = lines[r][c];
        if (line.top || line.right || line.bottom || line.left) {
          totalCells++;
          if (line.top) totalLine++;
          if (line.right) totalLine++;
          if (line.bottom) totalLine++;
          if (line.left) totalLine++;
        }
      }
    }
    totalLine = Math.floor(totalLine / 2);

    const dirs = [
      { name: 'top', dr: -1, dc: 0, opp: 'bottom', idx: 0 },
      { name: 'right', dr: 0, dc: 1, opp: 'left', idx: 1 },
      { name: 'bottom', dr: 1, dc: 0, opp: 'top', idx: 2 },
      { name: 'left', dr: 0, dc: -1, opp: 'right', idx: 3 },
    ];

    while (steps < 200) {
      const key = `${cr},${cc}`;
      if (visited.has(key)) {
        if (cr === startR && cc === startC && steps >= totalCells) {
          break;
        }
        console.log(`[Masyu] ❌ 访问重复点 (${cr},${cc}) 但没有回到起点`);
        return;
      }
      visited.add(key);

      const line = lines[cr][cc];
      const nextDirs = [];

      for (let i = 0; i < 4; i++) {
        if (prevDir >= 0 && dirs[i].opp === dirs[prevDir].name) continue;
        if (line[dirs[i].name]) nextDirs.push(i);
      }

      if (nextDirs.length === 0) {
        console.log(`[Masyu] ❌ (${cr},${cc}) 无法继续`);
        return;
      }
      if (nextDirs.length !== 1) {
        console.log(`[Masyu] ❌ (${cr},${cc}) 有 ${nextDirs.length} 个方向`);
        return;
      }

      const dir = nextDirs[0];
      const nr = cr + dirs[dir].dr;
      const nc = cc + dirs[dir].dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        console.log(`[Masyu] ❌ (${cr},${cc}) ${dir} 越界`);
        return;
      }

      const nextLine = lines[nr][nc];
      if (!nextLine[dirs[dir].opp]) {
        console.log(`[Masyu] ❌ (${nr},${nc}) 没有连接到 (${cr},${cc})`);
        return;
      }

      if (grid[cr][cc] === CELL_BLACK) {
        const last = (prevDir + 1) % 4;
        if (prevDir >= 0 && dir !== (prevDir + 1) % 4 && dir !== (prevDir - 1 + 4) % 4) {
          console.log(`[Masyu] ❌ 黑珍珠 (${cr},${cc}) 没有转弯`);
          return;
        }
      }
      if (grid[cr][cc] === CELL_WHITE) {
        const isStraight = (prevDir >= 0) && (
          (dirs[prevDir].dr === -dirs[dir].dr && dirs[prevDir].dc === -dirs[dir].dc)
        );
        if (prevDir >= 0 && !isStraight) {
          console.log(`[Masyu] ❌ 白珍珠 (${cr},${cc}) 没有直线穿过`);
          return;
        }
      }

      cr = nr;
      cc = nc;
      prevDir = dir;
      steps++;
    }

    if (cr !== startR || cc !== startC) {
      console.log('[Masyu] ❌ 没有形成回路');
      return;
    }

    let totalVisited = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const line = lines[r][c];
        if (line.top || line.right || line.bottom || line.left) {
          totalVisited++;
        }
      }
    }
    if (totalVisited < visited.size) {
      console.log('[Masyu] ❌ 有未访问的线条');
      return;
    }

    console.log('[Masyu] ✅ 所有检查通过！');
    this.setData({ isComplete: true });
    this.stopTimer();
    wx.removeStorageSync('masyu_saved');

    wx.showModal({
      title: '🎉 恭喜完成！',
      content: `用时 ${this.formatTime(this.data.time)}`,
      showCancel: false,
      confirmText: '下一题'
    }).then(() => this.nextPuzzle());
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    console.log(`[Masyu] onDifficultyChange 切换到 ${difficulty} 难度`);
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
    console.log(`[Masyu] nextPuzzle 切换到第 ${nextId + 1} 题`);
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(difficulty, nextId);
  },

  onJumpInput(e) {
    const value = e.detail.value;
    const max = this.data.maxPuzzles;
    let jumpInputValue = value;

    if (value && parseInt(value) > max) {
      jumpInputValue = String(max);
    }
    console.log(`[Masyu] onJumpInput 输入: ${value}, 处理后: ${jumpInputValue}`);
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
    console.log(`[Masyu] onJump 跳转到第 ${targetId + 1} 题`);
    this.setData({ isComplete: false, jumpInputValue: '' });
    this.loadPuzzle(this.data.difficulty, targetId);
  },

  onReset() {
    console.log('[Masyu] onReset 重置题目');
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    console.log(`[Masyu] onShowAnswer ${showAnswer ? '显示' : '隐藏'}答案`);
    if (showAnswer) {
      const { rows, cols } = this.data;
      const solutionLines = this._currentPuzzle.lines;
      if (solutionLines) {
        console.log('[Masyu] 使用题目中的答案');
        this.setData({ showAnswer, lines: solutionLines });
      } else {
        console.log('[Masyu] 暂无答案数据');
        wx.showToast({ title: '暂无答案', icon: 'none' });
      }
    } else {
      const { rows, cols } = this.data;
      const lines = Array(rows).fill(null).map(() =>
        Array(cols).fill(null).map(() => ({
          top: false, right: false, bottom: false, left: false
        }))
      );
      console.log('[Masyu] 隐藏答案，清除线条');
      this.setData({ showAnswer, lines });
    }
  },

  onShowRules() {
    console.log('[Masyu] onShowRules 显示规则');
    this.setData({ showRules: true });
  },

  onHideRules() {
    console.log('[Masyu] onHideRules 隐藏规则');
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