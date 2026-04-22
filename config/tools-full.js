/**
 * 工具配置文件
 * 统一管理所有工具的信息，便于维护和扩展
 */

const categories = require('./categories');
const { toolFrequency } = require('./constants');
const { getToolFrequency, updateToolFrequency, getToolFrequencyRanking } = require('./frequency');
const { searchTools, getToolById, debounce, clearSearchCache, getSearchHistory, addSearchHistory, deleteSearchHistory, clearSearchHistory, getSearchSuggestions } = require('./search');
const { getToolsByCategory, getAllCategories, getCategoryInfo, groupToolsByCategory, getCategoryStats } = require('./category');

// 工具列表
const tools = [
  // ===== 学习工具（按排序顺序）=====
  // 置顶工具

  // 基础换算
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
    id: 'base-converter',
    name: '进制转换',
    icon: '🔢',
    color: 'cyan',
    url: '/packages/unit/pages/base-converter/base-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['进制', '转换', '二进制', '十六进制', 'Base64'],
    description: '在不同基数间转换数字，支持二进制、十六进制、Base64等'
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
  // 数据转换
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
    name: '正则校验',
    icon: '🎯',
    color: 'rose',
    url: '/packages/text/pages/regex-tester/regex-tester',
    categories: ['学习工具', '开发工具'],
    keywords: ['正则', '正则表达式', '测试', '匹配', '调试'],
    description: '在线测试和调试正则表达式，支持高亮显示匹配结果'
  },
  // 数据统计
  {
    id: 'data-analyzer',
    name: '数据统计器',
    icon: '📈',
    color: 'blue',
    url: '/packages/data/pages/data-analyzer/data-analyzer',
    categories: ['学习工具', '数学工具'],
    keywords: ['数据', '统计', '分析', '分布'],
    description: '数值统计与分布分析'
  },
  // 数学游戏/学习
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
    id: 'permutation-combination',
    name: '排列组合',
    icon: '🔢',
    color: 'rose',
    url: '/packages/math/pages/permutation-combination/permutation-combination',
    categories: ['学习工具', '数学工具'],
    keywords: ['排列', '组合', '概率', '计算', 'A', 'C'],
    description: '计算排列 A(n,r) 和组合 C(n,r)'
  },
  // 更多单位换算
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
    id: 'speed-converter',
    name: '速度换算',
    icon: '🚗',
    color: 'green',
    url: '/packages/unit/pages/speed-converter/speed-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['速度', '单位', '换算', '转换'],
    description: '各种速度单位的快速换算'
  },
  {
    id: 'pressure-converter',
    name: '压力换算',
    icon: '🌀',
    color: 'blue',
    url: '/packages/unit/pages/pressure-converter/pressure-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['压力', '单位', '换算', '转换'],
    description: '各种压力单位的快速换算'
  },
  {
    id: 'energy-converter',
    name: '能量换算',
    icon: '⚡',
    color: 'yellow',
    url: '/packages/unit/pages/energy-converter/energy-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['能量', '单位', '换算', '转换'],
    description: '各种能量单位的快速换算'
  },
  {
    id: 'timezone-converter',
    name: '时区转换',
    icon: '🌍',
    color: 'blue',
    url: '/packages/unit/pages/timezone-converter/timezone-converter',
    categories: ['学习工具', '转换工具'],
    keywords: ['时区', '转换', '时间', '全球'],
    description: '在不同时区之间转换时间'
  },
  // ===== 财务工具 =====
  {
    id: 'mortgage',
    name: '房贷计算',
    icon: '🏠',
    color: 'blue',
    url: '/packages/financial/pages/mortgage/mortgage',
    categories: ['财务工具'],
    keywords: ['房贷', '贷款', '计算', '房屋'],
    description: '计算房贷月供、利息和还款总额'
  },

  // ===== 生活工具（按排序顺序）=====
  {
    id: 'calendar',
    name: '万年历',
    icon: '📅',
    color: 'red',
    url: '/packages/life/pages/calendar/calendar',
    categories: ['生活工具'],
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
    id: 'constellation',
    name: '星座查询',
    icon: '🔯',
    color: 'purple',
    url: '/packages/life/pages/constellation/constellation',
    categories: ['生活工具'],
    keywords: ['星座', '查询', '生日', '性格'],
    description: '根据出生日期查询星座和性格特点'
  },
  {
    id: 'relative-calculator',
    name: '亲戚计算器',
    icon: '👥',
    color: 'blue',
    url: '/packages/life/pages/relative-calculator/relative-calculator',
    categories: ['生活工具'],
    keywords: ['亲戚', '关系', '计算', '称呼'],
    description: '计算亲戚之间的关系和称呼'
  },
  {
    id: 'text-to-image',
    name: '文案生图',
    icon: '🖼️',
    color: 'purple',
    url: '/packages/life/pages/text-to-image/text-to-image',
    categories: ['生活工具'],
    keywords: ['文字', '图片', '生成', '水印', '出处'],
    description: '将文字转换为图片，支持添加出处和二维码'
  },
  {
    id: 'idiom-query',
    name: '成语查询',
    icon: '🔍',
    color: 'blue',
    url: '/packages/life/pages/idiom-query/idiom-query',
    categories: ['生活工具'],
    keywords: ['成语', '查询', '接龙', '文字游戏'],
    description: '查询成语可接龙的下联，点击查看释义'
  },
  {
    id: 'idiom-battle',
    name: '成语对战',
    icon: '⚔️',
    color: 'red',
    url: '/packages/life/pages/idiom-battle/idiom-battle',
    categories: ['生活工具'],
    keywords: ['成语', '对战', 'AI', '接龙', '游戏'],
    description: '与AI进行成语接龙对战，支持先手选择'
  },
  {
    id: 'idiom-chain',
    name: '成语龙链',
    icon: '🔗',
    color: 'green',
    url: '/packages/life/pages/idiom-chain/idiom-chain',
    categories: ['生活工具'],
    keywords: ['成语', '历史', '记录', '接龙链'],
    description: '查看历史接龙记录，点击继续接龙'
  },
  {
    id: 'qrcode',
    name: '生成二维码',
    icon: '📱',
    color: 'orange',
    url: '/packages/life/pages/qrcode/qrcode',
    categories: ['生活工具', '安全工具'],
    keywords: ['二维码', '生成', '码', '扫码'],
    description: '生成文本和链接的二维码'
  },
  {
    id: 'copywriting',
    name: '文案工具',
    icon: '✍️',
    color: 'pink',
    url: '/packages/life/pages/copywriting/copywriting',
    categories: ['生活工具'],
    keywords: ['文案', '写作', '素材', '模板'],
    description: '提供各种场景的文案素材，支持分类浏览和复制'
  },
  {
    id: 'article-cover',
    name: '公众号配图',
    icon: '🎨',
    color: 'blue',
    url: '/packages/life/pages/article-cover/article-cover',
    categories: ['生活工具'],
    keywords: ['公众号', '配图', '封面', '图片', '生成', '2.35'],
    description: '生成公众号封面配图，支持2.35:1标准比例，多种配色风格'
  },
  {
    id: 'leapyear',
    name: '闰年判断',
    icon: '📅',
    color: 'green',
    url: '/packages/life/pages/leapyear/leapyear',
    categories: ['生活工具'],
    keywords: ['闰年', '判断', '年份', '日历'],
    description: '判断是否为闰年'
  },
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
    id: 'life-countdown',
    name: '人生A4纸',
    icon: '⏰',
    color: 'green',
    url: '/packages/life/pages/life-countdown/life-countdown',
    categories: ['生活工具'],
    keywords: ['人生', '日期', '剩余'],
    description: '计算人生已过天数和剩余寿命'
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
    id: 'quit-smoking',
    name: '电子戒烟',
    icon: '🚭',
    color: 'green',
    url: '/packages/life/pages/quit-smoking/quit-smoking',
    categories: ['生活工具'],
    keywords: ['戒烟', '禁烟', '呼吸', '健康', '烟瘾'],
    description: '呼吸练习对抗烟瘾，记录戒烟成就和进度'
  },
  {
    id: 'electronic-woodfish',
    name: '电子木鱼',
    icon: '🎵',
    color: 'brown',
    url: '/packages/life/pages/electronic-woodfish/electronic-woodfish',
    categories: ['生活工具'],
    keywords: ['木鱼', '功德', '佛系', '敲击', '冥想'],
    description: '敲木鱼积功德，心平气和'
  },
  {
    id: 'bobing',
    name: '中秋博饼',
    icon: '🎲',
    color: 'red',
    url: '/packages/bobing/pages/bobing/bobing',
    categories: ['生活工具'],
    keywords: ['博饼', '骰子', '中秋', '福建', '闽南', '传统', '习俗'],
    description: '闽南传统博饼文化体验，掷6个骰子感受中秋习俗'
  },
  {
    id: 'poison-soup',
    name: '每日毒鸡汤',
    icon: '🍵',
    color: 'amber',
    url: '/packages/life/pages/poison-soup/poison-soup',
    categories: ['休闲工具'],
    keywords: ['毒鸡汤', '负能量', '扎心', '文案', '鸡汤'],
    description: '每日一碗毒鸡汤，专治各种不服'
  },
  {
    id: 'answer-book',
    name: '答案之书',
    icon: '🔮',
    color: 'indigo',
    url: '/packages/life/pages/answer-book/answer-book',
    categories: ['休闲工具'],
    keywords: ['答案', 'Magic8Ball', '指点', '迷津', '占卜'],
    description: 'Magic 8 Ball 答案之书，为你指点迷津'
  },
  {
    id: 'truth-or-dare',
    name: '真心话大冒险',
    icon: '🎭',
    color: 'purple',
    url: '/packages/life/pages/truth-or-dare/truth-or-dare',
    categories: ['休闲工具'],
    keywords: ['真心话', '大冒险', '聚会', '游戏', '派对', '真心话大冒险', '考验', '冒险', '真心'],
    description: '聚会必备真心话大冒险题目，支持按难度和类型筛选'
  },
  {
    id: 'merge-abc',
    name: 'ABC合成记',
    icon: '🔤',
    color: 'amber',
    url: '/packages/life/pages/merge-abc/merge-abc',
    categories: ['休闲工具'],
    keywords: ['ABC', '合成', '字母', '合并', '游戏', 'merge', '字母游戏', '益智'],
    description: '合并相同字母进化，趣味字母合成游戏'
  },

  {
    id: 'health-calculator',
    name: '健康计算',
    icon: '💪',
    color: 'teal',
    url: '/packages/health/pages/health-calculator/health-calculator',
    categories: ['健康工具'],
    keywords: ['健康', 'BMI', '体重', '身高'],
    description: '计算BMI和健康指标'
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
    name: '退休金计算',
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
    id: 'prime-checker',
    name: '质数判断',
    icon: '🔢',
    color: 'indigo',
    url: '/packages/math/pages/prime-checker/prime-checker',
    categories: ['学习工具', '数学工具'],
    keywords: ['质数', '素数', '判断', '数字', '合数', '6k±1'],
    description: '快速判断数字是否为质数，采用6k±1优化算法'
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
    id: 'divisor-finder',
    name: '求约数',
    icon: '📋',
    color: 'purple',
    url: '/packages/math/pages/divisor-finder/divisor-finder',
    categories: ['学习工具', '数学工具'],
    keywords: ['约数', '因数', '分解', '整除', '因子'],
    description: '找出正整数所有的约数（因数）'
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

  {
    id: 'emoji-to-png',
    name: 'Emoji转图片',
    icon: '🖼️',
    color: 'pink',
    url: '/packages/text/pages/emoji-to-png/emoji-to-png',
    categories: ['生活工具', '学习工具'],
    keywords: ['emoji', 'PNG', '图片', '转换'],
    description: '将单个emoji转换为小文件PNG图片'
  },
  {
    id: 'text-to-png',
    name: '文本转图片',
    icon: '📝',
    color: 'purple',
    url: '/packages/text/pages/text-to-png/text-to-png',
    categories: ['生活工具', '学习工具'],
    keywords: ['文本', 'PNG', '图片', '生成'],
    description: '将文本转换为PNG图片，支持多行文本和样式设置'
  },
  {
    id: 'poster-generator',
    name: '海报生成',
    icon: '📄',
    color: 'blue',
    url: '/packages/text/pages/poster-generator/poster-generator',
    categories: ['学习工具', '生活工具'],
    keywords: ['海报', '生成', '图片', '宣传'],
    description: '快速生成精美的海报图片，支持多种样式'
  },
  {
    id: 'sudoku-solver',
    name: '数独求解器',
    icon: '🧩',
    color: 'orange',
    url: '/packages/math/pages/sudoku-solver/sudoku-solver',
    categories: ['学习工具', '数学工具'],
    keywords: ['数独', '求解', '谜题', '逻辑'],
    description: '输入数独题目，自动求解答案',
    publish: true
  },
  {
    id: 'sudoku-generator',
    name: '数独生成器',
    icon: '🎲',
    color: 'teal',
    url: '/packages/math/pages/sudoku-generator/sudoku-generator',
    categories: ['学习工具', '数学工具'],
    keywords: ['数独', '生成', '谜题', '游戏'],
    description: '随机生成不同难度的数独题目',
    publish: true
  },
  {
    id: 'one-stroke-solver',
    name: '一笔画求解',
    icon: '✏️',
    color: 'pink',
    url: '/packages/math/pages/one-stroke-solver/one-stroke-solver',
    categories: ['学习工具', '数学工具'],
    keywords: ['一笔画', '欧拉路径', '图论', '谜题'],
    description: '判断图形是否可以一笔画成并给出路径',
    publish: false
  },
  {
    id: 'nonogram',
    name: '数织',
    icon: '🧩',
    color: 'green',
    url: '/packages/math/pages/nonogram/nonogram',
    categories: ['学习工具', '数学工具'],
    keywords: ['数织', '逻辑', '谜题', 'Nonogram', '填字'],
    description: '根据行列数字提示填充格子，经典数织逻辑谜题'
  },
  {
    id: 'frog-escape',
    name: '躲避青蛙',
    icon: '🐸',
    color: 'green',
    url: '/packages/math/pages/frog-escape/frog-escape',
    categories: ['学习工具', '数学工具'],
    keywords: ['青蛙', '扫雷', '躲避', '雷', '益智', '逻辑'],
    description: '老婆网购青蛙却收到活的被吓到不要不要的，开发此游戏纪念这段"恐怖"经历'
  },
  {
    id: 'othello',
    name: '黑白棋',
    icon: '⚫',
    color: 'purple',
    url: '/packages/math/pages/othello/othello',
    categories: ['学习工具', '数学工具'],
    keywords: ['黑白棋', '奥赛罗', '翻转', 'AI', '对战'],
    description: '经典黑白棋游戏，支持多难度AI对战'
  }
];

