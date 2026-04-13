const cacheManager = require('../../utils/cacheManager');
const pinyin = require('pinyin-pro');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

const CACHE_KEY_CATEGORY_TREE = 'cdn_know_category_tree';
const CACHE_KEY_CATEGORY_TREE_TS = 'cdn_know_category_tree_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

Page({
  data: {
    categories: [],
    renderedCategories: [],  // 当前已渲染的分类（分页用）
    searchKeyword: '',
    activeLetter: '',
    letters: [],
    sortedLetters: [],
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0,
    pageSize: 30,           // 每页渲染数量
    hasMore: true           // 是否还有更多
  },

  getLeafCategoryName(category) {
    if (!category) return '未分类';
    const parts = String(category).split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : category;
  },

  flattenCategories(node, list = []) {
    Object.values((node && node.children) || {}).forEach(category => {
      list.push({
        name: category.path,
        label: category.name || this.getLeafCategoryName(category.path),
        count: category.count
      });
      this.flattenCategories(category, list);
    });
    return list;
  },

  getPinyinFirstLetter(text) {
    if (!text) return '其他';
    const firstChar = text.charAt(0);
    if (/[A-Za-z0-9]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
    const pinyinResult = pinyin.pinyin(firstChar, { toneType: 'none', type: 'array' });
    if (pinyinResult && pinyinResult.length > 0) {
      const firstLetter = pinyinResult[0].charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        return firstLetter;
      }
    }
    return '其他';
  },

  fetchWithCache(cacheKey, tsKey, url) {
    return cacheManager.fetchWithCache({
      cacheKey,
      tsKey,
      url,
      ttl: CACHE_EXPIRE
    });
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 280;
    this.setData({ scrollHeight });

    wx.setNavigationBarTitle({
      title: '分类列表'
    });

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.loadCategories();
  },

  onShareAppMessage() {
    return {
      title: '知识库分类列表',
      path: '/pages/categorylist/categorylist'
    };
  },

  onShareTimeline() {
    return {
      title: '知识库分类列表'
    };
  },

  // 页面实例属性，不通过setData传递到渲染层
  displayCategories: [],

  async loadCategories() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    try {
      const res = await this.fetchWithCache(
        CACHE_KEY_CATEGORY_TREE,
        CACHE_KEY_CATEGORY_TREE_TS,
        CDN_BASE + 'category-tree.json'
      );
      const categoryList = this.flattenCategories(res)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));

      const categoriesWithLetter = categoryList.map(category => ({
        ...category,
        letter: this.getPinyinFirstLetter(category.label)
      }));

      const lettersSet = new Set();
      categoriesWithLetter.forEach(c => lettersSet.add(c.letter));
      const sortedLetters = Array.from(lettersSet).sort((a, b) => {
        if (a === '其他') return 1;
        if (b === '其他') return -1;
        return a.localeCompare(b);
      });

      // 存储到实例属性，不通过setData传递到渲染层
      this.displayCategories = categoriesWithLetter;

      this.setData({
        categories: categoriesWithLetter,
        sortedLetters,
        loading: false,
        error: false
      });

      // 分页渲染首屏
      this.renderPage(1);
    } catch (err) {
      console.error('加载分类失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterCategories();
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterCategories();
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterCategories();
  },

  onLetterTap(e) {
    const letter = e.currentTarget.dataset.letter;
    this.setData({ activeLetter: letter });
    this.filterCategories();
  },

  // 分页渲染：将 displayCategories 分批渲染到 renderedCategories
  renderPage(page) {
    const { pageSize } = this.data;
    const end = page * pageSize;
    const renderedCategories = this.displayCategories.slice(0, end);
    const hasMore = end < this.displayCategories.length;
    this.setData({
      renderedCategories,
      hasMore
    });
  },

  // 加载更多（触底加载）
  loadMore() {
    const { renderedCategories, pageSize, hasMore } = this.data;
    if (!hasMore) return;
    const currentPage = Math.ceil(renderedCategories.length / pageSize);
    this.renderPage(currentPage + 1);
  },

  filterCategories() {
    let { categories, searchKeyword, activeLetter } = this.data;
    let filtered = categories;

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(c => 
        c.label.toLowerCase().includes(keyword)
      );
    }

    if (activeLetter) {
      filtered = filtered.filter(c => c.letter === activeLetter);
    }

    // 保持所有字母可见，即使没有对应分类
    const allLettersSet = new Set();
    categories.forEach(c => allLettersSet.add(c.letter));
    const sortedLetters = Array.from(allLettersSet).sort((a, b) => {
      if (a === '其他') return 1;
      if (b === '其他') return -1;
      return a.localeCompare(b);
    });

    // 更新实例属性，不通过setData传递到渲染层
    this.displayCategories = filtered;

    this.setData({ 
      sortedLetters
    });

    // 筛选后重新从第一页渲染
    this.renderPage(1);
  },

  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/categorydetail/categorydetail?category=${category}`
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
    cacheManager.clearCdnCache('know_');
    this.loadCategories();
  }
});
