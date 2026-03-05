// password-generator.js
Page({
  data: {
    passwordLength: 12, // 密码长度
    includeLowercase: true, // 包含小写字母
    includeUppercase: true, // 包含大写字母
    includeNumbers: true, // 包含数字
    includeSymbols: true, // 包含特殊字符
    generatedPassword: '', // 生成的密码
    passwordStrength: '', // 密码强度
    passwordStrengthText: '' // 密码强度文本
  },
  
  // 设置密码长度
  setPasswordLength(e) {
    this.setData({
      passwordLength: parseInt(e.detail.value) || 0
    });
  },
  
  // 切换小写字母
  toggleLowercase() {
    this.setData({
      includeLowercase: !this.data.includeLowercase
    });
  },
  
  // 切换大写字母
  toggleUppercase() {
    this.setData({
      includeUppercase: !this.data.includeUppercase
    });
  },
  
  // 切换数字
  toggleNumbers() {
    this.setData({
      includeNumbers: !this.data.includeNumbers
    });
  },
  
  // 切换特殊字符
  toggleSymbols() {
    this.setData({
      includeSymbols: !this.data.includeSymbols
    });
  },
  
  // 生成密码
  generate() {
    const { passwordLength, includeLowercase, includeUppercase, includeNumbers, includeSymbols } = this.data;
    
    if (!passwordLength) {
      wx.showToast({
        title: '请输入密码长度',
        icon: 'none'
      });
      return;
    }
    
    if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) {
      wx.showToast({
        title: '请至少选择一种字符类型',
        icon: 'none'
      });
      return;
    }
    
    // 字符集
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // 生成密码
    let password = '';
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // 计算密码强度
    let strength = 'weak';
    let strengthText = '弱';
    
    if (passwordLength >= 12 && includeLowercase && includeUppercase && includeNumbers && includeSymbols) {
      strength = 'strong';
      strengthText = '强';
    } else if (passwordLength >= 8 && (includeLowercase || includeUppercase) && includeNumbers) {
      strength = 'medium';
      strengthText = '中等';
    }
    
    // 更新结果
    this.setData({
      generatedPassword: password,
      passwordStrength: strength,
      passwordStrengthText: strengthText
    });
  },
  
  // 复制密码
  copyPassword() {
    const { generatedPassword } = this.data;
    if (!generatedPassword) return;
    
    wx.setClipboardData({
      data: generatedPassword,
      success() {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  }
})