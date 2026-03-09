// packages/chart/pages/chart-generator/chart-generator.js
Page({
  data: {
    chartTypeIndex: 0,
    chartTypes: ['柱状图', '饼图', '折线图', '雷达图'],
    chartData: '',
    chartTitle: '',
    xAxisTitle: '',
    yAxisTitle: '',
    showChart: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '图表生成器' });
  },

  // 设置图表类型
  setChartType(e) {
    this.setData({ chartTypeIndex: e.detail.value });
  },

  // 设置图表数据
  setChartData(e) {
    this.setData({ chartData: e.detail.value });
  },

  // 设置图表标题
  setChartTitle(e) {
    this.setData({ chartTitle: e.detail.value });
  },

  // 设置X轴标题
  setXAxisTitle(e) {
    this.setData({ xAxisTitle: e.detail.value });
  },

  // 设置Y轴标题
  setYAxisTitle(e) {
    this.setData({ yAxisTitle: e.detail.value });
  },

  // 刷新图表预览
  refreshChart() {
    const { chartData, chartTypeIndex } = this.data;
    
    if (!chartData.trim()) {
      wx.showToast({ title: '请输入图表数据', icon: 'none' });
      return;
    }

    try {
      const data = JSON.parse(chartData);
      this.drawChart(data, chartTypeIndex);
      this.setData({ showChart: true });
    } catch (error) {
      wx.showToast({ title: '数据格式错误，请检查输入', icon: 'none' });
      console.error('数据解析失败:', error);
    }
  },

  // 绘制图表
  drawChart(data, chartTypeIndex) {
    const ctx = wx.createCanvasContext('chartCanvas');
    const width = 320;
    const height = 240;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.setFillStyle('#f8f9fa');
    ctx.fillRect(0, 0, width, height);
    
    // 绘制标题
    const { chartTitle } = this.data;
    if (chartTitle) {
      ctx.setFontSize(16);
      ctx.setFillStyle('#333');
      ctx.setTextAlign('center');
      ctx.fillText(chartTitle, width / 2, 30);
    }
    
    // 根据图表类型绘制不同的图表
    switch (chartTypeIndex) {
      case 0: // 柱状图
        this.drawBarChart(ctx, data, width, height);
        break;
      case 1: // 饼图
        this.drawPieChart(ctx, data, width, height);
        break;
      case 2: // 折线图
        this.drawLineChart(ctx, data, width, height);
        break;
      case 3: // 雷达图
        this.drawRadarChart(ctx, data, width, height);
        break;
    }
    
    ctx.draw();
  },

  // 绘制柱状图
  drawBarChart(ctx, data, width, height) {
    if (!Array.isArray(data)) return;
    
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 80;
    const barCount = data.length;
    const barWidth = chartWidth / (barCount + 1);
    
    // 绘制坐标轴
    ctx.setStrokeStyle('#dee2e6');
    ctx.setLineWidth(1);
    ctx.moveTo(padding, padding + 20);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // 绘制柱状图
    const maxValue = Math.max(...data);
    const barSpacing = barWidth * 0.6;
    
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + (index + 0.5) * barWidth;
      const y = height - padding - barHeight;
      
      // 绘制柱子
      ctx.setFillStyle('#007bff');
      ctx.fillRect(x - barSpacing / 2, y, barSpacing, barHeight);
      
      // 绘制数值
      ctx.setFontSize(12);
      ctx.setFillStyle('#666');
      ctx.setTextAlign('center');
      ctx.fillText(value, x, y - 10);
    });
  },

  // 绘制饼图
  drawPieChart(ctx, data, width, height) {
    if (!Array.isArray(data)) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // 计算总数值
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // 颜色数组
    const colors = ['#ff7675', '#74b9ff', '#55efc4', '#fd79a8', '#fdcb6e', '#6c5ce7'];
    
    let startAngle = 0;
    data.forEach((item, index) => {
      const angle = (item.value / total) * 2 * Math.PI;
      
      // 绘制扇形
      ctx.setFillStyle(colors[index % colors.length]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fill();
      
      // 绘制标签
      const labelAngle = startAngle + angle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.setFontSize(12);
      ctx.setFillStyle('#333');
      ctx.setTextAlign('center');
      ctx.fillText(`${item.name}: ${item.value}`, labelX, labelY);
      
      startAngle += angle;
    });
    
    // 绘制中心圆
    ctx.setFillStyle('#fff');
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 3, 0, 2 * Math.PI);
    ctx.fill();
  },

  // 绘制折线图
  drawLineChart(ctx, data, width, height) {
    if (!Array.isArray(data)) return;
    
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 80;
    
    // 绘制坐标轴
    ctx.setStrokeStyle('#dee2e6');
    ctx.setLineWidth(1);
    ctx.moveTo(padding, padding + 20);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // 绘制折线
    const maxValue = Math.max(...data);
    const pointSpacing = chartWidth / (data.length - 1);
    
    ctx.setStrokeStyle('#007bff');
    ctx.setLineWidth(2);
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + index * pointSpacing;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制数据点
      ctx.setFillStyle('#007bff');
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.stroke();
  },

  // 绘制雷达图
  drawRadarChart(ctx, data, width, height) {
    if (!Array.isArray(data)) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const count = data.length;
    const angleStep = 2 * Math.PI / count;
    
    // 绘制网格
    ctx.setStrokeStyle('#dee2e6');
    ctx.setLineWidth(1);
    
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      for (let j = 0; j < count; j++) {
        const angle = j * angleStep;
        const x = centerX + Math.cos(angle - Math.PI / 2) * r;
        const y = centerY + Math.sin(angle - Math.PI / 2) * r;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // 绘制轴线
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const x = centerX + Math.cos(angle - Math.PI / 2) * radius;
      const y = centerY + Math.sin(angle - Math.PI / 2) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // 绘制数据区域
    ctx.setFillStyle('rgba(0, 123, 255, 0.2)');
    ctx.setStrokeStyle('#007bff');
    ctx.setLineWidth(2);
    ctx.beginPath();
    
    data.forEach((item, index) => {
      const angle = index * angleStep;
      const r = (item.value / 100) * radius;
      const x = centerX + Math.cos(angle - Math.PI / 2) * r;
      const y = centerY + Math.sin(angle - Math.PI / 2) * r;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制标签
    data.forEach((item, index) => {
      const angle = index * angleStep;
      const x = centerX + Math.cos(angle - Math.PI / 2) * (radius + 20);
      const y = centerY + Math.sin(angle - Math.PI / 2) * (radius + 20);
      
      ctx.setFontSize(12);
      ctx.setFillStyle('#333');
      ctx.setTextAlign('center');
      ctx.fillText(item.name, x, y);
    });
  },

  // 生成图表
  createChart() {
    const { chartData, chartTypeIndex } = this.data;
    
    if (!chartData.trim()) {
      wx.showToast({ title: '请输入图表数据', icon: 'none' });
      return;
    }

    try {
      const data = JSON.parse(chartData);
      this.drawChart(data, chartTypeIndex);
      this.setData({ showChart: true });
      wx.showToast({ title: '图表生成成功', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '数据格式错误，请检查输入', icon: 'none' });
      console.error('图表生成失败:', error);
    }
  },



  // 导出图片
  exportImage() {
    if (!this.data.showChart) {
      wx.showToast({ title: '请先生成图表', icon: 'none' });
      return;
    }

    wx.canvasToTempFilePath({
      canvasId: 'chartCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({ title: '图片已保存到相册', icon: 'success' });
          },
          fail: (err) => {
            if (err.errMsg.includes('auth deny')) {
              wx.showModal({
                title: '需要授权',
                content: '需要相册权限才能保存图片，请在设置中开启',
                showCancel: false
              });
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  },

  // 加载模板
  loadTemplate() {
    wx.showToast({ title: '模板功能开发中', icon: 'none' });
  },

  // 使用模板
  useTemplate(e) {
    const template = e.currentTarget.dataset.template;
    let chartData = '';
    let chartTitle = '';
    let chartTypeIndex = 0;
    
    switch (template) {
      case 'bar':
        chartData = '[120, 200, 150, 80, 70, 110, 130]';
        chartTitle = '销售数据统计';
        chartTypeIndex = 0;
        break;
      case 'pie':
        chartData = '[{"name": "A产品", "value": 35}, {"name": "B产品", "value": 25}, {"name": "C产品", "value": 40}]';
        chartTitle = '市场份额分析';
        chartTypeIndex = 1;
        break;
      case 'line':
        chartData = '[10, 20, 30, 25, 40, 35, 50]';
        chartTitle = '业务趋势分析';
        chartTypeIndex = 2;
        break;
      case 'radar':
        chartData = '[{"name": "产品质量", "value": 85}, {"name": "服务水平", "value": 90}, {"name": "价格优势", "value": 75}, {"name": "品牌知名度", "value": 80}, {"name": "创新能力", "value": 70}]';
        chartTitle = '企业能力评估';
        chartTypeIndex = 3;
        break;
    }
    
    this.setData({
      chartData: chartData,
      chartTitle: chartTitle,
      chartTypeIndex: chartTypeIndex,
      showChart: false
    });
    
    wx.showToast({ title: '模板加载成功', icon: 'success' });
  },

  onShareAppMessage() {
    return {
      title: '图表生成器 - 专业的数据可视化工具',
      path: '/packages/chart/pages/chart-generator/chart-generator'
    }
  }
})