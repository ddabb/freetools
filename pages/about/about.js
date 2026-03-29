// about.js
const utils = require('../../utils/index');

Page({
  data: {
    // 版本号（从 app.json 读取）
    version: '2.0.12',
    // CDN缓存是否已清除
    cacheCleared: false
  },

  onLoad() {
    // 显示分享按钮
    utils.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShow() {
    // 检查本地缓存状态
    const cacheCleared = wx.getStorageSync('cdnCacheCleared') || false;
    this.setData({ cacheCleared });
  },

  // 清除CDN缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除CDN缓存数据吗？这将重新加载最新数据。',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的CDN缓存标记
          wx.removeStorageSync('cdnCacheCleared');
          wx.removeStorageSync('constellationCache');
          wx.removeStorageSync('dailySudokuCache');
          wx.removeStorageSync('hotToolsCache');
          
          this.setData({ cacheCleared: false });
          utils.showSuccess('缓存已清除');
        }
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '随身工具宝 - 关于我们',
      path: '/pages/about/about'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '随身工具宝 - 关于我们',
      query: 'about'
    }
  },

  // 添加到我的小程序（收藏功能）
  addToFavorite() {
    if (wx.addShortcut) {
      wx.addShortcut({
        success: (res) => {
          utils.showSuccess('已添加到我的小程序');
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('cancel')) {
            utils.showText('已取消收藏');
          } else {
            utils.showText('收藏功能暂不可用');
          }
        }
      });
    } else {
      utils.showAlert({
        title: '收藏小程序',
        content: '请在微信首页下拉，找到小程序后长按选择「添加到我的小程序」',
        confirmText: '知道了'
      });
    }
  }
});
