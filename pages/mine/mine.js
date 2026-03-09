// mine.js
Page({
  data: {
    // 无登录态，固定展示
    menuList: []
  },

  onLoad() {
    // 无需加载用户信息或统计，直接使用 wxml 固定数据
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
      title: '实用工具箱',
      path: '/pages/mine/mine',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '实用工具箱',
      imageUrl: ''
    }
  }
})