// 发现页特有的工具数据
const discoveryTools = [
  { id: 'word-counter', name: '字数统计', icon: '📊', description: '中英文混合精确统计', url: '/packages/text/pages/word-counter/word-counter', categories: ['学习工具', '文本工具'], keywords: ['字数', '统计', '文本', '字符'] },
  { id: 'markdown-preview', name: 'Markdown预览器', icon: '📋', description: '实时预览MD文档效果', url: '/packages/text/pages/markdown-preview/markdown-preview', categories: ['学习工具', '文本工具'], keywords: ['Markdown', '预览', '文档', '格式'] },
  { id: 'text-diff', name: '文本对比', icon: '🔍', description: '高亮显示文本差异', url: '/packages/text/pages/text-diff/text-diff', categories: ['学习工具', '文本工具'], keywords: ['文本', '对比', '差异', '比较'] },
  { id: 'data-analyzer', name: '数据统计器', icon: '📈', description: '数值统计与分布分析', url: '/packages/data/pages/data-analyzer/data-analyzer', categories: ['学习工具', '数学工具'], keywords: ['数据', '统计', '分析', '分布'] },

  { id: 'timestamp-converter', name: '时间戳转换器', icon: '⏰', description: 'Unix时间戳互转', url: '/packages/developer/pages/timestamp-converter/timestamp-converter', categories: ['开发工具', '转换工具'], keywords: ['时间戳', '转换', 'Unix', '时间'] },
  { id: 'color-converter', name: '颜色生成', icon: '🎨', description: 'RGB滑块调色、格式转换、配色方案', url: '/packages/design/pages/color-converter/color-converter', categories: ['开发工具', '设计工具'], keywords: ['颜色', '生成器', '取色器', 'RGB', 'Hex', 'HSL', '配色', '调色板'] }
];

