// 黑白棋 (Othello / Reversi)
// 人机对战版本

// 位置权重表（角落最重要，边缘次之，靠近角落的位置最差）
const POSITION_WEIGHT = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100]
];

// 8个方向
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// 玩家颜色
const BLACK = 1;  // 黑棋（人类）
const WHITE = 2;  // 白棋（AI）

Page({
  data: {
    board: [],           // 8x8棋盘，0=空，1=黑，2=白
    currentPlayer: BLACK, // 当前玩家
    validMoves: [],       // 合法落子位置
    blackCount: 2,        // 黑棋数量
    whiteCount: 2,        // 白棋数量
    gameOver: false,      // 游戏是否结束
    winner: null,         // 胜者
    aiThinking: false,    // AI是否在思考
    difficulty: 'medium', // AI难度
    showResult: false,    // 显示结果弹窗
    message: '',          // 提示消息
    cellSize: 40,         // 格子大小
    boardWidth: 320,      // 棋盘宽度
    lastMove: null,       // 最后落子位置（高亮）
    flippedCells: []      // 翻转的格子（动画）
  },

  onLoad() {
    this.initGame();
  },

  onReady() {
    this.calculateBoardSize();
  },

  calculateBoardSize() {
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const maxBoardWidth = screenWidth - 32;
    const cellSize = Math.floor(maxBoardWidth / 8);
    const boardWidth = cellSize * 8;
    this.setData({ cellSize, boardWidth });
  },

  // 初始化游戏
  initGame() {
    // 创建空棋盘
    const board = [];
    for (let r = 0; r < 8; r++) {
      board.push([0, 0, 0, 0, 0, 0, 0, 0]);
    }

    // 开局中央4格：白黑白黑
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;

    const validMoves = this.getValidMoves(board, BLACK);

    this.setData({
      board,
      currentPlayer: BLACK,
      validMoves,
      blackCount: 2,
      whiteCount: 2,
      gameOver: false,
      winner: null,
      aiThinking: false,
      showResult: false,
      message: '黑棋先行',
      lastMove: null,
      flippedCells: []
    });
  },

  // 设置难度
  setDifficulty(e) {
    const diff = e.currentTarget.dataset.diff;
    this.setData({ difficulty: diff });
    this.initGame();
  },

  // 获取所有合法落子位置
  getValidMoves(board, player) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === 0 && this.canFlip(board, r, c, player)) {
          moves.push({ row: r, col: c });
        }
      }
    }
    return moves;
  },

  // 检查某位置是否可以翻转对方棋子
  canFlip(board, row, col, player) {
    const opponent = player === BLACK ? WHITE : BLACK;
    
    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      let foundOpponent = false;
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (board[r][c] === opponent) {
          foundOpponent = true;
        } else if (board[r][c] === player) {
          if (foundOpponent) return true;
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }
    return false;
  },

  // 获取某位置会翻转的格子
  getCellsToFlip(board, row, col, player) {
    const opponent = player === BLACK ? WHITE : BLACK;
    const cellsToFlip = [];
    
    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const line = [];
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (board[r][c] === opponent) {
          line.push({ row: r, col: c });
        } else if (board[r][c] === player) {
          cellsToFlip.push(...line);
          break;
        } else {
          break;
        }
        r += dr;
        c += dc;
      }
    }
    return cellsToFlip;
  },

  // 执行落子
  makeMove(board, row, col, player) {
    const newBoard = board.map(r => [...r]);
    const cellsToFlip = this.getCellsToFlip(board, row, col, player);
    
    newBoard[row][col] = player;
    for (const cell of cellsToFlip) {
      newBoard[cell.row][cell.col] = player;
    }
    
    return { newBoard, cellsToFlip };
  },

  // 计算棋子数量
  countPieces(board) {
    let black = 0, white = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === BLACK) black++;
        else if (board[r][c] === WHITE) white++;
      }
    }
    return { black, white };
  },

  // 检查游戏是否结束
  isGameOver(board) {
    const blackMoves = this.getValidMoves(board, BLACK);
    const whiteMoves = this.getValidMoves(board, WHITE);
    return blackMoves.length === 0 && whiteMoves.length === 0;
  },

  // 用户点击格子
  onCellTap(e) {
    if (this.data.gameOver || this.data.aiThinking) return;
    if (this.data.currentPlayer !== BLACK) return;

    const { row, col } = e.currentTarget.dataset;
    const { board, validMoves } = this.data;

    // 检查是否是合法位置
    const isValid = validMoves.some(m => m.row === row && m.col === col);
    if (!isValid) return;

    this.executeMove(row, col, BLACK);
  },

  // 执行落子（人类或AI）
  executeMove(row, col, player) {
    const { board } = this.data;
    const { newBoard, cellsToFlip } = this.makeMove(board, row, col, player);
    const counts = this.countPieces(newBoard);

    // 更新棋盘
    this.setData({
      board: newBoard,
      blackCount: counts.black,
      whiteCount: counts.white,
      lastMove: { row, col },
      flippedCells: cellsToFlip
    });

    // 短暂显示翻转动画后切换回合
    setTimeout(() => {
      this.switchTurn(newBoard);
    }, 300);
  },

  // 切换回合
  switchTurn(board) {
    const nextPlayer = this.data.currentPlayer === BLACK ? WHITE : BLACK;
    const nextMoves = this.getValidMoves(board, nextPlayer);

    // 检查游戏是否结束
    if (this.isGameOver(board)) {
      this.endGame(board);
      return;
    }

    // 下一个玩家无法落子，跳过
    if (nextMoves.length === 0) {
      const skipPlayer = nextPlayer === BLACK ? '黑棋' : '白棋';
      this.setData({
        message: `${skipPlayer}无法落子，跳过`,
        flippedCells: []
      });

      // 跳过后继续当前玩家
      const currentMoves = this.getValidMoves(board, this.data.currentPlayer);
      this.setData({
        validMoves: currentMoves,
        message: this.data.currentPlayer === BLACK ? '黑棋继续' : '白棋思考中...'
      });

      if (this.data.currentPlayer === WHITE) {
        this.aiMove(board);
      }
      return;
    }

    // 正常切换
    this.setData({
      currentPlayer: nextPlayer,
      validMoves: nextMoves,
      flippedCells: [],
      message: nextPlayer === BLACK ? '黑棋回合' : '白棋思考中...'
    });

    if (nextPlayer === WHITE) {
      this.aiMove(board);
    }
  },

  // AI落子
  aiMove(board) {
    this.setData({ aiThinking: true });

    const { difficulty } = this.data;
    const depthMap = { easy: 1, medium: 3, hard: 6, expert: 8 };
    const depth = depthMap[difficulty] || 3;

    // 使用setTimeout让UI先更新
    setTimeout(() => {
      const move = this.getAIMove(board, depth);
      
      if (move) {
        this.setData({ aiThinking: false });
        this.executeMove(move.row, move.col, WHITE);
      } else {
        // AI无法落子
        this.setData({ aiThinking: false });
        this.switchTurn(board);
      }
    }, 100);
  },

  // AI选择落子位置
  getAIMove(board, depth) {
    const moves = this.getValidMoves(board, WHITE);
    if (moves.length === 0) return null;

    if (depth === 1) {
      // 简单模式：随机选择翻转最多的位置
      let bestMove = moves[0];
      let maxFlip = 0;
      for (const move of moves) {
        const flips = this.getCellsToFlip(board, move.row, move.col, WHITE).length;
        if (flips > maxFlip) {
          maxFlip = flips;
          bestMove = move;
        }
      }
      return bestMove;
    }

    // 使用Minimax + Alpha-Beta剪枝
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
      const { newBoard } = this.makeMove(board, move.row, move.col, WHITE);
      const score = this.minimax(newBoard, depth - 1, -Infinity, Infinity, false);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  },

  // Minimax算法 + Alpha-Beta剪枝
  minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || this.isGameOver(board)) {
      return this.evaluateBoard(board);
    }

    const player = isMaximizing ? WHITE : BLACK;
    const moves = this.getValidMoves(board, player);

    if (moves.length === 0) {
      // 无法落子，跳过回合
      return this.minimax(board, depth - 1, alpha, beta, !isMaximizing);
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const { newBoard } = this.makeMove(board, move.row, move.col, WHITE);
        const score = this.minimax(newBoard, depth - 1, alpha, beta, false);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // 剪枝
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of moves) {
        const { newBoard } = this.makeMove(board, move.row, move.col, BLACK);
        const score = this.minimax(newBoard, depth - 1, alpha, beta, true);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break; // 剪枝
      }
      return minScore;
    }
  },

  // 评估棋盘（从AI角度）
  evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === WHITE) {
          score += POSITION_WEIGHT[r][c];
        } else if (board[r][c] === BLACK) {
          score -= POSITION_WEIGHT[r][c];
        }
      }
    }

    // 游戏结束时，棋子数差异更重要
    if (this.isGameOver(board)) {
      const counts = this.countPieces(board);
      score += (counts.white - counts.black) * 100;
    }

    return score;
  },

  // 游戏结束
  endGame(board) {
    const counts = this.countPieces(board);
    let winner, message;

    if (counts.black > counts.white) {
      winner = BLACK;
      message = `黑棋获胜！${counts.black} vs ${counts.white}`;
    } else if (counts.white > counts.black) {
      winner = WHITE;
      message = `白棋获胜！${counts.white} vs ${counts.black}`;
    } else {
      winner = null;
      message = `平局！${counts.black} vs ${counts.white}`;
    }

    this.setData({
      gameOver: true,
      winner,
      message,
      showResult: true,
      validMoves: [],
      aiThinking: false
    });
  },

  // 重新开始
  restart() {
    this.setData({ showResult: false });
    this.initGame();
  },

  // 关闭结果弹窗
  closeResult() {
    this.setData({ showResult: false });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '黑白棋 - 随身工具宝',
      path: '/packages/math/pages/othello/othello'
    };
  },

  onShareTimeline() {
    return {
      title: '黑白棋 - 随身工具宝'
    };
  }
});