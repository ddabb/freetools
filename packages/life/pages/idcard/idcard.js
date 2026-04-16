// packages/utility/pages/idcard/idcard.js
const idcard = require('idcard-tool')
const utils = require('../../../../utils/index')

Page({
  data: {
    idcard: '',
    result: null,
    showResult: false,
    loading: false,
    inputFocus: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '身份证验�?
    })
  },

  onIdcardInput(e) {
    const value = e.detail.value.trim()
    this.setData({
      idcard: value
    })
    
    // 自动聚焦输入框获得更好体�?
    if (value.length === 0 && !this.data.inputFocus) {
      this.setData({ inputFocus: true })
    }
  },



  // 清空输入
  clearInput() {
    this.setData({
      idcard: '',
      inputFocus: true,
      showResult: false,
      result: null
    })
  },

  validate() {
    const idcardNumber = this.data.idcard.trim()

    if (!idcardNumber) {
      utils.showText('请输入身份证号码')
      return
    }

    if (idcardNumber.length < 18) {
      utils.showText('请输入完整的18位身份证号码')
      return
    }

    this.setData({ loading: true })

    // 模拟异步验证，增加真实感
    setTimeout(() => {
      try {
        const result = idcard(idcardNumber.toUpperCase())
        this.setData({ loading: false })

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

          utils.showSuccess('验证通过')
        } else {
          this.setData({
            result: {
              valid: false,
              message: result
            },
            showResult: true
          })

          utils.showText('验证失败')
        }
      } catch (error) {
        this.setData({ loading: false })
        utils.showText(error.message || '验证出错，请重试')
      }
    }, 800) // 模拟网络延迟
  },

  // 重新验证
  retryValidation() {
    this.clearInput()
    setTimeout(() => {
      this.validate()
    }, 300)
  },

  // 复制验证结果
  copyResult() {
    if (!this.data.result || !this.data.result.valid) return
    
    const result = this.data.result
    const copyText = `
身份证验证结果：
性别�?{result.gender}
年龄�?{result.age}�?
出生日期�?{result.birthday}
签发地点�?{result.sign}
验证状态：通过
    `.trim()
    
    wx.setClipboardData({
      data: copyText,
      success: () => {
        utils.showSuccess('已复制到剪贴�?)
      },
      fail: () => {
        utils.showText('复制失败')
      }
    })
  },

  calculateAge(birthday) {
    if (!birthday) return '未知'
    try {
      const birthDate = new Date(birthday)
      const now = new Date()
      let age = now.getFullYear() - birthDate.getFullYear()
      const monthDiff = now.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age > 0 ? age : '未知'
    } catch (error) {
      return '未知'
    }
  },

  // 分享给好�?
  },

  // 分享到朋友圈
  }
})
