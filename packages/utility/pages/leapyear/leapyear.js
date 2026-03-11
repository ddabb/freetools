//leapyear.js
Page({
  data: {
    year: '',
    result: ''
  },
  inputChange: function(e) {
    this.setData({
      year: e.detail.value
    });
  },
  checkLeapYear: function() {
    var year = this.data.year;
    if (!year) {
      wx.showToast({
        title: '请输入年份',
        icon: 'none'
      });
      return;
    }
    
    var y = parseInt(year);
    if (isNaN(y)) {
      wx.showToast({
        title: '请输入有效的年份',
        icon: 'none'
      });
      return;
    }
    
    if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) {
      this.setData({
        result: y + ' 年是闰年'
      });
    } else {
      this.setData({
        result: y + ' 年不是闰年'
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
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '闰年计算器 - 判断年份是否为闰年',
      path: '/packages/utility/pages/leapyear/leapyear'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '闰年计算器 - 判断年份是否为闰年',
      query: 'leapyear'
    }
  }
})