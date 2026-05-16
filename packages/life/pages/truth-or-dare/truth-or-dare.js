// packages/life/pages/truth-or-dare/truth-or-dare.js
const utils = require('../../../../utils/index');
const { playSound } = utils;

// 真心话大冒险页面
Page({
  behaviors: [adBehavior],
  data: {
    // 当前模式：truth / dare
    mode: 'truth',
    // 当前难度：all / easy / medium / hard
    difficulty: 'all',
    // 当前分类：all / 感情 / 秘密 / 经历 / 性格 / 八卦 / 表演 / 社交 / 创意 / 搞笑 / 挑战
    category: 'all',
    // 当前题目
    currentQuestion: '',
    currentItem: null,
    // 是否在动画中
    isAnimating: false,
    // 记录历史
    history: [],
    // 统计数据
    truthCount: 0,
    dareCount: 0,
    totalCount: 0,
    // 数据
    truthList: [],
    dareList: [],
    // 是否显示历史
    showHistory: false,
    // 显示分享
    showShare: false,
  },

  onLoad() {
    this.loadData();
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  // 从CDN加载数据
  loadData() {
    wx.showLoading({ title: '加载中...' });

    const cached = wx.getStorageSync('tod_data');
    const cacheTime = wx.getStorageSync('tod_cache_time');
    const now = Date.now();
    const isToday = cacheTime && new Date(cacheTime).toDateString() === new Date().toDateString();

    if (cached && isToday) {
      wx.hideLoading();
      this._processData(cached);
      return;
    }

    const cdnUrl = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/truth-or-dare.json';

    wx.request({
      url: cdnUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.categories) {
          const data = res.data;
          wx.setStorageSync('tod_data', data);
          wx.setStorageSync('tod_cache_time', now);
          this._processData(data);
        }
      },
      fail: () => {
        wx.hideLoading();
        if (cached) {
          this._processData(cached);
        } else {
          utils.showText('加载失败，请下拉刷新');
        }
      }
    });
  },

  _processData(data) {
    let truthList = [];
    let dareList = [];

    data.categories.forEach(cat => {
      if (cat.id === 'truth') {
        truthList = cat.items || [];
      } else if (cat.id === 'dare') {
        dareList = cat.items || [];
      }
    });

    this.setData({ truthList, dareList }, () => {
      this.pickQuestion();
    });
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.mode) return;
    playSound('spin', { pageId: 'truth-or-dare' });
    this.setData({ mode, currentQuestion: '', currentItem: null }, () => {
      this.pickQuestion();
    });
  },

  // 切换难度
  switchDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty;
    playSound('click', { pageId: 'truth-or-dare' });
    this.setData({ difficulty }, () => {
      this.pickQuestion();
    });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    playSound('click', { pageId: 'truth-or-dare' });
    this.setData({ category }, () => {
      this.pickQuestion();
    });
  },

  // 获取当前列表
  getCurrentList() {
    const { mode, difficulty, category, truthList, dareList } = this.data;
    let list = mode === 'truth' ? truthList : dareList;

    // 难度过滤
    if (difficulty !== 'all') {
      list = list.filter(item => item.difficulty === difficulty);
    }

    // 分类过滤
    if (category !== 'all') {
      list = list.filter(item => item.category === category);
    }

    return list;
  },

  // 抽取题目
  pickQuestion() {
    const list = this.getCurrentList();
    if (!list.length) {
      this.setData({ currentQuestion: '该分类暂无题目，换一个试试~', currentItem: null });
      return;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const item = list[randomIndex];

    this.setData({
      currentQuestion: item.text,
      currentItem: item,
      isAnimating: true
    });

    setTimeout(() => {
      this.setData({ isAnimating: false });
    }, 400);
  },

  // 点击卡片换题
  onCardTap() {
    if (this.data.isAnimating) return;
    playSound('click', { pageId: 'truth-or-dare' });
    this.pickQuestion();
    wx.vibrateShort({ type: 'light' });
  },

  // 跳过当前题
  skipQuestion() {
    playSound('click', { pageId: 'truth-or-dare' });
    this.pickQuestion();
  },

  // 标记完成（跳过）
  markDone() {
    playSound('click', { pageId: 'truth-or-dare' });
    this.pickQuestion();
  },

  // 切换历史
  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  // 获取难度标签
  getDifficultyLabel(difficulty) {
    const map = { easy: '入门', medium: '刺激', hard: '疯狂' };
    return map[difficulty] || difficulty;
  },

  // 获取难度颜色
  getDifficultyColor(difficulty) {
    const map = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
    return map[difficulty] || '#6b7280';
  },

  // 获取分类颜色
  getCategoryColor(category) {
    const map = {
      '感情': '#ec4899',
      '秘密': '#6366f1',
      '经历': '#3b82f6',
      '性格': '#8b5cf6',
      '八卦': '#f97316',
      '表演': '#eab308',
      '社交': '#14b8a6',
      '创意': '#a855f7',
      '搞笑': '#f43f5e',
      '挑战': '#ef4444'
    };
    return map[category] || '#6b7280';
  },

  // 复制题目
  copyQuestion() {
    const { currentQuestion, mode } = this.data;
    const prefix = mode === 'truth' ? '【真心话】' : '【大冒险】';
    wx.setClipboardData({
      data: `${prefix}${currentQuestion}`,
      success: () => {
        utils.showSuccess('已复制');
      }
    });
  },

  // 显示分享
  showShareModal() {
    this.setData({ showShare: true });
  },

  // 隐藏分享
  hideShareModal() {
    this.setData({ showShare: false });
  },

  // 分享到群聊
  shareToGroup() {
    this.hideShareModal();
    wx.showShareMenu({ withShareTicket: true });
  },

  // 生成分享图
  generateImage() {
    const { currentQuestion, mode } = this.data;
    const prefix = mode === 'truth' ? '真心话' : '大冒险';
    const encodeText = encodeURIComponent(`${prefix}：${currentQuestion}`);
    this.hideShareModal();
    wx.navigateTo({
      url: `/packages/life/pages/text-to-image/text-to-image?text=${encodeText}&from=truth-or-dare`
    });
  },

  // 加载统计数据
  loadStats() {
    this.setData({
      truthCount: wx.getStorageSync('tod_truth_count') || 0,
      dareCount: wx.getStorageSync('tod_dare_count') || 0,
      totalCount: wx.getStorageSync('tod_total_count') || 0,
      history: wx.getStorageSync('tod_history') || []
    });
  },

  // 保存统计数据
  saveStats() {
    const { mode, truthCount, dareCount, totalCount, currentQuestion, currentItem } = this.data;
    const newTruthCount = mode === 'truth' ? truthCount + 1 : truthCount;
    const newDareCount = mode === 'dare' ? dareCount + 1 : dareCount;
    const newTotalCount = totalCount + 1;

    wx.setStorageSync('tod_truth_count', newTruthCount);
    wx.setStorageSync('tod_dare_count', newDareCount);
    wx.setStorageSync('tod_total_count', newTotalCount);

    // 添加到历史
    const historyItem = {
      id: Date.now(),
      mode,
      question: currentQuestion,
      difficulty: currentItem ? currentItem.difficulty : '',
      category: currentItem ? currentItem.category : '',
      time: new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const history = [historyItem, ...this.data.history].slice(0, 50);
    wx.setStorageSync('tod_history', history);

    this.setData({
      truthCount: newTruthCount,
      dareCount: newDareCount,
      totalCount: newTotalCount,
      history
    });
  },

  // 刷新数据
  refreshData() {
    wx.showLoading({ title: '刷新中...' });
    wx.removeStorageSync('tod_cache_time');
    wx.removeStorageSync('tod_data');
    setTimeout(() => {
      this.loadData();
      wx.hideLoading();
      utils.showSuccess('刷新成功');
    }, 300);
  },

  // 分享
  onShareAppMessage() {
    const { mode, currentQuestion } = this.data;
    const prefix = mode === 'truth' ? '真心话' : '大冒险';
    return {
      title: `🎭 ${prefix}：${currentQuestion}`,
      path: '/packages/life/pages/truth-or-dare/truth-or-dare'
    };
  },

  onShareTimeline() {
    const { mode, currentQuestion } = this.data;
    const prefix = mode === 'truth' ? '真心话' : '大冒险';
    return {
      title: `🎭 ${prefix}：${currentQuestion}`
    };
  }
});
const adBehavior = require('../../../../utils/ad-behavior');
