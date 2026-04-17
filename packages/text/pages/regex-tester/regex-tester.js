// packages/text/pages/regex-tester/regex-tester.js
Page({
  data: {
    regexPattern: '', // 正则表达式模式
    testText: '', // 测试文本
    flags: [], // 标志
    showResults: false, // 是否显示结果
    matches: [], // 匹配结果
    errorMessage: '', // 错误消息
    highlightedParts: [], // 高亮显示部分
    showCommonRegexModal: false, // 是否显示常用正则表达式弹窗
    showOptionsModal: false, // 是否显示匹配选项弹窗
    showSyntaxModal: false, // 是否显示语法参考弹窗
    showHelp: false, // 是否显示帮助信息
    
    // 可用标志
    availableFlags: [
      { flag: 'i', label: 'i(忽略大小写)', enabled: false },
      { flag: 'g', label: 'g(全局匹配)', enabled: true },
      { flag: 'm', label: 'm(多行模式)', enabled: false },
      { flag: 's', label: 's(点号通配)', enabled: false },
      { flag: 'u', label: 'u(Unicode)', enabled: false }
    ],
    
    // 常用正则表达式
    commonRegex: [
      { name: '邮箱地址', pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$', flags: ['i'] },
      { name: '手机号码', pattern: '^1[3-9]\\d{9}$', flags: [] },
      { name: '身份证号', pattern: '^\\d{17}[\\dXx]$|^\\d{15}$', flags: [] },
      { name: 'URL链接', pattern: '^https?:\\/\\/[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\.~:/?#[\\]@!$&\\u0027()*+,;=.]+$', flags: ['i'] },
      { name: '纯数字', pattern: '^\\d+$', flags: [] },
      { name: '字母数字', pattern: '^[a-zA-Z0-9]+$', flags: [] },
      { name: '中文', pattern: '[\\u4e00-\\u9fa5]+', flags: ['g'] },
      { name: 'HTML标签', pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', flags: ['gi'] }
    ]
  },

  // 设置正则表达式
  setRegexPattern(e) {
    this.setData({
      regexPattern: e.detail.value,
      showResults: false
    });
  },

  // 设置标志位（旧方法，保留兼容性
  setFlags(e) {
    const selectedFlags = e.detail.value;
    const flags = this.data.availableFlags.map(item => ({
      ...item,
      enabled: selectedFlags.includes(item.flag)
    }));

    this.setData({
      flags: selectedFlags,
      availableFlags: flags,
      showResults: false
    });
  },

  // 处理标志位变化
  onFlagChange(e) {
    const flag = e.currentTarget.dataset.flag;
    const checked = e.detail.value.includes(flag);
    
    const updatedFlags = this.data.availableFlags.map(item => ({
      ...item,
      enabled: item.flag === flag ? checked : item.enabled
    }));
    
    const selectedFlags = updatedFlags.filter(item => item.enabled).map(item => item.flag);
    
    this.setData({
      availableFlags: updatedFlags,
      flags: selectedFlags,
      showResults: false
    });
  },

  // 设置测试文本
  setTestText(e) {
    this.setData({
      testText: e.detail.value,
      showResults: false
    });
  },

  // 确保flags是数组类型
  useCommonRegex(e) {
    const { regex, flags } = e.currentTarget.dataset;
    // 确保flags是数组类型
    const flagsArray = Array.isArray(flags) ? flags : flags.split('');
    const flagObjects = this.data.availableFlags.map(item => ({
      ...item,
      enabled: flagsArray.includes(item.flag)
    }));

    this.setData({
      regexPattern: regex,
      flags: flagsArray,
      availableFlags: flagObjects,
      showResults: false
    });
  },

  // 测试正则表达式
  testRegex() {
    const { regexPattern, testText, flags } = this.data;
    
    if (!regexPattern.trim()) {
      this.showError('请输入正则表达式');
      return;
    }

    if (!testText.trim()) {
      this.showError('请输入测试文本');
      return;
    }

    try {
      // 构建正则表达式标志
      const flagString = flags.join('');
      const regex = new RegExp(regexPattern, flagString);
      
      // 执行匹配
      const matches = [];
      let match;
      
      if (flags.includes('g')) {
        // 全局匹配
        while ((match = regex.exec(testText)) !== null) {
          matches.push(match);
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        // 单次匹配
        match = regex.exec(testText);
        if (match) {
          matches.push(match);
        }
      }

      // 生成高亮显示
      const highlightedParts = this.generateHighlightedText(testText, matches);

      this.setData({
        matches,
            highlightedParts,
        showResults: true,
        errorMessage: ''
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('正则测试失败', error);
      this.showError('正则表达式错误：' + error.message);
    }
  },

  // 生成高亮文本
  generateHighlightedText(text, matches) {
    if (matches.length === 0) {
      return [{ type: 'normal', text: text }];
    }

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push({
          type: 'normal',
          text: text.substring(lastIndex, match.index)
        });
      }

      // 添加匹配的文本
      parts.push({
        type: 'match',
        text: match[0],
        matchIndex: index
      });

      lastIndex = match.index + match[0].length;
    });

    // 添加剩余的文本
    if (lastIndex < text.length) {
      parts.push({
        type: 'normal',
        text: text.substring(lastIndex)
      });
    }

    return parts;
  },

  // 显示错误
  showError(message) {
    this.setData({ errorMessage: message });
    setTimeout(() => {
      this.setData({ errorMessage: '' });
    }, 5000);
  },

  // 清除错误
  clearError() {
    this.setData({ errorMessage: '' });
  },

  // 清空结果
  clearResults() {
    this.setData({
      showResults: false,
      matches: [],
      highlightedParts: []
    });
  },

  // 显示常用正则表达式弹窗
  showCommonRegexModal() {
    this.setData({ showCommonRegexModal: true });
  },

  // 关闭常用正则表达式弹窗
  closeCommonRegexModal() {
    this.setData({ showCommonRegexModal: false });
  },

  // 显示匹配选项弹窗
  showOptionsModal() {
    this.setData({ showOptionsModal: true });
  },

  // 关闭匹配选项弹窗
  closeOptionsModal() {
    this.setData({ showOptionsModal: false });
  },

  // 显示语法参考弹窗
  showSyntaxModal() {
    this.setData({ showSyntaxModal: true });
  },

  // 关闭语法参考弹窗
  closeSyntaxModal() {
    this.setData({ showSyntaxModal: false });
  },

  // 选择常用正则表达式
  selectCommonRegex(e) {
    const { regex, flags } = e.currentTarget.dataset;
    // 确保flags是数组类型
    const flagsArray = Array.isArray(flags) ? flags : flags.split('');
    const flagObjects = this.data.availableFlags.map(item => ({
      ...item,
      enabled: flagsArray.includes(item.flag)
    }));

    this.setData({
      regexPattern: regex,
      flags: flagsArray,
      availableFlags: flagObjects,
      showResults: false,
      showCommonRegexModal: false
    });
  },

  // 切换帮助信息显示
  toggleHelp() {
    this.setData({
      showHelp: !this.data.showHelp
    });
  },

  // 阻止事件冒泡
  preventBubble() {
    // 空方法，用于阻止事件冒泡
  },



  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '正则校验器' });
  }
})
