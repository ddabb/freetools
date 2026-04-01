// pages/changelog/changelog.js
// 版本日志页面

Page({
  data: {
    loading: true,
    error: '',
    changelog: null
  },

  onLoad() {
    this.loadChangelog();
  },

  // 从 jsDelivr CDN 加载 changelog
  loadChangelog() {
    console.log('[changelog] 开始加载版本日志');
    this.setData({
      loading: true,
      error: ''
    });
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/changelog.json'+ `?_t=${Date.now()}`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log('[changelog] 请求成功', {
          statusCode: res.statusCode,
          hasData: !!res.data
        });
        if (res.statusCode === 200 && res.data) {
          this.setData({
            loading: false,
            changelog: res.data
          });
        } else {
          console.error('[changelog] 数据格式错误', res);
          this.setData({
            loading: false,
            error: '数据格式错误，点击重试'
          });
        }
      },
      fail: (err) => {
        console.error('[changelog] 网络请求失败', err);
        this.setData({
          loading: false,
          error: '网络请求失败，点击重试'
        });
      }
    });
  },

  // 点击重试
  onRetry() {
    console.log('[changelog] 用户点击重试');
    this.loadChangelog();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '随身工具宝 - 版本日志',
      path: '/pages/changelog/changelog'
    };
  },

  onShareTimeline() {
    return {
      title: '随身工具宝 - 版本日志'
    };
  }
});
