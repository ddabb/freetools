// packages/knowledge/pages/knowledgedetail/knowledgedetail.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    filename: '',
    article: null,
    loading: true,
    error: false,
    errorMsg: ''
  },

  onLoad(options) {
    if (options.filename) {
      this.loadDetail(options.filename);
    } else {
      this.setData({
        error: true,
        errorMsg: '文章不存在',
        loading: false
      });
    }
  },

  /**
   * 从 CDN 加载文章详情
   */
  async loadDetail(filename) {
    // 如果没有传入 filename，从 data 中获取
    const targetFilename = filename || this.data.filename;
    if (!targetFilename) {
      this.showError('文章不存在');
      return;
    }

    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + `detail/${targetFilename}`;

    try {
      // 使用带缓存的请求
      const app = getApp();
      const article = await app.requestWithCache(url, {
        method: 'GET',
        timeout: 10000
      }, 7200); // 2小时缓存

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: article.title || '文章详情'
      });

      this.setData({
        filename: targetFilename,
        article,
        loading: false,
        error: false
      });

      // 记录分享ID
      wx.setStorageSync('shareId', targetFilename);
    } catch (err) {
      console.error('加载文章详情失败:', err);
      this.showError('网络错误，请检查连接');
    }
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

  /**
   * 点击标签跳转到标签页
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?tag=${tag}`
    });
  },

  /**
   * 点击分类跳转到分类页
   */
  onCategoryTap() {
    const { category } = this.data.article;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${category}`
    });
  },

  /**
   * 分享文章
   */
  onShareAppMessage() {
    const { article, filename } = this.data;
    return {
      title: article.title,
      path: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?filename=${filename}`,
      imageUrl: '../../images/share.png'
    };
  },

  onShow() {
    // 页面显示时的处理
  }
});
