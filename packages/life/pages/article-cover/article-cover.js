// packages/life/pages/article-cover/article-cover.js
const utils = require('../../../../utils/index');
const imgGen = require('../../../../utils/imageGenerator');

Page({
  behaviors: [adBehavior],
  data: {
    // 配图参数
    title: '',
    subtitle: '',
    author: '',
    // 比例：2.35:1 (公众号封面标准)
    canvasWidth: 750,
    canvasHeight: 320,
    // 样式选择
    styleIndex: 0,
    styles: [
      { name: '简约白', bgColors: ['#ffffff', '#f8f9fa'], textColor: '#333333', accentColor: '#1890ff' },
      { name: '渐变蓝', bgColors: ['#e0f2fe', '#bae6fd', '#7dd3fc'], textColor: '#0c4a6e', accentColor: '#0284c7' },
      { name: '日落橙', bgColors: ['#fff7ed', '#ffedd5', '#fed7aa'], textColor: '#7c2d12', accentColor: '#ea580c' },
      { name: '薰衣草', bgColors: ['#faf5ff', '#f3e8ff', '#e9d5ff'], textColor: '#4c1d95', accentColor: '#9333ea' },
      { name: '薄荷绿', bgColors: ['#ecfdf5', '#d1fae5', '#a7f3d0'], textColor: '#064e3b', accentColor: '#059669' },
      { name: '暗夜黑', bgColors: ['#18181b', '#27272a', '#3f3f46'], textColor: '#fafafa', accentColor: '#f43f5e' },
      { name: '星空紫', bgColors: ['#1e1b4b', '#312e81', '#4c1d95'], textColor: '#e9d5ff', accentColor: '#a855f7' },
      { name: '珊瑚红', bgColors: ['#fef2f2', '#fee2e2', '#fecaca'], textColor: '#7f1d1d', accentColor: '#dc2626' },
    ],
    // 字体大小预览
    titleLength: 0,
    subtitleLength: 0,
    // 预览图
    previewUrl: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '公众号配图' });
  },

  // 标题输入
  onTitleInput(e) {
    const value = e.detail.value;
    this.setData({
      title: value,
      titleLength: value.length
    });
    this.updatePreview();
  },

  // 副标题输入
  onSubtitleInput(e) {
    const value = e.detail.value;
    this.setData({
      subtitle: value,
      subtitleLength: value.length
    });
    this.updatePreview();
  },

  // 作者输入
  onAuthorInput(e) {
    this.setData({ author: e.detail.value });
    this.updatePreview();
  },

  // 选择样式
  onStyleSelect(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ styleIndex: index });
    this.updatePreview();
  },

  // 更新预览
  updatePreview() {
    const { title, subtitle, author, styleIndex, styles, canvasWidth, canvasHeight } = this.data;
    if (!title && !subtitle) return;

    const query = wx.createSelectorQuery().in(this);
    query.select('#cvsArticleCover')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);

        this.drawCover(ctx, canvas, canvasWidth, canvasHeight);

        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth,
          destHeight: canvasHeight,
          quality: 0.8,
          success: (result) => {
            this.setData({ previewUrl: result.tempFilePath });
          }
        });
      });
  },

  // 绘制封面
  drawCover(ctx, canvas, width, height, callback) {
    const { title, subtitle, author, styleIndex, styles } = this.data;
    const style = styles[styleIndex];

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    style.bgColors.forEach((color, i) => {
      gradient.addColorStop(i / (style.bgColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制装饰元素
    this.drawDecorations(ctx, width, height, style.accentColor);

    // 绘制内容
    const padding = 40;
    const maxContentWidth = width - 2 * padding;
    let currentY = padding + 30;

    // 绘制标题
    if (title) {
      const titleSize = this.calculateTitleSize(title.length);
      ctx.fillStyle = style.textColor;
      ctx.font = `bold ${titleSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const lines = this.wrapText(ctx, title, maxContentWidth, titleSize * 1.4);
      lines.forEach((line, i) => {
        ctx.fillText(line, padding, currentY + i * titleSize * 1.4);
      });
      currentY += lines.length * titleSize * 1.4 + 20;
    }

    // 绘制副标题
    if (subtitle) {
      const subtitleSize = 18;
      ctx.fillStyle = style.textColor;
      ctx.globalAlpha = 0.7;
      ctx.font = `${subtitleSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.globalAlpha = 1;

      const lines = this.wrapText(ctx, subtitle, maxContentWidth, subtitleSize * 1.5);
      lines.forEach((line, i) => {
        ctx.fillText(line, padding, currentY + i * subtitleSize * 1.5);
      });
      currentY += lines.length * subtitleSize * 1.5 + 20;
    }

    // 绘制作者
    if (author) {
      const authorSize = 14;
      ctx.fillStyle = style.accentColor;
      ctx.font = `${authorSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(author, padding, height - padding - 10);
    }

    if (callback) callback();
  },

  // 绘制装饰
  drawDecorations(ctx, width, height, accentColor) {
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.1;
    
    // 右上角圆形
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.2, 80, 0, 2 * Math.PI);
    ctx.fill();

    // 左下角圆形
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.85, 60, 0, 2 * Math.PI);
    ctx.fill();

    // 线条装饰
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.6);
    ctx.stroke();

    ctx.globalAlpha = 1;
  },

  // 计算标题字号
  calculateTitleSize(length) {
    if (length <= 10) return 36;
    if (length <= 20) return 32;
    if (length <= 30) return 28;
    return 24;
  },

  // 文字换行
  wrapText(ctx, text, maxWidth, lineHeight) {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // 限制行数
    if (lines.length > 4) {
      return lines.slice(0, 4);
    }

    return lines;
  },

  // 生成并保存
  generateCover() {
    const { title, subtitle } = this.data;
    if (!title || !title.trim()) {
      utils.showText('请输入标题');
      return;
    }

    wx.showLoading({ title: '生成中...' });

    const { canvasWidth, canvasHeight } = this.data;

    const query = wx.createSelectorQuery().in(this);
    query.select('#cvsArticleCover')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading();
          utils.showText('画布初始化失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);

        this.drawCover(ctx, canvas, canvasWidth, canvasHeight, () => {
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth,
            destHeight: canvasHeight,
            quality: 1,
            fileType: 'png',
            success: (result) => {
              wx.hideLoading();
              // 保存到相册
              wx.saveImageToPhotosAlbum({
                filePath: result.tempFilePath,
                success: () => {
                  utils.showSuccess('保存成功');
                },
                fail: (err) => {
                  if (err.errMsg && err.errMsg.includes('auth denied')) {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存相册权限',
                      success: (res) => {
                        if (res.confirm) {
                          wx.openSetting();
                        }
                      }
                    });
                  } else {
                    utils.showText('保存失败，请重试');
                  }
                }
              });
            },
            fail: () => {
              wx.hideLoading();
              utils.showText('生成图片失败');
            }
          });
        });
      });
  }
});
const adBehavior = require('../../../../utils/ad-behavior');
