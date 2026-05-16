// index.js
const tools = require('../../config/tools.js');
const utils = require('../../utils/index');

// 分类排序：置顶的排前面
const sortedCategories = [...tools.categories].sort((a, b) => {
  if (a.pinned && !b.pinned) return -1;
  if (!a.pinned && b.pinned) return 1;
  return 0;
});

// 为工具补上 _categoryClass（WXS 层用于样式，不依赖对象引用）
const makeToolItem = (tool) => ({
  ...tool,
  _categoryClass: (tool.categories && tool.categories[0])
    ? tool.categories[0].replace(/[^\w]/g, '')
    : 'text'
});

const commonToolsWithCategory = tools.commonTools.map(makeToolItem);

// 同步加载全部工具（WXS 层过滤数据源，require 有缓存只执行一次）
const allToolsWithCategory = tools.getAllTools().map(makeToolItem);

Page({
  data: {
    categories: sortedCategories,
    activeCategory: '常用工具',
    commonTools: commonToolsWithCategory,
    allTools: allToolsWithCategory,       // WXS 层过滤数据源
    toolFrequency: tools.toolFrequency,    // WXS 排序用
    searchText: '',
    showSearchResult: false,
    recentTools: [],
    loading: false
  },

  onLoad() {
    // 预建 Map（用于 recentTools 验证、navigateToTool 查找）
    this._toolsMap = {};
    this._urlMap = {};
    allToolsWithCategory.forEach(t => {
      this._toolsMap[t.id] = t;
      this._urlMap[t.url] = t;
    });

    this.loadRecentTools();
    wx.showShareMenu({ withShareTicket: true });
  },

  /**
   * 分类切换 — 仅更新状态，WXS 层自动过滤
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    if (category === this.data.activeCategory) return;
    this.setData({
      activeCategory: category,
      searchText: '',
      showSearchResult: false
    });
  },

  /**
   * 搜索输入 — 仅更新状态，WXS 层自动过滤
   */
  onSearchInput(e) {
    const searchText = (e.detail.value || '').trim();
    this.setData({
      searchText,
      showSearchResult: !!searchText
    });
  },

  onClearSearch() {
    this.setData({ searchText: '', showSearchResult: false });
  },

  onSearchConfirm(e) {
    const searchText = (e.detail.value || '').trim().toLowerCase();
    this.setData({
      searchText,
      showSearchResult: !!searchText
    });
  },

  /**
   * 跳转工具页面
   * 优先用 dataset 中的 id/url，回退到 data 传递的 url
   */
  navigateToTool(e) {
    let tool = null;
    let url = null;

    if (e.detail && e.detail.url) {
      // tool-card 组件透传
      url = e.detail.url;
      tool = this._urlMap[url];
    } else if (e.currentTarget && e.currentTarget.dataset) {
      const { id, url: datasetUrl } = e.currentTarget.dataset;
      if (datasetUrl) {
        url = datasetUrl;
        tool = this._urlMap[url];
      } else if (id) {
        tool = this._toolsMap[id];
        if (tool) url = tool.url;
      }
    }

    if (!tool || !url) return;
    this.addToRecentTools(tool);
    wx.navigateTo({ url, fail: () => utils.showText('页面开发中') });
  },

  addToRecentTools(tool) {
    try {
      let recent = wx.getStorageSync('recentTools') || [];
      recent = recent.filter(item => item.id !== tool.id);
      recent.unshift({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        url: tool.url,
        timestamp: Date.now()
      });
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
  },

  // 广告事件
  onAdError(err) {
    console.warn('[广告] 首页banner错误:', err.detail.errCode, err.detail.errMsg);
  },
  onAdClose() {
    console.log('[广告] 首页banner关闭');
  }
});
