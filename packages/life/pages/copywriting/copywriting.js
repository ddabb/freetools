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
  behaviors: [adBehavior],
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

  refreshData() {
    console.debug('[copywriting] 手动刷新数据，清除缓存');
    wx.showLoading({ title: '刷新中...' });
    
    try {
      wx.removeStorageSync('wordbank_categories');
      wx.removeStorageSync('wordbank_timestamp');
      console.debug('[copywriting] 缓存已清除');
      
      allCategories = [];
      this.setData({ 
        categories: [], 
        selectedCategory: '', 
        searchKeyword: '',
        filteredCopywritings: []
      });
      
      setTimeout(() => {
        this.loadCategories();
        wx.hideLoading();
        utils.showSuccess('刷新成功');
      }, 300);
    } catch (e) {
      console.error('[copywriting] 刷新失败', e);
      wx.hideLoading();
      utils.showText('刷新失败，请重试');
    }
  },

  // 从CDN加载分类数据（带缓存机制）
  loadCategories() {
    console.debug('[copywriting] loadCategories 开始执行');
    
    // 先尝试从缓存读取数据
    const cachedData = wx.getStorageSync('wordbank_categories');
    const cachedTimestamp = wx.getStorageSync('wordbank_timestamp');
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时过期

    console.debug('[copywriting] 缓存检查', {
      hasCachedData: !!cachedData,
      hasCachedTimestamp: !!cachedTimestamp,
      cachedTimestamp,
      now,
      timeDiff: cachedTimestamp ? now - cachedTimestamp : null,
      cacheExpiry,
      isCacheValid: cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)
    });

    // 如果缓存存在且未过期，直接使用缓存数据
    if (cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)) {
      console.debug('[copywriting] 使用缓存数据，分类数量:', cachedData.length);
      allCategories = cachedData;
      this.setData({ categories: cachedData });
      
      // 默认选择第一个分类
      this.selectFirstCategory();
      return;
    }

    console.debug('[copywriting] 缓存无效，开始从CDN加载');
    // 缓存不存在或已过期，从CDN加载
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/index.json',
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.debug('[copywriting] 主索引请求成功', {
          statusCode: res.statusCode,
          dataType: typeof res.data,
          dataKeys: res.data ? Object.keys(res.data) : null
        });
        wx.hideLoading();
        if (res.statusCode === 200 && res.data) {
          const categoryKeys = Object.keys(res.data);
          const categories = [];
          console.debug('[copywriting] 开始加载分类数据，共', categoryKeys.length, '个分类', categoryKeys);
          
          // 加载每个分类的数据
          let loadedCount = 0;
          categoryKeys.forEach(key => {
            console.debug('[copywriting] 加载分类:', key);
            wx.request({
              url: `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/${key}.json`,
              method: 'GET',
              success: (categoryRes) => {
                console.debug('[copywriting] 分类', key, '加载成功', {
                  statusCode: categoryRes.statusCode,
                  hasData: !!categoryRes.data
                });
                if (categoryRes.statusCode === 200 && categoryRes.data) {
                  categories.push(categoryRes.data);
                }
                loadedCount++;
                console.debug('[copywriting] 加载进度:', loadedCount, '/', categoryKeys.length);
                if (loadedCount === categoryKeys.length) {
                  console.debug('[copywriting] 所有分类加载完成，共', categories.length, '个分类');
                  allCategories = categories;
                  this.setData({ categories });
                  
                  // 保存数据到缓存
                  wx.setStorageSync('wordbank_categories', categories);
                  wx.setStorageSync('wordbank_timestamp', Date.now());
                  console.debug('[copywriting] 数据已保存到缓存');
                  
                  // 默认选择第一个分类
                  this.selectFirstCategory();
                }
              },
              fail: (err) => {
                console.error('[copywriting] 分类', key, '加载失败', err);
                loadedCount++;
                console.debug('[copywriting] 加载进度(失败):', loadedCount, '/', categoryKeys.length);
                if (loadedCount === categoryKeys.length) {
                  console.debug('[copywriting] 所有分类加载完成(含失败)，成功加载', categories.length, '个分类');
                  allCategories = categories;
                  this.setData({ categories });
                  
                  // 保存数据到缓存（即使部分加载失败）
                  wx.setStorageSync('wordbank_categories', categories);
                  wx.setStorageSync('wordbank_timestamp', Date.now());
                  console.debug('[copywriting] 数据已保存到缓存(含部分失败)');
                  
                  // 默认选择第一个分类
                  this.selectFirstCategory();
                }
              }
            });
          });
        } else {
          console.error('[copywriting] 主索引加载失败或数据为空', res);
          // 加载失败，尝试使用缓存数据
          if (cachedData) {
            console.debug('[copywriting] 使用缓存数据作为降级方案');
            allCategories = cachedData;
            this.setData({ categories: cachedData });
            utils.showText('网络异常，使用缓存数据');
            
            // 默认选择第一个分类
            this.selectFirstCategory();
          } else {
            console.error('[copywriting] 没有缓存数据可用');
            utils.showText('分类数据加载失败');
          }
        }
      },
      fail: (err) => {
        console.error('[copywriting] 主索引网络请求失败', err);
        wx.hideLoading();
        // 网络请求失败，尝试使用缓存数据
        if (cachedData) {
          console.debug('[copywriting] 网络失败，使用缓存数据作为降级方案');
          allCategories = cachedData;
          this.setData({ categories: cachedData });
          utils.showText('网络连接失败，使用缓存数据');
          
          // 默认选择第一个分类
          this.selectFirstCategory();
        } else {
          console.error('[copywriting] 网络失败且无缓存数据');
          utils.showText('网络请求失败，请检查网络连接');
        }
      }
    });
  },

  // 默认选择第一个分类
  selectFirstCategory() {
    const { categories } = this.data;
    if (categories && categories.length > 0) {
      const firstCategory = categories[0];
      if (firstCategory && firstCategory.id) {
        console.debug('[copywriting] 自动选择第一个分类:', firstCategory.name, firstCategory.id);
        this.setData({
          selectedCategory: firstCategory.id,
          searchKeyword: '',
          scrollTop: 0
        });
        this.filterCopywritings();
      }
    }
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
      .exec(async (res) => {
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
        await this.drawImage(ctx, canvas, width, height);
        
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
  },

  // 绘制图片
  async drawImage(ctx, canvas, width, height, callback) {
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
      fromY = await imgGen.drawText(ctx, currentCopywriting.text, {
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
      return new Promise((resolve) => {
        const img = canvas.createImage();
        img.src = qrPath;
        img.onload = () => {
          imgGen.drawQRCode(ctx, img, {
            qrX,
            qrY,
            qrSize
          });
          if (callback) callback();
          resolve();
        };
        img.onerror = () => {
          if (callback) callback();
          resolve();
        };
      });
    } else {
      if (callback) callback();
      return Promise.resolve();
    }
  },

});
const adBehavior = require('../../../../utils/ad-behavior');
