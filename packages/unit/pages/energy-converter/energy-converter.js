// packages/unit/pages/energy-converter/energy-converter.js
Page({
  data: {
    units: ['焦耳', '千焦', '兆焦', '卡路里', '千瓦时', '英热单位', '电子伏特'],
    unitValues: {
      '焦耳': '',
      '千焦': '',
      '兆焦': '',
      '卡路里': '',
      '千瓦时': '',
      '英热单位': '',
      '电子伏特': ''
    }
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '能量单位换算'
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
    const energyMap = {
      '焦耳': 1, '千焦': 1000, '兆焦': 1000000, '卡路里': 4.184,
      '千瓦时': 3600000, '英热单位': 1055.06, '电子伏特': 1.60218e-19
    }
    return value * energyMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const energyMap = {
      '焦耳': 1, '千焦': 0.001, '兆焦': 0.000001, '卡路里': 0.239006,
      '千瓦时': 2.77778e-7, '英热单位': 9.47817e-4, '电子伏特': 6.24151e18
    }
    return baseValue * energyMap[unit]
  }


})