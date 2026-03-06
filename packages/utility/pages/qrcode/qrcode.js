// packages/utility/pages/qrcode/qrcode.js
// 使用 npm 安装的 weapp-qrcode-canvas-2d 包
const QRCode = require('weapp-qrcode-canvas-2d')

Page({
  data: {
    text: '',
    qrcodeSize: 280,
    qrcodeText: '',
    showQrcode: false,
    generating: false,
    contentType: 'text',
    qrSize: 280,
    errorLevels: ['L (低)', 'M (中)', 'Q (较高)', 'H (高)'],
    errorLevelIndex: 1
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '二维码生成器'
    })
    // 设置默认示例文本
    this.setDefaultContent()
  },

  // 设置默认内容
  setDefaultContent() {
    const defaultText = '欢迎使用二维码生成器！'
    this.setData({
      text: defaultText
    })
  },

  // 切换内容类型
  switchContentType(e) {
    const type = e.currentTarget.dataset.type
    let placeholder = ''
    let defaultText = ''
    
    switch(type) {
      case 'text':
        placeholder = '请输入要生成二维码的文本内容'
        defaultText = '这是一段示例文本，可以生成对应的二维码'
        break
      case 'url':
        placeholder = '请输入网址，如：https://www.qq.com'
        defaultText = 'https://www.qq.com'
        break
      case 'contact':
        placeholder = '请输入联系方式，如：姓名:电话:邮箱'
        defaultText = '张三:13800138000:zhang@example.com'
        break
    }
    
    this.setData({
      contentType: type,
      text: defaultText
    })
  },

  // 获取输入标签
  getInputLabel() {
    switch(this.data.contentType) {
      case 'text': return '文本内容'
      case 'url': return '网址链接'
      case 'contact': return '联系信息'
      default: return '内容'
    }
  },

  // 获取输入占位符
  getInputPlaceholder() {
    switch(this.data.contentType) {
      case 'text': return '请输入要生成二维码的文本内容'
      case 'url': return '请输入网址，如：https://example.com'
      case 'contact': return '请输入联系方式，如：姓名:电话:邮箱'
      default: return '请输入内容'
    }
  },

  // 改变二维码尺寸
  changeQrSize(e) {
    const size = parseInt(e.currentTarget.dataset.size)
    this.setData({
      qrSize: size,
      qrcodeSize: size
    })
    
    // 如果已有二维码，重新生成
    if (this.data.showQrcode) {
      setTimeout(() => {
        this.createQRCode(this.data.text)
      }, 100)
    }
  },

  // 容错级别变化
  onErrorLevelChange(e) {
    this.setData({
      errorLevelIndex: e.detail.value
    })
    
    // 如果已有二维码，重新生成
    if (this.data.showQrcode) {
      setTimeout(() => {
        this.createQRCode(this.data.text)
      }, 100)
    }
  },

  // 应用模板
  applyTemplate(e) {
    const template = e.currentTarget.dataset.template
    this.setData({
      text: template
    })
  },

  onTextInput(e) {
    this.setData({
      text: e.detail.value
    })
  },

  // 从剪贴板粘贴
  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({
            text: res.data
          })
          wx.showToast({
            title: '已粘贴',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '剪贴板为空',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '粘贴失败',
          icon: 'none'
        })
      }
    })
  },

  get canGenerate() {
    return this.data.text.trim().length > 0
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
      generating: true,
      showQrcode: true 
    })

    // 延迟生成二维码，确保DOM渲染完成
    setTimeout(() => {
      this.createQRCode(text)
      this.setData({ generating: false })
      
      wx.showToast({
        title: '生成成功',
        icon: 'success'
      })
    }, 300)
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
        canvas.width = this.data.qrSize * dpr
        canvas.height = this.data.qrSize * dpr
        ctx.scale(dpr, dpr)

        // 错误级别映射
        const errorLevelMap = ['L', 'M', 'Q', 'H']
        const errorLevel = errorLevelMap[this.data.errorLevelIndex] || 'M'

        // 使用微信小程序兼容的二维码生成库
        QRCode({
          canvas: canvas,
          text: text,
          width: this.data.qrSize,
          height: this.data.qrSize,
          padding: 20,
          background: '#ffffff',
          foreground: '#000000',
          correctLevel: QRCode.CorrectLevel[errorLevel]
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

  // 获取显示文本（截断长文本）
  getDisplayText() {
    const text = this.data.qrcodeText
    if (text.length <= 50) return text
    return text.substring(0, 47) + '...'
  },

  // 保存图片
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
                if (err.errMsg.includes('auth deny')) {
                  wx.showModal({
                    title: '需要授权',
                    content: '需要相册权限才能保存图片，请在设置中开启',
                    showCancel: false
                  })
                } else {
                  wx.showToast({
                    title: '保存失败',
                    icon: 'none'
                  })
                }
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

  // 分享二维码
  shareQRCode() {
    wx.showActionSheet({
      itemList: ['生成分享图', '复制链接', '取消'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.generateShareImage()
        } else if (res.tapIndex === 1) {
          this.copyContent()
        }
      }
    })
  },

  // 生成分享图（简化版）
  generateShareImage() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  // 复制内容
  copyContent() {
    wx.setClipboardData({
      data: this.data.qrcodeText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  clear() {
    this.setData({
      text: '',
      qrcodeText: '',
      showQrcode: false
    })
    this.setDefaultContent()
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '二维码生成器 - 轻松创建个性化二维码',
      path: '/packages/utility/pages/qrcode/qrcode',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '二维码生成器 - 功能强大的二维码制作工具',
      imageUrl: ''
    }
  }
})