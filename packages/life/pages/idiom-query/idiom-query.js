// idiom-query.js - 成语查询页面
const dataService = require('../../../utils/idiom-data-service.js');

Page({
  data: {
    queryMode: 'forward',
    queryInput: '',
    queryPlaceholder: '输入任意成语，查看可接龙的下联',
    queryResults: [],
    queryTip: '输入任意成语，查看可接龙的下联',
    queryHistory: [],
    loading: true,
    error: false,
    errorText: '加载失败',
    errorSubText: '网络连接异常，请检查网络后重试',
    hasContent: false, // 控制滚动区域显示

    // 模糊匹配列表
    fuzzyResults: [],

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
        // 逆查：查询词在右侧（word），候选词在左侧（matchWord）
        return {
          leftWord: matchWord,
          rightWord: word,
          queryWord: word,
          leftClass: 'result-word result-candidate-word',
          rightClass: 'result-next result-query-word',
          continueWord: matchWord,
          actionText: '继续逆查'
        };
      }
      // 顺查：查询词在左侧（word），候选词在右侧（matchWord）
      return {
        leftWord: word,
        rightWord: matchWord,
        queryWord: word,
        leftClass: 'result-word result-query-word',
        rightClass: 'result-next result-candidate-word',
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
    const val = e.detail.value;
    this.setData({ queryInput: val });

    // 如果输入包含中文，自动触发查询
    if (/[\u4e00-\u9fa5]/.test(val)) {
      const trimmed = val.trim();
      if (trimmed) {
        this._doQuery(trimmed);
      }
    }
  },

  onQueryConfirm(e) {
    const val = e.detail.value.trim();
    if (val) this._doQuery(val);
  },

  onQueryModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode) return;
    const queryInput = this.data.queryInput.trim();
    const queryPlaceholder = this.getModePlaceholder(mode);
    this.setData({ queryMode: mode, queryPlaceholder });
    if (queryInput && dataService.isReady()) {
      this._doQuery(queryInput, mode);
      return;
    }
    this.setData({ queryResults: [], fuzzyResults: [], queryTip: queryPlaceholder, hasContent: false });
  },

  // 切换查询模式（顺查/逆查）
  onQueryModeToggle() {
    const newMode = this.data.queryMode === 'forward' ? 'reverse' : 'forward';
    const queryInput = this.data.queryInput.trim();
    const queryPlaceholder = this.getModePlaceholder(newMode);
    this.setData({ queryMode: newMode, queryPlaceholder });
    if (queryInput && dataService.isReady()) {
      this._doQuery(queryInput, newMode);
      return;
    }
    this.setData({ queryResults: [], fuzzyResults: [], queryTip: queryPlaceholder, hasContent: false });
  },

  // =====================
  //  查询逻辑
  // =====================

  _doQuery(word, mode = this.data.queryMode) {
    if (!dataService.isReady()) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'none' });
      console.debug('[debug] 数据服务未就绪');
      return;
    }

    word = word.replace(/\s+/g, '');
    const queryPlaceholder = this.getModePlaceholder(mode);
    const modeLabel = this.getModeLabel(mode);

    console.debug('[debug] 开始查询:', word, '模式:', mode);

    // 精确匹配：直接走接龙查询
    if (dataService.hasWord(word)) {
      console.debug('[debug] 精确匹配到成语:', word);
      this._querySolitaire(word, mode);
      return;
    }

    // 模糊匹配
    const fuzzy = dataService.fuzzySearch(word);
    console.debug('[debug] 模糊匹配结果数量:', fuzzy.length, '结果:', fuzzy);
    
    if (fuzzy.length === 0) {
      wx.showToast({
        title: `"${word}" 不在成语词库中`,
        icon: 'none',
        duration: 2000
      });
      this.setData({
        queryMode: mode,
        queryResults: [],
        fuzzyResults: [],
        queryPlaceholder,
        queryTip: queryPlaceholder,
        hasContent: false,
      });
      this.queryCount = 0;
      return;
    }

    if (fuzzy.length === 1) {
      // 唯一匹配 → 直接接龙（走现有逻辑），但保持用户输入不变
      const exact = fuzzy[0];
      this._querySolitaire(exact, mode);
      return;
    }

    // 多个模糊匹配 → 每个结果只接一条龙
    this._handleMultipleFuzzyResults(word, fuzzy, mode);
  },

  _querySolitaire(word, mode) {
    const queryPlaceholder = this.getModePlaceholder(mode);
    const modeLabel = this.getModeLabel(mode);
    const result = dataService.querySolitaire(word, mode);

    // 逆查时尾字索引仍在后台加载中，稍后重查
    if (result.lastIndexLoading) {
      wx.showToast({ title: '数据加载中，请稍候…', icon: 'none', duration: 1500 });
      setTimeout(() => this._querySolitaire(word, mode), 1500);
      return;
    }

    if (result.error) {
      let errorMessage = result.error;
      if (result.error === '该成语不在词库中') {
        errorMessage = `"${word}" 不在成语词库中`;
      }
      wx.showToast({ title: errorMessage, icon: 'none', duration: 2000 });
      this.setData({
        queryMode: mode,
        queryResults: [],
        fuzzyResults: [],
        queryPlaceholder,
        queryTip: queryPlaceholder,
        hasContent: false,
      });
      this.queryCount = 0;
      return;
    }

    const results = this.buildQueryResults(word, result.candidates, mode);
    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    wx.setStorageSync('idiom_query_history', history);

    this.setData({
      queryMode: mode,
      queryPlaceholder,
      queryResults: results,
      fuzzyResults: [],
      queryTip: result.candidates.length > 0 ? `共 ${result.candidates.length} 条${modeLabel}结果` : `暂无${modeLabel}结果`,
      queryHistory: history,
      hasContent: true,
    });
    this.queryCount = result.candidates.length;
  },

  /**
   * 处理多个模糊匹配结果
   * 每个结果只接一条龙（随机选择）
   */
  _handleMultipleFuzzyResults(word, fuzzyWords, mode) {
    const queryPlaceholder = this.getModePlaceholder(mode);
    const modeLabel = this.getModeLabel(mode);

    // 为每个模糊匹配的成语获取一条随机接龙结果
    const results = [];
    fuzzyWords.forEach(fuzzyWord => {
      const result = dataService.querySolitaire(fuzzyWord, mode);
      if (!result.error && result.candidates.length > 0) {
        // 有接龙结果 → 随机选择一个
        const randomIndex = Math.floor(Math.random() * result.candidates.length);
        const solitaireResults = this.buildQueryResults(fuzzyWord, [result.candidates[randomIndex]], mode);
        results.push(...solitaireResults);
      } else {
        // 无接龙结果 → 直接创建无结果的显示项，按钮禁用
        const noResultItem = mode === 'reverse'
          ? {
              leftWord: '—',
              rightWord: fuzzyWord,
              queryWord: fuzzyWord,
              leftClass: 'result-word result-empty',
              rightClass: 'result-word result-query-word',
              continueWord: fuzzyWord,
              actionText: '无法继续',
              canContinue: false
            }
          : {
              leftWord: fuzzyWord,
              rightWord: '—',
              queryWord: fuzzyWord,
              leftClass: 'result-word result-query-word',
              rightClass: 'result-word result-empty',
              continueWord: fuzzyWord,
              actionText: '无法继续',
              canContinue: false
            };
        results.push(noResultItem);
      }
    });

    const history = [word, ...this.data.queryHistory.filter(h => h !== word)].slice(0, 5);
    wx.setStorageSync('idiom_query_history', history);

    this.setData({
      queryMode: mode,
      queryPlaceholder,
      queryResults: results,
      fuzzyResults: [],
      queryTip: `找到 ${fuzzyWords.length} 条匹配，已为每条显示一条随机接龙`,
      queryHistory: history,
      hasContent: true,
    });
    this.queryCount = results.length;
  },

  // =====================
  //  结果项点击 → 显示详情（通用，支持任意成语）
  // =====================
  onWordTap(e) {
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
  //  复制详情内容（组件回调）
  // =====================
  onDetailCopy(e) {
    const { key, text } = e.detail;
    // 组件内部已处理复制和提示，这里可以额外处理埋点等
    console.debug('[idiom-query] 复制详情:', key);
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

  // 点击模糊匹配结果 → 查询接龙
  onFuzzyTap(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;
    this.setData({ queryInput: word });
    this._doQuery(word);
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
      fuzzyResults: [],
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
  // 错误重试
  onErrorRetry() {
    this.setData({ error: false, loading: true });
    this._loadData();
  },

  _loadData() {
    this.setData({ loading: true, error: false });

    // 顺查就绪时（首字索引加载完成）
    dataService.loadData(
      // onReady：首字索引就绪，顺查可工作
      () => {
        this.setData({ loading: false });
      },
      // onLastReady：尾字索引就绪，逆查可工作（静默后台加载，用户无感知）
      () => {}
    );

    // 恢复历史记录
    const history = wx.getStorageSync('idiom_query_history') || [];
    this.setData({ queryHistory: history });
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
