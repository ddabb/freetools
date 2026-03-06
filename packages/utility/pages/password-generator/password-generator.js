// packages/utility/pages/password-generator/password-generator.js
Page({
  data: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    password: '',
    strength: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '密码生成'
    })
    this.generate()
  },

  onLengthChange(e) {
    this.setData({
      length: parseInt(e.detail.value)
    })
    this.generate()
  },

  onUppercaseChange(e) {
    this.setData({
      includeUppercase: e.detail.value
    })
    this.generate()
  },

  onLowercaseChange(e) {
    this.setData({
      includeLowercase: e.detail.value
    })
    this.generate()
  },

  onNumbersChange(e) {
    this.setData({
      includeNumbers: e.detail.value
    })
    this.generate()
  },

  onSymbolsChange(e) {
    this.setData({
      includeSymbols: e.detail.value
    })
    this.generate()
  },

  generate() {
    const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols } = this.data

    let chars = ''
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers) chars += '0123456789'
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (!chars) {
      this.setData({
        password: '',
        strength: ''
      })
      return
    }

    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const strength = this.calculateStrength(password)

    this.setData({
      password,
      strength
    })
  },

  calculateStrength(password) {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score >= 5) return '强'
    if (score >= 3) return '中等'
    return '弱'
  },

  copyPassword() {
    if (!this.data.password) return

    wx.setClipboardData({
      data: this.data.password,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '密码生成器 - 一键生成安全密码',
      path: '/packages/utility/pages/password-generator/password-generator',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '密码生成器 - 一键生成安全密码',
      imageUrl: ''
    }
  }
})