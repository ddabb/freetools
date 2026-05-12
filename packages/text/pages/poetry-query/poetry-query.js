// packages/text/pages/poetry-query/poetry-query.js
// 诗词查询页面 - v1 基础版：搜索 + 结果列表

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/poetry';
const CACHE_KEY = 't=' + Date.now(); // 每次不同的缓存key（用于CDN）
const STORAGE_KEY = 'poetry_index'; // 本地缓存key（固定）

// 朝代顺序（按历史时间）
const DYNASTY_ORDER = ['全部', '先秦', '秦', '汉', '魏晋', '南北朝', '隋', '唐', '五代十国', '宋', '辽', '金', '元', '明', '清', '近代', '现代'];

// Promise 封装 wx.request
function request(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      dataType: 'json',
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

Page({
  data: {
    searchText: '',
    activeDynasty: '全部',
    dynasties: [],
    poets: [],        // 诗人列表（从 index.json 加载）
    results: [],       // 搜索结果
    isLoading: false,
    isIndexLoaded: false,
    refresherTriggered: false,
  },

  onLoad() {
    this.loadFromCache(); // 先尝试加载缓存
  },

  onShow() {
    // 启用下拉刷新
    wx.setNavigationBarTitle({ title: '诗词查询' });
  },

  // 加载 index.json（全量诗人索引 + 朝代列表）
  async loadIndex() {
    this.setData({ isLoading: true });
    try {
      const url = CDN_BASE + '/index.json?' + CACHE_KEY;
      console.log('[加载]', url);
      const res = await request(url);
      const data = res.data;
      this.indexData = data;
      // 按历史顺序排列朝代
      const sortedDynasties = ['全部'];
      const otherDynasties = data.dynasties.map(d => d.name).filter(d => d !== '全部');
      otherDynasties.sort((a, b) => {
        const ia = DYNASTY_ORDER.indexOf(a);
        const ib = DYNASTY_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
      sortedDynasties.push(...otherDynasties);
      // 只缓存关键数据（不存储ft倒排索引，因为太大超过10MB限制）
      const cacheData = {
        poets: data.poets,
        dynasties: data.dynasties,
      };
      wx.setStorageSync(STORAGE_KEY, cacheData);
      wx.setStorageSync(STORAGE_KEY + '_dynasties', sortedDynasties);
      this.setData({
        dynasties: sortedDynasties,
        poets: data.poets.slice(0, 50), // 首批展示50位诗人
        isIndexLoaded: true,
        isLoading: false,
      });
    } catch (e) {
      console.error('加载 index.json 失败', e);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 从缓存加载
  loadFromCache() {
    const cachedData = wx.getStorageSync(STORAGE_KEY);
    const cachedDynasties = wx.getStorageSync(STORAGE_KEY + '_dynasties');
    if (cachedData && cachedDynasties) {
      this.indexData = cachedData; // 缓存数据（不含ft倒排索引）
      this.setData({
        dynasties: cachedDynasties,
        poets: cachedData.poets.slice(0, 50),
        isIndexLoaded: true,
      });
    }
    // 再请求CDN更新
    this.loadIndex();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadIndex().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchText: '', results: [] });
  },

  // 执行搜索（诗人名精确匹配优先，其次全文搜索）
  onSearch() {
    const q = this.data.searchText.trim();
    console.log('[搜索] searchText:', q, 'indexData:', !!this.indexData);
    if (!q) {
      console.log('[搜索] 搜索词为空');
      return;
    }
    const idx = this.indexData;
    if (!idx) {
      console.log('[搜索] indexData 未加载');
      wx.showToast({ title: '数据加载中...', icon: 'none' });
      return;
    }

    console.log('[搜索] poets 数量:', idx.poets?.length, 'ftEntry 数量:', idx.ftEntry?.length);

    let results = [];

    // 模式1：诗人名精确/前缀匹配（走 poets[] 数组）
    const poetMatches = idx.poets.filter(p => p.n.indexOf(q) !== -1).slice(0, 20);
    console.log('[搜索] 诗人匹配:', poetMatches.length);
    if (poetMatches.length) {
      results = poetMatches.map(p => ({ type: 'poet', name: p.n, dynasty: p.d, poemCount: p.pc, initial: p.i }));
    } else {
      // 模式2：全文搜索 - 在 ftEntry 中搜索标题或作者名
      if (idx.ftEntry && idx.ftEntry.length) {
        const poemMatches = idx.ftEntry.filter(p => 
          (p.t && p.t.includes(q)) || (p.a && p.a.includes(q))
        ).slice(0, 20);
        console.log('[搜索] 诗词匹配:', poemMatches.length);
        results = poemMatches.map(r => ({ type: 'poem', title: r.t, poet: r.a, dynasty: r.d }));
      }
    }

    this.setData({ results });
    if (!results.length) {
      wx.showToast({ title: '未找到相关结果', icon: 'none' });
    }
  },

  // 切换朝代筛选
  onDynastyTap(e) {
    const d = e.currentTarget.dataset.d;
    this.setData({ activeDynasty: d });
    if (!this.indexData) return;
    let filtered = this.indexData.poets;
    if (d !== '全部') filtered = filtered.filter(p => p.d === d);
    this.setData({ poets: filtered.slice(0, 50) });
  },

  // 点击诗人 → 跳转详情（需加载 poet/{initial}.json）
  async onPoetTap(e) {
    const name = e.currentTarget.dataset.name;
    const initial = e.currentTarget.dataset.initial;
    wx.showLoading({ title: '加载中...' });
    try {
      const url = CDN_BASE + '/poet/' + initial + '.json?' + CACHE_KEY;
      const res = await request(url);
      const poetData = res.data.find(p => p.n === name);
      if (poetData) {
        getApp().globalData._poetDetail = poetData;
        wx.navigateTo({ url: '/packages/text/pages/poetry-detail/poetry-detail' });
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 点击诗词 → 弹窗显示详情 + 复制功能
  async onPoemTap(e) {
    const title = e.currentTarget.dataset.title;
    const poet = e.currentTarget.dataset.poet;
    console.log('[诗词点击] title:', title, 'poet:', poet);
    
    if (!this.indexData) {
      wx.showToast({ title: '数据未加载', icon: 'none' });
      return;
    }
    
    // 查找诗人
    const poetInfo = this.indexData.poets.find(p => p.n === poet);
    if (!poetInfo) {
      wx.showToast({ title: '未找到诗人', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '加载中...' });
    try {
      // 加载诗人诗词列表
      const res = await request(CDN_BASE + '/poet/' + poetInfo.i + '.json');
      const poems = res.data;
      const poem = poems.find(p => p.t === title);
      
      if (poem) {
        // 保存当前诗词到页面数据
        this.setData({ currentPoem: poem });
        
        // 弹窗选择：查看详情 或 复制
        wx.showActionSheet({
          itemList: ['查看详情', '复制诗词'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 查看详情
              wx.showModal({
                title: poem.t,
                content: `${poem.d} · ${poem.a}\n\n${poem.c}`,
                showCancel: false,
                confirmText: '关闭',
              });
            } else if (res.tapIndex === 1) {
              // 复制诗词
              const text = `${poem.t}\n${poem.d} · ${poem.a}\n\n${poem.c}`;
              wx.setClipboardData({
                data: text,
                success: () => wx.showToast({ title: '已复制', icon: 'success' })
              });
            }
          }
        });
      } else {
        wx.showToast({ title: '未找到诗词', icon: 'none' });
      }
    } catch (err) {
      console.error('[诗词点击] 加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
});