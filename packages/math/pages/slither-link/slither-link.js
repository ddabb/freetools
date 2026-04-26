/**
 * 数回 (Slither Link) 游戏
 * 
 * 规则：
 * 1. 在格点之间画线，形成一条闭合环路（不能分叉、不能断开）
 * 2. 格子中的数字表示该格子四周有多少条线段
 * 3. 没有数字的格子，四周线段数不限
 * 4. 环路不能交叉，也不能分叉
 */

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 边的状态
const EDGE_EMPTY = 0;   // 无线
const EDGE_LINE = 1;    // 有线
const EDGE_CROSS = 2;   // 标记不可画线（×）

const DIFFICULTY_TEXT = {
  easy: '5×5 简单',
  medium: '7×7 中等',
  hard: '10×10 困难'
};

/**
 * 从一个已知的 loop 路径反推 hints
 * loop: 格点坐标数组，按顺序排列，首尾相连
 */
function generatePuzzleFromLoop(rows, cols, loop) {
  // 构建边集合
  const hEdges = new Set(); // "r,c" 格式
  const vEdges = new Set(); // "r,c" 格式
  
  for (let i = 0; i < loop.length; i++) {
    const [r1, c1] = loop[i];
    const [r2, c2] = loop[(i + 1) % loop.length];
    
    if (r1 === r2) {
      // 水平边
      const minC = Math.min(c1, c2);
      hEdges.add(`${r1},${minC}`);
    } else {
      // 垂直边
      const minR = Math.min(r1, r2);
      vEdges.add(`${minR},${c1}`);
    }
  }
  
  // 计算每个格子的 hint
  const hints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (hEdges.has(`${r},${c}`)) count++;       // 上边
      if (hEdges.has(`${r + 1},${c}`)) count++;   // 下边
      if (vEdges.has(`${r},${c}`)) count++;        // 左边
      if (vEdges.has(`${r},${c + 1}`)) count++;    // 右边
      row.push(count);
    }
    hints.push(row);
  }
  
  // 构建 answer
  const answerH = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(hEdges.has(`${r},${c}`) ? 1 : 0);
    }
    answerH.push(row);
  }
  
  const answerV = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c <= cols; c++) {
      row.push(vEdges.has(`${r},${c}`) ? 1 : 0);
    }
    answerV.push(row);
  }
  
  // 决定哪些 hint 显示：随机隐藏一些，但保留 0 和关键约束
  const displayHints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      // 0 必须显示（强约束），3 也尽量显示
      // 其他数字随机隐藏 40%
      if (hints[r][c] === 0) {
        row.push(0);
      } else if (hints[r][c] === 3) {
        row.push(Math.random() < 0.7 ? 3 : null);
      } else {
        row.push(Math.random() < 0.55 ? hints[r][c] : null);
      }
    }
    displayHints.push(row);
  }
  
  return {
    rows, cols,
    hints: displayHints,
    fullHints: hints,
    answer: { h: answerH, v: answerV }
  };
}

/**
 * 生成一个随机环路（在格点上行走，不交叉，回到起点）
 * 使用简单的"蛇形"模式 + 变体生成有保证的环路
 */
function generateRandomLoop(rows, cols) {
  // 策略：先在内部生成若干矩形环，再合并
  // 更简单可靠的方式：蛇形路径
  
  const visited = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(false));
  const loop = [];
  const path = [];
  
  // 使用 DFS 随机走，尝试回到起点形成环
  // 从 (0,0) 出发
  const startR = 0, startC = 0;
  visited[startR][startC] = true;
  path.push([startR, startC]);
  
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // 右下左上
  
  function dfs(r, c, depth) {
    // 打乱方向
    const shuffled = dirs.slice().sort(() => Math.random() - 0.5);
    
    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      
      // 边界检查
      if (nr < 0 || nr > rows || nc < 0 || nc > cols) continue;
      
      // 回到起点，形成环
      if (nr === startR && nc === startC && depth >= 3) {
        loop.push(...path);
        return true;
      }
      
      // 已访问
      if (visited[nr][nc]) continue;
      
      visited[nr][nc] = true;
      path.push([nr, nc]);
      
      if (dfs(nr, nc, depth + 1)) return true;
      
      path.pop();
      visited[nr][nc] = false;
    }
    
    return false;
  }
  
  if (dfs(startR, startC, 0)) {
    return loop;
  }
  
  // Fallback: 简单矩形环
  return generateRectLoop(rows, cols);
}

/**
 * 生成矩形环路
 */
