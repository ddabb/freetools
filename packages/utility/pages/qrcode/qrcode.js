// packages/utility/pages/qrcode/qrcode.js
Page({
  data: {
    text: '',
    qrcodeSize: 300,
    qrcodeText: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '二维码生成'
    })
  },

  onTextInput(e) {
    this.setData({
      text: e.detail.value
    })
  },

  generate() {
    const text = this.data.text.trim()
    if (!text) {
      wx.showToast({
        title: '请输入要生成的内容',
        icon: 'none'
      })
      return
    }

    this.setData({
      qrcodeText: text
    })

    wx.showToast({
      title: '生成成功',
      icon: 'success'
    })
  },

  saveImage() {
    wx.showToast({
      title: '保存功能开发中',
      icon: 'none'
    })
  },

  clear() {
    this.setData({
      text: '',
      qrcodeText: ''
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '二维码生成器 - 轻松生成二维码',
      path: '/packages/utility/pages/qrcode/qrcode',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '二维码生成器 - 轻松生成二维码',
      imageUrl: ''
    }
  }
})