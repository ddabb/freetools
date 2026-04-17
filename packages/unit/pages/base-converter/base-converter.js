// packages/unit/pages/base-converter/base-converter.js
Page({
  data: {
    bases: ['十进制', '二进制', '八进制', '十六进制', 'Base64'],
    baseValues: {
      '十进制': '',
      '二进制': '',
      '八进制': '',
      '十六进制': '',
      'Base64': ''
    },
    base64Decoded: '', // base64解码结果
    baseInfo: [
      { base: 'decimal', name: '十进制', symbol: 'DEC', description: '使用0-9�?0个数�?' },
      { base: 'binary', name: '二进制', symbol: 'BIN', description: '使用0�?，计算机基础' },
      { base: 'octal', name: '八进制', symbol: 'OCT', description: '使用0-7�?个数�?' },
      { base: 'hexadecimal', name: '十六进制', symbol: 'HEX', description: '使用0-9和A-F�?，6个字�?' }, 
      { base: 'base64', name: 'Base64', symbol: 'B64', description: '用于编码二进制数据为文本' }
    ],
    examples: [
      { value: '255', source: '十进制' },
      { value: '11111111', source: '二进制' },
      { value: '777', source: '八进制' },
      { value: 'FF', source: '十六进制' }
    ]
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '进制转换' });
  },

  // 进制值变化处理
  onBaseValueChange(e) {
    const base = e.currentTarget.dataset.base;
    const value = e.detail.value;
    
    if (!value) {
      // 如果值为空，清空所有进制的值
      const baseValues = {};
      this.data.bases.forEach(b => {
        baseValues[b] = '';
      });
      this.setData({ baseValues, base64Decoded: '' });
      return;
    }

    const baseValues = { ...this.data.baseValues };
    baseValues[base] = value;
    
    // 计算其他进制的值
    const sourceBaseType = this.getBaseType(base);
    
    // 验证输入
    if (!this.validateInput(value, sourceBaseType)) {
      wx.showToast({ title: `请输入有效的${base}数字`, icon: 'none' });
      return;
    }

    try {
      let base64Decoded = '';
      
      // 特殊处理Base64
      if (sourceBaseType === 'base64') {
        try {
          // 使用微信小程序的Base64解码
          const decodedBytes = wx.base64ToArrayBuffer(value);
          const decodedArray = new Uint8Array(decodedBytes);
          base64Decoded = String.fromCharCode(...decodedArray);
          
   // 将Base64转换为十进制（ASCII码）
   const decimalValue = Array.from(decodedArray).map(byte => byte).join(' ');
   baseValues['十进制'] = decimalValue;
          
          // 其他进制不支持从Base64直接转换
          this.data.bases.forEach(targetBase => {
            if (targetBase !== base && targetBase !== '十进制') {
              baseValues[targetBase] = '';
            }
          });
        } catch (e) {
          wx.showToast({ title: '无效的Base64字符', icon: 'none' });
          return;
        }
      } else {
        // 普通进制转换：先转为十进制，再转为其他进制
        const decimal = this.toDecimal(value, sourceBaseType);
        
        this.data.bases.forEach(targetBase => {
          if (targetBase !== base) {
            const targetBaseType = this.getBaseType(targetBase);
            let result = '';
            
            switch(targetBaseType) {
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
                // 将数字转换为Base64编码
                try {
                  // 将数字转换为字节数组
                  let bytes = [];
                  let num = decimal;
                  
                  // 处理0的情�?
                  if (num === 0) {
                    bytes = [0];
                  } else {
                    // 将数字转换为字节（大端序�?
                    while (num > 0) {
                      bytes.unshift(num & 0xFF);
                      num = Math.floor(num / 256);
                    }
                  }
                  
                  // 使用微信小程序的Base64编码
                  const uint8Array = new Uint8Array(bytes);
                  result = wx.arrayBufferToBase64(uint8Array);
                  base64Decoded = String.fromCharCode(...bytes);
                } catch (e) {
                  console.error('Base64转换错误:', e);
                  result = '';
                }
                break;
            }
            
            baseValues[targetBase] = result;
          }
        });
      }

      console.debug('转换结果:', baseValues);
      console.debug('Base64�?', baseValues['Base64']);
      this.setData({ baseValues, base64Decoded });
      wx.vibrateShort();

    } catch (error) {
      console.error('转换失败', error);
      wx.showToast({ title: '转换失败，请检查输入', icon: 'none' });
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

  // 验证输入�?
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
          // 使用微信小程序的Base64验证
          wx.base64ToArrayBuffer(value);
          return true;
        } catch (e) {
          return false;
        }
      default:
        return false;
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
    const { value, source } = e.currentTarget.dataset;
    
    const baseValues = {};
    this.data.bases.forEach(b => {
      baseValues[b] = '';
    });
    baseValues[source] = value;
    
    this.setData({ baseValues, base64Decoded: '' });
    
    // 触发转换
    const event = {
      currentTarget: { dataset: { base: source } },
      detail: { value: value }
    };
    this.onBaseValueChange(event);
  },



})
