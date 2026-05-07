const utils = require('../../../../utils/index');
const { playSound, preloadSounds } = utils;

const MAX_ATTEMPTS = 10;
const COLS = 4;

Page({
  data: {
    currentInput: [],      // 当前输入的数字
    inputValue: '',        // 输入框的值
    inputFocus: false,     // 输入框焦点
    history: [],           // 猜测历史
    lastFeedback: '',      // 最后一次反馈
    time: 0,
    timeStr: '0:00',
    isComplete: false,
    isWin: false,
    answer: [],
    scrollToId: ''
  },

  timer: null,

  onLoad() {
    this.initGame();
  },

  onUnload() {
    this.stopTimer();
  },

  initGame() {
    const answer = this._generateAnswer();
    this.setData({
      currentInput: [],
      inputValue: '',
      inputFocus: false,
      history: [],
      lastFeedback: '',
      time: 0,
      timeStr: '0:00',
      isComplete: false,
      isWin: false,
      answer
    });
    this.startTimer();
  },

  _generateAnswer() {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const answer = [];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * digits.length);
      answer.push(digits[idx]);
      digits.splice(idx, 1);
    }
    return answer;
  },

  // 点击输入区域，触发输入框聚焦
  onInputTap() {
    if (this.data.isComplete) return;
    this.setData({ inputFocus: true });
  },

  // 输入变化
  onInputChange(e) {
    if (this.data.isComplete) return;

    const value = e.detail.value;
    
    // 只允许数字
    const nums = value.replace(/\D/g, '').split('').map(Number);
    
    // 去重并限制长度
    const uniqueNums = [];
    const seen = new Set();
    for (const num of nums) {
      if (!seen.has(num) && uniqueNums.length < COLS) {
        seen.add(num);
        uniqueNums.push(num);
      }
    }

    const prevLength = this.data.currentInput.length;
    this.setData({
      currentInput: uniqueNums,
      inputValue: uniqueNums.join('')
    });

    // 有新数字输入时播放音效
    if (uniqueNums.length > prevLength) {
      playSound('click');
    }
  },

  onDeleteTap() {
    if (this.data.isComplete) return;
    if (this.data.currentInput.length === 0) return;

    const newInput = this.data.currentInput.slice(0, -1);
    this.setData({
      currentInput: newInput,
      inputValue: newInput.join('')
    });

    playSound('click');
  },

  onSubmitTap() {
    if (this.data.isComplete) return;
    if (this.data.currentInput.length < COLS) {
      wx.showToast({
        title: '请输入4位数字',
        icon: 'none'
      });
      playSound('error');
      return;
    }

    const guess = this.data.currentInput;
    const result = this._checkAnswer(guess, this.data.answer);

    // 添加到历史
    const historyItem = {
      guess: guess,
      numbers: result.numbers,
      position: result.position
    };

    const newHistory = [...this.data.history, historyItem];
    const scrollToId = `history-${newHistory.length - 1}`;

    // 生成反馈文本
    const correctCount = result.position;
    const wrongPosition = result.numbers - result.position;
    
    let lastFeedback = '';
    if (correctCount === COLS) {
      lastFeedback = '恭喜猜对了！';
    } else if (wrongPosition === 0) {
      lastFeedback = `${correctCount}个数字位置正确`;
    } else if (correctCount === 0) {
      lastFeedback = `${wrongPosition}个数字正确但位置不对`;
    } else {
      lastFeedback = `${correctCount}个位置正确，${wrongPosition}个数字对位置错`;
    }

    this.setData({
      history: newHistory,
      currentInput: [],
      inputValue: '',
      inputFocus: false,
      scrollToId,
      lastFeedback
    });

    // 检查是否猜对
    if (result.position === COLS) {
      this.setData({ isComplete: true, isWin: true });
      this.stopTimer();
      playSound('win');
      return;
    }

    // 检查是否用完机会
    if (newHistory.length >= MAX_ATTEMPTS) {
      this.setData({ isComplete: true, isWin: false });
      this.stopTimer();
      playSound('lose');
      return;
    }

    playSound('click');
  },

  _checkAnswer(guess, answer) {
    let position = 0;
    let numbers = 0;

    const answerCopy = [...answer];
    const guessCopy = [...guess];

    // 第一遍：找位置正确的
    for (let i = 0; i < COLS; i++) {
      if (guessCopy[i] === answerCopy[i]) {
        position++;
        numbers++;
        answerCopy[i] = -1;
        guessCopy[i] = -2;
      }
    }

    // 第二遍：找位置错误的
    for (let i = 0; i < COLS; i++) {
      if (guessCopy[i] < 0) continue;
      const idx = answerCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        numbers++;
        answerCopy[idx] = -1;
      }
    }

    return { numbers, position };
  },

  onReset() {
    this.stopTimer();
    this.initGame();
    playSound('tap');
  },

  startTimer() {
    this.timer = setInterval(() => {
      const time = this.data.time + 1;
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      this.setData({
        time,
        timeStr: `${minutes}:${seconds.toString().padStart(2, '0')}`
      });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
});
