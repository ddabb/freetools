// Emoji转图片页面逻辑（简化版）
const utils = require('../../../../utils/index');

Page({
  behaviors: [adBehavior],
  data: {
    inputEmoji: '',
    canExport: false,
    isLoading: false,
    previewEmoji: '😀',
    previewStyle: 'background: rgba(255, 255, 255, 0.1); border-radius: 0; box-shadow: 0 0 0 transparent;',
    
    // 画布样式
    canvasStyle: 'width: 400px; height: 400px; position: absolute; left: -9999px; top: -9999px;',
    
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
      
      console.debug('开始生成emoji PNG:', {
        inputEmoji: inputEmoji
      });
      
      // 考虑设备像素比，确保在不同设备上都能正确显示
      let dpr = 1;
      try {
        const systemInfo = wx.getSystemInfoSync();
        dpr = systemInfo.pixelRatio || 1;
        console.debug('设备像素比:', dpr);
      } catch (error) {
        console.warn('获取系统信息失败:', error);
        dpr = 1;
      }
      
      // 使用新的2D Canvas API获取上下文，参照life-countdown.js的方式
      const query = wx.createSelectorQuery().in(this);
      query.select('#emojiCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('获取Canvas元素失败');
            utils.showText('获取画布失败，请重试');
            that.setData({ isLoading: false });
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 使用固定的画布尺寸，确保emoji有足够的空间显示
          const canvasWidth = 400;
          const canvasHeight = 400;
          
          // 动态调整canvas元素的大小
          that.setData({
            canvasStyle: `width: ${canvasWidth}px; height: ${canvasHeight}px; position: absolute; left: -9999px; top: -9999px;`
          });
          
          // 调整canvas的实际尺寸，考虑设备像素比
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          
          // 缩放上下文，确保绘制内容在高DPR设备上正确显示
          ctx.scale(dpr, dpr);
          
          // 首先清空画布（保持透明背景）
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          
          // 设置字体大小和样式
          const fontSize = 300; // 使用较大的字体确保emoji能完全显示
          ctx.font = `normal ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // 绘制emoji（居中显示，使用emoji本身的颜色）
          ctx.fillText(inputEmoji, canvasWidth / 2, canvasHeight / 2);
          
          // 绘制完成后保存图片
          console.debug('Canvas绘制完成，开始生成PNG图片');
          
          // 使用新的2D Canvas API保存图片
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth,
            destHeight: canvasHeight,
            quality: 0.7,
            fileType: 'png',
            success: (res) => {
              console.debug('PNG图片生成成功:', res.tempFilePath);
              that.saveImageToAlbum(res.tempFilePath);
            },
            fail: (err) => {
              console.error('生成PNG图片失败:', err);
              utils.showText('生成图片失败，请重试');
              that.setData({ isLoading: false });
            }
          });
        });
    } catch (error) {
      console.error('Canvas绘制过程中出错:', error);
      utils.showText('生成图片失败，请重试');
      that.setData({ isLoading: false });
    }
  },

  // 保存图片到相册
  saveImageToAlbum(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        console.debug('图片保存到相册成功');
        utils.showSuccess('图片已保存到相册');
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
                    console.debug('打开设置页面:', settingRes);
                  }
                });
              }
              this.setData({ isLoading: false });
            }
          });
        } else {
          utils.showText('保存失败，请重试');
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
      console.debug('开始导出PNG图片，参数:', {
        inputEmoji: inputValue || '😀' // 如果没有输入，使用默认emoji
      });
      
      // 延迟执行以确保UI更新
      setTimeout(() => {
        this.generateEmojiPNG();
      }, 100);
      
    } catch (error) {
      console.error('导出图片时出错:', error);
      utils.showText('导出图片失败，请重试');
      this.setData({ isLoading: false });
    }
  },

  // 页面加载
  onLoad() {
    this.updatePreview();
  }
});
const adBehavior = require('../../../../utils/ad-behavior');