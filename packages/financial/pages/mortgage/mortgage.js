// packages/financial/pages/mortgage/mortgage.js
Page({
  data: {
    loanType: 0, // 0:商业贷款 1:公积金贷款 2:组合贷款
    loanAmount: '',
    years: 30,
    rate: 4.2,
    monthlyPayment: '',
    totalInterest: '',
    totalPayment: '',
    showResult: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '房贷计算器'
    })
  },

  onLoanTypeChange(e) {
    this.setData({
      loanType: parseInt(e.detail.value)
    })
  },

  onLoanAmountInput(e) {
    this.setData({
      loanAmount: e.detail.value
    })
  },

  onYearsChange(e) {
    this.setData({
      years: parseInt(e.detail.value)
    })
  },

  onRateChange(e) {
    this.setData({
      rate: parseFloat(e.detail.value)
    })
  },

  calculate() {
    const { loanAmount, years, rate, loanType } = this.data

    if (!loanAmount || loanAmount <= 0) {
      wx.showToast({
        title: '请输入贷款金额',
        icon: 'none'
      })
      return
    }

    const amount = parseFloat(loanAmount) * 10000
    const months = years * 12
    const monthlyRate = rate / 100 / 12

    // 等额本息
    const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, months) /
                          (Math.pow(1 + monthlyRate, months) - 1)
    const totalPayment = monthlyPayment * months
    const totalInterest = totalPayment - amount

    this.setData({
      monthlyPayment: monthlyPayment.toFixed(2),
      totalInterest: (totalInterest / 10000).toFixed(2),
      totalPayment: (totalPayment / 10000).toFixed(2),
      showResult: true
    })
  },

  reset() {
    this.setData({
      loanAmount: '',
      years: 30,
      rate: 4.2,
      monthlyPayment: '',
      totalInterest: '',
      totalPayment: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '房贷计算器 - 帮你算算每月还多少',
      path: '/packages/financial/pages/mortgage/mortgage',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '房贷计算器 - 帮你算算每月还多少',
      imageUrl: ''
    }
  }
})