// packages/knowledge/pages/knowledgelist/knowledgelist.js
const knowledgeCategory = require('../../utils/knowledgeCategory');
const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

// 调试开关
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[KnowList]', ...args);

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
    log('onLoad 开始, options:', options);
    const category = this.safeDecode((options || {}).category);
    const tag = this.safeDecode((options || {}).tag);
    log('解析参数 - category:', category, 'tag:', tag);

    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180;

    this.page = 1;
    this.totalCount = 0;

    // 只保存参数，不加载数据
    this._pendingOptions = { category, tag };

    // 立即显示骨架屏/loading状态，避免白屏
    this.setData({
      scrollHeight,
      currentCategory: category || '',
      currentTag: tag || '',
      searchKeyword: '',
      loading: true,  // 立即显示loading
      list: [],       // 空列表，等待数据
      isOver: false
    });

    this.setPageTitle(category || '', tag || '');
  },

  onReady() {
    // 页面 ready 后再加载数据，避免阻塞导航
    if (this._pendingOptions) {
      const { category, tag } = this._pendingOptions;
      this._pendingOptions = null;
      
      // 优先尝试缓存秒开
      const hasCache = this.tryLoadFromCache();
      
      // 无论是否有缓存，都继续加载最新数据
      if (!hasCache) {
        // 重置 loading 状态，避免被跳过
        this.setData({ loading: false });
        this.loadArticles();
      }
    }
  },

  /**
   * 尝试从缓存快速加载数据，实现秒开
   * @returns {boolean} 是否命中缓存
   */
  tryLoadFromCache() {
    try {
      const now = Date.now();
      log('尝试从缓存加载数据...');
      
      // 尝试读取缓存
      const categoryTreeData = wx.getStorageSync(CACHE_KEY_META);
      const articlesData = wx.getStorageSync(CACHE_KEY_ARTICLES);
      const searchIndexData = wx.getStorageSync(CACHE_KEY_SEARCH);
      
      const categoryTreeTs = wx.getStorageSync(CACHE_KEY_META_TS);
      const articlesTs = wx.getStorageSync(CACHE_KEY_ARTICLES_TS);
      const searchTs = wx.getStorageSync(CACHE_KEY_SEARCH_TS);
      
      log('缓存状态 - categoryTree:', !!categoryTreeData, 'articles:', !!articlesData, 'search:', !!searchIndexData);
      log('缓存时间 - categoryTreeTs:', categoryTreeTs, 'articlesTs:', articlesTs);
      
      // 检查缓存是否有效（7天内）
      const isCacheValid = categoryTreeData && articlesData && 
        (now - categoryTreeTs < CACHE_EXPIRE) && 
        (now - articlesTs < CACHE_EXPIRE);
      
      log('缓存是否有效:', isCacheValid);
      
      if (!isCacheValid) return false;
      
      log('使用缓存数据快速渲染');
      
      // 更新内存缓存
      metaCache = categoryTreeData;
      articlesCache = articlesData;
      searchCache = searchIndexData;
      
      // 立即渲染页面
      const articles = (articlesData.articles || []).map(article => this.decorateArticle(article));
      const taxonomy = articlesData.taxonomy || {};
      const categoryTree = categoryTreeData || { children: {} };
      const searchIndex = searchIndexData || [];
      
      this.taxonomy = taxonomy;
      this.allArticles = articles;
      this.searchIndex = searchIndex;
      this.categoryLeafLookup = this.buildCategoryLeafLookup(categoryTree);
      
      const topCategories = this.buildTopCategories(categoryTree);
      const categoryStats = this.buildCategoryStatsFromTree(categoryTree);
      
      // 自动选中第一个分类（与下方 loadMetadata CDN 回调保持一致）
      let currentCategory = this.data.currentCategory;
      if (!currentCategory && topCategories.length > 0) {
        currentCategory = topCategories[0].name;
      }
      
      this.setData({
        categories: topCategories,
        categoryTreeNodes: this.buildRenderableCategoryTree(categoryTree),
        currentCategory,
        loading: false // 缓存加载完成，关闭loading
      });
      
      // 加载第一页数据
      this.loadPageData();
      
      log('缓存加载完成，文章数:', articles.length);
      return true;
    } catch (e) {
      log('缓存读取失败:', e);
      return false;
    }
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
   * 优化策略：优先使用缓存快速渲染，后台静默更新
   */
  loadMetadata() {
    const now = Date.now();
    log('开始加载元数据...');

    // 构造元数据缓存 key（categoryTree + taxonomy 打包）
    const metaUrl = CDN_BASE + 'articles.json';
    const categoryTreeUrl = CDN_BASE + 'category-tree.json';
    const searchIndexUrl = CDN_BASE + 'search-index.json';
    log('CDN URLs:', { metaUrl, categoryTreeUrl, searchIndexUrl });

    // 快速检查缓存，有缓存则立即渲染
    const hasCache = this.tryLoadFromCache();
    log('是否有缓存:', hasCache);
    
    // 后台异步加载/更新数据
    const loadMeta = () => {
      log('开始从 CDN 加载元数据...');
      return Promise.all([
        this.fetchWithCache(metaCache, CACHE_KEY_META, CACHE_KEY_META_TS, categoryTreeUrl),
        this.fetchWithCache(articlesCache, CACHE_KEY_ARTICLES, CACHE_KEY_ARTICLES_TS, metaUrl),
        this.fetchWithCache(searchCache, CACHE_KEY_SEARCH, CACHE_KEY_SEARCH_TS, searchIndexUrl)
      ]);
    };

    loadMeta().then(([categoryTreeData, articlesData, searchIndexData]) => {
      log('元数据加载成功');
      log('categoryTreeData:', categoryTreeData ? '有数据' : '无数据', '类型:', typeof categoryTreeData);
      log('articlesData:', articlesData ? '有数据' : '无数据', '类型:', typeof articlesData, 'articles数量:', articlesData?.articles?.length);
      log('searchIndexData:', searchIndexData ? '有数据' : '无数据', '类型:', typeof searchIndexData);

      // 更新内存缓存引用（按正确的对应关系）
      metaCache = categoryTreeData;
      articlesCache = articlesData;
      searchCache = searchIndexData;

      const articles = (articlesData.articles || []).map(article => this.decorateArticle(article));
      const taxonomy = articlesData.taxonomy || {};

      const categoryTree = categoryTreeData || { children: {} };
      const searchIndex = searchIndexData || [];

      // 如果已经通过缓存渲染过，检查数据是否有变化
      if (this.allArticles && this.allArticles.length > 0) {
        const cachedCount = this.allArticles.length;
        const newCount = articles.length;
        if (cachedCount === newCount) {
          console.debug('数据未变化，跳过重新渲染');
          this.setData({ loading: false, refreshing: false });
          wx.stopPullDownRefresh();
          return;
        }
        console.debug(`数据已更新: ${cachedCount} → ${newCount}`);
      }

      const categoryStats = this.buildCategoryStatsFromTree(categoryTree);

      this.categoryLeafLookup = this.buildCategoryLeafLookup(categoryTree);
      const categories = this.buildTopCategories(categoryTree);
      const categoryTreeNodes = this.buildRenderableCategoryTree(categoryTree);
      // 无查询参数时自动选中第一个分类
      let selectedCategory = this.data.currentCategory;
      if (!selectedCategory && categories.length > 0) {
        selectedCategory = categories[0].name;
      }

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

      log('元数据处理完成，文章总数:', articles.length, '分类数:', categories.length);

    }).catch(err => {
      log('加载元数据失败:', err);
      console.error('加载元数据失败:', err);
      // 如果已经有缓存数据，不显示错误
      if (!this.allArticles || this.allArticles.length === 0) {
        this.showError('加载失败，请重试');
      }
      this.setData({ loading: false, refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载分页数据（带缓存）
   */
  loadPageData() {
    log('loadPageData 开始, page:', this.page, 'hasActiveFilters:', this.hasActiveFilters());
    if (this.hasActiveFilters()) {
      this.applyFiltersAndSort();
      return;
    }

    this.fetchPageWithCache(this.data.page).then(pageData => {
      log('分页数据加载成功:', {
        page: pageData.page,
        totalPages: pageData.totalPages,
        itemCount: pageData.items?.length
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
    log('fetchWithCache:', { cacheKey, url, hasMemRef: !!memRef });

    // 1. 内存缓存
    if (memRef) {
      log('使用内存缓存:', cacheKey);
      return Promise.resolve(memRef);
    }

    // 2. Storage 缓存
    try {
      const cached = wx.getStorageSync(cacheKey);
      const ts = wx.getStorageSync(tsKey);
      log('Storage缓存状态:', { cacheKey, hasCache: !!cached, ts: ts, expired: ts ? (now - ts >= CACHE_EXPIRE) : true });
      if (cached && ts && (now - ts < CACHE_EXPIRE)) {
        log('使用Storage缓存:', cacheKey);
        return Promise.resolve(cached);
      }
    } catch (e) { 
      log('读Storage缓存失败:', e);
    }

    // 3. CDN（支持 304，命中时自动延长 TTL；写入时触发 LRU 淘汰）
    log('从CDN加载:', url);
    return this.requestWith304(url, cacheKey, tsKey).then(data => {
      log('CDN加载成功:', cacheKey, '数据类型:', typeof data);
      cacheManager.smartSet(cacheKey, data, tsKey);
      return data;
    }).catch(err => {
      log('CDN加载失败:', url, err);
      throw err;
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

      log('发起请求:', url, 'headers:', headers);

      wx.request({
        url,
        method: 'GET',
        timeout: 30000,
        header: headers,
        success: (res) => {
          log('请求响应:', url, 'statusCode:', res.statusCode, 'hasData:', !!res.data);
          if (res.statusCode === 304) {
            // 内容未变，延长 TTL，返回旧缓存
            try { wx.setStorageSync(tsKey, Date.now()); } catch (e) { /* ignore */ }
            const cachedData = cacheKey ? wx.getStorageSync(cacheKey) : null;
            log('304 使用缓存数据:', cacheKey, 'hasData:', !!cachedData);
            resolve(cachedData);
          } else if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error('请求失败: ' + res.statusCode));
          }
        },
        fail: (err) => {
          log('请求失败:', url, err);
          reject(err);
        }
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
    log('fetchPageWithCache:', { page, cacheKey, url });

    try {
      const cached = wx.getStorageSync(cacheKey);
      const ts = wx.getStorageSync(tsKey);
      log('分页缓存状态:', { page, hasCache: !!cached, ts: ts, expired: ts ? (now - ts >= CACHE_EXPIRE) : true });
      if (cached && ts && (now - ts < CACHE_EXPIRE)) {
        log('使用分页缓存:', page);
        return Promise.resolve(cached);
      }
    } catch (e) { 
      log('读分页缓存失败:', e);
    }

    log('从CDN加载分页:', url);
    return this.requestWith304(url, cacheKey, tsKey).then(data => {
      log('分页CDN加载成功:', page, '数据类型:', typeof data);
      cacheManager.smartSet(cacheKey, data, tsKey);
      return data;
    }).catch(err => {
      log('分页CDN加载失败:', url, err);
      throw err;
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

    log('应用筛选和排序:', {
      originalCount: filteredArticles.length,
      allArticlesLength: allArticles.length,
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

    log('筛选完成，结果数:', filteredArticles.length, '渲染数:', initialList.length);

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
