// packages/unit/pages/temperature-converter/temperature-converter.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    units: ['摄氏度', '华氏度', '开尔文', '兰金温标', '列氏温标', '牛顿温标', '罗默温标'],
    unitValues: {
      '摄氏度': '',
      '华氏度': '',
      '开尔文': '',
      '兰金温标': '',
      '列氏温标': '',
      '牛顿温标': '',
      '罗默温标': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '温度单位换算'
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
    // 温度特殊处理，以摄氏度为基准
    if (unit === '摄氏度') return value
    if (unit === '华氏度') return (value - 32) * 5 / 9
    if (unit === '开尔文') return value - 273.15
    if (unit === '兰金温标') return (value - 491.67) * 5 / 9
    if (unit === '列氏温标') return value * 5 / 4
    if (unit === '牛顿温标') return value * 100 / 33
    if (unit === '罗默温标') return (value - 7.5) * 40 / 21
    return value
  },

  fromBaseUnit(baseValue, unit) {
    // 从摄氏度转换到其他单位
    if (unit === '摄氏度') return baseValue
    if (unit === '华氏度') return baseValue * 9 / 5 + 32
    if (unit === '开尔文') return baseValue + 273.15
    if (unit === '兰金温标') return baseValue * 9 / 5 + 491.67
    if (unit === '列氏温标') return baseValue * 4 / 5
    if (unit === '牛顿温标') return baseValue * 33 / 100
    if (unit === '罗默温标') return baseValue * 21 / 40 + 7.5
    return baseValue
  }


})
