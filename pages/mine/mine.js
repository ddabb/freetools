// mine.js
Page({
  data: {
    // 无登录态，固定展示
    menuList: [
      {
        icon: '⭐',
        title: '我的收藏',
        url: ''
      },
      {
        icon: '📊',
        title: '使用统计',
        url: ''
      },
      {
        icon: '⚙️',
        title: '设置',
        url: ''
      },
      {
        icon: '❓',
        title: '关于我们',
        url: ''
      }
    ]
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

  onShareTap() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  onFeedbackTap() {
    wx.showToast({
      title: '反馈功能开发中',
      icon: 'none'
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