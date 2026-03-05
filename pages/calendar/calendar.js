// calendar.js
Page({
  data: {
    currentDate: '', // 当前日期
    calendarDays: [] // 日历天数
  },
  
  onLoad() {
    // 初始化日历
    this.initCalendar();
  },
  
  // 初始化日历
  initCalendar() {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    
    // 生成日历天数
    const calendarDays = this.generateCalendarDays(today);
    
    this.setData({
      currentDate,
      calendarDays
    });
  },
  
  // 生成日历天数
  generateCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 获取当月第一天
    const firstDay = new Date(year, month, 1);
    // 获取当月最后一天
    const lastDay = new Date(year, month + 1, 0);
    // 获取当月第一天是星期几
    const firstDayOfWeek = firstDay.getDay();
    // 获取当月天数
    const daysInMonth = lastDay.getDate();
    
    // 生成日历天数
    const calendarDays = [];
    
    // 添加上个月的天数
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonthLastDay - i,
        isOtherMonth: true
      });
    }
    
    // 添加当月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      calendarDays.push({
        day: i,
        isToday,
        isOtherMonth: false,
        lunarDate: '初一' // 这里仅做模拟，实际开发中需要实现农历转换
      });
    }
    
    // 添加下个月的天数
    const remainingDays = 42 - calendarDays.length; // 6行7列，共42个格子
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        day: i,
        isOtherMonth: true
      });
    }
    
    return calendarDays;
  }
})