// 合并所有工具并过滤掉 publish: false 的工具
const allTools = [...tools, ...discoveryTools.filter(tool => !tools.find(t => t.id === tool.id))].filter(tool => tool.publish !== false);

// 确保所有工具都有 keywords 数组
allTools.forEach(tool => {
  if (!tool.keywords || !Array.isArray(tool.keywords)) {
    tool.keywords = [];
  }
});

// 常用工具（首页显示）- 按分类 + 优先级排序
const commonTools = [

  // ===== 成语工具（置顶）=====
  tools.find(t => t.id === 'idiom-query'),        // 成语查询
  tools.find(t => t.id === 'idiom-battle'),       // 成语对战
  tools.find(t => t.id === 'idiom-chain'),        // 成语龙链

  // ===== 生活工具（按固定顺序）=====
  tools.find(t => t.id === 'calendar'),           // 万年历
  tools.find(t => t.id === 'time-tool'),          // 时间工具
  tools.find(t => t.id === 'datediff'),          // 日期差计算
  tools.find(t => t.id === 'zodiac'),             // 生肖查询
  tools.find(t => t.id === 'constellation'),      // 星座查询
  tools.find(t => t.id === 'relative-calculator'), // 亲戚计算器
  tools.find(t => t.id === 'text-to-image'),     // 文案生图
  tools.find(t => t.id === 'qrcode'),             // 生成二维码
  tools.find(t => t.id === 'copywriting'),        // 文案工具
  tools.find(t => t.id === 'article-cover'),      // 公众号配图
  tools.find(t => t.id === 'leapyear'),           // 闰年判断
  tools.find(t => t.id === 'what-to-eat'),        // 今天吃什么
  tools.find(t => t.id === 'life-countdown'),     // 人生A4纸
  tools.find(t => t.id === 'battery-health'),     // 电池健康
  tools.find(t => t.id === 'quit-smoking'),       // 电子戒烟
  tools.find(t => t.id === 'electronic-woodfish'), // 电子木鱼
  tools.find(t => t.id === 'bobing'),             // 中秋博饼
  tools.find(t => t.id === 'poison-soup'),        // 每日毒鸡汤
  tools.find(t => t.id === 'answer-book'),        // 答案之书

  // ===== 财务工具 =====
  tools.find(t => t.id === 'mortgage'),           // 房贷计算
  tools.find(t => t.id === 'retirementCalculator'), // 退休金计算
  tools.find(t => t.id === 'price-comparison'),   // 价格对比

  // ===== 安全工具 =====
  tools.find(t => t.id === 'password-generator'), // 密码生成

  // ===== 其他常用 =====
  tools.find(t => t.id === 'random-selector'),    // 取数模拟器
  tools.find(t => t.id === 'health-calculator'),  // 健康计算
  tools.find(t => t.id === 'emoji-to-png'),      // Emoji转图片
  tools.find(t => t.id === 'text-to-png'),        // 文本转图片
  tools.find(t => t.id === 'nonogram'),           // 数织
];

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
  getToolFrequency,
  updateToolFrequency,
  getToolFrequencyRanking,
  getToolsByCategory: (categoryName) => getToolsByCategory(categoryName, allTools),
  searchTools: (keyword) => searchTools(keyword, allTools),
  getToolById: (id) => getToolById(id, allTools),
  getAllCategories: () => getAllCategories(allTools),
  getCategoryInfo,
  groupToolsByCategory: () => groupToolsByCategory(allTools),
  getCategoryStats: () => getCategoryStats(allTools),
  debounce,
  clearSearchCache,
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  getSearchSuggestions: (keyword) => getSearchSuggestions(keyword, allTools)
};
