//idcard.js
const idcard = require('idcard-tool');

Page({
  data: {
    idCard: '',
    result: ''
  },
  inputChange: function(e) {
    this.setData({
      idCard: e.detail.value
    });
  },
  parseIdCard: function() {
    var idCard = this.data.idCard;
    if (!idCard) {
      wx.showToast({
        title: '请输入身份证号码',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '验证中...'
    });
    
    try {
      const result = idcard(idCard.toUpperCase());
      wx.hideLoading();
      
      if (typeof result === 'object' && result !== null) {
        let output = `你输入的 ${idCard} 的验证结果是：\n`;
        output += `类型：${result.type || '居民身份证'}\n`;
        output += `签发地点：${result.sign || '未知地区'}\n`;
        output += `国家：${result.country || '中国'}\n`;
        output += `生日：${result.birthday || '未知'}\n`;
        output += `性别：${result.sex || '未知'}\n`;
        output += `验证状态：${result.isValid ? '有效' : '无效'}`;
        
        this.setData({
          result: output
        });
      } else {
        this.setData({
          result: result
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message,
        icon: 'none'
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