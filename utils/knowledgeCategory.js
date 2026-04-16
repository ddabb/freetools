// CDN 主题配置（按 className 索引梯度）
const CDN_THEME_URL = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know-category-theme.json';
const CACHE_KEY_THEME = 'cdn_know_theme';
const CACHE_KEY_THEME_TS = 'cdn_know_theme_ts';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天

// 默认梯度兜底（与 wxss 硬编码一致）
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';

// 内存缓存
let _themeMap = null;   // { className: gradient }
let _themeVersion = '';

function _loadThemeFromStorage() {
  try {
    const raw = wx.getStorageSync(CACHE_KEY_THEME);
    if (raw) return raw;
  } catch (e) {}
  return null;
}

function _saveThemeToStorage(data) {
  try {
    wx.setStorageSync(CACHE_KEY_THEME, data);
    wx.setStorageSync(CACHE_KEY_THEME_TS, Date.now());
  } catch (e) {}
}

/**
 * 加载主题配置（Storage → CDN）
 * @param {Function} onReady 加载完成回调，传入 { version, categories }
 */
function loadTheme(onReady) {
  // 1. 内存缓存
  if (_themeMap) {
    onReady({ version: _themeVersion, categories: _themeMap });
    return;
  }

  // 2. Storage 缓存
  const cached = _loadThemeFromStorage();
  if (cached) {
    _themeMap = cached.categories || {};
    _themeVersion = cached.version || '';
    onReady({ version: _themeVersion, categories: _themeMap });
  }

  // 3. 静默拉取 CDN（永不让用户等待）
  wx.request({
    url: CDN_THEME_URL,
    success(res) {
      if (res.statusCode === 200 && res.data && res.data.categories) {
        _themeMap = res.data.categories;
        _themeVersion = res.data.version || '';
        _saveThemeToStorage(res.data);
        onReady({ version: _themeVersion, categories: _themeMap });
      }
    },
    fail() {
      // 网络失败时用内存兜底（空 map → 用默认梯度）
      if (!_themeMap) _themeMap = {};
    }
  });
}

/**
 * 根据 className 获取渐变样式
 * @param {string} className
 * @returns {string} CSS background 值
 */
function getCategoryGradient(className) {
  if (_themeMap && _themeMap[className]) {
    return _themeMap[className].gradient || DEFAULT_GRADIENT;
  }
  return DEFAULT_GRADIENT;
}

const DEFAULT_CATEGORY_META = {
  icon: '📚',
  className: 'category-uncategorized'
};

const CATEGORY_META_MAP = {
  '产品研发': { icon: '🧩', className: 'category-product-design' },
  '产品使用': { icon: '📖', className: 'category-product-usage' },
  '产品设计': { icon: '💡', className: 'category-product-design' },
  '产品思考': { icon: '🧠', className: 'category-product-thinking' },
  '开发实践': { icon: '🔧', className: 'category-dev-practice' },
  '开发者故事': { icon: '💻', className: 'category-dev-story' },
  '软考': { icon: '🎓', className: 'category-soft-exam' },
  '综合知识': { icon: '📘', className: 'category-soft-exam' },
  '项目管理': { icon: '📋', className: 'category-project-mgmt' },
  '引论': { icon: '🧭', className: 'category-soft-exam' },
  '软考备考': { icon: '🎯', className: 'category-soft-exam' },
  '信息系统开发': { icon: '💻', className: 'category-dev-practice' },
  '工具与技术': { icon: '🛠️', className: 'category-dev-practice' },
  '数据流向图': { icon: '🗺️', className: 'category-dev-practice' },
  '系统集成基础': { icon: '🧱', className: 'category-dev-practice' },
  '法律法规与标准': { icon: '📜', className: 'category-legal' },
  '计算题专项': { icon: '🧮', className: 'category-calculation' },
  '项目立项管理': { icon: '🚀', className: 'category-project-mgmt' },
  '项目整合管理': { icon: '🧩', className: 'category-project-mgmt' },
  '项目范围管理': { icon: '🎯', className: 'category-project-mgmt' },
  '项目进度管理': { icon: '⏱️', className: 'category-project-mgmt' },
  '项目成本管理': { icon: '💰', className: 'category-project-mgmt' },
  '项目质量管理': { icon: '✅', className: 'category-project-mgmt' },
  '项目资源管理': { icon: '👥', className: 'category-project-mgmt' },
  '项目沟通管理': { icon: '💬', className: 'category-project-mgmt' },
  '项目风险管理': { icon: '⚠️', className: 'category-project-mgmt' },
  '项目采购管理': { icon: '🛒', className: 'category-project-mgmt' },
  '项目相关方管理': { icon: '🤝', className: 'category-project-mgmt' },
  '项目经理的角色': { icon: '👔', className: 'category-project-mgmt' },
  '项目运行环境': { icon: '🌐', className: 'category-project-mgmt' },
  '生活通识': { icon: '🏡', className: 'category-safety' },
  '安全防范': { icon: '🛡️', className: 'category-safety' },
  '急救知识': { icon: '🩺', className: 'category-safety' },
  '自然灾害': { icon: '🌪️', className: 'category-safety' },
  '法律常识': { icon: '⚖️', className: 'category-legal' },
  '社保公积金': { icon: '🏠', className: 'category-legal' },
  '心理学': { icon: '🧠', className: 'category-product-thinking' },
  'PMP认证': { icon: '🎓', className: 'category-pmp' },
  '敏捷管理': { icon: '🏃', className: 'category-agile' },
  '未分类': { icon: '📚', className: 'category-uncategorized' }
};

const CATEGORY_RULES = [
  {
    test: category => /^项目.+管理$/.test(category) || category === '项目经理的角色' || category === '项目运行环境',
    meta: { icon: '📋', className: 'category-project-mgmt' }
  },
  {
    test: category => /安全|急救|灾害/.test(category),
    meta: { icon: '🛡️', className: 'category-safety' }
  },
  {
    test: category => /法律|法规|标准|社保|公积金/.test(category),
    meta: { icon: '⚖️', className: 'category-legal' }
  },
  {
    test: category => /计算|算/.test(category),
    meta: { icon: '🧮', className: 'category-calculation' }
  },
  {
    test: category => /系统|技术|开发|数据流向图/.test(category),
    meta: { icon: '🔧', className: 'category-dev-practice' }
  },
  {
    test: category => /备考|引论|软考/.test(category),
    meta: { icon: '🎓', className: 'category-soft-exam' }
  },
  {
    test: category => /心理/.test(category),
    meta: { icon: '🧠', className: 'category-product-thinking' }
  }
];

function getLeafCategoryName(category) {
  if (!category) return '未分类';

  const parts = String(category).split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(category);
}

function getCategoryMeta(category) {
  const leafCategory = getLeafCategoryName(category);

  if (CATEGORY_META_MAP[leafCategory]) {
    return CATEGORY_META_MAP[leafCategory];
  }

  const matchedRule = CATEGORY_RULES.find(rule => rule.test(leafCategory));
  return matchedRule ? matchedRule.meta : DEFAULT_CATEGORY_META;
}

function getCategoryIcon(category) {
  return getCategoryMeta(category).icon;
}

function getCategoryClass(category) {
  return getCategoryMeta(category).className;
}

module.exports = {
  getLeafCategoryName,
  getCategoryMeta,
  getCategoryIcon,
  getCategoryClass,
  getCategoryGradient,
  loadTheme
};
