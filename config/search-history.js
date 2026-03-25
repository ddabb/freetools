// 搜索历史管理
const { setStorage, getStorage, removeStorage } = require('../utils/storage');

// 存储键名
const STORAGE_KEY = 'search_history';

// 最大历史记录数量
const MAX_HISTORY_COUNT = 10;

/**
 * 获取搜索历史
 * @returns {Promise<Array>} 搜索历史列表
 */
async function getSearchHistory() {
  try {
    const history = await getStorage(STORAGE_KEY, []);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

/**
 * 添加搜索历史
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<boolean>} 添加是否成功
 */
async function addSearchHistory(keyword) {
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return false;
  }
  
  try {
    const history = await getSearchHistory();
    
    // 移除重复项
    const filteredHistory = history.filter(item => item !== keyword);
    
    // 添加到开头
    filteredHistory.unshift(keyword);
    
    // 限制数量
    const limitedHistory = filteredHistory.slice(0, MAX_HISTORY_COUNT);
    
    const success = await setStorage(STORAGE_KEY, limitedHistory);
    return success;
  } catch (error) {
    console.error('添加搜索历史失败:', error);
    return false;
  }
}

/**
 * 删除搜索历史
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteSearchHistory(keyword) {
  try {
    const history = await getSearchHistory();
    const filteredHistory = history.filter(item => item !== keyword);
    const success = await setStorage(STORAGE_KEY, filteredHistory);
    return success;
  } catch (error) {
    console.error('删除搜索历史失败:', error);
    return false;
  }
}

/**
 * 清空搜索历史
 * @returns {Promise<boolean>} 清空是否成功
 */
async function clearSearchHistory() {
  try {
    const success = await removeStorage(STORAGE_KEY);
    return success;
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    return false;
  }
}

/**
 * 获取搜索建议
 * @param {string} keyword - 搜索关键词
 * @param {Array} allTools - 工具列表
 * @returns {Array} 搜索建议列表
 */
function getSearchSuggestions(keyword, allTools) {
  if (!keyword || !allTools || !Array.isArray(allTools)) {
    return [];
  }
  
  const lowerKeyword = keyword.toLowerCase();
  const suggestions = new Set();
  
  allTools.forEach(tool => {
    if (tool) {
      // 从工具名称中提取建议
      if (tool.name && tool.name.toLowerCase().includes(lowerKeyword)) {
        suggestions.add(tool.name);
      }
      
      // 从工具关键词中提取建议
      if (tool.keywords && Array.isArray(tool.keywords)) {
        tool.keywords.forEach(key => {
          if (key && key.toLowerCase().includes(lowerKeyword)) {
            suggestions.add(key);
          }
        });
      }
    }
  });
  
  return Array.from(suggestions).slice(0, 5);
}

module.exports = {
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  getSearchSuggestions
};
