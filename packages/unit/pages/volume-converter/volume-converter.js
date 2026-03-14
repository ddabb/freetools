// packages/unit/pages/volume-converter/volume-converter.js
Page({
  data: {
    units: ['立方米', '升', '毫升', '加仑'],
    unitValues: {
      '立方米': '',
      '升': '',
      '毫升': '',
      '加仑': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '体积单位换算'
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
    const volumeMap = {
      '立方米': 1, '升': 0.001, '毫升': 0.000001, '加仑': 0.00378541
    }
    return value * volumeMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const volumeMap = {
      '立方米': 1, '升': 1000, '毫升': 1000000, '加仑': 264.172
    }
    return baseValue * volumeMap[unit]
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '体积单位换算',
      path: '/packages/unit/pages/volume-converter/volume-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '体积单位换算',
      query: 'volume-converter'
    }
  }
})
