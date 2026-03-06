//datediff.js
Page({
  data: {
    startDate: '',
    endDate: '',
    result: ''
  },
  startDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  endDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  },
  calculateDateDiff: function() {
    var startDate = this.data.startDate;
    var endDate = this.data.endDate;
    
    if (!startDate || !endDate) {
      wx.showToast({
        title: '请选择开始日期和结束日期',
        icon: 'none'
      });
      return;
    }
    
    var start = new Date(startDate);
    var end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      wx.showToast({
        title: '请选择有效的日期',
        icon: 'none'
      });
      return;
    }
    
    var diffTime = Math.abs(end - start);
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.setData({
      result: '两个日期之间相差 ' + diffDays + ' 天'
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