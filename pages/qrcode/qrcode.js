// qrcode.js
Page({
  data: {
    inputContent: '', // 输入内容
    qrcodeType: 'text', // 二维码类型：text-文本, url-网址, card-名片
    showQrcode: false // 是否显示二维码
  },
  
  // 设置输入内容
  setInputContent(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },
  
  // 设置二维码类型
  setQrcodeType(e) {
    this.setData({
      qrcodeType: e.currentTarget.dataset.type
    });
  },
  
  // 生成二维码
  generate() {
    const { inputContent } = this.data;
    if (!inputContent) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    // 实际开发中，这里需要使用二维码生成库生成二维码
    // 这里仅做模拟
    this.setData({
      showQrcode: true
    });
  },
  
  // 保存二维码
  saveQrcode() {
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },
  
  // 分享二维码
  shareQrcode() {
    wx.showToast({
      title: '分享成功',
      icon: 'success'
    });
  }
})