// packages/converter/pages/base-converter/base-converter.js
Page({
  data: {
    inputValue: '', // 输入值
    outputValue: '', // 输出值
    sourceBaseIndex: 0, // 源进制索引
    targetBaseIndex: 1, // 目标进制索引
    showResult: false, // 是否显示结果
    base64Decoded: '', // base64解码结果
    sourceBases: ['十进制', '二进制', '八进制', '十六进制', 'Base64'],
    targetBases: ['二进制', '八进制', '十进制', '十六进制', 'Base64'],
    canConvert: false, // 是否可以转换
    baseInfo: [
      { base: 'decimal', name: '十进制', symbol: 'DEC', description: '使用0-9共10个数字' },
      { base: 'binary', name: '二进制', symbol: 'BIN', description: '使用0和1，计算机基础' },
      { base: 'octal', name: '八进制', symbol: 'OCT', description: '使用0-7共8个数字' },
      { base: 'hexadecimal', name: '十六进制', symbol: 'HEX', description: '使用0-9和A-F共16个字符' },
      { base: 'base64', name: 'Base64', symbol: 'B64', description: '用于编码二进制数据为文本' }
    ],
    examples: [
      { value: '255', source: '十进制', target: '十六进制' },
      { value: '11111111', source: '二进制', target: '十进制' },
      { value: 'FF', source: '十六进制', target: '二进制' },
      { value: 'Hello', source: 'Base64', target: '十进制' }
    ]
  },

  // 设置输入值
  setInputValue(e) {
    const inputValue = e.detail.value;
    const canConvert = inputValue && this.data.sourceBaseIndex >= 0 && this.data.targetBaseIndex >= 0;
    this.setData({
      inputValue: inputValue,
      canConvert: canConvert,
      base64Decoded: ''
    });
    // 自动转换
    if (canConvert) {
      this.convert();
    } else {
      this.setData({ showResult: false });
    }
  },

  // 设置源进制
  setSourceBase(e) {
    const sourceBaseIndex = e.detail.value;
    const canConvert = this.data.inputValue && sourceBaseIndex >= 0 && this.data.targetBaseIndex >= 0;
    this.setData({
      sourceBaseIndex: sourceBaseIndex,
      canConvert: canConvert
    });
    // 自动转换
    if (canConvert) {
      this.convert();
    } else {
      this.setData({ showResult: false });
    }
  },

  // 设置目标进制
  setTargetBase(e) {
    const targetBaseIndex = e.detail.value;
    const canConvert = this.data.inputValue && this.data.sourceBaseIndex >= 0 && targetBaseIndex >= 0;
    this.setData({
      targetBaseIndex: targetBaseIndex,
      canConvert: canConvert
    });
    // 自动转换
    if (canConvert) {
      this.convert();
    } else {
      this.setData({ showResult: false });
    }
  },

  // 交换进制
  swapBases() {
    const { sourceBaseIndex, targetBaseIndex, sourceBases, targetBases } = this.data;
    
    // 交换源进制和目标进制
    const newSourceIndex = targetBaseIndex;
    const newTargetIndex = sourceBaseIndex;
    
    // 交换源进制和目标进制数组
    const newSourceBases = [...targetBases];
    const newTargetBases = [...sourceBases];
    
    this.setData({
      sourceBaseIndex: newSourceIndex,
      targetBaseIndex: newTargetIndex,
      sourceBases: newSourceBases,
      targetBases: newTargetBases
    });
    
    // 自动转换
    if (this.data.canConvert) {
      this.convert();
    }
  },

  // 获取进制类型
  getBaseType(baseName) {
    const baseMap = {
      '十进制': 'decimal',
      '二进制': 'binary',
      '八进制': 'octal',
      '十六进制': 'hexadecimal',
      'Base64': 'base64'
    };
    return baseMap[baseName];
  },

  // 验证输入值
  validateInput(value, sourceBase) {
    switch(sourceBase) {
      case 'binary':
        return /^([01]+)$/.test(value);
      case 'octal':
        return /^([0-7]+)$/.test(value);
      case 'decimal':
        return /^([0-9]+)$/.test(value);
      case 'hexadecimal':
        return /^([0-9A-Fa-f]+)$/.test(value);
      case 'base64':
        try {
          atob(value);
          return true;
        } catch (e) {
          return false;
        }
      default:
        return false;
    }
  },

  // 转换函数
  convert() {
    const { inputValue, sourceBaseIndex, targetBaseIndex, sourceBases, targetBases } = this.data;
    
    if (!inputValue.trim()) {
      wx.showToast({ title: '请输入要转换的数字', icon: 'none' });
      return;
    }

    const sourceBase = this.getBaseType(sourceBases[sourceBaseIndex]);
    const targetBase = this.getBaseType(targetBases[targetBaseIndex]);

    // 验证输入
    if (!this.validateInput(inputValue.trim(), sourceBase)) {
      wx.showToast({ title: `请输入有效的${sourceBases[sourceBaseIndex]}数字`, icon: 'none' });
      return;
    }

    try {
      let result = '';
      let base64Decoded = '';

      // 特殊处理Base64
      if (sourceBase === 'base64') {
        try {
          const decodedBytes = atob(inputValue);
          base64Decoded = decodedBytes;
          
          if (targetBase === 'decimal') {
            // 将每个字符转换为ASCII码
            result = Array.from(decodedBytes).map(char => char.charCodeAt(0)).join(' ');
          } else {
            wx.showToast({ title: 'Base64只能转换为十进制查看ASCII码', icon: 'none' });
            return;
          }
        } catch (e) {
          wx.showToast({ title: '无效的Base64字符串', icon: 'none' });
          return;
        }
      } else {
        // 普通进制转换：先转为十进制，再转为目标进制
        const decimal = this.toDecimal(inputValue, sourceBase);
        
        switch(targetBase) {
          case 'binary':
            result = decimal.toString(2);
            break;
          case 'octal':
            result = decimal.toString(8);
            break;
          case 'decimal':
            result = decimal.toString(10);
            break;
          case 'hexadecimal':
            result = decimal.toString(16).toUpperCase();
            break;
          case 'base64':
            // 将数字转换为字符串再编码
            try {
              const str = String.fromCharCode(parseInt(decimal));
              result = btoa(str);
              base64Decoded = str;
            } catch (e) {
              wx.showToast({ title: '无法转换为Base64', icon: 'none' });
              return;
            }
            break;
        }
      }

      this.setData({
        outputValue: result,
        base64Decoded,
        showResult: true
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('转换失败', error);
      wx.showToast({ title: '转换失败，请检查输入', icon: 'none' });
    }
  },

  // 转换为十进制
  toDecimal(value, fromBase) {
    switch(fromBase) {
      case 'binary':
        return parseInt(value, 2);
      case 'octal':
        return parseInt(value, 8);
      case 'decimal':
        return parseInt(value, 10);
      case 'hexadecimal':
        return parseInt(value, 16);
      default:
        throw new Error('不支持的源进制');
    }
  },

  // 使用示例
  useExample(e) {
    const { value, source, target } = e.currentTarget.dataset;
    const sourceIndex = this.data.sourceBases.indexOf(source);
    const targetIndex = this.data.targetBases.indexOf(target);
    const canConvert = value && sourceIndex >= 0 && targetIndex >= 0;
    
    this.setData({
      inputValue: value,
      sourceBaseIndex: sourceIndex,
      targetBaseIndex: targetIndex,
      canConvert: canConvert,
      base64Decoded: ''
    });
    
    // 自动转换
    if (canConvert) {
      this.convert();
    } else {
      this.setData({ showResult: false });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '整数基转换器 - 多进制转换神器',
      path: '/packages/converter/pages/base-converter/base-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '整数基转换器 - 多进制转换神器',
      query: 'base-converter'
    }
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '整数基转换器' });
    // 初始化canConvert属性
    const canConvert = this.data.inputValue && this.data.sourceBaseIndex >= 0 && this.data.targetBaseIndex >= 0;
    this.setData({ canConvert: canConvert });
  },


})