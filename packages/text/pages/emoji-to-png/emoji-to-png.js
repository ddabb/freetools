// Emoji转PNG页面逻辑（简化版）
Page({
  data: {
    inputEmoji: '',
    canExport: false,
    isLoading: false,
    previewEmoji: '😀',
    previewStyle: 'background: rgba(255, 255, 255, 0.1); border-radius: 0; box-shadow: 0 0 0 transparent;',
    
    // 画布尺寸配置
    canvasWidth: 200,
    canvasHeight: 200
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
    
    // 无论输入是否有效，都可以导出图片
    // 如果输入无效，显示默认emoji；如果输入有效，显示输入的emoji
    this.setData({
      previewEmoji: validation.valid ? inputValue : '😀',
      canExport: true // 始终允许导出
    });
  },

  // 输入emoji变化
  onEmojiInput(e) {
    this.setData({
      inputEmoji: e.detail.value
    });
    this.updatePreview();
  },

  // 重置表单
  resetForm() {
    this.setData({
      inputEmoji: ''
    });
    this.updatePreview();
  },

  // 生成emoji PNG图片
  generateEmojiPNG() {
    const that = this;
    
    try {
      const inputEmoji = this.data.inputEmoji.trim() || '😀';
      
      console.log('开始生成emoji PNG:', {
        inputEmoji: inputEmoji
      });
      
      // 使用life-countdown的方式直接创建Canvas上下文
      const ctx = wx.createCanvasContext('emojiCanvas', this);
      
      // 固定画布尺寸为256x256像素（适合大多数emoji）
      const canvasWidth = 256;
      const canvasHeight = 256;
      
      // 首先清空画布（保持透明背景）
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 使用一个较大的字体确保emoji填满画布
      const fontSize = 200;
      ctx.font = `normal ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000000'; // emoji颜色
      
      // 绘制emoji（居中显示）
      ctx.fillText(inputEmoji, canvasWidth / 2, canvasHeight / 2);
      
      // 绘制完成后保存图片
      console.log('Canvas绘制完成，开始生成PNG图片');
      
      // 执行绘制
      ctx.draw(false, function() {
        // 使用life-countdown的方式保存图片
        wx.canvasToTempFilePath({
          canvasId: 'emojiCanvas',
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth, // 输出256x256像素的图片
          destHeight: canvasHeight,
          quality: 0.7, // 降低图片质量以减小文件大小
          fileType: 'png',
          success: (res) => {
            console.log('PNG图片生成成功:', res.tempFilePath);
            that.saveImageToAlbum(res.tempFilePath);
          },
          fail: (err) => {
            console.error('生成PNG图片失败:', err);
            wx.showToast({
              title: '生成图片失败，请重试',
              icon: 'none'
            });
            that.setData({ isLoading: false });
          }
        });
      });
    } catch (error) {
      console.error('Canvas绘制过程中出错:', error);
      wx.showToast({
        title: '生成图片失败，请重试',
        icon: 'none'
      });
      that.setData({ isLoading: false });
    }
  },

  // 保存图片到相册
  saveImageToAlbum(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        console.log('图片保存到相册成功');
        wx.showToast({
          title: '图片已保存到相册',
          icon: 'success'
        });
        this.setData({ isLoading: false });
      },
      fail: (err) => {
        console.error('保存图片到相册失败:', err);
        
        // 处理权限拒绝的情况
        if (err.errMsg && (err.errMsg.includes('auth denied') || err.errMsg.includes('auth deny'))) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            showCancel: true,
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    console.log('打开设置页面:', settingRes);
                  }
                });
              }
              this.setData({ isLoading: false });
            }
          });
        } else {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
          this.setData({ isLoading: false });
        }
      }
    });
  },

  // 导出PNG图片（主函数）
  exportAsPNG() {
    const inputValue = this.data.inputEmoji.trim();
    
    this.setData({ isLoading: true });
    
    try {
      console.log('开始导出PNG图片，参数:', {
        inputEmoji: inputValue || '😀' // 如果没有输入，使用默认emoji
      });
      
      // 延迟执行以确保UI更新
      setTimeout(() => {
        this.generateEmojiPNG();
      }, 100);
      
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