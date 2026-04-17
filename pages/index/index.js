// index.js
const tools = require('../../config/tools.js');
const utils = require('../../utils/index');

// 分类排序：置顶的排前面
const sortedCategories = [...tools.categories].sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return 0;
});

// 预计算 _categoryClass（同步加载，commonTools 体积小）
const commonToolsWithCategory = tools.commonTools.map(tool => ({
  ...tool,
  _categoryClass: (tool.categories && tool.categories[0])
    ? tool.categories[0].replace(/[^\w]/g, '')
    : 'text'
}));

Page({
  data: {
    categories: sortedCategories,
    activeCategory: '常用工具',
    commonTools: commonToolsWithCategory,
    currentCategoryTools: [],  // 分类工具列表
    searchText: '',
    showSearchResult: false,
    filteredTools: [],  // 搜索结果
    recentTools: [],
    loading: false
  },

  onLoad() {
    // 首页只渲染 commonTools，allTools 在后台异步加载
    // 不阻塞 UI，首屏渲染更快
    this._allTools = null;   // 懒加载，搜索时才填充

    // 预计算 _categoryClass（供搜索结果用）
    this._toolsMap = {};
    this._urlMap = {};
    this._toolFrequency = tools.toolFrequency;

    this.loadRecentTools();
    wx.showShareMenu({ withShareTicket: true });

    // 后台预加载 allTools（不阻塞首屏）
    setTimeout(() => {
      this._loadAllTools();
    }, 100);
  },

  /**
   * 后台懒加载全部工具（供搜索使用）
   * commonTools 已满足首页渲染，allTools 仅搜索时需要
   */
  _loadAllTools() {
    try {
      const allTools = tools.getAllTools();
      this._allTools = allTools.map(tool => ({
        ...tool,
        _categoryClass: (tool.categories && tool.categories[0])
          ? tool.categories[0].replace(/[^\w]/g, '')
          : 'text'
      }));
      this._allTools.forEach(t => {
        this._toolsMap[t.id] = t;
        this._urlMap[t.url] = t;
      });
      // 重新刷新最近使用（此时能识别全部工具 ID）
      this.loadRecentTools();
      console.debug('全部工具已加载', { total: this._allTools.length });
    } catch (err) {
      console.error('allTools 加载失败', err);
    }
  },

  /**
   * 获取当前搜索数据源
   * - 未加载完：先用 commonTools（搜索范围受限，但不会卡）
   * - 已加载完：用 allTools（完整搜索）
   */
  _getSearchSource() {
    return this._allTools || tools.commonTools;
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    if (category === this.data.activeCategory) return;
    
    // 计算当前分类的工具
    let categoryTools = [];
    if (category !== '常用工具') {
      // 使用懒加载的 getToolsByCategory 方法
      try {
        const allTools = this._allTools || tools.getAllTools();
        categoryTools = allTools
          .filter(tool => {
            if (!tool.categories) return false;
            return tool.categories.some(cat => cat === category || cat.includes(category) || category.includes(cat));
          })
          .map(tool => ({
            ...tool,
            _categoryClass: (tool.categories && tool.categories[0])
              ? tool.categories[0].replace(/[^\w]/g, '')
              : 'text'
          }));
      } catch (err) {
        console.error('获取分类工具失败', err);
      }
    }
    
    this.setData({
      activeCategory: category,
      searchText: '',
      showSearchResult: false,
      currentCategoryTools: categoryTools
    });
  },

  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) {
      this.setData({ searchText: '', showSearchResult: false, filteredTools: [] });
      return;
    }
    
    // 执行搜索
    let results = [];
    try {
      const searchSource = this._allTools || tools.getAllTools();
      // 使用 keywords 搜索
      results = searchSource.filter(tool => {
        if (!tool) return false;
        const nameMatch = tool.name && tool.name.toLowerCase().includes(searchText);
        const descMatch = tool.description && tool.description.toLowerCase().includes(searchText);
        const keywordsMatch = tool.keywords && tool.keywords.some(k => 
          k && k.toLowerCase().includes(searchText)
        );
        return nameMatch || keywordsMatch || descMatch;
      });
    } catch (err) {
      console.error('搜索失败', err);
    }
    
    this.setData({ 
      searchText, 
      showSearchResult: true,
      filteredTools: results
    });
  },

  onClearSearch() {
    this.setData({ searchText: '', showSearchResult: false, filteredTools: [] });
  },

  onSearchConfirm(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    if (!searchText) return;
    
    // 执行搜索
    let results = [];
    try {
      const searchSource = this._allTools || tools.getAllTools();
      results = searchSource.filter(tool => {
        if (!tool) return false;
        const nameMatch = tool.name && tool.name.toLowerCase().includes(searchText);
        const descMatch = tool.description && tool.description.toLowerCase().includes(searchText);
        const keywordsMatch = tool.keywords && tool.keywords.some(k => 
          k && k.toLowerCase().includes(searchText)
        );
        return nameMatch || keywordsMatch || descMatch;
      });
    } catch (err) {
      console.error('搜索失败', err);
    }
    
    this.setData({ 
      searchText, 
      showSearchResult: true,
      filteredTools: results
    });
  },

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
    if (!tool) {
      tool = this._toolsMap[e.currentTarget.dataset.id];
      if (tool) url = tool.url;
    }
    if (!tool || !url) return;
    this.addToRecentTools(tool);
    wx.navigateTo({ url, fail: () => utils.showText('页面开发中') });
  },

  addToRecentTools(tool) {
    try {
      let recent = wx.getStorageSync('recentTools') || [];
      recent = recent.filter(item => item.id !== tool.id);
      recent.unshift({ id: tool.id, name: tool.name, icon: tool.icon, url: tool.url, timestamp: Date.now() });
      recent = recent.slice(0, 10);
      wx.setStorageSync('recentTools', recent);
      this.loadRecentTools();
    } catch (err) {
      console.error('保存最近使用工具失败', err);
    }
  },

  loadRecentTools() {
    try {
      const recent = wx.getStorageSync('recentTools') || [];
      const validRecent = recent
        .filter(item => this._toolsMap[item.id])
        .slice(0, 5)
        .map(item => this._toolsMap[item.id]);
      this.setData({ recentTools: validRecent });
    } catch (err) {
      console.error('加载最近使用工具失败', err);
    }
  },

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

  onShareAppMessage() {
    return { title: '免费工具箱 - 精选实用工具集合', path: '/pages/index/index' };
  },

  onShareTimeline() {
    return { title: '免费工具箱 - 精选实用工具集合', query: 'index' };
  }
});
