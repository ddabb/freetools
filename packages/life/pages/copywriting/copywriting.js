// packages/life/pages/copywriting/copywriting.js
const utils = require('../../../../utils/index');
const imgGen = require('../../../../utils/imageGenerator');

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 鸿蒙平台模块
let image, storage, share;
if (isHarmonyOS) {
  image = require('@system.image');
  storage = require('@system.storage');
  share = require('@system.share');
}

// 从CDN加载文案数据
let allCategories = [];

Page({
  data: {
    categories: [],
    selectedCategory: '',
    searchKeyword: '',
    filteredCopywritings: [],
    scrollTop: 0,
    canvaswidth: 375,
    canvasheight: 667
  },

  onLoad() {
    this.loadCategories();
  },

  // 从CDN加载分类数据（带缓存机制）
  loadCategories() {
    // 先尝试从缓存读取数据
    const cachedData = wx.getStorageSync('wordbank_categories');
    const cachedTimestamp = wx.getStorageSync('wordbank_timestamp');
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时过期

    // 如果缓存存在且未过期，直接使用缓存数据
    if (cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)) {
      allCategories = cachedData;
      this.setData({ categories: cachedData });
      return;
    }

    // 缓存不存在或已过期，从CDN加载
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/wordbank/index.json',
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data) {
          const categoryKeys = Object.keys(res.data);
          const categories = [];
          
          // 加载每个分类的数据
          let loadedCount = 0;
          categoryKeys.forEach(key => {
            wx.request({
              url: `https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/wordbank/${key}.json`,
              method: 'GET',
              success: (categoryRes) => {
                if (categoryRes.statusCode === 200 && categoryRes.data) {
                  categories.push(categoryRes.data);
                }
                loadedCount++;
                if (loadedCount === categoryKeys.length) {
                  allCategories = categories;
                  this.setData({ categories });
                  
                  // 保存数据到缓存
                  wx.setStorageSync('wordbank_categories', categories);
                  wx.setStorageSync('wordbank_timestamp', Date.now());
                }
              },
              fail: () => {
                loadedCount++;
                if (loadedCount === categoryKeys.length) {
                  allCategories = categories;
                  this.setData({ categories });
                  
                  // 保存数据到缓存（即使部分加载失败）
                  wx.setStorageSync('wordbank_categories', categories);
                  wx.setStorageSync('wordbank_timestamp', Date.now());
                }
              }
            });
          });
        } else {
          // 加载失败，尝试使用缓存数据
          if (cachedData) {
            allCategories = cachedData;
            this.setData({ categories: cachedData });
            utils.showText('网络异常，使用缓存数据');
          } else {
            utils.showText('分类数据加载失败');
          }
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络请求失败，尝试使用缓存数据
        if (cachedData) {
          allCategories = cachedData;
          this.setData({ categories: cachedData });
          utils.showText('网络连接失败，使用缓存数据');
        } else {
          utils.showText('网络请求失败，请检查网络连接');
        }
      }
    });
  },

  // 选择分类
  selectCategory(e) {
    this.setData({
      selectedCategory: e.currentTarget.dataset.categoryId,
      searchKeyword: '',
      scrollTop: 0
    });
    this.filterCopywritings();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      scrollTop: 0
    });
    this.filterCopywritings();
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchKeyword: '', scrollTop: 0 });
    this.filterCopywritings();
  },

  // 过滤文案
  filterCopywritings() {
    const { selectedCategory, searchKeyword, categories } = this.data;
    let filtered = [];

    if (categories.length === 0) {
      this.setData({ filteredCopywritings: filtered });
      return;
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      categories.forEach(cat => {
        if (cat && cat.content) {
          cat.content.forEach(item => {
            if (item && item.text && item.text.toLowerCase().includes(keyword)) {
              filtered.push(item);
            }
          });
        }
      });
    } else if (selectedCategory) {
      const cat = categories.find(c => c && c.id === selectedCategory);
      if (cat && cat.content) filtered = cat.content;
    }

    this.setData({ filteredCopywritings: filtered });
  },

  // 复制文案
  copyCopywriting(e) {
    const item = this.data.filteredCopywritings[e.currentTarget.dataset.index];
    if (item) {
      wx.setClipboardData({
        data: item.text,
        success: () => utils.showSuccess('复制成功'),
        fail: () => utils.showText('复制失败')
      });
    }
  },

  // 下载图片
  downloadImage(e) {
    const item = this.data.filteredCopywritings[e.currentTarget.dataset.index];
    if (item) {
      this.setData({ currentCopywriting: item });
      this.savecodetofile();
    }
  },

  // 保存Canvas为图片
  savecodetofile() {
    wx.showLoading({ title: '生成中...' });

    const query = wx.createSelectorQuery().in(this);
    query.select('#cvs1')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading();
          console.error('画布初始化失败', res);
          utils.showText('画布初始化失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const { canvaswidth: width, canvasheight: height } = this.data;

        // 设置高清canvas尺寸
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // 绘制图片
        this.drawImage(ctx, canvas, width, height, () => {
          // 导出图片
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0, y: 0, width, height,
            destWidth: width * dpr,
            destHeight: height * dpr,
            quality: 1, fileType: 'png',
            success: (res) => {
              wx.hideLoading();
              // 保存到相册
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => utils.showSuccess('保存相册成功'),
                fail: (err) => {
                  if (err.errMsg && err.errMsg.includes('auth denied')) {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存相册',
                      success: (res) => res.confirm && wx.openSetting()
                    });
                  } else {
                    utils.showText('保存失败');
                  }
                }
              });
            },
            fail: () => {
              wx.hideLoading();
              utils.showText('生成失败');
            }
          });
        });
      });
  },

  // 绘制图片
  drawImage(ctx, canvas, width, height, callback) {
    const { currentCopywriting } = this.data;
    const padding = 10;
    const qrSize = 85;
    const qrX = width - qrSize - 35;
    const qrY = height - qrSize - 35;
    const contentY = padding + 50;
    const maxContentWidth = width - 2 * padding;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    imgGen.drawBackground(ctx, width, height, { padding });

    // 绘制文案
    let fromY = contentY;
    if (currentCopywriting && currentCopywriting.text) {
      const textHeight = qrY - contentY - 30;
      fromY = imgGen.drawText(ctx, currentCopywriting.text, {
        x: padding,
        startY: contentY,
        maxWidth: maxContentWidth,
        maxHeight: textHeight,
        align: 'center'
      });
    }

    // 绘制来源
    if (currentCopywriting && currentCopywriting.from && currentCopywriting.from !== '佚名') {
      imgGen.drawFrom(ctx, currentCopywriting.from, {
        x: padding,
        y: fromY + 5,
        maxWidth: maxContentWidth,
        align: 'center'
      });
    }

    // 绘制日期
    imgGen.drawDate(ctx, {
      x: padding,
      qrY,
      qrSize,
      qrMargin: 35
    });

    // 绘制二维码
    const qrPath = '/images/mini.png';
    if (qrPath.startsWith('/') || qrPath.startsWith('http')) {
      const img = canvas.createImage();
      img.src = qrPath;
      img.onload = () => {
        imgGen.drawQRCode(ctx, img, {
          qrX,
          qrY,
          qrSize
        });
        if (callback) callback();
      };
    } else {
      if (callback) callback();
    }
  }
});
