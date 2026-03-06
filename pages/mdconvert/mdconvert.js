//mdconvert.js
Page({
  data: {
    mdText: '',
    htmlResult: ''
  },
  mdInputChange: function(e) {
    this.setData({
      mdText: e.detail.value
    });
  },
  convertToHtml: function() {
    var mdText = this.data.mdText;
    if (!mdText) {
      wx.showToast({
        title: '请输入Markdown文本',
        icon: 'none'
      });
      return;
    }
    
    // 基本的Markdown转换
    var html = mdText
      // 标题
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // 无序列表
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // 换行
      .replace(/\n/gim, '<br>');
    
    this.setData({
      htmlResult: html
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