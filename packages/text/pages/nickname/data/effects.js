/**
 * 特效字体数据
 * 提供各种特效字符和样式
 */

// 特效字符号（插入到每个字符中间）
const EFFECT_CHARS = {
  // 流汗字 - 每个字符后加 ҈
  sweat: '҈',
  // 菊花文 - 每个字符后加 ҉
  chrysanthemum: '҉',
  // 藤蔓字 -  ζั͡ 加到每个字符
  vine: 'ζั͡ ',
  // 花边字 - 每个字符后加 ஊ
  flower: 'ஊ',
  // 草头字 - 每个字符后加 ෴
  grass: '෴',
  // 可爱字 - 每个字符前后加 ღ
  cute: 'ღ',
  // 蒲公英 - 每个字符后加 ོ
  dandelion: 'ོ',
  // 萌牙字 - 每个字符后加 ็้
  sprout: '็้',
  // 飞鸟字 - 每个字符后加 ོ
  bird: 'ོ',
  // 音符字 - 每个字符间加 ♫
  note: '♫',
  // 下划线 - 每个字符后加 ꯭
  underline: '꯭'
};

// 特效字体模板
const EFFECT_TEMPLATES = [
  {
    id: 'sweat',
    name: '流汗字',
    insert: '҈',
    preview: '彪҈哥҈',
    description: '每个字符后加流汗符号'
  },
  {
    id: 'chrysanthemum',
    name: '菊花文',
    insert: '҉',
    preview: '彪҉哥҉',
    description: '每个字符后加菊花符号'
  },
  {
    id: 'vine',
    name: '藤蔓字',
    insert: 'ζั͡ ',
    preview: 'ζั͡ 彪ζั͡ 哥',
    description: '藤蔓装饰效果'
  },
  {
    id: 'flower',
    name: '花边字',
    insert: 'ஊ',
    preview: '彪ஊ哥ஊ',
    description: '花边装饰'
  },
  {
    id: 'grass',
    name: '草头字',
    insert: '෴',
    preview: '彪෴哥෴',
    description: '小草装饰'
  },
  {
    id: 'cute',
    name: '可爱字',
    wrap: ['ღ', 'ღ'],
    preview: 'ღ彪ღღ哥ღ',
    description: '爱心装饰'
  },
  {
    id: 'dandelion',
    name: '蒲公英文',
    insert: 'ོ',
    preview: '彪ོ哥ོ',
    description: '蒲公英效果'
  },
  {
    id: 'sprout',
    name: '萌芽字',
    insert: '็้',
    preview: '彪็้哥็้',
    description: '萌萌的芽'
  },
  {
    id: 'note',
    name: '音符字',
    insert: '♫',
    preview: '彪♫哥',
    description: '音符装饰'
  },
  {
    id: 'underline',
    name: '下划线字',
    insert: '꯭',
    preview: '彪꯭哥꯭',
    description: '下划线连接'
  },
  {
    id: 'star',
    name: '星星字',
    insert: '★',
    preview: '彪★哥★',
    description: '星星装饰'
  },
  {
    id: 'dot',
    name: '点阵字',
    insert: '•',
    preview: '彪•哥•',
    description: '点阵效果'
  }
];

// 火星文映射（部分常见字）
const MARTIAN_MAP = {
  '的': '菂',
  '一': '⑴',
  '是': '媞',
  '不': '卜',
  '了': '勒',
  '我': '莪',
  '你': '鉨',
  '他': '怹',
  '她': '咜',
  '它': '咜',
  '们': '扪',
  '这': '者阝',
  '那': '哪',
  '有': '洧',
  '大': '夶',
  '小': '尛',
  '上': '仩',
  '下': '丅',
  '人': '朲',
  '来': '莱',
  '去': '厾',
  '说': '蒝',
  '看': '着',
  '想': '葙',
  '做': '莋',
  '走': '赱',
  '好': '恏',
  '坏': '孬',
  '爱': '嫒',
  '情': '倓',
  '心': '伈',
  '生': '笙',
  '死': '屍',
  '天': '迗',
  '地': '哋',
  '日': '曰',
  '月': '玥',
  '星': '緈',
  '风': '犭风',
  '水': '氵',
  '火': '灬',
  '山': '姗',
  '河': '菏',
  '海': '嗨',
  '花': '錵',
  '草': '艸',
  '树': '倐',
  '鸟': '蔫',
  '鱼': '渔'
};

/**
 * 生成特效字体
 * @param {string} text - 原始文本
 * @param {string} effectId - 特效ID
 * @returns {string} 特效文本
 */
function generateEffectText(text, effectId) {
  const template = EFFECT_TEMPLATES.find(t => t.id === effectId);
  if (!template) {
    return text;
  }

  if (template.wrap) {
    // 包裹模式（前后都加）
    return text.split('').map(char => template.wrap[0] + char + template.wrap[1]).join('');
  } else if (template.insert) {
    // 插入模式（每个字符后加）
    return text.split('').map(char => char + template.insert).join('');
  }
  
  return text;
}

/**
 * 生成火星文
 * @param {string} text - 原始文本
 * @returns {string} 火星文
 */
function generateMartian(text) {
  return text.split('').map(char => MARTIAN_MAP[char] || char).join('');
}

/**
 * 批量生成所有特效预览
 * @param {string} text - 原始文本
 * @returns {Array} 所有特效预览列表
 */
function generateAllEffectPreviews(text) {
  return EFFECT_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name,
    result: generateEffectText(text, template.id),
    description: template.description
  }));
}

module.exports = {
  EFFECT_CHARS,
  EFFECT_TEMPLATES,
  MARTIAN_MAP,
  generateEffectText,
  generateMartian,
  generateAllEffectPreviews
};
