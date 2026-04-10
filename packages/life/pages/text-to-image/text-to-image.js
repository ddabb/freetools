// packages/life/pages/text-to-image/text-to-image.js
const utils = require('../../../../utils/index');
const imgGen = require('../../../../utils/imageGenerator');

Page({
  data: {
    text: '',
    from: '',
    selectedQrCode: 'default',
    customQrCodeImage: '',
    canvaswidth: 375,
    canvasheight: 667,
    textLength: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '文案生图' });
    
    // 加载字体
    this.loadFonts();
  },
  
  // 加载字体
  async loadFonts() {
    try {
      console.log('开始加载字体...');
      const result = await utils.loadFonts('core');
      console.log('字体加载完成:', result);
    } catch (error) {
      console.error('字体加载失败:', error);
    }
  },

  // 文字输入
  onTextInput(e) {
    const value = e.detail.value;
    this.setData({
      text: value,
      textLength: value.length
    });
  },

  // 出处输入
  onFromInput(e) {
    let value = e.detail.value;
    if (value.length > 15) {
      value = value.substring(0, 15);
    }
    this.setData({ from: value });
  },

  // 绘制图片
  async drawImage(ctx, canvas, width, height, callback) {
    const { text, from, selectedQrCode, customQrCodeImage } = this.data;
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
    if (text) {
      const textHeight = qrY - contentY - 30;
      fromY = await imgGen.drawText(ctx, text, {
        x: padding,
        startY: contentY,
        maxWidth: maxContentWidth,
        maxHeight: textHeight
      });
    }

    // 绘制来源
    if (from && from !== '佚名') {
      imgGen.drawFrom(ctx, from, {
        x: padding,
        y: fromY + 5,
        maxWidth: maxContentWidth
      });
    }

    // 绘制日期
    imgGen.drawDate(ctx, {
      x: padding,
      qrY,
      qrSize,
      qrMargin: 35
    });

    // 获取二维码路径
    const qrPath = (selectedQrCode === 'custom' && customQrCodeImage)
      ? customQrCodeImage
      : '/images/text2image.jpg';

    // 加载并绘制二维码
    if (qrPath) {
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
      img.onerror = () => {
        console.warn('二维码图片加载失败:', qrPath);
        if (callback) callback();
      };
    } else {
      if (callback) callback();
    }
  },

  // 选择二维码类型
  selectQrCode(e) {
    this.setData({ selectedQrCode: e.currentTarget.dataset.type });
  },

  // 上传二维码图片
  uploadQRCodeImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) return;

        const fileExt = tempFilePath.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
          utils.showText('请选择图片文件');
          return;
        }

        wx.getFileInfo({
          filePath: tempFilePath,
          success: (fileInfo) => {
            if (fileInfo.size > 1024 * 1024) {
              utils.showText('图片大小不能超过1MB');
              return;
            }
            this.setData({ customQrCodeImage: tempFilePath });
            utils.showSuccess('二维码图片已选择');
          },
          fail: () => utils.showText('选择图片失败')
        });
      },
      fail: () => utils.showText('选择图片失败')
    });
  },

  // 移除二维码图片
  removeQRCodeImage() {
    this.setData({ customQrCodeImage: '' });
    utils.showSuccess('二维码图片已移除');
  },

  // 跳转到二维码生成页面
  goToQRCodePage() {
    wx.navigateTo({ url: '/packages/life/pages/qrcode/qrcode' });
  },

  // 生成图片（保存到相册）
  generateImage() {
    const { text } = this.data;
    if (!text || !text.trim()) {
      utils.showText('请输入文字内容');
      return;
    }

    wx.showLoading({ title: '生成中...' });

    // 清空之前的日志
    imgGen.clearDrawLogs();

    const query = wx.createSelectorQuery().in(this);
    query.select('#cvsTextToImage')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading();
          console.error('生成画布未找到', res);
          utils.showText('画布初始化失败');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        // 设置高清canvas尺寸
        canvas.width = this.data.canvaswidth * dpr;
        canvas.height = this.data.canvasheight * dpr;
        ctx.scale(dpr, dpr);

        // 绘制完整图片
        this.drawImage(ctx, canvas, this.data.canvaswidth, this.data.canvasheight, async () => {
          // 获取字体相关日志
          const logs = imgGen.getDrawLogs();
          console.log('字体绘制日志:', logs);
          
          // 导出图片
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: this.data.canvaswidth,
            height: this.data.canvasheight,
            destWidth: this.data.canvaswidth * dpr,
            destHeight: this.data.canvasheight * dpr,
            quality: 1,
            fileType: 'png',
            success: (result) => {
              wx.hideLoading();
              // 保存到相册
              wx.saveImageToPhotosAlbum({
                filePath: result.tempFilePath,
                success: () => {
                  utils.showSuccess('保存相册成功');
                  // 再次打印日志，方便复制
                  console.log('字体绘制日志:', logs);
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
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '文案生图',
      imageUrl: '/images/mini.png',
      path: '/packages/life/pages/text-to-image/text-to-image'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '文案生图',
      imageUrl: '/images/mini.png',
      path: '/packages/life/pages/text-to-image/text-to-image'
    };
  }
});
