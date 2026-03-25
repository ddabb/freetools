// pages/changelog-test/changelog-test.js
// 测试页：验证 jsDelivr CDN 加载 changelog

Page({
  data: {
    loading: true,
    error: '',
    changelog: null,
    cdnUrl: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/changelog.json'
  },

  onLoad() {
    this.loadChangelog();
  },

  // 从 jsDelivr CDN 加载 changelog
  loadChangelog() {
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/changelog.json',
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            loading: false,
            changelog: res.data
          });
          console.log('✅ CDN 加载成功:', res.data);
        } else {
          this.setData({
            loading: false,
            error: '数据格式错误'
          });
        }
      },
      fail: (err) => {
        console.error('❌ CDN 加载失败:', err);
        this.setData({
          loading: false,
          error: '网络请求失败: ' + (err.errMsg || '未知错误')
        });
      }
    });
  },

  // 刷新数据
  onRefresh() {
    this.setData({ loading: true, error: '', changelog: null });
    this.loadChangelog();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '版本日志测试',
      path: '/pages/changelog-test/changelog-test'
    };
  }
});
