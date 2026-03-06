// time-tool.js
Page({
  data: {
    activeTab: 'stopwatch', // 当前激活的标签：stopwatch-秒表, timer-计时器, timezone-时区转换
    // 秒表相关
    stopwatchTime: '00:00:00', // 秒表时间
    stopwatchRunning: false, // 秒表是否运行
    stopwatchStartTime: 0, // 秒表开始时间
    stopwatchElapsedTime: 0, // 秒表已用时间
    stopwatchInterval: null, // 秒表定时器
    // 计时器相关
    timerHours: 0, // 计时器小时
    timerMinutes: 0, // 计时器分钟
    timerSeconds: 0, // 计时器秒
    timerTime: '00:00:00', // 计时器时间
    timerRunning: false, // 计时器是否运行
    timerEndTime: 0, // 计时器结束时间
    timerInterval: null, // 计时器定时器
    // 时区转换相关
    beijingTime: '', // 北京时间
    newYorkTime: '', // 纽约时间
    londonTime: '', // 伦敦时间
    tokyoTime: '', // 东京时间
    timezoneInterval: null // 时区更新定时器
  },

  onLoad() {
    // 初始化时区转换
    this.updateTimezoneTimes();
    // 每秒更新一次时区时间
    this.data.timezoneInterval = setInterval(() => {
      this.updateTimezoneTimes();
    }, 1000);
  },

  onUnload() {
    // 清除所有定时器，防止内存泄漏
    if (this.data.stopwatchInterval) {
      clearInterval(this.data.stopwatchInterval);
    }
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
    if (this.data.timezoneInterval) {
      clearInterval(this.data.timezoneInterval);
    }
  },
  
  // 设置激活标签
  setActiveTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },
  
  // 开始/暂停秒表
  startStopwatch() {
    if (this.data.stopwatchRunning) {
      // 暂停秒表
      clearInterval(this.data.stopwatchInterval);
      this.setData({
        stopwatchRunning: false
      });
    } else {
      // 开始秒表
      this.setData({
        stopwatchStartTime: Date.now() - this.data.stopwatchElapsedTime,
        stopwatchRunning: true
      });
      // 降低刷新频率，从10ms改为100ms，提升性能
      this.data.stopwatchInterval = setInterval(() => {
        const elapsedTime = Date.now() - this.data.stopwatchStartTime;
        this.setData({
          stopwatchElapsedTime: elapsedTime,
          stopwatchTime: this.formatTime(elapsedTime / 1000)
        });
      }, 100);
    }
  },
  
  // 重置秒表
  resetStopwatch() {
    if (this.data.stopwatchInterval) {
      clearInterval(this.data.stopwatchInterval);
      this.data.stopwatchInterval = null;
    }
    this.setData({
      stopwatchTime: '00:00:00',
      stopwatchRunning: false,
      stopwatchStartTime: 0,
      stopwatchElapsedTime: 0
    });
  },
  
  // 设置计时器小时
  setTimerHours(e) {
    this.setData({
      timerHours: parseInt(e.detail.value) || 0
    });
    this.updateTimerTime();
  },
  
  // 设置计时器分钟
  setTimerMinutes(e) {
    this.setData({
      timerMinutes: parseInt(e.detail.value) || 0
    });
    this.updateTimerTime();
  },
  
  // 设置计时器秒
  setTimerSeconds(e) {
    this.setData({
      timerSeconds: parseInt(e.detail.value) || 0
    });
    this.updateTimerTime();
  },
  
  // 更新计时器时间
  updateTimerTime() {
    const { timerHours, timerMinutes, timerSeconds } = this.data;
    const totalSeconds = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
    this.setData({
      timerTime: this.formatTime(totalSeconds)
    });
  },
  
  // 开始/暂停计时器
  startTimer() {
    if (this.data.timerRunning) {
      // 暂停计时器
      clearInterval(this.data.timerInterval);
      this.setData({
        timerRunning: false
      });
    } else {
      // 开始计时器
      const { timerHours, timerMinutes, timerSeconds } = this.data;
      const totalSeconds = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
      if (totalSeconds <= 0) {
        wx.showToast({
          title: '请设置计时器时间',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        timerEndTime: Date.now() + totalSeconds * 1000,
        timerRunning: true
      });
      
      this.data.timerInterval = setInterval(() => {
        const remainingTime = Math.max(0, this.data.timerEndTime - Date.now());
        const remainingSeconds = Math.floor(remainingTime / 1000);
        this.setData({
          timerTime: this.formatTime(remainingSeconds)
        });
        
        if (remainingSeconds === 0) {
          clearInterval(this.data.timerInterval);
          this.setData({
            timerRunning: false
          });
          wx.showToast({
            title: '计时结束',
            icon: 'success'
          });
        }
      }, 1000);
    }
  },
  
  // 重置计时器
  resetTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.data.timerInterval = null;
    }
    this.setData({
      timerHours: 0,
      timerMinutes: 0,
      timerSeconds: 0,
      timerTime: '00:00:00',
      timerRunning: false
    });
  },
  
  // 更新时区时间
  updateTimezoneTimes() {
    const now = new Date();
    
    // 北京时间 (UTC+8)
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    // 纽约时间 (UTC-5)
    const newYorkTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    // 伦敦时间 (UTC+0)
    const londonTime = new Date(now.getTime());
    // 东京时间 (UTC+9)
    const tokyoTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    
    this.setData({
      beijingTime: this.formatDateTime(beijingTime),
      newYorkTime: this.formatDateTime(newYorkTime),
      londonTime: this.formatDateTime(londonTime),
      tokyoTime: this.formatDateTime(tokyoTime)
    });
  },
  
  // 格式化时间（秒）
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
})