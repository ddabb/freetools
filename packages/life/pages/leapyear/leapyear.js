//leapyear.js
Page({
  data: {
    year: '',
    result: {},
    showResult: false,
    loading: false,
    inputFocus: false
  },
  inputChange: function(e) {
    this.setData({
      year: e.detail.value,
      showResult: false
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
    
    this.setData({ loading: true });
    
    // 模拟判断过程
    setTimeout(() => {
      var isLeapYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      var resultText = isLeapYear ? y + ' 年是闰年' : y + ' 年不是闰年';
      var explanation = '';
      
      if (isLeapYear) {
        if (y % 400 === 0) {
          explanation = y + ' 能被400整除，因此是闰年。';
        } else {
          explanation = y + ' 能被4整除但不能被100整除，因此是闰年。';
        }
      } else {
        if (y % 100 === 0) {
          explanation = y + ' 能被100整除但不能被400整除，因此不是闰年。';
        } else {
          explanation = y + ' 不能被4整除，因此不是闰年。';
        }
      }
      
      var prevYear = y - 1;
      var nextYear = y + 1;
      var prevYearIsLeap = (prevYear % 4 === 0 && prevYear % 100 !== 0) || prevYear % 400 === 0;
      var nextYearIsLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
      
      this.setData({
        result: {
          year: y,
          isLeapYear: isLeapYear,
          resultText: resultText,
          explanation: explanation,
          prevYear: prevYear,
          nextYear: nextYear,
          prevYearIsLeap: prevYearIsLeap,
          nextYearIsLeap: nextYearIsLeap
        },
        showResult: true,
        loading: false
      });

      // 添加成功反馈
      wx.vibrateShort({
        type: 'light'
      });
    }, 300);
  },
  clearInput: function() {
    this.setData({
      year: '',
      result: {},
      showResult: false
    });
  },
  reset: function() {
    this.setData({
      year: '',
      result: {},
      showResult: false
    });
  },
  copyResult: function() {
    var result = this.data.result;
    var copyText = `判断结果：\n输入年份：${result.year}\n判断结果：${result.resultText}\n天数：${result.isLeapYear ? '366天' : '365天'}\n2月天数：${result.isLeapYear ? '29天' : '28天'}`;
    
    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showToast({
          title: '结果已复制',
          icon: 'success'
        });
      }
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
      title: '闰年判断工具',
      path: '/packages/life/pages/leapyear/leapyear'
    }
  }
})
