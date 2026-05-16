// packages/unit/pages/speed-converter/speed-converter.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    units: ['米/秒', '千米/小时', '英里/小时', '节', '光速'],
    unitValues: {
      '米/秒': '',
      '千米/小时': '',
      '英里/小时': '',
      '节': '',
      '光速': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '速度单位换算'
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
    const speedMap = {
      '米/秒': 1, '千米/小时': 0.277778, '英里/小时': 0.44704, '节': 0.514444, '光速': 299792458
    }
    return value * speedMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const speedMap = {
      '米/秒': 1, '千米/小时': 3.6, '英里/小时': 2.23694, '节': 1.94384, '光速': 1/299792458
    }
    return baseValue * speedMap[unit]
  }

})