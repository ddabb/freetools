// packages/data/pages/data-analyzer/data-analyzer.js
const XLSX = require('../../../../libs/xlsx.full.min.js');

Page({
  data: {
    inputData: '',
    analysisResult: null,
    dataTypeIndex: 0,
    dataTypes: ['数字', '文本', '混合'],
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '数据统计器' });
  },

  // 设置输入数据
  setInputData(e) {
    this.setData({ inputData: e.detail.value });
  },

  // 通过标签切换数据类型
  setDataTypeByIndex(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ dataTypeIndex: index });
  },

  // 保留原有的picker方式
  setDataType(e) {
    this.setData({ dataTypeIndex: e.detail.value });
  },

  // 清空输入
  clearInput() {
    this.setData({ 
      inputData: '',
      analysisResult: null,
    });
  },

  // 加载示例数据
  loadSample() {
    const sampleData = `12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65`;
    this.setData({ inputData: sampleData });
    wx.showToast({ title: '已加载示例数据', icon: 'success' });
  },

  // ========== Excel 导入功能 ==========
  importExcel() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls', 'csv'],
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        wx.showLoading({ title: '正在读取...' });

        wx.getFileSystemManager().readFile({
          filePath: filePath,
          success: (readRes) => {
            try {
              const data = new Uint8Array(readRes.data);
              const workbook = XLSX.read(data, { type: 'array' });
              
              // 获取第一个工作表
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              
              // 转换为 JSON
              const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              
              // 提取所有数字
              const numbers = [];
              jsonData.forEach(row => {
                row.forEach(cell => {
                  const num = parseFloat(cell);
                  if (!isNaN(num) && isFinite(num)) {
                    numbers.push(num);
                  }
                });
              });

              if (numbers.length === 0) {
                wx.hideLoading();
                wx.showToast({ title: '文件中未找到数字', icon: 'none' });
                return;
              }

              // 转换为逗号分隔的字符串
              const dataStr = numbers.join(', ');
              this.setData({ 
                inputData: dataStr,
                      });
              
              wx.hideLoading();
              wx.showToast({ title: `已导入 ${numbers.length} 个数字`, icon: 'success' });
            } catch (err) {
              console.error('[导入Excel] 解析失败:', err);
              wx.hideLoading();
              wx.showToast({ title: '文件解析失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '读取文件失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        // 用户取消选择
      }
    });
  },

  // ========== 分析数据 ==========
  analyzeData() {
    const data = this.data.inputData.trim();
    if (!data) {
      wx.showToast({ title: '请输入数据', icon: 'none' });
      return;
    }

    try {
      // 解析数字
      const numbers = data.split(/[\s,，;；\n\t]+/)
        .map(s => parseFloat(s))
        .filter(n => !isNaN(n));
      
      if (numbers.length === 0) {
        wx.showToast({ title: '未找到有效数字', icon: 'none' });
        return;
      }

      const stats = this.calculateStats(numbers);
      this.setData({ 
        analysisResult: stats,
      });
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
      sum: sum.toFixed(4),
      mean: mean.toFixed(4),
      median: median.toFixed(4),
      variance: variance.toFixed(4),
      stdDev: stdDev.toFixed(4),
      min: min.toFixed(4),
      max: max.toFixed(4),
      range: range.toFixed(4)
    };
  },

  // ========== 复制结果 ==========
  copyResult() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先进行分析', icon: 'none' });
      return;
    }

    const result = this.data.analysisResult;
    const text = `数据分析结果：
样本数量: ${result.count}
总和: ${result.sum}
平均值: ${result.mean}
中位数: ${result.median}
方差: ${result.variance}
标准差: ${result.stdDev}
最小值: ${result.min}
最大值: ${result.max}
极差: ${result.range}`;
    
    wx.setClipboardData({ 
      data: text, 
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  // ========== Excel 导出 ==========
  exportExcel() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先进行分析', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导出',
      content: '确定要导出统计分析结果为 Excel 文件吗？',
      success: (res) => {
        if (!res.confirm) return;

        const { analysisResult, inputData } = this.data;
        const importedNumbers = this._importedNumbers || [];

        // 准备数据
        const aoa = [
          ['数据统计分析报告'],
          ['生成时间', new Date().toLocaleString()],
      [],
      ['原始数据'],
      inputData || '无',
      [],
      ['统计指标'],
      ['指标名称', '数值', '说明']
    ];

    // 添加各项统计
    const statsItems = [
      ['样本数量', analysisResult.count, '有效数字的个数'],
      ['总和', analysisResult.sum, '所有数值之和'],
      ['平均值', analysisResult.mean, '算术平均值'],
      ['中位数', analysisResult.median, '排序后中间值'],
      ['方差', analysisResult.variance, '离散程度度量'],
      ['标准差', analysisResult.stdDev, '方差的平方根'],
      ['最小值', analysisResult.min, '数据中的最小值'],
      ['最大值', analysisResult.max, '数据中的最大值'],
      ['极差', analysisResult.range, '最大值与最小值之差']
    ];
    
    aoa.push(...statsItems);

    // 添加原始数据列（如果数量合适）
    if (importedNumbers.length > 0 && importedNumbers.length <= 100) {
      aoa.push([]);
      aoa.push(['原始数据明细']);
      aoa.push(['序号', '数值']);
      importedNumbers.forEach((num, i) => {
        aoa.push([i + 1, num]);
      });
    }

    this._exportToExcel(aoa, '统计分析', `data_analysis_${Date.now()}.xlsx`);
      }   // 确认弹窗 success 结束
    });
  },

  // ========== CSV 导出 ==========
  exportCSV() {
    if (!this.data.analysisResult) {
      wx.showToast({ title: '请先进行分析', icon: 'none' });
      return;
    }

    const { analysisResult, inputData } = this.data;
        const importedNumbers = this._importedNumbers || [];
    
    // CSV 内容
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += '数据统计分析报告\n';
    csv += `生成时间,${new Date().toLocaleString()}\n\n`;
    csv += '统计指标\n';
    csv += '指标名称,数值,说明\n';
    
    const statsItems = [
      ['样本数量', analysisResult.count, '有效数字的个数'],
      ['总和', analysisResult.sum, '所有数值之和'],
      ['平均值', analysisResult.mean, '算术平均值'],
      ['中位数', analysisResult.median, '排序后中间值'],
      ['方差', analysisResult.variance, '离散程度度量'],
      ['标准差', analysisResult.stdDev, '方差的平方根'],
      ['最小值', analysisResult.min, '数据中的最小值'],
      ['最大值', analysisResult.max, '数据中的最大值'],
      ['极差', analysisResult.range, '最大值与最小值之差']
    ];
    
    statsItems.forEach(item => {
      csv += `${item[0]},${item[1]},"${item[2]}"\n`;
    });

    // 添加原始数据
    if (importedNumbers.length > 0) {
      csv += '\n原始数据\n';
      csv += '序号,数值\n';
      importedNumbers.forEach((num, i) => {
        csv += `${i + 1},${num}\n`;
      });
    }

    // 保存文件
    const fileName = `data_analysis_${Date.now()}.csv`;
    const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    wx.getFileSystemManager().writeFile({
      filePath: fullPath,
      data: csv,
      encoding: 'utf-8',
      success: () => {
        wx.openDocument({
          filePath: fullPath,
          fileType: 'csv',
          showMenu: true,
          success: () => wx.showToast({ title: '已打开CSV', icon: 'success' }),
          fail: () => wx.showModal({
            title: '导出成功',
            content: `文件已保存为 ${fileName}`,
            showCancel: false
          })
        });
      },
      fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
    });
  },

  // 通用 Excel 导出
  _exportToExcel(aoa, sheetName, fileName) {
    try {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = aoa[0].map(() => ({ wch: 18 }));
      ws['!cols'][0] = { wch: 20 };
      ws['!cols'][1] = { wch: 15 };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      wx.getFileSystemManager().writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => wx.showToast({ title: '已打开Excel', icon: 'success' }),
            fail: () => wx.showModal({
              title: '导出成功',
              content: `文件已保存为 ${fileName}`,
              showCancel: false
            })
          });
        },
        fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
      });
    } catch (err) {
      console.error('[导出Excel] 异常:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: '数据统计器 - 专业的数据分析工具',
      path: '/packages/data/pages/data-analyzer/data-analyzer'
    }
  },

  onShareTimeline() {
    return {
      title: '数据统计器 - 专业的数据分析工具',
      query: 'data-analyzer'
    }
  }
})
