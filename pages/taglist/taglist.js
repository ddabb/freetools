const cacheManager = require('../../utils/cacheManager');
const pinyin = require('pinyin-pro');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

const CACHE_KEY_TAGS = 'cdn_know_tags';
const CACHE_KEY_TAGS_TS = 'cdn_know_tags_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

Page({
  data: {
    tags: [],
    displayTags: [],
    searchKeyword: '',
    activeLetter: '',
    letters: [],
    sortedLetters: [],
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0,
    pageSize: 50,
    hasMore: true,
    loadingMore: false
  },

  // 页面实例属性，不通过setData传递到渲染层
  currentPage: 1,

  goToKnowledgeList() {
    wx.navigateTo({ url: '/pages/knowledgelist/knowledgelist' });
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
    // 异步获取系统信息，避免阻塞
    wx.getSystemInfo({
      success: (res) => {
        const scrollHeight = res.windowHeight - 280;
        this.setData({ scrollHeight });
      }
    });

    wx.setNavigationBarTitle({
      title: '标签列表'
    });

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 延迟执行加载，让页面先渲染
    setTimeout(() => {
      this.loadTags();
    }, 50);
  },

  async loadTags() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    try {
      const res = await this.fetchWithCache(
        CACHE_KEY_TAGS,
        CACHE_KEY_TAGS_TS,
        CDN_BASE + 'tags.json'
      );
      const tags = (res.tags || []).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));

      const tagsWithLetter = tags.map(tag => ({
        ...tag,
        letter: this.getPinyinFirstLetter(tag.name)
      }));

      const lettersSet = new Set();
      tagsWithLetter.forEach(t => lettersSet.add(t.letter));
      const sortedLetters = Array.from(lettersSet).sort((a, b) => {
        if (a === '其他') return 1;
        if (b === '其他') return -1;
        return a.localeCompare(b);
      });

      this.setData({
        tags: tagsWithLetter,
        hasMore: true,
        loading: false,
        error: false
      });

      // 重置分页状态
      this.currentPage = 1;

      this.filterTags();
    } catch (err) {
      console.error('加载标签失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags();
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags();
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterTags();
  },

  onLetterTap(e) {
    const letter = e.currentTarget.dataset.letter;
    this.setData({ activeLetter: letter });
    this.filterTags();
  },

  filterTags() {
    let { tags, searchKeyword, activeLetter, pageSize } = this.data;
    let filtered = tags;

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(keyword)
      );
    }

    if (activeLetter) {
      filtered = filtered.filter(t => t.letter === activeLetter);
    }

    // 保持所有字母可见，即使没有对应标签
    const allLettersSet = new Set();
    tags.forEach(t => allLettersSet.add(t.letter));
    const sortedLetters = Array.from(allLettersSet).sort((a, b) => {
      if (a === '其他') return 1;
      if (b === '其他') return -1;
      return a.localeCompare(b);
    });

    // 重置分页状态，只显示第一页
    const paginatedTags = filtered.slice(0, pageSize);
    const hasMore = filtered.length > pageSize;

    this.setData({ 
      displayTags: paginatedTags,
      sortedLetters,
      hasMore
    });

    // 重置分页状态
    this.currentPage = 1;
  },

  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/tagdetail/tagdetail?tag=${tag}`
    });
  },

  loadMore() {
    const { tags, searchKeyword, activeLetter, pageSize, hasMore, loadingMore } = this.data;

    if (!hasMore || loadingMore) return;

    this.setData({ loadingMore: true });

    // 重新计算过滤后的标签
    let filtered = tags;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(keyword)
      );
    }

    if (activeLetter) {
      filtered = filtered.filter(t => t.letter === activeLetter);
    }

    // 计算下一页的数据
    const startIndex = this.currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const moreTags = filtered.slice(startIndex, endIndex);
    const newDisplayTags = [...this.data.displayTags, ...moreTags];
    const newHasMore = endIndex < filtered.length;

    this.setData({
      displayTags: newDisplayTags,
      hasMore: newHasMore,
      loadingMore: false
    });

    // 更新分页状态
    this.currentPage++;
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
    this.loadTags();
  }
});
