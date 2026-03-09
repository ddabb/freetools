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
    rowsArray: [], // 行数组用于循环
    colsArray: [], // 列数组用于循环

    currentYear: new Date().getFullYear(), // 当前年份
// 人生思考引导问题
  questions: [
    {
      text: "如果生命只剩下一年，你最想做什么？",
      hint: "静下心来，认真思考这个问题。生命有限，别让时光在无意识中溜走。"
    },
    {
      text: "什么让你感到真正的快乐和满足？",
      hint: "真正的幸福往往来自内心深处的满足感。"
    },
    {
      text: "你是否在为自己而活，还是活在别人的期待里？",
      hint: "勇敢地活出真实的自己，而不是被他人定义。"
    },
    {
      text: "有什么事情是你一直想做却迟迟未行动的？",
      hint: "别让犹豫成为你人生的遗憾。"
    },
    {
      text: "你希望被记住的是一个怎样的人？",
      hint: "思考你留给世界的印记。"
    },
    {
      text: "什么是你愿意为之奋斗一生的目标？",
      hint: "找到你的使命，为之全力以赴。"
    },
    {
      text: "你最近一次因为专注而忘记时间是什么时候？",
      hint: "那种沉浸其中的感觉就是真正的热爱。"
    },
    {
      text: "如果金钱不是问题，你会如何度过余生？",
      hint: "这能帮助你发现真正重要的事情。"
    },
    {
      text: "你觉得自己最大的天赋或优势是什么？",
      hint: "认识并发挥你的独特之处。"
    },
    {
      text: "你想给这个世界留下什么？",
      hint: "思考你的人生价值和贡献。"
    }
  ],
  currentIndex: 0
  },

  // 设置出生日期
  setBirthDate(e) {
    this.setData({
      birthDate: e.detail.value
    });
  },

  // 设置预计寿命
  setExpectedLifeYears(e) {
    const inputValue = e.detail.value;
    if (inputValue === '') {
      // 允许清空输入框
      this.setData({
        expectedLifeYears: ''
      });
      return;
    }
    const value = parseInt(inputValue);
    if (isNaN(value) || value < 1 || value > 120) {
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
    const { birthDate, expectedLifeYears = 75 } = this.data;
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
    const finalExpectedLife = expectedLifeYears || 75;
    if (finalExpectedLife < 1 || finalExpectedLife > 120) {
      wx.showToast({
        title: '预期寿命应在1-120岁之间',
        icon: 'none'
      });
      return;
    }

    try {
      console.log('=== 人生格子计算开始 ===');
      console.log('出生日期:', birthDate);
      console.log('预期寿命:', finalExpectedLife, '岁');
      console.log('当前日期:', today.toISOString());

      // 计算已活天数（精确到小数）
      const preciseDaysLived = (today - birth) / (1000 * 60 * 60 * 24);
      const daysLived = Math.floor(preciseDaysLived);
      console.log('精确已活天数:', preciseDaysLived);
      console.log('已活天数:', daysLived);

      // 计算预期寿命总天数
      const expectedLifeTotal = finalExpectedLife * 365.25;
      const lifeLeft = Math.max(0, Math.floor(expectedLifeTotal - preciseDaysLived));
      console.log('预期寿命总天数:', expectedLifeTotal);
      console.log('剩余天数:', lifeLeft);

      // 计算人生进度百分比
      const progress = Math.min(100, Math.round((preciseDaysLived / expectedLifeTotal) * 10000) / 100);
      console.log('人生进度百分比:', progress, '%');

      // 精确计算900个格子的填充情况
      // 每个格子代表：总寿命天数 ÷ 900格
      const daysPerGrid = expectedLifeTotal / this.data.totalGrids;
      console.log('总格子数:', this.data.totalGrids);
      console.log('每格代表天数:', daysPerGrid);
      
      // 使用精确计算，确保格子数量正确
      const livedGrids = Math.min(this.data.totalGrids, Math.ceil(preciseDaysLived / daysPerGrid));
      const gridPercentage = Math.min(100, Math.round((livedGrids / this.data.totalGrids) * 10000) / 100);
      console.log('已填充格子数:', livedGrids);
      console.log('格子百分比:', gridPercentage, '%');

      // 检查计算结果是否合理
      if (livedGrids > this.data.totalGrids) {
        console.error('警告: 已填充格子数超过总格子数', { livedGrids, totalGrids: this.data.totalGrids });
      }
      if (gridPercentage > 100) {
        console.error('警告: 格子百分比超过100%', { gridPercentage });
      }

// 计算每格代表的天数文本
    let daysPerGridText = '2.67天'; // 默认值
    
    if (finalExpectedLife && this.data.totalGrids && finalExpectedLife > 0 && this.data.totalGrids > 0) {
      const expectedLifeTotal = finalExpectedLife * 365.25;
      const daysPerGrid = (expectedLifeTotal / this.data.totalGrids);
      daysPerGridText = `${daysPerGrid.toFixed(3)}天`;
    }
    
    console.log('每格代表天数文本:', daysPerGridText);

// 设置初始问题索引
    const randomIndex = Math.floor(Math.random() * this.data.questions.length);
    this.setData({
      currentIndex: randomIndex
    });
    console.log('随机问题索引:', randomIndex);

      // 更新结果
      this.setData({
        showResult: true,
        daysLived,
        lifeLeft,
        progress,
        livedGrids,
        gridPercentage,
        daysPerGridText, // 添加这个字段
        currentIndex: 0
      });

      // 保存数据到本地存储
      this.saveData();

      console.log('=== 人生格子计算结束 ===');

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
      // 确保expectedLifeYears有值
      const finalExpectedLife = data.expectedLifeYears || 75;
      
      this.setData({
        birthDate: data.birthDate || '',
        expectedLifeYears: finalExpectedLife
      });
      
      // 如果有数据，自动计算
      if (data.birthDate) {
        this.calculate();
      }
    } else {
      // 没有存储数据时，设置默认值
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const defaultBirthDate = tenYearsAgo.toISOString().split('T')[0];
      
      this.setData({
        birthDate: defaultBirthDate,
        expectedLifeYears: 75
      });
      
      this.calculate();
    }
  },

  // 切换到下一个问题
  nextQuestion() {
    const newIndex = (this.data.currentIndex + 1) % this.data.questions.length;
    this.setData({
      currentIndex: newIndex
    });
  },

  // 切换到上一个问题
  prevQuestion() {
    const newIndex = (this.data.currentIndex - 1 + this.data.questions.length) % this.data.questions.length;
    this.setData({
      currentIndex: newIndex
    });
  },

  // 自动轮播（可选）
  startAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
    }
    this.autoPlayTimer = setInterval(() => {
      this.nextQuestion();
    }, 5000); // 5秒切换一次
  },

  // 停止自动轮播
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
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
    this.initArrays();
    
    // 设置10年前的默认出生日期
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const defaultBirthDate = tenYearsAgo.toISOString().split('T')[0];
    
    // 从本地存储加载数据
    const storedData = wx.getStorageSync('lifeCountdownData');
    
    if (storedData) {
      // 使用存储的数据，确保expectedLifeYears有默认值
      const finalExpectedLife = storedData.expectedLifeYears || 75;
      this.setData({
        birthDate: storedData.birthDate || defaultBirthDate,
        expectedLifeYears: finalExpectedLife
      });
    } else {
      // 使用默认值
      this.setData({
        birthDate: defaultBirthDate,
        expectedLifeYears: 75
      });
    }
    
    // 确保数据已设置后再计算
    this.calculate();
    
    // 记录日志
    const finalExpectedLife = this.data.expectedLifeYears || 75;
    console.log('使用数据: 出生日期:', this.data.birthDate, '预期寿命:', finalExpectedLife);
  },

  // 初始化数组
  initArrays() {
    const { gridRows, gridCols } = this.data;
    const rowsArray = Array.from({ length: gridRows }, (_, index) => index);
    const colsArray = Array.from({ length: gridCols }, (_, index) => index);
    this.setData({
      rowsArray,
      colsArray
    });
  },



  // 获取每格代表的天数文本
  getDaysPerGridText() {
    // 这个函数现在主要是为了兼容性，实际数据通过 daysPerGridText 属性提供
    console.log('getDaysPerGridText 被调用，当前数据:', this.data);
    const { daysPerGridText } = this.data;
    
    if (!daysPerGridText) {
      console.log('getDaysPerGridText: 没有找到 daysPerGridText，返回默认值');
      return '约2.67天';
    }
    
    return daysPerGridText;
  },

  // 格子点击事件
  onGridTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const { livedGrids } = this.data;
    
    // 如果点击的是正在经历的格子，显示提示
    if (index === livedGrids - 1 && livedGrids > 0) {
      wx.showToast({
        title: '这就是你现在正在经历的时光！',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 页面显示时执行
  onShow() {
    this.startAutoPlay();
  },

  // 页面隐藏时执行
  onHide() {
    this.stopAutoPlay();
  },

  // 页面卸载时执行
  onUnload() {
    this.stopAutoPlay();
  }
})