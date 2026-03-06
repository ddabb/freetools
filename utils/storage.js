// 本地存储工具类

/**
 * 设置本地存储
 * @param {string} key - 键名
 * @param {any} value - 值
 * @returns {boolean}
 */
export function setStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    console.error('存储失败:', e);
    return false;
  }
}

/**
 * 获取本地存储
 * @param {string} key - 键名
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
export function getStorage(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key);
    return value !== '' ? value : defaultValue;
  } catch (e) {
    console.error('获取存储失败:', e);
    return defaultValue;
  }
}

/**
 * 删除本地存储
 * @param {string} key - 键名
 * @returns {boolean}
 */
export function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error('删除存储失败:', e);
    return false;
  }
}

/**
 * 清空本地存储
 * @returns {boolean}
 */
export function clearStorage() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (e) {
    console.error('清空存储失败:', e);
    return false;
  }
}

/**
 * 获取存储信息
 * @returns {object}
 */
export function getStorageInfo() {
  try {
    return wx.getStorageInfoSync();
  } catch (e) {
    console.error('获取存储信息失败:', e);
    return { keys: [], currentSize: 0, limitSize: 0 };
  }
}
