// mortgage.js
Page({
  data: {
    loanType: 'commercial', // 贷款类型：commercial-商业贷款, fund-公积金贷款, composite-组合贷款
    loanAmount: 100, // 贷款金额（万元）
    loanTerm: 30, // 贷款期限（年）
    loanRate: 4.9, // 贷款利率（%）
    repaymentType: 'equal-principal-interest', // 还款方式：equal-principal-interest-等额本息, equal-principal-等额本金
    showResult: false, // 是否显示结果
    monthlyPayment: '0.00 元', // 每月还款
    totalInterest: '0.00 元', // 总利息
    totalPayment: '0.00 元' // 还款总额
  },
  
  // 设置贷款类型
  setLoanType(e) {
    this.setData({
      loanType: e.currentTarget.dataset.type
    });
  },
  
  // 设置贷款金额
  setLoanAmount(e) {
    this.setData({
      loanAmount: parseFloat(e.detail.value) || 0
    });
  },
  
  // 设置贷款期限
  setLoanTerm(e) {
    this.setData({
      loanTerm: parseInt(e.detail.value) || 0
    });
  },
  
  // 设置贷款利率
  setLoanRate(e) {
    this.setData({
      loanRate: parseFloat(e.detail.value) || 0
    });
  },
  
  // 设置还款方式
  setRepaymentType(e) {
    this.setData({
      repaymentType: e.currentTarget.dataset.type
    });
  },
  
  // 计算房贷
  calculate() {
    const { loanAmount, loanTerm, loanRate, repaymentType } = this.data;
    
    // 转换为月利率和还款月数
    const monthlyRate = loanRate / 100 / 12;
    const totalMonths = loanTerm * 12;
    const principal = loanAmount * 10000; // 转换为元
    
    let monthlyPayment, totalInterest, totalPayment;
    
    if (repaymentType === 'equal-principal-interest') {
      // 等额本息计算
      monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      totalPayment = monthlyPayment * totalMonths;
      totalInterest = totalPayment - principal;
    } else {
      // 等额本金计算（首月还款）
      const monthlyPrincipal = principal / totalMonths;
      const firstMonthInterest = principal * monthlyRate;
      monthlyPayment = monthlyPrincipal + firstMonthInterest;
      totalInterest = (principal * monthlyRate * (totalMonths + 1)) / 2;
      totalPayment = principal + totalInterest;
    }
    
    // 更新结果
    this.setData({
      showResult: true,
      monthlyPayment: monthlyPayment.toFixed(2) + ' 元',
      totalInterest: totalInterest.toFixed(2) + ' 元',
      totalPayment: totalPayment.toFixed(2) + ' 元'
    });
  }
})