// packages/text/pages/password-generator/password-generator.js
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
    strengthTip: '',
    avoidSimilar: true,
    requireEachType: false,
    showAdvanced: false,
    canGenerate: true,
    uppercaseChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercaseChars: 'abcdefghijklmnopqrstuvwxyz',
    numberChars: '0123456789',
    symbolChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similarChars: '0O1lI',
    // 预设模板
    templates: [
      {
        name: '标准密码',
        desc: '日常网站使用',
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        active: false
      },
      {
        name: '简单密码,
        desc: '临时快速使用,
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        active: false
      },
      {
        name: '强密码,
        desc: '重要账户使用',
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        active: false
      },
      {
        name: 'WiFi密码',
        desc: '路由器使用,
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        active: false
      }
    ]
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '密码生成器
    });
    this.generate();
  },

  // 减少长度
  decreaseLength() {
    if (this.data.length > 6) {
      this.setData({ length: this.data.length - 1 });
      this.generate();
    }
  },

  // 增加长度
  increaseLength() {
    if (this.data.length < 32) {
      this.setData({ length: this.data.length + 1 });
      this.generate();
    }
  },

  // 设置预设长度
  setLength(e) {
    const length = parseInt(e.currentTarget.dataset.length);
    this.setData({ length });
    this.generate();
  },

  // 滑块变化
  onLengthChange(e) {
    this.setData({
      length: parseInt(e.detail.value)
    });
    this.generate();
  },

  // 大写字母开�?
  onUppercaseChange(e) {
    this.setData({
      includeUppercase: e.detail.value
    });
    this.generate();
  },

  // 小写字母开�?
  onLowercaseChange(e) {
    this.setData({
      includeLowercase: e.detail.value
    });
    this.generate();
  },

  // 数字开�?
  onNumbersChange(e) {
    this.setData({
      includeNumbers: e.detail.value
    });
    this.generate();
  },

  // 符号开�?
  onSymbolsChange(e) {
    this.setData({
      includeSymbols: e.detail.value
    });
    this.generate();
  },

  // 切换密码可见�?
  toggleVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 切换高级选项
  toggleAdvanced() {
    this.setData({
      showAdvanced: !this.data.showAdvanced
    });
  },

  // 避免相似字符变化
  onAvoidSimilarChange(e) {
    this.setData({
      avoidSimilar: e.detail.value
    });
    this.generate();
  },

  // 必须包含每种类型变化
  onRequireEachTypeChange(e) {
    this.setData({
      requireEachType: e.detail.value
    });
    this.generate();
  },

  // 应用模板
  applyTemplate(e) {
    const index = e.currentTarget.dataset.index;
    const template = this.data.templates[index];
    
    // 更新所有模板状�?
    const templates = this.data.templates.map((t, i) => ({
      ...t,
      active: i === index
    }));

    this.setData({
      length: template.length,
      includeUppercase: template.includeUppercase,
      includeLowercase: template.includeLowercase,
      includeNumbers: template.includeNumbers,
      includeSymbols: template.includeSymbols,
      templates
    });

    this.generate();

    wx.showToast({
      title: `已应用{template.name}`,
      icon: 'none'
    });
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
    } = this.data;

    // 检查是否可以生成
    const canGenerate = includeUppercase || includeLowercase || includeNumbers || includeSymbols;
    this.setData({ canGenerate });

    if (!canGenerate) {
      this.setData({
        password: '',
        strength: '',
        strengthPercent: 0,
        strengthClass: '',
        strengthTip: '请至少选择一种字符类�?
      });
      return;
    }

    let charset = '';
    if (includeUppercase) charset += uppercaseChars;
    if (includeLowercase) charset += lowercaseChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;

    // 移除相似字符
    if (avoidSimilar) {
      similarChars.split('').forEach(char => {
        charset = charset.replace(new RegExp(char, 'g'), '');
      });
    }

    if (!charset) {
      this.setData({
        password: '',
        strength: '',
        strengthPercent: 0,
        strengthClass: '',
        strengthTip: '字符集为�?
      });
      return;
    }

    let password = '';
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      password = '';
      
      // 确保每种选中的类型至少包含一个字�?
      if (requireEachType) {
        if (includeUppercase) {
          const chars = avoidSimilar ? uppercaseChars.replace(/[0O1lI]/g, '') : uppercaseChars;
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        if (includeLowercase) {
          const chars = avoidSimilar ? lowercaseChars.replace(/[0O1lI]/g, '') : lowercaseChars;
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        if (includeNumbers) {
          const chars = avoidSimilar ? numberChars.replace(/[0O1lI]/g, '') : numberChars;
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        if (includeSymbols) {
          password += symbolChars[Math.floor(Math.random() * symbolChars.length)];
        }
      }

      // 填充剩余长度
      const remainingLength = length - password.length;
      for (let i = 0; i < remainingLength; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }

      // 打乱密码字符顺序
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      // 检查是否满足要�?
      if (this.validatePassword(password)) {
        break;
      }
      
      attempts++;
    }

    const strength = this.calculateStrength(password);
    const strengthInfo = this.getStrengthInfo(strength);

    this.setData({
      password,
      strength,
      strengthPercent: strengthInfo.percent,
      strengthClass: strengthInfo.class,
      strengthTip: this.getStrengthTip(strength)
    });
  },

  // 验证密码是否满足要求
  validatePassword(password) {
    const { includeUppercase, includeLowercase, includeNumbers, includeSymbols } = this.data;
    
    if (includeUppercase && !/[A-Z]/.test(password)) return false;
    if (includeLowercase && !/[a-z]/.test(password)) return false;
    if (includeNumbers && !/[0-9]/.test(password)) return false;
    if (includeSymbols && !/[^A-Za-z0-9]/.test(password)) return false;
    
    return true;
  },

  // 获取强度详细信息
  getStrengthInfo(strength) {
    const strengthMap = {
      '极强': { percent: 100, class: 'very-strong' },
      '�?: { percent: 80, class: 'strong' },
      '中等': { percent: 60, class: 'medium' },
      '�?: { percent: 40, class: 'weak' },
      '极弱': { percent: 20, class: 'very-weak' }
    };
    return strengthMap[strength] || { percent: 20, class: 'very-weak' };
  },

  // 获取强度提示
  getStrengthTip(strength) {
    const tips = {
      '极强': '密码强度极高，非常安�?,
      '�?: '密码强度良好，适合重要账户',
      '中等': '密码强度一般，建议增加长度',
      '�?: '密码强度较弱，建议添加更多字符类�?,
      '极弱': '密码极易被破解，请重新生成
    };
    return tips[strength] || '';
  },

  calculateStrength(password) {
    let score = 0;

    // 长度评分
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;

    // 字符类型评分
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // 复杂度评制
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) score += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) score += 1;

    // 确定强度等级
    if (score >= 9) return '极强';
    if (score >= 7) return '�?;
    if (score >= 5) return '中等';
    if (score >= 3) return '�?;
    return '极弱';
  },

  copyPassword() {
    if (!this.data.password) return;
    
    wx.setClipboardData({
      data: this.data.password,
      success: () => {
        utils.showSuccess('密码已复制);
      },
      fail: () => {
        utils.showText('复制失败');
      }
    });
  },

  // 保存密码到本在
  savePassword() {
    if (!this.data.password) return;
    
    const passwords = wx.getStorageSync('savedPasswords') || [];
    const newPassword = {
      password: this.data.password,
      strength: this.data.strength,
      length: this.data.length,
      createTime: new Date().toLocaleString()
    };
    
    passwords.unshift(newPassword);
    
    // 只保留最�?0�?
    if (passwords.length > 10) {
      passwords.splice(10);
    }
    
    wx.setStorageSync('savedPasswords', passwords);
    
    utils.showSuccess('密码已保存);
  },

  // 分享给好号
  // 分享到朋友圈
});
