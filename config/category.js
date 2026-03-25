// 分类相关逻辑
const categories = require('./categories');

/**
 * 根据分类获取工具
 * @param {string} categoryName - 分类名称
 * @param {Array} allTools - 工具列表
 * @returns {Array} 分类下的工具列表
 */
function getToolsByCategory(categoryName, allTools) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return [];
  }
  
  return allTools.filter(tool => {
    if (!tool || !tool.categories) return false;
    return tool.categories.includes(categoryName);
  });
}

/**
 * 获取所有分类
 * @param {Array} allTools - 工具列表
 * @returns {Array} 分类列表
 */
function getAllCategories(allTools) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return [];
  }
  
  const categories = new Set();
  allTools.forEach(tool => {
    if (tool && tool.categories && Array.isArray(tool.categories)) {
      tool.categories.forEach(category => {
        categories.add(category);
      });
    }
  });
  
  return Array.from(categories);
}

/**
 * 获取分类信息
 * @param {string} categoryName - 分类名称
 * @returns {Object|null} 分类信息对象
 */
function getCategoryInfo(categoryName) {
  return categories.find(category => category.name === categoryName) || null;
}

/**
 * 按分类分组工具
 * @param {Array} allTools - 工具列表
 * @returns {Object} 按分类分组的工具对象
 */
function groupToolsByCategory(allTools) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return {};
  }
  
  const grouped = {};
  allTools.forEach(tool => {
    if (tool && tool.categories && Array.isArray(tool.categories)) {
      tool.categories.forEach(category => {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(tool);
      });
    }
  });
  
  return grouped;
}

/**
 * 获取分类统计信息
 * @param {Array} allTools - 工具列表
 * @returns {Array} 分类统计信息列表
 */
function getCategoryStats(allTools) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return [];
  }
  
  const stats = [];
  const grouped = groupToolsByCategory(allTools);
  
  Object.entries(grouped).forEach(([categoryName, tools]) => {
    const categoryInfo = getCategoryInfo(categoryName);
    stats.push({
      name: categoryName,
      count: tools.length,
      color: categoryInfo?.color || 'gray',
      icon: categoryInfo?.icon || '📱',
      description: categoryInfo?.description || ''
    });
  });
  
  return stats;
}

module.exports = {
  getToolsByCategory,
  getAllCategories,
  getCategoryInfo,
  groupToolsByCategory,
  getCategoryStats
};

