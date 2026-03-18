// oddEven.js - 判断奇偶数功能
Page({
  data: {
    inputValue: '',
    result: {},
    showResult: false,
    loading: false,
    inputFocus: false
  },

  /**
   * 输入框内容变化事件
   */
  onInputChange: function(e) {
    this.setData({
      inputValue: e.detail.value,
      showResult: false // 清空之前的结果
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

    this.setData({ loading: true });
    
    // 模拟判断过程
    setTimeout(() => {
      const isEven = num % 2 === 0;
      const remainder = num % 2;
      const previousNumber = num - 1;
      const nextNumber = num + 1;
      const resultText = isEven ? num + ' 是偶数' : num + ' 是奇数';
      const explanation = isEven ? 
        num + ' 能被2整除，余数为0，因此是偶数。' : 
        num + ' 不能被2整除，余数为1，因此是奇数。';
      
      this.setData({
        result: {
          number: num,
          isEven: isEven,
          resultText: resultText,
          remainder: remainder,
          previousNumber: previousNumber,
          nextNumber: nextNumber,
          explanation: explanation
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

  /**
   * 清空输入和结果
   */
  clearInput: function() {
    this.setData({
      inputValue: '',
      result: {},
      showResult: false
    });
  },

  /**
   * 重置功能
   */
  reset: function() {
    this.setData({
      inputValue: '',
      result: {},
      showResult: false
    });
  },

  /**
   * 复制结果
   */
  copyResult: function() {
    const result = this.data.result;
    const copyText = `判断结果：\n输入数字：${result.number}\n判断结果：${result.resultText}\n除以2余数：${result.remainder}\n相邻数字：${result.previousNumber}, ${result.nextNumber}`;
    
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
    this.reset();
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
      title: '奇偶判断 - 快速判断数字的奇偶性',
      path: '/packages/math/pages/oddEven/oddEven'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '奇偶判断 - 快速判断数字的奇偶性',
      query: 'oddEven'
    };
  }
});