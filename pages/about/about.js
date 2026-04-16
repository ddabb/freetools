// about.js
const utils = require('../../utils/index');

Page({
  data: {
    // 版本号（动态获取）
    version: '',
    // CDN缓存是否已清除
    cacheCleared: false
  },

  onLoad() {
    // 显示分享按钮
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 获取小程序真实版本号
    this.getAppVersion();
  },

  // 获取微信小程序真实版本信息
  getAppVersion() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      const envVersion = accountInfo.miniProgram.envVersion;
      let version = accountInfo.miniProgram.version;

      if (!version) {
        version = envVersion === 'develop' ? '开发版' : envVersion === 'trial' ? '体验版' : '';
      }

      this.setData({ version });
    } catch (error) {
      console.error('[about] 获取版本信息失败:', error);
      this.setData({ version: '' });
    }
  },

  onShow() {
    // 检查本地缓存状态
    const cacheCleared = wx.getStorageSync('cdn_cached') || false;
    this.setData({ cacheCleared });
  },

  // 清除CDN缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除CDN缓存数据吗？这将重新加载最新数据。',
      success: (res) => {
        if (res.confirm) {
          // 清除所有 CDN 缓存（通过前缀识别）
          const keys = wx.getStorageInfoSync().keys || [];
          const cdnKeys = keys.filter(key => key.startsWith('cdn_'));
          cdnKeys.forEach(key => wx.removeStorageSync(key));
          
          this.setData({ cacheCleared: false });
          utils.showSuccess(`已清除 ${cdnKeys.length} 个缓存`);
        }
      }
    });
  },

  // 复制微信公众号名称
  onCopyWechat() {
    wx.setClipboardData({
      data: '随身工具宝',
      success: () => {
        wx.showToast({
          title: '已复制公众号名称',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  // 复制邮箱地址
  onCopyEmail() {
    wx.setClipboardData({
      data: '1011888891@qq.com',
      success: () => {
        wx.showToast({
          title: '已复制邮箱',
          icon: 'success',
          duration: 2000
        });
      }
    });
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
