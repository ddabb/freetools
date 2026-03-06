//onlychinese.js
Page({
  data: {
    htmlText: '',
    purifiedResult: ''
  },
  htmlInputChange: function(e) {
    this.setData({
      htmlText: e.detail.value
    });
  },
  purifyHtml: function() {
    var htmlText = this.data.htmlText;
    if (!htmlText) {
      wx.showToast({
        title: '请输入包含HTML标签的文本',
        icon: 'none'
      });
      return;
    }
    
    // 移除HTML标签，只保留纯文本
    var purifiedText = htmlText.replace(/<[^>]*>/g, '');
    
    this.setData({
      purifiedResult: purifiedText
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