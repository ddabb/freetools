// packages/design/pages/color-converter/color-converter.js
Page({
  data: {
    // 当前颜色
    currentColor: '#667eea',
    hexInput: '667eea',
    
    // RGB值
    rgb: {
      r: 102,
      g: 126,
      b: 234
    },
    
    // 格式转换结果
    formats: {
      hex: '#667eea',
      rgb: 'rgb(102, 126, 234)',
      rgba: 'rgba(102, 126, 234, 1)',
      hsl: 'hsl(231, 76%, 66%)',
      cmyk: 'cmyk(56%, 46%, 0%, 8%)'
    },
    
    // 颜色信息
    colorInfo: {
      name: '紫蓝色',
      brightness: '偏亮 (154)',
      contrast: '良好',
      suggestedTextColor: '#000000'  // 亮度154>128，应用黑色文字
    },
    
    // 配色方案
    colorSchemes: [],
    
    // 预设颜色
    presetColors: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#6C5CE7',
      '#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#B2BEC3', '#2D3436',
      '#E17055', '#FD79A8', '#FDCB6E', '#6C5CE7', '#A29BFE', '#74B9FF'
    ],
    
    // 最近使用颜色
    recentColors: [],
    
    // 最大最近使用数量
    maxRecentColors: 12
  },

  // 节流时间戳
  _lastSliderUpdate: 0,
  _sliderUpdateTimer: null,

  // 页面加载
  onLoad(options) {
    wx.setNavigationBarTitle({ title: '🎨 颜色生成' });
    
    // 从本地存储加载最近使用颜色
    this.loadRecentColors();
    
    // 如果有传入颜色参数，使用传入的颜色
    if (options && options.color) {
      const color = '#' + options.color.replace('#', '');
      this.setColor(color);
    } else {
      // 初始化配色方案
      this.generateColorSchemes(this.data.currentColor);
    }
  },

  // 页面显示时
  onShow() {
    this.loadRecentColors();
  },

  // 从本地存储加载最近使用颜色
  loadRecentColors() {
    try {
      const recent = wx.getStorageSync('recentColors') || [];
      this.setData({ recentColors: recent });
    } catch (e) {
      console.error('加载最近使用颜色失败:', e);
    }
  },

  // 保存到最近使用
  saveToRecent(color) {
    let recent = this.data.recentColors.slice();
    
    // 移除重复项
    recent = recent.filter(c => c.toLowerCase() !== color.toLowerCase());
    
    // 添加到开头
    recent.unshift(color);
    
    // 限制数量
    if (recent.length > this.data.maxRecentColors) {
      recent = recent.slice(0, this.data.maxRecentColors);
    }
    
    this.setData({ recentColors: recent });
    
    // 保存到本地存储
    try {
      wx.setStorageSync('recentColors', recent);
    } catch (e) {
      console.error('保存最近使用颜色失败:', e);
    }
  },

  // 清空最近使用
  clearRecent() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空最近使用的颜色吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ recentColors: [] });
          try {
            wx.removeStorageSync('recentColors');
          } catch (e) {
            console.error('清空最近使用颜色失败:', e);
          }
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },



  // 滑块拖动过程中实时变化（节流：100ms）
  onRgbSliderChanging(e) {
    const now = Date.now();
    if (now - this._lastSliderUpdate < 100) return;
    this._lastSliderUpdate = now;
    
    const channel = e.currentTarget.dataset.channel;
    const value = parseInt(e.detail.value);
    
    // 确保值在有效范围内
    if (isNaN(value) || value < 0 || value > 255) {
      return;
    }
    
    // 直接更新rgb值并计算hex，避免setColor重新解析rgb导致不同步
    const newRgb = { ...this.data.rgb, [channel]: value };
    const hex = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    // 只更新基本颜色信息，不计算其他格式和配色方案
    this.setData({
      currentColor: hex,
      hexInput: hex.substring(1),
      rgb: newRgb
    });
  },

  // RGB滑块变化（拖动结束）
  onRgbSliderChange(e) {
    const channel = e.currentTarget.dataset.channel;
    const value = parseInt(e.detail.value);
    
    // 确保值在有效范围内
    if (isNaN(value) || value < 0 || value > 255) {
      return;
    }
    
    // 直接更新rgb值并计算hex，避免setColor重新解析rgb导致不同步
    const newRgb = { ...this.data.rgb, [channel]: value };
    const hex = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    // 完整更新所有格式和配色方案
    this.updateColorFromRgb(newRgb, hex, true);
  },

  // RGB输入变化（节流：100ms）
  onRgbInput(e) {
    const now = Date.now();
    if (now - this._lastSliderUpdate < 100) return;
    this._lastSliderUpdate = now;

    const channel = e.currentTarget.dataset.channel;
    let value = parseInt(e.detail.value) || 0;
    
    // 限制范围
    value = Math.max(0, Math.min(255, value));
    
    const rgb = { ...this.data.rgb, [channel]: value };
    const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    
    this.setColor(hex, false);
  },

  // HEX输入变化（节流：100ms）
  onHexInput(e) {
    const now = Date.now();
    if (now - this._lastSliderUpdate < 100) return;
    this._lastSliderUpdate = now;

    let hex = e.detail.value.trim().toUpperCase();
    
    // 移除#号
    hex = hex.replace('#', '');
    
    // 验证HEX格式
    if (/^[0-9A-F]{6}$/.test(hex)) {
      this.setColor('#' + hex);
    } else if (/^[0-9A-F]{3}$/.test(hex)) {
      // 简写格式转换
      const fullHex = hex.split('').map(c => c + c).join('');
      this.setColor('#' + fullHex);
    }
    
    this.setData({ hexInput: hex });
  },

  // 设置颜色（核心方法）
  setColor(hex, saveToRecent = true) {
    hex = hex.toUpperCase();
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    
    // 更新所有格式
    const formats = {
      hex: hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
    };
    
    // 更新颜色信息
    const colorInfo = this.getColorInfo(rgb, hsl);
    
    this.setData({
      currentColor: hex,
      hexInput: hex.substring(1),
      rgb: rgb,
      formats: formats,
      colorInfo: colorInfo
    });
    
    // 生成配色方案
    this.generateColorSchemes(hex);
    
    // 保存到最近使用
    if (saveToRecent) {
      this.saveToRecent(hex);
    }
  },

  // 选择颜色（从预设、最近使用、配色方案）
  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setColor(color);
    wx.vibrateShort({ type: 'light' });
  },

  // 从RGB更新颜色（用于滑块，避免重新解析rgb）
  updateColorFromRgb(rgb, hex, saveToRecent = true) {
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    
    // 更新所有格式
    const formats = {
      hex: hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
    };
    
    // 更新颜色信息
    const colorInfo = this.getColorInfo(rgb, hsl);
    
    this.setData({
      currentColor: hex,
      hexInput: hex.substring(1),
      rgb: rgb,
      formats: formats,
      colorInfo: colorInfo
    });
    
    // 生成配色方案
    this.generateColorSchemes(hex);
    
    // 保存到最近使用
    if (saveToRecent) {
      this.saveToRecent(hex);
    }
  },

  // 生成随机颜色
  generateRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = this.rgbToHex(r, g, b);
    
    this.setColor(hex);
    wx.vibrateShort({ type: 'medium' });
  },

  // 打开相机取色
  openCamera() {
    wx.showModal({
      title: '相机取色',
      content: '相机取色功能需要用户授权访问相机，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['camera', 'album'],
            success: (res) => {
              wx.showToast({
                title: '图片已选择，取色功能开发中',
                icon: 'none'
              });
            },
            fail: (err) => {
              if (err.errMsg && !err.errMsg.includes('cancel')) {
                wx.showToast({ title: '选择图片失败', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  // 复制颜色代码
  copyColorCode() {
    this.copyToClipboard(this.data.currentColor, '颜色代码已复制');
  },

  // 复制指定格式
  copyFormat(e) {
    const format = e.currentTarget.dataset.format;
    const value = this.data.formats[format];
    this.copyToClipboard(value, `${format.toUpperCase()}格式已复制`);
  },

  // 复制到剪贴板
  copyToClipboard(data, successMsg) {
    wx.setClipboardData({
      data: data,
      success: () => {
        wx.showToast({ title: successMsg, icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 生成配色方案
  generateColorSchemes(hex) {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const schemes = [
      {
        name: '单色调',
        colors: this.generateMonochromatic(hsl)
      },
      {
        name: '互补色',
        colors: this.generateComplementary(hsl)
      },
      {
        name: '三角色',
        colors: this.generateTriadic(hsl)
      },
      {
        name: '类似色',
        colors: this.generateAnalogous(hsl)
      }
    ];
    
    this.setData({ colorSchemes: schemes });
  },

  // 生成单色调
  generateMonochromatic(hsl) {
    const colors = [];
    for (let i = -2; i <= 2; i++) {
      let l = hsl.l + i * 15;
      l = Math.max(10, Math.min(90, l));
      colors.push(this.hslToHex(hsl.h, hsl.s, l));
    }
    return colors;
  },

  // 生成互补色
  generateComplementary(hsl) {
    return [
      this.hslToHex(hsl.h, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      this.hslToHex(hsl.h, Math.max(20, hsl.s - 20), Math.min(80, hsl.l + 10)),
      this.hslToHex((hsl.h + 180) % 360, Math.max(20, hsl.s - 20), Math.min(80, hsl.l + 10))
    ];
  },

  // 生成三角色
  generateTriadic(hsl) {
    return [
      this.hslToHex(hsl.h, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
      this.hslToHex(hsl.h, Math.max(20, hsl.s - 30), Math.min(70, hsl.l + 15))
    ];
  },

  // 生成类似色
  generateAnalogous(hsl) {
    return [
      this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
      this.hslToHex((hsl.h - 15 + 360) % 360, hsl.s, hsl.l),
      this.hslToHex(hsl.h, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 15) % 360, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
    ];
  },

  // 获取颜色信息
  getColorInfo(rgb, hsl) {
    const brightness = Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
    const brightnessLevel = brightness > 128 ? '偏亮' : '偏暗';
    
    // 颜色名称判断
    let name = '自定义颜色';
    if (hsl.s < 10) {
      name = brightness > 128 ? '浅灰色' : '深灰色';
    } else if (hsl.l > 95) {
      name = '接近白色';
    } else if (hsl.l < 10) {
      name = '接近黑色';
    } else {
      const hue = hsl.h;
      if (hue >= 0 && hue < 15 || hue >= 345) name = '红色系';
      else if (hue >= 15 && hue < 45) name = '橙/橙红色系';
      else if (hue >= 45 && hue < 75) name = '黄/黄绿色系';
      else if (hue >= 75 && hue < 105) name = '黄绿色系';
      else if (hue >= 105 && hue < 150) name = '绿色系';
      else if (hue >= 150 && hue < 195) name = '青/青绿色系';
      else if (hue >= 195 && hue < 240) name = '蓝色系';
      else if (hue >= 240 && hue < 285) name = '紫/蓝紫色系';
      else if (hue >= 285 && hue < 315) name = '紫色系';
      else if (hue >= 315 && hue < 345) name = '粉/玫红色系';
    }
    
    const suggestedTextColor = brightness > 128 ? '#000000' : '#FFFFFF';
    
    return {
      name,
      brightness: `${brightnessLevel} (${brightness})`,
      contrast: brightness > 64 && brightness < 192 ? '良好' : '一般',
      suggestedTextColor
    };
  },

  // RGB转HEX
  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  },

  // HEX转RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // RGB转HSL
  rgbToHsl(r, g, b) {
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  },

  // HSL转HEX
  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return this.rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  },

  // RGB转CMYK
  rgbToCmyk(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }
    
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    
    return { c, m, y, k };
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: `🎨 推荐颜色：${this.data.currentColor}`,
      path: `/packages/design/pages/color-converter/color-converter?color=${this.data.currentColor.substring(1)}`,
      imageUrl: '' // 可以生成颜色图片作为分享图
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `🎨 颜色生成 - ${this.data.currentColor}`,
      query: `color=${this.data.currentColor.substring(1)}`
    };
  }
});
