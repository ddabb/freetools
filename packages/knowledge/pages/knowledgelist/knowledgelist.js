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

    // 排序
    sortField: 'order',
    sortOrder: 'asc',

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
    this.onRefresh();
  },

  /**
   * 加载文章列表
   */
  loadArticles() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    const url = CDN_BASE + 'articles.json';

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const articles = res.data.articles || [];
          const taxonomy = res.data.taxonomy || {};
          
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

          // 应用筛选和排序
          this.applyFiltersAndSort();
          
          this.setData({ loading: false, refreshing: false });
          wx.stopPullDownRefresh();
        } else {
          this.showError('加载失败，请重试');
          this.setData({ loading: false, refreshing: false });
          wx.stopPullDownRefresh();
        }
      },
      fail: (err) => {
        console.error('加载文章失败:', err);
        this.showError('网络错误，请检查连接');
        this.setData({ loading: false, refreshing: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 应用筛选和排序
   */
  applyFiltersAndSort() {
    let { allArticles, currentCategory, searchKeyword, sortField, sortOrder } = this.data;
    
    // 分类筛选
    if (currentCategory) {
      allArticles = allArticles.filter(a => a.category === currentCategory);
    }
    
    // 搜索筛选（标题、描述、标签）
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase().replace('#', '');
      allArticles = allArticles.filter(a => 
        a.title.toLowerCase().includes(keyword) ||
        (a.description && a.description.toLowerCase().includes(keyword)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(keyword)))
      );
    }
    
    // 排序
    allArticles.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'updateTime' || sortField === 'birthtime') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    
    // 格式化日期
    const formattedList = allArticles.map(item => ({
      ...item,
      formattedUpdateTime: utils.formatDate(item.updateTime)
    }));

    this.setData({
      list: formattedList,
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
   * 切换排序
   */
  toggleSort() {
    const newOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
    const newField = this.data.sortField === 'order' ? 'updateTime' : 'order';
    
    this.setData({
      sortField: newField,
      sortOrder: newOrder
    });
    
    this.applyFiltersAndSort();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    // 清空缓存
    wx.clearStorageSync();
    // 重新加载数据
    this.setData({ refreshing: true, page: 1 });
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
