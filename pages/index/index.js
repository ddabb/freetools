// index.js
const { commonTools, categories, allTools, toolFrequency, searchTools } = require('../../config/tools.js');
const utils = require('../../utils/index');

// 分类排序：置顶的排前面
const sortedCategories = [...categories].sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return 0;
});

Page({
  data: {
    // 分类和工具数据（置顶的排前面）
    categories: sortedCategories,
    activeCategory: '常用工具',
    commonTools: commonTools,
    allTools: allTools,
    toolFrequency: toolFrequency,
    
    // 工具列表
    currentCategoryTools: commonTools,
    
    // 搜索
    searchText: '',
    filteredTools: [],
    showSearchResult: false,
    
    // 最近使用
    recentTools: [],
    
    // 加载状态
    loading: false
  },

  onLoad() {
    this.loadRecentTools();
    utils.showShareMenu({ withShareTicket: true });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    if (category === this.data.activeCategory) return;
    
    const tools = this.getToolsByCategory(category);
    this.setData({
      activeCategory: category,
      currentCategoryTools: tools,
      searchText: '',
      showSearchResult: false,
      filteredTools: []
    });
  },

  // 获取分类工具（置顶的排前面）
  getToolsByCategory(categoryName) {
    if (categoryName === '常用工具') return this.data.commonTools;
    return this.data.allTools
      .filter(tool => tool.categories && tool.categories.includes(categoryName))
      .sort((a, b) => {
        // 置顶的工具排前面
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // 按使用频率排序
        return (this.data.toolFrequency[b.id] || 0) - (this.data.toolFrequency[a.id] || 0);
      });
  },

  // 获取工具分类样式
  getToolCategory(toolId) {
    const tool = this.data.allTools.find(t => t.id === toolId);
    if (!tool || !tool.categories) return 'text';
    return tool.categories[0].replace(/[^\w]/g, '');
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) {
      this.setData({ searchText: '', showSearchResult: false, filteredTools: [] });
      return;
    }
    
    this.setData({
      searchText,
      showSearchResult: true,
      filteredTools: searchTools(searchText)
    });
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchText: '', showSearchResult: false, filteredTools: [] });
  },

  // 搜索确认
  onSearchConfirm(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) return;
    
    this.setData({ loading: true });
    setTimeout(() => {
      this.setData({
        searchText,
        showSearchResult: true,
        filteredTools: searchTools(searchText),
        loading: false
      });
    }, 300);
  },

  // 导航到工具
  navigateToTool(e) {
    let tool = null;
    let url = null;
    
    // 检查是来自 tool-card 组件的事件还是来自最近使用列表的事件
    if (e.detail && e.detail.url) {
      // 来自 tool-card 组件的事件
      url = e.detail.url;
      tool = this.data.allTools.find(t => t.url === url);
    } else if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.url) {
      // 来自最近使用列表的事件
      url = e.currentTarget.dataset.url;
      tool = this.data.allTools.find(t => t.url === url);
    }
    
    if (!tool) return;
    
    this.addToRecentTools(tool);
    wx.navigateTo({
      url,
      fail: () => utils.showText('页面开发中')
    });
  },

  // 添加到最近使用
  addToRecentTools(tool) {
    try {
      let recent = wx.getStorageSync('recentTools') || [];
      recent = recent.filter(item => item.id !== tool.id);
      recent.unshift({ id: tool.id, name: tool.name, icon: tool.icon, url: tool.url, timestamp: Date.now() });
      recent = recent.slice(0, 10);
      wx.setStorageSync('recentTools', recent);
      this.loadRecentTools();
    } catch (error) {
      console.error('保存最近使用工具失败:', error);
    }
  },

  // 加载最近使用
  loadRecentTools() {
    try {
      const recent = wx.getStorageSync('recentTools') || [];
      const toolsMap = this.data.allTools.reduce((acc, tool) => { acc[tool.id] = tool; return acc; }, {});
      const validRecent = recent.filter(item => toolsMap[item.id]).slice(0, 5).map(item => toolsMap[item.id]);
      this.setData({ recentTools: validRecent });
    } catch (error) {
      console.error('加载最近使用工具失败:', error);
    }
  },

  // 清空最近使用
  clearRecentTools() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空最近使用记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('recentTools');
          this.setData({ recentTools: [] });
          utils.showSuccess('已清空');
        }
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '免费工具箱 - 精选实用工具集合',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '免费工具箱 - 精选实用工具集合',
      query: 'index'
    };
  }
});
