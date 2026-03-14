// packages/unit/pages/time-converter/time-converter.js
Page({
  data: {
    units: ['秒', '分钟', '小时', '天', '周', '年'],
    unitValues: {
      '秒': '',
      '分钟': '',
      '小时': '',
      '天': '',
      '周': '',
      '年': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '时间单位换算'
    })
  },

  onUnitValueChange(e) {
    const unit = e.currentTarget.dataset.unit
    const value = e.detail.value
    
    if (!value) {
      // 如果值为空，清空所有单位的值
      const unitValues = {}
      this.data.units.forEach(u => {
        unitValues[u] = ''
      })
      this.setData({ unitValues })
      return
    }

    const unitValues = { ...this.data.unitValues }
    unitValues[unit] = value
    
    // 计算其他单位的值
    const inputValue = parseFloat(value)
    
    if (!isNaN(inputValue)) {
      this.data.units.forEach(targetUnit => {
        if (targetUnit !== unit) {
          const baseValue = this.toBaseUnit(inputValue, unit)
          const result = this.fromBaseUnit(baseValue, targetUnit)
          unitValues[targetUnit] = this.formatResult(result)
        }
      })
    }
    
    this.setData({ unitValues })
  },

  formatResult(result) {
    if (result === 0) {
      return '0'
    } else {
      // 移除科学计数法，保留合理的小数位数
      return parseFloat(result.toFixed(6)).toString()
    }
  },

  toBaseUnit(value, unit) {
    const timeMap = {
      '秒': 1, '分钟': 60, '小时': 3600, '天': 86400,
      '周': 604800, '年': 31536000
    }
    return value * timeMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const timeMap = {
      '秒': 1, '分钟': 1/60, '小时': 1/3600, '天': 1/86400,
      '周': 1/604800, '年': 1/31536000
    }
    return baseValue * timeMap[unit]
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '时间单位换算',
      path: '/packages/unit/pages/time-converter/time-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '时间单位换算',
      query: 'time-converter'
    }
  }
})
