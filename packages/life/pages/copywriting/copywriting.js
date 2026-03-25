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

// 文案分类数据
const allCategories = [
  {
    id: 'love',
    name: '爱情语录',
    content: [
      { text: '愿得一人心，白首不相离', from: '白头吟' },
      { text: '入目无别人，四下皆是你', from: '佚名' },
      { text: '愿我如星君如月，夜夜流光相皎洁', from: '范成大' },
      { text: '两情若是久长时，又岂在朝朝暮暮', from: '秦观' }
    ]
  },
  {
    id: 'life',
    name: '生活感悟',
    content: [
      { text: '生活不是等待风暴过去，而是学会在雨中跳舞', from: '佚名' },
      { text: '珍惜当下，感恩拥有', from: '佚名' },
      { text: '人生没有白走的路，每一步都算数', from: '佚名' }
    ]
  },
  {
    id: 'motivation',
    name: '励志名言',
    content: [
      { text: '路漫漫其修远兮，吾将上下而求索', from: '屈原' },
      { text: '天行健，君子以自强不息', from: '周易' },
      { text: '长风破浪会有时，直挂云帆济沧海', from: '李白' }
    ]
  },
  {
    id: 'friendship',
    name: '友谊万岁',
    content: [
      { text: '海内存知己，天涯若比邻', from: '王勃' },
      { text: '桃花潭水深千尺，不及汪伦送我情', from: '李白' }
    ]
  }
];

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
    const ctx = wx.createCanvasContext('cvs1', this);
    if (ctx) {
      this.MergeImage(ctx);
    } else {
      utils.showText('创建画布失败');
    }
  },

  // 绘制分享图片
  MergeImage(ctx) {
    const { canvaswidth: width, canvasheight: height, currentCopywriting } = this.data;
    const padding = 45;
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
        x: width / 2,
        startY: contentY,
        maxWidth: maxContentWidth,
        maxHeight: textHeight,
        align: 'center'
      });
    }

    // 绘制来源
    if (currentCopywriting && currentCopywriting.from && currentCopywriting.from !== '佚名') {
      imgGen.drawFrom(ctx, currentCopywriting.from, {
        x: width / 2,
        y: fromY + 5,
        maxWidth,
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
    imgGen.drawQRCode(ctx, '/images/mini.png', { qrX, qrY, qrSize });

    // 导出并保存
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        x: 0, y: 0, width, height,
        destWidth: width, destHeight: height,
        canvasId: 'cvs1',
        quality: 1, fileType: 'png',
        success: (res) => {
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
        fail: () => utils.showText('生成失败')
      });
    });
  }
});
