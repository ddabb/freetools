// packages/knowledge/pages/categorylist/categorylist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    categories: [],
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180;
    this.setData({ scrollHeight });

    wx.setNavigationBarTitle({
      title: '分类列表'
    });

    this.loadCategories();
  },

  async loadCategories() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + 'articles.json';

    try {
      const app = getApp();
      const res = await app.requestWithCache(url, {
        method: 'GET',
        timeout: 10000
      }, 7200);

      const categories = res.taxonomy.categories;
      const categoryList = Object.keys(categories).map(category => ({
        name: category,
        count: categories[category]
      })).sort((a, b) => b.count - a.count);

      this.setData({
        categories: categoryList,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载分类失败:', err);
      this.showError('网络错误，请检查连接');
    }
  },

  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${category}`
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
    wx.clearStorageSync();
    this.loadCategories();
    wx.stopPullDownRefresh();
  }
});
