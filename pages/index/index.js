// index.js
const { commonTools, categories, allTools, toolFrequency, searchTools } = require('../../config/tools.js');
const utils = require('../../utils/index');

// 分类排序：置顶的排前面
const sortedCategories = [...categories].sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return 0;
});

// 预计算每个工具的 category 样式名，避免 WXML 中调用 getToolCategory
const toolsWithCategory = commonTools.map(tool => ({
  ...tool,
  _categoryClass: (tool.categories && tool.categories[0]) ? tool.categories[0].replace(/[^\w]/g, '') : 'text'
}));
const allToolsWithCategory = allTools.map(tool => ({
  ...tool,
  _categoryClass: (tool.categories && tool.categories[0]) ? tool.categories[0].replace(/[^\w]/g, '') : 'text'
}));

Page({
  data: {
    // 分类和工具数据（置顶的排前面）
    categories: sortedCategories,
    activeCategory: '常用工具',
    commonTools: toolsWithCategory,
    _allTools: allToolsWithCategory,

    // 搜索
    searchText: '',
    showSearchResult: false,

    // 最近使用
    recentTools: [],

    // 加载状态
    loading: false
  },

  onLoad() {
    // 大数据量变量存为实例属性，不通过 setData 传递
    this._allTools = allToolsWithCategory;
    this._toolFrequency = toolFrequency;
    this._toolsMap = {};
    allToolsWithCategory.forEach(t => { this._toolsMap[t.id] = t; });
    this._urlMap = {};
    allToolsWithCategory.forEach(t => { this._urlMap[t.url] = t; });

    this.loadRecentTools();
    utils.showShareMenu({ withShareTicket: true });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    if (category === this.data.activeCategory) return;

    this.setData({
      activeCategory: category,
      searchText: '',
      showSearchResult: false
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) {
      this.setData({ searchText: '', showSearchResult: false });
      return;
    }

    this.setData({
      searchText,
      showSearchResult: true
    });
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchText: '', showSearchResult: false });
  },

  // 搜索确认
  onSearchConfirm(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) return;

    this.setData({ 
      searchText,
      showSearchResult: true 
    });
  },

  // 导航到工具
  navigateToTool(e) {
    let tool = null;
    let url = null;

    if (e.detail && e.detail.url) {
      url = e.detail.url;
      tool = this._urlMap[url];
    } else if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.url) {
      url = e.currentTarget.dataset.url;
      tool = this._urlMap[url];
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
      const validRecent = recent.filter(item => this._toolsMap[item.id]).slice(0, 5).map(item => this._toolsMap[item.id]);
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
