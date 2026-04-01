// packages/knowledge/pages/knowledgelist/knowledgelist.js
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    currentCategory: '',
    categories: [],
    categoryStats: {},
    categoryTree: null,

    // 列表数据
    list: [],
    totalCount: 0,

    // 分页
    page: 1,
    pageSize: 20,
    isOver: false,
    loading: false,
    refreshing: false,

    // UI
    scrollHeight: 0,
    showCategoryTree: false,

    // 原始数据
    allArticles: [],
    taxonomy: null,
    searchIndex: null
  },

  safeDecode(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  },

  hasActiveFilters() {
    return !!(this.data.currentCategory || this.data.searchKeyword);
  },

  isCategoryMatch(articleCategory, currentCategory) {
    if (!currentCategory) return true;
    if (!articleCategory) return false;
    return articleCategory === currentCategory || articleCategory.startsWith(`${currentCategory}/`);
  },

  buildCategoryStatsFromTree(categoryTree, stats = {}) {
    const children = (categoryTree && categoryTree.children) || {};
    Object.values(children).forEach(node => {
      stats[node.path] = node.count;
      this.buildCategoryStatsFromTree(node, stats);
    });
    return stats;
  },

  buildTopCategories(categoryTree) {
    return Object.values((categoryTree && categoryTree.children) || {})
      .map(node => ({
        name: node.path,
        label: node.name,
        count: node.count
      }))
      .sort((a, b) => b.count - a.count);
  },

  refreshView() {
    this.setData({ page: 1, list: [] });
    if (this.hasActiveFilters()) {
      this.applyFiltersAndSort();
    } else {
      this.loadPageData();
    }
  },

  onLoad(options) {
    const category = this.safeDecode((options || {}).category);
    const tag = this.safeDecode((options || {}).tag);

    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180;

    this.setData({
      scrollHeight,
      currentCategory: category || '',
      searchKeyword: tag ? `#${tag}` : ''
    });

    const title = category ? `${category}` : (tag ? `标签: ${tag}` : '知识库');
    wx.setNavigationBarTitle({ title });

    this.loadArticles();
  },

  onShow() {
    // 页面显示时可以刷新
  },

  onPullDownRefresh() {
    console.log('下拉刷新触发:', {
      timestamp: new Date().toISOString(),
      currentCategory: this.data.currentCategory,
      searchKeyword: this.data.searchKeyword,
      refreshing: this.data.refreshing
    });
    this.onRefresh();
  },

  /**
   * 加载文章列表
   */
  loadArticles() {
    if (this.data.loading) {
      console.log('正在加载中，跳过请求');
      return;
    }

    console.log('开始加载文章列表:', {
      timestamp: new Date().toISOString(),
      refreshing: this.data.refreshing,
      page: this.data.page
    });

    this.setData({ loading: true });

    if (this.data.refreshing || !this.data.taxonomy) {
      this.loadMetadata();
    } else {
      this.loadPageData();
    }
  },

  /**
   * 加载元数据（分类树、标签等）
   */
  loadMetadata() {
    const categoryTreeUrl = CDN_BASE + 'category-tree.json';
    const articlesUrl = CDN_BASE + 'articles.json';
    const searchIndexUrl = CDN_BASE + 'search-index.json';

    Promise.all([
      this.requestData(categoryTreeUrl),
      this.requestData(articlesUrl),
      this.requestData(searchIndexUrl)
    ]).then(([categoryTreeData, articlesData, searchIndexData]) => {
      console.log('元数据加载成功');

      const articles = articlesData.articles || [];
      const taxonomy = articlesData.taxonomy || {};
      const categoryTree = categoryTreeData || { children: {} };
      const searchIndex = searchIndexData || [];

      const categoryStats = {
        '': articles.length,
        '全部': articles.length,
        ...this.buildCategoryStatsFromTree(categoryTree)
      };

      const categories = this.buildTopCategories(categoryTree);

      this.setData({
        allArticles: articles,
        taxonomy,
        categoryTree,
        searchIndex,
        categories,
        categoryStats,
        page: 1,
        list: []
      });

      if (this.hasActiveFilters()) {
        this.applyFiltersAndSort();
      } else {
        this.loadPageData();
      }
    }).catch(err => {
      console.error('加载元数据失败:', err);
      this.showError('加载失败，请重试');
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载分页数据
   */
  loadPageData() {
    if (this.hasActiveFilters()) {
      this.applyFiltersAndSort();
      return;
    }

    const pageUrl = CDN_BASE + `page/page-${this.data.page}.json`;

    this.requestData(pageUrl).then(pageData => {
      console.log('分页数据加载成功:', {
        page: pageData.page,
        totalPages: pageData.totalPages,
        itemCount: pageData.items.length
      });

      let list = this.data.list;
      if (this.data.page === 1) {
        list = pageData.items;
      } else {
        list = list.concat(pageData.items);
      }

      this.setData({
        list,
        totalCount: pageData.totalItems,
        isOver: this.data.page >= pageData.totalPages,
        loading: false,
        refreshing: false
      });

      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载分页数据失败:', err);
      this.showError('加载失败，请重试');
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 通用请求方法
   */
  requestData(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: url + `?_t=${Date.now()}`,
        method: 'GET',
        timeout: 30000,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error('请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  /**
   * 应用筛选
   */
  applyFiltersAndSort() {
    const { allArticles, currentCategory, searchKeyword, searchIndex } = this.data;
    let filteredArticles = Array.isArray(allArticles) ? [...allArticles] : [];

    console.log('应用筛选和排序:', {
      originalCount: filteredArticles.length,
      currentCategory,
      searchKeyword
    });

    if (currentCategory) {
      const beforeCategoryCount = filteredArticles.length;
      filteredArticles = filteredArticles.filter(article => this.isCategoryMatch(article.category, currentCategory));
      console.log(`分类筛选: ${currentCategory}, 从 ${beforeCategoryCount} 筛选到 ${filteredArticles.length}`);
    }

    if (searchKeyword) {
      const beforeSearchCount = filteredArticles.length;
      const keyword = searchKeyword.toLowerCase().replace('#', '');

      if (Array.isArray(searchIndex) && searchIndex.length > 0) {
        const matchedFilenames = new Set();
        searchIndex.forEach(item => {
          if (
            item.title.toLowerCase().includes(keyword) ||
            (item.description && item.description.toLowerCase().includes(keyword)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(keyword))) ||
            (item.content && item.content.toLowerCase().includes(keyword))
          ) {
            matchedFilenames.add(item.filename);
          }
        });
        filteredArticles = filteredArticles.filter(article => matchedFilenames.has(article.filename));
      } else {
        filteredArticles = filteredArticles.filter(article =>
          article.title.toLowerCase().includes(keyword) ||
          (article.description && article.description.toLowerCase().includes(keyword)) ||
          (article.tags && article.tags.some(tag => tag.toLowerCase().includes(keyword)))
        );
      }

      console.log(`搜索筛选: "${searchKeyword}", 从 ${beforeSearchCount} 筛选到 ${filteredArticles.length}`);
    }

    this.setData({
      list: filteredArticles,
      totalCount: filteredArticles.length,
      isOver: true,
      loading: false,
      refreshing: false
    });

    wx.stopPullDownRefresh();
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.refreshView();
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.refreshView();
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.refreshView();
  },

  /**
   * 清除所有筛选
   */
  clearFilters() {
    this.setData({
      searchKeyword: '',
      currentCategory: '',
      showCategoryTree: false
    });
    wx.setNavigationBarTitle({ title: '知识库' });
    this.refreshView();
  },

  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category || '';
    if (this.data.currentCategory === category) {
      this.setData({ showCategoryTree: false });
      return;
    }

    this.setData({
      currentCategory: category,
      searchKeyword: '',
      showCategoryTree: false
    });

    const title = category ? `${category}` : '知识库';
    wx.setNavigationBarTitle({ title });

    this.refreshView();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    console.log('开始执行下拉刷新:', {
      timestamp: new Date().toISOString(),
      currentCategory: this.data.currentCategory,
      searchKeyword: this.data.searchKeyword
    });

    wx.clearStorageSync();
    console.log('缓存已清空');

    this.setData({ refreshing: true, page: 1, list: [] });
    console.log('设置 refreshing 状态为 true');

    this.loadArticles();
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.hasActiveFilters() || this.data.loading || this.data.isOver) {
      return;
    }

    this.setData({ page: this.data.page + 1 });
    this.loadArticles();
  },

  /**
   * 点击文章进入详情页
   */
  onArticleTap(e) {
    const { filename } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?filename=${encodeURIComponent(filename)}`
    });
  },

  /**
   * 标签点击
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ searchKeyword: `#${tag}` });
    this.refreshView();
  },

  /**
   * 分类点击
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    this.switchCategory({ currentTarget: { dataset: { category } } });
  },

  /**
   * 切换分类树显示
   */
  toggleCategoryTree() {
    this.setData({ showCategoryTree: !this.data.showCategoryTree });
  },

  /**
   * 获取分类英文类名
   */
  getCategoryClass(category) {
    const classMap = {
      '产品使用': 'category-product-usage',
      '产品设计': 'category-product-design',
      '产品思考': 'category-product-thinking',
      '开发实践': 'category-dev-practice',
      '开发者故事': 'category-dev-story',
      '项目管理': 'category-project-mgmt',
      'PMP认证': 'category-pmp',
      '敏捷管理': 'category-agile',
      '未分类': 'category-uncategorized'
    };
    return classMap[category] || 'category-uncategorized';
  },

  /**
   * 显示错误提示
   */
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 分享给好友
   */
  onShareAppMessage() {
    const { currentCategory, searchKeyword, totalCount } = this.data;
    const tag = searchKeyword.replace('#', '');
    let title = '随身百科-答疑小助手';

    if (currentCategory) {
      title = `${currentCategory} - 随身百科`;
    } else if (searchKeyword) {
      title = `搜索"${tag}"结果`;
    } else {
      title = `随身百科 - 共 ${totalCount} 篇知识`;
    }

    return {
      title,
      path: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${encodeURIComponent(currentCategory)}&tag=${encodeURIComponent(tag)}`
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { currentCategory, totalCount } = this.data;
    const title = currentCategory
      ? `${currentCategory} - 随身百科`
      : `随身百科 - 共 ${totalCount} 篇知识`;

    return {
      title,
      query: `category=${encodeURIComponent(currentCategory)}`
    };
  }
});
