// packages/text/pages/poetry-detail/poetry-detail.js
Page({
  data: {
    poet: null,           // { n, d, desc, p: [ { n, c, f } ] }
    expandedPoem: -1,
    searchText: '',       // 搜索词
    displayPoems: [],     // 显示的诗词列表
  },

  onLoad() {
    const poet = getApp().globalData._poetDetail;
    if (poet) {
      wx.setNavigationBarTitle({ title: poet.n });
      this.setData({ 
        poet,
        displayPoems: poet.p || [],
      });
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const q = e.detail.value.trim();
    this.setData({ searchText: q });
    this.filterPoems(q);
  },

  // 执行搜索
  onSearch() {
    this.filterPoems(this.data.searchText);
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ 
      searchText: '',
      displayPoems: this.data.poet?.p || [],
      expandedPoem: -1,
    });
  },

  // 过滤诗词（搜索诗名或正文）
  filterPoems(q) {
    const poems = this.data.poet?.p || [];
    if (!q) {
      this.setData({ displayPoems: poems, expandedPoem: -1 });
      return;
    }
    const filtered = poems.filter(p => 
      p.n.includes(q) || (p.c && p.c.includes(q))
    );
    this.setData({ displayPoems: filtered, expandedPoem: -1 });
  },

  // 展开/收起诗词内容
  onTogglePoem(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ expandedPoem: this.data.expandedPoem === idx ? -1 : idx });
  },

  // 复制诗词
  onCopyPoem(e) {
    const { title, author, content } = e.currentTarget.dataset;
    const text = `【${title}】${author}\n${content}`;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  onShareAppMessage() {
    const p = this.data.poet;
    return { title: p.n + ' - 诗词查询', path: '/packages/text/pages/poetry-query/poetry-query' };
  },
});