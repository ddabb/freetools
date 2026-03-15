// 生肖查询页面
Page({
  data: {
    year: 1966,
    zodiacName: '午马',
    zodiacIcon: '🐴',
    birthYearInfo: '1966年出生 今年61岁',
    zodiacItems: []
  },

  // 生肖数据
  zodiacData: {
    "鼠": { icon: "🐭", order: 1 },
    "牛": { icon: "🐂", order: 2 },
    "虎": { icon: "🐯", order: 3 },
    "兔": { icon: "🐰", order: 4 },
    "龙": { icon: "🐉", order: 5 },
    "蛇": { icon: "🐍", order: 6 },
    "马": { icon: "🐴", order: 7 },
    "羊": { icon: "🐏", order: 8 },
    "猴": { icon: "🐒", order: 9 },
    "鸡": { icon: "🐔", order: 10 },
    "狗": { icon: "🐶", order: 11 },
    "猪": { icon: "🐷", order: 12 }
  },

  // 生肖中文名称与地支对应关系
  zodiacEarthlyBranches: {
    "鼠": "子鼠", "牛": "丑牛", "虎": "寅虎", "兔": "卯兔",
    "龙": "辰龙", "蛇": "巳蛇", "马": "午马", "羊": "未羊",
    "猴": "申猴", "鸡": "酉鸡", "狗": "戌狗", "猪": "亥猪"
  },

  // 根据年份计算生肖
  getZodiac: function(year) {
    const zodiacs = ["猴", "鸡", "狗", "猪", "鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊"];
    return zodiacs[year % 12];
  },

  // 根据年份计算年龄
  getAge: function(year) {
    const currentYear = 2026; // 根据当前日期
    return currentYear - year;
  },

  // 更新查询结果
  updateResult: function(year) {
    const zodiac = this.getZodiac(year);
    const age = this.getAge(year);
    const zodiacName = this.zodiacEarthlyBranches[zodiac];
    const zodiacIcon = this.zodiacData[zodiac].icon;
    const birthYearInfo = `${year}年出生 今年${age}岁`;

    // 生成该生肖的其他年龄对应的年份
    const zodiacItems = [];
    const currentYear = 2026;
    
    // 生成比当前年份小的年份（年龄更大）
    for (let i = 1; i <= 6; i++) {
      const pastYear = year - i * 12;
      const pastAge = currentYear - pastYear;
      zodiacItems.push({ year: pastYear, name: zodiac, icon: zodiacIcon, age: pastAge });
    }
    
    // 生成比当前年份大的年份（年龄更小）
    for (let i = 1; i <= 2; i++) {
      const futureYear = year + i * 12;
      const futureAge = currentYear - futureYear;
      zodiacItems.unshift({ year: futureYear, name: zodiac, icon: zodiacIcon, age: Math.abs(futureAge) });
    }

    this.setData({
      zodiacName: zodiacName,
      zodiacIcon: zodiacIcon,
      birthYearInfo: birthYearInfo,
      zodiacItems: zodiacItems
    });
  },

  // 处理年份输入
  onYearInput: function(e) {
    const year = parseInt(e.detail.value);
    if (!isNaN(year)) {
      this.setData({ year: year });
    }
  },

  // 处理查询按钮点击
  onQuery: function() {
    const year = this.data.year;

    // 验证输入
    if (isNaN(year)) {
      wx.showToast({
        title: '请输入有效的年份',
        icon: 'none'
      });
      this.setData({ year: 1966 });
      return;
    }

    this.updateResult(year);
  },

  // 处理生肖列表项点击
  onZodiacItemClick: function(e) {
    const year = parseInt(e.currentTarget.dataset.year);
    this.setData({ year: year });
    this.updateResult(year);
  },

  // 页面加载时初始化
  onLoad: function() {
    this.updateResult(this.data.year);
  },

  // 处理输入框回车键
  onYearInputConfirm: function(e) {
    this.onQuery();
  }
});