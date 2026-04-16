// packages/life/pages/poison-soup/poison-soup.js
const utils = require('../../../../utils/index');

Page({
  data: {
    currentSoup: '',
    soupList: [],
    isAnimating: false,
    dailyCount: 0,
    totalCount: 0,
    showShareModal: false,
    todayDate: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 每次显示刷新今日计数
    this.setData({
      dailyCount: wx.getStorageSync('poison_soup_daily_count') || 0,
      totalCount: wx.getStorageSync('poison_soup_total_count') || 0
    });
  },

  // 从CDN加载毒鸡汤数据
  loadData() {
    wx.showLoading({ title: '加载中...' });

    // 检查缓存
    const cached = wx.getStorageSync('poison_soup_data');
    const cacheTime = wx.getStorageSync('poison_soup_cache_time');
    const now = Date.now();
    const isToday = cacheTime && new Date(cacheTime).toDateString() === new Date().toDateString();

    if (cached && isToday) {
      wx.hideLoading();
      this.setData({ soupList: cached }, () => {
        this.initDailySoup();
      });
      return;
    }

    const cdnUrl = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/wordbank/poison-soup.json';

    wx.request({
      url: cdnUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.content) {
          const soupList = res.data.content;
          wx.setStorageSync('poison_soup_data', soupList);
          wx.setStorageSync('poison_soup_cache_time', now);
          this.setData({ soupList }, () => {
            this.initDailySoup();
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        if (cached) {
          this.setData({ soupList: cached }, () => {
            this.initDailySoup();
          });
        } else {
          utils.showText('加载失败，请下拉刷新');
        }
      }
    });
  },

  // 初始化今日毒鸡汤
  initDailySoup() {
    const { soupList } = this.data;
    if (!soupList.length) return;

    const today = new Date();
    const todayStr = today.toLocaleDateString('zh-CN');

    // 检查是否需要刷新今日鸡汤
    const savedDate = wx.getStorageSync('poison_soup_today_date');
    let currentIndex;

    if (savedDate === todayStr) {
      // 今天已读过，恢复今天的
      currentIndex = wx.getStorageSync('poison_soup_today_index') || 0;
    } else {
      // 新的一天，随机一碗
      currentIndex = Math.floor(Math.random() * soupList.length);
      wx.setStorageSync('poison_soup_today_date', todayStr);
      wx.setStorageSync('poison_soup_today_index', currentIndex);
    }

    this.setData({
      currentSoup: soupList[currentIndex].text,
      todayDate: todayStr,
      dailyCount: wx.getStorageSync('poison_soup_daily_count') || 0,
      totalCount: wx.getStorageSync('poison_soup_total_count') || 0
    });
    this._currentIndex = currentIndex;
  },

  // 换一碗鸡汤
  changeSoup() {
    const { soupList, isAnimating } = this.data;
    const currentIndex = this._currentIndex || 0;
    if (isAnimating || !soupList.length) return;

    this.setData({ isAnimating: true });
    wx.vibrateShort({ type: 'light' });

    // 随机换一个
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * soupList.length);
    } while (newIndex === currentIndex && soupList.length > 1);

    setTimeout(() => {
      this._currentIndex = newIndex;
      this.setData({
        currentSoup: soupList[newIndex].text,
        isAnimating: false
      });

      // 更新计数
      const dailyCount = (wx.getStorageSync('poison_soup_daily_count') || 0) + 1;
      const totalCount = (wx.getStorageSync('poison_soup_total_count') || 0) + 1;
      wx.setStorageSync('poison_soup_daily_count', dailyCount);
      wx.setStorageSync('poison_soup_total_count', totalCount);
      this.setData({ dailyCount, totalCount });
    }, 300);
  },

  // 复制文案
  copyText() {
    const { currentSoup } = this.data;
    if (!currentSoup) return;

    wx.setClipboardData({
      data: currentSoup,
      success: () => {
        utils.showSuccess('已复制');
      }
    });
  },

  // 生成图片分享
  generateImage() {
    const { currentSoup } = this.data;
    if (!currentSoup) return;

    const encodeText = encodeURIComponent(currentSoup);
    wx.navigateTo({
      url: `/packages/life/pages/text-to-image/text-to-image?text=${encodeText}&from=poison-soup`
    });
  },

  // 显示分享菜单
  showShare() {
    this.setData({ showShareModal: true });
  },

  hideShare() {
    this.setData({ showShareModal: false });
  },

  // 分享到群聊
  shareToGroup() {
    this.hideShare();
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  // 刷新数据
  refreshData() {
    wx.showLoading({ title: '刷新中...' });
    wx.removeStorageSync('poison_soup_cache_time');
    wx.removeStorageSync('poison_soup_data');
    setTimeout(() => {
      this.loadData();
      wx.hideLoading();
      utils.showSuccess('刷新成功');
    }, 300);
  }
});
