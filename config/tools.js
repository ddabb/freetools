// 工具配置文件
// 统一管理所有工具的信息，便于维护和扩展

const tools = [
  {
    id: 'mortgage',
    name: '房贷计算器',
    icon: '🏠',
    color: 'blue',
    url: '/pages/mortgage/mortgage',
    categories: ['财务工具'],
    keywords: ['房贷', '贷款', '计算', '房屋'],
    description: '计算房贷月供、利息和还款总额'
  },
  {
    id: 'life-countdown',
    name: '人生倒计时',
    icon: '⏰',
    color: 'green',
    url: '/pages/life-countdown/life-countdown',
    categories: ['生活工具'],
    keywords: ['倒计时', '人生', '日期', '剩余'],
    description: '计算人生已过天数和剩余寿命'
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    icon: '📱',
    color: 'orange',
    url: '/pages/qrcode/qrcode',
    categories: ['安全工具'],
    keywords: ['二维码', '生成', '码', '扫码'],
    description: '生成文本和链接的二维码'
  },
  {
    id: 'unit-converter',
    name: '单位换算',
    icon: '🔄',
    color: 'purple',
    url: '/pages/unit-converter/unit-converter',
    categories: ['学习工具', '生活工具'],
    keywords: ['单位', '换算', '转换', '长度'],
    description: '各种单位的快速换算'
  },
  {
    id: 'health-calculator',
    name: '健康计算',
    icon: '💪',
    color: 'teal',
    url: '/pages/health-calculator/health-calculator',
    categories: ['健康工具'],
    keywords: ['健康', 'BMI', '体重', '身高'],
    description: '计算BMI和健康指标'
  },
  {
    id: 'calendar',
    name: '万年历',
    icon: '📅',
    color: 'red',
    url: '/pages/calendar/calendar',
    categories: ['生活工具', '学习工具'],
    keywords: ['日历', '万年历', '日期', '农历'],
    description: '查看日历和农历日期'
  },
  {
    id: 'time-tool',
    name: '时间工具',
    icon: '⏱️',
    color: 'yellow',
    url: '/pages/time-tool/time-tool',
    categories: ['生活工具'],
    keywords: ['时间', '秒表', '计时器', '时区'],
    description: '秒表、计时器和时区转换'
  },
  {
    id: 'password-generator',
    name: '密码生成',
    icon: '🔒',
    color: 'gray',
    url: '/pages/password-generator/password-generator',
    categories: ['安全工具'],
    keywords: ['密码', '生成', '安全', '随机'],
    description: '生成安全的随机密码'
  },
  {
    id: 'idcard',
    name: '身份证验证',
    icon: '🆔',
    color: 'blue',
    url: '/pages/idcard/idcard',
    categories: ['安全工具'],
    keywords: ['身份证', '验证', '身份', '校验'],
    description: '验证身份证号码的有效性'
  },
  {
    id: 'exchange-rate',
    name: '汇率计算',
    icon: '💱',
    color: 'blue',
    url: '/pages/exchange-rate/exchange-rate',
    categories: ['财务工具'],
    keywords: ['汇率', '货币', '换算', '外币'],
    description: '各种货币之间的汇率换算'
  },
  {
    id: 'color-picker',
    name: '取色器',
    icon: '🎨',
    color: 'orange',
    url: '/pages/color-picker/color-picker',
    categories: ['学习工具'],
    keywords: ['颜色', '取色', 'HEX', 'RGB'],
    description: '拾取和转换颜色值'
  },
  {
    id: 'text-counter',
    name: '字数统计',
    icon: '📝',
    color: 'purple',
    url: '/pages/text-counter/text-counter',
    categories: ['学习工具', '生活工具'],
    keywords: ['字数', '统计', '文本', '字符'],
    description: '统计文本的字数和字符数'
  },
  {
    id: 'tax-calculator',
    name: '个税计算',
    icon: '💰',
    color: 'green',
    url: '/pages/tax-calculator/tax-calculator',
    categories: ['财务工具'],
    keywords: ['个税', '税收', '计算', '工资'],
    description: '计算个人所得税'
  },
  {
    id: 'weather',
    name: '天气查询',
    icon: '🌤️',
    color: 'teal',
    url: '/pages/weather/weather',
    categories: ['生活工具'],
    keywords: ['天气', '气温', '预报', '雨'],
    description: '查询实时天气和预报'
  },
  {
    id: 'note',
    name: '便签',
    icon: '📋',
    color: 'yellow',
    url: '/pages/note/note',
    categories: ['生活工具', '学习工具'],
    keywords: ['便签', '笔记', '备忘', '记录'],
    description: '记录和管理便签信息'
  },
  {
    id: 'calculator',
    name: '计算器',
    icon: '🧮',
    color: 'gray',
    url: '/pages/calculator/calculator',
    categories: ['学习工具'],
    keywords: ['计算', '数学', '运算', '加减'],
    description: '基本的数学计算器'
  },
  {
    id: 'stopwatch',
    name: '秒表',
    icon: '⏱️',
    color: 'red',
    url: '/pages/stopwatch/stopwatch',
    categories: ['生活工具'],
    keywords: ['秒表', '计时', '时间', '测量'],
    description: '精确的秒表计时工具'
  },
  {
    id: 'distance',
    name: '距离测量',
    icon: '📏',
    color: 'blue',
    url: '/pages/distance/distance',
    categories: ['生活工具'],
    keywords: ['距离', '测量', '地图', '长度'],
    description: '测量两点之间的距离'
  },
  {
    id: 'area-converter',
    name: '面积换算',
    icon: '🔲',
    color: 'purple',
    url: '/pages/area-converter/area-converter',
    categories: ['学习工具', '生活工具'],
    keywords: ['面积', '换算', '平方米', '亩'],
    description: '各种面积单位的换算'
  },
  {
    id: 'volume-converter',
    name: '体积换算',
    icon: '📦',
    color: 'orange',
    url: '/pages/volume-converter/volume-converter',
    categories: ['学习工具'],
    keywords: ['体积', '容量', '换算', '升'],
    description: '各种体积和容量单位的换算'
  },
  {
    id: 'weight-converter',
    name: '重量换算',
    icon: '⚖️',
    color: 'green',
    url: '/pages/weight-converter/weight-converter',
    categories: ['学习工具'],
    keywords: ['重量', '质量', '换算', '公斤'],
    description: '各种重量单位的换算'
  },
  {
    id: 'speed-converter',
    name: '速度换算',
    icon: '🏃',
    color: 'red',
    url: '/pages/speed-converter/speed-converter',
    categories: ['学习工具'],
    keywords: ['速度', '换算', '公里', '英里'],
    description: '各种速度单位的换算'
  },
  {
    id: 'temperature-converter',
    name: '温度换算',
    icon: '🌡️',
    color: 'teal',
    url: '/pages/temperature-converter/temperature-converter',
    categories: ['学习工具', '生活工具'],
    keywords: ['温度', '换算', '摄氏', '华氏'],
    description: '各种温度单位的换算'
  },
  {
    id: 'data-converter',
    name: '数据换算',
    icon: '💾',
    color: 'gray',
    url: '/pages/data-converter/data-converter',
    categories: ['学习工具'],
    keywords: ['数据', '存储', '换算', 'MB'],
    description: '各种数据存储单位的换算'
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
