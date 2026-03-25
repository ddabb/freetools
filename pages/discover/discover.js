// pages/discover/discover.js
// 完全独立的发现页逻辑，不依赖首页组件

const { tools, categories } = require('../../config/tools.js');

Page({
  data: {
    // 分类状态
    activeCategory: '',
    
    // 搜索状态
    showSearch: false,
    searchText: '',
    searchResults: [],
    
    // 工具列表
    hotTools: [],
    categoryTools: [],
    allTools: [],
  },

  onLoad(options) {
    // 显示分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 处理分类参数
    if (options.category) {
      this.setData({ activeCategory: options.category });
    }
    
    // 加载工具数据
    this.loadTools();
  },

  onShow() {
    // 每次显示时刷新
  },

  // 加载工具数据
  loadTools() {
    // 为每个工具添加颜色索引
    const allTools = tools.map((tool, index) => ({
      ...tool,
      colorIndex: index % 10
    }));
    
    // 热门工具（取前6个）
    const hotTools = allTools.slice(0, 6);
    
    // 分类工具
    const categoryTools = this.filterToolsByCategory(this.data.activeCategory);
    
    this.setData({
      hotTools: hotTools,
      allTools: allTools,
      categoryTools: categoryTools
    });
  },

  // 根据分类过滤工具
  filterToolsByCategory(category) {
    if (!category || category === '常用工具') {
      return this.data.allTools;
    }
    
    // 分类映射
    const categoryKeywords = {
      '文字工具': ['文字', 'text', '文案', 'emoji', 'markdown'],
      '生活工具': ['生活', 'life', '文案', '图片'],
      '数学工具': ['数学', 'math', 'sudoku', '数独'],
      '开发工具': ['开发', 'dev', 'code'],
      '财务工具': ['财务', 'money', 'finance'],
      '健康工具': ['健康', 'health'],
      '学习工具': ['学习', 'study', 'education'],
    };
    
    const keywords = categoryKeywords[category] || [];
    
    if (keywords.length === 0) {
      return this.data.allTools;
    }
    
    return this.data.allTools.filter(tool => {
      const searchText = (tool.name + ' ' + (tool.description || '') + ' ' + (tool.keywords || []).join(' ')).toLowerCase();
      return keywords.some(kw => searchText.includes(kw.toLowerCase()));
    });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    
    const categoryTools = this.filterToolsByCategory(category);
    this.setData({ categoryTools: categoryTools });
  },

  // 切换搜索面板
  toggleSearch() {
    this.setData({ showSearch: true });
  },

  // 关闭搜索
  closeSearch() {
    this.setData({ 
      showSearch: false, 
      searchText: '', 
      searchResults: [] 
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    
    if (!searchText) {
      this.setData({ searchText: '', searchResults: [] });
      return;
    }
    
    this.setData({ searchText: searchText });
    
    // 搜索工具
    const results = this.data.allTools.filter(tool => {
      return (
        tool.name.toLowerCase().includes(searchText) ||
        (tool.description && tool.description.toLowerCase().includes(searchText)) ||
        (tool.keywords && tool.keywords.some(k => k.toLowerCase().includes(searchText)))
      );
    });
    
    this.setData({ searchResults: results });
  },

  // 搜索确认
  onSearchConfirm(e) {
    this.onSearchInput(e);
  },

  // 导航到工具
  navigateToTool(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
      fail: () => {
        wx.showToast({ title: '页面开发中', icon: 'none' });
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '实用工具箱 - 发现更多有趣工具',
      path: '/pages/discover/discover'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '实用工具箱 - 发现更多有趣工具',
      query: 'discover'
    };
  }
});
