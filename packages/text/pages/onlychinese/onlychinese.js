//onlychinese.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    inputText: '',
    result: {},
    showResult: false,
    loading: false,
    inputFocus: false
  },
  onTextInput: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  detectChinese: function() {
    var inputText = this.data.inputText;
    if (!inputText) {
      wx.showToast({
        title: '请输入需要检测的文本',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 模拟检测过程
    setTimeout(() => {
      var totalChars = inputText.length;
      var chineseChars = (inputText.match(/[\u4e00-\u9fa5]/g) || []).length;
      var chinesePercentage = totalChars > 0 ? Math.round((chineseChars / totalChars) * 100) : 0;
      var hasChinese = chineseChars > 0;
      var extractedChinese = inputText.match(/[\u4e00-\u9fa5]+/g)?.join('') || '';
      
      this.setData({
        result: {
          totalChars: totalChars,
          chineseChars: chineseChars,
          chinesePercentage: chinesePercentage,
          hasChinese: hasChinese,
          extractedChinese: extractedChinese
        },
        showResult: true,
        loading: false
      });
    }, 300);
  },
  clearInput: function() {
    this.setData({
      inputText: '',
      result: {},
      showResult: false
    });
  },
  copyResult: function() {
    var result = this.data.result;
    var copyText = `检测结果：\n总字符数：${result.totalChars}\n中文字符数：${result.chineseChars}\n中文占比：${result.chinesePercentage}%\n检测结果：${result.hasChinese ? '包含中文' : '不含中文'}`;
    
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
  copyExtracted: function() {
    var extractedChinese = this.data.result.extractedChinese;
    if (extractedChinese) {
      wx.setClipboardData({
        data: extractedChinese,
        success: function() {
          wx.showToast({
            title: '中文内容已复制',
            icon: 'success'
          });
        }
      });
    } else {
      wx.showToast({
        title: '无中文内容可复制',
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