// packages/knowledge/pages/categorylist/categorylist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

Page({
  data: {
    categories: [],
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0
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


  requestData(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: url + `?_t=${Date.now()}`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error('请求失败'));
          }
        },
        fail: reject
      });
    });
  },

  onLoad() {

    const systemInfo = wx.getSystemInfoSync();
    const scrollHeight = systemInfo.windowHeight - 180;
    this.setData({ scrollHeight });

    wx.setNavigationBarTitle({
      title: '分类列表'
    });

    this.loadCategories();
  },

  async loadCategories() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + 'category-tree.json';

    try {
      const res = await this.requestData(url);
      const categoryList = this.flattenCategories(res)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));


      this.setData({
        categories: categoryList,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载分类失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },


  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${category}`
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
    wx.clearStorageSync();
    this.loadCategories();
  }
});

