// packages/life/pages/time-tool/time-tool.js
Page({
  data: {
    activeTab: 0,
    tabs: ['秒表', '计时器', '世界时钟'],
    // 秒表数据
    stopwatch: {
      display: '00:00:00.00',
      milliseconds: 0,
      isRunning: false,
      laps: []
    },
    // 计时器数据
    timer: {
      hours: 0,
      minutes: 5,
      seconds: 0,
      display: '05:00',
      isRunning: false,
      isPaused: false,
      remaining: 300000 // 毫秒
    },
    // 世界时钟数据
    worldClock: {
      beijing: '',
      tokyo: '',
      london: '',
      newYork: ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '时间工具'
    })
    this.updateWorldClock()
    // 每秒更新一次世界时钟
    const self = this;
    const clockTimerId = setInterval(() => {
      // 安全检查：确保self存在
      if (!self) {
        clearInterval(clockTimerId);
        return;
      }
      try {
        self.updateWorldClock();
      } catch (error) {
        console.error('更新世界时钟出错:', error);
        clearInterval(clockTimerId);
        if (this.clockInterval === clockTimerId) {
          this.clockInterval = null;
        }
      }
    }, 1000)
    this.clockInterval = clockTimerId
  },

  onHide() {
    this.clearIntervals()
  },

  onUnload() {
    this.clearIntervals()
  },

  clearIntervals() {
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval)
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval)
    }
    this.stopwatchInterval = null
    this.timerInterval = null
    this.clockInterval = null
  },

  onTabChange(e) {
    const activeTab = parseInt(e.currentTarget.dataset.index)
    this.clearIntervals()
    this.setData({ activeTab })
  },

  // ===== 秒表功能 =====
  formatStopwatch(ms) {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = ms % 1000

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, 2)}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, 2)}`
  },

  toggleStopwatch() {
    const { isRunning, milliseconds } = this.data.stopwatch
    if (isRunning) {
      // 停止
      clearInterval(this.stopwatchInterval)
      this.setData({
        'stopwatch.isRunning': false
      })
      this.stopwatchInterval = null
    } else {
      // 开始
      const startTime = Date.now() - milliseconds
      const self = this;
      const interval = setInterval(() => {
        // 安全检查：确保self存在
        if (!self) {
          clearInterval(interval);
          return;
        }
        try {
          const elapsed = Date.now() - startTime
          self.setData({
            'stopwatch.milliseconds': elapsed,
            'stopwatch.display': self.formatStopwatch(elapsed)
          })
        } catch (error) {
          console.error('秒表更新出错:', error);
          clearInterval(interval);
          if (self.stopwatchInterval === interval) {
            self.stopwatchInterval = null;
          }
        }
      }, 10)
      this.setData({
        'stopwatch.isRunning': true
      })
      this.stopwatchInterval = interval
    }
  },

  lapStopwatch() {
    const { milliseconds, display, laps } = this.data.stopwatch
    if (milliseconds === 0) return

    const lapNumber = laps.length + 1
    const lapTime = display
    this.setData({
      'stopwatch.laps': [...laps, { number: lapNumber, time: lapTime }]
    })
  },

  resetStopwatch() {
    clearInterval(this.stopwatchInterval)
    this.stopwatchInterval = null
    this.setData({
      'stopwatch': {
        display: '00:00:00.00',
        milliseconds: 0,
        isRunning: false,
        laps: []
      }
    })
  },

  // ===== 计时器功能 =====
  formatTimer(ms) {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },

  onTimerTimeChange(e) {
    const { type } = e.currentTarget.dataset
    const value = parseInt(e.detail.value) || 0
    this.setData({
      [`timer.${type}`]: Math.min(59, Math.max(0, value))
    })
    this.updateTimerDisplay()
  },

  updateTimerDisplay() {
    const { hours, minutes, seconds } = this.data.timer
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    this.setData({
      'timer.remaining': totalMs,
      'timer.display': this.formatTimer(totalMs)
    })
  },

  toggleTimer() {
    const { isRunning, isPaused } = this.data.timer

    if (isRunning && !isPaused) {
      // 暂停
      clearInterval(this.timerInterval)
      this.setData({
        'timer.isRunning': false,
        'timer.isPaused': true
      })
      this.timerInterval = null
    } else if (isPaused) {
      // 继续
      this.startTimerCountdown()
      this.setData({
        'timer.isRunning': true,
        'timer.isPaused': false
      })
    } else {
      // 开始
      if (this.data.timer.remaining <= 0) {
        wx.showToast({
          title: '请设置计时时间',
          icon: 'none'
        })
        return
      }
      this.startTimerCountdown()
      this.setData({
        'timer.isRunning': true,
        'timer.isPaused': false
      })
    }
  },

  startTimerCountdown() {
    const self = this;
    const interval = setInterval(() => {
      // 安全检查：确保self存在
      if (!self) {
        clearInterval(interval);
        return;
      }
      try {
        let { remaining } = self.data.timer
        remaining -= 100

        if (remaining <= 0) {
          clearInterval(interval)
          self.timerInterval = null
          self.setData({
            'timer.remaining': 0,
            'timer.isRunning': false,
            'timer.display': '00:00'
          })
          wx.showToast({
            title: '计时结束',
            icon: 'success'
          })
          wx.vibrateShort({
            type: 'heavy'
          })
        } else {
          self.setData({
            'timer.remaining': remaining,
            'timer.display': self.formatTimer(remaining)
          })
        }
      } catch (error) {
        console.error('计时器更新出错:', error);
        clearInterval(interval);
        if (self.timerInterval === interval) {
          self.timerInterval = null;
        }
      }
    }, 100)

    this.timerInterval = interval
  },

  resetTimer() {
    clearInterval(this.timerInterval)
    this.timerInterval = null
    const { hours, minutes, seconds } = this.data.timer
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    this.setData({
      'timer.remaining': totalMs,
      'timer.isRunning': false,
      'timer.isPaused': false,
      'timer.display': this.formatTimer(totalMs)
    })
  },

  // 分享给好友
  onShareAppMessage() {
    const tabNames = ['秒表', '计时器', '世界时钟']
    return {
      title: '时间工具 - ' + tabNames[this.data.activeTab],
      path: '/packages/life/pages/time-tool/time-tool'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '时间工具 - 秒表、计时器、世界时钟',
      query: 'time-tool'
    }
  },

  // 获取当前日期
  getCurrentDate(city) {
    const now = new Date()
    let timeOffset = 0
    
    switch(city) {
      case 'beijing':
        timeOffset = 0
        break
      case 'tokyo':
        timeOffset = 3600000
        break
      case 'london':
        timeOffset = -28800000
        break
      case 'newYork':
        timeOffset = -43200000
        break
      default:
        timeOffset = 0
    }
    
    const cityTime = new Date(now.getTime() + timeOffset)
    return cityTime.toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  },

  // 跳转到时区转换器
  gotoTimezoneConverter() {
    wx.navigateTo({
      url: '/packages/unit/pages/timezone-converter/timezone-converter'
    })
  },

  // 更新世界时钟
  updateWorldClock() {
    const now = new Date()
    const beijingTime = new Date(now.getTime()).toLocaleTimeString('zh-CN', { hour12: false })
    const tokyoTime = new Date(now.getTime() + 3600000).toLocaleTimeString('zh-CN', { hour12: false })
    const londonTime = new Date(now.getTime() - 28800000).toLocaleTimeString('zh-CN', { hour12: false })
    const newYorkTime = new Date(now.getTime() - 43200000).toLocaleTimeString('zh-CN', { hour12: false })

    this.setData({
      'worldClock.beijing': beijingTime,
      'worldClock.tokyo': tokyoTime,
      'worldClock.london': londonTime,
      'worldClock.newYork': newYorkTime
    })
  }
})
