// utils/changelog-loader.js
// 版本日志加载工具

const cacheManager = require('./cacheManager');
const CDN_URL = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/changelog.json';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_KEY_CHANGELOG = 'cdn_changelog';
const CACHE_KEY_CHANGELOG_TS = 'cdn_changelog_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * 带缓存的请求（内存 → Storage → CDN，支持 304 + LRU）
 * @param {string} cacheKey - 缓存键
 * @param {string} tsKey - 时间戳键
 * @param {string} url - 请求 URL
 * @returns {Promise<Object>} - 返回加载的数据
 */
exports.fetchWithCache = function(cacheKey, tsKey, url) {
  return cacheManager.fetchWithCache({
    cacheKey,
    tsKey,
    url,
    ttl: CACHE_EXPIRE
  });
};

/**
 * 获取微信小程序真实版本信息
 * @returns {string} - 返回版本号
 */
exports.getAppVersion = function() {
  try {
    // 获取小程序账号信息，包含版本信息
    const accountInfo = wx.getAccountInfoSync();
    console.debug('[changelog-loader] 账号信息:', accountInfo);
    
    const envVersion = accountInfo.miniProgram.envVersion;
    console.debug('[changelog-loader] 环境类型:', envVersion);
    
    let version = accountInfo.miniProgram.version;
    console.debug('[changelog-loader] 获取到小程序版本:', version);
    
    // 处理开发版和体验版版本号为空的情况
    if (!version) {
      version = envVersion === 'develop' ? '开发版' : envVersion === 'trial' ? '体验版' : '2.0.0';
      console.debug('[changelog-loader] 使用默认版本:', version);
    }
    
    return version;
  } catch (error) {
    console.error('[changelog-loader] 获取版本信息失败:', error);
    // 如果获取失败，使用默认版本
    return '2.0.0';
  }
};

/**
 * 从 jsDelivr CDN 加载 changelog（带缓存）
 * @returns {Promise<Object>} - 返回版本日志数据
 */
exports.loadChangelog = function() {
  console.debug('[changelog-loader] 开始加载版本日志');
  return exports.fetchWithCache(CACHE_KEY_CHANGELOG, CACHE_KEY_CHANGELOG_TS, CDN_URL);
};