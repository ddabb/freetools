// qrcode.js
const QRCode = require('../../miniprogram_npm/weapp-qrcode-canvas-2d/index.js');

Page({
  data: {
    inputContent: '', // 输入内容
    qrcodeType: 'text', // 二维码类型：text-文本, url-网址, card-名片
    showQrcode: false // 是否显示二维码
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
    
    // 生成二维码
    wx.createSelectorQuery().select('#qrcodeCanvas').context(res => {
      QRCode({
        canvas: res.context,
        text: content,
        width: 400,
        height: 400
      });
    }).exec();
    
    this.setData({
      showQrcode: true
    });
  },
  
  // 保存二维码
  saveQrcode() {
    wx.canvasToTempFilePath({
      canvasId: 'qrcodeCanvas',
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
  },
  
  // 分享二维码
  shareQrcode() {
    wx.canvasToTempFilePath({
      canvasId: 'qrcodeCanvas',
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
  }
})