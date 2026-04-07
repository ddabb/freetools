// packages/knowledge/pages/taglist/taglist.js

const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_KEY_TAGS = 'cdn_know_tags';
const CACHE_KEY_TAGS_TS = 'cdn_know_tags_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

Page({
  data: {
    tags: [],
    filteredTags: [],
    displayLimit: 60,
    displayTags: [],
    hasMore: false,
    searchKeyword: '',
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0
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
      title: '标签列表'
    });

    // 设置分享按钮
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.loadTags();
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '知识库标签列表',
      path: '/pages/taglist/taglist'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '知识库标签列表'
    };
  },

  async loadTags() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    try {
      const res = await this.fetchWithCache(
        CACHE_KEY_TAGS,
        CACHE_KEY_TAGS_TS,
        CDN_BASE + 'tags.json'
      );
      const tags = res.tags || [];
      this.setData({
        tags,
        filteredTags: tags,
        displayLimit: 60,
        displayTags: tags.slice(0, 60),
        hasMore: tags.length > 60,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载标签失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },


  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags(keyword);
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags(keyword);
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterTags('');
  },

  /**
   * 过滤标签
   */
  filterTags(keyword) {
    const { tags } = this.data;
    if (!keyword) {
      const displayTags = tags.slice(0, 60);
      this.setData({
        filteredTags: tags,
        displayTags,
        displayLimit: 60,
        hasMore: tags.length > 60
      });
      return;
    }

    const filtered = tags.filter(tag =>
      tag.name.toLowerCase().includes(keyword.toLowerCase())
    );
    const displayTags = filtered.slice(0, 60);
    this.setData({
      filteredTags: filtered,
      displayTags,
      displayLimit: 60,
      hasMore: filtered.length > 60
    });
  },

  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.switchTab({
      url: '/pages/knowledgelist/knowledgelist',
      success: () => {
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.pendingTag = tag;
        app.globalData.pendingCategory = '';
      }
    });
  },

  /**
   * 加载更多标签
   */
  loadMore() {
    const { displayLimit, filteredTags } = this.data;
    if (displayLimit >= filteredTags.length) return;
    const newLimit = displayLimit + 60;
    this.setData({
      displayLimit: newLimit,
      displayTags: filteredTags.slice(0, newLimit),
      hasMore: newLimit < filteredTags.length
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
    this.loadTags();
  }
});

