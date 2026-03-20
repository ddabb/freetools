// packages/unit/pages/length-converter/length-converter.js
Page({
  data: {
    units: ['纳米', '微米', '毫米', '厘米', '分米', '米', '千米', '光年', '英里', '英尺', '英寸', '码', '海里', '丈', '尺', '寸'],
    unitValues: {
      '纳米': '',
      '微米': '',
      '毫米': '',
      '厘米': '',
      '分米': '',
      '米': '',
      '千米': '',
      '光年': '',
      '英里': '',
      '英尺': '',
      '英寸': '',
      '码': '',
      '海里': '',
      '丈': '',
      '尺': '',
      '寸': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '长度单位换算'
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
    const lengthMap = {
      '纳米': 1e-9, '微米': 1e-6, '毫米': 0.001, '厘米': 0.01, '分米': 0.1, '米': 1, '千米': 1000, '光年': 9.46073e15,
      '英里': 1609.344, '英尺': 0.3048, '英寸': 0.0254, '码': 0.9144, '海里': 1852, '丈': 3.33333, '尺': 0.333333, '寸': 0.0333333
    }
    return value * lengthMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const lengthMap = {
      '纳米': 1e9, '微米': 1e6, '毫米': 1000, '厘米': 100, '分米': 10, '米': 1, '千米': 0.001, '光年': 1.057e-16,
      '英里': 0.000621371, '英尺': 3.28084, '英寸': 39.3701, '码': 1.09361, '海里': 5.39957e-4, '丈': 0.3, '尺': 3, '寸': 30
    }
    return baseValue * lengthMap[unit]
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '长度单位换算',
      path: '/packages/unit/pages/length-converter/length-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '长度单位换算',
      query: 'length-converter'
    }
  }
})
