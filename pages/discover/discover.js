// discover.js
const { tools, categories } = require('../../config/tools.js');

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
    currentCategory: '',
    tools: tools,
    categories: categories,
    filteredTools: []
  },

  onLoad(options) {
    // 页面加载时执行
    
    // 初始化平台分享功能
    this.sharePlatform = sharePlatform;
    
    // 显示分享按钮
    this.sharePlatform.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    if (options.category) {
      this.setData({
        currentCategory: options.category
      });
      this.filterTools(options.category);
    } else {
      this.setData({
        filteredTools: this.data.tools
      });
    }
  },

  onShow() {
    // 页面显示时执行
  },

  // 根据分类过滤工具
  filterTools(category) {
    const target = category.trim();
    const filtered = this.data.tools.filter(tool => {
      // 精确匹配（忽略前后空格）
      if (tool.categories.some(cat => cat.trim() === target)) {
        return true;
      }
      // 更多工具：不属于任何主分类
      if (target === '更多工具') {
        return !['财务工具', '健康工具', '生活工具', '学习工具', '安全工具'].some(mainCat => 
          tool.categories.some(cat => cat.trim() === mainCat)
        );
      }
      return false;
    });
    this.setData({
      filteredTools: filtered
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '发现页 - 探索更多实用工具',
      path: '/pages/discover/discover'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '发现页 - 探索更多实用工具',
      query: 'discover'
    }
  }
})