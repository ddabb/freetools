// packages/math/pages/number-one/number-one.js
const utils = require('../../../../utils/index');
const { playSound, preloadSounds } = utils;

// CDN 题库基础路径
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/number-one';

// 难度到目录名的映射
const DIFF_DIR = ['easy', 'medium', 'hard'];

// 每种难度-尺寸组合的题目数量
const PUZZLE_COUNT = 30;

Page({
  onLoad() {
    preloadSounds(['click', 'win', 'wrong']);
    wx.setNavigationBarTitle({ title: '数壹' });
    this._initSizeClass();
    this._loadPuzzleList();
  },
  data: {
    size: 6,
    difficulty: 2,
    board: [],
    userBoard: [],
    solution: [],
    solved: false,
    failed: false,
    gameStarted: false,
    elapsed: 0,
    formattedTime: '0:00',
    timer: null,
    difficultyOptions: [
      { label: '简单', value: 1 },
      { label: '中等', value: 2 },
      { label: '困难', value: 3 },
    ],
    sizeOptions: [
      { label: '5×5', value: 5 },
      { label: '6×6', value: 6 },
      { label: '7×7', value: 7 },
    ],
    loading: false,
    loadingText: '加载题库...',
    currentPuzzle: null,  // 当前谜题原始数据
  },

  onUnload() {
    this._stopTimer();
  },

  _initSizeClass() {
    const size = this.data.size;
    if (size === 5) this.setData({ sizeClass: 'size-small' });
    else if (size === 6) this.setData({ sizeClass: 'size-medium' });
    else this.setData({ sizeClass: 'size-large' });
  },

  _formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  },

  // 加载当前难度-尺寸组合的随机一道题
  _loadPuzzleList() {
    this.setData({ loading: true, loadingText: '加载题库...' });
    const { size, difficulty } = this.data;
    const dir = DIFF_DIR[difficulty - 1];
    
    // 随机选择一道题的编号 (1-30)
    const puzzleIndex = Math.floor(Math.random() * PUZZLE_COUNT) + 1;
    const filename = `${size}-${String(puzzleIndex).padStart(4, '0')}.json`;
    const url = `${CDN_BASE}/${dir}/${filename}`;
    
    console.debug('[数壹] 加载题目:', url);
    
    wx.request({
      url: url,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.board) {
          console.debug('[数壹] 题目加载成功');
          this._startGame(res.data);
          this.setData({ loading: false });
        } else {
          console.warn('[数壹] 题目数据格式错误');
          this.setData({ loading: false, failed: true });
        }
      },
      fail: (err) => {
        console.warn('[数壹] 加载失败:', err);
        this.setData({ loading: false, failed: true });
      }
    });
  },

  _startGame(puzzle) {
    this._stopTimer();
    const { size } = this.data;
    const board = puzzle.board;

    // 用户棋盘：0=未标记, 1=标记为黑
    const userBoard = Array.from({ length: size }, () => new Array(size).fill(0));

    this.setData({
      board,
      userBoard,
      answerBlack: Array.from({ length: size }, () => new Array(size).fill(0)),
      solution: puzzle.solution,
      size: puzzle.size || size,
      difficulty: puzzle.difficulty ? DIFF_DIR.indexOf(puzzle.difficulty) + 1 : this.data.difficulty,
      userBlackCount: 0,
      solutionBlackCount: puzzle.solution.length,
      solved: false,
      failed: false,
      gameStarted: true,
      elapsed: 0,
      formattedTime: '0:00',
      currentPuzzle: puzzle,
    });

    this._initSizeClass();
    this._startTimer();
  },

  _startTimer() {
    const timer = setInterval(() => {
      const elapsed = this.data.elapsed + 1;
      this.setData({
        elapsed,
        formattedTime: this._formatTime(elapsed),
      });
    }, 1000);
    this.setData({ timer });
  },

  _stopTimer() {
    const { timer } = this.data;
    if (timer) { clearInterval(timer); this.setData({ timer: null }); }
  },

  // 点击格子：标记/取消黑格
  onCellTap(e) {
    if (this.data.solved || this.data.loading) return;
    const { row, col } = e.currentTarget.dataset;
    const userBoard = this.data.userBoard.map(r => [...r]);
    // 0→1→0 切换
    userBoard[row][col] = userBoard[row][col] === 1 ? 0 : 1;
    const userBlackCount = userBoard.flat().filter(v => v === 1).length;
    playSound('click', { pageId: 'number-one' });
    this.setData({ userBoard, failed: false, userBlackCount });
    this._checkWin(userBoard);
  },

  // 长按格子：清除标记
  onCellLongPress(e) {
    if (this.data.solved || this.data.loading) return;
    const { row, col } = e.currentTarget.dataset;
    const userBoard = this.data.userBoard.map(r => [...r]);
    userBoard[row][col] = 0;
    const userBlackCount = userBoard.flat().filter(v => v === 1).length;
    playSound('click', { pageId: 'number-one' });
    this.setData({ userBoard, failed: false, userBlackCount });
  },

  _checkWin(userBoard) {
    const { solution, size } = this.data;
    const solSet = new Set(solution);
    let correct = true;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r},${c}`;
        const isUserBlack = userBoard[r][c] === 1;
        const isSolBlack = solSet.has(key);
        if (isUserBlack !== isSolBlack) { correct = false; break; }
      }
      if (!correct) break;
    }

    if (correct) {
      this._stopTimer();
      this.setData({ solved: true, failed: false });
      playSound('win', { pageId: 'number-one' });
      this._showResult('success');
    } else {
      // 答错：只播放音效，不弹窗也不显示红色边框，让用户继续玩
      playSound('click', { pageId: 'number-one' });
    }
  },

  _showResult(type) {
    const { formattedTime, size, difficulty } = this.data;
    const diffNames = ['', '简单', '中等', '困难'];
    const sizeNames = { 5: '5×5', 6: '6×6', 7: '7×7' };
    const title = type === 'success' ? '🎉 正确！' : '❌ 错误';
    const msg = type === 'success'
      ? `用时 ${formattedTime}\n${sizeNames[size]} ${diffNames[difficulty]}`
      : '还有格子标记错误，继续加油！';
    wx.showModal({
      title,
      content: msg,
      showCancel: type === 'success',
      confirmText: type === 'success' ? '下一题' : '继续',
      cancelText: '重选',
      success: (res) => {
        if (res.confirm) {
          if (type === 'success') this.nextPuzzle();
          else {
            // 继续：清除错误标记，重新开始当前题
            const { size } = this.data;
            const userBoard = Array.from({ length: size }, () => new Array(size).fill(0));
            this.setData({ failed: false, userBoard });
          }
        } else if (res.cancel) {
          this.nextPuzzle();
        }
      }
    });
  },

  // 下一题
  nextPuzzle() {
    this._loadPuzzleList();
  },

  // 切换难度
  onDifficultyChange(e) {
    const diff = parseInt(e.currentTarget.dataset.value);
    this.setData({ difficulty: diff, gameStarted: false });
    this._loadPuzzleList();
  },

  // 切换尺寸
  onSizeChange(e) {
    const size = parseInt(e.currentTarget.dataset.value);
    this.setData({ size, gameStarted: false });
    this._initSizeClass();
    this._loadPuzzleList();
  },

  // 重新开始当前题
  restart() {
    const { currentPuzzle, size } = this.data;
    if (!currentPuzzle) return;
    this._stopTimer();
    const userBoard = Array.from({ length: size }, () => new Array(size).fill(0));
    this.setData({
      board: currentPuzzle.board,
      userBoard,
      answerBlack: Array.from({ length: size }, () => new Array(size).fill(0)),
      solved: false,
      failed: false,
      elapsed: 0,
      formattedTime: '0:00',
      userBlackCount: 0,
    });
    this._startTimer();
  },

  // 显示/隐藏答案
  showAnswer() {
    const { solution, size } = this.data;
    const solSet = new Set(solution);
    const answerBlack = Array.from({ length: size }, () => new Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solSet.has(`${r},${c}`)) {
          answerBlack[r][c] = 1;
        }
      }
    }
    // 显示答案时先清除用户的标记
    const userBoard = Array.from({ length: size }, () => new Array(size).fill(0));
    this.setData({ 
      answerBlack, 
      userBoard,
      solved: true,
      failed: false,
      userBlackCount: solution.length,
    });
    this._stopTimer();
    wx.showModal({
      title: '📋 答案',
      content: '已显示答案，黑格即为涂黑位置',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 撤销（清除所有标记）
  undoAll() {
    const { size } = this.data;
    const userBoard = Array.from({ length: size }, () => new Array(size).fill(0));
    this.setData({ userBoard, failed: false, userBlackCount: 0 });
  },
});
