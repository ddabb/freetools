// 工具配置文件
// 统一管理所有工具的信息，便于维护和扩展

// 工具频率数据
const toolFrequency = {
  'mortgage': 95,           // 房贷计算器
  'life-countdown': 92,     // 人生A4纸
  'battery-health': 88,     // 电池健康
  'qrcode': 85,             // 二维码生成
  'time-tool': 78,          // 时间工具
  'health-calculator': 75,  // 健康计算
  'calendar': 72,           // 万年历
  'password-generator': 68, // 密码生成
  'idcard': 65,             // 身份证验证
  'price-comparison': 62,   // 价格对比
  'retirementCalculator': 58, // 退休金计算器
  'text-tool': 55,          // 文本工具
  'mdconvert': 52,          // Markdown转换
  'oddEven': 48,            // 奇偶判断
  'leapyear': 45,           // 闰年判断
  'onlychinese': 42,        // 中文检测
  'travel-tool': 38,        // 旅行工具
  'datediff': 35,           // 日期差计算
  'relative-calculator': 50, // 亲戚计算器
  'gcd-lcm': 60,            // 公约数·公倍数
  'prime-factorization': 58, // 质因数分解
  '24point': 56,            // 24点速算
  'base-converter': 54,      // 整数基转换器
  'json-xml-converter': 52,  // JSON·XML转换器
  'yaml-json-converter': 50, // YAML·JSON转换器
  'regex-tester': 48,        // 正则表达式测试
  'word-counter': 46,        // 字数统计器
  'markdown-preview': 44,    // Markdown预览器
  'text-diff': 42,           // 文本对比工具
  'data-analyzer': 40,       // 数据统计器
  'chart-generator': 38,     // 图表生成器
  'timestamp-converter': 36,  // 时间戳转换器
  'color-converter': 34,     // 颜色转换器
  'avatar-generator': 45,     // 汉字头像生成
  'emoji-to-png': 42,        // Emoji转PNG
  'text-to-png': 40,          // 文本转图片
  'copywriting': 80            // 文案工具
};

