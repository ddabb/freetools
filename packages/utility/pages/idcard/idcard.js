// packages/utility/pages/idcard/idcard.js
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
    const idcard = this.data.idcard.trim()

    if (!idcard) {
      wx.showToast({
        title: '请输入身份证号码',
        icon: 'none'
      })
      return
    }

    const result = this.checkIdcard(idcard)

    this.setData({
      result,
      showResult: true
    })

    if (result.valid) {
      wx.showToast({
        title: '验证通过',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '验证失败',
        icon: 'none'
      })
    }
  },

  checkIdcard(idcard) {
    // 基本格式检查
    if (!idcard || typeof idcard !== 'string') {
      return { valid: false, message: '身份证号码不能为空' }
    }

    // 长度检查
    if (idcard.length !== 18) {
      return { valid: false, message: '身份证号码长度应为18位' }
    }

    // 正则检查
    const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    if (!regex.test(idcard)) {
      return { valid: false, message: '身份证号码格式不正确' }
    }

    // 地区码检查
    const province = idcard.substring(0, 2)
    const provinces = ['11', '12', '13', '14', '15', '21', '22', '23', '31', '32', '33', '34', '35', '36', '37', '41', '42', '43', '44', '45', '46', '50', '51', '52', '53', '54', '61', '62', '63', '64', '65', '71', '81', '82', '91']
    if (!provinces.includes(province)) {
      return { valid: false, message: '身份证地区码不正确' }
    }

    // 出生日期检查
    const birthday = idcard.substring(6, 14)
    const birthDate = new Date(birthday.substring(0, 4), parseInt(birthday.substring(4, 6)) - 1, birthday.substring(6, 8))
    const now = new Date()

    if (birthDate > now) {
      return { valid: false, message: '出生日期不能为未来日期' }
    }

    if (now.getFullYear() - birthDate.getFullYear() > 150) {
      return { valid: false, message: '出生日期超出合理范围' }
    }

    // 校验码检查
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idcard.charAt(i)) * weights[i]
    }

    const checkCode = checkCodes[sum % 11]
    if (idcard.charAt(17).toUpperCase() !== checkCode) {
      return { valid: false, message: '身份证校验码不正确' }
    }

    // 解析信息
    const gender = parseInt(idcard.charAt(16)) % 2 === 1 ? '男' : '女'
    const age = now.getFullYear() - birthDate.getFullYear()

    const month = (birthDate.getMonth() + 1).toString().padStart(2, '0')
    const day = birthDate.getDate().toString().padStart(2, '0')
    const birthdayStr = `${birthDate.getFullYear()}-${month}-${day}`

    return {
      valid: true,
      message: '验证通过',
      gender,
      age,
      birthday: birthdayStr
    }
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