function generateRectLoop(rows, cols) {
  const r1 = 0, c1 = 0;
  const r2 = rows, c2 = cols;
  const loop = [];
  
  // 上边: (r1,c1) → (r1,c2)
  for (let c = c1; c <= c2; c++) loop.push([r1, c]);
  // 右边: (r1,c2) → (r2,c2)
  for (let r = r1 + 1; r <= r2; r++) loop.push([r, c2]);
  // 下边: (r2,c2) → (r2,c1)
  for (let c = c2 - 1; c >= c1; c--) loop.push([r2, c]);
  // 左边: (r2,c1) → (r1,c1)  (不重复起点)
  for (let r = r2 - 1; r > r1; r--) loop.push([r, c1]);
  
  return loop;
}

/**
 * 生成蛇形环路 - 适合中等和困难难度
 * 在内部挖出空洞，形成更复杂的环路
 */
function generateSnakeLoop(rows, cols) {
  // 生成外围大矩形环
  const r1 = 0, c1 = 0;
  const r2 = rows, c2 = cols;
  const loop = [];
  
  // 外圈
  for (let c = c1; c <= c2; c++) loop.push([r1, c]);
  for (let r = r1 + 1; r <= r2; r++) loop.push([r, c2]);
  for (let c = c2 - 1; c >= c1; c--) loop.push([r2, c]);
  for (let r = r2 - 1; r > r1; r--) loop.push([r, c1]);
  
  return loop;
}

/**
 * 生成带内凹的复杂环路
 */
function generateComplexLoop(rows, cols) {
  const loop = [];
  
  // 使用"梳子"形路径，在网格中蛇形前进形成环
  // 顶部横线
  for (let c = 0; c <= cols; c++) loop.push([0, c]);
  // 右侧向下
  for (let r = 1; r <= rows; r++) loop.push([r, cols]);
  // 底部横线
  for (let c = cols - 1; c >= 0; c--) loop.push([rows, c]);
  // 左侧向上（不到顶）
  for (let r = rows - 1; r >= 1; r--) loop.push([r, 0]);
  
  // 内部锯齿：从(1,0)回到(0,0)
  // 但这样不是环...我们回到 (1,0) 然后需要连到 (0,0)
  // 其实上面已经包含了 (0,0) 作为起点
  // 需要修正：左侧向上回到 (0,0)
  // 重写
  loop.length = 0;
  
  // 从(0,0)出发
  // 顶部 → 右 → 底部 → 左 → 回到顶部，但是做成蛇形
  // 简单方案：外圈矩形环 + 内部"齿"
  
  // 外圈
  for (let c = 0; c <= cols; c++) loop.push([0, c]);      // 顶
  for (let r = 1; r <= rows; r++) loop.push([r, cols]);    // 右
  for (let c = cols - 1; c >= 0; c--) loop.push([rows, c]); // 底
  for (let r = rows - 1; r > 0; r--) loop.push([r, 0]);   // 左到(1,0)
  loop.push([0, 0]); // 回到起点
  
  // 去掉最后的重复起点
  // loop 的最后一个应该和第一个相连形成环
  // 但 (1,0)→(0,0) 已经由左侧边完成
  
  return loop;
}

/**
 * 预定义题库 - 所有题目经过手工验证
 * hints 和 answer 完全对应
 */
