// oddEven.js - 判断奇偶数功能
Page({
  data: {
    inputValue: '',
    result: ''
  },

  /**
   * 输入框内容变化事件
   */
  onInputChange: function(e) {
    this.setData({
      inputValue: e.detail.value,
      result: '' // 清空之前的结果
    });
  },

  /**
   * 判断奇偶数主函数
   */
  checkOddEven: function() {
    const inputValue = this.data.inputValue.trim();
    
    // 空值校验
    if (!inputValue) {
      wx.showToast({
        title: '请输入一个整数',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 数值转换和校验
    const num = parseInt(inputValue);
    if (isNaN(num)) {
      wx.showToast({
        title: '请输入有效的整数',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 判断奇偶数
    let result = '';
    let emoji = '';
    
    if (num % 2 === 0) {
      result = `${num} 是偶数`;
      emoji = '✨';
    } else {
      result = `${num} 是奇数`;
      emoji = '🎯';
    }

    // 显示结果
    this.setData({
      result: `${emoji} ${result}`
    });

    // 添加成功反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  /**
   * 清空输入和结果
   */
  clearAll: function() {
    this.setData({
      inputValue: '',
      result: ''
    });
  },

  /**
   * 页面加载完成
   */
  onLoad: function(options) {
    console.log('奇偶数判断页面加载完成');
    // 如果有传入的数值参数，自动填充
    if (options.number) {
      this.setData({
        inputValue: options.number
      });
    }
  },

  /**
   * 页面初次渲染完成
   */
  onReady: function() {
    console.log('奇偶数判断页面渲染完成');
  },

  /**
   * 页面显示
   */
  onShow: function() {
    console.log('奇偶数判断页面显示');
  },

  /**
   * 页面隐藏
   */
  onHide: function() {
    console.log('奇偶数判断页面隐藏');
  },

  /**
   * 页面卸载
   */
  onUnload: function() {
    console.log('奇偶数判断页面卸载');
  },

  /**
   * 监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.clearAll();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    // 可以在这里添加加载更多逻辑
  },

/**
 * 用户点击右上角分享
 */
  onShareAppMessage: function() {
    return {
      title: '奇偶数判断工具',
      path: '/packages/utility/pages/oddEven/oddEven'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '奇偶数判断工具 - 快速判断奇偶数',
      query: 'oddEven'
    };
  }
});