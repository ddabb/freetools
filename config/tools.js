// 工具配置文件
// 统一管理所有工具的信息，便于维护和扩展

const tools = [
  {
    id: 'mortgage',
    name: '房贷计算器',
    icon: '🏠',
    color: 'blue',
    url: '/packages/financial/pages/mortgage/mortgage',
    categories: ['财务工具'],
    keywords: ['房贷', '贷款', '计算', '房屋'],
    description: '计算房贷月供、利息和还款总额'
  },
  {
    id: 'life-countdown',
    name: '人生倒计时',
    icon: '⏰',
    color: 'green',
    url: '/packages/life/pages/life-countdown/life-countdown',
    categories: ['生活工具'],
    keywords: ['倒计时', '人生', '日期', '剩余'],
    description: '计算人生已过天数和剩余寿命'
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    icon: '📱',
    color: 'orange',
    url: '/packages/utility/pages/qrcode/qrcode',
    categories: ['安全工具'],
    keywords: ['二维码', '生成', '码', '扫码'],
    description: '生成文本和链接的二维码'
  },
  {
    id: 'unit-converter',
    name: '单位换算',
    icon: '🔄',
    color: 'purple',
    url: '/packages/utility/pages/unit-converter/unit-converter',
    categories: ['学习工具', '生活工具'],
    keywords: ['单位', '换算', '转换', '长度'],
    description: '各种单位的快速换算'
  },
  {
    id: 'health-calculator',
    name: '健康计算',
    icon: '💪',
    color: 'teal',
    url: '/packages/other/pages/health-calculator/health-calculator',
    categories: ['健康工具'],
    keywords: ['健康', 'BMI', '体重', '身高'],
    description: '计算BMI和健康指标'
  },
  {
    id: 'calendar',
    name: '万年历',
    icon: '📅',
    color: 'red',
    url: '/packages/life/pages/calendar/calendar',
    categories: ['生活工具', '学习工具'],
    keywords: ['日历', '万年历', '日期', '农历'],
    description: '查看日历和农历日期'
  },
  {
    id: 'time-tool',
    name: '时间工具',
    icon: '⏱️',
    color: 'yellow',
    url: '/packages/life/pages/time-tool/time-tool',
    categories: ['生活工具'],
    keywords: ['时间', '秒表', '计时器', '时区'],
    description: '秒表、计时器和时区转换'
  },
  {
    id: 'password-generator',
    name: '密码生成',
    icon: '🔒',
    color: 'gray',
    url: '/packages/utility/pages/password-generator/password-generator',
    categories: ['安全工具'],
    keywords: ['密码', '生成', '安全', '随机'],
    description: '生成安全的随机密码'
  },
  {
    id: 'idcard',
    name: '身份证验证',
    icon: '🆔',
    color: 'blue',
    url: '/packages/utility/pages/idcard/idcard',
    categories: ['安全工具'],
    keywords: ['身份证', '验证', '身份', '校验'],
    description: '验证身份证号码的有效性'
  },
  {
    id: 'price-comparison',
    name: '价格对比',
    icon: '🛒',
    color: 'purple',
    url: '/packages/financial/pages/price-comparison/price-comparison',
    categories: ['财务工具'],
    keywords: ['价格', '对比', '商品', '划算'],
    description: '对比多个商品的单价和性价比'
  },
  {
    id: 'retirementCalculator',
    name: '退休金计算器',
    icon: '💰',
    color: 'green',
    url: '/packages/financial/pages/retirementCalculator/retirementCalculator',
    categories: ['财务工具'],
    keywords: ['退休', '养老金', '储蓄', '计算'],
    description: '计算退休所需的储蓄金额'
  },
  {
    id: 'text-tool',
    name: '文本工具',
    icon: '📝',
    color: 'purple',
    url: '/packages/utility/pages/text-tool/text-tool',
    categories: ['学习工具', '生活工具'],
    keywords: ['文本', '工具', '处理', '转换'],
    description: '文本处理和转换工具'
  },
  {
    id: 'mdconvert',
    name: 'Markdown转换',
    icon: '📄',
    color: 'orange',
    url: '/packages/utility/pages/mdconvert/mdconvert',
    categories: ['学习工具'],
    keywords: ['Markdown', '转换', '文档', '格式'],
    description: 'Markdown文档转换工具'
  },
  {
    id: 'oddEven',
    name: '奇偶判断',
    icon: '🔢',
    color: 'blue',
    url: '/packages/utility/pages/oddEven/oddEven',
    categories: ['学习工具'],
    keywords: ['奇数', '偶数', '判断', '数字'],
    description: '判断数字的奇偶性'
  },
  {
    id: 'leapyear',
    name: '闰年判断',
    icon: '📅',
    color: 'green',
    url: '/packages/utility/pages/leapyear/leapyear',
    categories: ['学习工具'],
    keywords: ['闰年', '判断', '年份', '日历'],
    description: '判断是否为闰年'
  },
  {
    id: 'onlychinese',
    name: '中文检测',
    icon: '🇨🇳',
    color: 'red',
    url: '/packages/utility/pages/onlychinese/onlychinese',
    categories: ['学习工具'],
    keywords: ['中文', '检测', '汉字', '识别'],
    description: '检测文本中是否包含中文'
  },
  {
    id: 'battery-health',
    name: '电池健康',
    icon: '🔋',
    color: 'green',
    url: '/packages/life/pages/battery-health/battery-health',
    categories: ['生活工具'],
    keywords: ['电池', '健康', '电量', '检测'],
    description: '查看设备电池健康状态'
  },
  {
    id: 'datediff',
    name: '日期差计算',
    icon: '📆',
    color: 'teal',
    url: '/packages/life/pages/datediff/datediff',
    categories: ['生活工具'],
    keywords: ['日期', '差', '计算', '天数'],
    description: '计算两个日期之间的天数差'
  },
  {
    id: 'travel-tool',
    name: '旅行工具',
    icon: '✈️',
    color: 'blue',
    url: '/packages/other/pages/travel-tool/travel-tool',
    categories: ['生活工具'],
    keywords: ['旅行', '工具', '行程', '规划'],
    description: '旅行规划和辅助工具'
  }
];

