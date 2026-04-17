/**
 * 工具配置文件 - 首页必加载版本
 * 仅包含 commonTools（35个常用工具），无搜索逻辑，轻量快速
 * 完整工具列表见 tools-full.js
 */

const categories = require('./categories');
const { toolFrequency } = require('./constants');
const { getToolFrequency, updateToolFrequency } = require('./frequency');

// ===== commonTools - 首页常用工具（首页渲染只需要这个子集）=====
const commonTools = [
  // ===== 成语工具（置顶）=====
  { id: 'idiom-query', name: '成语查询', icon: '🔍', color: 'blue', url: '/packages/life/pages/idiom-query/idiom-query', categories: ['生活工具'], keywords: ['成语', '查询', '接龙', '文字游戏'], description: '查询成语可接龙的下联，点击查看释义' },
  { id: 'idiom-battle', name: '成语对战', icon: '⚔️', color: 'red', url: '/packages/life/pages/idiom-battle/idiom-battle', categories: ['生活工具'], keywords: ['成语', '对战', 'AI', '接龙', '游戏'], description: '与AI进行成语接龙对战，支持先手选择' },
  { id: 'idiom-chain', name: '成语龙链', icon: '🔗', color: 'green', url: '/packages/life/pages/idiom-chain/idiom-chain', categories: ['生活工具'], keywords: ['成语', '历史', '记录', '接龙链'], description: '查看历史接龙记录，点击继续接龙' },

  // ===== 生活工具 =====
  { id: 'calendar', name: '万年历', icon: '📅', color: 'red', url: '/packages/life/pages/calendar/calendar', categories: ['生活工具'], keywords: ['日历', '万年历', '日期', '农历'], description: '查看日历和农历日期' },
  { id: 'time-tool', name: '时间工具', icon: '⏱️', color: 'yellow', url: '/packages/life/pages/time-tool/time-tool', categories: ['生活工具'], keywords: ['时间', '秒表', '计时器', '时区'], description: '秒表、计时器和时区转换' },
  { id: 'datediff', name: '日期差计算', icon: '📆', color: 'teal', url: '/packages/life/pages/datediff/datediff', categories: ['生活工具'], keywords: ['日期', '差', '计算', '天数'], description: '计算两个日期之间的天数差' },
  { id: 'zodiac', name: '生肖查询', icon: '🐴', color: 'yellow', url: '/packages/life/pages/zodiac/zodiac', categories: ['生活工具'], keywords: ['生肖', '查询', '年份', '年龄'], description: '根据出生年份查询生肖和年龄' },
  { id: 'constellation', name: '星座查询', icon: '🔯', color: 'purple', url: '/packages/life/pages/constellation/constellation', categories: ['生活工具'], keywords: ['星座', '查询', '生日', '性格'], description: '根据出生日期查询星座和性格特点' },
  { id: 'relative-calculator', name: '亲戚计算器', icon: '👥', color: 'blue', url: '/packages/life/pages/relative-calculator/relative-calculator', categories: ['生活工具'], keywords: ['亲戚', '关系', '计算', '称呼'], description: '计算亲戚之间的关系和称呼' },
  { id: 'text-to-image', name: '文案生图', icon: '🖼️', color: 'purple', url: '/packages/life/pages/text-to-image/text-to-image', categories: ['生活工具'], keywords: ['文字', '图片', '生成', '水印', '出处'], description: '将文字转换为图片，支持添加出处和二维码' },
  { id: 'qrcode', name: '生成二维码', icon: '📱', color: 'orange', url: '/packages/life/pages/qrcode/qrcode', categories: ['生活工具', '安全工具'], keywords: ['二维码', '生成', '码', '扫码'], description: '生成文本和链接的二维码' },
  { id: 'copywriting', name: '文案工具', icon: '✍️', color: 'pink', url: '/packages/life/pages/copywriting/copywriting', categories: ['生活工具'], keywords: ['文案', '写作', '素材', '模板'], description: '提供各种场景的文案素材，支持分类浏览和复制' },
  { id: 'article-cover', name: '公众号配图', icon: '🎨', color: 'blue', url: '/packages/life/pages/article-cover/article-cover', categories: ['生活工具'], keywords: ['公众号', '配图', '封面', '图片', '生成', '2.35'], description: '生成公众号封面配图，支持2.35:1标准比例，多种配色风格' },
  { id: 'leapyear', name: '闰年判断', icon: '📅', color: 'green', url: '/packages/life/pages/leapyear/leapyear', categories: ['生活工具'], keywords: ['闰年', '判断', '年份', '日历'], description: '判断是否为闰年' },
  { id: 'what-to-eat', name: '今天吃什么', icon: '🍽️', color: 'orange', url: '/packages/food/pages/what-to-eat/what-to-eat', categories: ['生活工具'], keywords: ['吃什么', '食物', '随机', '饮食', '搭配'], description: '随机生成饮食建议，解决选择困难症' },
  { id: 'life-countdown', name: '人生A4纸', icon: '⏰', color: 'green', url: '/packages/life/pages/life-countdown/life-countdown', categories: ['生活工具'], keywords: ['人生', '日期', '剩余'], description: '计算人生已过天数和剩余寿命' },
  { id: 'battery-health', name: '电池健康', icon: '🔋', color: 'green', url: '/packages/life/pages/battery-health/battery-health', categories: ['生活工具'], keywords: ['电池', '健康', '电量', '检测'], description: '查看设备电池健康状态' },
  { id: 'quit-smoking', name: '电子戒烟', icon: '🚭', color: 'green', url: '/packages/life/pages/quit-smoking/quit-smoking', categories: ['生活工具'], keywords: ['戒烟', '禁烟', '呼吸', '健康', '烟瘾'], description: '呼吸练习对抗烟瘾，记录戒烟成就和进度' },
  { id: 'electronic-woodfish', name: '电子木鱼', icon: '🎵', color: 'brown', url: '/packages/life/pages/electronic-woodfish/electronic-woodfish', categories: ['生活工具'], keywords: ['木鱼', '功德', '佛系', '敲击', '冥想'], description: '敲木鱼积功德，心平气和' },
  { id: 'bobing', name: '中秋博饼', icon: '🎲', color: 'red', url: '/packages/bobing/pages/bobing/bobing', categories: ['生活工具'], keywords: ['博饼', '骰子', '中秋', '福建', '闽南', '传统', '习俗'], description: '闽南传统博饼文化体验，掷6个骰子感受中秋习俗' },
  { id: 'poison-soup', name: '每日毒鸡汤', icon: '🍵', color: 'amber', url: '/packages/life/pages/poison-soup/poison-soup', categories: ['休闲工具'], keywords: ['毒鸡汤', '负能量', '扎心', '文案', '鸡汤'], description: '每日一碗毒鸡汤，专治各种不服' },
  { id: 'answer-book', name: '答案之书', icon: '🔮', color: 'indigo', url: '/packages/life/pages/answer-book/answer-book', categories: ['休闲工具'], keywords: ['答案', 'Magic8Ball', '指点', '迷津', '占卜'], description: 'Magic 8 Ball 答案之书，为你指点迷津' },
  { id: 'truth-or-dare', name: '真心话大冒险', icon: '🎭', color: 'purple', url: '/packages/life/pages/truth-or-dare/truth-or-dare', categories: ['休闲工具'], keywords: ['真心话', '大冒险', '聚会', '游戏', '派对', '真心话大冒险', '考验', '冒险', '真心'], description: '聚会必备题目，支持按难度和类型筛选' },

  // ===== 财务工具 =====
  { id: 'mortgage', name: '房贷计算', icon: '🏠', color: 'blue', url: '/packages/financial/pages/mortgage/mortgage', categories: ['财务工具'], keywords: ['房贷', '贷款', '计算', '房屋'], description: '计算房贷月供、利息和还款总额' },
  { id: 'retirementCalculator', name: '退休金计算', icon: '💰', color: 'green', url: '/packages/financial/pages/retirementCalculator/retirementCalculator', categories: ['财务工具'], keywords: ['退休', '养老金', '储蓄', '计算'], description: '计算退休所需的储蓄金额' },
  { id: 'price-comparison', name: '价格对比', icon: '🛒', color: 'purple', url: '/packages/financial/pages/price-comparison/price-comparison', categories: ['财务工具'], keywords: ['价格', '对比', '商品', '划算'], description: '对比多个商品的单价和性价比' },

  // ===== 安全工具 =====
  { id: 'password-generator', name: '密码生成', icon: '🔒', color: 'gray', url: '/packages/text/pages/password-generator/password-generator', categories: ['安全工具'], keywords: ['密码', '生成', '安全', '随机'], description: '生成安全的随机密码' },
  { id: 'idcard', name: '身份证验证', icon: '🆔', color: 'blue', url: '/packages/life/pages/idcard/idcard', categories: ['安全工具'], keywords: ['身份证', '验证', '身份', '校验'], description: '验证身份证号码的有效性' },

  // ===== 其他常用 =====
  { id: 'random-selector', name: '取数模拟器', icon: '🎰', color: 'purple', url: '/packages/math/pages/random-selector/random-selector', categories: ['生活工具', '数学工具'], keywords: ['随机', '选号', '模拟', '六红一蓝', '五红两蓝'], description: '随机生成号码组合，支持模拟结果和匹配计算', frequency: 40 },
  { id: 'health-calculator', name: '健康计算', icon: '💪', color: 'teal', url: '/packages/health/pages/health-calculator/health-calculator', categories: ['健康工具'], keywords: ['健康', 'BMI', '体重', '身高'], description: '计算BMI和健康指标' },
  { id: 'emoji-to-png', name: 'Emoji转图片', icon: '🖼️', color: 'pink', url: '/packages/text/pages/emoji-to-png/emoji-to-png', categories: ['生活工具', '学习工具'], keywords: ['emoji', 'PNG', '图片', '转换'], description: '将单个emoji转换为小文件PNG图片' },
  { id: 'text-to-png', name: '文本转图片', icon: '📝', color: 'purple', url: '/packages/text/pages/text-to-png/text-to-png', categories: ['生活工具', '学习工具'], keywords: ['文本', 'PNG', '图片', '生成'], description: '将文本转换为PNG图片，支持多行文本和样式设置' },
];

// 过滤掉 null（万一有 ID 对不上）
const filteredCommonTools = commonTools.filter(Boolean);

// 基础分类数据（首页只需要 commonTools 中出现的分类）
const baseCategories = categories.filter(c => {
  const usedCats = new Set();
  filteredCommonTools.forEach(t => (t.categories || []).forEach(cat => usedCats.add(cat)));
  return usedCats.has(c.name);
});

module.exports = {
  tools: filteredCommonTools,
  commonTools: filteredCommonTools,
  categories: baseCategories,
  toolFrequency,
  getToolFrequency,
  updateToolFrequency,
};
