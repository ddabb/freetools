// packages/unit/pages/weight-converter/weight-converter.js
Page({
  data: {
    units: ['千克', '�', '毫克', '�', '盎司'],
    unitValues: {
      '千克': '',
      '�': '',
      '毫克': '',
      '�': '',
      '�': '',
      '盎司': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '重量单位换算'
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
    const weightMap = {
      '千克': 1, '�': 0.001, '毫克': 0.000001, '�': 1000,
      '�': 0.45359237, '盎司': 0.02834952
    }
    return value * weightMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const weightMap = {
      '千克': 1, '�': 1000, '毫克': 1000000, '�': 0.001,
      '�': 2.20462, '盎司': 35.274
    }
    return baseValue * weightMap[unit]
  }
})
