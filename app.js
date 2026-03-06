// app.js
App({
  onLaunch() {
    // 初始化小程序
    console.log('实用工具集合小程序启动');

    // 检查更新
    this.checkForUpdate();

    // 初始化使用统计
    this.initStats();
  },

  onShow() {
    // 小程序显示
  },

  onHide() {
    // 小程序隐藏
  },

  onError(msg) {
    console.error('小程序发生错误：', msg);
  },

  // 检查更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function(res) {
        console.log('检查更新结果：', res.hasUpdate);
      });

      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function() {
        console.error('新版本下载失败');
      });
    }
  },

  // 初始化统计数据
  initStats() {
    try {
      let useCount = wx.getStorageSync('useCount') || 0;
      useCount++;
      wx.setStorageSync('useCount', useCount);
    } catch (e) {
      console.error('初始化统计数据失败', e);
    }
  },

  globalData: {
    userInfo: null,
    version: '1.0.0'
  }
})
