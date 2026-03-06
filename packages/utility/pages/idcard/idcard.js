// packages/utility/pages/idcard/idcard.js
const idcard = require('idcard-tool')

Page({
  data: {
    idcard: '',
    result: null,
    showResult: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '身份证验证'
    })
  },

  onIdcardInput(e) {
    this.setData({
      idcard: e.detail.value.trim()
    })
  },

  validate() {
    const idcardNumber = this.data.idcard.trim()

    if (!idcardNumber) {
      wx.showToast({
        title: '请输入身份证号码',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '验证中...'
    })

    try {
      const result = idcard(idcardNumber.toUpperCase())
      wx.hideLoading()

      if (typeof result === 'object' && result !== null) {
        let output = {
          valid: true,
          message: '验证通过',
          gender: result.sex || '未知',
          age: this.calculateAge(result.birthday),
          birthday: result.birthday || '未知',
          sign: result.sign || '未知地区'
        }

        this.setData({
          result: output,
          showResult: true
        })

        wx.showToast({
          title: '验证通过',
          icon: 'success'
        })
      } else {
        this.setData({
          result: {
            valid: false,
            message: result
          },
          showResult: true
        })

        wx.showToast({
          title: '验证失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message,
        icon: 'none'
      })
    }
  },

  calculateAge(birthday) {
    if (!birthday) return '未知'
    const birthDate = new Date(birthday)
    const now = new Date()
    return now.getFullYear() - birthDate.getFullYear()
  },

  reset() {
    this.setData({
      idcard: '',
      result: null,
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '身份证验证 - 快速验证身份证号码',
      path: '/packages/utility/pages/idcard/idcard',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '身份证验证 - 快速验证身份证号码',
      imageUrl: ''
    }
  }
})
