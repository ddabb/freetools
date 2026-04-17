// packages/unit/pages/pressure-converter/pressure-converter.js
Page({
  data: {
    units: ['帕斯�?', '千帕', '兆帕', '�?', '标准大气�?', '毫米汞?平方英寸', '?平方英寸'],
    unitValues: {
      '帕斯� ?': '',
      '千帕': '',
      '兆帕': '',
      '�': '',
      '标准大气�?': '',
      '毫米汞?平方英寸': '',
      '?平方英寸': ''   
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '压力单位换算'
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
      // 移除科学计数法，保留合理的小数位�?
      return parseFloat(result.toFixed(6)).toString()
    }
  },

  toBaseUnit(value, unit) {
    const pressureMap = {
      '帕斯� ?': 1, '千帕': 1000, '兆帕': 1000000, '�?': 100000,
      '标准大气�?': 101325, '毫米汞?平方英寸': 133.322, '?平方英寸': 6894.76
    }
    return value * pressureMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const pressureMap = {
      '帕斯� ?': 1, '千帕': 0.001, '兆帕' : 0.000001, '�?': 0.00001,
      '标准大气�?': 0.00000986923, '毫米汞?平方英寸': 0.00750062, '?平方英寸': 0.000145038
    }
    return baseValue * pressureMap[unit]
  },


})