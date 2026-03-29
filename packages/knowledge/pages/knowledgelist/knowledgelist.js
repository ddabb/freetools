// packages/knowledge/pages/knowledgelist/knowledgelist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    category: '',
    tag: '',
    list: [],
    loading: false,
    isOver: false,
    scrollHeight: 0,
    sortField: 'order',
    sortOrder: 'asc',
    sortColor: '#2980b9',
    otherColor: '#7f8c8d'
  },

  onLoad(options) {
    // 获取分类或标签参数
    const { category, tag } = options;
    
    this.setData({
      category: category || '',
      tag: tag || '',
      scrollHeight: wx.getSystemInfoSync().windowHeight - 50
    });

    // 设置导航栏标题
    const title = category ? `${category}` : (tag ? `标签: ${tag}` : '知识库');
    wx.setNavigationBarTitle({ title });

    // 加载文章列表
    this.loadArticles();
  },

  /**
   * 从 CDN 加载文章列表
   */
  loadArticles() {
    if (this.data.loading || this.data.isOver) return;

    this.setData({ loading: true });

    // 根据分类或标签加载数据
    const { category, tag } = this.data;
    let url = CDN_BASE + 'articles.json';

    if (category) {
      url = CDN_BASE + `category/${category}.json`;
    }

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200) {
          let articles = [];

          if (category) {
            // 分类数据
            articles = res.data.articles || [];
          } else if (tag) {
            // 标签过滤
            articles = (res.data.articles || []).filter(a => 
              a.tags && a.tags.includes(tag)
            );
          } else {
            // 全部文章
            articles = res.data.articles || [];
          }

          // 排序
          this.sortArticles(articles);

          this.setData({
            list: articles,
            loading: false,
            isOver: true
          });
        } else {
          this.showError('加载失败，请重试');
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error('加载文章失败:', err);
        this.showError('网络错误，请检查连接');
        this.setData({ loading: false });
      }
    });
  },

  /**
   * 排序文章
   */
  sortArticles(articles) {
    const { sortField, sortOrder } = this.data;
    
    articles.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'updateTime' || sortField === 'birthtime') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  },

  /**
   * 切换排序
   */
  toggleSort() {
    if (this.data.loading) return;

    const newOrder = this.data.sortOrder === 'asc' ? 'desc' : 'asc';
    const newColor = this.data.sortColor === '#2980b9' ? '#7f8c8d' : '#2980b9';

    this.setData({
      sortOrder: newOrder,
      sortColor: newColor,
      otherColor: newColor === '#2980b9' ? '#7f8c8d' : '#2980b9'
    });

    this.sortArticles(this.data.list);
    this.setData({ list: this.data.list });
  },

  /**
   * 点击文章进入详情页
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?id=${id}`
    });
  },

  /**
   * 显示错误提示
   */
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    });
  },

  onShow() {
    // 页面显示时可以刷新数据
  }
});