// 工具分类
const categories = [
  { name: '财务工具', color: 'blue', icon: '💰', description: '房贷、汇率、个税等财务计算' },
  { name: '健康工具', color: 'green', icon: '💪', description: 'BMI、健康指标计算' },
  { name: '生活工具', color: 'orange', icon: '🏠', description: '日历、天气、计时等生活工具' },
  { name: '学习工具', color: 'purple', icon: '📚', description: '单位换算、计算器等学习工具' },
  { name: '安全工具', color: 'red', icon: '🔒', description: '密码生成、身份证验证等安全工具' },
  { name: '更多工具', color: 'teal', icon: '📱', description: '更多实用工具' }
];

// 常用工具（首页显示）
const commonTools = [
  tools[0],  // 房贷计算器
  tools[1],  // 人生倒计时
  tools[2],  // 二维码生成
  tools[3],  // 单位换算
  tools[4],  // 健康计算
  tools[5],  // 万年历
  tools[6],  // 时间工具
  tools[7],  // 密码生成
  tools[8]   // 身份证验证
];

// 根据分类获取工具
function getToolsByCategory(categoryName) {
  return tools.filter(tool => tool.categories.includes(categoryName));
}

// 根据关键词搜索工具
function searchTools(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return tools.filter(tool => {
    return tool.name.toLowerCase().includes(lowerKeyword) ||
           tool.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
           tool.description.toLowerCase().includes(lowerKeyword);
  });
}

// 根据ID获取工具
function getToolById(id) {
  return tools.find(tool => tool.id === id);
}

// 导出模块
module.exports = {
  tools,
  categories,
  commonTools,
  getToolsByCategory,
  searchTools,
  getToolById
};
