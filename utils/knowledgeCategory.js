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
  getCategoryClass
};
