// packages/financial/pages/retirementCalculator/retirementCalculator.js
Page({
  data: {
    currentAge: '',
    retireAge: 60,
    retireAgeIndex: 1, // 退休年龄在数组中的索引
    currentSalary: '',
    salaryIncrease: 0.05,
    monthlySaving: '',
    expectedReturn: 0.06,
    totalSavings: '',
    retireSavings: '',
    showResult: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '退休金计算器'
    })
  },

  onCurrentAgeInput(e) {
    this.setData({
      currentAge: e.detail.value
    })
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
    this.setData({
      currentSalary: e.detail.value
    })
  },

  onSalaryIncreaseChange(e) {
    this.setData({
      salaryIncrease: parseFloat(e.detail.value)
    })
  },

  onMonthlySavingInput(e) {
    this.setData({
      monthlySaving: e.detail.value
    })
  },

  onExpectedReturnChange(e) {
    this.setData({
      expectedReturn: parseFloat(e.detail.value)
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

    const yearsToRetire = retireAge - parseInt(currentAge)
    const months = yearsToRetire * 12

    // 计算退休时预计的月储蓄
    const expectedMonthlySaving = parseFloat(monthlySaving) * Math.pow(1 + salaryIncrease, yearsToRetire)

    // 计算退休储蓄总额（考虑复利）
    const monthlyRate = expectedReturn / 12
    const totalSavings = (expectedMonthlySaving * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate

    this.setData({
      totalSavings: totalSavings.toFixed(2),
      retireSavings: (totalSavings / 10000).toFixed(2),
      showResult: true
    })
  },

  reset() {
    this.setData({
      currentAge: '',
      retireAge: 60,
      currentSalary: '',
      salaryIncrease: 0.05,
      monthlySaving: '',
      expectedReturn: 0.06,
      totalSavings: '',
      retireSavings: '',
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