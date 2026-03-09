// discover.js
const { tools, categories } = require('../../config/tools.js');

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
    const target = category.trim();
    const filtered = this.data.tools.filter(tool => {
      // 精确匹配（忽略前后空格）
      if (tool.categories.some(cat => cat.trim() === target)) {
        return true;
      }
      // 更多工具：不属于任何主分类
      if (target === '更多工具') {
        return !['财务工具', '健康工具', '生活工具', '学习工具', '安全工具'].some(mainCat => 
          tool.categories.some(cat => cat.trim() === mainCat)
        );
      }
      return false;
    });
    this.setData({
      filteredTools: filtered
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const { currentCategory } = this.data;
    return {
      title: currentCategory ? `${currentCategory}工具 - 发现更多实用功能` : '发现页 - 探索更多实用工具',
      path: '/pages/discover/discover' + (currentCategory ? `?category=${currentCategory}` : ''),
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '实用工具箱 - 探索更多实用工具',
      imageUrl: ''
    }
  }
})