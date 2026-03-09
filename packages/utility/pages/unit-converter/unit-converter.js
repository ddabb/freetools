// packages/utility/pages/unit-converter/unit-converter.js
Page({
  data: {
    categoryIndex: 0,
    categories: ['长度', '重量', '温度', '面积', '体积', '时间'],
    categoryUnits: {
      '长度': ['米', '千米', '厘米', '毫米', '英里', '英尺', '英寸'],
      '重量': ['千克', '克', '毫克', '吨', '磅', '盎司'],
      '温度': ['摄氏度', '华氏度', '开尔文'],
      '面积': ['平方米', '平方千米', '公顷', '亩', '平方英尺'],
      '体积': ['立方米', '升', '毫升', '加仑'],
      '时间': ['秒', '分钟', '小时', '天', '周', '年']
    },
    currentUnits: ['米', '千米', '厘米', '毫米', '英里', '英尺', '英寸'],
    fromUnitIndex: 0,
    toUnitIndex: 1,
    inputValue: '',
    resultValue: '',
    showResult: false,
    resultFormula: '',
    inputFocus: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '单位换算'
    })
    // 初始化当前单位列表
    this.updateCurrentUnits()
  },

  // 更新当前单位列表
  updateCurrentUnits() {
    const currentUnits = this.data.categoryUnits[this.data.categories[this.data.categoryIndex]]
    this.setData({ currentUnits })
  },

  onCategoryChange(e) {
    const categoryIndex = parseInt(e.detail.value)
    const units = this.data.categoryUnits[this.data.categories[categoryIndex]]
    this.setData({
      categoryIndex,
      fromUnitIndex: 0,
      toUnitIndex: units.length > 1 ? 1 : 0,
      inputValue: '',
      resultValue: '',
      showResult: false,
      inputFocus: true
    })
    // 更新当前单位列表
    this.updateCurrentUnits()
  },

  onFromUnitChange(e) {
    const fromUnitIndex = parseInt(e.detail.value)
    if (fromUnitIndex !== this.data.toUnitIndex) {
      this.setData({ fromUnitIndex })
      this.calculate()
    }
  },

  onToUnitChange(e) {
    const toUnitIndex = parseInt(e.detail.value)
    if (toUnitIndex !== this.data.fromUnitIndex) {
      this.setData({ toUnitIndex })
      this.calculate()
    }
  },

  onInputChange(e) {
    const inputValue = e.detail.value
    this.setData({ inputValue })
    this.calculate()
  },

  calculate() {
    const { categoryIndex, fromUnitIndex, toUnitIndex, inputValue } = this.data
    if (!inputValue) {
      this.setData({ 
        resultValue: '',
        showResult: false
      })
      return
    }

    const category = this.data.categories[categoryIndex]
    const fromUnit = this.data.categoryUnits[category][fromUnitIndex]
    const toUnit = this.data.categoryUnits[category][toUnitIndex]

    const value = parseFloat(inputValue)
    if (isNaN(value)) {
      this.setData({ 
        resultValue: '',
        showResult: false
      })
      return
    }

    // 先转换为基准单位，再转换为目标单位
    const baseValue = this.toBaseUnit(value, fromUnit, category)
    const result = this.fromBaseUnit(baseValue, toUnit, category)

    // 格式化结果，保留合理的小数位数
    let formattedResult
    if (result === 0) {
      formattedResult = '0'
    } else if (Math.abs(result) < 0.0001 || Math.abs(result) > 10000) {
      formattedResult = result.toExponential(4)
    } else {
      formattedResult = parseFloat(result.toFixed(6))
    }

    // 生成转换公式说明
    const formula = `${value} ${fromUnit} → ${formattedResult} ${toUnit}`

    this.setData({ 
      resultValue: formattedResult.toString(),
      resultFormula: formula,
      showResult: true
    })
  },

  toBaseUnit(value, unit, category) {
    switch (category) {
      case '长度':
        const lengthMap = {
          '米': 1, '千米': 1000, '厘米': 0.01, '毫米': 0.001,
          '英里': 1609.344, '英尺': 0.3048, '英寸': 0.0254
        }
        return value * lengthMap[unit]
      case '重量':
        const weightMap = {
          '千克': 1, '克': 0.001, '毫克': 0.000001, '吨': 1000,
          '磅': 0.45359237, '盎司': 0.02834952
        }
        return value * weightMap[unit]
      case '温度':
        // 温度特殊处理
        if (unit === '摄氏度') return value
        if (unit === '华氏度') return (value - 32) * 5 / 9
        if (unit === '开尔文') return value - 273.15
        return value
      case '面积':
        const areaMap = {
          '平方米': 1, '平方千米': 1000000, '公顷': 10000, '亩': 666.666667,
          '平方英尺': 0.092903
        }
        return value * areaMap[unit]
      case '体积':
        const volumeMap = {
          '立方米': 1, '升': 0.001, '毫升': 0.000001, '加仑': 0.00378541
        }
        return value * volumeMap[unit]
      case '时间':
        const timeMap = {
          '秒': 1, '分钟': 60, '小时': 3600, '天': 86400,
          '周': 604800, '年': 31536000
        }
        return value * timeMap[unit]
      default:
        return value
    }
  },

  fromBaseUnit(baseValue, unit, category) {
    switch (category) {
      case '长度':
        const lengthMap = {
          '米': 1, '千米': 0.001, '厘米': 100, '毫米': 1000,
          '英里': 0.000621371, '英尺': 3.28084, '英寸': 39.3701
        }
        return baseValue * lengthMap[unit]
      case '重量':
        const weightMap = {
          '千克': 1, '克': 1000, '毫克': 1000000, '吨': 0.001,
          '磅': 2.20462, '盎司': 35.274
        }
        return baseValue * weightMap[unit]
      case '温度':
        // 温度特殊处理
        if (unit === '摄氏度') return baseValue
        if (unit === '华氏度') return baseValue * 9 / 5 + 32
        if (unit === '开尔文') return baseValue + 273.15
        return baseValue
      case '面积':
        const areaMap = {
          '平方米': 1, '平方千米': 0.000001, '公顷': 0.0001, '亩': 0.0015,
          '平方英尺': 10.7639
        }
        return baseValue * areaMap[unit]
      case '体积':
        const volumeMap = {
          '立方米': 1, '升': 1000, '毫升': 1000000, '加仑': 264.172
        }
        return baseValue * volumeMap[unit]
      case '时间':
        const timeMap = {
          '秒': 1, '分钟': 1/60, '小时': 1/3600, '天': 1/86400,
          '周': 1/604800, '年': 1/31536000
        }
        return baseValue * timeMap[unit]
      default:
        return baseValue
    }
  },

  swapUnits() {
    const { fromUnitIndex, toUnitIndex, inputValue, resultValue } = this.data
    this.setData({
      fromUnitIndex: toUnitIndex,
      toUnitIndex: fromUnitIndex,
      inputValue: resultValue,
      resultValue: inputValue,
      showResult: resultValue ? true : false
    })
    if (resultValue) {
      this.calculate()
    }
  },

  reset() {
    this.setData({
      fromUnitIndex: 0,
      toUnitIndex: 1,
      inputValue: '',
      resultValue: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '单位换算 - 轻松进行各种单位转换',
      path: '/packages/utility/pages/unit-converter/unit-converter',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '单位换算 - 轻松进行各种单位转换',
      imageUrl: ''
    }
  }
})