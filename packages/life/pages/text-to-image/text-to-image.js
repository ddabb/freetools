// packages/life/pages/text-to-image/text-to-image.js

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 根据平台导入相应的模块
let prompt, image, storage, device, share;
if (isHarmonyOS) {
  prompt = require('@system.prompt');
  image = require('@system.image');
  storage = require('@system.storage');
  device = require('@system.device');
  share = require('@system.share');
}

// 平台兼容API封装
const platform = {
  // 弹窗提示
  showToast: function(options) {
    if (isHarmonyOS) {
      prompt.showToast({
        message: options.title || options.message,
        duration: options.duration || 2000
      });
    } else {
      wx.showToast({
        title: options.title || options.message,
        icon: options.icon || 'none',
        duration: options.duration || 2000
      });
    }
  },
  
  // 存储相关
  setStorage: function(key, value) {
    if (isHarmonyOS) {
      storage.set({
        key: key,
        value: JSON.stringify(value),
        success: function() {
          console.log('存储成功');
        },
        fail: function(data, code) {
          console.log('存储失败', code, data);
        }
      });
    } else {
      wx.setStorageSync(key, value);
    }
  },
  
  getStorage: function(key, callback) {
    if (isHarmonyOS) {
      storage.get({
        key: key,
        success: (data) => {
          try {
            callback(JSON.parse(data));
          } catch (error) {
            callback(null);
          }
        },
        fail: (data, code) => {
          console.log('获取存储失败', code, data);
          callback(null);
        }
      });
    } else {
      const data = wx.getStorageSync(key);
      callback(data);
    }
  },
  
  removeStorage: function(key) {
    if (isHarmonyOS) {
      storage.delete({ 
        key: key,
        success: function() {
          console.log('清除存储成功');
        },
        fail: function(data, code) {
          console.log('清除存储失败', code, data);
        }
      });
    } else {
      wx.removeStorageSync(key);
    }
  },
  
  // 系统信息
  getSystemInfo: function(callback) {
    if (isHarmonyOS) {
      device.getInfo({
        success: (data) => {
          callback({
            pixelRatio: data.pixelRatio || 1,
            screenWidth: data.screenWidth || 375,
            screenHeight: data.screenHeight || 667
          });
        },
        fail: (data, code) => {
          console.log('获取设备信息失败', code, data);
          callback({ pixelRatio: 1, screenWidth: 375, screenHeight: 667 });
        }
      });
    } else {
      wx.getDeviceInfo({
        success: (data) => {
          callback({
            pixelRatio: data.pixelRatio || 1,
            screenWidth: data.screenWidth || 375,
            screenHeight: data.screenHeight || 667,
            platform: data.platform || '',
            version: data.version || '',
            SDKVersion: data.SDKVersion || ''
          });
        },
        fail: (err) => {
          console.log('获取设备信息失败', err);
          callback({ pixelRatio: 1, screenWidth: 375, screenHeight: 667, platform: '', version: '', SDKVersion: '' });
        }
      });
    }
  },
  
  // 分享
  share: function(options) {
    if (isHarmonyOS) {
      share.share({
        title: options.title,
        content: options.content || options.title,
        imageUrl: options.imageUrl || '',
        success: function() {
          console.log('分享成功');
        },
        fail: function(data, code) {
          console.log('分享失败', code, data);
        }
      });
    } else {
      // 微信小程序分享
      wx.shareAppMessage({
        title: options.title,
        imageUrl: options.imageUrl || '',
        path: options.path || '/packages/life/pages/text-to-image/text-to-image',
        success: function(res) {
          console.log('微信分享成功', res);
        },
        fail: function(err) {
          console.log('微信分享失败', err);
        }
      });
    }
  },
  
  // 保存图片到相册
  saveImageToAlbum: function(imageData, success, fail) {
    if (isHarmonyOS) {
      // 鸿蒙平台保存图片
      image.saveToPhotosAlbum({
        uri: imageData,
        success: function(data) {
          success && success(data);
        },
        fail: function(data, code) {
          // 简单的错误处理
          console.error('保存图片失败:', code, data);
          fail && fail(data, code);
        }
      });
    } else {
      // 微信小程序平台
      wx.saveImageToPhotosAlbum({
        filePath: imageData,
        success: success,
        fail: fail
      });
    }
  }
};

