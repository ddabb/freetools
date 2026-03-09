// packages/chart/pages/chart-generator/chart-generator.js
Page({
  data: {
    chartTypeIndex: 0,
    chartTypes: ['柱状图', '饼图', '折线图', '雷达图']
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '图表生成器' });
    this.drawSampleChart();
  },

  drawSampleChart() {
    const ctx = wx.createCanvasContext('sampleLine');
    
    // 绘制简单的折线图示例
    const width = 200;
    const height = 120;
    
    // 背景
    ctx.setFillStyle('#f8f9fa');
    ctx.fillRect(0, 0, width, height);
    
    // 坐标轴
    ctx.setStrokeStyle('#dee2e6');
    ctx.setLineWidth(1);
    ctx.moveTo(20, 10);
    ctx.lineTo(20, height - 20);
    ctx.lineTo(width - 10, height - 20);
    ctx.stroke();
    
    // 数据线
    ctx.setStrokeStyle('#007bff');
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(20, height - 30);
    ctx.lineTo(60, height - 50);
    ctx.lineTo(100, height - 70);
    ctx.lineTo(140, height - 40);
    ctx.lineTo(width - 10, height - 60);
    ctx.stroke();
    
    ctx.draw();
  },

  setChartType(e) {
    this.setData({ chartTypeIndex: e.detail.value });
  },

  createChart() {
    wx.showToast({ title: '图表生成功能开发中', icon: 'none' });
  },

  importData() {
    wx.showToast({ title: '数据导入功能开发中', icon: 'none' });
  },

  exportImage() {
    wx.showToast({ title: '导出功能开发中', icon: 'none' });
  },

  loadTemplate() {
    wx.showToast({ title: '模板功能开发中', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '图表生成器 - 专业的数据可视化工具',
      path: '/packages/chart/pages/chart-generator/chart-generator'
    }
  }
})