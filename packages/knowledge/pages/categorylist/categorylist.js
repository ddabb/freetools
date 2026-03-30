// packages/knowledge/pages/categorylist/categorylist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    categories: [],
    loading: true,
    error: false,
    errorMsg: ''
  },

  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '分类列表'
    });

    // 加载分类列表
    this.loadCategories();
  },

  /**
   * 加载分类列表
   */
  async loadCategories() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + 'articles.json';

    try {
      // 使用带缓存的请求
      const app = getApp();
      const res = await app.requestWithCache(url, {
        method: 'GET',
        timeout: 10000
      }, 7200); // 2小时缓存

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

  /**
   * 点击分类跳转到分类文章列表
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${category}`
    });
  },

  /**
   * 显示错误提示
   */
  showError(message) {
    this.setData({
      error: true,
      errorMsg: message,
      loading: false
    });

    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    });
  },

  onShow() {
    // 页面显示时的处理
  },

  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    // 清空缓存
    wx.clearStorageSync();
    // 重新加载数据
    this.loadCategories();
    wx.stopPullDownRefresh();
  }
});