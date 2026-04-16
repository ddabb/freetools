/**
 * 工具配置文件 - 主入口（懒加载模式）
 *
 * 加载策略：
 * - 同步加载：commonTools / categories / toolFrequency（首页启动必需）
 * - 懒加载：allTools / searchTools（搜索时才加载 full 依赖树）
 *
 * 这样首页 require() 不再阻塞，tools-full.js + search.js 等重型模块
 * 只有用户触发搜索时才加载。
 */

const common = require('./tools-common');

module.exports = {
  // 同步（无阻塞）
  tools: common.tools,
  categories: common.categories,
  commonTools: common.commonTools,
  toolFrequency: common.toolFrequency,
  getToolFrequency: common.getToolFrequency,
  updateToolFrequency: common.updateToolFrequency,

  // ===== 懒加载：allTools =====
  // 返回值是函数，调用时才同步 require
  // 首页 onLoad → this._allTools = toolsjs.getAllTools()
  getAllTools() {
    const full = require('./tools-full');
    return full.allTools;
  },

  // ===== 懒加载：searchTools =====
  searchTools(keyword) {
    const { searchTools: fn } = require('./search');
    const { allTools } = require('./tools-full');
    return fn(keyword, allTools);
  },

  getToolById(id) {
    const { getToolById: fn } = require('./search');
    const { allTools } = require('./tools-full');
    return fn(id, allTools);
  },

  getToolsByCategory(categoryName) {
    const { getToolsByCategory: fn } = require('./category');
    const { allTools } = require('./tools-full');
    return fn(categoryName, allTools);
  },

  getAllCategories() {
    const { getAllCategories: fn } = require('./category');
    const { allTools } = require('./tools-full');
    return fn(allTools);
  },

  groupToolsByCategory() {
    const { groupToolsByCategory: fn } = require('./category');
    const { allTools } = require('./tools-full');
    return fn(allTools);
  },

  getCategoryStats() {
    const { getCategoryStats: fn } = require('./category');
    const { allTools } = require('./tools-full');
    return fn(allTools);
  },

  getToolFrequencyRanking() {
    const { getToolFrequencyRanking: fn } = require('./frequency');
    const { allTools } = require('./tools-full');
    return fn(allTools);
  },

  // 搜索工具函数
  debounce: null,      // 懒加载包装，见下方
  clearSearchCache: null,
  getSearchHistory: null,
  addSearchHistory: null,
  deleteSearchHistory: null,
  clearSearchHistory: null,
  getSearchSuggestions(keyword) {
    const { getSearchSuggestions: fn } = require('./search');
    const { allTools } = require('./tools-full');
    return fn(keyword, allTools);
  },
};

// ===== 懒加载 debounce 等（访问时再加载）=====
// 注入到 module.exports（已在上方声明 null）
const m = module.exports;

const _lazy = (prop, mod, name) => {
  Object.defineProperty(m, prop, {
    get() {
      const mod = require('./search');
      return mod[name];
    }
  });
};
_lazy('debounce', 'search', 'debounce');
_lazy('clearSearchCache', 'search', 'clearSearchCache');
_lazy('getSearchHistory', 'search', 'getSearchHistory');
_lazy('addSearchHistory', 'search', 'addSearchHistory');
_lazy('deleteSearchHistory', 'search', 'deleteSearchHistory');
_lazy('clearSearchHistory', 'search', 'clearSearchHistory');
