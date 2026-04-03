// packages/knowledge/pages/knowledgelist/knowledgelist.js
const knowledgeCategory = require('../../../utils/knowledgeCategory');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';


Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    currentCategory: '',
    currentTag: '',
    categories: [],

    categoryStats: {},
    categoryTree: null,
    categoryTreeNodes: [],

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

  normalizeCategoryValue(category) {
    return typeof category === 'string' ? category.trim() : '';
  },

  hasActiveFilters() {
    return !!(this.data.currentCategory || this.data.currentTag || this.data.searchKeyword);
  },

  buildCategoryLeafLookup(categoryTree) {
    const lookup = {};

    const walk = (node) => {
      if (!node) return [];

      const path = this.normalizeCategoryValue(node.path || '');
      const children = node.children || {};
      const childNodes = Object.values(children);
      let leafNames = [];

      if (childNodes.length === 0) {
        const leafName = this.getLeafCategoryName(path || node.name || '');
        leafNames = leafName ? [leafName] : [];
      } else {
        childNodes.forEach(child => {
          leafNames = leafNames.concat(walk(child));
        });
      }

      const uniqueLeafNames = Array.from(new Set(leafNames.filter(Boolean)));
      if (path) {
        lookup[path] = uniqueLeafNames;
      }
      return uniqueLeafNames;
    };

    walk(categoryTree || { children: {} });
    return lookup;
  },

  buildRenderableCategoryTree(categoryTree) {
    const walk = (children = {}) => {
      return Object.values(children).map(node => {
        const childNodes = walk(node.children || {});
        return {
          name: node.name,
          path: node.path,
          count: node.count,
          hasChildren: childNodes.length > 0,
          icon: childNodes.length > 0 ? '📁' : '·',
          children: childNodes
        };
      });
    };

    return walk((categoryTree && categoryTree.children) || {});
  },


  getLeafCategoryName(category) {

    return knowledgeCategory.getLeafCategoryName(category);
  },

  decorateArticle(article) {
    if (!article) return article;

    const displayCategory = this.getLeafCategoryName(article.category);
    const categoryMeta = knowledgeCategory.getCategoryMeta(displayCategory);

    return {
      ...article,
      displayCategory,
      categoryClass: categoryMeta.className
    };
  },


  setPageTitle(category = this.data.currentCategory, tag = this.data.currentTag) {
    const displayCategory = category ? this.getLeafCategoryName(category) : '';
    const title = displayCategory ? `${displayCategory}` : (tag ? `标签: ${tag}` : '知识库');
    wx.setNavigationBarTitle({ title });
  },


  isCategoryMatch(articleCategory, currentCategory) {
    const normalizedCurrentCategory = this.normalizeCategoryValue(currentCategory);
    const normalizedArticleCategory = this.normalizeCategoryValue(articleCategory);

    if (!normalizedCurrentCategory) return true;
    if (!normalizedArticleCategory) return false;

    if (
      normalizedArticleCategory === normalizedCurrentCategory ||
      normalizedArticleCategory.indexOf(`${normalizedCurrentCategory}/`) === 0
    ) {
      return true;
    }

    if (!normalizedArticleCategory.includes('/')) {
      const currentLeafCategory = this.getLeafCategoryName(normalizedCurrentCategory);
      if (normalizedArticleCategory === currentLeafCategory) {
        return true;
      }

      const descendantLeafCategories = (this.categoryLeafLookup && this.categoryLeafLookup[normalizedCurrentCategory]) || [];
      return descendantLeafCategories.includes(normalizedArticleCategory);
    }

    return false;
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
      currentTag: tag || '',
      searchKeyword: ''
    });

    this.setPageTitle(category || '', tag || '');
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

      const articles = (articlesData.articles || []).map(article => this.decorateArticle(article));
      const taxonomy = articlesData.taxonomy || {};

      const categoryTree = categoryTreeData || { children: {} };
      const searchIndex = searchIndexData || [];

      const categoryStats = {
        '': articles.length,
        '全部': articles.length,
        ...this.buildCategoryStatsFromTree(categoryTree)
      };

      this.categoryLeafLookup = this.buildCategoryLeafLookup(categoryTree);
      const categories = this.buildTopCategories(categoryTree);
      const categoryTreeNodes = this.buildRenderableCategoryTree(categoryTree);

      this.setData({

        allArticles: articles,
        taxonomy,
        categoryTree,
        categoryTreeNodes,
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

      const decoratedItems = (pageData.items || []).map(article => this.decorateArticle(article));

      let list = this.data.list;
      if (this.data.page === 1) {
        list = decoratedItems;
      } else {
        list = list.concat(decoratedItems);
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
    const { allArticles, currentCategory, currentTag, searchKeyword, searchIndex } = this.data;
    let filteredArticles = Array.isArray(allArticles) ? [...allArticles] : [];

    console.log('应用筛选和排序:', {
      originalCount: filteredArticles.length,
      currentCategory,
      currentTag,
      searchKeyword
    });

    if (currentCategory) {
      const beforeCategoryCount = filteredArticles.length;
      filteredArticles = filteredArticles.filter(article => this.isCategoryMatch(article.category, currentCategory));
      console.log(`分类筛选: ${currentCategory}, 从 ${beforeCategoryCount} 筛选到 ${filteredArticles.length}`);
    }

    if (currentTag) {
      const beforeTagCount = filteredArticles.length;
      const normalizedTag = currentTag.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        Array.isArray(article.tags) && article.tags.some(tag => (tag || '').toLowerCase() === normalizedTag)
      );
      console.log(`标签筛选: ${currentTag}, 从 ${beforeTagCount} 筛选到 ${filteredArticles.length}`);
    }

    if (searchKeyword) {
      const beforeSearchCount = filteredArticles.length;
      const keyword = searchKeyword.toLowerCase().trim();

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
      currentTag: '',
      showCategoryTree: false
    });
    this.setPageTitle('', '');
    this.refreshView();
  },


  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category || '';
    if (this.data.currentCategory === category && !this.data.currentTag) {
      this.setData({ showCategoryTree: false });
      return;
    }

    this.setData({
      currentCategory: category,
      currentTag: '',
      searchKeyword: '',
      showCategoryTree: false
    });

    this.setPageTitle(category, '');
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
    this.setData({
      currentTag: tag || '',
      searchKeyword: ''
    });
    this.setPageTitle(this.data.currentCategory, tag || '');
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
    return knowledgeCategory.getCategoryClass(category);
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
    const { currentCategory, currentTag, searchKeyword, totalCount } = this.data;
    const tag = currentTag || '';
    const displayCategory = currentCategory ? this.getLeafCategoryName(currentCategory) : '';
    let title = '随身百科-答疑小助手';

    if (displayCategory) {
      title = `${displayCategory} - 随身百科`;
    } else if (currentTag) {
      title = `标签: ${currentTag}`;
    } else if (searchKeyword) {
      title = `搜索"${searchKeyword}"结果`;
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
    const displayCategory = currentCategory ? this.getLeafCategoryName(currentCategory) : '';
    const title = displayCategory
      ? `${displayCategory} - 随身百科`
      : `随身百科 - 共 ${totalCount} 篇知识`;

    return {
      title,
      query: `category=${encodeURIComponent(currentCategory)}`
    };
  }

});
