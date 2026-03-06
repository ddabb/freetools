// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
const { commonTools, categories, searchTools } = require('../../config/tools.js');

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    commonTools: commonTools,
    categories: categories.map(cat => {
      return {
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        description: cat.description,
        url: `/pages/discover/discover?category=${cat.name}`,
        keywords: []
      };
    }),
    // 搜索相关
    searchText: '',
    filteredTools: [],
    filteredCategories: [],
    showSearchResult: false
  },

  onLoad() {
    // 加载缓存的用户信息
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
    }
  },

  // 搜索输入处理
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase();
    this.setData({
      searchText,
      showSearchResult: searchText.length > 0
    });

    if (searchText === '') {
      // 搜索为空，显示默认列表
      this.setData({
        filteredTools: [],
        filteredCategories: []
      });
    } else {
      // 使用统一配置的搜索功能
      const allTools = searchTools(searchText);
      const filteredTools = allTools.filter(tool =>
        commonTools.some(ct => ct.id === tool.id)
      );

      // 过滤分类
      const filteredCategories = this.data.categories.filter(category => {
        return category.name.toLowerCase().includes(searchText);
      });

      this.setData({
        filteredTools,
        filteredCategories
      });
    }
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      searchText: '',
      filteredTools: [],
      filteredCategories: [],
      showSearchResult: false
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    const nickName = this.data.userInfo.nickName;
    const userInfo = Object.assign({}, this.data.userInfo, {
      avatarUrl: avatarUrl
    });
    this.setData({
      userInfo: userInfo,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    this.saveUserInfo(userInfo);
  },

  // 输入昵称
  onInputChange(e) {
    const nickName = e.detail.value;
    const avatarUrl = this.data.userInfo.avatarUrl;
    const userInfo = Object.assign({}, this.data.userInfo, {
      nickName: nickName
    });
    this.setData({
      userInfo: userInfo,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    this.saveUserInfo(userInfo);
  },

  // 保存用户信息到本地存储
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  },

  // 获取用户资料
  getUserProfile() {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        this.saveUserInfo(userInfo);
      }
    });
  },

  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '实用工具箱 - 生活中必备的实用工具',
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '实用工具箱 - 生活中必备的实用工具',
      imageUrl: ''
    }
  }
})
