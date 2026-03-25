/**
 * 分享工具（平台兼容版）
 * 同时支持微信小程序和鸿蒙系统
 */

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 鸿蒙分享API
let share = null;
if (isHarmonyOS) {
  try {
    share = require('@system.share');
  } catch (e) {
    console.warn('鸿蒙分享模块加载失败:', e);
  }
}

/**
 * 默认分享配置
 */
const defaultConfig = {
  title: '实用工具箱',
  desc: '精选实用工具集合',
  path: '/pages/index/index',
  imageUrl: ''
};

/**
 * 分享给好友（生成分享信息对象）
 * @param {object} options - 分享配置 {title, desc, path, imageUrl}
 * @returns {object} 分享信息对象
 */
function shareAppMessage(options = {}) {
  const config = { ...defaultConfig, ...options };
  
  if (isHarmonyOS && share) {
    // 鸿蒙系统 - 返回分享配置（由页面onShareAppMessage使用）
    return {
      title: config.title,
      content: config.desc,
      imageUrl: config.imageUrl,
      path: config.path,
      // 鸿蒙平台分享
      type: 'share',
      success: () => {
        console.log('分享成功');
      },
      fail: (err) => {
        console.error('分享失败', err);
      }
    };
  } else {
    // 微信小程序
    return {
      title: config.title,
      desc: config.desc,
      path: config.path,
      imageUrl: config.imageUrl
    };
  }
}

/**
 * 分享到朋友圈（生成分享信息对象）
 * @param {object} options - 分享配置 {title, imageUrl, query}
 * @returns {object} 分享信息对象
 */
function shareTimeline(options = {}) {
  const config = {
    title: options.title || defaultConfig.title,
    imageUrl: options.imageUrl || defaultConfig.imageUrl,
    query: options.query || ''
  };
  
  // 微信小程序分享到朋友圈
  return {
    title: config.title,
    imageUrl: config.imageUrl,
    query: config.query
  };
}

/**
 * 显示分享菜单（工具方法，实际分享由页面生命周期触发）
 */
function showShareMenu(options = {}) {
  if (isHarmonyOS && share) {
    // 鸿蒙系统
    share.show({
      type: 'share',
      success: () => {
        console.log('分享菜单显示成功');
      },
      fail: (err) => {
        console.error('分享菜单显示失败', err);
      }
    });
  } else {
    // 微信小程序
    wx.showShareMenu({
      withShareTicket: options.withShareTicket || true,
      menus: options.menus || ['shareAppMessage', 'shareTimeline']
    });
  }
}

/**
 * 隐藏分享菜单
 */
function hideShareMenu() {
  if (!isHarmonyOS) {
    wx.hideShareMenu();
  }
}

/**
 * 更新分享信息（用于动态更新分享内容）
 * @param {object} options - 分享配置
 */
function updateShareMenu(options = {}) {
  if (!isHarmonyOS) {
    wx.updateShareMenu({
      withShareTicket: options.withShareTicket || false,
      isPrivateMessage: options.isPrivateMessage || false,
      activityId: options.activityId,
      miniProgramInfo: options.miniProgramInfo
    }).catch(err => {
      console.error('更新分享菜单失败', err);
    });
  }
}

/**
 * 快速生成分享配置（适用于页面生命周期）
 * @param {object} options - 分享配置
 * @returns {object} 包含onShareAppMessage和onShareTimeline的对象
 */
function createShareHandlers(options = {}) {
  return {
    // 分享给好友
    onShareAppMessage: function() {
      return shareAppMessage(options);
    },
    // 分享到朋友圈
    onShareTimeline: function() {
      return shareTimeline(options);
    }
  };
}

module.exports = {
  shareAppMessage,
  shareTimeline,
  showShareMenu,
  hideShareMenu,
  updateShareMenu,
  createShareHandlers
};
