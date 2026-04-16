// packages/text/pages/poster-generator/poster-generator.js
const utils = require('../../../../utils/index');

Page({
  data: {
    title: '',
    content: '',
    footer: '',
    selectedStyle: 'style1',
    contentLength: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '海报生成' });
  },

  // 标题输入
  onTitleInput(e) {
    const value = e.detail.value;
    this.setData({ title: value });
  },

  // 内容输入
  onContentInput(e) {
    const value = e.detail.value;
    this.setData({
      content: value,
      contentLength: value.length
    });
  },

  // 底部信息输入
  onFooterInput(e) {
    const value = e.detail.value;
    this.setData({ footer: value });
  },

  // 选择样式
  selectStyle(e) {
    this.setData({ selectedStyle: e.currentTarget.dataset.style });
  },

  // 生成海报
  async generatePoster() {
    const { title, content } = this.data;
    if (!title || !title.trim() || !content || !content.trim()) {
      utils.showText('请输入标题和内容');
      return;
    }

    wx.showLoading({ title: '生成中...' });

    try {
      // 获取 wxml2canvas 组件实例
      const wxml2canvasComponent = this.selectComponent('#wxml2canvas');
      if (!wxml2canvasComponent) {
        throw new Error('未找到 wxml2canvas 组件');
      }

      // 绘制内容
      await wxml2canvasComponent.draw();
      
      // 导出图片
      const tempFilePath = await wxml2canvasComponent.toTempFilePath();
      
      wx.hideLoading();
      // 保存到相册
      this.saveToAlbum(tempFilePath);
    } catch (err) {
      wx.hideLoading();
      console.error('生成海报失败:', err);
      utils.showText('生成海报失败');
    }
  },

  // 保存到相册
  saveToAlbum(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        utils.showSuccess('保存相册成功');
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

});