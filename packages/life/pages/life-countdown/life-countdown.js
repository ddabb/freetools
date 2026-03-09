// packages/life/pages/life-countdown/life-countdown.js
Page({
  data: {
    birthDate: '', // 出生日期
    expectedLifeYears: 75, // 预计寿命（岁）- 调整为更现实的数字
    showResult: false, // 是否显示结果
    daysLived: 0, // 已活天数
    lifeLeft: 0, // 剩余预期寿命
    progress: 0, // 人生进度百分比
    totalGrids: 900, // 总格子数 (30×30)
    livedGrids: 0, // 已度过的格子数
    gridPercentage: 0, // 格子填充百分比
    gridRows: 30, // 网格行数
    gridCols: 30, // 网格列数
    currentYear: new Date().getFullYear(), // 当前年份
    // 人生思考引导问题
    lifeQuestions: [
      "如果生命只剩下一年，你最想做什么？",
      "什么让你感到真正的快乐和满足？",
      "你是否在为自己而活，还是活在别人的期待里？",
      "有什么事情是你一直想做却迟迟未行动的？",
      "你希望被记住的是一个怎样的人？",
      "什么是你愿意为之奋斗一生的目标？",
      "你最近一次因为专注而忘记时间是什么时候？",
      "如果金钱不是问题，你会如何度过余生？",
      "你觉得自己最大的天赋或优势是什么？",
      "你想给这个世界留下什么？"
    ],
    randomQuestion: ""
  },

  // 设置出生日期
  setBirthDate(e) {
    this.setData({
      birthDate: e.detail.value
    });
  },

  // 设置预计寿命
  setExpectedLifeYears(e) {
    const value = parseInt(e.detail.value) || 75;
    if (value < 1 || value > 120) {
      wx.showToast({
        title: '预期寿命应在1-120岁之间',
        icon: 'none'
      });
      return;
    }
    this.setData({
      expectedLifeYears: value
    });
  },

  // 计算人生倒计时
  calculate() {
    const { birthDate, expectedLifeYears } = this.data;
    if (!birthDate) {
      wx.showToast({
        title: '请输入出生日期',
        icon: 'none'
      });
      return;
    }

    const today = new Date();
    const birth = new Date(birthDate);

    // 验证出生日期是否有效
    if (isNaN(birth.getTime())) {
      wx.showToast({
        title: '出生日期格式错误',
        icon: 'none'
      });
      return;
    }

    // 检查出生日期是否是未来日期
    if (birth > today) {
      wx.showToast({
        title: '出生日期不能是未来日期',
        icon: 'none'
      });
      return;
    }

    // 验证预期寿命范围
    if (expectedLifeYears < 1 || expectedLifeYears > 120) {
      wx.showToast({
        title: '预期寿命应在1-120岁之间',
        icon: 'none'
      });
      return;
    }

    try {
      // 计算已活天数（精确到小数）
      const preciseDaysLived = (today - birth) / (1000 * 60 * 60 * 24);
      const daysLived = Math.floor(preciseDaysLived);

      // 计算预期寿命总天数
      const expectedLifeTotal = expectedLifeYears * 365.25;
      const lifeLeft = Math.max(0, Math.floor(expectedLifeTotal - preciseDaysLived));

      // 计算人生进度百分比
      const progress = Math.min(100, Math.round((preciseDaysLived / expectedLifeTotal) * 10000) / 100);

      // 精确计算900个格子的填充情况
      // 每个格子代表：总寿命天数 ÷ 900格
      const daysPerGrid = expectedLifeTotal / this.data.totalGrids;
      // 使用向上取整确保显示完整，不超过总数
      const livedGrids = Math.min(this.data.totalGrids, Math.ceil(preciseDaysLived / daysPerGrid));
      const gridPercentage = Math.min(100, Math.round((livedGrids / this.data.totalGrids) * 10000) / 100);

      // 随机选择一个人生思考问题
      const randomIndex = Math.floor(Math.random() * this.data.lifeQuestions.length);
      const randomQuestion = this.data.lifeQuestions[randomIndex];

      // 更新结果
      this.setData({
        showResult: true,
        daysLived,
        lifeLeft,
        progress,
        livedGrids,
        gridPercentage,
        randomQuestion
      });

      // 保存数据到本地存储
      this.saveData();

      // 添加震动反馈
      wx.vibrateShort();

    } catch (error) {
      console.error('计算失败', error);
      wx.showToast({
        title: '计算失败，请重试',
        icon: 'none'
      });
    }
  },

  // 重置
  reset() {
    this.setData({
      birthDate: '',
      expectedLifeYears: 75,
      showResult: false,
      daysLived: 0,
      lifeLeft: 0,
      progress: 0,
      livedGrids: 0,
      gridPercentage: 0,
      randomQuestion: ''
    });
    // 清除本地存储
    wx.removeStorageSync('lifeCountdownData');
  },

  // 保存数据到本地存储
  saveData() {
    const { birthDate, expectedLifeYears } = this.data;
    wx.setStorageSync('lifeCountdownData', {
      birthDate,
      expectedLifeYears
    });
  },

  // 从本地存储加载数据
  loadData() {
    const data = wx.getStorageSync('lifeCountdownData');
    if (data) {
      this.setData({
        birthDate: data.birthDate || '',
        expectedLifeYears: data.expectedLifeYears || 75
      });
      // 如果有数据，自动计算
      if (data.birthDate) {
        this.calculate();
      }
    }
  },

  // 刷新思考问题
  refreshQuestion() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.data.lifeQuestions.length);
    } while (this.data.lifeQuestions[newIndex] === this.data.randomQuestion && this.data.lifeQuestions.length > 1);
    
    this.setData({
      randomQuestion: this.data.lifeQuestions[newIndex]
    });
    wx.vibrateShort();
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '人生格子 - 每一格都是生命的珍贵时光',
      path: '/packages/life/pages/life-countdown/life-countdown',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '人生格子 - 感知时间流逝，思考生命意义',
      imageUrl: ''
    }
  },

  // 页面加载时执行
  onLoad() {
    this.loadData();
  },

  // 获取每行已填充的格子数
  getRowLivedGrids(rowIndex) {
    const { livedGrids, gridCols } = this.data;
    const startIndex = rowIndex * gridCols;
    const endIndex = Math.min(startIndex + gridCols, livedGrids);
    return Math.max(0, endIndex - startIndex);
  },

  // 获取每格代表的天数文本
  getDaysPerGridText() {
    const { expectedLifeYears, totalGrids } = this.data;
    const expectedLifeTotal = expectedLifeYears * 365.25;
    const daysPerGrid = (expectedLifeTotal / totalGrids).toFixed(3);
    return `${daysPerGrid}天`;
  },

  // 页面显示时执行
  onShow() {
    // 可以在这里添加动画或其他效果
  }
})