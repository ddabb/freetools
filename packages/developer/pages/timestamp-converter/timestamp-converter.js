// packages/developer/pages/timestamp-converter/timestamp-converter.js
Page({
  data: {
    currentTime: '', // 当前时间字符串
    currentTimestamp: '', // 当前时间戳
    currentTimestampSec: '', // 当前秒级时间戳
    
    // 时间戳转日期
    timestampInput: '', // 时间戳输入
    timezoneIndex: 0, // 时区索引
    timezones: ['本地时间', 'UTC时间'],
    timestampResult: null, // 时间戳转换结果
    
    // 日期转时间戳
    dateInput: '', // 日期输入
    timeInput: '', // 时间输入
    dateResult: null, // 日期转换结果
    
    // 时间差计算
    timeDiffInput: '', // 时间差输入
    timeDiffResult: null, // 时间差结果
    
    // 常用时间戳
    commonTimestamps: [
      { name: '今天开始', value: '', displayValue: '00:00:00' },
      { name: '今天结束', value: '', displayValue: '23:59:59' },
      { name: '昨天此刻', value: '', displayValue: '-1天' },
      { name: '明天此刻', value: '', displayValue: '+1天' },
      { name: '一周前', value: '', displayValue: '-7天' },
      { name: '一个月前', value: '', displayValue: '-30天' },
      { name: '一年后', value: '', displayValue: '+365天' },
      { name: '2024年开始', value: '1704067200', displayValue: '1704067200' }
    ]
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '时间戳转换' });
    this.updateCurrentTime();
    this.initDefaultValues();
    
    // 每秒更新当前时间
    const self = this;
    const timerId = setInterval(() => {
      // 安全检查：确保self存在
      if (!self) {
        clearInterval(timerId);
        return;
      }
      try {
        self.updateCurrentTime();
      } catch (error) {
        console.error('更新时间出错:', error);
        clearInterval(timerId);
        if (self.timeTimer === timerId) {
          self.timeTimer = null;
        }
      }
    }, 1000);
    this.timeTimer = timerId;
  },

  // 页面隐藏时清理定时器
  onHide() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
      this.timeTimer = null;
    }
  },

  // 页面卸载时清理定时器
  onUnload() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
      this.timeTimer = null;
    }
  },

  // 更新当前时间
  updateCurrentTime() {
    const now = new Date();
    const timestamp = now.getTime();
    
    this.setData({
      currentTime: this.formatDateTime(now),
      currentTimestamp: timestamp.toString(),
      currentTimestampSec: Math.floor(timestamp / 1000).toString()
    });
  },

  // 初始化默认值
  initDefaultValues() {
    const now = new Date();
    const today = this.formatDate(now);
    const currentTime = this.formatTime(now);
    
    this.setData({
      dateInput: today,
      timeInput: currentTime
    });

    // 设置常用时间戳
    this.updateCommonTimestamps();
    
    // 默认转换今天的日期
    this.convertDateToTimestamp();
  },

  // 更新常用时间戳
  updateCommonTimestamps() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const commonTimestamps = [
      { 
        name: '今天开始', 
        value: Math.floor(today.getTime() / 1000).toString(), 
        displayValue: '00:00:00' 
      },
      { 
        name: '今天结束', 
        value: Math.floor(tomorrow.getTime() / 1000 - 1).toString(), 
        displayValue: '23:59:59' 
      },
      { 
        name: '昨天此刻', 
        value: Math.floor(now.getTime() / 1000 - 86400).toString(), 
        displayValue: '-1天' 
      },
      { 
        name: '明天此刻', 
        value: Math.floor(now.getTime() / 1000 + 86400).toString(), 
        displayValue: '+1天' 
      },
      { 
        name: '一周前', 
        value: Math.floor(now.getTime() / 1000 - 604800).toString(), 
        displayValue: '-7天' 
      },
      { 
        name: '一个月前', 
        value: Math.floor(now.getTime() / 1000 - 2592000).toString(), 
        displayValue: '-30天' 
      },
      { 
        name: '一年后', 
        value: Math.floor(now.getTime() / 1000 + 31536000).toString(), 
        displayValue: '+365天' 
      },
      { 
        name: '2024年开始', 
        value: '1704067200', 
        displayValue: '1704067200' 
      }
    ];

    this.setData({ commonTimestamps });
  },

  // 设置时间戳输入
  setTimestampInput(e) {
    this.setData({
      timestampInput: e.detail.value,
      timestampResult: null
    });
    this.convertTimestampToDate();
  },

  // 设置时区
  setTimezone(e) {
    this.setData({
      timezoneIndex: e.detail.value
    });
    if (this.data.timestampInput) {
      this.convertTimestampToDate();
    }
  },

  // 设置日期输入
  setDateInput(e) {
    this.setData({
      dateInput: e.detail.value,
      dateResult: null
    });
    this.convertDateToTimestamp();
  },

  // 设置时间输入
  setTimeInput(e) {
    this.setData({
      timeInput: e.detail.value,
      dateResult: null
    });
    this.convertDateToTimestamp();
  },

  // 使用当前时间戳
  useCurrentTimestamp() {
    const timestamp = Math.floor(Date.now() / (this.isMillisecond(this.data.timestampInput) ? 1 : 1000));
    this.setData({
      timestampInput: timestamp.toString(),
      timestampResult: null
    });
    this.convertTimestampToDate();
  },

  // 使用昨天时间戳
  useYesterdayTimestamp() {
    const timestamp = Math.floor(Date.now() / 1000 - 86400);
    this.setData({
      timestampInput: timestamp.toString(),
      timestampResult: null
    });
    this.convertTimestampToDate();
  },

  // 使用明天时间戳
  useTomorrowTimestamp() {
    const timestamp = Math.floor(Date.now() / 1000 + 86400);
    this.setData({
      timestampInput: timestamp.toString(),
      timestampResult: null
    });
    this.convertTimestampToDate();
  },

  // 使用常用时间戳
  useCommonTimestamp(e) {
    const { timestamp, name } = e.currentTarget.dataset;
    this.setData({
      timestampInput: timestamp,
      timestampResult: null
    });
    this.convertTimestampToDate();
  },

  // 判断是否为毫秒级时间戳
  isMillisecond(timestamp) {
    if (!timestamp) return false;
    const num = parseInt(timestamp);
    return num > 9999999999; // 大于这个值的认为是毫秒
  },

  // 时间戳转日期
  convertTimestampToDate() {
    const { timestampInput, timezoneIndex } = this.data;
    
    if (!timestampInput.trim()) return;

    try {
      let timestamp = parseInt(timestampInput.trim());
      
      // 判断是秒还是毫秒
      if (!this.isMillisecond(timestampInput)) {
        timestamp *= 1000; // 转为毫秒
      }

      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        wx.showToast({ title: '无效的时间戳', icon: 'none' });
        return;
      }

      const result = {
        localTime: this.formatDateTime(date),
        utcTime: this.formatUTCDateTime(date),
        isoFormat: date.toISOString()
      };

      this.setData({ timestampResult: result });

    } catch (error) {
      console.error('时间戳转换失败', error);
      wx.showToast({ title: '转换失败', icon: 'none' });
    }
  },

  // 日期转时间戳
  convertDateToTimestamp() {
    const { dateInput, timeInput } = this.data;
    
    if (!dateInput || !timeInput) return;

    try {
      const datetimeStr = `${dateInput} ${timeInput}`;
      const date = new Date(datetimeStr);
      
      if (isNaN(date.getTime())) {
        wx.showToast({ title: '无效的日期时间', icon: 'none' });
        return;
      }

      const timestampSec = Math.floor(date.getTime() / 1000);
      const expireTime = this.formatDateTime(new Date(date.getTime() + 300000)); // 5分钟后

      const result = {
        timestampSec: timestampSec.toString(),
        timestampMs: date.getTime().toString(),
        expireTime: expireTime
      };

      this.setData({ dateResult: result });

    } catch (error) {
      console.error('日期转换失败', error);
      wx.showToast({ title: '转换失败', icon: 'none' });
    }
  },

  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 格式化UTC日期时间
  formatUTCDateTime(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  },

  // 复制当前时间戳
  copyCurrentTimestamp() {
    wx.setClipboardData({
      data: this.data.currentTimestamp,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 复制当前秒级时间戳
  copyCurrentTimestampSec() {
    wx.setClipboardData({
      data: this.data.currentTimestampSec,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 复制时间戳转换结果
  copyTimestampResult(e) {
    const type = e.currentTarget.dataset.type;
    const value = this.data.timestampResult[type];
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 复制日期转换结果
  copyDateResult(e) {
    const type = e.currentTarget.dataset.type;
    const value = this.data.dateResult[type];
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 复制常用时间戳
  copyCommonTimestamp(e) {
    const timestamp = e.currentTarget.dataset.timestamp;
    wx.setClipboardData({
      data: timestamp,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 设置时间差输入
  setTimeDiffInput(e) {
    this.setData({ timeDiffInput: e.detail.value });
  },

  // 计算时间差
  calculateTimeDiff() {
    const { timeDiffInput } = this.data;
    
    if (!timeDiffInput.trim()) {
      wx.showToast({ title: '请输入时间戳', icon: 'none' });
      return;
    }

    try {
      let timestamp = parseInt(timeDiffInput.trim());
      
      // 判断是秒还是毫秒
      if (timestamp < 9999999999) {
        timestamp *= 1000; // 转为毫秒
      }

      const targetDate = new Date(timestamp);
      const now = new Date();
      const diff = Math.abs(now.getTime() - targetDate.getTime());
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      let result = '';
      if (days > 0) result += `${days}天 `;
      if (hours > 0) result += `${hours}小时 `;
      if (minutes > 0) result += `${minutes}分钟 `;
      if (seconds > 0) result += `${seconds}秒`;
      
      if (!result) result = '时间相同';
      
      this.setData({ timeDiffResult: result });
      
    } catch (error) {
      console.error('时间差计算失败', error);
      wx.showToast({ title: '计算失败', icon: 'none' });
    }
  },

})