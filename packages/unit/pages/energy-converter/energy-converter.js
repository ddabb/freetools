// packages/unit/pages/energy-converter/energy-converter.js
Page({
  data: {
    units: ['焦�?', '千焦', '兆焦', '卡路�?', '千瓦�?', '英热单位', '电子伏特'],
    unitValues: {
      '焦�?': '',
      '兆焦': '',
      '卡路�?': '',
      '千瓦�?': '',
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
      // 如果值为空，清空所有单位的�?
      const unitValues = {}
      this.data.units.forEach(u => {
        unitValues[u] = ''
      })
      this.setData({ unitValues })
      return
    }

    const unitValues = { ...this.data.unitValues }
    unitValues[unit] = value
    
    // 计算其他单位的�?
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
    const energyMap = {
      '焦�?': 1, '千焦': 1000, '兆焦': 1000000, '卡路�?': 4.184,
      '千瓦�?': 3600000, '英热单位': 1055.06, '电子伏特': 1.60218e-19
    }
    return value * energyMap[unit]
  },

  fromBaseUnit(baseValue, unit) {
    const energyMap = {
      '焦�?': 1, '千焦': 0.001, '兆焦': 0.000001, '卡路�?': 0.239006,
      '千瓦�?': 2.77778e-7, '英热单位': 9.47817e-4, '电子伏特': 6.24151e18
    }
    return baseValue * energyMap[unit]
  }


})