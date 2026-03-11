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
    activeCategory: categories.length > 0 ? categories[0].name : '常用工具',
    // 原始数据
    commonTools: commonTools,
    allTools: [],
    // 分类工具数量（预计算）
    categoryToolCounts: {},
    // 当前分类的工具列表（预计算，避免wxml中函数调用问题）
    currentCategoryTools: [],
    // 搜索相关
    searchText: '',
    filteredTools: [],
    filteredCategories: [],
    showSearchResult: false,
    recentTools: [],
    // 动画控制
    _animationResetKey: 0,
    _resetAnimation: false
  },

  // 检测运行环境并初始化平台分享功能
  onReady() {
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
    
    console.log('检测运行环境:', isHarmonyOS ? '鸿蒙系统' : '微信小程序');
    
    // 根据平台初始化分享模块
    let share;
    if (isHarmonyOS) {
      try {
        share = require('@system.share');
        console.log('鸿蒙系统分享模块加载成功');
      } catch (err) {
        console.error('鸿蒙系统分享模块加载失败:', err);
      }
    }
    
    // 平台兼容分享方法
    this.sharePlatform = {
      // 显示分享菜单
      showShareMenu: function(options) {
        console.log('显示分享菜单调用:', isHarmonyOS ? '鸿蒙' : '微信');
        
        if (isHarmonyOS && share) {
          // 鸿蒙系统分享处理 - 使用更标准的参数格式
          console.log('调用鸿蒙分享API');
          share.show({
            type: 'share',
            success: () => {
              console.log('鸿蒙系统分享菜单显示成功');
            },
            fail: (err) => {
              console.error('鸿蒙系统分享菜单显示失败', err);
              // 如果失败，尝试使用微信小程序的分享方式
              console.log('尝试使用微信小程序分享');
              wx.showShareMenu({
                withShareTicket: options.withShareTicket,
                menus: options.menus
              });
            }
          });
        } else {
          // 微信小程序分享
          console.log('调用微信分享API');
          wx.showShareMenu({
            withShareTicket: options.withShareTicket,
            menus: options.menus
          });
        }
      }
    };
    
    // 显示分享按钮
    this.sharePlatform.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 页面加载时执行
  onLoad() {
    // 合并所有工具数据
    this.mergeAllTools();
    // 加载缓存的用户信息
    this.loadUserInfo();
    // 加载最近使用工具
    this.loadRecentTools();
    
    // 初始化当前分类工具列表
    const initialTools = this.getToolsByCategory(this.data.activeCategory);
    this.setData({
      currentCategoryTools: initialTools
    });
  },

  // 合并所有工具数据
  mergeAllTools() {
    // 直接使用从config/tools.js导入的allTools
    if (allTools && Array.isArray(allTools)) {
      this.setData({ allTools: allTools });
      console.log('合并工具完成，总计:', this.data.allTools.length, '个工具');
      // 预计算分类工具数量
      this.calculateCategoryToolCounts();
    } else {
      console.error('工具列表未正确初始化');
    }
  },

  // 预计算分类工具数量
  calculateCategoryToolCounts() {
    const counts = {};
    
    // 计算常用工具数量
    counts['常用工具'] = this.data.commonTools.length;
    console.log('[工具数量] 常用工具数量: %d', counts['常用工具']);
    
    // 计算其他分类工具数量
    this.data.categories.forEach(category => {
      if (category.name !== '常用工具') {
        const count = this.data.allTools.filter(tool => 
          tool.categories && tool.categories.includes(category.name)
        ).length;
        counts[category.name] = count;
        console.log('[工具数量] 分类 "%s" 数量: %d', category.name, count);
      }
    });
    
    this.setData({ categoryToolCounts: counts });
    console.log('[工具数量] 所有分类工具数量计算完成:', counts);
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
    console.log('[分类切换] 目标分类: "%s", 当前分类: "%s"', category, this.data.activeCategory);
    
    if (category === this.data.activeCategory) {
      console.log('[分类切换] 已是当前分类，跳过切换');
      return;
    }
    
    // 检查分类是否存在
    const categoryExists = this.data.categories.some(cat => cat.name === category);
    if (!categoryExists) {
      console.warn('[分类切换] 分类不存在: "%s"', category);
      return;
    }
    
    // 预计算工具数据，避免在wxml中函数调用导致的渲染问题
    const tools = this.getToolsByCategory(category);
    console.log('[分类切换] 预加载工具数据，分类: "%s", 工具数量: %d', category, tools.length);
    
    // 调试：检查当前数据状态
    console.log('[分类切换][调试] 当前showSearchResult: %s, searchText: "%s"', this.data.showSearchResult, this.data.searchText);
    console.log('[分类切换][调试] 当前filteredTools长度: %d, filteredCategories长度: %d', this.data.filteredTools.length, this.data.filteredCategories.length);
    
    // 设置状态 - 关键：先设置activeCategory和currentCategoryTools，再清空其他状态
    this.setData({ 
      activeCategory: category,
      currentCategoryTools: tools
    }, () => {
      // 第二步骤：清空搜索状态，确保显示工具列表而非搜索结果
      this.setData({
        searchText: '',
        showSearchResult: false,
        filteredTools: [],
        filteredCategories: []
      }, () => {
        // 第三步骤：重置动画
        this.resetToolCardAnimations();
        
        // 切换完成后的回调
        console.log('[分类切换] 切换成功，分类: "%s", 工具数量: %d', category, tools.length);
        console.log('[分类切换] 工具列表: [%s]', tools.map(t => t.name).join(', '));
        
        // 调试：检查设置后的数据状态
        console.log('[分类切换][调试] 设置后showSearchResult: %s, searchText: "%s"', this.data.showSearchResult, this.data.searchText);
        console.log('[分类切换][调试] 设置后filteredTools长度: %d, filteredCategories长度: %d', this.data.filteredTools.length, this.data.filteredCategories.length);
        console.log('[分类切换][调试] currentCategoryTools长度: %d', this.data.currentCategoryTools.length);
        
        // 额外调试：手动检查WXML条件
        const shouldShowDefault = !this.data.showSearchResult;
        const shouldShowCommonTools = this.data.activeCategory === '常用工具';
        console.log('[分类切换][调试] WXML条件检查: shouldShowDefault=%s, shouldShowCommonTools=%s', shouldShowDefault, shouldShowCommonTools);
      });
    });
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
    console.log('[工具数量] 查询分类: "%s"', categoryName);
    
    if (categoryName === '常用工具') {
      const count = this.data.commonTools.length;
      console.log('[工具数量] 常用工具数量: %d', count);
      return count;
    }
    
    // 检查allTools是否已加载
    if (!this.data.allTools || this.data.allTools.length === 0) {
      console.log('[工具数量] allTools未加载或为空');
      return 0;
    }
    
    // 使用页面数据中的allTools，确保能正确响应数据变化
    const count = this.data.allTools.filter(tool => 
      tool.categories && tool.categories.includes(categoryName)
    ).length;
    
    console.log('[工具数量] 分类 "%s" 数量: %d', categoryName, count);
    return count;
  },

  // 获取分类下的工具
  getToolsByCategory(categoryName) {
    console.log('[工具查询] 查询分类: "%s"', categoryName);
    if (categoryName === '常用工具') {
      console.log('[工具查询] 返回常用工具: %d 个', this.data.commonTools.length);
      return this.data.commonTools;
    }
    
    // 使用页面数据中的allTools，确保能正确响应数据变化
    const filteredTools = this.data.allTools.filter(tool => 
      tool.categories && tool.categories.includes(categoryName)
    ).sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    
    // 优化日志输出，显示工具名称而不是对象
    const toolNames = filteredTools.map(t => t.name).join(', ');
    console.log('[工具查询] 分类 "%s" 共找到 %d 个工具: [%s]', categoryName, filteredTools.length, toolNames || '无工具');
    
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

  // 重置工具卡片动画状态
  resetToolCardAnimations() {
    console.log('[动画重置] 开始重置工具卡片动画');
    
    // 微信小程序不支持在wx:key中使用表达式，改用直接操作样式的方法
    // 通过设置一个标志位，在WXML中使用条件class来控制动画重置
    this.setData({
      _resetAnimation: true
    }, () => {
      // 使用setTimeout来确保DOM更新后再移除标志位
      setTimeout(() => {
        this.setData({
          _resetAnimation: false
        });
        console.log('[动画重置] 动画重置完成');
      }, 50);
    });
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
      const searchResults = searchTools(searchText);
      const filteredTools = searchResults.filter(tool =>
        this.data.allTools.some(at => at.id === tool.id)  // 使用 this.data.allTools 而不是 allTools
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
      path: '/pages/index/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '免费工具箱 - 精选实用工具集合',
      query: 'index'
    }
  }
})