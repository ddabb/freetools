// qrcode.js
const QRCode = require('../../miniprogram_npm/weapp-qrcode-canvas-2d/index.js');

Page({
  data: {
    inputContent: '', // 输入内容
    qrcodeType: 'text', // 二维码类型：text-文本, url-网址, card-名片
    showQrcode: false // 是否显示二维码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  // 设置输入内容
  setInputContent(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 设置二维码类型
  setQrcodeType(e) {
    this.setData({
      qrcodeType: e.currentTarget.dataset.type
    });
  },

  // 生成二维码
  generate() {
    const { inputContent, qrcodeType } = this.data;
    if (!inputContent) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    // 准备二维码内容
    let content = inputContent;
    if (qrcodeType === 'url' && !content.startsWith('http')) {
      content = 'http://' + content;
    }

    // 先显示二维码区域
    this.setData({ showQrcode: true }, () => {
      // 延迟获取 canvas，确保 DOM 已渲染
      setTimeout(() => {
        // 使用新的 canvas-2d 方式
        wx.createSelectorQuery()
          .select('#qrcodeCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) {
              wx.showToast({
                title: 'Canvas未找到',
                icon: 'none'
              });
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            // 设置画布大小
            const dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = 300 * dpr;
            canvas.height = 300 * dpr;
            ctx.scale(dpr, dpr);

            // 调用生成二维码
            QRCode({
              canvas: canvas,
              text: content,
              width: 300,
              height: 300,
              padding: 20,
              background: '#ffffff',
              foreground: '#000000'
            }).then(() => {
              console.log('二维码生成成功');
            }).catch(err => {
              console.error('生成二维码失败:', err);
              wx.showToast({
                title: '生成失败',
                icon: 'none'
              });
            });
          });
      }, 300);
    });
  },

  // 保存二维码
  saveQrcode() {
    wx.createSelectorQuery()
      .select('#qrcodeCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res || !res[0]) {
          wx.showToast({ title: 'Canvas未找到', icon: 'none' });
          return;
        }
        const canvas = res[0].node;
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: function(res) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function() {
                wx.showToast({
                  title: '保存成功',
                  icon: 'success'
                });
              },
              fail: function() {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            });
          },
          fail: function() {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      });
  },

  // 分享二维码
  shareQrcode() {
    wx.createSelectorQuery()
      .select('#qrcodeCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res || !res[0]) {
          wx.showToast({ title: 'Canvas未找到', icon: 'none' });
          return;
        }
        const canvas = res[0].node;
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: function(res) {
            wx.showShareImageMenu({
              path: res.tempFilePath,
              success: function() {
                wx.showToast({
                  title: '分享成功',
                  icon: 'success'
                });
              }
            });
          },
          fail: function() {
            wx.showToast({
              title: '分享失败',
              icon: 'none'
            });
          }
        });
      });
  }
})