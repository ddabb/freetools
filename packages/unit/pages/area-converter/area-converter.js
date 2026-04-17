// packages/unit/pages/area-converter/area-converter.js
Page({
  data: {
    units: ['平方毫米', '平方厘米', '平方分米', '平方米', '平方千米', '公顷', '亩', '平方英尺', '平方码', '平方英寸', '英亩', '平方英里'],
    unitValues: {
      '平方毫米': '',
      '平方厘米': '',
      '平方分米': '',
      '平方米': '',
      '平方千米': '',
      '公顷': '',
      '亩': '',
      '平方英尺': '',
      '平方码': '',
      '平方英寸': '',
      '英亩': '',
      '平方英里': ''
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
    
    // 计算其他单位 的值
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
      '平方毫米': 0.000001, '平方厘米': 0.0001, '平方分米': 0.01, '平方米': 1, '平方千米': 1000000, '公顷': 10000, '亩': 666.666667,
      '平方英尺': 0.092903, '平方码': 0.836127, '平方英寸': 0.00064516, '英亩': 4046.86, '平方英里': 2589988.11
    }
    return value * areaMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const areaMap = {
      '平方毫米': 1000000, '平方厘米': 10000, '平方分米': 100, '平方米': 1, '平方千米': 0.000001, '公顷': 0.0001, '亩': 0.0015,
      '平方英尺': 10.7639, '平方码': 1.19599, '平方英寸': 1550.0031, '英亩': 0.000247105, '平方英里': 3.86102e-7
    }
    return baseValue * areaMap[unit]
  }
})
