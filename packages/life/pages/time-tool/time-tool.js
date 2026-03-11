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
    },
    timerInterval: null,
    stopwatchInterval: null,
    clockInterval: null
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '时间工具'
    })
    this.updateWorldClock()
    // 每秒更新一次世界时钟
    this.data.clockInterval = setInterval(() => {
      this.updateWorldClock()
    }, 1000)
  },

  onUnload() {
    this.clearIntervals()
  },

  clearIntervals() {
    if (this.data.stopwatchInterval) {
      clearInterval(this.data.stopwatchInterval)
    }
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval)
    }
    if (this.data.clockInterval) {
      clearInterval(this.data.clockInterval)
    }
    this.setData({
      stopwatchInterval: null,
      timerInterval: null,
      clockInterval: null
    })
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
      clearInterval(this.data.stopwatchInterval)
      this.setData({
        'stopwatch.isRunning': false,
        stopwatchInterval: null
      })
    } else {
      // 开始
      const startTime = Date.now() - milliseconds
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        this.setData({
          'stopwatch.milliseconds': elapsed,
          'stopwatch.display': this.formatStopwatch(elapsed)
        })
      }, 10)
      this.setData({
        'stopwatch.isRunning': true,
        stopwatchInterval: interval
      })
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
    clearInterval(this.data.stopwatchInterval)
    this.setData({
      'stopwatch': {
        display: '00:00:00.00',
        milliseconds: 0,
        isRunning: false,
        laps: []
      },
      stopwatchInterval: null
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
      clearInterval(this.data.timerInterval)
      this.setData({
        'timer.isRunning': false,
        'timer.isPaused': true,
        timerInterval: null
      })
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
    const interval = setInterval(() => {
      let { remaining } = this.data.timer
      remaining -= 100

      if (remaining <= 0) {
        clearInterval(interval)
        this.setData({
          'timer.remaining': 0,
          'timer.isRunning': false,
          'timer.display': '00:00',
          timerInterval: null
        })
        wx.showToast({
          title: '计时结束',
          icon: 'success'
        })
        wx.vibrateShort({
          type: 'heavy'
        })
      } else {
        this.setData({
          'timer.remaining': remaining,
          'timer.display': this.formatTimer(remaining)
        })
      }
    }, 100)

    this.setData({ timerInterval: interval })
  },

  resetTimer() {
    clearInterval(this.data.timerInterval)
    const { hours, minutes, seconds } = this.data.timer
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    this.setData({
      'timer.remaining': totalMs,
      'timer.isRunning': false,
      'timer.isPaused': false,
      'timer.display': this.formatTimer(totalMs),
      timerInterval: null
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
