// packages/financial/pages/retirementCalculator/retirementCalculator.js
Page({
  data: {
    currentAge: '',
    retireAge: 60,
    retireAgeIndex: 1, // 退休年龄在数组中的索引
    currentSalary: '',
    salaryIncrease: 5,
    savingTypeIndex: 0, // 0: 固定金额, 1: 薪资比例
    monthlySaving: '',
    expectedReturn: 6,
    totalSavings: '',
    retireSavings: '',
    expectedMonthlySaving: '',
    showResult: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '退休金计算器'
    })
  },

  onCurrentAgeInput(e) {
    const value = e.detail.value
    // 只允许输入数字
    if (/^\d*$/.test(value)) {
      this.setData({
        currentAge: value
      })
    }
  },

  onRetireAgeChange(e) {
    const index = parseInt(e.detail.value)
    const ageArray = [55, 60, 65, 70]
    this.setData({
      retireAgeIndex: index,
      retireAge: ageArray[index]
    })
  },

  onCurrentSalaryInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        currentSalary: value
      })
    }
  },

  onSavingTypeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      savingTypeIndex: index
    })
  },

  onSalaryIncreaseChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      salaryIncrease: isNaN(value) ? 0 : value
    })
  },

  onMonthlySavingInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        monthlySaving: value
      })
    }
  },

  onExpectedReturnChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      expectedReturn: isNaN(value) ? 0 : value
    })
  },

  calculate() {
    const { currentAge, retireAge, currentSalary, salaryIncrease, monthlySaving, expectedReturn } = this.data

    if (!currentAge || currentAge <= 0) {
      wx.showToast({
        title: '请输入当前年龄',
        icon: 'none'
      })
      return
    }

    if (!monthlySaving || monthlySaving <= 0) {
      wx.showToast({
        title: '请输入每月储蓄',
        icon: 'none'
      })
      return
    }

    const currentAgeNum = parseInt(currentAge)
    if (currentAgeNum >= retireAge) {
      wx.showToast({
        title: '当前年龄必须小于退休年龄',
        icon: 'none'
      })
      return
    }

    const yearsToRetire = retireAge - currentAgeNum
    const months = yearsToRetire * 12

    // 计算每月储蓄金额
    let monthlySavingAmount
    if (this.data.savingTypeIndex === 1 && currentSalary) {
      // 如果选择了薪资比例且输入了当前薪资
      monthlySavingAmount = parseFloat(currentSalary) * (parseFloat(monthlySaving) / 100)
    } else {
      // 否则视为固定金额
      monthlySavingAmount = parseFloat(monthlySaving)
    }

    // 计算退休时预计的月储蓄
    const expectedMonthlySaving = monthlySavingAmount * Math.pow(1 + salaryIncrease / 100, yearsToRetire)

    // 计算退休储蓄总额（考虑复利）
    const monthlyRate = expectedReturn / 100 / 12
    let totalSavings
    if (Math.abs(monthlyRate) < 1e-10) {
      // 利率为零时，简单累加
      totalSavings = expectedMonthlySaving * months
    } else {
      totalSavings = (expectedMonthlySaving * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate
    }

    this.setData({
      totalSavings: totalSavings.toFixed(2),
      retireSavings: (totalSavings / 10000).toFixed(2),
      expectedMonthlySaving: expectedMonthlySaving.toFixed(2),
      showResult: true
    })
  },

  reset() {
    this.setData({
      currentAge: '',
      retireAge: 60,
      currentSalary: '',
      salaryIncrease: 5,
      savingTypeIndex: 0,
      monthlySaving: '',
      expectedReturn: 6,
      totalSavings: '',
      retireSavings: '',
      expectedMonthlySaving: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '退休金计算器 - 算算你的退休储蓄',
      path: '/packages/financial/pages/retirementCalculator/retirementCalculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '退休金计算器 - 算算你的退休储蓄',
      query: 'retirementCalculator'
    }
  }
})