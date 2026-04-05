// idiom-query.js - 成语查询页面
const dataService = require('../../../../utils/idiom-data-service.js');

Page({
  data: {
    queryInput: '',
    queryResults: [],
    queryCount: 0,
    queryTip: '输入任意成语，查看可接龙的下联',
    queryHistory: [],
    loading: true,
    hasContent: false, // 控制滚动区域显示

    // 详情弹窗
    showDetail: false,
    detailItem: null,
  },

  onLoad() {
    this._letterCache = {};  // 页面级内存缓存：{ [firstLetter]: Array }
    this._loadData();
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

  onQuerySearch() {
    const val = this.data.queryInput.trim();
    if (val) this._doQuery(val);
  },

  // =====================
  //  查询逻辑
  // =====================
  _doQuery(word) {
    if (!dataService.isReady()) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'none' });
      return;
    }

    word = word.replace(/\s+/g, '');

    // 先检查是否在成语库中
    if (!dataService.hasWord(word)) {
      wx.showToast({ 
        title: `"${word}" 不在成语词库中`, 
        icon: 'none',
        duration: 2000
      });
      this.setData({
        queryResults: [],
        queryCount: 0,
        queryTip: '请输入成语词库中存在的成语，查看可接龙的下联',
        hasContent: false,
      });
      return;
    }

    const result = dataService.querySolitaire(word);

    if (result.error) {
      let errorMessage = result.error;
      
      // 如果成语不在词库中，给出更友好的提示
      if (result.error === '该成语不在词库中') {
        errorMessage = `"${word}" 不在成语词库中`;
      }
      
      wx.showToast({ 
        title: errorMessage, 
        icon: 'none',
        duration: 2000
      });
      
      this.setData({
        queryResults: [],
        queryCount: 0,
        queryTip: '请输入成语词库中存在的成语，查看可接龙的下联',
        hasContent: false,
      });
      return;
    }

    const results = result.candidates.slice(0, 100).map(w => ({
      word,
      next: w,
      lastChar: w.slice(-1),
    }));

    // 更新历史记录
    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    wx.setStorageSync('idiom_query_history', history);

    this.setData({
      queryResults: results,
      queryCount: result.candidates.length,
      queryTip: `共 ${result.candidates.length} 条接龙`,
      queryHistory: history,
      hasContent: results.length > 0, // 控制滚动区域显示
    });
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
  //  点击尾字 → 继续接龙搜索
  // =====================
  onContinueChain(e) {
    const word = e.currentTarget.dataset.next;
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
    const text = this.data.queryResults.map(r => r.next).join(' → ');
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  // =====================
  //  清空查询
  // =====================
  onClearQuery() {
    this.setData({
      queryInput: '',
      queryResults: [],
      queryCount: 0,
      queryTip: '输入任意成语，查看可接龙的下联',
    });
  },

  // =====================
  //  分享功能
  // =====================
  onShareAppMessage() {
    const { queryInput, queryCount } = this.data;
    const title = queryInput 
      ? `「${queryInput}」有${queryCount}个接龙成语，来看看吧！`
      : '成语查询 - 输入成语查看可接龙的下联';
    return {
      title,
      path: '/packages/life/pages/idiom-query/idiom-query',
    };
  },

  onShareTimeline() {
    const { queryInput, queryCount } = this.data;
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
