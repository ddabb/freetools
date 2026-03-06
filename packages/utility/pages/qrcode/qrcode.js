// packages/utility/pages/qrcode/qrcode.js
// 使用 npm 安装的 weapp-qrcode-canvas-2d 包
const QRCode = require('weapp-qrcode-canvas-2d')

Page({
  data: {
    text: 'http://www.60score.com',
    qrcodeSize: 300,
    qrcodeText: '',
    showQrcode: false
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
      qrcodeText: text,
      showQrcode: true
    })

    // 延迟生成二维码，确保DOM渲染完成
    setTimeout(() => {
      this.createQRCode(text)
    }, 100)

    wx.showToast({
      title: '生成成功',
      icon: 'success'
    })
  },

  createQRCode(text) {
    wx.createSelectorQuery()
      .select('#qrcodeCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          wx.showToast({
            title: 'Canvas未找到',
            icon: 'none'
          })
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 设置画布大小
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = 300 * dpr
        canvas.height = 300 * dpr
        ctx.scale(dpr, dpr)

        // 使用微信小程序兼容的二维码生成库
        QRCode({
          canvas: canvas,
          text: text,
          width: 300,
          height: 300,
          padding: 20,
          background: '#ffffff',
          foreground: '#000000'
        }).then(() => {
          console.log('二维码生成成功')
        }).catch(err => {
          console.error('生成二维码失败:', err)
          wx.showToast({
            title: '生成失败',
            icon: 'none'
          })
        })
      })
  },

  saveImage() {
    wx.createSelectorQuery()
      .select('#qrcodeCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          wx.showToast({ title: 'Canvas未找到', icon: 'none' })
          return
        }
        const canvas = res[0].node
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '保存成功',
                  icon: 'success'
                })
              },
              fail: (err) => {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
                console.error('保存图片失败:', err)
              }
            })
          },
          fail: (err) => {
            wx.showToast({
              title: '生成图片失败',
              icon: 'none'
            })
            console.error('canvasToTempFilePath 失败:', err)
          }
        })
      })
  },

  clear() {
    this.setData({
      text: '',
      qrcodeText: '',
      showQrcode: false
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