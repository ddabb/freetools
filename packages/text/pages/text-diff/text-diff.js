// packages/text/pages/text-diff/text-diff.js
Page({
  data: {
    // 文本内容
    textA: '',
    textB: '',
    
    // 对比设置
    diffModeIndex: 0,
    diffModes: ['并排对比', '合并视图'],
    ignoreWhitespace: false,
    
    // 对比结果
    comparisonResult: null,
    
    // 高亮模式
    highlightMode: 'background' // background, foreground, border
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: '文本对比工具' });
  },

  // 设置文本A
  setTextA(e) {
    this.setData({ textA: e.detail.value });
  },

  // 设置文本B
  setTextB(e) {
    this.setData({ textB: e.detail.value });
  },

  // 设置对比模式
  setDiffMode(e) {
    this.setData({ diffModeIndex: e.detail.value });
  },

  // 切换忽略空格
  toggleIgnoreWhitespace(e) {
    this.setData({ ignoreWhitespace: e.detail.value });
  },

  // 开始对比
  compareTexts() {
    const { textA, textB, ignoreWhitespace } = this.data;
    
    if (!textA.trim() && !textB.trim()) {
      wx.showToast({ title: '请输入要对比的文本', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在对比...' });

    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
      try {
        const result = this.performDiff(textA, textB, ignoreWhitespace);
        this.setData({ comparisonResult: result });
        wx.hideLoading();
        wx.showToast({ title: '对比完成', icon: 'success' });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: '对比失败', icon: 'none' });
        console.error('文本对比失败:', error);
      }
    }, 100);
  },

  // 执行文本对比算法
  performDiff(textA, textB, ignoreWhitespace) {
    // 预处理文本
    const processedA = ignoreWhitespace ? this.removeWhitespace(textA) : textA;
    const processedB = ignoreWhitespace ? this.removeWhitespace(textB) : textB;
    
    // 分割成行
    const linesA = processedA.split('\n');
    const linesB = processedB.split('\n');
    
    // 简化的差异算法 (基于最长公共子序列)
    const diff = this.computeLineDiff(linesA, linesB);
    
    // 统计信息
    const stats = this.computeStats(diff);
    
    return {
      lines: diff,
      additions: stats.additions,
      deletions: stats.deletions,
      modifications: stats.modifications,
      unchanged: stats.unchanged,
      similarity: stats.similarity
    };
  },

  // 移除空白字符
  removeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  },

  // 计算行级别差异
  computeLineDiff(linesA, linesB) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && j < linesB.length) {
        if (linesA[i] === linesB[j]) {
          // 相同行
          result.push({
            lineNumber: i + 1,
            contentA: this.restoreOriginalLine(linesA[i], i, 'A'),
            contentB: this.restoreOriginalLine(linesB[j], j, 'B'),
            type: 'unchanged'
          });
          i++;
          j++;
        } else {
          // 查找最佳匹配
          const nextMatch = this.findNextMatch(linesA, linesB, i, j);
          
          if (nextMatch.i - i > nextMatch.j - j) {
            // 删除操作
            for (let k = i; k < nextMatch.i; k++) {
              result.push({
                lineNumber: k + 1,
                contentA: this.restoreOriginalLine(linesA[k], k, 'A'),
                contentB: '',
                type: 'deletion'
              });
            }
            i = nextMatch.i;
          } else if (nextMatch.j - j > nextMatch.i - i) {
            // 新增操作
            for (let k = j; k < nextMatch.j; k++) {
              result.push({
                lineNumber: j + k - j + 1,
                contentA: '',
                contentB: this.restoreOriginalLine(linesB[k], k, 'B'),
                type: 'addition'
              });
            }
            j = nextMatch.j;
          } else {
            // 修改操作
            result.push({
              lineNumber: i + 1,
              contentA: this.restoreOriginalLine(linesA[i], i, 'A'),
              contentB: this.restoreOriginalLine(linesB[j], j, 'B'),
              type: 'modification'
            });
            i++;
            j++;
          }
        }
      } else if (i < linesA.length) {
        // 剩余删除
        result.push({
          lineNumber: i + 1,
          contentA: this.restoreOriginalLine(linesA[i], i, 'A'),
          contentB: '',
          type: 'deletion'
        });
        i++;
      } else {
        // 剩余新增
        result.push({
          lineNumber: j + 1,
          contentA: '',
          contentB: this.restoreOriginalLine(linesB[j], j, 'B'),
          type: 'addition'
        });
        j++;
      }
    }
    
    return result;
  },

  // 查找下一个匹配点
  findNextMatch(linesA, linesB, startI, startJ) {
    const maxLookAhead = 10;
    const maxLookB = 10;
    
    for (let lookA = 1; lookA <= Math.min(maxLookAhead, linesA.length - startI); lookA++) {
      for (let lookB = 1; lookB <= Math.min(maxLookB, linesB.length - startJ); lookB++) {
        if (startI + lookA < linesA.length && startJ + lookB < linesB.length) {
          if (linesA[startI + lookA] === linesB[startJ + lookB]) {
            return { i: startI + lookA, j: startJ + lookB };
          }
        }
      }
    }
    
    return { i: startI + 1, j: startJ + 1 };
  },

  // 恢复原始行内容（包含空格）
  restoreOriginalLine(processedLine, index, source) {
    if (source === 'A' && this.data.textA) {
      const originalLines = this.data.textA.split('\n');
      return originalLines[index] || processedLine;
    } else if (source === 'B' && this.data.textB) {
      const originalLines = this.data.textB.split('\n');
      return originalLines[index] || processedLine;
    }
    return processedLine;
  },

  // 计算统计信息
  computeStats(diff) {
    let additions = 0, deletions = 0, modifications = 0, unchanged = 0;
    
    diff.forEach(line => {
      switch (line.type) {
        case 'addition': additions++; break;
        case 'deletion': deletions++; break;
        case 'modification': modifications++; break;
        case 'unchanged': unchanged++; break;
      }
    });
    
    const totalLines = additions + deletions + modifications + unchanged;
    const similarLines = unchanged + modifications * 0.5;
    const similarity = totalLines > 0 ? Math.round((similarLines / totalLines) * 100) : 100;
    
    return { additions, deletions, modifications, unchanged, similarity };
  },

  // 交换文本
  swapTexts() {
    this.setData({
      textA: this.data.textB,
      textB: this.data.textA
    });
    wx.vibrateShort();
  },

  // 清空所有文本
  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有文本和对比结果吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            textA: '',
            textB: '',
            comparisonResult: null
          });
          wx.vibrateShort();
        }
      }
    });
  },

  // 粘贴文本A
  pasteTextA() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ textA: res.data });
          wx.showToast({ title: '粘贴成功', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
        }
      }
    });
  },

  // 复制文本A
  copyTextA() {
    if (!this.data.textA) {
      wx.showToast({ title: '没有可复制的文本', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: this.data.textA, success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  // 粘贴文本B
  pasteTextB() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ textB: res.data });
          wx.showToast({ title: '粘贴成功', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
        }
      }
    });
  },

  // 复制文本B
  copyTextB() {
    if (!this.data.textB) {
      wx.showToast({ title: '没有可复制的文本', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: this.data.textB, success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  // 加载示例对比
  loadSampleDiff() {
    const sampleA = `function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

console.log(calculateSum([1, 2, 3, 4, 5]));`;

    const sampleB = `function calculateSum(numbers) {
  let total = 0;
  for (const number of numbers) {
    total += number;
  }
  return total;
}

// Calculate and display result
const result = calculateSum([1, 2, 3, 4, 5]);
console.log('The sum is:', result);`;

    this.setData({ textA: sampleA, textB: sampleB });
    wx.showToast({ title: '已加载示例代码', icon: 'success' });
  },

  // 导出对比结果
  exportDiff() {
    if (!this.data.comparisonResult) {
      wx.showToast({ title: '请先进行对比', icon: 'none' });
      return;
    }

    const stats = this.data.comparisonResult;
    const exportText = `文本对比结果报告
生成时间: ${new Date().toLocaleString()}

统计信息:
- 新增行数: ${stats.additions}
- 删除行数: ${stats.deletions}
- 修改行数: ${stats.modifications}
- 未变行数: ${stats.unchanged}
- 相似度: ${stats.similarity}%

原始文本长度: ${this.data.textA.length}
对比文本长度: ${this.data.textB.length}`;

    wx.setClipboardData({
      data: exportText,
      success: () => {
        wx.showToast({ title: '报告已复制', icon: 'success' });
      }
    });
  },

  // 分享对比结果
  shareDiff() {
    if (!this.data.comparisonResult) {
      wx.showToast({ title: '请先进行对比', icon: 'none' });
      return;
    }

    const stats = this.data.comparisonResult;
    const shareText = `📊 文本对比完成\n相似度: ${stats.similarity}%\n新增: ${stats.additions} 行\n删除: ${stats.deletions} 行\n修改: ${stats.modifications} 行\n\n来自「免费工具箱」文本对比工具`;

    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({ title: '分享信息已复制', icon: 'success' });
      }
    });
  },

  // 切换高亮模式
  highlightMode() {
    const modes = ['background', 'foreground', 'border'];
    const currentIndex = modes.indexOf(this.data.highlightMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    this.setData({ highlightMode: modes[nextIndex] });
    wx.showToast({ title: `切换到${modes[nextIndex]}模式`, icon: 'success' });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '文本对比工具 - 专业的差异分析神器',
      path: '/packages/text/pages/text-diff/text-diff',
      imageUrl: ''
    }
  }
})