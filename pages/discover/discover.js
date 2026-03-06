// discover.js
import { tools, categories } from '../../config/tools.js';

Page({
  data: {
    currentCategory: '',
    tools: tools,
    categories: categories,
    filteredTools: []
  },

  onLoad(options) {
    // 页面加载时执行
    if (options.category) {
      this.setData({
        currentCategory: options.category
      });
      this.filterTools(options.category);
    } else {
      this.setData({
        filteredTools: this.data.tools
      });
    }
  },

  onShow() {
    // 页面显示时执行
  },

  // 根据分类过滤工具
  filterTools(category) {
    const filtered = this.data.tools.filter(tool => {
      return tool.categories.includes(category);
    });
    this.setData({
      filteredTools: filtered
    });
  }
})