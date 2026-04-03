// 成语接龙 - 主页面
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire';
const CACHE_KEY_INDEX = 'idiom_index_v1';       // first+last 索引缓存 key
const CACHE_KEY_TS    = 'idiom_index_ts';
const CACHE_EXPIRE    = 30 * 24 * 60 * 60 * 1000; // 30 天
const USER_STATS_KEY  = 'idiom_battle_stats';      // 对战战绩 key

Page({
  data: {
    // 当前 Tab
    activeTab: 0,   // 0=查询  1=对战  2=接龙链

    // ===== 通用加载状态 =====
    loading: true,
    loadError: '',

    // ===== 查询 Tab =====
    queryInput: '',
    queryResults: [],      // [{word, pinyin, lastChar, explanation}]
    queryCount: 0,
    queryTip: '请输入任意成语，查看可接龙的下联',
    queryHistory: [],      // 最近查询记录

    // ===== 对战 Tab =====
    battleState: 'idle',   // idle | ready | playing | ended
    battleFirst: 'user',   // 谁先手
    battleRound: 0,
    battleTimer: 30,
    battleTurn: 'user',    // 当前回合：user | ai
    battleChain: [],        // [{word, pinyin, side:'user'|'ai', lastChar}]
    battleInput: '',
    battleHint: '',
    battleResult: '',      // win | lose | timeout
    userStats: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },

    // ===== 接龙链 Tab =====
    chainInput: '',
    chainMaxLen: 10,
    chainResult: [],        // [{word, pinyin, lastChar}]
    chainRunning: false,
    chainCount: 0,
    chainTip: '输入起始成语，自动生成最长接龙链',

    // ===== 详情弹窗 =====
    showDetail: false,
    detailItem: null,
  },

  // =====================
  //  页面生命周期
  // =====================
  onLoad() {
    this._firstIndex = null;   // 首字索引 {a: [word, ...], b: [...]}
    this._lastIndex  = null;   // 尾字索引 {xian: [word, ...], ...}
    this._allWords   = null;   // 所有成语 Set，用于合法性校验
    this._lastPinyin = null;   // 当前成语尾字拼音
    this._timer      = null;
    this._battleUsed = new Set();

    this._loadUserStats();
    this._loadData();
  },

  onUnload() {
    this._clearTimer();
  },

  // =====================
  //  数据加载（CDN + 缓存）
  // =====================
  _loadData() {
    const now = Date.now();
    const cached = wx.getStorageSync(CACHE_KEY_INDEX);
    const ts    = wx.getStorageSync(CACHE_KEY_TS);

    if (cached && ts && (now - ts < CACHE_EXPIRE)) {
      console.log('[idiom] 使用缓存数据');
      this._applyIndexData(cached);
      return;
    }

    console.log('[idiom] 从CDN加载');
    wx.showLoading({ title: '加载数据…', mask: true });

    Promise.all([
      this._fetch(`${CDN_BASE}/idiom-first-index.json`),
      this._fetch(`${CDN_BASE}/idiom-last-index.json`),
    ]).then(([firstData, lastData]) => {
      const indexData = { firstIndex: firstData, lastIndex: lastData };
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
    this._firstIndex = data.firstIndex;   // {a:[], b:[], ...}
    this._lastIndex  = data.lastIndex;    // {xian:[], ...}
    this._buildAllWords(data.firstIndex);
    this.setData({ loading: false });
  },

  // 构建所有成语集合，用于合法性校验
  _buildAllWords(firstIndex) {
    const words = new Set();
    for (const arr of Object.values(firstIndex)) {
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
    if (!this._lastIndex) {
      wx.showToast({ title: '数据加载中…', icon: 'loading' });
      return;
    }

    // 规范化：去空格
    word = word.replace(/\s+/g, '');

    // 查尾字拼音
    const lastPy = this._getLastPinyin(word);
    if (!lastPy) {
      this.setData({ queryResults: [], queryCount: 0, queryTip: '未找到该成语，请检查输入' });
      return;
    }

    const candidates = this._lastIndex[lastPy] || [];
    if (candidates.length === 0) {
      this.setData({ queryResults: [], queryCount: 0, queryTip: `以"${this._lastChar(word)}"结尾的成语暂无接龙数据` });
      return;
    }

    // 按 abbr 排序（较常用的排前），取前 100 条
    const results = candidates.slice(0, 100).map(w => ({
      word,
      next: w,
      lastChar: this._lastChar(w),
      abbr: this._abbr(w),
    }));

    // 记录历史
    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    this.setData({
      queryResults: results,
      queryCount: candidates.length,
      queryTip: `共 ${candidates.length} 条，点击查看详情`,
      queryHistory: history,
    });
  },

  // 查询详情：需要加载 letter 文件获取拼音/释义
  onQueryItemTap(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;
    const fc = this._firstChar(word);
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

  // 复制结果
  // 历史记录点击
  onHistoryTap(e) {
    const word = e.currentTarget.dataset.word;
    if (word) this._doQuery(word);
  },

  // 接龙链长度输入
  onChainLenInput(e) {
    const v = parseInt(e.detail.value, 10);
    if (v > 0 && v <= 50) this.setData({ chainMaxLen: v });
  },
  onCopyResult() {
    if (!this.data.queryResults.length) return;
    const text = this.data.queryResults.map(r => `${r.word} → ${r.next}`).join('\n');
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制', icon: 'success' }) });
  },

  // =====================
  //  对战 Tab
  // =====================
  // 选择先手
  onChooseFirst(e) {
    const first = e.currentTarget.dataset.first;
    this.setData({ battleFirst: first, battleState: 'ready' });
  },

  // 开始对战
  onStartBattle() {
    this._clearTimer();
    this._battleUsed = new Set();

    // 选一个龙头成语
    const allWords = Object.values(this._firstIndex).flat();
    const startWord = allWords[Math.floor(Math.random() * allWords.length)];
    const first = this.data.battleFirst;

    this._lastPinyin = this._getLastPinyin(startWord);
    this._battleUsed.add(startWord);

    // 首成语标记为 AI（AI 选出来的），后续根据 first 决定谁接龙
    const chain = [{ word: startWord, side: 'system', pinyin: '', lastChar: this._lastChar(startWord) }];

    this.setData({
      battleState: 'playing',
      battleRound: 1,
      battleTurn: first,
      battleChain: chain,
      battleInput: '',
      battleHint: `请以"${this._lastChar(startWord)}"字开头接龙`,
      battleResult: '',
    });

    if (first === 'ai') {
      // AI 先手：选一个合法的接龙
      setTimeout(() => this._aiMove(), 600);
    } else {
      this._startTimer();
    }
  },

  // 用户输入成语并提交
  onBattleInput(e) {
    this.setData({ battleInput: e.detail.value });
  },

  onBattleConfirm() {
    const word = this.data.battleInput.trim().replace(/\s+/g, '');
    if (!word) return;

    // 合法性校验
    if (!this._allWords.has(word)) {
      wx.showToast({ title: '这不是常用成语', icon: 'none' });
      return;
    }
    if (this._battleUsed.has(word)) {
      wx.showToast({ title: '该成语已用过', icon: 'none' });
      return;
    }
    const firstChar = this._firstChar(word);
    if (firstChar !== this._lastPinyin) {
      wx.showToast({ title: `应以"${this._lastPinyin}"字开头`, icon: 'none' });
      return;
    }

    this._clearTimer();
    const lastChar = this._lastChar(word);
    const newItem = { word, side: 'user', lastChar };
    const chain = [...this.data.battleChain, newItem];
    this._battleUsed.add(word);
    this._lastPinyin = this._getLastPinyin(word);

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleInput: '',
      battleTurn: 'ai',
    });

    // 检查 AI 是否有合法接龙
    const candidates = this._getCandidates(this._lastPinyin);
    if (!candidates.length) {
      this._endBattle('win');
      return;
    }

    setTimeout(() => this._aiMove(), 600);
  },

  // AI 走一步
  _aiMove() {
    const candidates = this._getCandidates(this._lastPinyin);
    if (!candidates.length) {
      this._endBattle('lose');
      return;
    }
    // 优先选 abbr 靠前的（常用成语），加一点随机性
    const word = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
    const lastChar = this._lastChar(word);
    const newItem = { word, side: 'ai', lastChar };
    const chain = [...this.data.battleChain, newItem];
    this._battleUsed.add(word);
    this._lastPinyin = this._getLastPinyin(word);

    this.setData({
      battleChain: chain,
      battleRound: this.data.battleRound + 1,
      battleTurn: 'user',
      battleHint: `请以"${lastChar}"字开头接龙`,
    });
    this._startTimer();
  },

  // 获取可接龙的候选成语
  _getCandidates(lastPinyin) {
    const list = this._lastIndex[lastPinyin] || [];
    return list.filter(w => !this._battleUsed.has(w));
  },

  // 认输
  onSurrender() {
    this._clearTimer();
    this._endBattle('lose');
  },

  // 结束对战
  _endBattle(result) {
    this._clearTimer();
    const { userStats } = this.data;
    let newStats = { ...userStats };

    if (result === 'win') {
      newStats.wins++;
      newStats.streak++;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.streak);
    } else {
      newStats.losses++;
      newStats.streak = 0;
    }

    this._saveUserStats(newStats);
    this.setData({
      battleState: 'ended',
      battleResult: result,
      userStats: newStats,
    });
  },

  // 重开
  onRestartBattle() {
    this.setData({ battleState: 'idle' });
  },

  // 计时器
  _startTimer() {
    this._clearTimer();
    this.setData({ battleTimer: 30 });
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

  // 战绩存取
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

  onGenerateChain() {
    const v = this.data.chainInput.trim();
    if (v) this._doChain(v);
  },

  onChainClear() {
    this.setData({ chainResult: [], chainCount: 0, chainInput: '' });
  },

  _doChain(startWord) {
    if (!this._lastIndex) {
      wx.showToast({ title: '数据加载中…', icon: 'loading' });
      return;
    }

    const word = startWord.replace(/\s+/g, '');
    if (!this._allWords.has(word)) {
      wx.showToast({ title: '这不是常用成语', icon: 'none' });
      return;
    }

    this.setData({ chainRunning: true, chainResult: [], chainCount: 0, chainTip: '正在生成接龙链…' });

    // 在 worker 中跑 DFS（避免阻塞 UI）
    // 微信小程序的 Worker 有 200KB 脚本体积限制，这里直接在主线程跑（接龙链规模可控）
    setTimeout(() => {
      const maxLen = this.data.chainMaxLen;
      const result = this._dfsChain(word, maxLen);
      this.setData({ chainRunning: false, chainResult: result, chainCount: result.length, chainTip: `生成了 ${result.length} 个成语` });
    }, 50);
  },

  _dfsChain(startWord, maxLen) {
    const used = new Set([startWord]);
    const path = [startWord];
    // best 是数组引用，不能重新赋值
    const best = [startWord];
    const lastPy = this._getLastPinyin(startWord);

    const dfs = (lastPinyin, depth) => {
      if (depth >= maxLen) {
        if (path.length > best.length) { best.length = 0; best.push(...path); }
        return;
      }
      const candidates = (this._lastIndex[lastPinyin] || []).filter(w => !used.has(w));
      if (candidates.length === 0) {
        if (path.length > best.length) { best.length = 0; best.push(...path); }
        return;
      }
      // 取前 20 个候选，避免搜索爆炸
      for (const w of candidates.slice(0, 20)) {
        used.add(w);
        path.push(w);
        dfs(this._getLastPinyin(w), depth + 1);
        path.pop();
        used.delete(w);
      }
    };

    dfs(lastPy, 1);
    return [...best];
  },

  // 保存接龙链图片（用 canvas 画）
  onSaveChainImage() {
    if (!this.data.chainResult.length) return;
    const chain = this.data.chainResult;
    const W = 350, H = 60 + chain.length * 50;
    const ctx = wx.createCanvasContext('chainCanvas');

    ctx.setFillStyle('#f8f9fa');
    ctx.fillRect(0, 0, W, H);

    ctx.setFont('20px sans-serif');
    ctx.setFillStyle('#2c3e50');
    ctx.setTextAlign('center');
    ctx.fillText('成语接龙', W / 2, 36);

    chain.forEach((w, i) => {
      const y = 70 + i * 50;
      const isFirst = i === 0;
      ctx.setFillStyle(isFirst ? '#3498db' : '#27ae60');
      ctx.fillRect(15, y - 20, W - 30, 36, 8);
      ctx.setFillStyle('#fff');
      ctx.fillText(w, W / 2, y + 5);
      if (i < chain.length - 1) {
        ctx.setFillStyle('#bdc3c7');
        ctx.fillText('↓', W / 2, y + 28);
      }
    });

    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'chainCanvas',
        success: res => wx.saveImageToPhotosAlbum({ filePath: res.tempFilePath }),
        fail: err => wx.showToast({ title: '保存失败', icon: 'none' }),
      });
    });
  },

  // =====================
  //  工具函数
  // =====================
  // 获取成语尾字拼音（无声调）
  _getLastPinyin(word) {
    if (!this._lastIndex) return null;
    for (const [py, arr] of Object.entries(this._lastIndex)) {
      if (arr.includes(word)) return py;
    }
    return null;
  },

  // 获取成语末字（汉字）
  _lastChar(word) {
    return word.slice(-1);
  },

  // 获取成语首字拼音的第一个字母
  _firstChar(word) {
    if (!this._firstIndex) return '';
    for (const [fc, arr] of Object.entries(this._firstIndex)) {
      if (arr.includes(word)) return fc;
    }
    return '';
  },

  // 成语首字母缩写
  _abbr(word) {
    let r = '';
    for (const c of word) {
      if (c >= '\u4e00' && c <= '\u9fa5') r += c;
      if (r.length === 4) break;
    }
    return r;
  },
});