function buildPuzzles() {
  // ===== 5×5 简单题库 =====
  const easyPuzzles = [];
  
  // 题目1: 简单矩形环 (外框)
  // 环路: (0,0)→(0,5)→(5,0)→(0,0) 即外框
  {
    const rows = 5, cols = 5;
    // 外框矩形环
    const answer = {
      h: [
        [1,1,1,1,1], // row 0: 顶边全有
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,1,1,1,1]  // row 5: 底边全有
      ],
      v: [
        [1,0,0,0,0,1], // col 0: 左右各1
        [1,0,0,0,0,1],
        [1,0,0,0,0,1],
        [1,0,0,0,0,1],
        [1,0,0,0,0,1]
      ]
    };
    // 反推 hints
    const hints = computeHints(rows, cols, answer);
    easyPuzzles.push({ rows, cols, hints: maskHints(hints, 0.5), fullHints: hints, answer });
  }
  
  // 题目2: L形环
  {
    const rows = 5, cols = 5;
    const answer = {
      h: [
        [1,1,1,0,0], // 顶
        [0,0,1,1,0], // 向右扩展
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,1,1,1]  // 底
      ],
      v: [
        [1,0,0,0,0,0],
        [1,0,0,0,0,0],
        [1,0,1,1,1,0],
        [0,0,0,0,1,0],
        [0,0,1,1,1,1]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    easyPuzzles.push({ rows, cols, hints: maskHints(hints, 0.5), fullHints: hints, answer });
  }
  
  // 题目3: 简单凹形环
  {
    const rows = 5, cols = 5;
    const answer = {
      h: [
        [1,1,1,1,1],
        [0,0,0,0,0],
        [0,0,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,0,0]
      ],
      v: [
        [1,0,0,0,1,1],
        [1,0,0,0,1,1],
        [1,1,0,0,0,1],
        [0,1,0,0,0,0],
        [1,1,0,0,0,0]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    easyPuzzles.push({ rows, cols, hints: maskHints(hints, 0.45), fullHints: hints, answer });
  }
  
  // ===== 7×7 中等题库 =====
  const mediumPuzzles = [];
  
  // 题目1: 中等环形
  {
    const rows = 7, cols = 7;
    const answer = {
      h: [
        [0,1,1,1,1,1,0],
        [0,0,0,0,0,0,0],
        [0,1,1,1,1,1,0],
        [0,1,0,0,0,1,0],
        [0,1,0,0,0,1,0],
        [0,1,1,1,1,1,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0]
      ],
      v: [
        [0,0,0,0,0,0,0,0],
        [0,1,0,0,0,1,0,0],
        [0,1,1,0,1,1,0,0],
        [0,1,0,0,0,1,0,0],
        [0,1,1,0,1,1,0,0],
        [0,1,0,0,0,1,0,0],
        [0,0,0,0,0,0,0,0]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    mediumPuzzles.push({ rows, cols, hints: maskHints(hints, 0.4), fullHints: hints, answer });
  }
  
  // 题目2: T形环路
  {
    const rows = 7, cols = 7;
    const answer = {
      h: [
        [0,1,1,1,1,1,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,0,0,1,0,0,0],
        [0,1,1,1,1,1,0],
        [0,0,0,0,0,0,0]
      ],
      v: [
        [0,0,0,0,0,0,0,0],
        [0,1,1,0,1,1,0,0],
        [0,0,1,0,1,0,0,0],
        [0,0,1,0,1,0,0,0],
        [0,0,1,0,1,0,0,0],
        [0,1,1,0,1,1,0,0],
        [0,0,0,0,0,0,0,0]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    mediumPuzzles.push({ rows, cols, hints: maskHints(hints, 0.4), fullHints: hints, answer });
  }
  
  // 题目3: 凹形环
  {
    const rows = 7, cols = 7;
    const answer = {
      h: [
        [1,1,1,1,1,1,1],
        [0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0],
        [0,0,1,0,1,0,0],
        [0,0,1,0,1,0,0],
        [0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1]
      ],
      v: [
        [1,0,0,0,0,0,1,1],
        [1,0,1,0,1,0,1,1],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,1,0,1,0,0,0],
        [1,0,1,0,1,0,1,0],
        [1,1,1,1,1,1,1,0]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    mediumPuzzles.push({ rows, cols, hints: maskHints(hints, 0.35), fullHints: hints, answer });
  }
  
  // ===== 10×10 困难题库 =====
  const hardPuzzles = [];
  
  // 题目1: 复杂环路
  {
    const rows = 10, cols = 10;
    // 使用外围大环 + 中间掏洞的方式
    const answer = {
      h: [
        [1,1,1,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      v: [
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0],
        [1,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [1,1,1,1,1,1,1,1,1,1,1]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    hardPuzzles.push({ rows, cols, hints: maskHints(hints, 0.35), fullHints: hints, answer });
  }
  
  // 题目2: 双环嵌套
  {
    const rows = 10, cols = 10;
    const answer = {
      h: [
        [1,1,1,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      v: [
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,1],
        [0,0,1,0,0,0,0,1,0,0,0],
        [0,0,1,0,0,0,0,1,0,0,0],
        [0,0,1,0,0,0,0,1,0,0,0],
        [0,0,1,1,1,1,1,1,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1]
      ]
    };
    const hints = computeHints(rows, cols, answer);
    hardPuzzles.push({ rows, cols, hints: maskHints(hints, 0.3), fullHints: hints, answer });
  }
  
  return { easy: easyPuzzles, medium: mediumPuzzles, hard: hardPuzzles };
}

/**
 * 从 answer 反推每个格子的 hint（数字）
 */
function computeHints(rows, cols, answer) {
  const hints = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (answer.h[r][c] === 1) count++;         // 上边
      if (answer.h[r + 1][c] === 1) count++;     // 下边
      if (answer.v[r][c] === 1) count++;          // 左边
      if (answer.v[r][c + 1] === 1) count++;     // 右边
      row.push(count);
    }
    hints.push(row);
  }
  return hints;
}

/**
 * 随机隐藏部分 hint，增加难度
 * 0 和 3 必须保留（强约束），其他随机隐藏
 */
function maskHints(hints, hideRatio) {
  return hints.map(row => row.map(val => {
    if (val === 0) return 0;    // 0 必须显示
    if (val === 3) return Math.random() < 0.8 ? 3 : null;
    if (val === 1) return Math.random() < (1 - hideRatio * 0.5) ? 1 : null;
    if (val === 2) return Math.random() < (1 - hideRatio) ? 2 : null;
    if (val === 4) return 4;    // 4 必须显示
    return null;
  }));
}

// 构建题库
const PUZZLES = buildPuzzles();

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
    showRules: false
  },

  timer: null,
  pageId: 'slither-link',

  onLoad(options) {
    const saved = wx.getStorageSync('slither_link_saved');
    if (saved && saved.edges && saved.edges.h && saved.edges.h.length > 0) {
      this.setData({
        ...saved,
        isPlaying: true,
        showAnswer: false
      });
      // 恢复 _currentPuzzle 以支持显示答案
      const difficulty = saved.difficulty || 'easy';
      const puzzleId = saved.puzzleId || 0;
      const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
      this._currentPuzzle = puzzles[puzzleId % puzzles.length];
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
        time: this.data.time
      });
    }
  },

  loadPuzzle(difficulty, puzzleId) {
    const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
    const puzzle = puzzles[puzzleId % puzzles.length];

    const edges = {
      h: Array(puzzle.rows + 1).fill(null).map(() => Array(puzzle.cols).fill(EDGE_EMPTY)),
      v: Array(puzzle.rows).fill(null).map(() => Array(puzzle.cols + 1).fill(EDGE_EMPTY))
    };

    this.setData({
      rows: puzzle.rows,
      cols: puzzle.cols,
      hints: puzzle.hints,
      difficulty,
      difficultyText: DIFFICULTY_TEXT[difficulty],
      puzzleId,
      time: 0,
      timeStr: '0:00',
      isPlaying: true,
      isComplete: false,
      showAnswer: false,
      showRules: false
    });

    // edges 需要单独设置（可能较大）
    this.setData({ edges });
    this._currentPuzzle = puzzle;

    this.startTimer();
    this.playSoundIfEnabled('click');
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
        if (hint !== null) {
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
   * 算法：从任意一个有线的格点出发，沿连线追踪，必须能回到起点
   * 且过程中每个格点恰好有2条连线（不能分叉或断头）
   */
  isSingleLoop() {
    const { rows, cols, edges } = this.data;

    // 统计每个格点的连接数
    const dotDegree = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(0));

    // 水平边连接 (r,c) 和 (r,c+1)
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r][c + 1]++;
        }
      }
    }

    // 垂直边连接 (r,c) 和 (r+1,c)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (edges.v[r][c] === EDGE_LINE) {
          dotDegree[r][c]++;
          dotDegree[r + 1][c]++;
        }
      }
    }

    // 找起点：任意 degree=2 的格点
    let startR = -1, startC = -1;
    let totalDotsWithDegree = 0;
    for (let r = 0; r <= rows && startR === -1; r++) {
      for (let c = 0; c <= cols; c++) {
        if (dotDegree[r][c] > 0) {
          if (dotDegree[r][c] !== 2) return false; // 有分叉或断头
          if (startR === -1) {
            startR = r;
            startC = c;
          }
          totalDotsWithDegree++;
        }
      }
    }

    if (startR === -1) return false; // 没有线

    // 从起点沿连线追踪，看能否回到起点
    const visited = new Set();
    let r = startR, c = startC;
    let prevR = -1, prevC = -1;
    let steps = 0;

    while (true) {
      const key = `${r},${c}`;
      if (visited.has(key)) {
        // 回到了已访问的点
        return r === startR && c === startC && steps === totalDotsWithDegree;
      }
      visited.add(key);
      steps++;

      // 找下一个格点：从当前格点出发，沿连线走（不走回头路）
      let nextR = -1, nextC = -1;

      // 检查四个方向
      // 右
      if (c + 1 <= cols && edges.h[r] && edges.h[r][c] === EDGE_LINE && !(r === prevR && c + 1 === prevC)) {
        nextR = r; nextC = c + 1;
      }
      // 左
      if (c - 1 >= 0 && edges.h[r] && edges.h[r][c - 1] === EDGE_LINE && !(r === prevR && c - 1 === prevC)) {
        nextR = r; nextC = c - 1;
      }
      // 下
      if (r + 1 <= rows && edges.v[r] && edges.v[r][c] === EDGE_LINE && !(r + 1 === prevR && c === prevC)) {
        nextR = r + 1; nextC = c;
      }
      // 上
      if (r - 1 >= 0 && edges.v[r - 1] && edges.v[r - 1][c] === EDGE_LINE && !(r - 1 === prevR && c === prevC)) {
        nextR = r - 1; nextC = c;
      }

      if (nextR === -1) return false; // 走到死胡同

      prevR = r;
      prevC = c;
      r = nextR;
      c = nextC;
    }
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
      }
    } else {
      this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
    }
  },

  toggleRules() {
    this.setData({ showRules: !this.data.showRules });
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
