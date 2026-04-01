// packages/knowledge/pages/knowledgelist/knowledgelist.js
const utils = require('../../../../utils/index');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    currentCategory: '',
    categories: [],
    categoryStats: {},

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

    // 原始数据
    allArticles: [],
    taxonomy: null
  },

  onLoad(options) {
    const { category, tag } = options || {};
    
    // 设置页面高度
    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180; // 减去搜索栏和导航的高度
    
    this.setData({
      scrollHeight,
      currentCategory: category || '',
      searchKeyword: tag ? `#${tag}` : ''
    });

    // 设置导航栏标题
    const title = category ? `${category}` : (tag ? `标签: ${tag}` : '知识库');
    wx.setNavigationBarTitle({ title });

    // 加载文章列表
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
      url: CDN_BASE + 'articles.json'
    });

    this.setData({ loading: true });

    const url = CDN_BASE + 'articles.json';

    wx.request({
      url: url + `?_t=${Date.now()}`,
      method: 'GET',
      timeout: 30000,
      success: (res) => {
        console.log('文章列表请求成功:', {
          statusCode: res.statusCode,
          dataLength: res.data ? (res.data.articles ? res.data.articles.length : 0) : 0,
          timestamp: new Date().toISOString()
        });
        
        if (res.statusCode === 200 && res.data) {
          const articles = res.data.articles || [];
          const taxonomy = res.data.taxonomy || {};
          
          console.log('获取到文章数据:', {
            articleCount: articles.length,
            categoryCount: Object.keys(taxonomy.categories || {}).length
          });
          
          // 保存原始数据
          this.setData({ 
            allArticles: articles,
            taxonomy
          });
          
          // 更新分类列表（包含统计）
          const categoryStats = {};
          
          // 添加"全部"统计
          categoryStats[''] = articles.length;
          categoryStats['全部'] = articles.length;
          
          // 添加各分类统计
          Object.entries(taxonomy.categories || {}).forEach(([name, count]) => {
            categoryStats[name] = count;
          });
          
          const categories = Object.entries(taxonomy.categories || {})
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
          
          this.setData({
            categories,
            categoryStats
          });

          console.log('开始应用筛选和排序');
          // 应用筛选和排序
          this.applyFiltersAndSort();
          
          console.log('数据加载完成，停止刷新状态');
          this.setData({ loading: false, refreshing: false });
          wx.stopPullDownRefresh();
        } else {
          console.warn('文章列表请求返回异常:', {
            statusCode: res.statusCode,
            data: res.data
          });
          this.showError('加载失败，请重试');
          this.setData({ loading: false, refreshing: false });
          wx.stopPullDownRefresh();
        }
      },
      fail: (err) => {
        console.error('加载文章失败:', {
          error: err,
          timestamp: new Date().toISOString()
        });
        this.showError('网络错误，请检查连接');
        this.setData({ loading: false, refreshing: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 应用筛选
   */
  applyFiltersAndSort() {
    let { allArticles, currentCategory, searchKeyword } = this.data;
    
    console.log('应用筛选和排序:', {
      originalCount: allArticles.length,
      currentCategory: currentCategory,
      searchKeyword: searchKeyword
    });
    
    // 分类筛选
    if (currentCategory) {
      const beforeCategoryCount = allArticles.length;
      allArticles = allArticles.filter(a => a.category === currentCategory);
      console.log(`分类筛选: ${currentCategory}, 从 ${beforeCategoryCount} 筛选到 ${allArticles.length}`);
    }
    
    // 搜索筛选（标题、描述、标签）
    if (searchKeyword) {
      const beforeSearchCount = allArticles.length;
      const keyword = searchKeyword.toLowerCase().replace('#', '');
      allArticles = allArticles.filter(a => 
        a.title.toLowerCase().includes(keyword) ||
        (a.description && a.description.toLowerCase().includes(keyword)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(keyword)))
      );
      console.log(`搜索筛选: "${searchKeyword}", 从 ${beforeSearchCount} 筛选到 ${allArticles.length}`);
    }
    
    console.log('筛选完成，设置列表数据:', {
      finalCount: allArticles.length,
      totalCount: allArticles.length
    });
    
    this.setData({
      list: allArticles,
      totalCount: allArticles.length,
      isOver: true // 一次性加载全部
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.applyFiltersAndSort();
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.applyFiltersAndSort();
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFiltersAndSort();
  },

  /**
   * 清除所有筛选
   */
  clearFilters() {
    this.setData({ 
      searchKeyword: '',
      currentCategory: ''
    });
    wx.setNavigationBarTitle({ title: '知识库' });
    this.applyFiltersAndSort();
  },

  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    if (this.data.currentCategory === category) return;
    
    this.setData({ 
      currentCategory: category,
      searchKeyword: ''
    });
    
    // 更新导航栏标题
    const title = category ? `${category}` : '知识库';
    wx.setNavigationBarTitle({ title });
    
    this.applyFiltersAndSort();
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
    
    // 清空缓存
    wx.clearStorageSync();
    console.log('缓存已清空');
    
    // 重新加载数据
    this.setData({ refreshing: true, page: 1 });
    console.log('设置 refreshing 状态为 true');
    
    this.loadArticles();
  },

  /**
   * 加载更多
   */
  loadMore() {
    // 一次性加载，不需要分页
  },

  /**
   * 点击文章进入详情页
   */
  onArticleTap(e) {
    const { filename } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?filename=${filename}`
    });
  },

  /**
   * 标签点击
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    this.setData({ searchKeyword: `#${tag}` });
    this.applyFiltersAndSort();
  },

  /**
   * 分类点击
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    this.switchCategory({ currentTarget: { dataset: { category } } });
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
    let title = '随身百科-答疑小助手';

    if (currentCategory) {
      title = `${currentCategory} - 随身百科`;
    } else if (searchKeyword) {
      title = `搜索"${searchKeyword.replace('#', '')}"结果`;
    } else {
      title = `随身百科 - 共 ${totalCount} 篇知识`;
    }

    return {
      title,
      path: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${currentCategory}&tag=${searchKeyword.replace('#', '')}`
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
      query: `category=${currentCategory}`
    };
  }
});
