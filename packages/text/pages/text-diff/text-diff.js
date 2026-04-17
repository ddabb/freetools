// packages/text/pages/text-diff/text-diff.js
Page({
  data: {
    textA: '',
    textB: '',
    diffModeIndex: 0,
    diffModes: ['并排对比', '合并视图'],
    ignoreWhitespace: false,
    comparisonResult: null,
    highlightMode: 'background',
    isComparing: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '文本对比' });
  },

  // 输入文本A时自动对�?
  setTextA(e) {
    this.setData({ textA: e.detail.value });
    this.autoCompare();
  },

  // 输入文本B时自动对�?
  setTextB(e) {
    this.setData({ textB: e.detail.value });
    this.autoCompare();
  },

  // 自动对比（有防抖�?
  autoCompare() {
    const { textA, textB } = this.data;

    if (!textA.trim() && !textB.trim()) {
      this.setData({ comparisonResult: null });
      return;
    }

    // 简单防�?
    if (this.compareTimer) {
      clearTimeout(this.compareTimer);
    }

    this.compareTimer = setTimeout(() => {
      this.compareTexts();
    }, 500);
  },

  // 设置对比模式
  setDiffMode(e) {
    this.setData({ diffModeIndex: e.detail.value });
  },

  // 切换忽略空格
  toggleIgnoreWhitespace(e) {
    this.setData({ ignoreWhitespace: e.detail.value });
    this.autoCompare();
  },

  // 手动开始对�?
  compareTexts() {
    const { textA, textB, ignoreWhitespace, isComparing } = this.data;

    if (isComparing) return;

    if (!textA.trim() && !textB.trim()) {
      this.setData({ comparisonResult: null });
      return;
    }

    this.setData({ isComparing: true });

    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
      try {
        const result = this.performDiff(textA, textB, ignoreWhitespace);
        this.setData({
          comparisonResult: result,
          isComparing: false
        });
      } catch (error) {
        console.error('文本对比失败:', error);
        this.setData({ isComparing: false });
      }
    }, 50);
  },

  // 执行文本对比算法
  performDiff(textA, textB, ignoreWhitespace) {
    const processedA = ignoreWhitespace ? this.removeWhitespace(textA) : textA;
    const processedB = ignoreWhitespace ? this.removeWhitespace(textB) : textB;

    const linesA = processedA.split('\n');
    const linesB = processedB.split('\n');

    const diff = this.computeLineDiff(linesA, linesB);
    const stats = this.computeStats(diff);

    return {
      lines: diff,
      additions: stats.additions,
      deletions: stats.deletions,
      modifications: stats.modifications,
      unchanged: stats.unchanged,
      similarity: stats.similarity,
      lineCount: Math.max(linesA.length, linesB.length)
    };
  },

  removeWhitespace(text) {
    return text.replace(/\s+/g, ' ').trim();
  },

  computeLineDiff(linesA, linesB) {
    const result = [];
    let i = 0, j = 0;

    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && j < linesB.length) {
        if (linesA[i] === linesB[j]) {
          result.push({
            lineNumber: i + 1,
            contentA: this.restoreOriginalLine(linesA[i], i, 'A'),
            contentB: this.restoreOriginalLine(linesB[j], j, 'B'),
            type: 'unchanged'
          });
          i++;
          j++;
        } else {
          const nextMatch = this.findNextMatch(linesA, linesB, i, j);

          if (nextMatch.i - i > nextMatch.j - j) {
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
            for (let k = j; k < nextMatch.j; k++) {
              result.push({
                lineNumber: k + 1,
                contentA: '',
                contentB: this.restoreOriginalLine(linesB[k], k, 'B'),
                type: 'addition'
              });
            }
            j = nextMatch.j;
          } else {
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
        result.push({
          lineNumber: i + 1,
          contentA: this.restoreOriginalLine(linesA[i], i, 'A'),
          contentB: '',
          type: 'deletion'
        });
        i++;
      } else {
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

  findNextMatch(linesA, linesB, startI, startJ) {
    const maxLookAhead = 10;

    for (let lookA = 1; lookA <= Math.min(maxLookAhead, linesA.length - startI); lookA++) {
      for (let lookB = 1; lookB <= Math.min(maxLookAhead, linesB.length - startJ); lookB++) {
        if (startI + lookA < linesA.length && startJ + lookB < linesB.length) {
          if (linesA[startI + lookA] === linesB[startJ + lookB]) {
            return { i: startI + lookA, j: startJ + lookB };
          }
        }
      }
    }

    return { i: startI + 1, j: startJ + 1 };
  },

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

  swapTexts() {
    this.setData({
      textA: this.data.textB,
      textB: this.data.textA
    });
    wx.vibrateShort();
    setTimeout(() => this.autoCompare(), 100);
  },

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

  pasteTextA() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ textA: res.data });
          wx.showToast({ title: '粘贴成功', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为�?, icon: 'none' });
        }
      }
    });
  },

  copyTextA() {
    if (!this.data.textA) {
      wx.showToast({ title: '没有可复制的文本', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: this.data.textA, success: () => {
      wx.showToast({ title: '已复制, icon: 'success' });
    }});
  },

  pasteTextB() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({ textB: res.data });
          wx.showToast({ title: '粘贴成功', icon: 'success' });
        } else {
          wx.showToast({ title: '剪贴板为�?, icon: 'none' });
        }
      }
    });
  },

  copyTextB() {
    if (!this.data.textB) {
      wx.showToast({ title: '没有可复制的文本', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: this.data.textB, success: () => {
      wx.showToast({ title: '已复制, icon: 'success' });
    }});
  },

  loadSampleDiff() {
    const sampleA = `function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

console.debug(calculateSum([1, 2, 3, 4, 5]));`;

    const sampleB = `function calculateSum(numbers) {
  let total = 0;
  for (const number of numbers) {
    total += number;
  }
  return total;
}

// Calculate and display result
const result = calculateSum([1, 2, 3, 4, 5]);
console.debug('The sum is:', result);`;

    this.setData({ textA: sampleA, textB: sampleB });
    wx.showToast({ title: '已加载示例代码, icon: 'success' });
  },

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
- 相似�? ${stats.similarity}%

原始文本长度: ${this.data.textA.length}
对比文本长度: ${this.data.textB.length}`;

    wx.setClipboardData({
      data: exportText,
      success: () => {
        wx.showToast({ title: '报告已复制, icon: 'success' });
      }
    });
  },

  shareDiff() {
    if (!this.data.comparisonResult) {
      wx.showToast({ title: '请先进行对比', icon: 'none' });
      return;
    }

    const stats = this.data.comparisonResult;
    const shareText = `📊 文本对比完成
相似�? ${stats.similarity}%
新增: ${stats.additions} �?
删除: ${stats.deletions} �?
修改: ${stats.modifications} �?

来自「免费工具箱」文本对比`;

    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({ title: '分享信息已复制, icon: 'success' });
      }
    });
  },

  highlightMode() {
    const modes = ['background', 'foreground', 'border'];
    const currentIndex = modes.indexOf(this.data.highlightMode);
    const nextIndex = (currentIndex + 1) % modes.length;

    this.setData({ highlightMode: modes[nextIndex] });
    wx.showToast({ title: `已切换高亮模式`, icon: 'success' });
  },
  },
  }
})
