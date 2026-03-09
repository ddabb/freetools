// packages/data/pages/data-analyzer/data-analyzer.js
Page({
  data: {
    inputData: '',
    analysisResult: null,
    dataTypeIndex: 0,
    dataTypes: ['数字', '文本', '混合']
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '数据统计器' });
  },

  setInputData(e) {
    this.setData({ inputData: e.detail.value });
  },

  setDataType(e) {
    this.setData({ dataTypeIndex: e.detail.value });
  },

  analyzeData() {
    const data = this.data.inputData.trim();
    if (!data) {
      wx.showToast({ title: '请输入数据', icon: 'none' });
      return;
    }

    try {
      const numbers = data.split(/[\s,，;；\n\t]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
      
      if (numbers.length === 0) {
        wx.showToast({ title: '未找到有效数字', icon: 'none' });
        return;
      }

      const stats = this.calculateStats(numbers);
      this.setData({ analysisResult: stats });
      wx.showToast({ title: '分析完成', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '分析失败', icon: 'none' });
    }
  },

  calculateStats(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    
    const median = numbers.length % 2 === 0 
      ? (sorted[numbers.length/2 - 1] + sorted[numbers.length/2]) / 2
      : sorted[Math.floor(numbers.length/2)];
    
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;
    
    return {
      count: numbers.length,
      sum: sum.toFixed(2),
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      variance: variance.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      range: range.toFixed(2)
    };
  },

  loadSample() {
    const sampleData = `12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65`;
    this.setData({ inputData: sampleData });
    wx.showToast({ title: '已加载示例数据', icon: 'success' });
  },

  exportResult() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先进行分析', icon: 'none' });
      return;
    }

    const result = this.data.analysisResult;
    const exportText = `数据分析结果：\n样本数量: ${result.count}\n总和: ${result.sum}\n平均值: ${result.mean}\n中位数: ${result.median}\n方差: ${result.variance}\n标准差: ${result.stdDev}\n最小值: ${result.min}\n最大值: ${result.max}\n极差: ${result.range}`;
    
    wx.setClipboardData({ data: exportText, success: () => {
      wx.showToast({ title: '结果已复制', icon: 'success' });
    }});
  },

  onShareAppMessage() {
    return {
      title: '数据统计器 - 专业的数据分析工具',
      path: '/packages/data/pages/data-analyzer/data-analyzer'
    }
  }
})