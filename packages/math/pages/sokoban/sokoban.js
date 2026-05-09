/**
 * 推箱子 (Sokoban) 游戏 - CDN版
 * 规则：
 * 1. 玩家推动箱子到目标位置
 * 2. 箱子只能被推动，不能拉动
 * 3. 每次只能推动一个箱子
 * 4. 所有箱子到达目标位置即可通关
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/sokoban';
const TOTAL_PUZZLES = { easy: 1000, medium: 1000, hard: 1000 };

const CELL_EMPTY = 0;
const CELL_WALL = 1;
const CELL_BOX = 2;
const CELL_GOAL = 3;
const CELL_BOX_ON_GOAL = 4;

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

Page({
  data: {
    rows: 6,
    cols: 6,
    grid: [],
    playerPos: [0, 0],
    boxes: [],
    goals: [],
    difficulty: 'easy',
    puzzleId: 0,
    jumpInputValue: '',
    time: 0,
    timeStr: '0:00',
    isPlaying: false,
    isComplete: false,
    cellSize: 40,
    showAnswer: false,
    showRules: false,
    showAnswerDone: false,
    maxPuzzles: 50,
    boxCount: 0,
    goalCount: 0,
    moveCount: 0,
    goalsMap: [],
    boxesMap: [],
    playerRow: 0,
    playerCol: 0,
    pageId: 'sokoban',
  },

  timer: null,
  _currentPuzzle: null,
  _loadId: 0,
  _pageId: 'sokoban',
  _solutionMoves: [],
  _playbackTimer: null,
  _playbackStep: 0,

  playSoundIfEnabled(name) {
    if (isPageSoundEnabled('sokoban')) {
      playSound(name, { pageId: 'sokoban' });
    }
  },
  _computeCellMaps(rows, cols, boxes, goals) {
    const goalsMap = [];
    const boxesMap = [];
    for (let r = 0; r < rows; r++) {
      goalsMap[r] = [];
      boxesMap[r] = [];
      for (let c = 0; c < cols; c++) {
        goalsMap[r][c] = goals.some(g => g[0] === r && g[1] === c) ? 1 : 0;
        boxesMap[r][c] = boxes.some(b => b[0] === r && b[1] === c) ? 1 : 0;
      }
    }
    return { goalsMap, boxesMap };
  },

  _updateBoxesMap() {
    const { rows, cols, boxes, goals } = this.data;
    const newBoxesMap = [];
    for (let r = 0; r < rows; r++) {
      newBoxesMap[r] = [];
      for (let c = 0; c < cols; c++) {
        newBoxesMap[r][c] = boxes.some(b => b[0] === r && b[1] === c) ? 1 : 0;
      }
    }
    this.setData({ boxesMap: newBoxesMap });
  },

  // A* 求解器
  _solveAStar(grid, boxes, goals, playerPos, maxSteps = 2000) {
    const rows = grid.length;
    const cols = grid[0] ? grid[0].length : 0;
    
    // 检查位置是否有效
    const isValid = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r] && grid[r][c] !== CELL_WALL;
    
    // 检查箱子是否在目标上
    const isAllDone = (bxs) => bxs.every(b => goals.some(g => g[0] === b[0] && g[1] === b[1]));
    
    // 状态哈希
    const stateKey = (p, bxs) => p[0] + ',' + p[1] + '|' + bxs.map(b => b[0] + ',' + b[1]).sort().join(';');
    
    // BFS/A* 搜索
    const openSet = new Map();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    
    const startKey = stateKey(playerPos, boxes);
    openSet.set(startKey, 0);
    gScore.set(startKey, 0);
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (openSet.size > 0) {
      // 取出 fScore 最小的状态
      let current = null;
      let minF = Infinity;
      for (const [key, f] of openSet) {
        if (f < minF) {
          minF = f;
          current = key;
        }
      }
      
      if (!current) break;
      openSet.delete(current);
      
      if (closedSet.has(current)) continue;
      closedSet.add(current);
      
      // 解析当前状态
      const [posPart, boxPart] = current.split('|');
      const [pr, pc] = posPart.split(',').map(Number);
      const bxs = boxPart.split(';').map(b => b.split(',').map(Number));
      
      // 检查是否完成
      if (isAllDone(bxs)) {
        // 重建路径
        const path = [];
        let key = current;
        while (cameFrom.has(key)) {
          const prev = cameFrom.get(key);
          const [, move] = key.split(':');
          if (move) path.unshift(move);
          key = prev;
        }
        return path;
      }
      
      const currentG = gScore.get(current);
      if (currentG >= maxSteps) continue;
      
      // 尝试四个方向
      for (const [dr, dc] of directions) {
        const nr = pr + dr;
        const nc = pc + dc;
        
        if (!isValid(nr, nc)) continue;
        
        const newBoxes = bxs.map(b => [...b]);
        let moved = false;
        let move = null;
        
        // 检查是否推动箱子
        const boxIdx = newBoxes.findIndex(b => b[0] === nr && b[1] === nc);
        if (boxIdx >= 0) {
          const nbr = nr + dr;
          const nbc = nc + dc;
          if (!isValid(nbr, nbc)) continue;
          
          const nextBoxIdx = newBoxes.findIndex(b => b[0] === nbr && b[1] === nbc);
          if (nextBoxIdx >= 0) continue;
          
          newBoxes[boxIdx] = [nbr, nbc];
          moved = true;
          move = dr === 1 ? 'down' : dr === -1 ? 'up' : dc === 1 ? 'right' : 'left';
        } else {
          move = dr === 1 ? 'down' : dr === -1 ? 'up' : dc === 1 ? 'right' : 'left';
        }
        
        const nextKey = stateKey([nr, nc], newBoxes) + (move ? ':' + move : '');
        if (closedSet.has(nextKey)) continue;
        
        const nextG = currentG + 1;
        const heuristic = newBoxes.filter(b => !goals.some(g => g[0] === b[0] && g[1] === b[1])).length * 2;
        const nextF = nextG + heuristic;
        
        if (!gScore.has(nextKey) || nextG < gScore.get(nextKey)) {
          gScore.set(nextKey, nextG);
          cameFrom.set(nextKey, current);
          openSet.set(nextKey, nextF);
        }
      }
    }
    
    return null; // 无解
  },

  // 播放动画
  _playSolution() {
    if (!this._solutionMoves || this._solutionMoves.length === 0) return;
    
    this._playbackStep = 0;
    this._playbackTimer = setInterval(() => {
      if (this._playbackStep >= this._solutionMoves.length) {
        this._stopPlayback();
        return;
      }
      
      const move = this._solutionMoves[this._playbackStep];
      this._applyMove(move);
      this._playbackStep++;
    }, 300);
  },

  _applyMove(direction) {
    console.log('[Sokoban] _applyMove:', direction);
    const { playerPos, grid, boxes, goals } = this.data;
    const [pr, pc] = playerPos;
    const { rows, cols } = this.data;
    
    const dr = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    const dc = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    
    const nr = pr + dr;
    const nc = pc + dc;
    console.log('[Sokoban] move from', pr, pc, 'to', nr, nc, 'grid size', rows, cols);
    
    // 先检查边界
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
      console.log('[Sokoban] out of bounds');
      return;
    }
    if (grid[nr] && grid[nr][nc] === CELL_WALL) {
      console.log('[Sokoban] hit wall');
      return;
    }
    
    let newBoxes = boxes.map(b => [...b]);
    
    const boxIdx = newBoxes.findIndex(b => b[0] === nr && b[1] === nc);
    if (boxIdx >= 0) {
      const nbr = nr + dr;
      const nbc = nc + dc;
      if (grid[nbr] && grid[nbr][nbc] === CELL_WALL) return;
      if (newBoxes.some(b => b[0] === nbr && b[1] === nbc)) return;
      newBoxes[boxIdx] = [nbr, nbc];
    }
    
    this.setData({ playerPos: [nr, nc], boxes: newBoxes, moveCount: this.data.moveCount + 1, playerRow: nr, playerCol: nc });
    this._updateBoxesMap();
  },

  _stopPlayback() {
    if (this._playbackTimer) {
      clearInterval(this._playbackTimer);
      this._playbackTimer = null;
    }
    this._solutionMoves = [];
    this._playbackStep = 0;
    // 不再自动切换下一题，只显示完成提示
    this.setData({ showAnswer: false, showAnswerDone: true });
  },

  onCloseAnswer() {
    console.log('[Sokoban] 关闭答案弹窗');
    if (this._playbackTimer) {
      clearInterval(this._playbackTimer);
      this._playbackTimer = null;
    }
    this._solutionMoves = [];
    this._playbackStep = 0;
    this.setData({ showAnswer: false, showAnswerDone: false });
    // 复位谜题状态，便于再次演示
    const { initPlayerPos, initBoxes } = this.data;
    this.setData({ playerPos: initPlayerPos, playerRow: initPlayerPos[0], playerCol: initPlayerPos[1], boxes: initBoxes, moveCount: 0 });
    this._updateBoxesMap();
  },

  onLoad(options) {
    console.log('[Sokoban] onLoad 开始加载页面');
    preloadSounds(['tap', 'push', 'win', 'error'], 'sokoban');
    
    const saved = wx.getStorageSync('sokoban_saved');
    if (saved && saved.grid) {
      console.log('[Sokoban] 使用本地缓存数据');
      const { goalsMap, boxesMap } = this._computeCellMaps(
        saved.rows, saved.cols, saved.boxes, saved.goals
      );
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false,
        goalsMap,
        boxesMap,
        playerRow: saved.playerPos[0],
        playerCol: saved.playerPos[1]
      });
      this._currentPuzzle = { grid: saved.grid, boxes: saved.boxes, goals: saved.goals, playerPos: saved.playerPos };
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      console.log(`[Sokoban] 从 ${difficulty} 难度第 1 题开始`);
      this.loadPuzzle(difficulty, 0);
    }
  },

  onUnload() {
    console.log('[Sokoban] onUnload 页面卸载');
    this.stopTimer();
    if (this.data.isPlaying && !this.data.isComplete) {
      console.log('[Sokoban] 保存游戏状态');
      wx.setStorageSync('sokoban_saved', {
        rows: this.data.rows,
        cols: this.data.cols,
        grid: this.data.grid,
        boxes: this.data.boxes,
        goals: this.data.goals,
        playerPos: this.data.playerPos,
        difficulty: this.data.difficulty,
        puzzleId: this.data.puzzleId,
        time: this.data.time
      });
    }
  },

  loadPuzzle(difficulty, puzzleId) {
    const self = this;
    const loadId = ++this._loadId;
    const maxPuzzles = TOTAL_PUZZLES[difficulty] || 50;
    
    console.log(`[Sokoban] loadPuzzle ${difficulty} 难度第 ${puzzleId + 1}/${maxPuzzles} 题, loadId=${loadId}`);

    this.setData({ isPlaying: false, isComplete: false, showAnswer: false, moveCount: 0 });

    const filename = difficulty + '-' + String(puzzleId + 1).padStart(4, '0') + '.json';
    const cacheKey = 'cdn_sokoban_' + difficulty + '_' + String(puzzleId + 1).padStart(4, '0');

    const cached = wx.getStorageSync(cacheKey);
    if (cached && cached.grid) {
      console.log('[Sokoban] 使用本地缓存的题目');
      cached._loadId = loadId;
      this._applyPuzzle(cached, difficulty, puzzleId, maxPuzzles);
      return;
    }

    wx.downloadFile({
      url: CDN_BASE + '/' + filename,
      success(res) {
        console.log('[Sokoban] 下载成功');
        const fs = wx.getFileSystemManager();
        const content = fs.readFileSync(res.tempFilePath, 'utf8');
        let puzzle;
        try {
          puzzle = JSON.parse(content);
          puzzle._loadId = loadId;
          wx.setStorageSync(cacheKey, puzzle);
        } catch (e) {
          console.error('[Sokoban] 解析失败', e);
          self.loadPuzzle(difficulty, puzzleId);
          return;
        }
        self._applyPuzzle(puzzle, difficulty, puzzleId, maxPuzzles);
      },
      fail(err) {
        console.error('[Sokoban] 下载失败', err);
        self.loadPuzzle(difficulty, puzzleId);
      }
    });
  },

  _applyPuzzle(puzzle, difficulty, puzzleId, maxPuzzles) {
    if (puzzle._loadId !== this._loadId) {
      console.log('[Sokoban] 忽略过期题目');
      return;
    }

    console.log('[Sokoban] 应用题目', puzzle.rows + 'x' + puzzle.cols);

    const grid = puzzle.grid || [];
    const rows = puzzle.rows || 6;
    const cols = puzzle.cols || 6;
    const boxes = puzzle.boxes || [];
    const goals = puzzle.goals || [];
    const playerPos = puzzle.playerStart || puzzle.playerPos || [0, 0];

    this._currentPuzzle = { grid, boxes, goals, playerPos, answer: puzzle.answer };

    const cellSize = cols > 8 ? 35 : (cols > 6 ? 40 : 45);

    const { goalsMap, boxesMap } = this._computeCellMaps(rows, cols, boxes, goals);
    this.setData({
      rows, cols,
      grid, boxes, goals,
      playerPos,
      playerRow: playerPos[0],
      playerCol: playerPos[1],
      difficulty,
      puzzleId,
      maxPuzzles,
      boxCount: boxes.length,
      goalCount: goals.length,
      cellSize,
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      goalsMap,
      boxesMap
    });

    this.startTimer();
  },

  startTimer() {
    this.stopTimer();
    this.setData({ time: 0, timeStr: '0:00' });
    this.timer = setInterval(() => {
      const t = this.data.time + 1;
      const m = Math.floor(t / 60);
      const s = t % 60;
      this.setData({ time: t, timeStr: m + ':' + String(s).padStart(2, '0') });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  onCellTap(e) {
    if (!this.data.isPlaying || this.data.isComplete) return;

    const { r, c } = e.currentTarget.dataset;
    const { playerPos, grid, boxes, goals, cellSize } = this.data;
    const [pr, pc] = playerPos;

    const dr = r - pr;
    const dc = c - pc;

    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    const nr = pr + dr;
    const nc = pc + dc;

    if (grid[nr] && grid[nr][nc] === CELL_WALL) {
      this.playSoundIfEnabled('error');
      return;
    }

    const boxIndex = boxes.findIndex(b => b[0] === nr && b[1] === nc);
    
    if (boxIndex >= 0) {
      const nbr = nr + dr;
      const nbc = nc + dc;

      if (grid[nbr] && grid[nbr][nbc] === CELL_WALL) {
        this.playSoundIfEnabled('error');
        return;
      }

      const nextBoxIndex = boxes.findIndex(b => b[0] === nbr && b[1] === nbc);
      if (nextBoxIndex >= 0) {
        this.playSoundIfEnabled('error');
        return;
      }

      this.playSoundIfEnabled('push');
      boxes[boxIndex] = [nbr, nbc];
      this.setData({ boxes, playerPos: [nr, nc], playerRow: nr, playerCol: nc, moveCount: this.data.moveCount + 1 });
      this._updateBoxesMap();
    } else {
      this.playSoundIfEnabled('tap');
      this.setData({ playerPos: [nr, nc], playerRow: nr, playerCol: nc, moveCount: this.data.moveCount + 1 });
    }

    this._checkWin();
  },

  _checkWin() {
    const { boxes, goals } = this.data;
    // 提前校验数据完整性
    if (!boxes || boxes.length === 0 || !goals || goals.length === 0) {
      console.log('[Sokoban] _checkWin: 数据不完整，跳过检测');
      return;
    }
    let allOnGoal = true;
    for (const box of boxes) {
      const onGoal = goals.some(g => g[0] === box[0] && g[1] === box[1]);
      if (!onGoal) {
        allOnGoal = false;
        break;
      }
    }
    console.log(`[Sokoban] _checkWin: ${boxes.length}箱 ${goals.length}目标 allOnGoal=${allOnGoal}`);

    if (allOnGoal) {
      console.log('[Sokoban] 通关！');
      this.stopTimer();
      this.setData({ isComplete: true, isPlaying: false });
      this.playSoundIfEnabled('win');
      wx.removeStorageSync('sokoban_saved');
      // 给用户一个 toast 提示通关，然后再显示 overlay
      wx.showToast({ title: '🎉 恭喜通关！', icon: 'none', duration: 2000 });
    }
  },

  onNextPuzzle() {
    const { difficulty, puzzleId, maxPuzzles } = this.data;
    const nextId = (puzzleId + 1) % maxPuzzles;
    console.log(`[Sokoban] 下一题 ${difficulty} 难度第 ${nextId + 1} 题`);
    this.loadPuzzle(difficulty, nextId);
  },

  onPrevPuzzle() {
    const { difficulty, puzzleId, maxPuzzles } = this.data;
    const prevId = (puzzleId - 1 + maxPuzzles) % maxPuzzles;
    console.log(`[Sokoban] 上一题 ${difficulty} 难度第 ${prevId + 1} 题`);
    this.loadPuzzle(difficulty, prevId);
  },

  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    console.log(`[Sokoban] 切换难度 ${difficulty}`);
    this.loadPuzzle(difficulty, 0);
  },

  onJumpInput(e) {
    this.setData({ jumpInputValue: e.detail.value });
  },

  onJumpSubmit() {
    const { difficulty, maxPuzzles, jumpInputValue } = this.data;
    let id = parseInt(jumpInputValue) - 1;
    if (isNaN(id) || id < 0) id = 0;
    if (id >= maxPuzzles) id = maxPuzzles - 1;
    console.log(`[Sokoban] 跳转第 ${id + 1} 题`);
    this.setData({ jumpInputValue: '' });
    this.loadPuzzle(difficulty, id);
  },

  onReset() {
    console.log('[Sokoban] 重置本题 _currentPuzzle:', JSON.stringify(this._currentPuzzle));
    if (this._playbackTimer) {
      clearInterval(this._playbackTimer);
      this._playbackTimer = null;
    }
    this._solutionMoves = [];
    this._playbackStep = 0;
    if (this._currentPuzzle) {
      const { grid, boxes, goals, playerPos } = this._currentPuzzle;
      const rows = this.data.rows;
      const cols = this.data.cols;
      const { goalsMap, boxesMap } = this._computeCellMaps(rows, cols, boxes, goals);
      console.log('[Sokoban] 重置 boxes:', JSON.stringify(boxes), 'goals:', JSON.stringify(goals));
      this.setData({
        grid, boxes, goals, playerPos,
        playerRow: playerPos[0],
        playerCol: playerPos[1],
        moveCount: 0,
        isComplete: false,
        isPlaying: true,
        showAnswer: false,
        goalsMap,
        boxesMap
      });
      this.startTimer();
    }
  },

  onShowRules() {
    this.setData({ showRules: !this.data.showRules });
  },

  onShowAnswer() {
    if (this.data.isComplete) return;
    if (this.data.showAnswer) {
      // 已经在显示答案，关闭并重置
      this.onCloseAnswer();
      return;
    }
    console.log('[Sokoban] 使用题库答案');
    this.stopTimer();
    
    // 直接使用 CDN 提供的 answer 字段
    const puzzle = this._currentPuzzle;
    console.log('[Sokoban] _currentPuzzle:', JSON.stringify(puzzle));
    if (!puzzle || !puzzle.answer) {
      console.log('[Sokoban] 没有答案数据, answer:', puzzle ? puzzle.answer : 'puzzle is null');
      wx.showToast({ title: '无答案', icon: 'none' });
      return;
    }
    
    // NEW标准编码：D=下, U=上, R=右, L=左
    // 推箱子题库多推指令最多到3，预设到9以防后续扩展
    const dm = { D:'down', U:'up', R:'right', L:'left' };
    const directionMap = Object.assign({}, dm,
      {D0:'down',U0:'up',R0:'right',L0:'left'},
      {D1:'down',U1:'up',R1:'right',L1:'left'},
      {D2:'down',U2:'up',R2:'right',L2:'left'},
      {D3:'down',U3:'up',R3:'right',L3:'left'},
      {D4:'down',U4:'up',R4:'right',L4:'left'},
      {D5:'down',U5:'up',R5:'right',L5:'left'},
      {D6:'down',U6:'up',R6:'right',L6:'left'},
      {D7:'down',U7:'up',R7:'right',L7:'left'},
      {D8:'down',U8:'up',R8:'right',L8:'left'},
      {D9:'down',U9:'up',R9:'right',L9:'left'}
    );
    const moves = puzzle.answer.map(a => directionMap[a] || a);
    console.log('[Sokoban] 答案步数：' + moves.length);
    this._solutionMoves = moves;
    this.setData({ showAnswer: true });

    // 开始动画播放
    this._playSolution();
  },

  onShowAnswerOld() {
    if (this.data.isComplete) return;
    console.log('[Sokoban] 显示答案');
    this.setData({ showAnswer: true });
    this.stopTimer();
  },

  // 触摸滑动移动玩家
  onTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._touchMoved = false;
  },

  onTouchMove(e) {
    this._touchMoved = true;
  },

  onTouchEnd(e) {
    if (!this._touchStartX) return;
    const dx = e.changedTouches[0].clientX - this._touchStartX;
    const dy = e.changedTouches[0].clientY - this._touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // 滑动距离小于 30px 视为无效
    if (Math.max(absDx, absDy) < 30) {
      this._touchStartX = null;
      this._touchStartY = null;
      return;
    }
    // 确定滑动方向（横向优先）
    if (absDx > absDy) {
      this._applyMove(dx > 0 ? 'right' : 'left');
    } else {
      this._applyMove(dy > 0 ? 'down' : 'up');
    }
    this._touchStartX = null;
    this._touchStartY = null;
  }
});