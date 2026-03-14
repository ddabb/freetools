// packages/unit/pages/area-converter/area-converter.js
Page({
  data: {
    units: ['平方米', '平方千米', '公顷', '亩', '平方英尺'],
    unitValues: {
      '平方米': '',
      '平方千米': '',
      '公顷': '',
      '亩': '',
      '平方英尺': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '面积单位换算'
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
    const areaMap = {
      '平方米': 1, '平方千米': 1000000, '公顷': 10000, '亩': 666.666667,
      '平方英尺': 0.092903
    }
    return value * areaMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const areaMap = {
      '平方米': 1, '平方千米': 0.000001, '公顷': 0.0001, '亩': 0.0015,
      '平方英尺': 10.7639
    }
    return baseValue * areaMap[unit]
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '面积单位换算',
      path: '/packages/unit/pages/area-converter/area-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '面积单位换算',
      query: 'area-converter'
    }
  }
})
