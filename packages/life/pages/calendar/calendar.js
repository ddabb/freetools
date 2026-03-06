// packages/life/pages/calendar/calendar.js
Page({
  data: {
    currentDate: '',
    selectedDate: '',
    year: 0,
    month: 0,
    day: 0,
    weekDay: '',
    lunar: '',
    holidays: [],
    showLunar: true
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '万年历'
    })
    const now = new Date()
    this.initCalendar(now.getFullYear(), now.getMonth(), now.getDate())
  },

  initCalendar(year, month, day) {
    const date = new Date(year, month, day)
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

    this.setData({
      year,
      month: month + 1,
      day,
      currentDate: date.toLocaleDateString('zh-CN'),
      selectedDate: date.toLocaleDateString('zh-CN'),
      weekDay: weekDays[date.getDay()],
      lunar: this.getLunarDate(year, month + 1, day)
    })

    this.loadHolidays(year, month + 1)
  },

  getLunarDate(year, month, day) {
    // 简化的农历计算（仅作演示）
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    // 简单算法，实际需要复杂的天文计算
    const lunarMonth = (year * 12 + month) % 12
    const lunarDay = day % 30

    return `农历${lunarMonths[lunarMonth]}${lunarDays[lunarDay]}`
  },

  loadHolidays(year, month) {
    // 简化的节假日数据
    const holidays = this.getMonthHolidays(year, month)
    this.setData({ holidays })
  },

  getMonthHolidays(year, month) {
    const holidays = []

    // 固定节日
    const fixedHolidays = {
      '1-1': '元旦',
      '2-14': '情人节',
      '3-8': '妇女节',
      '3-12': '植树节',
      '4-1': '愚人节',
      '5-1': '劳动节',
      '5-4': '青年节',
      '6-1': '儿童节',
      '7-1': '建党节',
      '8-1': '建军节',
      '9-10': '教师节',
      '10-1': '国庆节',
      '12-25': '圣诞节'
    }

    for (const [date, name] of Object.entries(fixedHolidays)) {
      const [m, d] = date.split('-')
      if (parseInt(m) === month) {
        holidays.push({ day: parseInt(d), name, type: 'fixed' })
      }
    }

    // 节气（简化）
    const solarTerms = [
      { day: 6, name: '小寒', month: 1 },
      { day: 20, name: '大寒', month: 1 },
      { day: 4, name: '立春', month: 2 },
      { day: 19, name: '雨水', month: 2 },
      { day: 6, name: '惊蛰', month: 3 },
      { day: 21, name: '春分', month: 3 },
      { day: 5, name: '清明', month: 4 },
      { day: 20, name: '谷雨', month: 4 },
      { day: 6, name: '立夏', month: 5 },
      { day: 21, name: '小满', month: 5 },
      { day: 6, name: '芒种', month: 6 },
      { day: 21, name: '夏至', month: 6 },
      { day: 7, name: '小暑', month: 7 },
      { day: 23, name: '大暑', month: 7 },
      { day: 8, name: '立秋', month: 8 },
      { day: 23, name: '处暑', month: 8 },
      { day: 8, name: '白露', month: 9 },
      { day: 23, name: '秋分', month: 9 },
      { day: 8, name: '寒露', month: 10 },
      { day: 24, name: '霜降', month: 10 },
      { day: 8, name: '立冬', month: 11 },
      { day: 22, name: '小雪', month: 11 },
      { day: 7, name: '大雪', month: 12 },
      { day: 22, name: '冬至', month: 12 }
    ]

    for (const term of solarTerms) {
      if (term.month === month) {
        holidays.push({ day: term.day, name: term.name, type: 'solar' })
      }
    }

    return holidays
  },

  onDateChange(e) {
    const date = new Date(e.detail.value)
    this.initCalendar(date.getFullYear(), date.getMonth(), date.getDate())
  },

  toggleLunar() {
    this.setData({
      showLunar: !this.data.showLunar
    })
  },

  today() {
    const now = new Date()
    this.initCalendar(now.getFullYear(), now.getMonth(), now.getDate())
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '万年历 - 查看日历和农历',
      path: '/packages/life/pages/calendar/calendar',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '万年历 - 查看日历和农历',
      imageUrl: ''
    }
  }
})
