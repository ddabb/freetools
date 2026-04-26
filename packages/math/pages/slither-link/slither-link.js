/**
 * 数回 (Slither Link / Loop the Loop) 游戏
 * 规则：在格点之间画线，形成一个闭合环路
 * 格子内的数字表示该格子四周的线段数
 */

const utils = require('../../../../utils/index');
const { playSound, preloadSounds, isPageSoundEnabled } = utils;

// 题库数据 - 格式：[rows, cols, hints(二维数组，null表示无提示)]
const PUZZLES = {
  easy: [
    // 5x5 简单
    {
      rows: 5, cols: 5,
      hints: [
        [null, 2, null, 2, null],
        [3, null, null, null, 3],
        [null, null, 0, null, null],
        [2, null, null, null, 2],
        [null, 3, null, 3, null]
      ]
    },
    {
      rows: 5, cols: 5,
      hints: [
        [2, null, null, null, 2],
        [null, 3, null, 3, null],
        [null, null, null, null, null],
        [null, 2, null, 2, null],
        [2, null, null, null, 2]
      ]
    },
    {
      rows: 5, cols: 5,
      hints: [
        [null, null, 2, null, null],
        [null, 2, null, 2, null],
        [2, null, null, null, 2],
        [null, 2, null, 2, null],
        [null, null, 2, null, null]
      ]
    }
  ],
  medium: [
    // 7x7 中等
    {
      rows: 7, cols: 7,
      hints: [
        [null, 2, null, null, null, 2, null],
        [3, null, null, 2, null, null, 3],
        [null, null, 0, null, 0, null, null],
        [null, 2, null, null, null, 2, null],
        [null, null, 0, null, 0, null, null],
        [3, null, null, 2, null, null, 3],
        [null, 2, null, null, null, 2, null]
      ]
    },
    {
      rows: 7, cols: 7,
      hints: [
        [2, null, null, null, null, null, 2],
        [null, 3, null, null, null, 3, null],
        [null, null, 2, null, 2, null, null],
        [null, null, null, null, null, null, null],
        [null, null, 2, null, 2, null, null],
        [null, 3, null, null, null, 3, null],
        [2, null, null, null, null, null, 2]
      ]
    }
  ],
  hard: [
    // 10x10 困难
    {
      rows: 10, cols: 10,
      hints: [
        [null, 2, null, null, 3, null, null, 2, null, null],
        [3, null, null, 2, null, null, 2, null, null, 3],
        [null, null, 0, null, null, null, null, 0, null, null],
        [null, 2, null, null, null, 2, null, null, 2, null],
        [2, null, null, null, 1, null, null, null, null, 2],
        [2, null, null, null, 1, null, null, null, null, 2],
        [null, 2, null, null, null, 2, null, null, 2, null],
        [null, null, 0, null, null, null, null, 0, null, null],
        [3, null, null, 2, null, null, 2, null, null, 3],
        [null, 2, null, null, 3, null, null, 2, null, null]
      ]
    }
  ]
};

// 边的状态
const EDGE_EMPTY = 0;   // 无线
const EDGE_LINE = 1;    // 有线
const EDGE_CROSS = 2;   // 标记不可画线

