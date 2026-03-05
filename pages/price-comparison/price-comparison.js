// price-comparison.js
Page({
  data: {
    originalPrice: 100, // 原价（元）
    discount: 80, // 折扣（%）
    showResult: false, // 是否显示结果
    discountedPrice: 0, // 折后价格
    savingAmount: 0, // 节省金额
    discountRate: 0 // 折扣力度（折）
  },
  
  // 设置原价
  setOriginalPrice(e) {
    this.setData({
      originalPrice: parseFloat(e.detail.value) || 0
    });
  },
  
  // 设置折扣
  setDiscount(e) {
    this.setData({
      discount: parseFloat(e.detail.value) || 0
    });
  },
  
  // 计算价格
  calculate() {
    const { originalPrice, discount } = this.data;
    if (!originalPrice || !discount) {
      wx.showToast({
        title: '请输入原价和折扣',
        icon: 'none'
      });
      return;
    }
    
    // 计算折后价格
    const discountedPrice = originalPrice * (discount / 100);
    
    // 计算节省金额
    const savingAmount = originalPrice - discountedPrice;
    
    // 计算折扣力度（折）
    const discountRate = discount / 10;
    
    // 更新结果
    this.setData({
      showResult: true,
      discountedPrice: discountedPrice.toFixed(2),
      savingAmount: savingAmount.toFixed(2),
      discountRate: discountRate.toFixed(1)
    });
  }
})