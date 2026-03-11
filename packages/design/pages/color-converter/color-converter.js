// packages/design/pages/color-converter/color-converter.js
Page({
  data: {
    // 当前颜色
    currentColor: '#FF5733',
    hexInput: 'FF5733',
    rgbInputs: { r: 255, g: 87, b: 51 },
    
    // 转换结果
    conversions: {
      hex: '#FF5733',
      hexCompact: '#F53',
      rgb: 'rgb(255, 87, 51)',
      rgbArray: '[255, 87, 51]',
      hsl: 'hsl(11, 100%, 60%)',
      hslValues: { h: 11, s: 100, l: 60 },
      cmyk: 'cmyk(0%, 66%, 80%, 0%)',
      cmykValues: { c: 0, m: 66, y: 80, k: 0 }
    },
    
    // 颜色信息
    colorInfo: {
      name: '番茄红',
      brightness: '中等偏亮',
      contrast: '良好',
      suggestedTextColor: '#FFFFFF'
    },
    
    // 配色方案
    colorSchemes: [
      {
        name: '单色调',
        colors: ['#FF5733', '#FF6B47', '#FF8A65', '#FFAB91', '#FFCCBC']
      },
      {
        name: '互补色',
        colors: ['#FF5733', '#33A1FF', '#57C7FF', '#8BD5FF', '#BFE7FF']
      },
      {
        name: '三角色',
        colors: ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A1']
      },
      {
        name: '类似色',
        colors: ['#FF5733', '#FF8C33', '#FFD733', '#8CFF33', '#33FF8C']
      }
    ]
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '颜色转换器' });
    this.updateAllConversions('#FF5733');
  },

  // HEX输入处理
  onHexInput(e) {
    let hex = e.detail.value.trim();
    
    // 移除#号
    hex = hex.replace('#', '');
    
    // 验证并更新
    if (/^[0-9A-Fa-f]{6}$/.test(hex) || /^[0-9A-Fa-f]{3}$/.test(hex)) {
      this.setData({ hexInput: hex.toUpperCase() });
      
      let fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
      this.updateAllConversions('#' + fullHex);
    }
  },

  // RGB输入处理
  onRgbInput(e) {
    const channel = e.currentTarget.dataset.channel;
    let value = parseInt(e.detail.value) || 0;
    
    // 限制范围
    value = Math.max(0, Math.min(255, value));
    
    const rgbInputs = { ...this.data.rgbInputs, [channel]: value };
    this.setData({ rgbInputs });
    
    // 转换为HEX
    const hex = '#' + 
      rgbInputs.r.toString(16).padStart(2, '0') +
      rgbInputs.g.toString(16).padStart(2, '0') +
      rgbInputs.b.toString(16).padStart(2, '0');
    
    this.setData({ 
      hexInput: hex.substring(1).toUpperCase(),
      currentColor: hex
    });
    
    this.updateAllConversions(hex);
  },

  // 更新所有转换
  updateAllConversions(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);
    
    const conversions = {
      hex: hex.toUpperCase(),
      hexCompact: this.getCompactHex(hex),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgbArray: `[${rgb.r}, ${rgb.g}, ${rgb.b}]`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      hslValues: {
        h: Math.round(hsl.h),
        s: Math.round(hsl.s),
        l: Math.round(hsl.l)
      },
      cmyk: `cmyk(${Math.round(cmyk.c)}%, ${Math.round(cmyk.m)}%, ${Math.round(cmyk.y)}%, ${Math.round(cmyk.k)}%)`,
      cmykValues: {
        c: Math.round(cmyk.c),
        m: Math.round(cmyk.m),
        y: Math.round(cmyk.y),
        k: Math.round(cmyk.k)
      }
    };

    const colorInfo = this.getColorInfo(rgb, hsl);
    const rgbInputs = { r: rgb.r, g: rgb.g, b: rgb.b };

    this.setData({
      conversions,
      colorInfo,
      rgbInputs,
      currentColor: hex.toUpperCase()
    });
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
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // 灰色
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  // RGB转CMYK
  rgbToCmyk(r, g, b) {
    if (r === 0 && g === 0 && b === 0) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = 1 - (r / 255);
    const m = 1 - (g / 255);
    const y = 1 - (b / 255);
    
    const k = Math.min(c, Math.min(m, y));
    const divisor = 1 - k;
    
    return {
      c: divisor === 0 ? 0 : Math.round(((c - k) / divisor) * 100),
      m: divisor === 0 ? 0 : Math.round(((m - k) / divisor) * 100),
      y: divisor === 0 ? 0 : Math.round(((y - k) / divisor) * 100),
      k: Math.round(k * 100)
    };
  },

  // 获取紧凑HEX格式
  getCompactHex(hex) {
    if (hex.length === 4) return hex; // 已经是#xxx格式
    
    const cleanHex = hex.substring(1);
    if (cleanHex[0] === cleanHex[1] && cleanHex[2] === cleanHex[3] && cleanHex[4] === cleanHex[5]) {
      return '#' + cleanHex[0] + cleanHex[2] + cleanHex[4];
    }
    return hex.toUpperCase();
  },

  // 获取颜色信息
  getColorInfo(rgb, hsl) {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    const brightnessLevel = brightness > 128 ? '偏亮' : '偏暗';
    
    // 简单的颜色名称判断
    let name = '自定义颜色';
    if (hsl.h >= 0 && hsl.h <= 15 || hsl.h >= 345) name = '红色系';
    else if (hsl.h >= 16 && hsl.h <= 45) name = '橙色系';
    else if (hsl.h >= 46 && hsl.h <= 75) name = '黄色系';
    else if (hsl.h >= 76 && hsl.h <= 165) name = '绿色系';
    else if (hsl.h >= 166 && hsl.h <= 195) name = '青色系';
    else if (hsl.h >= 196 && hsl.h <= 255) name = '蓝色系';
    else if (hsl.h >= 256 && hsl.h <= 285) name = '紫色系';
    else if (hsl.h >= 286 && hsl.h <= 344) name = '粉色系';

    const suggestedTextColor = brightness > 128 ? '#000000' : '#FFFFFF';

    return {
      name,
      brightness: `${brightnessLevel} (${Math.round(brightness)})`,
      contrast: brightness > 64 && brightness < 192 ? '良好' : '一般',
      suggestedTextColor
    };
  },

  // 生成随机颜色
  generateRandomColor() {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
    this.updateAllConversions(randomHex);
    wx.vibrateShort();
  },

  // 选择配色方案中的颜色
  selectSchemeColor(e) {
    const color = e.currentTarget.dataset.color;
    this.updateAllConversions(color);
  },

  // 复制全部格式
  copyAllFormats() {
    const conversions = this.data.conversions;
    const allFormats = `颜色转换结果：
HEX: ${conversions.hex}
RGB: ${conversions.rgb}
HSL: ${conversions.hsl}
CMYK: ${conversions.cmyk}`;

    wx.setClipboardData({
      data: allFormats,
      success: () => {
        wx.showToast({ title: '已复制全部格式', icon: 'success' });
      }
    });
  },

  // 保存到收藏
  saveToFavorites() {
    wx.showToast({ title: '已加入收藏', icon: 'success' });
  },

  // 分享颜色
  shareColor() {
    const color = this.data.currentColor;
    wx.shareAppMessage({
      title: `推荐颜色：${color}`,
      path: `/packages/design/pages/color-converter/color-converter?color=${color.substring(1)}`
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '颜色转换器 - 设计师必备工具',
      path: '/packages/design/pages/color-converter/color-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '颜色转换器 - 设计师必备工具',
      query: 'color-converter'
    }
  }
})