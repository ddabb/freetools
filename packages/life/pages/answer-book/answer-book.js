// packages/life/pages/answer-book/answer-book.js
const utils = require('../../../../utils/index');

Page({
  data: {
    question: '',
    answer: '',
    answerType: '',  // 答案类型：positive, negative, neutral, mystical
    isShaking: false,
    answerList: [],
    showHistory: false,
    historyList: [],
    hasResult: false,
    showResult: false  // 控制答案展示动画
  },

  onLoad() {
    this.loadData();
    const history = wx.getStorageSync('answer_book_history') || [];
    this.setData({ historyList: history });
  },

  onShareAppMessage() {
    return {
      title: '答案之书',
      path: '/packages/life/pages/answer-book/answer-book',
      imageUrl: '/assets/icons/logo.png'
    };
  },

  onShareTimeline() {
    return {
      title: '答案之书，为你指点迷津 🔮'
    };
  },

  // 从CDN加载答案数据
  loadData() {
    wx.showLoading({ title: '加载中...' });

    const cached = wx.getStorageSync('answer_book_data');
    const cacheTime = wx.getStorageSync('answer_book_cache_time');
    const now = Date.now();
    const cacheExpiry = 7 * 24 * 60 * 60 * 1000;

    if (cached && cacheTime && (now - cacheTime < cacheExpiry)) {
      wx.hideLoading();
      this.setData({ answerList: cached });
      return;
    }

    const cdnUrl = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/wordbank/answer-book.json';

    wx.request({
      url: cdnUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.content) {
          const answerList = res.data.content;
          wx.setStorageSync('answer_book_data', answerList);
          wx.setStorageSync('answer_book_cache_time', now);
          this.setData({ answerList });
        }
      },
      fail: () => {
        wx.hideLoading();
        if (cached) {
          this.setData({ answerList: cached });
        } else {
          utils.showText('加载失败，请下拉刷新');
        }
      }
    });
  },

  // 输入问题
  onQuestionInput(e) {
    this.setData({ question: e.detail.value });
  },

  // 摇晃获取答案
  shakeAndAsk() {
    const { answerList, question, isShaking } = this.data;
    if (isShaking || !answerList.length) return;

    if (!question.trim()) {
      utils.showText('请先输入你的问题');
      return;
    }

    this.setData({ isShaking: true, hasResult: false, showResult: false });
    wx.vibrateShort({ type: 'medium' });

    // 隐藏之前的答案
    setTimeout(() => {
      // 随机选择答案
      const randomIndex = Math.floor(Math.random() * answerList.length);
      const answer = answerList[randomIndex].text;

      // 判断答案类型
      const answerType = this.getAnswerType(answer);

      this.setData({
        answer,
        answerType,
        isShaking: false,
        hasResult: true
      });

      // 延迟显示答案（动画效果）
      setTimeout(() => {
        this.setData({ showResult: true });
        this.saveToHistory(question, answer, answerType);
      }, 300);
    }, 1200);
  },

  // 判断答案类型
  getAnswerType(answer) {
    const positiveKeywords = ['肯定', '是的', '毫无疑问', '板上钉钉', '毫无疑问', '毫无疑问', '是', '好', '行', '稳', 'JUST', '冲', '大胆', '毫无疑问', '板上钉钉'];
    const negativeKeywords = ['不', '没', '别', '不', '不是', '没有', 'no', 'not', '放弃', '不对', '不行', '不行', '不可能', '别想了'];
    const mysticalKeywords = ['看', '缘分', '命中注定', '天意', '冥冥', '命', '运气', '看情况', '看心情', '不知道'];

    const lowerAnswer = answer.toLowerCase();

    if (positiveKeywords.some(k => lowerAnswer.includes(k))) return 'positive';
    if (negativeKeywords.some(k => lowerAnswer.includes(k))) return 'negative';
    if (mysticalKeywords.some(k => lowerAnswer.includes(k))) return 'mystical';
    return 'neutral';
  },

  // 保存到历史
  saveToHistory(question, answer, answerType) {
    const { historyList } = this.data;
    const newRecord = {
      question,
      answer,
      answerType,
      time: new Date().toLocaleString('zh-CN')
    };

    const newHistory = [newRecord, ...historyList].slice(0, 30);
    wx.setStorageSync('answer_book_history', newHistory);
    this.setData({ historyList: newHistory });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('answer_book_history');
          this.setData({ historyList: [] });
          utils.showSuccess('已清空');
        }
      }
    });
  },

  // 切换历史面板
  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  // 复制答案
  copyAnswer() {
    const { answer } = this.data;
    if (!answer) return;

    wx.setClipboardData({
      data: answer,
      success: () => {
        utils.showSuccess('已复制');
      }
    });
  },

  // 刷新数据
  refreshData() {
    wx.showLoading({ title: '刷新中...' });
    wx.removeStorageSync('answer_book_cache_time');
    wx.removeStorageSync('answer_book_data');
    setTimeout(() => {
      this.loadData();
      utils.showSuccess('刷新成功');
    }, 300);
  }
});
