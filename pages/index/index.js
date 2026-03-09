// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
const { commonTools, searchTools, categories, allTools, toolFrequency } = require('../../config/tools.js');



Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    // 分类数据（从config/tools.js导入）
    categories: categories,
    activeCategory: '常用工具',
    // 原始数据
    commonTools: commonTools,
    allTools: [],
    // 搜索相关
    searchText: '',
    filteredTools: [],
    filteredCategories: [],
    showSearchResult: false,
    recentTools: []
  },

  onLoad() {
    // 合并所有工具数据
    this.mergeAllTools();
    // 加载缓存的用户信息
    this.loadUserInfo();
    // 加载最近使用工具
    this.loadRecentTools();
    
    // 调试：检查数据是否正确加载
    setTimeout(() => {
      console.log('=== 调试信息 ===');
      console.log('allTools数量:', this.data.allTools.length);
      console.log('commonTools数量:', this.data.commonTools.length);
      console.log('activeCategory:', this.data.activeCategory);
      
      // 测试财务工具
      const financeTools = this.getToolsByCategory('财务工具');
      console.log('财务工具数量:', financeTools.length);
      console.log('财务工具列表:', financeTools.map(t => ({name: t.name, categories: t.categories})));
    }, 1000);
  },

  // 合并所有工具数据
  mergeAllTools() {
    // 直接使用从config/tools.js导入的allTools
    this.setData({ allTools });
    console.log('合并工具完成，总计:', allTools.length, '个工具');
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

  // 加载最近使用工具
  loadRecentTools() {
    try {
      const recent = wx.getStorageSync('recentTools') || []
      const toolsMap = this.data.allTools.reduce((acc, tool) => {
        acc[tool.id] = tool
        return acc
      }, {})
      
      const validRecentTools = recent
        .filter(item => toolsMap[item.id])
        .slice(0, 5)
        .map(item => toolsMap[item.id])
      
      this.setData({ recentTools: validRecentTools })
    } catch (error) {
      console.error('加载最近使用工具失败:', error)
    }
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    console.log('切换到分类:', category);
    console.log('当前activeCategory:', this.data.activeCategory);
    
    // 直接设置状态，不需要回调
    this.setData({ 
      activeCategory: category,
      searchText: '',
      showSearchResult: false,
      filteredTools: [],
      filteredCategories: []
    });
    
    // 强制刷新视图
    this.setData({});
  },

  // 获取当前分类名称
  getCurrentCategoryName() {
    const category = this.data.categories.find(cat => cat.name === this.data.activeCategory)
    return category ? category.name : ''
  },

  // 获取当前分类描述
  getCurrentCategoryDesc() {
    const category = this.data.categories.find(cat => cat.name === this.data.activeCategory)
    return category ? category.description : ''
  },

  // 获取分类下工具数量
  getCategoryToolCount(categoryName) {
    if (categoryName === '常用工具') return this.data.commonTools.length;
    
    // 直接从this.data.allTools中过滤，保持逻辑一致性
    return this.data.allTools.filter(tool => 
      tool.categories && tool.categories.includes(categoryName)
    ).length;
  },

  // 获取分类下的工具
  getToolsByCategory(categoryName) {
    console.log('获取分类工具:', categoryName);
    if (categoryName === '常用工具') {
      console.log('返回常用工具:', this.data.commonTools.length, '个');
      return this.data.commonTools;
    }
    
    // 直接从this.data.allTools中过滤，因为已经在mergeAllTools中合并了所有工具
    const filteredTools = this.data.allTools.filter(tool => 
      tool.categories && tool.categories.includes(categoryName)
    ).sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    
    console.log('过滤结果:', filteredTools.length, '个工具，分类:', categoryName);
    console.log('工具列表:', filteredTools.map(t => t.name));
    return filteredTools;
  },

  // 获取工具分类样式类名（基于工具的分类返回CSS类名）
  getToolCategory(toolId) {
    const tool = this.data.allTools.find(t => t.id === toolId);
    if (!tool || !tool.categories || tool.categories.length === 0) return 'default';
    
    // 返回第一个分类的名称作为CSS类名（简化处理）
    const mainCategory = tool.categories[0];
    
    // 确保返回有效的CSS类名（只包含字母、数字、连字符）
    return mainCategory.replace(/[^\w\u4e00-\u9fa5-]/g, '');
  },

  // 获取工具使用频率
  getToolFrequency(toolId) {
    const tool = this.data.allTools.find(t => t.id === toolId);
    return tool && tool.frequency !== undefined ? tool.frequency : 50;
  },



  // 搜索输入处理
  onSearchInput(e) {
    const searchText = e.detail.value.trim().toLowerCase()
    this.setData({
      searchText,
      showSearchResult: searchText.length > 0
    });

    if (searchText === '') {
      this.setData({
        filteredTools: [],
        filteredCategories: []
      });
    } else {
      // 使用统一配置的搜索功能
      const allTools = searchTools(searchText);
      const filteredTools = allTools.filter(tool =>
        this.data.allTools.some(at => at.id === tool.id)
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

  // 导航到工具
  navigateToTool(e) {
    const { url } = e.currentTarget.dataset
    const tool = this.data.allTools.find(t => t.url === url)
    
    if (!tool) return
    
    // 记录使用历史
    this.addToRecentTools(tool)
    
    wx.navigateTo({
      url: url,
      fail: () => {
        wx.showToast({
          title: '页面开发中',
          icon: 'none'
        })
      }
    })
  },

  // 添加到最近使用
  addToRecentTools(tool) {
    try {
      let recent = wx.getStorageSync('recentTools') || []
      recent = recent.filter(item => item.id !== tool.id)
      recent.unshift({ 
        id: tool.id,
        name: tool.name, 
        icon: tool.icon,
        url: tool.url,
        timestamp: Date.now() 
      })
      recent = recent.slice(0, 10)
      wx.setStorageSync('recentTools', recent)
      
      // 更新本地显示
      this.loadRecentTools()
    } catch (error) {
      console.error('保存最近使用工具失败:', error)
    }
  },

  // 清空最近使用记录
  clearRecentTools() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空最近使用记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('recentTools')
          this.setData({ recentTools: [] })
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
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
      title: '免费工具箱 - 精选实用工具集合',
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '免费工具箱 - 精选实用工具集合',
      imageUrl: ''
    }
  }
})