//retirementCalculator.js
Page({
  data: {
    age: '',
    retirementAge: '',
    result: ''
  },
  ageChange: function(e) {
    this.setData({
      age: e.detail.value
    });
  },
  retirementAgeChange: function(e) {
    this.setData({
      retirementAge: e.detail.value
    });
  },
  calculateRetirement: function() {
    var age = this.data.age;
    var retirementAge = this.data.retirementAge;
    
    if (!age || !retirementAge) {
      wx.showToast({
        title: '请输入当前年龄和退休年龄',
        icon: 'none'
      });
      return;
    }
    
    var currentAge = parseFloat(age);
    var retireAge = parseFloat(retirementAge);
    
    if (isNaN(currentAge) || isNaN(retireAge)) {
      wx.showToast({
        title: '请输入有效的年龄',
        icon: 'none'
      });
      return;
    }
    
    if (currentAge >= retireAge) {
      wx.showToast({
        title: '当前年龄不能大于或等于退休年龄',
        icon: 'none'
      });
      return;
    }
    
    var yearsLeft = retireAge - currentAge;
    var monthsLeft = Math.floor(yearsLeft * 12);
    var daysLeft = Math.floor(yearsLeft * 365);
    
    var result = '距离退休还有：\n' + yearsLeft + ' 年\n' + monthsLeft + ' 个月\n' + daysLeft + ' 天';
    
    this.setData({
      result: result
    });
  },
  onLoad: function (options) {
    // 页面加载
  },
  onReady: function () {
    // 页面初次渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面卸载
  }
})