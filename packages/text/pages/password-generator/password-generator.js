// packages/utility/pages/password-generator/password-generator.js
const utils = require('../../../../utils/index');

Page({
  data: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    password: '',
    strength: '',
    showPassword: false,
    strengthPercent: 0,
    strengthClass: '',
    avoidSimilar: true,
    requireEachType: false,
    showAdvanced: false,
    uppercaseChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercaseChars: 'abcdefghijklmnopqrstuvwxyz',
    numberChars: '0123456789',
    symbolChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similarChars: '0O1lI'
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '密码生成器'
    })
    this.generate()
  },

  // 减少长度
  decreaseLength() {
    if (this.data.length > 6) {
      this.setData({ length: this.data.length - 1 })
      this.generate()
    }
  },

  // 增加长度
  increaseLength() {
    if (this.data.length < 32) {
      this.setData({ length: this.data.length + 1 })
      this.generate()
    }
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

  // 切换密码可见性
  toggleVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  // 切换高级选项
  toggleAdvanced() {
    this.setData({
      showAdvanced: !this.data.showAdvanced
    })
  },

  // 避免相似字符变化
  onAvoidSimilarChange(e) {
    this.setData({
      avoidSimilar: e.detail.value
    })
    this.generate()
  },

  // 必须包含每种类型变化
  onRequireEachTypeChange(e) {
    this.setData({
      requireEachType: e.detail.value
    })
    this.generate()
  },

  generate() {
    const { 
      length, 
      includeUppercase, 
      includeLowercase, 
      includeNumbers, 
      includeSymbols,
      avoidSimilar,
      requireEachType,
      uppercaseChars,
      lowercaseChars,
      numberChars,
      symbolChars,
      similarChars
    } = this.data

    let charset = ''
    if (includeUppercase) charset += uppercaseChars
    if (includeLowercase) charset += lowercaseChars
    if (includeNumbers) charset += numberChars
    if (includeSymbols) charset += symbolChars

    // 移除相似字符
    if (avoidSimilar) {
      similarChars.split('').forEach(char => {
        charset = charset.replace(new RegExp(char, 'g'), '')
      })
    }

    if (!charset) {
      this.setData({
        password: '',
        strength: '',
        strengthPercent: 0,
        strengthClass: ''
      })
      utils.showText('至少选择一种字符类型');
      return
    }

    let password = ''
    let attempts = 0
    const maxAttempts = 50

    while (attempts < maxAttempts) {
      password = ''
      
      // 确保每种选中的类型至少包含一个字符
      if (requireEachType) {
        if (includeUppercase) {
          const chars = avoidSimilar ? uppercaseChars.replace(/[0O1lI]/g, '') : uppercaseChars
          password += chars[Math.floor(Math.random() * chars.length)]
        }
        if (includeLowercase) {
          const chars = avoidSimilar ? lowercaseChars.replace(/[0O1lI]/g, '') : lowercaseChars
          password += chars[Math.floor(Math.random() * chars.length)]
        }
        if (includeNumbers) {
          const chars = avoidSimilar ? numberChars.replace(/[0O1lI]/g, '') : numberChars
          password += chars[Math.floor(Math.random() * chars.length)]
        }
        if (includeSymbols) {
          password += symbolChars[Math.floor(Math.random() * symbolChars.length)]
        }
      }

      // 填充剩余长度
      const remainingLength = length - password.length
      for (let i = 0; i < remainingLength; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
      }

      // 打乱密码字符顺序
      password = password.split('').sort(() => Math.random() - 0.5).join('')
      
      // 检查是否满足要求
      if (this.validatePassword(password)) {
        break
      }
      
      attempts++
    }

    const strength = this.calculateStrength(password)
    const strengthInfo = this.getStrengthInfo(strength)

    this.setData({
      password,
      strength,
      strengthPercent: strengthInfo.percent,
      strengthClass: strengthInfo.class
    })
  },

  // 验证密码是否满足要求
  validatePassword(password) {
    const { includeUppercase, includeLowercase, includeNumbers, includeSymbols } = this.data
    
    if (includeUppercase && !/[A-Z]/.test(password)) return false
    if (includeLowercase && !/[a-z]/.test(password)) return false
    if (includeNumbers && !/[0-9]/.test(password)) return false
    if (includeSymbols && !/[^A-Za-z0-9]/.test(password)) return false
    
    return true
  },

  // 获取强度详细信息
  getStrengthInfo(strength) {
    const strengthMap = {
      '极强': { percent: 100, class: 'very-strong' },
      '强': { percent: 80, class: 'strong' },
      '中等': { percent: 60, class: 'medium' },
      '弱': { percent: 40, class: 'weak' },
      '极弱': { percent: 20, class: 'very-weak' }
    }
    return strengthMap[strength] || { percent: 20, class: 'very-weak' }
  },

  calculateStrength(password) {
    let score = 0
    let tips = []

    // 长度评分
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    
    if (password.length < 8) tips.push('增加密码长度')
    if (password.length < 12) tips.push('建议使用12位以上')

    // 字符类型评分
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (!/[a-z]/.test(password) && this.data.includeLowercase) tips.push('添加小写字母')
    if (!/[A-Z]/.test(password) && this.data.includeUppercase) tips.push('添加大写字母')
    if (!/[0-9]/.test(password) && this.data.includeNumbers) tips.push('添加数字')
    if (!/[^A-Za-z0-9]/.test(password) && this.data.includeSymbols) tips.push('添加特殊字符')

    // 复杂度评分
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) score += 1
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) score += 1

    // 确定强度等级
    if (score >= 8) return '极强'
    if (score >= 6) return '强'
    if (score >= 4) return '中等'
    if (score >= 2) return '弱'
    return '极弱'
  },

  copyPassword() {
    if (!this.data.password) return
    
    wx.setClipboardData({
      data: this.data.password,
      success: () => {
        utils.showSuccess('已复制到剪贴板');
      },
      fail: () => {
        utils.showText('复制失败');
      }
    })
  },

  // 保存密码到本地
  savePassword() {
    if (!this.data.password) return
    
    const passwords = wx.getStorageSync('savedPasswords') || []
    const newPassword = {
      password: this.data.password,
      strength: this.data.strength,
      length: this.data.length,
      createTime: new Date().toLocaleString()
    }
    
    passwords.unshift(newPassword)
    
    // 只保留最近10个
    if (passwords.length > 10) {
      passwords.splice(10)
    }
    
    wx.setStorageSync('savedPasswords', passwords)
    
    utils.showSuccess('已保存密码');
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '密码生成器 - 创建企业级安全密码',
      path: '/packages/utility/pages/password-generator/password-generator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '密码生成器 - 创建企业级安全密码',
      query: 'password-generator'
    }
  }
})