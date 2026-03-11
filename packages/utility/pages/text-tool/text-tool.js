// text-tool.js
Page({
  data: {
    inputText: '', // 输入文本
    outputText: '', // 输出文本
    wordCount: null // 字数统计
  },
  
  // 设置输入文本
  setInputText(e) {
    this.setData({
      inputText: e.detail.value
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

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '文本工具 - 文本处理和转换工具',
      path: '/packages/utility/pages/text-tool/text-tool'
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