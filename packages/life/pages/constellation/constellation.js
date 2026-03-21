// 星座查询页面
Page({
  data: {
    currentDate: '',
    year: 1990,
    month: 1,
    day: 1,
    constellationName: '摩羯座',
    constellationIcon: '🐐',
    constellationDate: '12.22 - 1.19',
    constellationData: null,
    constellationItems: [],
    pickerRange: [
      ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      ['1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', '10日', '11日', '12日', '13日', '14日', '15日', '16日', '17日', '18日', '19日', '20日', '21日', '22日', '23日', '24日', '25日', '26日', '27日', '28日', '29日', '30日', '31日']
    ],
    pickerValue: [0, 0]
  },

  // 星座详细数据
  constellationInfo: {
    "白羊座": {
      icon: "🐏",
      date: "3.21 - 4.19",
      personality: "白羊座的人充满活力和热情，性格直率勇敢，喜欢挑战和创新。他们是天生的领导者，具有强烈的竞争意识和进取精神。",
      love: "白羊座在爱情中热情主动，喜欢追求刺激和新鲜感。他们敢于表达自己的感情，但有时可能过于冲动。",
      career: "适合从事需要创新和领导能力的工作，如企业家、销售、运动员等。白羊座的执行力很强，适合开创新事业。",
      luckyNumber: "9",
      luckyColor: "红色",
      luckyDay: "星期二"
    },
    "金牛座": {
      icon: "🐂",
      date: "4.20 - 5.20",
      personality: "金牛座的人稳重务实，注重物质享受和安全感。他们有耐心，做事踏实可靠，但有时可能过于固执。",
      love: "金牛座在爱情中忠诚专一，追求稳定和长久的关系。他们喜欢被照顾，也会细心呵护伴侣。",
      career: "适合从事财务、艺术、烹饪等需要耐心和稳定性的工作。金牛座的人善于理财和资源管理。",
      luckyNumber: "6",
      luckyColor: "绿色",
      luckyDay: "星期五"
    },
    "双子座": {
      icon: "👯",
      date: "5.21 - 6.21",
      personality: "双子座的人聪明灵活，思维敏捷，善于沟通和表达。他们兴趣广泛，爱好多样，但有时可能缺乏专注。",
      love: "双子座在爱情中追求新鲜感和刺激，喜欢有趣的对话和思想交流。他们善于表达，但可能难以安定下来。",
      career: "适合从事媒体、教育、销售等需要沟通能力的工作。双子座思维活跃，善于应对变化。",
      luckyNumber: "3",
      luckyColor: "黄色",
      luckyDay: "星期三"
    },
    "巨蟹座": {
      icon: "🦀",
      date: "6.22 - 7.22",
      personality: "巨蟹座的人温柔细腻，重感情，善于照顾他人。他们家庭观念强，富有同情心，但有时可能过于敏感。",
      love: "巨蟹座在爱情中深情专一，渴望长期的稳定关系。他们会全心全意照顾伴侣和家庭。",
      career: "适合从事护理、教育、餐饮等需要关怀和服务精神的工作。巨蟹座善于照顾他人需求。",
      luckyNumber: "8",
      luckyColor: "银色",
      luckyDay: "星期一"
    },
    "狮子座": {
      icon: "🦁",
      date: "7.23 - 8.22",
      personality: "狮子座的人自信大方，喜欢成为焦点，具有领导才能。他们慷慨热情，但有时可能过于骄傲。",
      love: "狮子座在爱情中热情浪漫，喜欢被赞美和欣赏。他们会为伴侣创造惊喜和浪漫。",
      career: "适合从事管理、艺术表演、演艺等需要展现魅力的工作。狮子座善于激励和领导团队。",
      luckyNumber: "5",
      luckyColor: "金色",
      luckyDay: "星期日"
    },
    "处女座": {
      icon: "👸",
      date: "8.23 - 9.22",
      personality: "处女座的人追求完美，注重细节，做事认真负责。他们善于分析，有批判精神，但有时可能过于挑剔。",
      love: "处女座在爱情中忠诚可靠，追求稳定和理想的关系。他们会用心照顾伴侣的方方面面。",
      career: "适合从事财务、医疗、编辑等需要精细和严谨的工作。处女座善于发现问题和改进流程。",
      luckyNumber: "4",
      luckyColor: "蓝色",
      luckyDay: "星期三"
    },
    "天秤座": {
      icon: "⚖️",
      date: "9.23 - 10.23",
      personality: "天秤座的人优雅和谐，追求平衡，善于社交。他们公正客观，但有时可能犹豫不决。",
      love: "天秤座在爱情中追求浪漫和美感，注重伴侣的外表和气质。他们善于调和关系中的矛盾。",
      career: "适合从事设计、法律、外交等需要协调能力和审美的工作。天秤座善于处理人际关系。",
      luckyNumber: "6",
      luckyColor: "粉色",
      luckyDay: "星期五"
    },
    "天蝎座": {
      icon: "🦂",
      date: "10.24 - 11.22",
      personality: "天蝎座的人深沉神秘，意志坚定，情感强烈。他们洞察力强，但有时可能过于占有欲强。",
      love: "天蝎座在爱情中热情执着，追求深度的情感连接。他们一旦爱上就会全身心投入。",
      career: "适合从事研究、侦探、心理等需要深入分析的工作。天蝎座有很强的意志力和洞察力。",
      luckyNumber: "9",
      luckyColor: "黑色",
      luckyDay: "星期二"
    },
    "射手座": {
      icon: "🏹",
      date: "11.23 - 12.21",
      personality: "射手座的人乐观开朗，追求自由，热爱冒险。他们幽默风趣，但有时可能缺乏责任感。",
      love: "射手座在爱情中热情浪漫，喜欢追求和探索。他们需要伴侣给予足够的自由空间。",
      career: "适合从事旅游、探险、户外运动等需要冒险精神的工作。射手座喜欢新鲜刺激的挑战。",
      luckyNumber: "3",
      luckyColor: "紫色",
      luckyDay: "星期四"
    },
    "摩羯座": {
      icon: "🐐",
      date: "12.22 - 1.19",
      personality: "摩羯座的人稳重踏实，有责任感，追求成功。他们勤奋努力，但有时可能过于严肃。",
      love: "摩羯座在爱情中忠诚可靠，追求稳定和长期的关系。他们不善于表达情感，但内心深处热情。",
      career: "适合从事管理、金融、工程等需要稳定和计划性的工作。摩羯座有很强的目标和执行力。",
      luckyNumber: "8",
      luckyColor: "深蓝色",
      luckyDay: "星期六"
    },
    "水瓶座": {
      icon: "🏺",
      date: "1.20 - 2.18",
      personality: "水瓶座的人独立创新，思维独特，追求自由。他们人道主义，但有时可能过于叛逆。",
      love: "水瓶座在爱情中追求精神层面的契合，重视友谊和思想的交流。他们需要保持个人独立性。",
      career: "适合从事科技、发明、艺术等需要创新思维的工作。水瓶座善于打破常规，提出新想法。",
      luckyNumber: "4",
      luckyColor: "天蓝色",
      luckyDay: "星期六"
    },
    "双鱼座": {
      icon: "🐟",
      date: "2.19 - 3.20",
      personality: "双鱼座的人温柔浪漫，富有同情心，富有想象力。他们艺术气质浓厚，但有时可能逃避现实。",
      love: "双鱼座在爱情中深情浪漫，渴望灵魂伴侣。他们会为爱牺牲一切，情感丰富细腻。",
      career: "适合从事艺术、音乐、写作等需要创造力和情感表达的工作。双鱼座有很强的艺术天赋。",
      luckyNumber: "7",
      luckyColor: "海蓝色",
      luckyDay: "星期一"
    }
  },

  // 星座日期范围（按月份日份）
  constellationDates: [
    { name: "摩羯座", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { name: "水瓶座", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { name: "双鱼座", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { name: "白羊座", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { name: "金牛座", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { name: "双子座", startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
    { name: "巨蟹座", startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
    { name: "狮子座", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { name: "处女座", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { name: "天秤座", startMonth: 9, startDay: 23, endMonth: 10, endDay: 23 },
    { name: "天蝎座", startMonth: 10, startDay: 24, endMonth: 11, endDay: 22 },
    { name: "射手座", startMonth: 11, startDay: 23, endMonth: 12, endDay: 21 }
  ],

  // 根据日期获取星座
  getConstellation: function(month, day) {
    for (const item of this.constellationDates) {
      let isMatch = false;
      if (item.startMonth === item.endMonth) {
        isMatch = month === item.startMonth && day >= item.startDay && day <= item.endDay;
      } else if (item.startMonth < item.endMonth) {
        isMatch = (month === item.startMonth && day >= item.startDay) || 
                  (month === item.endMonth && day <= item.endDay) ||
                  (month > item.startMonth && month < item.endMonth);
      } else {
        isMatch = (month === item.startMonth && day >= item.startDay) || 
                  (month === item.endMonth && day <= item.endDay) ||
                  (month > item.startMonth) || (month < item.endMonth);
      }
      if (isMatch) {
        return item.name;
      }
    }
    return "摩羯座";
  },

  // 初始化星座列表
  initConstellationList: function() {
    const items = [];
    const constellations = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", 
                             "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
    for (const name of constellations) {
      items.push({
        name: name,
        icon: this.constellationInfo[name].icon,
        date: this.constellationInfo[name].date
      });
    }
    return items;
  },

  // 初始化日期选择器范围
  initPickerRange: function() {
    // 生成月份数组
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i + '月');
    }
    
    // 生成日期数组（默认1月）
    const days = [];
    const daysInMonth = new Date(2000, 1, 0).getDate(); // 2000年1月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i + '日');
    }
    
    return [months, days];
  },

  // 更新日期选择器的日期范围
  updateDayRange: function(month) {
    const days = [];
    const daysInMonth = new Date(2000, month, 0).getDate(); // 获取指定月份的天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i + '日');
    }
    return days;
  },

  // 更新查询结果
  updateResult: function(month, day) {
    const constellationName = this.getConstellation(month, day);
    const constellationData = this.constellationInfo[constellationName];

    this.setData({
      month: month,
      day: day,
      constellationName: constellationName,
      constellationIcon: constellationData.icon,
      constellationDate: constellationData.date,
      constellationData: constellationData
    });
  },

  // 处理阳历日期选择器变化
  onDateChange: function(e) {
    const value = e.detail.value;
    const month = value[0] + 1;
    const day = value[1] + 1;
    
    this.setData({
      month: month,
      day: day,
      pickerValue: value
    });
    this.updateResult(month, day);
  },

  // 处理日期选择器列变化
  onPickerColumnChange: function(e) {
    const column = e.detail.column;
    const value = e.detail.value;
    
    if (column === 0) {
      // 月份变化，更新日期范围
      const newMonth = value + 1;
      const newDays = this.updateDayRange(newMonth);
      
      this.setData({
        'pickerRange[1]': newDays,
        'pickerValue[0]': value,
        'pickerValue[1]': 0 // 重置日期为1号
      });
    }
  },

  // 处理月份输入
  onMonthInput: function(e) {
    const month = parseInt(e.detail.value);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      this.setData({ month: month });
    }
  },

  // 处理日期输入
  onDayInput: function(e) {
    const day = parseInt(e.detail.value);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      this.setData({ day: day });
    }
  },

  // 处理查询按钮点击
  onQuery: function() {
    const { month, day } = this.data;
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      wx.showToast({
        title: '请输入有效日期',
        icon: 'none'
      });
      return;
    }
    this.updateResult(month, day);
  },

  // 处理星座列表项点击
  onConstellationItemClick: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const items = this.data.constellationItems;
    const name = items[index].name;
    const info = this.constellationInfo[name];
    
    // 解析日期范围
    const dateParts = info.date.split(' - ');
    const startParts = dateParts[0].split('.');
    const endParts = dateParts[1].split('.');
    
    const month = parseInt(startParts[0]);
    const day = parseInt(startParts[1]);
    const year = this.data.year;
    const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    this.setData({
      currentDate: currentDate,
      month: month,
      day: day,
      constellationName: name,
      constellationIcon: info.icon,
      constellationDate: info.date,
      constellationData: info
    });
  },

  // 页面加载时初始化
  onLoad: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const pickerValue = [month - 1, day - 1];
    
    this.setData({
      currentDate: currentDate,
      year: year,
      month: month,
      day: day,
      constellationItems: this.initConstellationList(),
      pickerValue: pickerValue
    });
    this.updateResult(month, day);
  },

  // 跳转到日历页面
  goToCalendar: function() {
    wx.navigateTo({
      url: '/packages/life/pages/calendar/calendar'
    });
  },

  // 跳转到生肖页面
  goToZodiac: function() {
    wx.navigateTo({
      url: '/packages/life/pages/zodiac/zodiac'
    });
  }
});
