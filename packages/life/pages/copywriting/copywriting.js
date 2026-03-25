// packages/life/pages/copywriting/copywriting.js
const utils = require('../../../../utils/index');
const imgGen = require('../../../../utils/imageGenerator');
const wordbank = require('wordbank');

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 鸿蒙平台模块
let image, storage, share;
if (isHarmonyOS) {
  image = require('@system.image');
  storage = require('@system.storage');
  share = require('@system.share');
}

// 使用 wordbank 模块的文案分类数据
const allCategories = wordbank.allCategories;

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
    this.initData();
  },

  initData() {
    this.setData({ categories: allCategories });
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

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      categories.forEach(cat => {
        cat.content.forEach(item => {
          if (item.text.toLowerCase().includes(keyword)) {
            filtered.push(item);
          }
        });
      });
    } else if (selectedCategory) {
      const cat = categories.find(c => c.id === selectedCategory);
      if (cat) filtered = cat.content;
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
