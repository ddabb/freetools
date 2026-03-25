// 搜索相关函数
const { getSearchHistory, addSearchHistory, deleteSearchHistory, clearSearchHistory, getSearchSuggestions } = require('./search-history');

// 搜索结果缓存
const searchCache = new Map();

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 根据关键词搜索工具
 * @param {string} keyword - 搜索关键词
 * @param {Array} allTools - 工具列表
 * @returns {Array} 搜索结果
 */
function searchTools(keyword, allTools) {
  // 检查缓存
  if (searchCache.has(keyword)) {
    console.log('[搜索] 从缓存获取结果:', keyword);
    return searchCache.get(keyword);
  }
  
  const lowerKeyword = keyword.toLowerCase();
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return [];
  }
  
  // 添加调试信息
  console.log('[搜索] 搜索关键词:', keyword);
  console.log('[搜索] 总工具数量:', allTools.length);
  
  const results = allTools.filter(tool => {
    if (!tool) return false;
    
    const nameMatch = tool.name && tool.name.toLowerCase().includes(lowerKeyword);
    const descriptionMatch = tool.description && tool.description.toLowerCase().includes(lowerKeyword);
    const keywordsMatch = tool.keywords && Array.isArray(tool.keywords) && tool.keywords.some(k => 
      k && k.toLowerCase().includes(lowerKeyword)
    );
    
    const match = nameMatch || keywordsMatch || descriptionMatch;
    
    if (match) {
      console.log('[搜索匹配] 工具:', tool.name, '关键词:', keyword, 
        'nameMatch:', nameMatch, 'descMatch:', descriptionMatch, 'keywordsMatch:', keywordsMatch);
    }
    
    return match;
  });
  
  // 缓存搜索结果
  searchCache.set(keyword, results);
  
  // 限制缓存大小
  if (searchCache.size > 50) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  
  // 添加到搜索历史
  addSearchHistory(keyword);
  
  console.log('[搜索] 搜索结果数量:', results.length);
  console.log('[搜索] 匹配工具:', results.map(t => t.name).join(', '));
  
  return results;
}

/**
 * 清除搜索缓存
 */
function clearSearchCache() {
  searchCache.clear();
  console.log('[搜索] 缓存已清除');
}

/**
 * 根据ID获取工具
 * @param {string} id - 工具ID
 * @param {Array} allTools - 工具列表
 * @returns {Object|null} 工具对象或null
 */
function getToolById(id, allTools) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return null;
  }
  
  return allTools.find(tool => {
    if (!tool) return false;
    return tool.id === id;
  });
}

module.exports = {
  searchTools,
  getToolById,
  debounce,
  clearSearchCache,
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  getSearchSuggestions
};