const tools = [
  {
    id: 'length-converter',
    name: '长度换算',
    icon: '📏',
    color: 'blue',
    url: '/packages/unit/pages/length-converter/length-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['长度', '单位', '换算', '转换'],
    description: '各种长度单位的快速换算'
  },
  {
    id: 'weight-converter',
    name: '重量换算',
    icon: '⚖️',
    color: 'green',
    url: '/packages/unit/pages/weight-converter/weight-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['重量', '单位', '换算', '转换'],
    description: '各种重量单位的快速换算'
  },
  {
    id: 'temperature-converter',
    name: '温度换算',
    icon: '🌡️',
    color: 'red',
    url: '/packages/unit/pages/temperature-converter/temperature-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['温度', '单位', '换算', '转换'],
    description: '各种温度单位的快速换算'
  },
  {
    id: 'area-converter',
    name: '面积换算',
    icon: '📐',
    color: 'purple',
    url: '/packages/unit/pages/area-converter/area-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['面积', '单位', '换算', '转换'],
    description: '各种面积单位的快速换算'
  },
  {
    id: 'volume-converter',
    name: '体积换算',
    icon: '📦',
    color: 'orange',
    url: '/packages/unit/pages/volume-converter/volume-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['体积', '单位', '换算', '转换'],
    description: '各种体积单位的快速换算'
  },
  {
    id: 'time-converter',
    name: '时间换算',
    icon: '⏰',
    color: 'teal',
    url: '/packages/unit/pages/time-converter/time-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['时间', '单位', '换算', '转换'],
    description: '各种时间单位的快速换算'
  },
  {
    id: 'mortgage',
    name: '房贷计算器',
    icon: '🏠',
    color: 'blue',
    url: '/packages/financial/pages/mortgage/mortgage',
    categories: ['财务工具'],
    keywords: ['房贷', '贷款', '计算', '房屋'],
    description: '计算房贷月供、利息和还款总额',
    frequency: toolFrequency['mortgage']
  },
  {
    id: 'life-countdown',
    name: '人生A4纸',
    icon: '⏰',
    color: 'green',
    url: '/packages/life/pages/life-countdown/life-countdown',
    categories: ['生活工具'],
    keywords: [ '人生', '日期', '剩余'],
    description: '计算人生已过天数和剩余寿命',
    frequency: toolFrequency['life-countdown']
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    icon: '📱',
    color: 'orange',
    url: '/packages/utility/pages/qrcode/qrcode',
    categories: ['安全工具'],
    keywords: ['二维码', '生成', '码', '扫码'],
    description: '生成文本和链接的二维码',
    frequency: toolFrequency['qrcode']
  },

  {
    id: 'health-calculator',
    name: '健康计算',
    icon: '💪',
    color: 'teal',
    url: '/packages/health/pages/health-calculator/health-calculator',
    categories: ['健康工具'],
    keywords: ['健康', 'BMI', '体重', '身高'],
    description: '计算BMI和健康指标',
    frequency: toolFrequency['health-calculator']
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
    url: '/packages/text/pages/password-generator/password-generator',
    categories: ['安全工具'],
    keywords: ['密码', '生成', '安全', '随机'],
    description: '生成安全的随机密码'
  },
  {
    id: 'idcard',
    name: '身份证验证',
    icon: '🆔',
    color: 'blue',
    url: '/packages/life/pages/idcard/idcard',
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
    url: '/packages/text/pages/text-tool/text-tool',
    categories: ['学习工具', '生活工具'],
    keywords: ['文本', '工具', '处理', '转换'],
    description: '文本处理和转换工具'
  },
  {
    id: 'mdconvert',
    name: 'Markdown转换',
    icon: '📄',
    color: 'orange',
    url: '/packages/text/pages/mdconvert/mdconvert',
    categories: ['学习工具'],
    keywords: ['Markdown', '转换', '文档', '格式'],
    description: 'Markdown文档转换工具'
  },
  {
    id: 'oddEven',
    name: '奇偶判断',
    icon: '🔢',
    color: 'blue',
    url: '/packages/math/pages/oddEven/oddEven',
    categories: ['学习工具', '数学工具'],
    keywords: ['奇数', '偶数', '判断', '数字'],
    description: '判断数字的奇偶性'
  },
  {
    id: 'leapyear',
    name: '闰年判断',
    icon: '📅',
    color: 'green',
    url: '/packages/life/pages/leapyear/leapyear',
    categories: ['学习工具'],
    keywords: ['闰年', '判断', '年份', '日历'],
    description: '判断是否为闰年'
  },
  {
    id: 'onlychinese',
    name: '中文检测',
    icon: '✍',
    color: 'red',
    url: '/packages/text/pages/onlychinese/onlychinese',
    categories: ['学习工具'],
    keywords: ['中文', '检测', '汉字', '识别'],
    description: '检测文本中是否包含中文'
  },
  {
    id: 'travel-tool',
    name: '旅行工具',
    icon: '✈️',
    color: 'blue',
    url: '/packages/travel/pages/travel-tool/travel-tool',
    categories: ['更多工具', '生活工具'],
    keywords: ['旅行', '工具', '行程', '规划'],
    description: '旅行规划和辅助工具'
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
  // 数学工具分类开始
  {
    id: 'gcd-lcm',
    name: '公约数·公倍数',
    icon: '🔢',
    color: 'indigo',
    url: '/packages/math/pages/gcd-lcm/gcd-lcm',
    categories: ['学习工具', '数学工具'],
    keywords: ['最大公约数', '最小公倍数', 'GCD', 'LCM', '欧几里得'],
    description: '计算两个数的最大公约数和最小公倍数'
  },
  {
    id: 'prime-factorization',
    name: '质因数分解',
    icon: '🧮',
    color: 'pink',
    url: '/packages/math/pages/prime-factorization/prime-factorization',
    categories: ['学习工具', '数学工具'],
    keywords: ['质因数', '分解', '素数', '数论', '因子'],
    description: '将合数分解成质数相乘的形式'
  },
  {
    id: '24point',
    name: '24点速算',
    icon: '🎮',
    color: 'amber',
    url: '/packages/math/pages/24point/24point',
    categories: ['学习工具', '数学工具'],
    keywords: ['24点', '速算', '数学游戏', '四则运算', '挑战'],
    description: '使用4个数字通过运算得到24的游戏'
  },
  {
    id: 'random-selector',
    name: '取数模拟器',
    icon: '🎰',
    color: 'purple',
    url: '/packages/math/pages/random-selector/random-selector',
    categories: ['生活工具', '数学工具'],
    keywords: ['随机', '选号', '模拟', '六红一蓝', '五红两蓝'],
    description: '随机生成号码组合，支持模拟结果和匹配计算',
    frequency: 40
  },
  // 数学工具分类结束
  // 转换工具分类开始
  {
    id: 'base-converter',
    name: '整数基转换器',
    icon: '🔢',
    color: 'cyan',
    url: '/packages/converter/pages/base-converter/base-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['进制', '转换', '二进制', '十六进制', 'Base64'],
    description: '在不同基数间转换数字，支持二进制、十六进制、Base64等'
  },
  {
    id: 'json-xml-converter',
    name: 'JSON·XML转换器',
    icon: '🔄',
    color: 'lime',
    url: '/packages/converter/pages/json-xml-converter/json-xml-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['JSON', 'XML', '转换', '数据格式'],
    description: '在JSON和XML格式之间进行相互转换'
  },
  {
    id: 'yaml-json-converter',
    name: 'YAML·JSON转换器',
    icon: '📋',
    color: 'violet',
    url: '/packages/converter/pages/yaml-json-converter/yaml-json-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['YAML', 'JSON', '转换', '配置文件'],
    description: '在YAML和JSON格式之间进行相互转换'
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    icon: '🎯',
    color: 'rose',
    url: '/packages/converter/pages/regex-tester/regex-tester',
    categories: ['学习工具', '开发工具'],
    keywords: ['正则', '正则表达式', '测试', '匹配', '调试'],
    description: '在线测试和调试正则表达式，支持高亮显示匹配结果'
  },
  // 转换工具分类结束
  {
    id: 'what-to-eat',
    name: '今天吃什么',
    icon: '🍽️',
    color: 'orange',
    url: '/packages/food/pages/what-to-eat/what-to-eat',
    categories: ['生活工具'],
    keywords: ['吃什么', '食物', '随机', '饮食', '搭配'],
    description: '随机生成饮食建议，解决选择困难症'
  },
  {
    id: 'zodiac',
    name: '生肖查询',
    icon: '🐴',
    color: 'yellow',
    url: '/packages/life/pages/zodiac/zodiac',
    categories: ['生活工具'],
    keywords: ['生肖', '查询', '年份', '年龄'],
    description: '根据出生年份查询生肖和年龄'
  },
  {
    id: 'relative-calculator',
    name: '亲戚计算器',
    icon: '👥',
    color: 'blue',
    url: '/packages/life/pages/relative-calculator/relative-calculator',
    categories: ['生活工具'],
    keywords: ['亲戚', '关系', '计算', '称呼'],
    description: '计算亲戚之间的关系和称呼',
    frequency: toolFrequency['relative-calculator']
  },
  {
    id: 'avatar-generator',
    name: '汉字头像生成',
    icon: '🎨',
    color: 'purple',
    url: '/packages/text/pages/avatar-generator/avatar-generator',
    categories: ['生活工具', '学习工具'],
    keywords: ['汉字', '头像', '生成'],
    description: '输入汉字生成专属头像'
  },
  {
    id: 'emoji-to-png',
    name: 'Emoji转PNG',
    icon: '🖼️',
    color: 'pink',
    url: '/packages/text/pages/emoji-to-png/emoji-to-png',
    categories: ['生活工具', '学习工具'],
    keywords: ['emoji', 'PNG', '图片', '转换'],
    description: '将单个emoji转换为小文件PNG图片',
    frequency: toolFrequency['emoji-to-png']
  },
  {
    id: 'text-to-png',
    name: '文本转图片',
    icon: '📝',
    color: 'purple',
    url: '/packages/text/pages/text-to-png/text-to-png',
    categories: ['生活工具', '学习工具'],
    keywords: ['文本', 'PNG', '图片', '生成'],
    description: '将文本转换为PNG图片，支持多行文本和样式设置',
    frequency: toolFrequency['text-to-png']
  },
  {
    id: 'copywriting',
    name: '文案工具',
    icon: '✍️',
    color: 'pink',
    url: '/packages/text/pages/copywriting/copywriting',
    categories: ['生活工具', '学习工具'],
    keywords: ['文案', '写作', '素材', '模板'],
    description: '提供各种场景的文案素材，支持分类浏览和复制',
    frequency: toolFrequency['copywriting']
  }
];

// 发现页特有的工具数据
const discoveryTools = [
  { id: 'word-counter', name: '字数统计器', icon: '📊', description: '中英文混合精确统计', url: '/packages/text/pages/word-counter/word-counter', categories: ['学习工具', '文本工具'], keywords: ['字数', '统计', '文本', '字符'], frequency: toolFrequency['word-counter'] },
  { id: 'markdown-preview', name: 'Markdown预览器', icon: '📋', description: '实时预览MD文档效果', url: '/packages/text/pages/markdown-preview/markdown-preview', categories: ['学习工具', '文本工具'], keywords: ['Markdown', '预览', '文档', '格式'], frequency: toolFrequency['markdown-preview'] },
  { id: 'text-diff', name: '文本对比工具', icon: '🔍', description: '高亮显示文本差异', url: '/packages/text/pages/text-diff/text-diff', categories: ['学习工具', '文本工具'], keywords: ['文本', '对比', '差异', '比较'], frequency: toolFrequency['text-diff'] },
  { id: 'data-analyzer', name: '数据统计器', icon: '📈', description: '数值统计与分布分析', url: '/packages/data/pages/data-analyzer/data-analyzer', categories: ['学习工具', '数学工具'], keywords: ['数据', '统计', '分析', '分布'], frequency: toolFrequency['data-analyzer'] },
  { id: 'chart-generator', name: '图表生成器', icon: '📊', description: '多种图表一键生成', url: '/packages/chart/pages/chart-generator/chart-generator', categories: ['学习工具', '开发工具'], keywords: ['图表', '生成', '可视化', '图形'], frequency: toolFrequency['chart-generator'] },
  { id: 'timestamp-converter', name: '时间戳转换器', icon: '⏰', description: 'Unix时间戳互转', url: '/packages/developer/pages/timestamp-converter/timestamp-converter', categories: ['开发工具', '转换工具'], keywords: ['时间戳', '转换', 'Unix', '时间'], frequency: toolFrequency['timestamp-converter'] },
  { id: 'color-converter', name: '颜色生成器', icon: '🎨', description: 'RGB滑块调色、格式转换、配色方案', url: '/packages/design/pages/color-converter/color-converter', categories: ['开发工具', '设计工具'], keywords: ['颜色', '生成器', '取色器', 'RGB', 'Hex', 'HSL', '配色', '调色板'], frequency: toolFrequency['color-converter'] }
];

// 合并所有工具
const allTools = [...tools, ...discoveryTools.filter(tool => !tools.find(t => t.id === tool.id))];

// 确保所有工具都有 keywords 数组
allTools.forEach(tool => {
  if (!tool.keywords || !Array.isArray(tool.keywords)) {
    tool.keywords = [];
  }
});

// 工具分类（与首页分类保持一致）
const categories = [
    { name: '数学工具', color: 'indigo', icon: '🔢', description: '最大公约数、质因数分解、24点等数学工具' },
    { name: '转换工具', color: 'cyan', icon: '🔄', description: '进制转换、格式转换等数据处理工具' },
    { name: '财务工具', color: 'blue', icon: '💰', description: '房贷、汇率、个税等财务计算' },
    { name: '健康工具', color: 'green', icon: '💪', description: 'BMI、健康指标计算' },
    { name: '生活工具', color: 'orange', icon: '🏠', description: '日历、天气、计时等生活工具' },
    { name: '学习工具', color: 'purple', icon: '📚', description: '单位换算、计算器等学习工具' },
    { name: '开发工具', color: 'slate', icon: '⚙️', description: '正则测试、代码工具等开发者工具' },
    { name: '安全工具', color: 'red', icon: '🔒', description: '密码生成、身份证验证等安全工具' },
    { name: '文案工具', color: 'pink', icon: '✍️', description: '各种场景的文案素材和模板' },
    { name: '更多工具', color: 'teal', icon: '📱', description: '旅行等其他实用工具' }
  ];

// 常用工具（首页显示）
const commonTools = [
  tools[6],  // 房贷计算器
  tools[7],  // 人生A4纸
  tools[8],  // 二维码生成
  tools[9],  // 健康计算
  tools[10], // 万年历
  tools[11], // 时间工具
  tools[12], // 密码生成
  tools[13], // 身份证验证
  tools[14]  // 价格对比
];

// 根据分类获取工具
function getToolsByCategory(categoryName) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return [];
  }
  
  return allTools.filter(tool => {
    if (!tool || !tool.categories) return false;
    return tool.categories.includes(categoryName);
  });
}

// 根据关键词搜索工具
function searchTools(keyword) {
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
  
  console.log('[搜索] 搜索结果数量:', results.length);
  console.log('[搜索] 匹配工具:', results.map(t => t.name).join(', '));
  
  return results;
}

// 根据ID获取工具
function getToolById(id) {
  if (!allTools || !Array.isArray(allTools)) {
    console.error('工具列表未正确初始化');
    return null;
  }
  
  return allTools.find(tool => {
    if (!tool) return false;
    return tool.id === id;
  });
}

// 确保在导出前 allTools 已经定义
if (!allTools || !Array.isArray(allTools)) {
  throw new Error('工具列表未正确初始化');
}

// 导出模块
module.exports = {
  tools: allTools,
  categories,
  commonTools,
  discoveryTools,
  allTools,
  toolFrequency,
  getToolsByCategory,
  searchTools,
  getToolById
};
