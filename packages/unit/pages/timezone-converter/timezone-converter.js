// packages/unit/pages/timezone-converter/timezone-converter.js
Page({
  data: {
    timezones: [
      'UTC-12:00 (国际日期变更线西)',
      'UTC-11:00 (萨摩亚)',
      'UTC-10:00 (夏威夷)',
      'UTC-09:00 (阿拉斯加)',
      'UTC-08:00 (太平洋时间)',
      'UTC-07:00 (山地时间)',
      'UTC-06:00 (中部时间)',
      'UTC-05:00 (东部时间)',
      'UTC-04:00 (大西洋时间)',
      'UTC-03:00 (巴西利亚)',
      'UTC-02:00 (中大西洋)',
      'UTC-01:00 (亚速尔群岛)',
      'UTC+00:00 (格林威治)',
      'UTC+01:00 (欧洲中部)',
      'UTC+02:00 (欧洲东部)',
      'UTC+03:00 (莫斯科)',
      'UTC+04:00 (阿布扎比)',
      'UTC+05:00 (伊斯兰堡)',
      'UTC+06:00 (达卡)',
      'UTC+07:00 (曼谷)',
      'UTC+08:00 (北京)',
      'UTC+09:00 (东京)',
      'UTC+10:00 (悉尼)',
      'UTC+11:00 (所罗门群岛)',
      'UTC+12:00 (奥克兰)'
    ],
    baseDate: '',
    baseTime: '',
    timezoneValues: []
  },

  onLoad: function() {
    // 初始化当前日期和时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.setData({
      baseDate: `${year}-${month}-${day}`,
      baseTime: `${hours}:${minutes}`
    });
    
    // 初始转换所有时区
    this.updateAllTimezones();
  },

  onBaseDateChange: function(e) {
    this.setData({ baseDate: e.detail.value });
    this.updateAllTimezones();
  },

  onBaseTimeChange: function(e) {
    // 确保输入的时间格式正确
    const value = e.detail.value;
    if (/^\d{2}:\d{2}$/.test(value)) {
      this.setData({ baseTime: value });
      this.updateAllTimezones();
    }
  },

  onTimezoneValueChange: function(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const value = e.detail.value;
    
    // 解析输入的时间
    const timeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!timeMatch) return;
    
    const [, year, month, day, hours, minutes] = timeMatch;
    
    // 解析当前时区的偏移量
    const timezone = this.data.timezones[index];
    const offsetMatch = timezone.match(/UTC([+-]\d{2}):(\d{2})/);
    if (!offsetMatch) return;
    
    const offsetHours = parseInt(offsetMatch[1]);
    const offsetMinutes = parseInt(offsetMatch[2]);
    const offset = offsetHours * 60 + offsetMinutes;
    
    // 计算UTC时间
    const localDate = new Date(year, month - 1, day, hours, minutes);
    const utcTime = localDate.getTime() - (offset * 60 * 1000);
    
    // 转换为UTC时间对象
    const utcDate = new Date(utcTime);
    
    // 设置基准时间（UTC时间）
    this.setData({
      baseDate: `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')}`,
      baseTime: `${String(utcDate.getUTCHours()).padStart(2, '0')}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`
    });
    
    // 更新所有时区
    this.updateAllTimezones();
  },

  updateAllTimezones: function() {
    const { baseDate, baseTime, timezones } = this.data;
    
    if (!baseDate || !baseTime) {
      return;
    }
    
    // 解析基准时间
    const [year, month, day] = baseDate.split('-').map(Number);
    const [hours, minutes] = baseTime.split(':').map(Number);
    
    // 计算所有时区的时间
    const timezoneValues = timezones.map((timezone, index) => {
      // 解析时区偏移
      const offsetMatch = timezone.match(/UTC([+-]\d{2}):(\d{2})/);
      if (!offsetMatch) return '';
      const offsetHours = parseInt(offsetMatch[1]);
      const offsetMinutes = parseInt(offsetMatch[2]);
      const offset = offsetHours * 60 + offsetMinutes;
      
      // 创建UTC时间对象
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      
      // 转换为当前时区时间（考虑偏移量）
      const localTime = new Date(utcDate.getTime() + (offset * 60 * 1000));
      
      // 格式化时间
      return this.formatDateTime(localTime);
    });
    
    this.setData({ timezoneValues });
  },

  formatDateTime: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});