// packages/knowledge/pages/categorylist/categorylist.js

const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_KEY_CATEGORY_TREE = 'cdn_know_category_tree';
const CACHE_KEY_CATEGORY_TREE_TS = 'cdn_know_category_tree_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

Page({
  data: {
    categories: [],
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0
  },

  getLeafCategoryName(category) {
    if (!category) return '未分类';

    const parts = String(category).split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : category;
  },

  flattenCategories(node, list = []) {
    Object.values((node && node.children) || {}).forEach(category => {
      list.push({
        name: category.path,
        label: category.name || this.getLeafCategoryName(category.path),
        count: category.count
      });
      this.flattenCategories(category, list);
    });
    return list;
  },


  /**
   * 带缓存的请求（内存 → Storage → CDN，支持 304 + LRU）
   */
  fetchWithCache(cacheKey, tsKey, url) {
    return cacheManager.fetchWithCache({
      cacheKey,
      tsKey,
      url,
      ttl: CACHE_EXPIRE
    });
  },

  onLoad() {

    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180;
    this.setData({ scrollHeight });

    wx.setNavigationBarTitle({
      title: '分类列表'
    });

    // 设置分享按钮
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.loadCategories();
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '知识库分类列表',
      path: '/pages/categorylist/categorylist'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '知识库分类列表'
    };
  },

  async loadCategories() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    try {
      const res = await this.fetchWithCache(
        CACHE_KEY_CATEGORY_TREE,
        CACHE_KEY_CATEGORY_TREE_TS,
        CDN_BASE + 'category-tree.json'
      );
      const categoryList = this.flattenCategories(res)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));


      this.setData({
        categories: categoryList,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载分类失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },


  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.switchTab({
      url: '/pages/knowledgelist/knowledgelist',
      success: () => {
        // switchTab 不支持传参，跳转后通过全局变量告知 knowledgelist 筛选
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.pendingCategory = category;
        app.globalData.pendingTag = '';
      }
    });
  },

  showError(message) {
    this.setData({
      error: true,
      errorMsg: message,
      loading: false
    });

    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  onShow() {},

  onPullDownRefresh() {
    this.onRefresh();
  },

  onRefresh() {
    // 只清知识库相关缓存
    cacheManager.clearCdnCache('know_');
    this.loadCategories();
  }
});

