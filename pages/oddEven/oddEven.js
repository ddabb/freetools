//oddEven.js
Page({
  data: {
    number: '',
    result: ''
  },
  inputChange: function(e) {
    this.setData({
      number: e.detail.value
    });
  },
  checkOddEven: function() {
    var number = this.data.number;
    if (!number) {
      wx.showToast({
        title: '请输入一个整数',
        icon: 'none'
      });
      return;
    }
    
    var num = parseInt(number);
    if (isNaN(num)) {
      wx.showToast({
        title: '请输入有效的整数',
        icon: 'none'
      });
      return;
    }
    
    if (num % 2 === 0) {
      this.setData({
        result: num + ' 是偶数'
      });
    } else {
      this.setData({
        result: num + ' 是奇数'
      });
    }
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