Page({
  data: {
    rows: 5,
    cols: 5,
    hints: [],          // 数字提示
    edges: { h: [], v: [] },  // 边的状态 {h: 水平边, v: 垂直边}
    difficulty: 'easy',
    puzzleId: 0,
    time: 0,
    isPlaying: false,
    isComplete: false,
    cellSize: 50,       // 格子大小
    gridOffset: 30,     // 格点偏移（用于点击判定）
    showAnswer: false   // 显示答案
  },

  timer: null,
  pageId: 'slither-link',

  onLoad(options) {
    // 恢复进度
    const saved = wx.getStorageSync('slither_link_saved');
    if (saved && saved.edges) {
      this.setData({
        ...saved,
        isPlaying: true
      });
      this.startTimer();
    } else {
      const difficulty = options.difficulty || 'easy';
      this.loadPuzzle(difficulty, 0);
    }

    // 预加载音效
    preloadSounds(['click', 'win'], this.pageId);
  },

  onUnload() {
    this.stopTimer();
    // 保存进度
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

  // 加载题目
  loadPuzzle(difficulty, puzzleId) {
    const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
    const puzzle = puzzles[puzzleId % puzzles.length];

    // 初始化边状态
    // 水平边: (rows+1) 行 × cols 列
    // 垂直边: rows 行 × (cols+1) 列
    const edges = {
      h: Array(puzzle.rows + 1).fill(null).map(() => Array(puzzle.cols).fill(EDGE_EMPTY)),
      v: Array(puzzle.rows).fill(null).map(() => Array(puzzle.cols + 1).fill(EDGE_EMPTY))
    };

    this.setData({
      rows: puzzle.rows,
      cols: puzzle.cols,
      hints: puzzle.hints,
      edges,
      difficulty,
      puzzleId,
      time: 0,
      isPlaying: true,
      isComplete: false
    });

    this.startTimer();
    this.playSoundIfEnabled('click');
  },

  // 开始计时
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

  // 点击边
  onEdgeTap(e) {
    if (this.data.isComplete) return;

    const { type, row, col } = e.currentTarget.dataset;
    const edges = JSON.parse(JSON.stringify(this.data.edges));

    // 循环切换状态：空 → 线 → 叉 → 空
    const current = edges[type][row][col];
    edges[type][row][col] = (current + 1) % 3;

    this.setData({ edges });
    this.playSoundIfEnabled('click');

    // 检查是否完成
    this.checkCompletion();
  },

  // 检查是否完成
  checkCompletion() {
    const { rows, cols, hints, edges } = this.data;

    // 1. 检查每个格子的数字约束
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hint = hints[r][c];
        if (hint !== null) {
          // 计算四周线段数
          const top = edges.h[r][c];
          const bottom = edges.h[r + 1][c];
          const left = edges.v[r][c];
          const right = edges.v[r][c + 1];

          const count = (top === EDGE_LINE ? 1 : 0) +
                        (bottom === EDGE_LINE ? 1 : 0) +
                        (left === EDGE_LINE ? 1 : 0) +
                        (right === EDGE_LINE ? 1 : 0);

          if (count !== hint) return false;
        }
      }
    }

    // 2. 检查是否形成单一闭合环路
    if (!this.isSingleLoop()) return false;

    // 完成！
    this.setData({ isComplete: true });
    this.stopTimer();
    this.playSoundIfEnabled('win');

    // 清除保存的进度
    wx.removeStorageSync('slither_link_saved');

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

  // 检查是否形成单一闭合环路
  isSingleLoop() {
    const { rows, cols, edges } = this.data;

    // 找到所有有线的边，构建图
    // 顶点: (rows+1) × (cols+1) 个格点
    const visited = Array(rows + 1).fill(null).map(() => Array(cols + 1).fill(false));

    // 找起点：任意一个连接了线的格点
    let startR = -1, startC = -1;
    for (let r = 0; r <= rows && startR === -1; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r][c] === EDGE_LINE) {
          startR = r;
          startC = c;
          break;
        }
      }
    }

    if (startR === -1) return false; // 没有线

    // BFS/DFS 沿着线走
    const stack = [[startR, startC, null]]; // [row, col, fromDirection]
    visited[startR][startC] = true;
    let lineCount = 0;

    while (stack.length > 0) {
      const [r, c, fromDir] = stack.pop();

      // 检查四个方向的边
      const directions = [
        ['h', r, c, 'down'],      // 向右的水平边，到达 (r, c+1)
        ['h', r, c - 1, 'up'],    // 向左的水平边，到达 (r, c-1)
        ['v', r, c, 'right'],     // 向下的垂直边，到达 (r+1, c)
        ['v', r - 1, c, 'left']   // 向上的垂直边，到达 (r-1, c)
      ];

      for (const [type, edgeR, edgeC, dir] of directions) {
        // 跳过来时的方向
        if (fromDir && this.isOppositeDir(fromDir, dir)) continue;

        // 检查边是否有效且有线
        if (type === 'h') {
          if (edgeR < 0 || edgeR > rows || edgeC < 0 || edgeC >= cols) continue;
          if (edges.h[edgeR][edgeC] !== EDGE_LINE) continue;
        } else {
          if (edgeR < 0 || edgeR >= rows || edgeC < 0 || edgeC > cols) continue;
          if (edges.v[edgeR][edgeC] !== EDGE_LINE) continue;
        }

        lineCount++;

        // 计算到达的格点
        let nextR = r, nextC = c;
        if (dir === 'down') nextC++;
        else if (dir === 'up') nextC--;
        else if (dir === 'right') nextR++;
        else if (dir === 'left') nextR--;

        if (nextR < 0 || nextR > rows || nextC < 0 || nextC > cols) continue;

        if (!visited[nextR][nextC]) {
          visited[nextR][nextC] = true;
          stack.push([nextR, nextC, dir]);
        }
      }
    }

    // 检查：所有有线的边都被访问了，且形成环（回到起点）
    // 简化检查：统计所有有线的边数，确保都被访问
    let totalLines = 0;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (edges.h[r][c] === EDGE_LINE) totalLines++;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (edges.v[r][c] === EDGE_LINE) totalLines++;
      }
    }

    // 每条边被访问两次（来回），所以 lineCount 应该是 totalLines * 2
    // 但由于我们跳过了来时方向，实际应该是 totalLines
    return lineCount === totalLines && totalLines > 0;
  },

  isOppositeDir(d1, d2) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    return opposites[d1] === d2;
  },

  // 切换难度
  onDifficultyChange(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty !== this.data.difficulty) {
      this.loadPuzzle(difficulty, 0);
    }
  },

  // 下一题
  nextPuzzle() {
    const puzzles = PUZZLES[this.data.difficulty] || PUZZLES.easy;
    const nextId = (this.data.puzzleId + 1) % puzzles.length;
    this.loadPuzzle(this.data.difficulty, nextId);
  },

  // 重置
  onReset() {
    this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
  },

  // 显示/隐藏答案
  onShowAnswer() {
    const showAnswer = !this.data.showAnswer;
    if (showAnswer) {
      // 显示答案：填充所有边为线
      const { rows, cols } = this.data;
      const edges = {
        h: Array(rows + 1).fill(null).map(() => Array(cols).fill(EDGE_LINE)),
        v: Array(rows).fill(null).map(() => Array(cols + 1).fill(EDGE_LINE))
      };
      this.setData({ showAnswer, edges });
    } else {
      // 隐藏答案：重新加载题目
      this.loadPuzzle(this.data.difficulty, this.data.puzzleId);
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  // 音效
  playSoundIfEnabled(name) {
    if (isPageSoundEnabled(this.pageId)) {
      playSound(name, { pageId: this.pageId });
    }
  }
});
