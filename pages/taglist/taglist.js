// packages/knowledge/pages/taglist/taglist.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

Page({
  data: {
    tags: [],
    filteredTags: [],
    searchKeyword: '',
    loading: true,
    error: false,
    errorMsg: '',
    scrollHeight: 0
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
      title: '标签列表'
    });

    // 设置分享按钮
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    this.loadTags();
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '知识库标签列表',
      path: '/pages/taglist/taglist'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '知识库标签列表'
    };
  },

  async loadTags() {
    this.setData({
      loading: true,
      error: false,
      errorMsg: ''
    });

    const url = CDN_BASE + 'tags.json';

    try {
      const res = await this.requestData(url);
      const tags = res.tags || [];
      this.setData({
        tags,
        filteredTags: tags,
        loading: false,
        error: false
      });
    } catch (err) {
      console.error('加载标签失败:', err);
      this.showError('网络错误，请检查连接');
    } finally {
      wx.stopPullDownRefresh();
    }
  },


  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags(keyword);
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterTags(keyword);
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterTags('');
  },

  /**
   * 过滤标签
   */
  filterTags(keyword) {
    const { tags } = this.data;
    if (!keyword) {
      this.setData({ filteredTags: tags });
      return;
    }

    const filtered = tags.filter(tag => 
      tag.name.toLowerCase().includes(keyword.toLowerCase())
    );
    this.setData({ filteredTags: filtered });
  },

  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.switchTab({
      url: '/pages/knowledgelist/knowledgelist',
      success: () => {
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.pendingTag = tag;
        app.globalData.pendingCategory = '';
      }
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
    this.loadTags();
  }
});

