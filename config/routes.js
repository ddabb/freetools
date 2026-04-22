// 路由配置文件

// 工具路由配置
const toolRoutes = {
  // 单位转换工具
  'length-converter': '/packages/unit/pages/length-converter/length-converter',
  'weight-converter': '/packages/unit/pages/weight-converter/weight-converter',
  'temperature-converter': '/packages/unit/pages/temperature-converter/temperature-converter',
  'area-converter': '/packages/unit/pages/area-converter/area-converter',
  'volume-converter': '/packages/unit/pages/volume-converter/volume-converter',
  'time-converter': '/packages/unit/pages/time-converter/time-converter',
  'speed-converter': '/packages/unit/pages/speed-converter/speed-converter',
  'pressure-converter': '/packages/unit/pages/pressure-converter/pressure-converter',
  'energy-converter': '/packages/unit/pages/energy-converter/energy-converter',
  'timezone-converter': '/packages/unit/pages/timezone-converter/timezone-converter',
  
  // 财务工具
  'mortgage': '/packages/financial/pages/mortgage/mortgage',
  'price-comparison': '/packages/financial/pages/price-comparison/price-comparison',
  'retirementCalculator': '/packages/financial/pages/retirementCalculator/retirementCalculator',
  
  // 生活工具
  'life-countdown': '/packages/life/pages/life-countdown/life-countdown',
  'qrcode': '/packages/life/pages/qrcode/qrcode',
  'calendar': '/packages/life/pages/calendar/calendar',
  'time-tool': '/packages/life/pages/time-tool/time-tool',
  'leapyear': '/packages/life/pages/leapyear/leapyear',
  'battery-health': '/packages/life/pages/battery-health/battery-health',
  'datediff': '/packages/life/pages/datediff/datediff',
  'zodiac': '/packages/life/pages/zodiac/zodiac',
  'constellation': '/packages/life/pages/constellation/constellation',
  'relative-calculator': '/packages/life/pages/relative-calculator/relative-calculator',
  'copywriting': '/packages/life/pages/copywriting/copywriting',
  'text-to-image': '/packages/life/pages/text-to-image/text-to-image',
  
  // 健康工具
  'health-calculator': '/packages/health/pages/health-calculator/health-calculator',
  
  // 安全工具
  'password-generator': '/packages/text/pages/password-generator/password-generator',
  
  // 文本工具
  'text-tool': '/packages/text/pages/text-tool/text-tool',
  'mdconvert': '/packages/text/pages/mdconvert/mdconvert',
  'onlychinese': '/packages/text/pages/onlychinese/onlychinese',
  'word-counter': '/packages/text/pages/word-counter/word-counter',
  'markdown-preview': '/packages/text/pages/markdown-preview/markdown-preview',
  'text-diff': '/packages/text/pages/text-diff/text-diff',

  'emoji-to-png': '/packages/text/pages/emoji-to-png/emoji-to-png',
  'text-to-png': '/packages/text/pages/text-to-png/text-to-png',
  'regex-tester': '/packages/text/pages/regex-tester/regex-tester',
  
  // 数学工具
  'oddEven': '/packages/math/pages/oddEven/oddEven',
  'gcd-lcm': '/packages/math/pages/gcd-lcm/gcd-lcm',
  'prime-factorization': '/packages/math/pages/prime-factorization/prime-factorization',
  '24point': '/packages/math/pages/24point/24point',
  'random-selector': '/packages/math/pages/random-selector/random-selector',
  'sudoku-solver': '/packages/math/pages/sudoku-solver/sudoku-solver',
  'sudoku-generator': '/packages/math/pages/sudoku-generator/sudoku-generator',
  'one-stroke-solver': '/packages/math/pages/one-stroke-solver/one-stroke-solver',
  
  // 转换工具
  'base-converter': '/packages/unit/pages/base-converter/base-converter',
  'json-xml-converter': '/packages/converter/pages/json-xml-converter/json-xml-converter',
  'yaml-json-converter': '/packages/converter/pages/yaml-json-converter/yaml-json-converter',
  
  // 旅行工具
  'travel-tool': '/packages/travel/pages/travel-tool/travel-tool',
  
  // 食物工具
  'what-to-eat': '/packages/food/pages/what-to-eat/what-to-eat',
  
  // 数据工具
  'data-analyzer': '/packages/data/pages/data-analyzer/data-analyzer',
  
  // 开发工具
  'timestamp-converter': '/packages/developer/pages/timestamp-converter/timestamp-converter',
  
  // 设计工具
  'color-converter': '/packages/design/pages/color-converter/color-converter'
};

module.exports = toolRoutes;