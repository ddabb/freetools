// 星座查询页面
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data';
const CONSTELLATION_KEY = 'constellation_info';
const CONSTELLATION_TS_KEY = 'constellation_info_ts';
const CACHE_EXPIRE = 30 * 24 * 60 * 60 * 1000; // 30天

const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
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
    pickerValue: [0, 0],
    loading: true
  },

  // 星座数据（从CDN加载后存储）
  constellationInfo: null,
  constellationDates: null,

  // 本地备用数据
  localConstellationInfo: {
    "白羊座": { icon: "♈", emoji: "🐏", date: "3.21 - 4.19", personality: "白羊座的人充满活力和热情，性格直率勇敢。", love: "热情主动，喜欢追求刺激。", career: "适合从事需要创新和领导能力的工作。", luckyNumber: "9", luckyColor: "红色", luckyDay: "星期二" },
    "金牛座": { icon: "♉", emoji: "🐂", date: "4.20 - 5.20", personality: "金牛座的人稳重务实，注重物质享受和安全感。", love: "忠诚专一，追求稳定和长久的关系。", career: "适合从事财务、艺术等需要耐心的工作。", luckyNumber: "6", luckyColor: "绿色", luckyDay: "星期五" },
    "双子座": { icon: "♊", emoji: "👯", date: "5.21 - 6.21", personality: "双子座的人聪明灵活，思维敏捷。", love: "追求新鲜感和刺激。", career: "适合从事媒体、教育等需要沟通能力的工作。", luckyNumber: "3", luckyColor: "黄色", luckyDay: "星期三" },
    "巨蟹座": { icon: "♋", emoji: "🦀", date: "6.22 - 7.22", personality: "巨蟹座的人温柔细腻，重感情。", love: "深情专一，渴望长期的稳定关系。", career: "适合从事护理、教育等工作。", luckyNumber: "8", luckyColor: "银色", luckyDay: "星期一" },
    "狮子座": { icon: "♌", emoji: "🦁", date: "7.23 - 8.22", personality: "狮子座的人自信大方，喜欢成为焦点。", love: "热情浪漫，喜欢被赞美。", career: "适合从事管理、艺术表演等工作。", luckyNumber: "5", luckyColor: "金色", luckyDay: "星期日" },
    "处女座": { icon: "♍", emoji: "👸", date: "8.23 - 9.22", personality: "处女座的人追求完美，注重细节。", love: "忠诚可靠，追求理想的关系。", career: "适合从事财务、医疗等需要精细的工作。", luckyNumber: "4", luckyColor: "蓝色", luckyDay: "星期三" },
    "天秤座": { icon: "♎", emoji: "⚖️", date: "9.23 - 10.23", personality: "天秤座的人优雅和谐，追求平衡。", love: "追求浪漫和美感。", career: "适合从事设计、法律等工作。", luckyNumber: "6", luckyColor: "粉色", luckyDay: "星期五" },
    "天蝎座": { icon: "♏", emoji: "🦂", date: "10.24 - 11.22", personality: "天蝎座的人深沉神秘，意志坚定。", love: "热情执着，追求深度的情感连接。", career: "适合从事研究、心理等工作。", luckyNumber: "9", luckyColor: "黑色", luckyDay: "星期二" },
    "射手座": { icon: "♐", emoji: "🏹", date: "11.23 - 12.21", personality: "射手座的人乐观开朗，追求自由。", love: "热情浪漫，需要自由空间。", career: "适合从事旅游、探险等工作。", luckyNumber: "3", luckyColor: "紫色", luckyDay: "星期四" },
    "摩羯座": { icon: "♑", emoji: "🐐", date: "12.22 - 1.19", personality: "摩羯座的人稳重踏实，有责任感。", love: "忠诚可靠，追求稳定的关系。", career: "适合从事管理、金融等工作。", luckyNumber: "8", luckyColor: "深蓝色", luckyDay: "星期六" },
    "水瓶座": { icon: "♒", emoji: "🏺", date: "1.20 - 2.18", personality: "水瓶座的人独立创新，思维独特。", love: "追求精神层面的契合。", career: "适合从事科技、发明等工作。", luckyNumber: "4", luckyColor: "天蓝色", luckyDay: "星期六" },
    "双鱼座": { icon: "♓", emoji: "🐟", date: "2.19 - 3.20", personality: "双鱼座的人温柔浪漫，富有同情心。", love: "深情浪漫，渴望灵魂伴侣。", career: "适合从事艺术、音乐等工作。", luckyNumber: "7", luckyColor: "海蓝色", luckyDay: "星期一" }
  },

  localDateRanges: [
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

  // 加载星座数据
  loadConstellationData() {
    const now = Date.now();
    const cached = wx.getStorageSync(CONSTELLATION_KEY);
    const timestamp = wx.getStorageSync(CONSTELLATION_TS_KEY);

    // 检查缓存是否有效
    if (cached && timestamp && (now - timestamp < CACHE_EXPIRE)) {
      console.debug('[constellation] 使用缓存数据');
      this.setConstellationData(cached);
      return;
    }

    // 从CDN加载
    console.debug('[constellation] 从CDN加载');
    wx.request({
      url: `${CDN_BASE}/constellation-info.json`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.constellations) {
          // 保存到缓存
          wx.setStorageSync(CONSTELLATION_KEY, res.data);
          wx.setStorageSync(CONSTELLATION_TS_KEY, now);
          this.setConstellationData(res.data);
        } else {
          this.useLocalData();
        }
      },
      fail: (err) => {
        console.warn('[constellation] CDN加载失败，使用本地数据', err);
        this.useLocalData();
      }
    });
  },

  // 设置星座数据
  setConstellationData(data) {
    this.constellationInfo = data.constellations;
    this.constellationDates = data.dateRanges;
    
    this.setData({
      loading: false,
      constellationItems: this.initConstellationList()
    });
    
    // 初始化查询结果
    this.updateResult(this.data.month, this.data.day);
  },

  // 使用本地备用数据
  useLocalData() {
    this.constellationInfo = this.localConstellationInfo;
    this.constellationDates = this.localDateRanges;
    
    this.setData({
      loading: false,
      constellationItems: this.initConstellationList()
    });
    
    this.updateResult(this.data.month, this.data.day);
  },

  // 根据日期获取星座
  getConstellation: function(month, day) {
    if (!this.constellationDates) return "摩羯座";
    
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
    if (!this.constellationInfo) return [];
    
    const items = [];
    const constellations = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", 
                             "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
    for (const name of constellations) {
      const info = this.constellationInfo[name];
      if (info) {
        items.push({
          name: name,
          icon: info.icon || info.emoji,
          date: info.date
        });
      }
    }
    return items;
  },

  // 更新查询结果
  updateResult: function(month, day) {
    if (!this.constellationInfo) return;
    
    const constellationName = this.getConstellation(month, day);
    const constellationData = this.constellationInfo[constellationName];

    if (constellationData) {
      this.setData({
        month: month,
        day: day,
        constellationName: constellationName,
        constellationIcon: constellationData.icon || constellationData.emoji,
        constellationDate: constellationData.date,
        constellationData: constellationData
      });
    }
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
      const daysInMonth = new Date(2000, newMonth, 0).getDate();
      const newDays = [];
      for (let i = 1; i <= daysInMonth; i++) {
        newDays.push(i + '日');
      }
      
      this.setData({
        'pickerRange[1]': newDays,
        'pickerValue[0]': value,
        'pickerValue[1]': 0
      });
    }
  },

  // 处理星座列表项点击
  onConstellationItemClick: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const items = this.data.constellationItems;
    if (!items[index]) return;
    
    const name = items[index].name;
    const info = this.constellationInfo[name];
    
    if (info) {
      // 解析日期范围
      const dateParts = info.date.split(' - ');
      const startParts = dateParts[0].split('.');
      const month = parseInt(startParts[0]);
      const day = parseInt(startParts[1]);
      const year = this.data.year;
      const currentDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      this.setData({
        currentDate: currentDate,
        month: month,
        day: day,
        constellationName: name,
        constellationIcon: info.icon || info.emoji,
        constellationDate: info.date,
        constellationData: info
      });
    }
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
      pickerValue: pickerValue
    });
    
    // 加载星座数据
    this.loadConstellationData();
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
  },

  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    // 清空缓存
    wx.clearStorageSync();
    // 重新加载数据
    this.loadConstellationData();
    wx.stopPullDownRefresh();
  }
});
