/**
 * 翅膀昵称模板
 * 提供多种翅膀样式供用户选择
 */

const WINGS_TEMPLATES = [
  {
    id: 'wings_1',
    name: '经典翅膀',
    style: '꧁༺{name}༻꧂',
    preview: '꧁༺彪哥༻꧂'
  },
  {
    id: 'wings_2',
    name: '花瓣翅膀',
    style: '꧁❀{name}❀꧂',
    preview: '꧁❀彪哥❀꧂'
  },
  {
    id: 'wings_3',
    name: '华丽翅膀',
    style: '꧁༺༽༾ཊ{name}ཏ༿༼༻꧂',
    preview: '꧁༺༽༾ཊ彪哥ཏ༿༼༻꧂'
  },
  {
    id: 'wings_4',
    name: '心形翅膀',
    style: '꧁༺❀ൢ{name}ൢ❀༻꧂',
    preview: '꧁༺❀ൢ彪哥ൢ❀༻꧂'
  },
  {
    id: 'wings_5',
    name: '藏文翅膀',
    style: '꧁༺ཌ༈{name}༈ད༻꧂',
    preview: '꧁༺ཌ༈彪哥༈ད༻꧂'
  },
  {
    id: 'wings_6',
    name: '简版翅膀',
    style: '༺ཌ{name}ད༻',
    preview: '༺ཌ彪哥ད༻'
  },
  {
    id: 'wings_7',
    name: '单边翅膀左',
    style: '༺❀{name}❀༻',
    preview: '༺❀彪哥❀༻'
  },
  {
    id: 'wings_8',
    name: '藏文装饰',
    style: '༺ཌༀൢ{name}ༀད༻',
    preview: '༺ཌༀൢ彪哥ༀད༻'
  },
  {
    id: 'wings_9',
    name: '简约翅膀',
    style: '༄{name}༄',
    preview: '༄彪哥༄'
  },
  {
    id: 'wings_10',
    name: '星月翅膀',
    style: '꧁༺༒{name}༒༻꧂',
    preview: '꧁༺༒彪哥༒༻꧂'
  },
  {
    id: 'wings_11',
    name: '花边昵称',
    style: '๑{name}๑',
    preview: '๑彪哥๑'
  },
  {
    id: 'wings_12',
    name: '双心翅膀',
    style: '♡{name}♡',
    preview: '♡彪哥♡'
  },
  {
    id: 'wings_13',
    name: '星星翅膀',
    style: '★{name}★',
    preview: '★彪哥★'
  },
  {
    id: 'wings_14',
    name: '皇冠昵称',
    style: '👑{name}👑',
    preview: '👑彪哥👑'
  },
  {
    id: 'wings_15',
    name: '天使翅膀',
    style: 'ଘ{name}ଓ',
    preview: 'ଘ彪哥ଓ'
  },
  {
    id: 'wings_16',
    name: '花藤昵称',
    style: '༺{name}༻',
    preview: '༺彪哥༻'
  },
  {
    id: 'wings_17',
    name: '边框昵称',
    style: '╰{name}╯',
    preview: '╰彪哥╯'
  },
  {
    id: 'wings_18',
    name: '音符翅膀',
    style: '♫{name}♫',
    preview: '♫彪哥♫'
  },
  {
    id: 'wings_19',
    name: '闪亮翅膀',
    style: '✨{name}✨',
    preview: '✨彪哥✨'
  },
  {
    id: 'wings_20',
    name: '火焰翅膀',
    style: '🔥{name}🔥',
    preview: '🔥彪哥🔥'
  }
];

/**
 * 生成翅膀昵称
 * @param {string} name - 用户昵称
 * @param {string} styleId - 样式ID
 * @returns {string} 生成的翅膀昵称
 */
function generateWingName(name, styleId) {
  const template = WINGS_TEMPLATES.find(t => t.id === styleId);
  if (!template) {
    return name;
  }
  return template.style.replace('{name}', name);
}

/**
 * 批量生成所有样式的预览
 * @param {string} name - 用户昵称
 * @returns {Array} 所有样式的预览列表
 */
function generateAllPreviews(name) {
  return WINGS_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name,
    result: template.style.replace('{name}', name)
  }));
}

module.exports = {
  WINGS_TEMPLATES,
  generateWingName,
  generateAllPreviews
};
