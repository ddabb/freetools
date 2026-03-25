// discover.js
const { tools, categories } = require('../../config/tools.js');
const utils = require('../../utils/index');

Page({
  data: {
    currentCategory: '',
    tools: tools,
    categories: categories,
    filteredTools: [],
    searchText: '',
    loading: false
  },

  onLoad(options) {
    // 页面加载时执行
    
    // 显示分享按钮
    utils.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
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
    return {
      title: '发现页 - 探索更多实用工具',
      path: '/pages/discover/discover'
    }
  },

  // 导航到工具
  navigateToTool(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({
      url: url,
      fail: () => {
        utils.showText('页面开发中')
      }
    })
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '发现页 - 探索更多实用工具',
      query: 'discover'
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) {
      this.setData({ searchText: '', filteredTools: this.data.tools });
      return;
    }
    
    this.setData({ loading: true });
    setTimeout(() => {
      const filtered = this.data.tools.filter(tool => {
        return (
          tool.name.toLowerCase().includes(searchText) ||
          (tool.description && tool.description.toLowerCase().includes(searchText)) ||
          (tool.keywords && tool.keywords.some(keyword => keyword.toLowerCase().includes(searchText)))
        );
      });
      
      this.setData({
        searchText,
        filteredTools: filtered,
        loading: false
      });
    }, 300);
  },

  // 搜索确认
  onSearchConfirm(e) {
    this.onSearchInput(e);
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchText: '', filteredTools: this.data.tools });
  }
})