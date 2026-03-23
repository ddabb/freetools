const sudoku = require('../../utils/sudoku');

Page({
  data: {
    board: [],
    difficulty: 'medium',
    showingAnswer: false,
    answerBoard: [],
    generating: false,
  },

  onLoad() {
    this.generateSudoku();
  },

  /**
   * 生成数独谜题
   * 流程：生成终盘 → 根据难度挖空 → 渲染展示
   */
  generateSudoku() {
    if (this.data.generating) return;
    this.setData({ generating: true });

    wx.showLoading({ title: '生成中...' });

    // 用 setTimeout 将计算放到下一个事件循环，让 loading 先显示出来
    setTimeout(() => {
      try {
        // 1. 生成完整终盘
        const fullBoard = sudoku.generateFullBoard();

        // 2. 根据难度决定挖空数量
        const removeCount = { easy: 30, medium: 45, hard: 55 }[this.data.difficulty] || 45;
        const puzzle = sudoku.createPuzzle(fullBoard, removeCount);

        // 3. 转换为展示格式：{value, fixed}
        const displayBoard = puzzle.map(row =>
          row.map(val => ({
            value: val ? String(val) : '',
            fixed: val !== 0,
          }))
        );

        this.setData({
          board: displayBoard,
          answerBoard: fullBoard.map(row => row.map(String)),
          showingAnswer: false,
          generating: false,
        });

        wx.hideLoading();
        wx.showToast({ title: '生成成功', icon: 'success' });
      } catch (e) {
        wx.hideLoading();
        this.setData({ generating: false });
        wx.showToast({ title: '生成失败', icon: 'none' });
        console.error('Sudoku generate error:', e);
      }
    }, 50);
  },

  setDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    if (difficulty === this.data.difficulty) return;
    this.setData({ difficulty });
    this.generateSudoku();
  },

  toggleAnswer() {
    this.setData({ showingAnswer: !this.data.showingAnswer });
  },

  onShareAppMessage() {
    return {
      title: '数独生成器 - 随机生成数独题目',
      path: '/packages/math/pages/sudoku-generator/sudoku-generator',
    };
  },
});
