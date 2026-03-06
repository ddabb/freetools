// mine.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    useCount: 0,
    favoriteTools: [],
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
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
      }
    } catch (e) {
      console.error('加载用户信息失败', e)
    }
  },

  loadStats() {
    try {
      const useCount = wx.getStorageSync('useCount') || 0
      const favoriteTools = wx.getStorageSync('favoriteTools') || []
      this.setData({
        useCount,
        favoriteTools
      })
    } catch (e) {
      console.error('加载统计数据失败', e)
    }
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
  }
})