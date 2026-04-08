// idiom-query.js - 成语查询页面
const dataService = require('../../../../utils/idiom-data-service.js');

Page({
  data: {
    queryMode: 'forward',
    queryInput: '',
    queryPlaceholder: '输入任意成语，查看可接龙的下联',
    queryResults: [],
    queryTip: '输入任意成语，查看可接龙的下联',
    queryHistory: [],
    loading: true,
    hasContent: false, // 控制滚动区域显示

    // 详情弹窗
    showDetail: false,
    detailItem: null,
  },

  getModeLabel(mode = this.data.queryMode) {
    return mode === 'reverse' ? '逆查' : '顺查';
  },

  getModePlaceholder(mode = this.data.queryMode) {
    return mode === 'reverse'
      ? '输入任意成语，查看可接在前面的成语'
      : '输入任意成语，查看可接龙的下联';
  },

  buildQueryResults(word, candidates, mode = this.data.queryMode) {
    return candidates.slice(0, 100).map(matchWord => {
      if (mode === 'reverse') {
        return {
          leftWord: matchWord,
          rightWord: word,
          detailWord: matchWord,
          continueWord: matchWord,
          actionText: '继续逆查'
        };
      }

      return {
        leftWord: word,
        rightWord: matchWord,
        detailWord: matchWord,
        continueWord: matchWord,
        actionText: '继续顺查'
      };
    });
  },

  onLoad() {
    this._letterCache = {};  // 页面级内存缓存：{ [firstLetter]: Array }
    // 推迟 Storage 读取，避免 onLoad 耗时过长触发 execute-long-time 警告
    setTimeout(() => this._loadData(), 0);
  },

  onPullDownRefresh() {
    this._clearAndReload();
  },

  // =====================
  //  输入处理
  // =====================
  onQueryInput(e) {
    this.setData({ queryInput: e.detail.value });
  },

  onQueryConfirm(e) {
    const val = e.detail.value.trim();
    if (val) this._doQuery(val);
  },

  onQueryModeChange(e) {

    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.queryMode) return;

    const queryInput = this.data.queryInput.trim();
    const queryPlaceholder = this.getModePlaceholder(mode);

    this.setData({
      queryMode: mode,
      queryPlaceholder,
      queryTip: queryInput ? this.data.queryTip : queryPlaceholder,
      hasContent: queryInput ? this.data.hasContent : false,
    });

    if (queryInput && dataService.isReady()) {
      this._doQuery(queryInput, mode);
      return;
    }

    this.setData({
      queryResults: [],
      queryTip: queryPlaceholder,
      hasContent: false,
    });
  },

  // =====================
  //  查询逻辑
  // =====================

  _doQuery(word, mode = this.data.queryMode) {
    if (!dataService.isReady()) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'none' });
      return;
    }

    word = word.replace(/\s+/g, '');
    const queryPlaceholder = this.getModePlaceholder(mode);
    const modeLabel = this.getModeLabel(mode);

    // 先检查是否在成语库中
    if (!dataService.hasWord(word)) {
      wx.showToast({
        title: `"${word}" 不在成语词库中`,
        icon: 'none',
        duration: 2000
      });
      this.setData({
        queryMode: mode,
        queryResults: [],
        queryPlaceholder,
        queryTip: queryPlaceholder,
        hasContent: false,
      });
      this.queryCount = 0;
      return;
    }

    const result = dataService.querySolitaire(word, mode);

    if (result.error) {
      let errorMessage = result.error;

      if (result.error === '该成语不在词库中') {
        errorMessage = `"${word}" 不在成语词库中`;
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });

      this.setData({
        queryMode: mode,
        queryResults: [],
        queryPlaceholder,
        queryTip: queryPlaceholder,
        hasContent: false,
      });
      this.queryCount = 0;
      return;
    }

    const results = this.buildQueryResults(word, result.candidates, mode);

    // 更新历史记录
    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    wx.setStorageSync('idiom_query_history', history);

    this.setData({
      queryMode: mode,
      queryInput: word,
      queryPlaceholder,
      queryResults: results,
      queryTip: result.candidates.length > 0 ? `共 ${result.candidates.length} 条${modeLabel}结果` : `暂无${modeLabel}结果`,
      queryHistory: history,
      hasContent: true,
    });
    this.queryCount = result.candidates.length;
  },

  // =====================
  //  结果项点击 → 显示详情
  // =====================
  onQueryItemTap(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;

    const fc = dataService.getFirstLetter(word);
    if (!fc) return;

    // 1. 命中页面级内存缓存 → 直接展示，无任何 loading
    if (this._letterCache[fc]) {
      const item = this._letterCache[fc].find(i => i.w === word);
      if (item) {
        this.setData({
          showDetail: true,
          detailItem: { word, pinyin: item.p, explanation: item.e, derivation: item.d },
        });
        return;
      }
    }

    // 2. 未命中内存缓存 → 走 dataService（内部优先 Storage 缓存，其次 CDN）
    wx.showLoading({ title: '加载中…', mask: true });

    dataService.fetchLetterData(fc).then(arr => {
      wx.hideLoading();
      this._letterCache[fc] = arr || [];  // 写入内存缓存
      const item = this._letterCache[fc].find(i => i.w === word);
      if (item) {
        this.setData({
          showDetail: true,
          detailItem: { word, pinyin: item.p, explanation: item.e, derivation: item.d },
        });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  // =====================
  //  点击结果 → 继续顺查或逆查
  // =====================

  onContinueChain(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;
    this.setData({ queryInput: word });
    this._doQuery(word);
  },

  // =====================
  //  详情弹窗
  // =====================
  onDetailClose() {
    this.setData({ showDetail: false, detailItem: null });
  },

  // =====================
  //  复制释义
  // =====================
  onCopyExplanation() {
    const { detailItem } = this.data;
    if (!detailItem || !detailItem.explanation) return;
    
    const text = `${detailItem.word}（${detailItem.pinyin}）：${detailItem.explanation}`;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '释义已复制', icon: 'success' }),
    });
  },

  // =====================
  //  历史记录点击
  // =====================
  onHistoryTap(e) {
    const word = e.currentTarget.dataset.word;
    if (word) {
      this.setData({ queryInput: word });
      this._doQuery(word);
    }
  },

  // =====================
  //  复制结果
  // =====================
  onCopyResult() {
    if (!this.data.queryResults.length) return;
    const text = this.data.queryResults.map(item => `${item.leftWord} → ${item.rightWord}`).join('\n');
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  // =====================
  //  清空查询
  // =====================
  onClearQuery() {
    const queryPlaceholder = this.getModePlaceholder();
    this.setData({
      queryInput: '',
      queryResults: [],
      queryPlaceholder,
      queryTip: queryPlaceholder,
      hasContent: false,
    });
    this.queryCount = 0;
  },

  // =====================
  //  分享功能
  // =====================
  onShareAppMessage() {
    const { queryInput } = this.data;
    const queryCount = this.queryCount || 0;
    const title = queryInput
      ? `「${queryInput}」有${queryCount}个接龙成语，来看看吧！`
      : '成语查询 - 输入成语查看可接龙的下联';
    return {
      title,
      path: '/packages/life/pages/idiom-query/idiom-query',
    };
  },

  onShareTimeline() {
    const { queryInput } = this.data;
    const queryCount = this.queryCount || 0;
    return {
      title: queryInput
        ? `「${queryInput}」有${queryCount}个接龙成语`
        : '成语查询 - 发现更多成语接龙',
      query: queryInput ? `word=${queryInput}` : '',
    };
  },

  // =====================
  //  私有方法
  // =====================
  _loadData() {
    this.setData({ loading: true });
    
    dataService.loadData().then(() => {
      this.setData({ loading: false });
      // CDN加载完成后，自动查询默认成语"为所欲为"
      this._autoQueryDefault();
    }).catch((err) => {
      console.error('[idiom-query] 数据加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ 
        title: '数据加载失败', 
        icon: 'none',
        duration: 2000 
      });
    });

    // 恢复历史记录
    const history = wx.getStorageSync('idiom_query_history') || [];
    this.setData({ queryHistory: history });
  },

  _autoQueryDefault() {
    const defaultWord = '为所欲为';
    this.setData({ queryInput: defaultWord });
    
    // 延迟一下确保UI已经更新
    setTimeout(() => {
      this._doQuery(defaultWord);
    }, 300);
  },

  _clearAndReload() {
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
