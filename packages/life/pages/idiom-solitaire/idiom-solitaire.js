// 成语接龙 - 主页面
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire';
const CACHE_KEY_INDEX = 'idiom_index_v2';
const CACHE_KEY_TS    = 'idiom_index_ts_v2';
const CACHE_EXPIRE    = 30 * 24 * 60 * 60 * 1000; // 30 天
const USER_STATS_KEY  = 'idiom_battle_stats';

Page({
  data: {
    activeTab: 0,   // 0=查询  1=对战  2=接龙链

    loading: true,
    loadError: '',

    // ===== 查询 Tab =====
    queryInput: '',
    queryResults: [],
    queryCount: 0,
    queryTip: '输入任意成语，查看可接龙的下联',
    queryHistory: [],

    // ===== 对战 Tab =====
    battleState: 'idle',   // idle | playing | ended
    battleFirst: 'user',
    battleRound: 0,
    battleTimer: 60,
    battleTurn: 'user',
    battleChain: [],
    battleInput: '',
    battleHint: '',
    battleResult: '',      // win | lose | timeout
    battleChainText: '',   // 结束后展示的接龙链文字
    userStats: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },

    // ===== 接龙链 Tab =====
    chainInput: '',
    chainMaxLen: 10,
    chainResult: [],
    chainRunning: false,
    chainCount: 0,
    chainTip: '输入起始成语，自动生成接龙链',

    // ===== 详情弹窗 =====
    showDetail: false,
    detailItem: null,
  },

  onLoad() {
    this._firstFullIndex = null;  // 首字完整拼音索引 {wei:[], xian:[], ...}
    this._lastIndex      = null;  // 尾字完整拼音索引 {wei:[], xian:[], ...}
    this._allWords       = null;  // 所有成语 Set
    this._lastPinyin     = null;  // 当前回合需接的拼音
    this._timer          = null;
    this._battleUsed     = new Set();

    this._loadUserStats();
    this._loadData();
  },

  onUnload() {
    this._clearTimer();
  },

  // =====================
  //  数据加载
  // =====================
  _loadData() {
    const now    = Date.now();
    const cached = wx.getStorageSync(CACHE_KEY_INDEX);
    const ts     = wx.getStorageSync(CACHE_KEY_TS);

    if (cached && ts && (now - ts < CACHE_EXPIRE)) {
      this._applyIndexData(cached);
      return;
    }

    wx.showLoading({ title: '加载数据…', mask: true });

    Promise.all([
      this._fetch(`${CDN_BASE}/idiom-first-full-index.json`),
      this._fetch(`${CDN_BASE}/idiom-last-index.json`),
    ]).then(([firstFullData, lastData]) => {
      const indexData = { firstFullIndex: firstFullData, lastIndex: lastData };
      wx.setStorageSync(CACHE_KEY_INDEX, indexData);
      wx.setStorageSync(CACHE_KEY_TS, now);
      wx.hideLoading();
      this._applyIndexData(indexData);
    }).catch(err => {
      wx.hideLoading();
      console.error('[idiom] 加载失败', err);
      this.setData({ loading: false, loadError: '数据加载失败，请检查网络后重试' });
    });
  },

  _fetch(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        timeout: 15000,
        success: res => res.statusCode === 200 && res.data ? resolve(res.data) : reject(new Error('bad status')),
        fail: reject,
      });
    });
  },

  _applyIndexData(data) {
    this._firstFullIndex = data.firstFullIndex;
    this._lastIndex      = data.lastIndex;
    this._buildAllWords(data.firstFullIndex);
    this.setData({ loading: false });
  },

  _buildAllWords(firstFullIndex) {
    const words = new Set();
    for (const arr of Object.values(firstFullIndex)) {
      for (const w of arr) words.add(w);
    }
    this._allWords = words;
  },

  // =====================
  //  Tab 切换
  // =====================
  onTabChange(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    this.setData({ activeTab: idx });
  },

  // =====================
  //  查询 Tab
  // =====================
  onQueryInput(e) {
    this.setData({ queryInput: e.detail.value });
  },

  onQueryConfirm(e) {
    const val = e.detail.value.trim();
    if (val) this._doQuery(val);
  },

  onQuerySearch() {
    const val = this.data.queryInput.trim();
    if (val) this._doQuery(val);
  },

  _doQuery(word) {
    if (!this._lastIndex || !this._firstFullIndex) {
      wx.showToast({ title: '数据加载中…', icon: 'loading' });
      return;
    }

    word = word.replace(/\s+/g, '');

    // 获取尾字拼音
    const lastPy = this._getWordLastPinyin(word);
    if (!lastPy) {
      this.setData({ queryResults: [], queryCount: 0, queryTip: `"${word}" 不在词库中，请检查输入` });
      return;
    }

    // 用 firstFullIndex 查以该拼音开头的成语
    const candidates = this._firstFullIndex[lastPy] || [];
    if (candidates.length === 0) {
      this.setData({ queryResults: [], queryCount: 0, queryTip: `以"${this._lastChar(word)}"字开头的成语暂无接龙数据` });
      return;
    }

    const results = candidates.slice(0, 100).map(w => ({
      word,
      next: w,
      lastChar: this._lastChar(w),
    }));

    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    this.setData({
      queryResults: results,
      queryCount: candidates.length,
      queryTip: `共 ${candidates.length} 条接龙`,
      queryHistory: history,
    });
  },

  onQueryItemTap(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;
    const fc = this._getFirstLetter(word);
    if (!fc) return;
    const url = `${CDN_BASE}/letter/${fc}.json`;
    wx.showLoading({ title: '加载中…', mask: true });
    this._fetch(url).then(arr => {
      wx.hideLoading();
      const item = (arr || []).find(i => i.w === word);
      if (item) {
        this.setData({ showDetail: true, detailItem: { word, pinyin: item.p, explanation: item.e, derivation: item.d } });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onDetailClose() {
    this.setData({ showDetail: false, detailItem: null });
  },

  onHistoryTap(e) {
    const word = e.currentTarget.dataset.word;
    if (word) this._doQuery(word);
  },

  onCopyResult() {
    if (!this.data.queryResults.length) return;
    const text = this.data.queryResults.map(r => r.next).join(' → ');
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  },

  // =====================
  //  对战 Tab
  // =====================
  onChooseFirst(e) {
    const first = e.currentTarget.dataset.first;
    this.setData({ battleFirst: first });
  },

  onStartBattle() {
    if (!this._firstFullIndex || !this._lastIndex) {
      wx.showToast({ title: '数据加载中', icon: 'loading' });
      return;
    }
    this._clearTimer();
    this._battleUsed = new Set();

    // 随机选一个四字成语作为龙头
    const allWords = Object.values(this._firstFullIndex).flat().filter(w => w.length === 4);
    const startWord = allWords[Math.floor(Math.random() * allWords.length)];
    const first = this.data.battleFirst;

    this._lastPinyin = this._getWordLastPinyin(startWord);
    this._battleUsed.add(startWord);

    const chain = [{ word: startWord, side: 'system', lastChar: this._lastChar(startWord) }];

    this.setData({
      battleState: 'playing',
      battleRound: 1,
      battleTurn: first,
      battleChain: chain,
      battleInput: '',
      battleHint: `请接：以"${this._lastChar(startWord)}"字开头`,
      battleResult: '',
    });

    if (first === 'ai') {
      setTimeout(() => this._aiMove(), 800);
    } else {
      this._startTimer();
    }
  },

  onBattleInput(e) {
    this.setData({ battleInput: e.detail.value });
  },

  onBattleConfirm() {
    if (this.data.battleTurn !== 'user') return;
    const word = this.data.battleInput.trim().replace(/\s+/g, '');
    if (!word) return;

    // 1. 是否在词库中（宽松：不在词库也允许，只要是4字）
    if (word.length < 2) {
      wx.showToast({ title: '请输入成语', icon: 'none' });
      return;
    }

    // 2. 是否用过
    if (this._battleUsed.has(word)) {
      wx.showToast({ title: '该成语已用过', icon: 'none' });
      return;
    }

    // 3. 首字是否匹配（汉字接龙：首字汉字必须与上一个成语末字相同）
    const needChar = this._getPinyinLastChar(this._lastPinyin);
    const firstChar = word[0];
    // 支持两种规则：同字 或 同音
    const firstPy = this._getWordFirstPinyin(word);
    const isMatch = (firstChar === needChar) || (firstPy && firstPy === this._lastPinyin);
    if (!isMatch) {
      wx.showToast({ title: `首字应为"${needChar}"`, icon: 'none' });
      return;
    }

    this._clearTimer();
    const lastChar = this._lastChar(word);
    const newItem = { word, side: 'user', lastChar };
    const chain = [...this.data.battleChain, newItem];
    this._battleUsed.add(word);
    this._lastPinyin = this._getWordLastPinyin(word) || this._getCharPinyin(lastChar);

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleInput: '',
      battleTurn: 'ai',
    });

    const candidates = this._getCandidates(this._lastPinyin);
    if (!candidates.length) {
      this._endBattle('win');
      return;
    }

    setTimeout(() => this._aiMove(), 800);
  },

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
    this._lastPinyin = this._getWordLastPinyin(word);

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleTurn: 'user',
      battleHint: `请接：以"${lastChar}"字开头`,
    });
    this._startTimer();
  },

  _getCandidates(lastPinyin) {
    if (!lastPinyin || !this._firstFullIndex) return [];
    const list = this._firstFullIndex[lastPinyin] || [];
    return list.filter(w => !this._battleUsed.has(w));
  },

  onSurrender() {
    this._clearTimer();
    this._endBattle('lose');
  },

  _endBattle(result) {
    this._clearTimer();
    const { userStats } = this.data;
    const newStats = { ...userStats };

    if (result === 'win') {
      newStats.wins++;
      newStats.streak++;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak);
    } else {
      newStats.losses++;
      newStats.streak = 0;
    }

    this._saveUserStats(newStats);
    const battleChainText = this.data.battleChain.map(i => i.word).join(' → ');
    this.setData({ battleState: 'ended', battleResult: result, userStats: newStats, battleChainText });
  },

  onRestartBattle() {
    this.setData({ battleState: 'idle', battleChain: [], battleInput: '', battleHint: '' });
  },

  _startTimer() {
    this._clearTimer();
    this.setData({ battleTimer: 60 });
    this._timer = setInterval(() => {
      const t = this.data.battleTimer - 1;
      if (t <= 0) {
        this._clearTimer();
        this._endBattle('timeout');
      } else {
        this.setData({ battleTimer: t });
      }
    }, 1000);
  },

  _clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _loadUserStats() {
    const s = wx.getStorageSync(USER_STATS_KEY);
    if (s) this.setData({ userStats: s });
  },

  _saveUserStats(s) {
    wx.setStorageSync(USER_STATS_KEY, s);
  },

  // =====================
  //  接龙链 Tab（DFS）
  // =====================
  onChainInput(e) {
    this.setData({ chainInput: e.detail.value });
  },

  onChainConfirm(e) {
    const v = e.detail.value.trim();
    if (v) this._doChain(v);
  },

  onChainLenInput(e) {
    const v = parseInt(e.detail.value, 10);
    if (v > 0 && v <= 50) this.setData({ chainMaxLen: v });
  },

  onGenerateChain() {
    const v = this.data.chainInput.trim();
    if (v) this._doChain(v);
  },

  onChainClear() {
    this.setData({ chainResult: [], chainCount: 0, chainInput: '', chainTip: '输入起始成语，自动生成接龙链' });
  },

  _doChain(startWord) {
    if (!this._firstFullIndex || !this._lastIndex) {
      wx.showToast({ title: '数据加载中…', icon: 'loading' });
      return;
    }

    const word = startWord.replace(/\s+/g, '');
    if (!this._allWords.has(word)) {
      wx.showToast({ title: '词库中未收录此成语', icon: 'none' });
      return;
    }

    this.setData({ chainRunning: true, chainResult: [], chainCount: 0, chainTip: '正在搜索接龙链…' });

    setTimeout(() => {
      const maxLen = this.data.chainMaxLen;
      const result = this._dfsChain(word, maxLen);
      this.setData({
        chainRunning: false,
        chainResult: result,
        chainCount: result.length,
        chainTip: `生成了 ${result.length} 个成语的接龙链`,
      });
    }, 50);
  },

  _dfsChain(startWord, maxLen) {
    const used = new Set([startWord]);
    const path = [startWord];
    const best = [startWord];
    const lastPy = this._getWordLastPinyin(startWord);

    const dfs = (lastPinyin, depth) => {
      if (depth >= maxLen) {
        if (path.length > best.length) { best.length = 0; best.push(...path); }
        return;
      }
      const candidates = (this._firstFullIndex[lastPinyin] || []).filter(w => !used.has(w));
      if (candidates.length === 0) {
        if (path.length > best.length) { best.length = 0; best.push(...path); }
        return;
      }
      for (const w of candidates.slice(0, 15)) {
        used.add(w);
        path.push(w);
        dfs(this._getWordLastPinyin(w), depth + 1);
        path.pop();
        used.delete(w);
      }
    };

    dfs(lastPy, 1);
    return [...best];
  },

  onCopyChain() {
    if (!this.data.chainResult.length) return;
    const text = this.data.chainResult.join(' → ');
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  },

  // =====================
  //  工具函数
  // =====================

  // 获取成语的尾字完整拼音（从 lastIndex 反查）
  _getWordLastPinyin(word) {
    if (!this._lastIndex) return null;
    for (const [py, arr] of Object.entries(this._lastIndex)) {
      if (arr.includes(word)) return py;
    }
    return null;
  },

  // 获取成语的首字完整拼音（从 firstFullIndex 反查）
  _getWordFirstPinyin(word) {
    if (!this._firstFullIndex) return null;
    for (const [py, arr] of Object.entries(this._firstFullIndex)) {
      if (arr.includes(word)) return py;
    }
    return null;
  },

  // 获取拼音对应的汉字（通过 lastIndex 找以此拼音结尾的某个成语的末字）
  _getPinyinLastChar(py) {
    if (!py || !this._lastIndex) return py;
    const arr = this._lastIndex[py];
    if (arr && arr.length > 0) return arr[0].slice(-1);
    return py;
  },

  // 获取单字的拼音（从 firstFullIndex 找含该首字的成语，取其拼音 key）
  _getCharPinyin(ch) {
    if (!this._firstFullIndex) return null;
    for (const [py, arr] of Object.entries(this._firstFullIndex)) {
      if (arr.some(w => w[0] === ch)) return py;
    }
    return null;
  },

  _lastChar(word) {
    return word.slice(-1);
  },

  // 获取首字母（用于加载 letter 文件）
  _getFirstLetter(word) {
    if (!this._firstFullIndex) return null;
    for (const [py, arr] of Object.entries(this._firstFullIndex)) {
      if (arr.includes(word)) return py[0];
    }
    return null;
  },
});
