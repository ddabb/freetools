const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

const CACHE_KEY_ARTICLES = 'cdn_know_articles';
const CACHE_KEY_ARTICLES_TS = 'cdn_know_articles_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

Page({
  data: {
    categoryName: '',
    articles: [],
    loading: true,
    error: false,
    errorMsg: '',
    isOver: false,
    page: 1,
    pageSize: 20
  },

  onLoad(options) {
    if (options.category) {
      this.setData({ categoryName: options.category });
      const displayName = options.category.split('/').pop() || options.category;
      wx.setNavigationBarTitle({
        title: displayName + ' - 分类详情'
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

  getLeafCategoryName(category) {
    if (!category) return '未分类';
    const parts = String(category).split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : category;
  },

  goToCategoryList() {
    wx.navigateTo({ url: '/pages/categorylist/categorylist' });
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
      const categoryName = this.data.categoryName;
      
      // 改进过滤逻辑，处理多层分类
      const filteredArticles = articles.filter(article => {
        if (!article.category) return false;
        // 匹配精确分类或子分类（确保只匹配完整的路径段）
        return article.category === categoryName || 
               article.category.startsWith(categoryName + '/');
      });

      // 按更新时间排序
      filteredArticles.sort((a, b) => {
        const dateA = a.updateTime ? new Date(a.updateTime).getTime() : 0;
        const dateB = b.updateTime ? new Date(b.updateTime).getTime() : 0;
        return dateB - dateA;
      });

      // 添加序号和显示分类
      const articlesWithOrder = filteredArticles.map((article, index) => {
        const categoryParts = article.category.split('/').filter(Boolean);
        let displayCategory = article.category;
        
        // 如果分类路径较长，只显示最后两级，以便区分不同项目下的同名子文件夹
        if (categoryParts.length > 2) {
          displayCategory = categoryParts.slice(-2).join('/');
        } else if (categoryParts.length > 1) {
          displayCategory = categoryParts.join('/');
        }
        
        return {
          ...article,
          order: index + 1,
          displayCategory: displayCategory
        };
      });

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
    const displayName = this.data.categoryName.split('/').pop() || this.data.categoryName;
    return {
      title: displayName + ' - 分类详情',
      path: `/pages/categorydetail/categorydetail?category=${this.data.categoryName}`
    };
  },

  onShareTimeline() {
    const displayName = this.data.categoryName.split('/').pop() || this.data.categoryName;
    return {
      title: displayName + ' - 分类详情'
    };
  }
});
