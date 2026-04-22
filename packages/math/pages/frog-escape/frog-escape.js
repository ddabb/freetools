// 躲避牛蛙 (Frog Escape) - 扫雷换皮
// 雷→🐸牛蛙（要躲避�?| 数字→周围牛蛙数 | 安全→💧水�?/ 数字提示
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/minesweeper';
const RECORDS_KEY = 'frog_escape_records';

Page({
  data: {
    board: [],        // 格子状�? {revealed, flagged, value, isFrog, nearby}
    rows: 9,
    cols: 9,
    totalMines: 10,
    revealedCount: 0,
    flaggedCount: 0,
    flagMode: false,
    gameOver: false,
    won: false,
    difficulty: 'easy',
    difficultyText: '简�?9×9 · 10只牛�?,
    difficultyList: [
      { key: 'easy', label: '简�?9×9 · 10�?, rows: 9, cols: 9, mines: 10 },
      { key: 'medium', label: '中等 16×16 · 40�?, rows: 16, cols: 16, mines: 40 },
      { key: 'hard', label: '困难 16×16 · 99�?, rows: 16, cols: 16, mines: 99 },
    ],
    cellSize: 36,
    boardWidth: 324,
    puzzleId: null,
    time: 0,
    timerInterval: null,
    bestTime: null,
    showResult: false,
    resultIcon: '',
    resultText: '',
    showHelp: false,
  },

  onLoad() {
    this.loadRecord();
    this.startGame();
  },

  onUnload() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
  },

  onShow() {
    if (this.data.showResult) {
      this.setData({ showResult: false });
    }
  },

  startGame(diff) {
    const d = diff || this.data.difficulty;
    const diffInfo = this.data.difficultyList.find(x => x.key === d) || this.data.difficultyList[0];
    const { rows, cols, mines } = diffInfo;

    this._currentPuzzle = null;
    this._puzzleData = null;

    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const maxBoardWidth = screenWidth - 32;
    const cellSize = Math.min(Math.floor(maxBoardWidth / cols), 52);
    const boardWidth = cellSize * cols;

    this.setData({
      board: [],
      rows, cols, totalMines: mines,
      difficulty: d,
      difficultyText: diffInfo.label,
      revealedCount: 0,
      flaggedCount: 0,
      flagMode: false,
      gameOver: false,
      won: false,
      time: 0,
      puzzleId: null,
      showResult: false,
      cellSize, boardWidth,
    });

    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.data.timerInterval = null;
    }

    this.loadPuzzle(d);
  },

  loadPuzzle(difficulty) {
    const totalEasy = 1000;
    const totalMedium = 1000;
    const totalHard = 1000;
    const totals = { easy: totalEasy, medium: totalMedium, hard: totalHard };
    const fileMap = {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    };
    const maxIdx = totals[difficulty];
    const idx = Math.floor(Math.random() * maxIdx) + 1;
    const suffix = String(idx).padStart(4, '0');
    const url = `${CDN_BASE}/${fileMap[difficulty]}-${suffix}.json`;

    wx.showLoading({ title: '加载中�? });
    const self = this;
    wx.request({
      url,
      success(res) {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data) {
          self._puzzleData = res.data;
          self.initBoard(res.data);
        } else {
          self.initBoard(null);
        }
      },
      fail() {
        wx.hideLoading();
        self.initBoard(null);
      }
    });
  },

  initBoard(puzzle) {
    const { rows, cols, totalMines } = this.data;
    let boardData, puzzleId;

    if (puzzle && puzzle.board && puzzle.numbers) {
      puzzleId = puzzle.id;
      boardData = this.buildBoardFromPuzzle(puzzle);
    } else {
      boardData = this.generateBoard(rows, cols, totalMines);
    }

    this._firstClick = true;
    this._boardData = boardData;

    const board = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({ revealed: false, flagged: false, value: null, nearby: 0, isFrog: false });
      }
      board.push(row);
    }

    this.setData({ board, puzzleId, revealedCount: 0, flaggedCount: 0 });
  },

  buildBoardFromPuzzle(puzzle) {
    const rows = puzzle.rows;
    const cols = puzzle.cols;
    const board = puzzle.board;
    const numbers = puzzle.numbers;

    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const isFrog = board[r][c];
        const nearby = isFrog ? -1 : numbers[r][c];
        row.push({ isFrog, nearby });
      }
      data.push(row);
    }
    return data;
  },

  generateBoard(rows, cols, mines) {
    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({ isFrog: false, nearby: 0 });
      }
      data.push(row);
    }
    // 随机布雷
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!data[r][c].isFrog) {
        data[r][c].isFrog = true;
        placed++;
      }
    }
    // 计算提示�?    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!data[r][c].isFrog) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && data[nr][nc].isFrog) {
                count++;
              }
            }
          }
          data[r][c].nearby = count;
        }
      }
    }
    return data;
  },

  onCellTap(e) {
    if (this.data.gameOver || this.data.showResult) return;
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.board[row][col];

    // 标记模式下：点击未翻开格子切换标记
    if (this.data.flagMode) {
      if (!cell.revealed) this.toggleFlag(row, col);
      return;
    }

    // 双击（chord）：点击已揭开的数字格，周围标记数=该数字时自动翻开周围未标记格�?    if (cell.revealed && cell.nearby > 0) {
      this.chord(row, col);
      return;
    }

    // 已翻开或已标记的格子，忽略
    if (cell.revealed || cell.flagged) return;

    if (this._firstClick) {
      this._firstClick = false;
      this.startTimer();
    }

    if (this._boardData[row][col].isFrog) {
      this.revealCell(row, col);
      this.gameOver(false);
      return;
    }

    this.floodFill(row, col);
    this.checkWin();
  },

  // 双击自动翻开（chord�?  chord(row, col) {
    const { rows, cols } = this.data;
    const cell = this.data.board[row][col];
    if (!cell.revealed || cell.nearby === 0) return;

    // 数周围标记格�?    let flaggedCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (this.data.board[nr][nc].flagged) flaggedCount++;
        }
      }
    }

    // 周围标记�?!= 该数字，不触�?    if (flaggedCount !== cell.nearby) return;

    // 翻开所有未标记、未翻开的格�?    let exploded = false;
    let revealed = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const neighbor = this.data.board[nr][nc];
        if (neighbor.revealed || neighbor.flagged) continue;

        if (this._boardData[nr][nc].isFrog) {
          // 踩到牛蛙，游戏结�?          this.data.board[nr][nc].revealed = true;
          this.data.board[nr][nc].isFrog = true;
          this.data.board[nr][nc].nearby = -1;
          revealed++;
          exploded = true;
        } else {
          this.data.board[nr][nc].revealed = true;
          this.data.board[nr][nc].nearby = this._boardData[nr][nc].nearby;
          this.data.board[nr][nc].isFrog = false;
          revealed++;
        }
      }
    }

    this.setData({ board: this.data.board, revealedCount: this.data.revealedCount + revealed });

    if (exploded) {
      this.gameOver(false);
    } else {
      this.checkWin();
    }
  },

  onCellLongPress(e) {
    if (this.data.gameOver || this.data.showResult) return;
    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.board[row][col];
    if (cell.revealed) return;
    this.toggleFlag(row, col);
  },

  toggleFlag(row, col) {
    const board = this.data.board;
    const cell = board[row][col];
    if (cell.flagged) {
      board[row][col].flagged = false;
      this.setData({ board, flaggedCount: this.data.flaggedCount - 1 });
    } else {
      board[row][col].flagged = true;
      this.setData({ board, flaggedCount: this.data.flaggedCount + 1 });
    }
  },

  revealCell(row, col) {
    const board = this.data.board;
    const pd = this._boardData[row][col];
    board[row][col].revealed = true;
    board[row][col].nearby = pd.nearby;
    board[row][col].isFrog = pd.isFrog;
    this.setData({ board, revealedCount: this.data.revealedCount + 1 });
  },

  floodFill(row, col) {
    const { rows, cols } = this.data;
    const stack = [[row, col]];
    const visited = new Set();
    visited.add(`${row},${col}`);
    let revealed = 0;

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      const cell = this.data.board[r][c];
      if (cell.revealed) continue;

      const pd = this._boardData[r][c];
      this.data.board[r][c].revealed = true;
      this.data.board[r][c].nearby = pd.nearby;
      this.data.board[r][c].isFrog = pd.isFrog;
      revealed++;

      if (pd.nearby === 0 && !pd.isFrog) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            const key = `${nr},${nc}`;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key)) {
              visited.add(key);
              if (!this._boardData[nr][nc].isFrog) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    this.setData({ board: this.data.board, revealedCount: this.data.revealedCount + revealed });
  },

  gameOver(won) {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.data.timerInterval = null;
    }

    const board = this.data.board;
    for (let r = 0; r < this.data.rows; r++) {
      for (let c = 0; c < this.data.cols; c++) {
        if (this._boardData[r][c].isFrog) {
          board[r][c].revealed = true;
          board[r][c].isFrog = true;
          board[r][c].nearby = -1;
        }
      }
    }

    this.setData({ board, gameOver: true, won, showResult: true,
      resultIcon: won ? '🏆' : '🐸',
      resultText: won ? '成功逃脱�? : '踩到牛蛙了！' });

    if (won) {
      this.saveRecord(this.data.time);
    }
  },

  checkWin() {
    const { rows, cols, totalMines, revealedCount } = this.data;
    const safeCells = rows * cols - totalMines;
    if (revealedCount === safeCells) {
      this.gameOver(true);
    }
  },

  startTimer() {
    const self = this;
    const interval = setInterval(() => {
      self.setData({ time: self.data.time + 1 });
    }, 1000);
    this.data.timerInterval = interval;
  },

  formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  },

  switchFlagMode() {
    this.setData({ flagMode: !this.data.flagMode });
  },

  changeDifficulty() {
    const list = this.data.difficultyList;
    const cur = this.data.difficulty;
    const idx = list.findIndex(x => x.key === cur);
    const next = list[(idx + 1) % list.length];
    this.startGame(next.key);
  },

  loadRecord() {
    try {
      const r = JSON.parse(wx.getStorageSync(RECORDS_KEY) || '{}');
      this.setData({ bestTime: r[this.data.difficulty] || null });
    } catch (e) {}
  },

  saveRecord(time) {
    try {
      const r = JSON.parse(wx.getStorageSync(RECORDS_KEY) || '{}');
      const key = this.data.difficulty;
      if (!r[key] || time < r[key]) {
        r[key] = time;
        wx.setStorageSync(RECORDS_KEY, JSON.stringify(r));
        this.setData({ bestTime: time });
        wx.showToast({ title: '新纪录！', icon: 'none' });
      }
    } catch (e) {}
  },

  toggleHelp() {
    this.setData({ showHelp: !this.data.showHelp });
  },

  getCellDisplay(cell) {
    if (!cell.revealed) {
      if (cell.flagged) return '🚩';
      return '';
    }
    if (cell.isFrog) return '🐸';
    if (cell.nearby === 0) return '💧';
    const colors = ['💧', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    return colors[cell.nearby] || cell.nearby;
  },
});
