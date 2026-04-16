// packages/knowledge/pages/knowledgelist/knowledgelist.js
const knowledgeCategory = require('../../utils/knowledgeCategory');
const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天
const CACHE_KEY_META = 'cdn_know_meta';        // category-tree + taxonomy
const CACHE_KEY_META_TS = 'cdn_know_meta_ts';
const CACHE_KEY_ARTICLES = 'cdn_know_articles';
const CACHE_KEY_ARTICLES_TS = 'cdn_know_articles_ts';
const CACHE_KEY_SEARCH = 'cdn_know_search';
const CACHE_KEY_SEARCH_TS = 'cdn_know_search_ts';
const CACHE_KEY_PAGE = 'cdn_know_page_';       // 前缀 + 页码

// 内存缓存
let metaCache = null;
let articlesCache = null;
let searchCache = null;


Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    currentCategory: '',
    currentTag: '',
    categories: [],


    categoryTreeNodes: [],

    // 列表数据

    list: [],

    // 分页
    pageSize: 20,
    isOver: false,
    loading: false,
    refreshing: false,

    // UI
    scrollHeight: 0,
    showCategoryTree: false,
    categoryScrollLeft: 0,
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
      const nodes = Object.values(children).sort((a, b) => {
        const countDiff = (b.count || 0) - (a.count || 0);
        if (countDiff !== 0) return countDiff;
        return (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN');

      });

      return nodes.map(node => {
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
      categoryClass: categoryMeta.className,
      categoryGradient: knowledgeCategory.getCategoryGradient(categoryMeta.className)
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

  getDefaultCategory(categories = this.data.categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      return '';
    }
    return this.normalizeCategoryValue(categories[0].name);
  },

  refreshView() {

    this.page = 1;
    this.setData({ list: [] });
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

    this.page = 1;
    this.totalCount = 0;

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
    // 接收来自 categorylist / taglist 通过 globalData 传来的筛选参数
    const app = getApp();
    const gd = (app && app.globalData) || {};
    if (gd.pendingCategory !== undefined || gd.pendingTag !== undefined) {
      const category = gd.pendingCategory || '';
      const tag = gd.pendingTag || '';
      // 清除，避免重复触发
      app.globalData.pendingCategory = undefined;
      app.globalData.pendingTag = undefined;

      if (category !== this.data.currentCategory || tag !== this.data.currentTag) {
        this.setData({
          currentCategory: category,
          currentTag: tag,
          searchKeyword: '',
          list: []
        });
        this.page = 1;
        this.setPageTitle(category, tag);
        this.loadArticles();
      }
    }
  },

  onPullDownRefresh() {
    console.debug('下拉刷新触发:', {
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
      console.debug('正在加载中，跳过请求');
      return;
    }

    console.debug('开始加载文章列表:', {
      timestamp: new Date().toISOString(),
      refreshing: this.data.refreshing,
      page: this.page
    });

    this.setData({ loading: true });

    if (this.data.refreshing || !this.taxonomy) {
      this.loadMetadata();
    } else {
      this.loadPageData();
    }
  },

  /**
   * 加载元数据（分类树、标签等，带缓存）
   */
  loadMetadata() {
    const now = Date.now();

    // 构造元数据缓存 key（categoryTree + taxonomy 打包）
    const metaUrl = CDN_BASE + 'articles.json';

    // 1. 先尝试元数据缓存（categoryTree + taxonomy）
    const loadMeta = () => {
      const categoryTreeUrl = CDN_BASE + 'category-tree.json';
      return Promise.all([
        this.fetchWithCache(null, CACHE_KEY_META, CACHE_KEY_META_TS, categoryTreeUrl),
        this.fetchWithCache(null, CACHE_KEY_ARTICLES, CACHE_KEY_ARTICLES_TS, metaUrl),
        this.fetchWithCache(null, CACHE_KEY_SEARCH, CACHE_KEY_SEARCH_TS, CDN_BASE + 'search-index.json')
      ]);
    };

    loadMeta().then(([categoryTreeData, articlesData, searchIndexData]) => {
      console.debug('元数据加载成功');

      // 更新内存缓存引用
      metaCache = categoryTreeData;
      articlesCache = articlesData;
      searchCache = searchIndexData;

      const articles = (articlesData.articles || []).map(article => this.decorateArticle(article));
      const taxonomy = articlesData.taxonomy || {};

      const categoryTree = categoryTreeData || { children: {} };
      const searchIndex = searchIndexData || [];

      const categoryStats = this.buildCategoryStatsFromTree(categoryTree);

      this.categoryLeafLookup = this.buildCategoryLeafLookup(categoryTree);
      const categories = this.buildTopCategories(categoryTree);
      const categoryTreeNodes = this.buildRenderableCategoryTree(categoryTree);
      const shouldAutoSelectDefaultCategory = !this.data.currentCategory && !this.data.currentTag && !this.data.searchKeyword;
      const selectedCategory = shouldAutoSelectDefaultCategory
        ? this.getDefaultCategory(categories)
        : this.data.currentCategory;

      // 大数据量变量存为实例属性，不通过 setData 传递
      this.allArticles = articles;
      this.taxonomy = taxonomy;
      this.categoryTree = categoryTree;
      this.searchIndex = searchIndex;

    this.setData({
      categoryTreeNodes,
      categories,
      currentCategory: selectedCategory,
      list: [],
      categoryScrollLeft: 0
    });
      this.page = 1;
      this.setPageTitle(selectedCategory, this.data.currentTag);

      if (selectedCategory || this.data.currentTag || this.data.searchKeyword) {
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
   * 加载分页数据（带缓存）
   */
  loadPageData() {
    if (this.hasActiveFilters()) {
      this.applyFiltersAndSort();
      return;
    }

    this.fetchPageWithCache(this.data.page).then(pageData => {
      console.debug('分页数据加载成功:', {
        page: pageData.page,
        totalPages: pageData.totalPages,
        itemCount: pageData.items.length
      });

      const decoratedItems = (pageData.items || []).map(article => this.decorateArticle(article));

      let list = this.data.list;
      if (this.page === 1) {
        list = decoratedItems;
      } else {
        list = list.concat(decoratedItems);
      }


      this.setData({
        list,
        isOver: this.page >= pageData.totalPages,
        loading: false,
        refreshing: false
      });
      this.totalCount = pageData.totalItems;

      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载分页数据失败:', err);
      this.showError('加载失败，请重试');
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 带缓存的请求（内存 → Storage → CDN）
   */
  fetchWithCache(memRef, cacheKey, tsKey, url) {
    const now = Date.now();

    // 1. 内存缓存
    if (memRef) return Promise.resolve(memRef);

    // 2. Storage 缓存
    try {
      const cached = wx.getStorageSync(cacheKey);
      const ts = wx.getStorageSync(tsKey);
      if (cached && ts && (now - ts < CACHE_EXPIRE)) {
        return Promise.resolve(cached);
      }
    } catch (e) { /* 读缓存失败 */ }

    // 3. CDN（支持 304，命中时自动延长 TTL；写入时触发 LRU 淘汰）
    return this.requestWith304(url, cacheKey, tsKey).then(data => {
      cacheManager.smartSet(cacheKey, data, tsKey);
      return data;
    });
  },

  /**
   * 发送请求，尝试 304 优化
   */
  requestWith304(url, cacheKey, tsKey) {
    return new Promise((resolve, reject) => {
      const headers = {};
      try {
        const oldTs = wx.getStorageSync(tsKey);
        if (oldTs) {
          headers['If-Modified-Since'] = new Date(oldTs).toUTCString();
        }
      } catch (e) { /* ignore */ }

      wx.request({
        url,
        method: 'GET',
        timeout: 30000,
        header: headers,
        success: (res) => {
          if (res.statusCode === 304) {
            // 内容未变，延长 TTL，返回旧缓存
            try { wx.setStorageSync(tsKey, Date.now()); } catch (e) { /* ignore */ }
            resolve(cacheKey ? wx.getStorageSync(cacheKey) : null);
          } else if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error('请求失败: ' + res.statusCode));
          }
        },
        fail: reject
      });
    });
  },

  /**
   * 分页数据缓存（key 动态，按页码）
   */
  fetchPageWithCache(page) {
    const cacheKey = CACHE_KEY_PAGE + page;
    const tsKey = cacheKey + '_ts';
    const url = CDN_BASE + `page/page-${page}.json`;
    const now = Date.now();

    try {
      const cached = wx.getStorageSync(cacheKey);
      const ts = wx.getStorageSync(tsKey);
      if (cached && ts && (now - ts < CACHE_EXPIRE)) {
        return Promise.resolve(cached);
      }
    } catch (e) { /* 读缓存失败 */ }

    return this.requestWith304(url, cacheKey, tsKey).then(data => {
      cacheManager.smartSet(cacheKey, data, tsKey);
      return data;
    });
  },

  /**
   * 应用筛选
   */
  applyFiltersAndSort() {
    const allArticles = this.allArticles || [];
    const searchIndex = this.searchIndex;
    const { currentCategory, currentTag, searchKeyword } = this.data;
    let filteredArticles = Array.isArray(allArticles) ? [...allArticles] : [];

    console.debug('应用筛选和排序:', {
      originalCount: filteredArticles.length,
      currentCategory,
      currentTag,
      searchKeyword
    });

    if (currentCategory) {
      const beforeCategoryCount = filteredArticles.length;
      filteredArticles = filteredArticles.filter(article => this.isCategoryMatch(article.category, currentCategory));
      console.debug(`分类筛选: ${currentCategory}, 从 ${beforeCategoryCount} 筛选到 ${filteredArticles.length}`);
    }

    if (currentTag) {
      const beforeTagCount = filteredArticles.length;
      const normalizedTag = currentTag.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        Array.isArray(article.tags) && article.tags.some(tag => (tag || '').toLowerCase() === normalizedTag)
      );
      console.debug(`标签筛选: ${currentTag}, 从 ${beforeTagCount} 筛选到 ${filteredArticles.length}`);
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

      console.debug(`搜索筛选: "${searchKeyword}", 从 ${beforeSearchCount} 筛选到 ${filteredArticles.length}`);
    }

    // 保存全部筛选结果到实例属性，只渲染前 pageSize 条
    this._filteredAll = filteredArticles;
    this._filteredPage = 0;
    const pageSize = this.data.pageSize || 20;
    const initialList = filteredArticles.slice(0, pageSize);

    this.setData({
      list: initialList,
      isOver: filteredArticles.length <= pageSize,
      loading: false,
      refreshing: false
    });
    this.totalCount = filteredArticles.length;

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
    const defaultCategory = this.getDefaultCategory();
    this.setData({
      searchKeyword: '',
      currentCategory: defaultCategory,
      currentTag: '',
      showCategoryTree: false
    });
    this.setPageTitle(defaultCategory, '');
    this.refreshView();
  },



  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category || '';
    wx.navigateTo({
      url: `/pages/categorydetail/categorydetail?category=${category}`
    });
  },


  /**
   * 下拉刷新（只清知识库相关缓存）
   */
  onRefresh() {
    console.debug('开始执行下拉刷新:', {
      timestamp: new Date().toISOString(),
      currentCategory: this.data.currentCategory,
      searchKeyword: this.data.searchKeyword
    });

    // 只清知识库相关缓存键
    const keys = [
      CACHE_KEY_META, CACHE_KEY_META_TS,
      CACHE_KEY_ARTICLES, CACHE_KEY_ARTICLES_TS,
      CACHE_KEY_SEARCH, CACHE_KEY_SEARCH_TS,
    ];
    for (const k of keys) {
      wx.removeStorageSync(k);
      wx.removeStorageSync(k + '_ts');
    }
    // 分页缓存（只清前3页保守）
    for (let p = 1; p <= 10; p++) {
      wx.removeStorageSync(CACHE_KEY_PAGE + p);
      wx.removeStorageSync(CACHE_KEY_PAGE + p + '_ts');
    }
    // 重置内存缓存
    metaCache = null;
    articlesCache = null;
    searchCache = null;

    this.page = 1;
    this.setData({ refreshing: true, list: [] });
    this.loadArticles();
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.loading || this.data.isOver) {
      return;
    }

    // 筛选模式下：从实例属性追加数据
    if (this._filteredAll && this._filteredAll.length > this.data.list.length) {
      this._filteredPage = (this._filteredPage || 0) + 1;
      const pageSize = this.data.pageSize || 20;
      const start = this._filteredPage * pageSize;
      const more = this._filteredAll.slice(start, start + pageSize);

      this.setData({
        list: this.data.list.concat(more),
        isOver: start + pageSize >= this._filteredAll.length,
        loading: false
      });
      return;
    }

    // 非筛选模式：分页加载
    if (this.hasActiveFilters()) return;

    this.page++;
    this.loadArticles();
  },

  /**
   * 点击文章进入详情页
   */
  onArticleTap(e) {
    const { filename } = e.currentTarget.dataset;
    console.debug('点击文章，文件名：', filename);
    wx.navigateTo({
      url: `/pages/knowledgedetail/knowledgedetail?filename=${filename}`
    });
  },

  /**
   * 标签点击
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/tagdetail/tagdetail?tag=${tag}`
    });
  },


  /**
   * 分类点击
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/categorydetail/categorydetail?category=${category}`
    });
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
    const { currentCategory, currentTag, searchKeyword } = this.data;
    const totalCount = this.totalCount || 0;
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
      path: `/pages/knowledgelist/knowledgelist?category=${currentCategory}&tag=${tag}`
    };
  },


  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { currentCategory } = this.data;
    const totalCount = this.totalCount || 0;
    const displayCategory = currentCategory ? this.getLeafCategoryName(currentCategory) : '';
    const title = displayCategory
      ? `${displayCategory} - 随身百科`
      : `随身百科 - 共 ${totalCount} 篇知识`;

    return {
      title,
      query: `category=${currentCategory}`
    };
  }

});
