// 数组迷宫 - 数织(Nonogram)游戏
// 根据行列数字提示，填充正确格子

const PUZZLES = {
  easy: [
    { size: 5, answer: [
      [1,0,1,0,1],
      [0,1,1,1,0],
      [1,1,0,1,1],
      [0,1,1,1,0],
      [1,0,1,0,1]
    ]},
    { size: 5, answer: [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1]
    ]},
    { size: 5, answer: [
      [0,1,1,1,0],
      [1,1,0,1,1],
      [1,0,0,0,1],
      [1,1,0,1,1],
      [0,1,1,1,0]
    ]},
    { size: 5, answer: [
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1]
    ]},
    { size: 5, answer: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,0,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0]
    ]}
  ],
  medium: [
    { size: 8, answer: [
      [0,1,1,0,0,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,0,0,1,1,0,0,1],
      [1,1,0,0,0,0,1,1],
      [0,1,1,0,0,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,0,0,1,1,0],
      [1,1,0,0,0,0,1,1]
    ]},
    { size: 8, answer: [
      [1,1,1,0,0,1,1,1],
      [1,0,1,0,0,1,0,1],
      [1,1,1,1,1,1,1,1],
      [0,1,0,1,1,0,1,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,0,1,0,0,1,0,1],
      [1,1,1,0,0,1,1,1]
    ]},
    { size: 8, answer: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,0,0,1,1,0],
      [1,1,0,0,0,0,1,1],
      [1,0,0,1,1,0,0,1],
      [1,0,0,1,1,0,0,1],
      [1,1,0,0,0,0,1,1],
      [0,1,1,0,0,1,1,0],
      [0,0,1,1,1,1,0,0]
    ]}
  ],
  hard: [
    { size: 10, answer: [
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,0,0,0,0,1,1,0],
      [1,1,0,0,1,1,0,0,1,1],
      [1,0,0,1,1,1,1,0,0,1],
      [1,0,1,1,0,0,1,1,0,1],
      [1,0,1,1,0,0,1,1,0,1],
      [1,0,0,1,1,1,1,0,0,1],
      [1,1,0,0,1,1,0,0,1,1],
      [0,1,1,0,0,0,0,1,1,0],
      [0,0,1,1,1,1,1,1,0,0]
    ]},
    { size: 10, answer: [
      [1,1,0,0,0,0,0,0,1,1],
      [1,1,1,0,0,0,0,1,1,1],
      [0,1,1,1,0,0,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,1,0,0,1,1,1,0],
      [1,1,1,0,0,0,0,1,1,1],
      [1,1,0,0,0,0,0,0,1,1]
    ]}
  ]
};

// 从答案计算行列提示
function calcHints(line) {
  const hints = [];
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === 1) {
      count++;
    } else if (count > 0) {
      hints.push(count);
      count = 0;
    }
  }
  if (count > 0) hints.push(count);
  return hints.length > 0 ? hints : [0];
}

Page({
  data: {
    difficulty: 'easy',
    currentLevel: 0,
    grid: [],
    rowHints: [],
    colHints: [],
    answer: [],
    history: [],
    showWin: false,
    timerRunning: false,
    timerDisplay: '0:00',
    _timer: null,
    _seconds: 0
  },

  onLoad() {
    this.loadLevel();
  },

  onUnload() {
    this.clearTimer();
  },

  setDifficulty(e) {
    const diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff, currentLevel: 0 });
    this.loadLevel();
  },

  loadLevel() {
    this.clearTimer();
    const puzzles = PUZZLES[this.data.difficulty];
    const level = puzzles[this.data.currentLevel % puzzles.length];
    const size = level.size;
    const answer = level.answer;

    // 计算行提示
    const rowHints = [];
    for (let r = 0; r < size; r++) {
      rowHints.push(calcHints(answer[r]));
    }

    // 计算列提示
    const colHints = [];
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(answer[r][c]);
      colHints.push(calcHints(col));
    }

    // 初始化空网格
    const grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push('empty');
      grid.push(row);
    }

    this.setData({
      grid, rowHints, colHints, answer,
      history: [], showWin: false,
      timerRunning: false, timerDisplay: '0:00', _seconds: 0
    });
  },

  onCellTap(e) {
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.grid[row][col];
    let newVal;

    if (cell === 'empty') {
      newVal = 'filled';
    } else if (cell === 'filled') {
      newVal = 'empty';
    } else if (cell === 'marked') {
      newVal = 'empty';
    } else {
      return;
    }

    this.applyChange(row, col, newVal);
  },

  onCellLongPress(e) {
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.grid[row][col];
    let newVal;

    if (cell === 'empty') {
      newVal = 'marked';
    } else if (cell === 'marked') {
      newVal = 'empty';
    } else if (cell === 'filled') {
      newVal = 'marked';
    } else {
      return;
    }

    this.applyChange(row, col, newVal);
  },

  applyChange(row, col, newVal) {
    // 开始计时
    if (!this.data.timerRunning) {
      this.startTimer();
    }

    const oldVal = this.data.grid[row][col];
    const history = [...this.data.history, { row, col, oldVal }];
    const grid = this.data.grid.map(r => [...r]);
    grid[row][col] = newVal;

    this.setData({ grid, history });

    // 检查是否完成
    if (this.checkWin()) {
      this.onWin();
    }
  },

  checkWin() {
    const { grid, answer } = this.data;
    for (let r = 0; r < answer.length; r++) {
      for (let c = 0; c < answer[r].length; c++) {
        const filled = grid[r][c] === 'filled';
        const shouldBe = answer[r][c] === 1;
        if (filled !== shouldBe) return false;
      }
    }
    return true;
  },

  onWin() {
    this.clearTimer();
    this.setData({ showWin: true });
  },

  closeWin() {
    this.setData({ showWin: false });
  },

  undo() {
    const history = [...this.data.history];
    if (history.length === 0) return;
    const last = history.pop();
    const grid = this.data.grid.map(r => [...r]);
    grid[last.row][last.col] = last.oldVal;
    this.setData({ grid, history });
  },

  reset() {
    this.loadLevel();
  },

  nextLevel() {
    const puzzles = PUZZLES[this.data.difficulty];
    const next = (this.data.currentLevel + 1) % puzzles.length;
    this.setData({ currentLevel: next });
    this.loadLevel();
  },

  startTimer() {
    this.setData({ timerRunning: true, _seconds: 0 });
    this._timer = setInterval(() => {
      const s = this.data._seconds + 1;
      const min = Math.floor(s / 60);
      const sec = s % 60;
      this.setData({ _seconds: s, timerDisplay: `${min}:${sec < 10 ? '0' : ''}${sec}` });
    }, 1000);
  },

  clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.setData({ timerRunning: false });
  }
});
