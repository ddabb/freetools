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
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/changelog.json',
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            loading: false,
            changelog: res.data
          });
        } else {
          this.setData({
            loading: false,
            error: '数据格式错误'
          });
        }
      },
      fail: () => {
        this.setData({
          loading: false,
          error: '网络请求失败，请检查网络连接'
        });
      }
    });
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
