// Emoji转PNG页面逻辑
Page({
  data: {
    inputEmoji: '',
    selectedBackground: 'white',
    canExport: false,
    isLoading: false,
    previewEmoji: '😀',
    previewStyle: 'background: #ffffff; border: 1px solid #e0e0e0;'
  },

  // 背景配置
  backgrounds: {
    white: {
      name: '白色',
      style: 'background: #ffffff; border: 1px solid #e0e0e0;'
    },
    black: {
      name: '黑色',
      style: 'background: #000000;'
    },
    transparent: {
      name: '透明',
      style: 'background: transparent;'
    }
  },

  // 检查输入是否为有效emoji
  isValidEmoji(input) {
    if (!input || input.trim() === '') {
      return { valid: false, message: '请输入emoji' };
    }
    
    // 将输入转换为数组以正确处理emoji
    const chars = Array.from(input.trim());
    
    // 检查是否包含emoji
    const emojiRegex = /\p{Emoji}/u;
    const hasEmoji = chars.some(char => emojiRegex.test(char));
    const emojiCount = chars.filter(char => emojiRegex.test(char)).length;
    
    if (!hasEmoji) {
      return { valid: false, message: '请输入有效的emoji' };
    }
    
    if (emojiCount !== 1) {
      return { valid: false, message: '只能输入一个emoji' };
    }
    
    return { valid: true, message: '' };
  },

  // 更新预览
  updatePreview() {
    const inputValue = this.data.inputEmoji.trim();
    const validation = this.isValidEmoji(inputValue);
    
    const background = this.backgrounds[this.data.selectedBackground];
    
    if (!validation.valid) {
      this.setData({
        previewEmoji: '😀',
        canExport: false,
        previewStyle: background.style
      });
    } else {
      this.setData({
        previewEmoji: inputValue,
        canExport: true,
        previewStyle: background.style
      });
    }
  },

  // 输入emoji变化
  onEmojiInput(e) {
    this.setData({
      inputEmoji: e.detail.value
    });
    this.updatePreview();
  },

  // 背景选择变化
  onBackgroundChange(e) {
    this.setData({
      selectedBackground: e.detail.value
    });
    this.updatePreview();
  },

  // 重置表单
  resetForm() {
    this.setData({
      inputEmoji: '',
      selectedBackground: 'white'
    });
    this.updatePreview();
  },

  // 导出PNG图片
  async exportAsPNG() {
    const inputValue = this.data.inputEmoji.trim();
    const validation = this.isValidEmoji(inputValue);
    
    if (!validation.valid) {
      wx.showToast({
        title: `输入无效: ${validation.message}`,
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    try {
      // 获取canvas上下文
      const canvas = wx.createCanvasContext('emojiCanvas');
      
      // 绘制背景
      const background = this.backgrounds[this.data.selectedBackground];
      if (background.name !== '透明') {
        canvas.fillStyle = background.name === '白色' ? '#ffffff' : '#000000';
        canvas.fillRect(0, 0, 800, 800);
      }
      
      // 绘制emoji
      canvas.font = '300px Arial, sans-serif';
      canvas.textAlign = 'center';
      canvas.textBaseline = 'middle';
      canvas.fillText(inputValue, 400, 400);
      
      // 绘制完成
      canvas.draw(false, () => {
        wx.canvasToTempFilePath({
          canvasId: 'emojiCanvas',
          width: 800,
          height: 800,
          destWidth: 800,
          destHeight: 800,
          success: (res) => {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '图片已保存到相册',
                  icon: 'success'
                });
              },
              fail: (err) => {
                console.error('保存图片失败:', err);
                wx.showToast({
                  title: '保存图片失败，请重试',
                  icon: 'none'
                });
              }
            });
          },
          fail: (err) => {
            console.error('生成图片失败:', err);
            wx.showToast({
              title: '生成图片失败，请重试',
              icon: 'none'
            });
          },
          complete: () => {
            this.setData({ isLoading: false });
          }
        });
      });
    } catch (error) {
      console.error('导出图片时出错:', error);
      wx.showToast({
        title: '导出图片失败，请重试',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    }
  },

  // 页面加载
  onLoad() {
    this.updatePreview();
  }
});