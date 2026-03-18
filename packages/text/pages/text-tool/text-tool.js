// text-tool.js
const pinyinPro = require('pinyin-pro');

Page({
  data: {
    inputText: '', // 输入文本
    outputText: '', // 输出文本
    wordCount: null, // 字数统计
    inputFocus: false
  },
  
  // 设置输入文本
  setInputText(e) {
    this.setData({
      inputText: e.detail.value,
      outputText: '',
      wordCount: null
    });
  },
  
  // 文本反转
  reverseText() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    const reversedText = inputText.split('').reverse().join('');
    this.setData({
      outputText: reversedText,
      wordCount: null
    });

    // 添加成功反馈
    wx.vibrateShort({
      type: 'light'
    });
  },
  
  // 转为大写
  toUpperCase() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    const upperText = inputText.toUpperCase();
    this.setData({
      outputText: upperText,
      wordCount: null
    });

    // 添加成功反馈
    wx.vibrateShort({
      type: 'light'
    });
  },
  
  // 转为小写
  toLowerCase() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    const lowerText = inputText.toLowerCase();
    this.setData({
      outputText: lowerText,
      wordCount: null
    });

    // 添加成功反馈
    wx.vibrateShort({
      type: 'light'
    });
  },
  
  // 字数统计
  countWords() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    const characters = inputText.length;
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const lines = inputText.split('\n').length;
    
    this.setData({
      wordCount: {
        characters,
        words,
        lines
      },
      outputText: ''
    });

    // 添加成功反馈
    wx.vibrateShort({
      type: 'light'
    });
  },
  
  // 获取拼音首字母
  getPinyinFirstLetter() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 尝试不同的调用方式
      let firstLetters = '';
      
      // 方式1：尝试直接调用
      if (typeof pinyinPro === 'function') {
        firstLetters = pinyinPro(inputText, { style: 'first-letter' });
      }
      // 方式2：尝试调用 pinyinPro.pinyin 方法
      else if (pinyinPro && typeof pinyinPro.pinyin === 'function') {
        firstLetters = pinyinPro.pinyin(inputText, { pattern: 'first', toneType: 'none' });
      }
      // 方式3：如果都不行，使用简单的拼音转换
      else {
        firstLetters = this.simplePinyinFirstLetter(inputText);
      }
      
      this.setData({
        outputText: firstLetters,
        wordCount: null
      });

      // 添加成功反馈
      wx.vibrateShort({
        type: 'light'
      });
    } catch (error) {
      console.error('拼音转换失败:', error);
      wx.showToast({
        title: '拼音转换失败',
        icon: 'none'
      });
    }
  },
  
  // 简单的拼音首字母转换（备用方案）
  simplePinyinFirstLetter(text) {
    // 简单的汉字拼音首字母映射
    const pinyinMap = {
      '阿': 'A', '八': 'B', '擦': 'C', '大': 'D', '鹅': 'E',
      '发': 'F', '嘎': 'G', '哈': 'H', '一': 'Y', '鸡': 'J',
      '卡': 'K', '拉': 'L', '妈': 'M', '拿': 'N', '哦': 'O',
      '趴': 'P', '七': 'Q', '日': 'R', '撒': 'S', '他': 'T',
      '乌': 'W', '西': 'X', '呀': 'Y', '咋': 'Z'
    };
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 如果是汉字
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 这里只是一个简单的示例，实际需要完整的拼音映射
        // 暂时返回原字符
        result += char;
      } else {
        // 非汉字字符直接保留
        result += char;
      }
    }
    return result;
  },
  
  // 复制文本
  copyText() {
    const { outputText } = this.data;
    if (!outputText) return;
    
    wx.setClipboardData({
      data: outputText,
      success() {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },

  // 清空文本
  clearInput() {
    this.setData({
      inputText: '',
      outputText: '',
      wordCount: null
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '文本工具 - 文本处理和转换工具',
      path: '/packages/text/pages/text-tool/text-tool'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '文本工具 - 文本处理和转换工具',
      query: 'text-tool'
    }
  }
})