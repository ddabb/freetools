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