const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

const CACHE_KEY_ARTICLES = 'cdn_know_articles';
const CACHE_KEY_ARTICLES_TS = 'cdn_know_articles_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

Page({
  data: {
    tagName: '',
    articles: [],
    loading: true,
    error: false,
    errorMsg: '',
    isOver: false,
    page: 1,
    pageSize: 20
  },

  onLoad(options) {
    if (options.tag) {
      this.setData({ tagName: decodeURIComponent(options.tag) });
      wx.setNavigationBarTitle({
        title: this.data.tagName + ' - 标签详情'
      });
      this.loadArticles();
    }
  },

  fetchWithCache(cacheKey, tsKey, url) {
    return cacheManager.fetchWithCache({
      cacheKey,
      tsKey,
      url,
      ttl: CACHE_EXPIRE
    });
  },

  goToTagList() {
    wx.navigateTo({ url: '/pages/taglist/taglist' });
  },

  async loadArticles(isLoadMore = false) {
    if (!isLoadMore) {
      this.setData({
        loading: true,
        error: false,
        errorMsg: ''
      });
    }

    try {
      const res = await this.fetchWithCache(
        CACHE_KEY_ARTICLES,
        CACHE_KEY_ARTICLES_TS,
        CDN_BASE + 'articles.json'
      );

      const articles = res.articles || [];
      const filteredArticles = articles.filter(article => 
        article.tags && article.tags.includes(this.data.tagName)
      );

      // 按更新时间排序
      filteredArticles.sort((a, b) => {
        const dateA = a.updateTime ? new Date(a.updateTime).getTime() : 0;
        const dateB = b.updateTime ? new Date(b.updateTime).getTime() : 0;
        return dateB - dateA;
      });

      // 添加序号
      const articlesWithOrder = filteredArticles.map((article, index) => ({
        ...article,
        order: index + 1
      }));

      this.setData({
        articles: articlesWithOrder,
        loading: false,
        error: false,
        isOver: true
      });
    } catch (err) {
      console.error('加载文章失败:', err);
      this.setData({
        error: true,
        errorMsg: '网络错误，请检查连接',
        loading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  onArticleTap(e) {
    const { filename } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledgedetail/knowledgedetail?filename=${filename}`
    });
  },

  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/tagdetail/tagdetail?tag=${tag}`
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadArticles().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.isOver) {
      this.setData({ page: this.data.page + 1 });
      this.loadArticles(true);
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.tagName + ' - 标签详情',
      path: `/pages/tagdetail/tagdetail?tag=${this.data.tagName}`
    };
  },

  onShareTimeline() {
    return {
      title: this.data.tagName + ' - 标签详情'
    };
  }
});
