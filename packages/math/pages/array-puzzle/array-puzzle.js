// 数织游戏 (Nonogram)
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

// 生成随机数织谜题
function generateRandomPuzzle(size) {
  const targetFillRate = 0.3 + Math.random() * 0.2;
  const answer = [];
  
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      if (Math.random() < targetFillRate) {
        const leftFilled = c > 0 && row[c-1] === 1;
        const aboveFilled = r > 0 && answer[r-1][c] === 1;
        
        if (leftFilled && aboveFilled) {
          row.push(Math.random() < 0.3 ? 1 : 0);
        } else if (leftFilled) {
          row.push(Math.random() < 0.4 ? 1 : 0);
        } else if (aboveFilled) {
          row.push(Math.random() < 0.4 ? 1 : 0);
        } else {
          row.push(Math.random() < 0.3 ? 1 : 0);
        }
      } else {
        row.push(0);
      }
    }
    answer.push(row);
  }
  
  return { size, answer };
}

Page({
  data: {
    difficulty: 'easy',
    mode: 'fill',
    currentLevel: 0,
    grid: [],
    rowHints: [],
    colHints: [],
    answer: [],
    history: [],
    showWin: false,
    timerRunning: false,
    timerDisplay: '0:00',
    boardWidth: 320,
    cellSize: 40,
    filledCount: 0,
    totalFill: 0,
    isInfinite: false,
    _timer: null,
    _seconds: 0,
    _touchStartRow: -1,
    _touchStartCol: -1,
    _touchLastRow: -1,
    _touchLastCol: -1,
    _touchMode: null,
    _touchedCells: null,
    _boardRect: null,
    _isSliding: false
  },

  onLoad() {
    this.initGame();
  },

  onUnload() {
    this.clearTimer();
  },

  onReady() {
    this.calculateBoardSize();
  },

  calculateBoardSize() {
    const { difficulty } = this.data;
    const sizes = { easy: 5, medium: 8, hard: 10, infinite: 10 };
    const size = sizes[difficulty] || 5;
    
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const gap = 2;           // cell之间的间距
    const totalGaps = (size - 1) * gap;  // cell间gap总和
    const boardPadding = 8;  // board-wrapper的padding(4*2)
    const hintWidth = 72;    // 行提示宽度
    const maxBoardWidth = screenWidth - 24; // 左右各12px安全边距
    
    const availableForCells = maxBoardWidth - hintWidth - totalGaps - boardPadding;
    const cellSize = Math.floor(availableForCells / size);
    const boardWidth = cellSize * size + totalGaps + hintWidth + boardPadding;
    
    this.setData({ cellSize, boardWidth });
  },

  initGame() {
    this.calculateBoardSize();
    this.loadLevel();
  },

  setDifficulty(e) {
    const diff = e.currentTarget.dataset.diff;
    const isInfinite = diff === 'infinite';
    this.setData({ 
      difficulty: isInfinite ? 'infinite' : diff, 
      currentLevel: 0,
      isInfinite
    });
    this.calculateBoardSize();
    this.loadLevel();
  },

  setMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });
  },

  loadLevel() {
    this.clearTimer();
    const { difficulty, currentLevel, isInfinite } = this.data;
    let puzzle;
    
    if (isInfinite) {
      const levelSizes = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10];
      const size = levelSizes[Math.min(currentLevel, levelSizes.length - 1)];
      puzzle = generateRandomPuzzle(size);
    } else {
      const puzzles = PUZZLES[difficulty] || PUZZLES.easy;
      puzzle = puzzles[currentLevel % puzzles.length];
    }
    
    const size = puzzle.size;
    const answer = puzzle.answer;

    const rowHints = [];
    for (let r = 0; r < size; r++) {
      rowHints.push(calcHints(answer[r]));
    }

    const colHints = [];
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(answer[r][c]);
      colHints.push(calcHints(col));
    }

    let totalFill = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (answer[r][c] === 1) totalFill++;
      }
    }

    const grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) row.push('empty');
      grid.push(row);
    }

    this.setData({
      grid, rowHints, colHints, answer,
      history: [], showWin: false,
      timerRunning: false, timerDisplay: '0:00', _seconds: 0,
      filledCount: 0, totalFill,
      completedRows: [],
      completedCols: [],
      _touchedCells: new Set()
    });
  },

  // 获取棋盘区域位置信息
  getBoardRect() {
    return new Promise((resolve) => {
      const query = wx.createSelectorQuery();
      query.select('.touch-layer').boundingClientRect((rect) => {
        if (rect) {
          this.data._boardRect = rect;
          resolve(rect);
        } else {
          resolve(null);
        }
      }).exec();
    });
  },

  // 根据触摸坐标获取格子坐标
  getCellFromPoint(clientX, clientY) {
    const rect = this.data._boardRect;
    if (!rect) return null;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cellSize } = this.data;
    const hintWidth = 72;
    
    const col = Math.floor((x - hintWidth) / cellSize);
    const row = Math.floor(y / cellSize);
    
    const gridSize = this.data.grid.length;
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col };
    }
    return null;
  },

  // 棋盘触摸开始
  async onBoardTouchStart(e) {
    const touch = e.touches[0];
    const rect = await this.getBoardRect();
    if (!rect) return;
    
    const cell = this.getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) {
      this.data._touchStartRow = cell.row;
      this.data._touchStartCol = cell.col;
      this.data._touchLastRow = cell.row;
      this.data._touchLastCol = cell.col;
      this.data._touchMode = this.data.mode;
      this.data._touchedCells = new Set();
      this.data._isSliding = true;
      
      this.handleCellChange(cell.row, cell.col);
    }
  },

  // 棋盘触摸移动 - 滑动连续标记
  onBoardTouchMove(e) {
    if (!this.data._isSliding) return;
    
    const touch = e.touches[0];
    const cell = this.getCellFromPoint(touch.clientX, touch.clientY);
    
    if (cell) {
      const lastRow = this.data._touchLastRow;
      const lastCol = this.data._touchLastCol;
      
      if (cell.row !== lastRow || cell.col !== lastCol) {
        this.fillPath(lastRow, lastCol, cell.row, cell.col);
        this.data._touchLastRow = cell.row;
        this.data._touchLastCol = cell.col;
      }
    }
  },

  // 棋盘触摸结束
  onBoardTouchEnd(e) {
    this.data._isSliding = false;
    this.data._touchMode = null;
    this.data._touchedCells = new Set();
  },

  // 填充两点之间的路径
  fillPath(fromRow, fromCol, toRow, toCol) {
    if (fromRow === -1 || fromCol === -1) {
      this.handleCellChange(toRow, toCol);
      return;
    }
    
    const dr = Math.sign(toRow - fromRow);
    const dc = Math.sign(toCol - fromCol);
    
    let r = fromRow;
    let c = fromCol;
    
    while (r !== toRow || c !== toCol) {
      if (r !== toRow) r += dr;
      if (c !== toCol) c += dc;
      this.handleCellChange(r, c);
    }
  },

  // 处理格子状态变化
  handleCellChange(row, col) {
    const cellKey = `${row},${col}`;
    
    if (this.data._touchedCells.has(cellKey)) {
      return;
    }
    this.data._touchedCells.add(cellKey);
    
    const cell = this.data.grid[row][col];
    let newVal;
    const mode = this.data._touchMode || this.data.mode;
    
    if (mode === 'fill') {
      if (cell === 'empty') {
        newVal = 'filled';
      } else if (cell === 'filled') {
        newVal = 'empty';
      } else {
        return;
      }
    } else {
      if (cell === 'empty') {
        newVal = 'marked';
      } else if (cell === 'marked') {
        newVal = 'empty';
      } else {
        return;
      }
    }

    this.applyChange(row, col, newVal, false);
  },

  onCellTap(e) {
    if (this.data._isSliding) return;
    
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.grid[row][col];
    let newVal;

    if (this.data.mode === 'fill') {
      if (cell === 'empty') {
        newVal = 'filled';
      } else if (cell === 'filled') {
        newVal = 'empty';
      } else {
        return;
      }
    } else {
      if (cell === 'empty') {
        newVal = 'marked';
      } else if (cell === 'marked') {
        newVal = 'empty';
      } else {
        return;
      }
    }

    this.applyChange(row, col, newVal, true);
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

    this.applyChange(row, col, newVal, true);
  },

  // 检测已完成的行和列
  updateCompletedLines() {
    const { grid, answer } = this.data;
    const size = answer.length;
    const completedRows = [];
    const completedCols = [];

    // 检查每一行
    for (let r = 0; r < size; r++) {
      let rowDone = true;
      for (let c = 0; c < size; c++) {
        const filled = grid[r][c] === 'filled';
        const shouldBe = answer[r][c] === 1;
        if (filled !== shouldBe) { rowDone = false; break; }
      }
      if (rowDone) completedRows.push(r);
    }

    // 检查每一列
    for (let c = 0; c < size; c++) {
      let colDone = true;
      for (let r = 0; r < size; r++) {
        const filled = grid[r][c] === 'filled';
        const shouldBe = answer[r][c] === 1;
        if (filled !== shouldBe) { colDone = false; break; }
      }
      if (colDone) completedCols.push(c);
    }

    this.setData({ completedRows, completedCols });
  },

  // 自动填充：当一行/列的叉都标记了，剩余空格自动填充；反之亦然
  autoFillLines() {
    const { grid, answer, history } = this.data;
    const size = answer.length;
    const gridCopy = grid.map(r => [...r]);
    const newHistory = [...history];
    let changed = false;

    // 检查每一行
    for (let r = 0; r < size; r++) {
      // 该行所有应该为0的位置是否都已标记？
      let hasZeros = false;
      let allZerosMarked = true;
      let hasOnes = false;
      let allOnesFilled = true;
      for (let c = 0; c < size; c++) {
        if (answer[r][c] === 0) {
          hasZeros = true;
          if (gridCopy[r][c] !== 'marked') allZerosMarked = false;
        }
        if (answer[r][c] === 1) {
          hasOnes = true;
          if (gridCopy[r][c] !== 'filled') allOnesFilled = false;
        }
      }

      // 所有✕标对了→剩余空格自动填充（必须确实有需要标记的位置）
      if (hasZeros && allZerosMarked) {
        for (let c = 0; c < size; c++) {
          if (gridCopy[r][c] === 'empty') {
            newHistory.push({ row: r, col: c, oldVal: 'empty' });
            gridCopy[r][c] = 'filled';
            changed = true;
          }
        }
      }

      // 所有填充对了→剩余空格自动标✕（必须确实有需要填充的位置）
      if (hasOnes && allOnesFilled) {
        for (let c = 0; c < size; c++) {
          if (gridCopy[r][c] === 'empty') {
            newHistory.push({ row: r, col: c, oldVal: 'empty' });
            gridCopy[r][c] = 'marked';
            changed = true;
          }
        }
      }
    }

    // 检查每一列
    for (let c = 0; c < size; c++) {
      let hasZeros = false;
      let allZerosMarked = true;
      let hasOnes = false;
      let allOnesFilled = true;
      for (let r = 0; r < size; r++) {
        if (answer[r][c] === 0) {
          hasZeros = true;
          if (gridCopy[r][c] !== 'marked') allZerosMarked = false;
        }
        if (answer[r][c] === 1) {
          hasOnes = true;
          if (gridCopy[r][c] !== 'filled') allOnesFilled = false;
        }
      }

      if (hasZeros && allZerosMarked) {
        for (let r = 0; r < size; r++) {
          if (gridCopy[r][c] === 'empty') {
            newHistory.push({ row: r, col: c, oldVal: 'empty' });
            gridCopy[r][c] = 'filled';
            changed = true;
          }
        }
      }

      if (hasOnes && allOnesFilled) {
        for (let r = 0; r < size; r++) {
          if (gridCopy[r][c] === 'empty') {
            newHistory.push({ row: r, col: c, oldVal: 'empty' });
            gridCopy[r][c] = 'marked';
            changed = true;
          }
        }
      }
    }

    if (changed) {
      let filledCount = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (gridCopy[r][c] === 'filled') filledCount++;
        }
      }
      this.setData({ grid: gridCopy, history: newHistory, filledCount });
    }

    return changed;
  },

  applyChange(row, col, newVal, addToHistory = true) {
    if (!this.data.timerRunning && this.data.totalFill > 0) {
      this.startTimer();
    }

    const oldVal = this.data.grid[row][col];
    const history = addToHistory ? [...this.data.history, { row, col, oldVal }] : this.data.history;
    const grid = this.data.grid.map(r => [...r]);
    grid[row][col] = newVal;

    let filledCount = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'filled') filledCount++;
      }
    }

    this.setData({ grid, history, filledCount });

    // 自动填充：行列叉标满则剩余自动填充，支持级联
    const size = this.data.answer.length;
    let maxIter = size * 2;
    while (this.autoFillLines() && maxIter-- > 0) {}

    // 检测行/列完成状态
    this.updateCompletedLines();

    // 无论点击还是滑动，都检测通关
    if (!this.data.showWin && this.checkWin()) {
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

    let filledCount = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'filled') filledCount++;
      }
    }

    this.setData({ grid, history, filledCount });
  },

  reset() {
    this.loadLevel();
  },

  nextLevel() {
    this.setData({ currentLevel: this.data.currentLevel + 1 });
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
