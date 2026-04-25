// idiom-battle.js - 成语对战页面
const dataService = require('../../utils/idiom-data-service.js');
const utils = require('../../../../utils/index');
const { playSound } = utils;
const USER_STATS_KEY = 'idiom_battle_stats';

Page({
  data: {
    loading: true,
    battleState: 'idle',   // idle | playing | ended
    battleFirst: 'user',
    battleRound: 0,
    battleTimer: 60,
    battleTurn: 'user',
    battleChain: [],
    battleInput: '',
    battleHint: '',
    battleResult: '',      // win | lose | timeout
    battleChainText: '',
    userStats: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },
  },

  onLoad() {
    this._timer = null;
    this._battleUsed = new Set();
    this._battleConfirming = false;
    this._lastPinyin = null;
    this._lastCharNeed = null;
    // 推迟 Storage 读取，避免 onLoad 耗时过长触发 execute-long-time 警告
    setTimeout(() => {
      this._loadData();
      this._loadUserStats();
    }, 0);
  },

  onPullDownRefresh() {
    this._clearAndReload();
  },

  onUnload() {
    this._clearTimer();
  },

  // =====================
  //  分享功能
  // =====================
  onShareAppMessage() {
    const { battleState, battleRound, userStats } = this.data;
    let title = '成语对战 - 来挑战AI吧！';
    if (battleState === 'ended') {
      title = `我在成语对战中坚持了${battleRound}轮，战绩${userStats.wins}胜${userStats.losses}负，来挑战我吧！`;
    } else if (battleState === 'playing') {
      title = `成语对战进行中，已进行${battleRound}轮，来观战吧！`;
    }
    return {
      title,
      path: '/packages/life/pages/idiom-battle/idiom-battle',
    };
  },

  onShareTimeline() {
    const { userStats } = this.data;
    return {
      title: `成语对战 - 战绩${userStats.wins}胜${userStats.losses}负，最高连胜${userStats.bestStreak}，来挑战吧！`,
    };
  },

  // =====================
  //  先手选择 & 开始
  // =====================
  onChooseFirst(e) {
    const first = e.currentTarget.dataset.first;
    this.setData({ battleFirst: first });
  },

  onStartBattle() {
    if (!dataService.isReady()) {
      wx.showToast({ title: '数据加载中…', icon: 'none' });
      return;
    }

    this._clearTimer();
    this._battleUsed = new Set();

    const startWord = dataService.getRandomWord();
    if (!startWord) {
      wx.showToast({ title: '词库为空', icon: 'none' });
      return;
    }
    const first = this.data.battleFirst;

    this._lastPinyin = dataService.getLastPy(startWord);
    this._lastCharNeed = startWord.slice(-1);
    this._battleUsed.add(startWord);

    const chain = [{ word: startWord, side: 'system', lastChar: this._lastChar(startWord) }];

    this.setData({
      battleState: 'playing',
      battleRound: 1,
      battleTurn: first,
      battleChain: chain,
      battleInput: '',
      battleHint: `请接："${this._lastChar(startWord)}"字开头`,
      battleResult: '',
    });

    if (first === 'ai') {
      playSound('click', { pageId: 'idiom-battle' });
      setTimeout(() => this._aiMove(), 800);
    } else {
      playSound('click', { pageId: 'idiom-battle' });
      this._startTimer();
    }
  },

  // =====================
  //  用户出招
  // =====================
  onBattleInput(e) {
    this.setData({ battleInput: e.detail.value });
  },

  onBattleConfirm() {
    if (this._battleConfirming) return;
    if (this.data.battleTurn !== 'user') return;
    this._battleConfirming = true;

    const word = this.data.battleInput.trim().replace(/\s+/g, '');

    if (!word) { this._battleConfirming = false; return; }

    if (word.length !== 4) {
      wx.showToast({ title: '请输入四字成语', icon: 'none' });
      this._battleConfirming = false;
      return;
    }

    if (!dataService.hasWord(word)) {
      wx.showToast({ title: '该成语不在词库中', icon: 'none' });
      this._battleConfirming = false;
      return;
    }

    if (this._battleUsed.has(word)) {
      wx.showToast({ title: '该成语已用过', icon: 'none' });
      this._battleConfirming = false;
      return;
    }

    const needChar = this._lastCharNeed;
    const firstChar = word[0];
    const firstPy = dataService.getFirstPy(word);
    const lastPy = this._lastPinyin;
    const isCharMatch = (firstChar === needChar);
    const isPyMatch = (firstPy && firstPy === lastPy);

    if (!isCharMatch && !isPyMatch) {
      wx.showToast({ title: `首字应为"${needChar}"或同音字`, icon: 'none' });
      this._battleConfirming = false;
      return;
    }

    this._clearTimer();
    const lastChar = this._lastChar(word);
    const newItem = { word, side: 'user', lastChar };
    const chain = [...this.data.battleChain, newItem];
    this._battleUsed.add(word);
    this._lastPinyin = dataService.getLastPy(word) || this._lastPinyin;
    this._lastCharNeed = lastChar;

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleInput: '',
      battleTurn: 'ai',
      battleHint: '🤖 AI 正在思考…',
    });

    playSound('click', { pageId: 'idiom-battle' });

    this._battleConfirming = false;

    const candidates = this._getCandidates(this._lastPinyin);
    if (!candidates.length) {
      this._endBattle('win');
      return;
    }
    setTimeout(() => this._aiMove(), 800);
  },

  // =====================
  //  AI 出招
  // =====================
  _aiMove() {
    const candidates = this._getCandidates(this._lastPinyin);
    if (!candidates.length) {
      this._endBattle('lose');
      return;
    }
    const word = candidates[Math.floor(Math.random() * Math.min(8, candidates.length))];
    const lastChar = this._lastChar(word);
    const newItem = { word, side: 'ai', lastChar };
    const chain = [...this.data.battleChain, newItem];
    this._battleUsed.add(word);
    this._lastPinyin = dataService.getLastPy(word) || this._lastPinyin;
    this._lastCharNeed = lastChar;

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleTurn: 'user',
      battleHint: `请接："${lastChar}"字开头`,
    });
    playSound('click', { pageId: 'idiom-battle' });
    this._startTimer();
  },

  _getCandidates(lastPinyin) {
    if (!lastPinyin) return [];
    const list = dataService.getCandidates(lastPinyin);
    if (!list) return [];
    return list.filter(w => !this._battleUsed.has(w));
  },

  // =====================
  //  认输 & 结束
  // =====================
  onSurrender() {
    this._clearTimer();
    this._endBattle('lose');
  },

  _endBattle(result) {
    this._clearTimer();
    const { userStats } = this.data;
    const newStats = { ...userStats };

    if (result === 'win') {
      playSound('win', { pageId: 'idiom-battle' });
      newStats.wins++;
      newStats.streak++;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak);
    } else {
      playSound('lose', { pageId: 'idiom-battle' });
      newStats.losses++;
      newStats.streak = 0;
    }

    this._saveUserStats(newStats);
    const battleChainText = this.data.battleChain.map(i => i.word).join(' → ');
    this.setData({ battleState: 'ended', battleResult: result, userStats: newStats, battleChainText });
  },

  onRestartBattle() {
    this._battleUsed = new Set();
    this._lastPinyin = null;
    this._lastCharNeed = null;
    this.setData({
      battleState: 'idle',
      battleChain: [],
      battleInput: '',
      battleHint: '',
      battleResult: '',
      battleRound: 0,
    });
  },

  // =====================
  //  计时器
  // =====================
  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  _startTimer() {
    this._clearTimer();
    this.setData({ battleTimer: 300 });
    this._timer = setInterval(() => {
      const t = this.data.battleTimer - 1;
      if (t <= 0) {
        this._clearTimer();
        this._endBattle('timeout');
      } else {
        this.setData({ battleTimer: t });
        // 倒计时紧迫时（≤30秒）播放滴答音效
        if (t <= 30) {
          playSound('tick', { pageId: 'idiom-battle' });
        }
      }
    }, 1000);
  },

  _clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  // =====================
  //  用户战绩持久化
  // =====================
  _loadUserStats() {
    try {
      const s = wx.getStorageSync(USER_STATS_KEY);
      if (s) this.setData({ userStats: s });
    } catch (e) {
      // ignore
    }
  },

  _saveUserStats(s) {
    try {
      wx.setStorageSync(USER_STATS_KEY, s);
    } catch (e) {
      // ignore
    }
  },

  // =====================
  //  工具函数
  // =====================
  _lastChar(word) {
    return word.slice(-1);
  },

  // =====================
  //  数据加载 & 缓存管理
  // =====================
  _loadData() {
    this.setData({ loading: true });
    dataService.loadData(
      () => { this.setData({ loading: false }); },
      () => {}  // 尾字索引后台加载，battle 不需要逆查
    );
  },

  _clearAndReload() {
    // 如果正在对战中，不允许清空缓存
    if (this.data.battleState === 'playing') {
      wx.showToast({ 
        title: '请先结束当前对战', 
        icon: 'none',
        duration: 1500 
      });
      wx.stopPullDownRefresh();
      return;
    }
    
    wx.showLoading({ title: '清空缓存中…', mask: true });
    
    // 清空CDN缓存
    dataService.clearCache();
    
    // 延迟一下确保缓存已清空
    setTimeout(() => {
      this._loadData();
      wx.stopPullDownRefresh();
      wx.hideLoading();
      wx.showToast({ 
        title: '缓存已清空', 
        icon: 'success',
        duration: 1500 
      });
    }, 500);
  },
});
