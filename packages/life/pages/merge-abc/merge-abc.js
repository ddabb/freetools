// packages/life/pages/merge-abc/merge-abc.js
// ABC合成记 - 字母合并游戏

const utils = require('../../../../utils/index');
const { playSound } = utils;

// 分数映射
const SCORES = {
  A: 3, B: 6, C: 12, D: 24, E: 48, F: 96, G: 192,
  H: 384, I: 768, J: 1536, K: 3072, L: 6144, M: 12288,
  N: 24576, O: 49152, P: 98304, Q: 196608, R: 393216,
  S: 786432, T: 1572864, U: 3145728, V: 6291456,
  W: 12582912, X: 25165824, Y: 50331648, Z: 100663296
};

const TILES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

Page({
  behaviors: [adBehavior],
  data: {
    board: [],       // 16格棋盘
    score: 0,
    bestScore: 0,
    gameOver: false,
    showGameOverModal: false
  },

  _board: [],
  _history: [],
  _maxHistory: 5,

  onLoad() {
    // 尝试恢复上次的游戏进度
    const saved = wx.getStorageSync('merge_abc_saved');
    if (saved && saved.board && saved.board.length === 16) {
      this._board = saved.board;
      this.setData({ board: this._board.slice(), score: saved.score || 0, bestScore: saved.bestScore || 0 });
    } else {
      this.initBoard();
    }
    this.loadBestScore();
  },

  onUnload() {
    // 退出时保存当前游戏进度
    wx.setStorageSync('merge_abc_saved', {
      board: this._board,
      score: this.data.score,
      bestScore: this.data.bestScore
    });
  },

  // 读取最高分
  loadBestScore() {
    const best = wx.getStorageSync('merge_abc_best') || 0;
    this.setData({ bestScore: best });
  },

  // 保存最高分
  saveBestScore() {
    const { score, bestScore } = this.data;
    if (score > bestScore) {
      wx.setStorageSync('merge_abc_best', score);
      this.setData({ bestScore: score });
    }
  },

  // 初始化棋盘
  initBoard() {
    this._board = new Array(16).fill('');
    this._history = [];
    this.addNewTile();
    this.addNewTile();
    const score = this.getScore();
    this.setData({ board: this._board.slice(), score, gameOver: false, showGameOverModal: false });
  },

  // 随机生成新方块
  addNewTile() {
    const empty = [];
    this._board.forEach((cell, i) => { if (cell === '') empty.push(i); });
    if (empty.length > 0) {
      const idx = empty[Math.floor(Math.random() * empty.length)];
      this._board[idx] = this.getRandomTile();
    }
  },

  getRandomTile() {
    const r = Math.random();
    if (r < 0.75) return 'A';
    if (r < 0.85) return 'B';
    if (r < 0.95) return 'C';
    return 'D';
  },

  // 计算分数
  getScore() {
    let total = 0;
    for (let i = 0; i < this._board.length; i++) {
      total += SCORES[this._board[i]] || 0;
    }
    return total;
  },

  // 获取下一个字母
  getNextTile(tile) {
    const idx = TILES.indexOf(tile);
    return idx < TILES.length - 1 ? TILES[idx + 1] : '';
  },

  // 压缩行/列（去除空格靠拢）
  compress(arr) {
    const result = arr.filter(x => x !== '');
    while (result.length < 4) result.push('');
    return result;
  },

  // 合并相邻相同字母（一次只合并一遍，不连续合并）
  merge(arr) {
    let merged = false;
    const result = [];
    let i = 0;
    
    while (i < arr.length) {
      // 如果当前和下一个相同且不为空，合并
      if (i < arr.length - 1 && arr[i] === arr[i + 1] && arr[i] !== '') {
        const nextTile = this.getNextTile(arr[i]);
        result.push(nextTile);
        playSound('drop', { pageId: 'merge-abc' });
        // 检测到 Z 触发胜利音效
        if (nextTile === 'Z') {
          setTimeout(() => playSound('win', { pageId: 'merge-abc' }), 150);
        }
        i += 2;
        merged = true;
      } else if (arr[i] !== '') {
        result.push(arr[i]);
        i++;
      } else {
        i++;
      }
    }
    
    // 补全空格
    while (result.length < 4) {
      result.push('');
    }
    
    return [merged, result];
  },

  // 向左移动
  moveLeft() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      let temp = [];
      for (let col = 0; col < 4; col++) {
        if (this._board[row * 4 + col] !== '') temp.push(this._board[row * 4 + col]);
      }
      temp = this.compress(temp);
      const [merged, result] = this.merge(temp);
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        if (result[col] !== this._board[idx]) { this._board[idx] = result[col] || ''; moved = true; }
      }
    }
    return moved;
  },

  // 向右移动
  moveRight() {
    let moved = false;
    for (let row = 0; row < 4; row++) {
      let temp = [];
      for (let col = 3; col >= 0; col--) {
        if (this._board[row * 4 + col] !== '') temp.push(this._board[row * 4 + col]);
      }
      temp = this.compress(temp);
      const [merged, result] = this.merge(temp);
      for (let col = 3; col >= 0; col--) {
        const idx = row * 4 + col;
        if (result[3 - col] !== this._board[idx]) { this._board[idx] = result[3 - col] || ''; moved = true; }
      }
    }
    return moved;
  },

  // 向上移动
  moveUp() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      let temp = [];
      for (let row = 0; row < 4; row++) {
        if (this._board[row * 4 + col] !== '') temp.push(this._board[row * 4 + col]);
      }
      temp = this.compress(temp);
      const [merged, result] = this.merge(temp);
      for (let row = 0; row < 4; row++) {
        const idx = row * 4 + col;
        if (result[row] !== this._board[idx]) { this._board[idx] = result[row] || ''; moved = true; }
      }
    }
    return moved;
  },

  // 向下移动
  moveDown() {
    let moved = false;
    for (let col = 0; col < 4; col++) {
      let temp = [];
      for (let row = 3; row >= 0; row--) {
        if (this._board[row * 4 + col] !== '') temp.push(this._board[row * 4 + col]);
      }
      temp = this.compress(temp);
      const [merged, result] = this.merge(temp);
      for (let row = 3; row >= 0; row--) {
        const idx = row * 4 + col;
        if (result[3 - row] !== this._board[idx]) { this._board[idx] = result[3 - row] || ''; moved = true; }
      }
    }
    return moved;
  },

  // 处理移动
  handleMove(direction) {
    if (this.data.gameOver) return;

    let moved = false;
    switch (direction) {
      case 'left': moved = this.moveLeft(); break;
      case 'right': moved = this.moveRight(); break;
      case 'up': moved = this.moveUp(); break;
      case 'down': moved = this.moveDown(); break;
    }

    if (moved) {
      this.addNewTile();
      this.saveState();
      this.checkGameOver();
    }

    const score = this.getScore();
    this.setData({ board: this._board.slice(), score });
    this.saveBestScore();
  },

  // 触摸滑动
  onTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
  },

  onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - this._touchStartX;
    const dy = e.changedTouches[0].clientY - this._touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return; // 最小滑动距离

    if (absDx > absDy) {
      this.handleMove(dx > 0 ? 'right' : 'left');
    } else {
      this.handleMove(dy > 0 ? 'down' : 'up');
    }
  },

  // 保存状态（撤销用）
  saveState() {
    this._history.push(this._board.slice());
    if (this._history.length > this._maxHistory) this._history.shift();
  },

  // 撤销
  undo() {
    if (this._history.length > 0) {
      this._board = this._history.pop();
      const score = this.getScore();
      this.setData({ board: this._board.slice(), score });
    } else {
      utils.showText('没有可撤销的操作');
    }
  },

  // 检查游戏结束
  checkGameOver() {
    const hasEmpty = this._board.some(cell => cell === '');
    if (hasEmpty) return;

    let canMove = false;
    for (let i = 0; i < 16; i++) {
      if (i % 4 !== 3 && this._board[i] === this._board[i + 1]) { canMove = true; break; }
      if (i + 4 < 16 && this._board[i] === this._board[i + 4]) { canMove = true; break; }
    }

    if (!canMove) {
      this.saveBestScore();
      playSound('lose', { pageId: 'merge-abc' });
      this.setData({ gameOver: true, showGameOverModal: true });
    }
  },

  // 重新开始
  restart() {
    this.initBoard();
  },

  // 关闭游戏结束弹窗
  closeGameOverModal() {
    this.setData({ showGameOverModal: false });
  },

  // 阻止触摸滚动（游戏棋盘用）
  preventTouchMove() {
    return;
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `ABC合成记 - 我得了${this.data.score}分！`,
      path: '/packages/life/pages/merge-abc/merge-abc'
    };
  },

  onShareTimeline() {
    return { title: `ABC合成记 - 我得了${this.data.score}分！` };
  }
});
const adBehavior = require('../../../../utils/ad-behavior');
