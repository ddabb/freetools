// text-tool.js
const pinyinPro = require('pinyin-pro');

Page({
  data: {
    inputText: '', // 输入文本
    outputText: '', // 输出文本
    wordCount: null, // 字数统计
    pinyinResults: null, // 拼音相关结果
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
  
  // 获取拼音结果
  getPinyinResults() {
    const { inputText } = this.data;
    if (!inputText) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }
    
    try {
      let pinyinResults = {
        firstLetter: '',
        fullPinyin: '',
        withTone: '',
        withoutTone: ''
      };
      
      // 方式1：尝试直接调用
      if (typeof pinyinPro === 'function') {
        pinyinResults.firstLetter = pinyinPro(inputText, { style: 'first-letter' });
        pinyinResults.fullPinyin = pinyinPro(inputText, { style: 'normal' });
        pinyinResults.withTone = pinyinPro(inputText, { toneType: 'symbol' });
        pinyinResults.withoutTone = pinyinPro(inputText, { toneType: 'none' });
      }
      // 方式2：尝试调用 pinyinPro.pinyin 方法
      else if (pinyinPro && typeof pinyinPro.pinyin === 'function') {
        pinyinResults.firstLetter = pinyinPro.pinyin(inputText, { pattern: 'first', toneType: 'none' });
        pinyinResults.fullPinyin = pinyinPro.pinyin(inputText, { pattern: 'pinyin', toneType: 'none' });
        pinyinResults.withTone = pinyinPro.pinyin(inputText, { pattern: 'pinyin', toneType: 'symbol' });
        pinyinResults.withoutTone = pinyinPro.pinyin(inputText, { pattern: 'pinyin', toneType: 'none' });
      }
      // 方式3：如果都不行，使用简单的拼音转换
      else {
        const simpleResults = this.simplePinyinConversion(inputText);
        pinyinResults = { ...simpleResults };
      }
      
      this.setData({
        pinyinResults: pinyinResults,
        outputText: '',
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
  
  // 简单的拼音转换（备用方案）
  simplePinyinConversion(text) {
    // 简单的汉字拼音映射
    const pinyinMap = {
      '阿': 'a', '八': 'ba', '擦': 'ca', '大': 'da', '鹅': 'e',
      '发': 'fa', '嘎': 'ga', '哈': 'ha', '一': 'yi', '鸡': 'ji',
      '卡': 'ka', '拉': 'la', '妈': 'ma', '拿': 'na', '哦': 'o',
      '趴': 'pa', '七': 'qi', '日': 'ri', '撒': 'sa', '他': 'ta',
      '乌': 'wu', '西': 'xi', '呀': 'ya', '咋': 'za'
    };
    
    let firstLetter = '';
    let fullPinyin = '';
    let withTone = '';
    let withoutTone = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 如果是汉字
      if (/[\u4e00-\u9fa5]/.test(char)) {
        const pinyin = pinyinMap[char] || char;
        firstLetter += pinyin.charAt(0).toUpperCase();
        fullPinyin += pinyin + ' ';
        withTone += pinyin + ' ';
        withoutTone += pinyin + ' ';
      } else {
        // 非汉字字符直接保留
        firstLetter += char;
        fullPinyin += char;
        withTone += char;
        withoutTone += char;
      }
    }
    
    return {
      firstLetter: firstLetter,
      fullPinyin: fullPinyin.trim(),
      withTone: withTone.trim(),
      withoutTone: withoutTone.trim()
    };
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

  // 复制拼音结果
  copyPinyinResult(e) {
    const { type } = e.currentTarget.dataset;
    const { pinyinResults } = this.data;
    
    if (!pinyinResults || !pinyinResults[type]) return;
    
    wx.setClipboardData({
      data: pinyinResults[type],
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