/**
 * 昵称工具箱页面
 * 上标/下标：即输即反馈；翅膀/特效字/颜文字/符号：点击预览
 */

const { superscript, subscript, wings, effects, kaomoji, symbols } = require('./data/index.js');

Page({
  data: {
    activeTab: 'wings',

    tabs: [
      { id: 'wings', name: '翅膀' },
      { id: 'effects', name: '特效' },
      { id: 'kaomoji', name: '颜文字' },
      { id: 'symbols', name: '符号' }
    ],

    inputText: '',
    currentResult: '',

    // 上标/下标开关（可与翅膀/特效/颜文字/符号组合）
    scriptMode: 'off', // 'off' | 'superscript' | 'subscript'

    wingsList: [],
    selectedWingsId: '',

    effectsList: [],
    selectedEffectId: '',

    kaomojiCategories: [],
    currentKaomojiCategory: 'happy',
    currentKaomojiList: [],
    kaomojiSearchText: '',
    selectedKaomoji: '',
    kaomojiCategoryNames: {},

    symbolCategories: [],
    currentSymbolCategory: 'hearts',
    currentSymbolList: [],
    selectedSymbol: '',
    symbolCategoryNames: {},

    showToast: false,
    toastText: ''
  },

  onLoad() {
    this.initData();
  },

  initData() {
    const kaomojiCatNames = {
      happy: '开心', shy: '害羞', cry: '哭泣', angry: '生气', shocked: '震惊',
      helpless: '无奈', cute: '可爱', moe: '萌萌', thinking: '思考', sleep: '睡觉',
      kiss: '亲亲', smug: '得意', love: '恋爱', evil: '邪恶', scary: '恐怖',
      greet: '打招呼', thanks: '感谢', sorry: '抱歉', cheer: '加油', eat: '吃货',
      animals: '动物', awkward: '尴尬', sleepy: '困倦', cool: '酷炫',
      不幸: 'unfortunate', awesome: '超赞', expression: '表情', dance: '跳舞',
      dizzy: '晕眩', foodie: '美食', jiong: '囧', despise: '鄙视', envious: '羡慕', fighting: '加油'
    };
    const symbolCatNames = {
      hearts: '爱心', stars: '星星', flowers: '花朵', arrows: '箭头', music: '音乐',
      weather: '天气', games: '游戏', math: '数学', currency: '货币', greek: '希腊字母',
      brackets: '括号', geometry: '几何', numbers: '数字', letters: '字母', emoji: '表情',
      religion: '宗教', decorations: '装饰'
    };
    this.setData({
      wingsList: wings.WINGS_TEMPLATES,
      effectsList: effects.EFFECT_TEMPLATES,
      kaomojiCategories: kaomoji.getAllCategories(),
      currentKaomojiList: kaomoji.getKaomojiByCategory('happy'),
      symbolCategories: Object.keys(symbols.SPECIAL_SYMBOLS),
      currentSymbolList: symbols.getSymbolsByCategory('hearts'),
      kaomojiCategoryNames: kaomojiCatNames,
      symbolCategoryNames: symbolCatNames
    });
  },

  onTabChange(e) {
    const tabId = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tabId,
      kaomojiSearchText: '',
      selectedKaomoji: '',
      selectedSymbol: ''
    });
    // 保留翅膀/特效选中状态，只清除当前Tab特有的状态
    this._regenerateCurrentResult();
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
    this._regenerateCurrentResult();
  },

  onClearInput() {
    this.setData({ inputText: '', currentResult: '' });
  },

  // 上标/下标开关
  onScriptModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ scriptMode: mode });
    this._regenerateCurrentResult();
  },

  // ============================================================
  // 【核心】统一结果生成：inputText → 叠翅膀/特效 → 追加颜文字/符号 → 套上标/下标
  // ============================================================
  _buildRawResult() {
    const { inputText, selectedWingsId, selectedEffectId, selectedKaomoji, selectedSymbol } = this.data;
    if (!inputText) return '';
    // Step 1: 基础文字
    let raw = inputText;
    // Step 2: 叠翅膀/特效（围绕文字）
    if (selectedWingsId) {
      raw = wings.generateWingName(inputText, selectedWingsId);
    }
    if (selectedEffectId) {
      raw = effects.generateEffectText(raw, selectedEffectId);
    }
    // Step 3: 追加颜文字/符号（放在最后，不套上标）
    if (selectedKaomoji) {
      raw = raw + selectedKaomoji;
    }
    if (selectedSymbol) {
      raw = raw + selectedSymbol;
    }
    return raw;
  },

  _regenerateCurrentResult() {
    const raw = this._buildRawResult();
    this.setData({ currentResult: this._applyScript(raw) });
  },

  // 应用上标/下标
  _applyScript(text) {
    const { scriptMode } = this.data;
    if (!text || scriptMode === 'off') return text;
    // 颜文字/符号不需要上标；它们本身不在映射表中，保持原样
    return scriptMode === 'superscript'
      ? superscript.toSuperscript(text)
      : subscript.toSubscript(text);
  },

  onWingsSelect(e) {
    const styleId = e.currentTarget.dataset.id;
    const newId = this.data.selectedWingsId === styleId ? '' : styleId;
    this.setData({ selectedWingsId: newId });
    this._regenerateCurrentResult();
  },

  onEffectSelect(e) {
    const effectId = e.currentTarget.dataset.id;
    const newId = this.data.selectedEffectId === effectId ? '' : effectId;
    this.setData({ selectedEffectId: newId });
    this._regenerateCurrentResult();
  },

  generateMartian() {
    const { inputText } = this.data;
    if (!inputText) { this.showToast('请先输入内容'); return; }
    this.setData({ selectedEffectId: 'martian' });
    this._regenerateCurrentResult();
  },

  onKaomojiCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentKaomojiCategory: category,
      currentKaomojiList: kaomoji.getKaomojiByCategory(category),
      selectedKaomoji: ''
    });
    this._regenerateCurrentResult();
  },

  onKaomojiClick(e) {
    const text = e.currentTarget.dataset.text;
    const { selectedKaomoji } = this.data;
    if (selectedKaomoji === text) {
      // 再次点击 → 取消选中
      this.setData({ selectedKaomoji: '' });
    } else {
      this.setData({ selectedKaomoji: text });
    }
    this._regenerateCurrentResult();
    wx.showToast({ title: selectedKaomoji === text ? '已移除' : '已添加', icon: 'none', duration: 1000 });
  },

  onKaomojiSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ kaomojiSearchText: keyword });
    this.setData({
      currentKaomojiList: keyword
        ? kaomoji.searchKaomoji(keyword)
        : kaomoji.getKaomojiByCategory(this.data.currentKaomojiCategory)
    });
  },

  clearKaomojiSearch() {
    this.setData({
      kaomojiSearchText: '',
      currentKaomojiList: kaomoji.getKaomojiByCategory(this.data.currentKaomojiCategory)
    });
  },

  onSymbolCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentSymbolCategory: category,
      currentSymbolList: symbols.getSymbolsByCategory(category),
      selectedSymbol: ''
    });
    this._regenerateCurrentResult();
  },

  onSymbolClick(e) {
    const symbol = e.currentTarget.dataset.symbol;
    const { selectedSymbol } = this.data;
    if (selectedSymbol === symbol) {
      this.setData({ selectedSymbol: '' });
    } else {
      this.setData({ selectedSymbol: symbol });
    }
    this._regenerateCurrentResult();
    wx.showToast({ title: selectedSymbol === symbol ? '已移除' : '已添加', icon: 'none', duration: 1000 });
  },

  copyToClipboard(text) {
    wx.setClipboardData({ data: text });
  },

  onCopyResult() {
    const { currentResult } = this.data;
    if (currentResult) this.copyToClipboard(currentResult);
  },

  showToast(text) {
    this.setData({ showToast: true, toastText: text });
    setTimeout(() => this.setData({ showToast: false }), 2000);
  }
});
