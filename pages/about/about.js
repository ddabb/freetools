// mine.js

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 根据平台导入相应的模块
let share;
if (isHarmonyOS) {
  share = require('@system.share');
}

// 平台兼容分享方法
const sharePlatform = {
  // 显示分享菜单
  showShareMenu: function(options) {
    if (isHarmonyOS && share) {
      // 鸿蒙系统分享处理
      share.show({
        type: 'share',
        success: () => {
          console.log('鸿蒙系统分享菜单显示成功');
        },
        fail: (err) => {
          console.error('鸿蒙系统分享菜单显示失败', err);
        }
      });
    } else {
      // 微信小程序分享
      wx.showShareMenu({
        withShareTicket: options.withShareTicket,
        menus: options.menus
      });
    }
  }
};

Page({
  data: {
    // 无登录态，固定展示
    menuList: [],
    // ICP备案信息
    icpInfo: {
      number: '粤ICP备2026023418号'
    }
  },

  onLoad() {
    // 无需加载用户信息或统计，直接使用 wxml 固定数据
    
    // 初始化平台分享功能
    this.sharePlatform = sharePlatform;
    
    // 显示分享按钮
    this.sharePlatform.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShow() {
    // 无需刷新用户数据
  },

  onMenuTap(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.menuList[index]

    wx.showToast({
      title: `${item.title}功能开发中`,
      icon: 'none'
    })
  },

  // 打开GitHub链接
  openGitHub() {
    wx.setClipboardData({
      data: 'https://github.com/ddabb/freetools.git',
      success: () => {
        wx.showToast({
          title: 'GitHub地址已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '实用工具箱 - 关于我们',
      path: '/pages/about/about'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '实用工具箱 - 关于我们',
      query: 'about'
    }
  }
})