// 导入 lunar-javascript 包
const { Solar, Lunar } = require('lunar-javascript');

Page({
  data: {
    text: '',
    from: '',
    selectedQrCode: 'default', // 默认选择默认二维码
    customQrCodeImage: '',
    canvaswidth: 375,
    canvasheight: 667,
    linespace: 30,
    textLength: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '文案生图'
    })
  },

  // 文字输入
  onTextInput(e) {
    const value = e.detail.value
    this.setData({
      text: value,
      textLength: value.length
    })
  },

  // 出处输入
  onFromInput(e) {
    let value = e.detail.value
    // 限制最多输入15个字
    if (value.length > 15) {
      value = value.substring(0, 15)
    }
    this.setData({
      from: value
    })
  },

  // 选择二维码类型
  selectQrCode(e) {
    const qrType = e.currentTarget.dataset.type
    this.setData({
      selectedQrCode: qrType
    })
  },

  // 上传二维码图片
  uploadQRCodeImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        if (tempFilePaths && tempFilePaths.length > 0) {
          // 简单的二维码图片校验（检查文件类型和大小）
          const tempFilePath = tempFilePaths[0]
          const fileExt = tempFilePath.split('.').pop().toLowerCase()
          const allowedExts = ['jpg', 'jpeg', 'png', 'gif']
          
          if (!allowedExts.includes(fileExt)) {
            platform.showToast({
              title: '请选择图片文件',
              icon: 'none'
            })
            return
          }
          
          // 检查文件大小（限制1MB）
          wx.getFileInfo({
            filePath: tempFilePath,
            success: (fileInfo) => {
              if (fileInfo.size > 1024 * 1024) {
                platform.showToast({
                  title: '图片大小不能超过1MB',
                  icon: 'none'
                })
                return
              }
              
              // 保存图片路径
              this.setData({
                customQrCodeImage: tempFilePath
              })
              platform.showToast({
                title: '二维码图片已选择',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('获取文件信息失败:', err)
              platform.showToast({
                title: '选择图片失败',
                icon: 'none'
              })
            }
          })
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        platform.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 移除二维码图片
  removeQRCodeImage() {
    this.setData({
      customQrCodeImage: ''
    })
    platform.showToast({
      title: '二维码图片已移除',
      icon: 'success'
    })
  },

  // 跳转到二维码生成页面
  goToQRCodePage() {
    wx.navigateTo({
      url: '/packages/life/pages/qrcode/qrcode'
    })
  },

  // 生成图片
  generateImage() {
    const text = this.data.text.trim()
    if (!text) {
      platform.showToast({
        title: '请输入文字内容',
        icon: 'none'
      })
      return
    }

    // 设置当前要生成的文案内容
    this.setData({
      currentCopywriting: {
        text: text,
        from: this.data.from || '佚名'
      }
    });
    
    // 使用copywriting页面的逻辑生成图片
    this.savecodetofile();
  },

  /**
   * 保存Canvas为图片
   */
  savecodetofile() {
    if (isHarmonyOS) {
      // 在鸿蒙平台，我们需要通过组件引用获取Canvas
      const canvas = this.$element('cvsTextToImage');
      if (canvas) {
        this.MergeImage(canvas);
      } else {
        console.error('获取Canvas元素失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
      }
    } else {
      // 在微信小程序平台，使用wx.createCanvasContext
      try {
        const ctx = wx.createCanvasContext('cvsTextToImage', this);
        if (ctx) {
          this.MergeImage(ctx);
        } else {
          console.error('创建Canvas上下文失败');
          platform.showToast({
            title: '创建画布上下文失败，请重试'
          });
        }
      } catch (error) {
        console.error('调用wx.createCanvasContext失败:', error);
        platform.showToast({
          title: '创建画布失败，请重试'
        });
      }
    }
  },



  /**
   * 获取应用全局数据（字体状态）
   */
  getAppGlobalData() {
    try {
      const app = getApp();
      return app.globalData || {};
    } catch (error) {
      console.warn('获取应用全局数据失败，使用默认值:', error);
      return { fontsReady: false, fontsFailed: false };
    }
  },

  /**
   * 获取适合的字体栈
   */
  getFontStack(fontType = 'body') {
    const globalData = this.getAppGlobalData();
    
    // 字体栈配置 - 优化手机端兼容性，结合 app.js 中加载的字体
    const fontStacks = {
      title: {
        primary: 'Montserrat, Pacifico, Inter, Roboto',
        fallback: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      body: {
        primary: 'Inter, Roboto, Open Sans, Noto Sans SC',
        fallback: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      elegant: {
        primary: 'Raleway, Lato, Source Sans Pro, Dancing Script',
        fallback: '"STKaiti", "KaiTi", "Microsoft YaHei", serif'
      },
      classic: {
        primary: '"STSong", "SimSun", Noto Sans SC, serif',
        fallback: '"Microsoft YaHei", sans-serif'
      },
      artistic: {
        primary: 'Bangers, Comic Neue, fantasy',
        fallback: '"Microsoft YaHei", sans-serif'
      },
      handwriting: {
        primary: 'Pacifico, Dancing Script, cursive',
        fallback: '"STKaiti", "KaiTi", cursive'
      },
      mono: {
        primary: 'Fira Code, JetBrains Mono, Inconsolata, monospace',
        fallback: 'monospace'
      }
    };
    
    const stack = fontStacks[fontType] || fontStacks.body;
    // 根据字体加载状态选择使用 primary 还是 fallback
    return globalData.fontsReady ? stack.primary + ', ' + stack.fallback : stack.fallback;
  },

  /**
   * 设置 Canvas 字体
   */
  setCanvasFont(ctx, fontSize, fontType = 'body', isBold = false, isItalic = false) {
    const fontStack = this.getFontStack(fontType);
    let fontStyle = '';
    
    if (isBold) fontStyle += 'bold ';
    if (isItalic) fontStyle += 'italic ';
    
    ctx.font = `${fontStyle}${fontSize}px ${fontStack}`;
    ctx.setTextAlign('left');
    ctx.setTextBaseline('top');
  },

  /**
   * 获取当前选择的二维码图片路径
   */
  getCurrentQrCodePath() {
    const { selectedQrCode, customQrCodeImage } = this.data;
    
    if (selectedQrCode === 'custom' && customQrCodeImage) {
      return customQrCodeImage;
    }
    
    // 默认使用默认二维码
    return '/images/mini.png';
  },

  /**
   * 绘制分享图片 - 复用copywriting页面的逻辑
   */
  MergeImage(ctx) {
    let that = this;
    
    // 直接使用默认值，不依赖系统信息
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };
    
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    const padding = 45; // 增加内边距，提升呼吸感
    const qrSize = 85; // 二维码大小调整
    
    // 布局位置计算
    const qrX = width - qrSize - 35; // 二维码X坐标（右侧，增加边距）
    const qrY = height - qrSize - 35; // 二维码Y坐标（底部，增加边距）
    const dateY = qrY; // 日期位置与二维码同一水平线
    const contentY = padding + 50; // 文案内容位置（顶部居中）
    let fromY = contentY; // 来源信息位置，将在绘制文案后动态调整

    // 背景 - 优化渐变效果和装饰元素
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f9f7fe');
    gradient.addColorStop(0.2, '#f0f4ff');
    gradient.addColorStop(0.5, '#e8f0ff');
    gradient.addColorStop(0.8, '#f5f0ff');
    gradient.addColorStop(1, '#fef7f9');
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, width, height);
    
    // 绘制装饰元素 - 艺术感圆形
    ctx.setFillStyle('rgba(255, 166, 0, 0.08)');
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.2, 120, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.setFillStyle('rgba(138, 43, 226, 0.08)');
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.3, 100, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.setFillStyle('rgba(0, 191, 255, 0.08)');
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.8, 140, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制线条装饰 - 艺术感曲线
    ctx.setStrokeStyle('rgba(147, 112, 219, 0.1)');
    ctx.setLineWidth(1.5);
    ctx.beginPath();
    ctx.moveTo(padding, height * 0.3);
    ctx.bezierCurveTo(width * 0.25, height * 0.2, width * 0.75, height * 0.4, width - padding, height * 0.3);
    ctx.stroke();
    
    ctx.setStrokeStyle('rgba(255, 105, 180, 0.1)');
    ctx.beginPath();
    ctx.moveTo(padding, height * 0.7);
    ctx.bezierCurveTo(width * 0.25, height * 0.6, width * 0.75, height * 0.8, width - padding, height * 0.7);
    ctx.stroke();
    
    // 绘制网格装饰
    ctx.setStrokeStyle('rgba(200, 200, 200, 0.05)');
    ctx.setLineWidth(0.5);
    for (let i = 0; i < 5; i++) {
      const y = padding + (height - 2 * padding) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const x = padding + (width - 2 * padding) * i / 3;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // 文案内容
    const copywriting = this.data.currentCopywriting;
    if (copywriting && copywriting.text) {
      const text = copywriting.text;
      
      // 根据不同条件设置不同的模板配置
      let fontSize, lineHeight, maxCharsPerLine, fontType, isBold;
      
      // 所有文案都使用手写体
      fontType = 'handwriting';
      isBold = true;
      
      if (text.length <= 20) {
        fontSize = 32;
        lineHeight = 45;
        maxCharsPerLine = 10;
      } else if (text.length <= 50) {
        fontSize = 28;
        lineHeight = 42;
        maxCharsPerLine = 12;
      } else if (text.length <= 150) {
        fontSize = 24;
        lineHeight = 38;
        maxCharsPerLine = 16;
      } else {
        fontSize = 22;
        lineHeight = 34;
        maxCharsPerLine = 18;
      }
      
      this.setCanvasFont(ctx, fontSize, fontType, isBold);
      
      // 文字颜色和效果
      const colorPalette = {
        artistic: '#2c3e50',
        handwriting: '#34495e',
        elegant: '#2d3748',
        classic: '#1a202c',
        body: '#2d3748',
        title: '#1a202c'
      };
      
      const textColor = colorPalette[fontType] || '#2d3748';
      ctx.setTextAlign('left');
      
      // 添加文字阴影效果
      // 所有文案都使用手写体阴影效果
      ctx.setShadow(2, 2, 8, 'rgba(0, 0, 0, 0.1)');
      
      let currentY = contentY;
      let startIndex = 0;
      const firstLineIndent = 20; // 首行缩进
      const maxContentWidth = width - 2 * padding - firstLineIndent;
      
      while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, text.length);
        
        // 尝试在标点符号处换行
        if (endIndex < text.length) {
          const punctuationChars = ['，', '。', '！', '？', '；', '：', ',', '.', '!', '?', ';', ':'];
          let lastPunctuationIndex = -1;
          
          for (let i = endIndex - 1; i >= startIndex; i--) {
            if (punctuationChars.includes(text[i])) {
              lastPunctuationIndex = i;
              break;
            }
          }
          
          if (lastPunctuationIndex > startIndex) {
            endIndex = lastPunctuationIndex + 1;
          }
        }
        
        let lineText = text.substring(startIndex, endIndex);
        let lineWidth = ctx.measureText(lineText).width;
        
        while (lineWidth > maxContentWidth && endIndex > startIndex) {
          endIndex--;
          lineText = text.substring(startIndex, endIndex);
          lineWidth = ctx.measureText(lineText).width;
        }
        
        // 计算绘制位置
        const x = startIndex === 0 ? padding + firstLineIndent : padding;
        
        // 所有文案都使用手写体的渐变效果
        const textGradient = ctx.createLinearGradient(x, currentY, x + lineWidth, currentY);
        textGradient.addColorStop(0, '#8e44ad');
        textGradient.addColorStop(1, '#3498db');
        ctx.setFillStyle(textGradient);
        ctx.fillText(lineText, x, currentY);
        
        startIndex = endIndex;
        currentY += lineHeight;
        
        if (currentY > height - padding - 200) {
          ctx.setTextAlign('left');
          ctx.setFillStyle(textColor);
          ctx.fillText('...', padding, currentY);
          currentY += lineHeight;
          break;
        }
      }
      
      // 重置阴影
      ctx.setShadow(0, 0, 0, 'transparent');
      
      fromY = currentY + 25;
    }

    // 来源信息
    if (copywriting && copywriting.from && copywriting.from !== '佚名') {
      this.setCanvasFont(ctx, 16, 'elegant', false, true);
      ctx.setFillStyle('#8a9aaf');
      ctx.setTextAlign('right');
      ctx.fillText('—— ' + copywriting.from, width - padding, fromY + 5);
    }

    // 日期信息
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[now.getDay()];
    const solar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const lunarDate = solar.getLunar();
    const ganzhi = lunarDate.getYearInGanZhi();
    
    const qrCenterY = qrY + qrSize / 2;
    
    ctx.setTextAlign('left');
    
    this.setCanvasFont(ctx, 14, 'title', true);
    ctx.setFillStyle('#4a5568');
    ctx.fillText(dateStr, padding, qrCenterY - 20);
    
    this.setCanvasFont(ctx, 12, 'body');
    ctx.setFillStyle('#718096');
    const weekAndGanzhiText = `星期${weekDay} ${ganzhi}`;
    ctx.fillText(weekAndGanzhiText, padding, qrCenterY + 5);

    // 获取当前选择的二维码路径
    const qrCodePath = this.getCurrentQrCodePath();
    
    // 加载并绘制二维码
    if (isHarmonyOS) {
      const canvas = this.$element('cvsTextToImage');
      if (canvas) {
        const img = new Image();
        img.onload = () => {
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.setFillStyle('#ffffff');
            ctx2d.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
            ctx2d.drawImage(img, qrX, qrY, qrSize, qrSize);
            
            const imageData = canvas.toDataURL('image/png');
            if (!imageData || !imageData.startsWith('data:image/png')) {
              console.error('生成的图片数据格式不正确:', imageData ? imageData.substring(0, 50) : 'null');
              platform.showToast({
                title: '生成图片数据失败'
              });
              return;
            }
            
            // 保存图片到相册
            platform.saveImageToAlbum(imageData, 
              function() {
                console.log("保存相册成功");
                platform.showToast({
                  title: '保存成功'
                });
              },
              function(data, code) {
                console.log("保存到相册失败", { code, data, dataType: typeof data });
                platform.showToast({
                  title: '保存失败，请重试'
                });
              }
            );
          }
        };
        img.src = qrCodePath;
      }
    } else {
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
      
      // 直接使用路径绘制二维码，支持用户自定义二维码
      ctx.drawImage(qrCodePath, qrX, qrY, qrSize, qrSize);
      
      ctx.draw(false, function() {
        // 绘制完成后执行保存
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: width,
          height: height,
          quality: 1,
          canvasId: 'cvsTextToImage',
          destWidth: width * (systemInfo.pixelRatio / 2),
          destHeight: height * (systemInfo.pixelRatio / 2),
          success: (res) => {
            const drawurl = res.tempFilePath;
            platform.saveImageToAlbum(drawurl, 
              function(res) {
                console.log("保存相册成功" + res);
                platform.showToast({
                  title: '保存相册成功'
                });
              },
              function(err) {
                console.log("保存到相册失败", err);
                if (err.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || 
                    err.errMsg === "saveImageToPhotosAlbum:fail auth deny" || 
                    err.errMsg === "saveImageToPhotosAlbum:fail authorize no response") {
                  wx.showModal({
                    title: '提示',
                    content: '需要您授权保存相册',
                    showCancel: true,
                    success: modalSuccess => {
                      if (modalSuccess.confirm) {
                        wx.openSetting();
                      }
                    }
                  });
                } else {
                  platform.showToast({
                    title: '保存失败，请重试'
                  });
                }
              }
            );
          },
          fail: function (error) {
            console.log("canvasToTempFilePath失败:" + error);
            platform.showToast({
              title: '生成图片失败，请重试'
            });
          }
        }, that);
      });
    }
  },

  // 保存图片函数已集成到生成图片逻辑中，不再需要单独的函数

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '文案生图',
      imageUrl: '/images/mini.png',
      path: '/packages/life/pages/text-to-image/text-to-image'
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '文案生图',
      imageUrl: '/images/mini.png',
      path: '/packages/life/pages/text-to-image/text-to-image'
    }
  }
})
