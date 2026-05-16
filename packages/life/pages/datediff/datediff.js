//datediff.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    startDate: '',
    endDate: '',
    result: '',
    currentYear: new Date().getFullYear()
  },
  startDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
    this.calculateDateDiff();
  },
  endDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
    this.calculateDateDiff();
  },
  calculateDateDiff: function() {
    var startDate = this.data.startDate;
    var endDate = this.data.endDate;
    
    if (!startDate || !endDate) {
      this.setData({
        result: ''
      });
      return;
    }
    
    var start = new Date(startDate);
    var end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.setData({
        result: ''
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
    // 页面首次渲染完成
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
  onShareAppMessage: function() {
    return {
      title: '日期差计算器',
      path: '/packages/life/pages/datediff/datediff'
    }
  }
})
