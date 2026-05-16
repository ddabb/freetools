// packages/text/pages/word-counter/word-counter.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    inputText: '', // 输入文本
    targetWords: 1000, // 目标字数
    
    // 统计数据
    stats: {
      characters: 0, // 总字符数
      charactersNoSpace: 0, // 无空格字符数
      words: 0, // 词语数
      sentences: 0, // 句子数
      paragraphs: 0, // 段落数
      lines: 0, // 行数
      chineseChars: 0, // 中文字符
      englishLetters: 0, // 英文字母
      digits: 0, // 数字字符
      punctuation: 0, // 标点符号
      spaces: 0, // 空格字符
      specialChars: 0 // 特殊符号
    },
    
    // 分析结果
    readingTime: 0, // 阅读时长(分钟)
    typingSpeed: 0, // 打字速度(字/分钟)
    averageSentenceLength: 0, // 平均句长
    vocabularyDensity: 0, // 词汇密度(%)
    progressPercentage: 0 // 目标进度百分比
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '字数统计' });
    // 初始化示例文本
    this.loadSampleText();
  },

  // 文本输入处理
  onTextInput(e) {
    const text = e.detail.value;
    this.setData({ inputText: text });
    this.calculateStats(text);
  },

  // 计算统计信息
  calculateStats(text) {
    if (!text) {
      this.resetStats();
      return;
    }

    const stats = {
      characters: text.length,
      charactersNoSpace: text.replace(/\s/g, '').length,
      words: this.countWords(text),
      sentences: this.countSentences(text),
      paragraphs: this.countParagraphs(text),
      lines: text.split('\n').length,
      chineseChars: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
      englishLetters: (text.match(/[a-zA-Z]/g) || []).length,
      digits: (text.match(/\d/g) || []).length,
      punctuation: (text.match(/[.,!?;:()"'-]/g) || []).length,
      spaces: (text.match(/\s/g) || []).length,
      specialChars: (text.match(/[^\w\s\u4e00-\u9fa5.,!?;:()"'-]/g) || []).length
    };

    // 计算分析结果
    const readingTime = Math.ceil(stats.words / 250); // 按250字/分钟计算
    const averageSentenceLength = stats.sentences > 0 ? Math.round(stats.words / stats.sentences) : 0;
    const vocabularyDensity = stats.words > 0 ? Math.round((stats.words / stats.charactersNoSpace) * 100) : 0;
    const progressPercentage = this.data.targetWords > 0 ? Math.min((stats.words / this.data.targetWords) * 100, 100) : 0;

    this.setData({
      stats,
      readingTime,
      averageSentenceLength,
      vocabularyDensity,
      progressPercentage
    });
  },

  // 重置统计数据
  resetStats() {
    this.setData({
      stats: {
        characters: 0,
        charactersNoSpace: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        lines: 0,
        chineseChars: 0,
        englishLetters: 0,
        digits: 0,
        punctuation: 0,
        spaces: 0,
        specialChars: 0
      },
      readingTime: 0,
      typingSpeed: 0,
      averageSentenceLength: 0,
      vocabularyDensity: 0,
      progressPercentage: 0
    });
  },

  // 统计词语数（简化算法）
  countWords(text) {
    // 中文按字符数统计，英文按单词统计
    const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.match(/[a-zA-Z]+/g);
    const englishWordCount = englishWords ? englishWords.length : 0;
    
    // 混合统计：中文每个字符算一个词，英文按实际单词数
    return chineseCharCount + englishWordCount;
  },

  // 统计句子数
  countSentences(text) {
    if (!text.trim()) return 0;
    // 以句号、问号、感叹号、分号为句子分隔符
    const sentences = text.split(/[。！？；.!?;]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  },

  // 统计段落数
  countParagraphs(text) {
    if (!text.trim()) return 0;
    // 按连续换行符分割段落
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.length;
  },

  // 设置目标字数
  setTargetWords(e) {
    const target = parseInt(e.detail.value) || 0;
    const progressPercentage = target > 0 ? Math.min((this.data.stats.words / target) * 100, 100) : 0;
    
    this.setData({
      targetWords: target,
      progressPercentage
    });
  },

  // 清空文本
  clearText() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有文本吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ 
            inputText: '',
            targetWords: 0
          });
          this.resetStats();
          wx.vibrateShort();
        }
      }
    });
  },

  // 粘贴文本
  pasteText() {
    wx.getClipboardData({
      success: (res) => {
        const text = res.data;
        if (text) {
          this.setData({ inputText: text });
          this.calculateStats(text);
          wx.showToast({ title: '粘贴成功', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '粘贴失败', icon: 'none' });
      }
    });
  },

  // 复制文本
  copyText() {
    if (!this.data.inputText.trim()) {
      wx.showToast({ title: '没有可复制的文本', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: this.data.inputText,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 加载示例文本
  loadSampleText() {
    const sampleText = `人工智能(AI)正在改变我们的世界。从智能手机的语音助手到自动驾驶汽车，AI技术已经深入到生活的方方面面。

人工智能的发展可以分为几个重要阶段。首先是规则基础的专家系统时代，然后是机器学习时代，现在是深度学习时代。

每个阶段都有其独特的贡献和挑战。专家系统通过手工编写的规则来模拟人类专家的决策过程。机器学习让计算机能够从数据中自动学习模式。深度学习则进一步模拟了人脑神经网络的结构。

未来，我们可能会看到更加智能化的AI系统。这些系统不仅能够理解人类的语言，还能够进行创造性思考，甚至具备情感理解能力。当然，这也带来了伦理和安全方面的考虑。我们需要在技术进步的同时，确保AI的发展符合人类的价值观和利益。

总的来说，人工智能是一个充满机遇和挑战的领域。它将继续推动科技创新，改善人类生活质量。`;

    this.setData({ inputText: sampleText });
    this.calculateStats(sampleText);
    wx.showToast({ title: '已加载示例文本', icon: 'success' });
  },

  // 分享统计
  shareStats() {
    const stats = this.data.stats;
    const shareText = `? 文本统计结果\n总字符: ${stats.characters}\n词语数: ${stats.words}\n句子数: ${stats.sentences}\n段落数: ${stats.paragraphs}\n阅读时长: ${this.data.readingTime}分钟\n\n来自「免费工具箱」字数统计`;

    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({ title: '统计信息已复制', icon: 'success' });
      }
    });
  },

  // 导出报告
  exportReport() {
    const stats = this.data.stats;
    const report = `文本统计报告\n生成时间: ${new Date().toLocaleString()}\n\n基本统计:\n- 总字符数: ${stats.characters}\n- 无空格字符数: ${stats.charactersNoSpace}\n- 词语数: ${stats.words}\n- 句子数: ${stats.sentences}\n- 段落数: ${stats.paragraphs}\n- 行数: ${stats.lines}\n\n字符分析:\n- 中文字符: ${stats.chineseChars}\n- 英文字母: ${stats.englishLetters}\n- 数字字符: ${stats.digits}\n- 标点符号: ${stats.punctuation}\n- 空格字符: ${stats.spaces}\n- 特殊符号: ${stats.specialChars}\n\n文本分析:\n- 阅读时长: ${this.data.readingTime} 分钟\n- 平均句长: ${this.data.averageSentenceLength} 字/句\n- 词汇密度: ${this.data.vocabularyDensity}%`;

    wx.setClipboardData({
      data: report,
      success: () => {
        wx.showToast({ title: '报告已复制到剪贴板', icon: 'success' });
      }
    });
  },

  // 大小写转换
  toggleCase() {
    const text = this.data.inputText;
    if (!text) return;

    const converted = text === text.toUpperCase() ? text.toLowerCase() : text.toUpperCase();
    this.setData({ inputText: converted });
    this.calculateStats(converted);
    wx.showToast({ title: '大小写已转换', icon: 'success' });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '字数统计工具 - 免费工具箱',
      path: '/packages/text/pages/word-counter/word-counter'
    };
  }
})
