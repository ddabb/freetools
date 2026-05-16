// oddEven.js - 奇偶判断功能
// 实时计算，无按钮

const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    inputValue: '',
    result: {},
    showResult: false
  },

  /**
   * 输入框内容变化事件 - 实时计算
   */
  onInputChange: function(e) {
    const value = e.detail.value;

    // 清空时直接隐藏结果
    if (!value) {
      this.setData({
        inputValue: '',
        result: {},
        showResult: false
      });
      return;
    }

    // 解析数字
    const num = parseInt(value);
    if (isNaN(num)) return;

    // 执行计算
    this.calculateOddEven(num);
  },

  /**
   * 执行奇偶判断计算
   */
  calculateOddEven: function(num) {
    const isEven = num % 2 === 0;
    const remainder = num % 2;
    const previousNumber = num - 1;
    const nextNumber = num + 1;
    const explanation = isEven ?
      `${num} 能被2整除，余数为0，因此是偶数` :
      `${num} 不能被2整除，余数为1，因此是奇数`;

    this.setData({
      inputValue: String(num),
      result: {
        number: num,
        isEven: isEven,
        remainder: remainder,
        previousNumber: previousNumber,
        nextNumber: nextNumber,
        explanation: explanation
      },
      showResult: true
    });
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
   * 复制结果
   */
  copyResult: function() {
    const result = this.data.result;
    const copyText = `奇偶判断结果：\n数字：${result.number}\n结果：${result.isEven ? '偶数' : '奇数'}\n除以2余数：${result.remainder}`;

    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  /**
   * 页面加载
   */
  onLoad: function(options) {
    if (options.number) {
      this.setData({ inputValue: options.number });
      this.calculateOddEven(parseInt(options.number));
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.clearInput();
    wx.stopPullDownRefresh();
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    return {
      title: '奇偶判断 - 快速判断数字奇偶性',
      path: '/packages/math/pages/oddEven/oddEven'
    };
  },

  onShareTimeline: function() {
    return {
      title: '奇偶判断 - 快速判断数字奇偶性',
      query: 'oddEven'
    };
  }
});
