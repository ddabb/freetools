// mine.js
const utils = require('../../utils/index');

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
    
    // 显示分享按钮
    utils.showShareMenu({
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

    utils.showText(`${item.title}功能开发中`)
  },

  // 打开GitHub链接
  openGitHub() {
    wx.setClipboardData({
      data: 'https://github.com/ddabb/freetools.git',
      success: () => {
        utils.showSuccess('GitHub地址已复制到剪贴板')
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
  },

  // 添加到我的小程序（收藏功能）
  addToFavorite() {
    // 检查是否支持添加到我的小程序功能
    if (wx.addShortcut) {
      wx.addShortcut({
        success: (res) => {
          console.log('添加到我的小程序成功', res)
          utils.showSuccess('已添加到我的小程序')
        },
        fail: (err) => {
          console.error('添加到我的小程序失败', err)
          // 如果API不支持或用户取消，给出友好提示
          if (err.errMsg && err.errMsg.includes('cancel')) {
            utils.showText('已取消收藏')
          } else {
            utils.showText('收藏功能暂不可用')
          }
        }
      })
    } else {
      // 兼容处理：如果API不存在，引导用户手动操作
      utils.showAlert({
        title: '收藏小程序',
        content: '请在微信首页下拉，找到小程序后长按选择「添加到我的小程序」',
        confirmText: '知道了'
      })
    }
  },

  // 跳转到版本日志页
  goToChangelog() {
    wx.navigateTo({
      url: '/pages/changelog/changelog',
      fail: () => {
        utils.showText('页面跳转失败')
      }
    })
  }
})