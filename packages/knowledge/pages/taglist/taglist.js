// packages/knowledge/pages/taglist/taglist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    tags: [],
    loading: true,
    error: false,
    errorMsg: ''
  },

  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '标签列表'
    });

    // 加载标签列表
    this.loadTags();
  },

  /**
   * 加载标签列表
   */
  async loadTags() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + 'tags.json';

    try {
      // 使用带缓存的请求
      const app = getApp();
      const res = await app.requestWithCache(url, {
        method: 'GET',
        timeout: 10000
      }, 7200); // 2小时缓存

      const tags = res.tags;

      this.setData({
        tags: tags,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载标签失败:', err);
      this.showError('网络错误，请检查连接');
    }
  },

  /**
   * 点击标签跳转到标签文章列表
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?tag=${tag}`
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
  }
});