// packages/utility/pages/qrcode/qrcode.js
// 使用 npm 安装的 weapp-qrcode-canvas-2d 包
const QRCode = require('weapp-qrcode-canvas-2d')

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 根据平台导入相应的模块
let prompt, image;
if (isHarmonyOS) {
  prompt = require('@system.prompt');
  image = require('@system.image');
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

// 页面定义
const PageDefinition = {
  data: {
    text: '',
    qrcodeSize: 280,
    qrcodeText: '',
    showQrcode: false,
    generating: false,
    contentType: 'text',
    qrSize: 280,
    errorLevels: ['L (低)', 'M (中)', 'Q (较高)', 'H (高)'],
    errorLevelIndex: 1,
    canGenerate: false,
    centerImage: null,  // 中心图片数据
    imageSize: 60,     // 中心图片大小
    imageTempFilePath: '', // 中心图片临时文件路径
    hasImage: false     // 是否有图片
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '生成二维码器'
    })
    // 设置默认示例文本
    this.setDefaultContent()
    
    // 添加页面滚动监听器，确保二维码跟随页面滚动
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
  },
  
  onPageScroll() {
    // 页面滚动时，重新设置canvas的样式，确保它跟随页面滚动
    if (this.data.showQrcode) {
      this.setData({
        qrSize: this.data.qrSize
      })
    }
  },

  // 设置默认内容
  setDefaultContent() {
    const defaultText = '欢迎使用生成二维码器！'
    const canGenerate = defaultText.trim().length > 0
    this.setData({
      text: defaultText,
      canGenerate: canGenerate
    })
  },

  // 上传中心图片
  uploadCenterImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        if (tempFilePaths && tempFilePaths.length > 0) {
          this.setData({
            imageTempFilePath: tempFilePaths[0],
            hasImage: true,
            centerImage: tempFilePaths[0]
          })
          platform.showToast({
            title: '图片已选择',
            icon: 'success'
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

  // 改变图片大小
  changeImageSize(e) {
    const size = parseInt(e.currentTarget.dataset.size)
    this.setData({
      imageSize: size
    })
    
    // 如果已有二维码，重新生成
    if (this.data.showQrcode) {
      setTimeout(() => {
        this.createQRCode(this.data.text)
      }, 100)
    }
  },

  // 切换内容类型
  switchContentType(e) {
    const type = e.currentTarget.dataset.type
    let placeholder = ''
    let defaultText = ''
    
    switch(type) {
      case 'text':
        placeholder = '请输入要生成二维码的文本内容'
        defaultText = '这是一段示例文本，可以生成对应的二维码'
        break
      case 'url':
        placeholder = '请输入网址，如：https://www.qq.com'
        defaultText = 'https://www.qq.com'
        break
      case 'contact':
        placeholder = '请输入联系方式，如：姓名:电话:邮箱'
        defaultText = '张三:13800138000:zhang@example.com'
        break
    }
    
    const canGenerate = defaultText.trim().length > 0
    this.setData({
      contentType: type,
      text: defaultText,
      canGenerate: canGenerate
    })
  },

  // 获取输入标签
  getInputLabel() {
    switch(this.data.contentType) {
      case 'text': return '文本内容'
      case 'url': return '网址链接'
      case 'contact': return '联系信息'
      default: return '内容'
    }
  },

  // 获取输入占位符
  getInputPlaceholder() {
    switch(this.data.contentType) {
      case 'text': return '请输入要生成二维码的文本内容'
      case 'url': return '请输入网址，如：https://example.com'
      case 'contact': return '请输入联系方式，如：姓名:电话:邮箱'
      default: return '请输入内容'
    }
  },

  // 改变二维码尺寸
  changeQrSize(e) {
    const size = parseInt(e.currentTarget.dataset.size)
    this.setData({
      qrSize: size,
      qrcodeSize: size
    })
    
    // 如果已有二维码，重新生成
    if (this.data.showQrcode) {
      setTimeout(() => {
        this.createQRCode(this.data.text)
      }, 100)
    }
  },

  // 容错级别变化
  onErrorLevelChange(e) {
    this.setData({
      errorLevelIndex: e.detail.value
    })
    
    // 如果已有二维码，重新生成
    if (this.data.showQrcode) {
      setTimeout(() => {
        this.createQRCode(this.data.text)
      }, 100)
    }
  },

  // 应用模板
  applyTemplate(e) {
    const template = e.currentTarget.dataset.template
    const canGenerate = template.trim().length > 0
    this.setData({
      text: template,
      canGenerate: canGenerate
    })
  },

  onTextInput(e) {
    const value = e.detail.value
    const canGenerate = value.trim().length > 0
    this.setData({
      text: value,
      canGenerate: canGenerate
    })
    // 添加日志记录
    console.log('文本输入变化:', {
      value: value,
      trimmedLength: value.trim().length,
      canGenerate: canGenerate,
      buttonClass: canGenerate ? 'ready' : '',
      disabled: !canGenerate
    })
  },

  // 从剪贴板粘贴
  pasteFromClipboard() {
    if (isHarmonyOS) {
      // 鸿蒙平台暂不支持剪贴板操作
      platform.showToast({
        title: '剪贴板功能暂不支持'
      });
    } else {
      wx.getClipboardData({
        success: (res) => {
          if (res.data) {
            const canGenerate = res.data.trim().length > 0
            this.setData({
              text: res.data,
              canGenerate: canGenerate
            })
            platform.showToast({
              title: '已粘贴',
              icon: 'success'
            })
          } else {
            platform.showToast({
              title: '剪贴板为空',
              icon: 'none'
            })
          }
        },
        fail: () => {
          platform.showToast({
            title: '粘贴失败',
            icon: 'none'
          })
        }
      })
    }
  },



  generate() {
    const text = this.data.text.trim()
    if (!text) {
      platform.showToast({
        title: '请输入要生成的内容',
        icon: 'none'
      })
      return
    }

    this.setData({ 
      generating: true,
      showQrcode: true,
      qrcodeText: text
    })

    // 延迟生成二维码，确保DOM渲染完成
    setTimeout(() => {
      this.createQRCode(text)
      this.setData({ generating: false })
      
      platform.showToast({
        title: '生成成功',
        icon: 'success'
      })
    }, 300)
  },

  createQRCode(text) {
    if (isHarmonyOS) {
      // 在鸿蒙平台，通过组件引用获取Canvas
      const canvas = this.$element('qrcodeCanvas');
      if (canvas) {
        this.createQRCodeHarmony(canvas, text);
      } else {
        console.error('获取Canvas元素失败');
        platform.showToast({
          title: 'Canvas未找到'
        });
      }
    } else {
      // 在微信小程序平台
      wx.createSelectorQuery()
        .select('#qrcodeCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            platform.showToast({
              title: 'Canvas未找到',
              icon: 'none'
            })
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          // 清空画布
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // 设置画布大小
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = this.data.qrSize * dpr
          canvas.height = this.data.qrSize * dpr
          ctx.scale(dpr, dpr)

          // 错误级别映射
          const errorLevelMap = ['L', 'M', 'Q', 'H']
          const errorLevel = errorLevelMap[this.data.errorLevelIndex] || 'M'
          // 错误级别数字值映射
          const correctLevelMap = { 'L': 1, 'M': 2, 'Q': 3, 'H': 4 }
          const correctLevel = correctLevelMap[errorLevel] || 2

          // 使用微信小程序兼容的生成二维码库
          QRCode({
            canvas: canvas,
            text: text,
            width: this.data.qrSize,
            height: this.data.qrSize,
            padding: 20,
            background: '#ffffff',
            foreground: '#000000',
            correctLevel: correctLevel
          }).then(() => {
            console.log('生成二维码成功')
            
            // 如果有中心图片，绘制中心图片
            if (this.data.hasImage && this.data.centerImage) {
              this.drawCenterImage(ctx, canvas)
            }
            
            // 延迟执行，确保canvas元素重新渲染和定位
            setTimeout(() => {
              this.setData({
                qrSize: this.data.qrSize
              })
            }, 100)
          }).catch(err => {
            console.error('生成二维码失败:', err)
            platform.showToast({
              title: '生成失败',
              icon: 'none'
            })
          })
        })
    }
  },

  // 绘制中心图片
  drawCenterImage(ctx, canvas) {
    const imageSize = this.data.imageSize
    const qrSize = this.data.qrSize
    const padding = 20
    // 二维码实际绘制区域的中心点（考虑padding）
    const qrContentSize = qrSize - 2 * padding
    const qrCenterX = padding + qrContentSize / 2
    const qrCenterY = padding + qrContentSize / 2
    const radius = imageSize / 2
    
    // 获取设备像素比
    const dpr = wx.getSystemInfoSync().pixelRatio
    console.log('设备像素比:', dpr)
    
    // 使用兼容的图片创建方式
    let image = null
    if (isHarmonyOS) {
      try {
        image = new Image()
      } catch (e) {
        console.error('鸿蒙OS 图片创建失败:', e)
      }
    } else if (typeof wx !== 'undefined' && typeof wx.createImage === 'function') {
      try {
        image = wx.createImage()
      } catch (e) {
        console.error('微信图片创建失败:', e)
      }
    }
    
    // 尝试使用 canvas.createImage() (微信小程序 Canvas 2D 环境)
    if (!image && typeof canvas.createImage === 'function') {
      try {
        image = canvas.createImage()
      } catch (e) {
        console.error('画布图片创建失败:', e)
      }
    }
    
    // 如果上述方法都失败，尝试使用 window.Image
    if (!image && typeof window !== 'undefined' && typeof window.Image === 'function') {
      try {
        image = new window.Image()
      } catch (e) {
        console.error('window.Image 失败:', e)
      }
    }
    
    if (!image) {
      console.error('图片创建失败，环境不支持')
      // 绘制边框
      ctx.beginPath()
      ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      return
    }
    
    // 设置跨域图片支持（如果需要）
    image.crossOrigin = 'anonymous'
    
    image.onload = () => {
      try {
        // 重新获取上下文，确保状态正确
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('无法获取画布上下文')
          return
        }
        
        // 重置变换矩阵，确保没有缩放或平移
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        
        // 计算图片缩放比例以保持比例
        const scale = imageSize / Math.min(image.width, image.height)
        const drawWidth = image.width * scale
        const drawHeight = image.height * scale
        
        // 计算逻辑坐标的最终绘制位置
        const finalDrawX = qrCenterX - drawWidth / 2
        const finalDrawY = qrCenterY - drawHeight / 2
        
        // 考虑设备像素比，将逻辑坐标转换为物理坐标
        const physicalQrCenterX = qrCenterX * dpr
        const physicalQrCenterY = qrCenterY * dpr
        const physicalDrawWidth = drawWidth * dpr
        const physicalDrawHeight = drawHeight * dpr
        const physicalFinalDrawX = physicalQrCenterX - physicalDrawWidth / 2
        const physicalFinalDrawY = physicalQrCenterY - physicalDrawHeight / 2
        const physicalRadius = radius * dpr
        
        // 添加详细调试日志
        console.log('中心图片绘制详细信息:', {
          '图片原始宽度': image.width,
          '图片原始高度': image.height,
          '缩放比例 scale': scale.toFixed(4),
          '逻辑坐标 - 二维码中心X': qrCenterX.toFixed(2),
          '逻辑坐标 - 二维码中心Y': qrCenterY.toFixed(2),
          '物理坐标 - 二维码中心X': physicalQrCenterX.toFixed(2),
          '物理坐标 - 二维码中心Y': physicalQrCenterY.toFixed(2),
          '逻辑坐标 - 绘制宽度': drawWidth.toFixed(2),
          '逻辑坐标 - 绘制高度': drawHeight.toFixed(2),
          '物理坐标 - 绘制宽度': physicalDrawWidth.toFixed(2),
          '物理坐标 - 绘制高度': physicalDrawHeight.toFixed(2),
          '逻辑坐标 - 最终绘制X': finalDrawX.toFixed(2),
          '逻辑坐标 - 最终绘制Y': finalDrawY.toFixed(2),
          '物理坐标 - 最终绘制X': physicalFinalDrawX.toFixed(2),
          '物理坐标 - 最终绘制Y': physicalFinalDrawY.toFixed(2),
          '图片大小': imageSize,
          '二维码大小': qrSize,
          '边距': padding,
          '二维码内容大小': qrContentSize,
          '画布宽度': canvas.width,
          '画布高度': canvas.height,
          '设备像素比': dpr,
          '预期物理中心点X': (canvas.width / 2).toFixed(2),
          '预期物理中心点Y': (canvas.height / 2).toFixed(2)
        })
        
        // 保存当前状态
        ctx.save()
        
        // 创建圆形裁剪区域（使用物理坐标）
        ctx.beginPath()
        ctx.arc(physicalQrCenterX, physicalQrCenterY, physicalRadius, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.clip()
        
        // 绘制图片（使用物理坐标）
        ctx.drawImage(image, physicalFinalDrawX, physicalFinalDrawY, physicalDrawWidth, physicalDrawHeight)
        
        // 恢复状态
        ctx.restore()
        
        // 绘制圆形边框（使用物理坐标）
        ctx.beginPath()
        ctx.arc(physicalQrCenterX, physicalQrCenterY, physicalRadius, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 * dpr // 线宽也需要考虑DPR
        ctx.stroke()
        
      } catch (error) {
        console.error('绘制图片失败:', error)
        // 如果绘制失败，绘制边框
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.beginPath()
          ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    }
    
    image.onerror = (err) => {
      console.error('加载图片失败:', err)
      // 如果加载失败，绘制边框
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    
    // 设置图片源
    image.src = this.data.centerImage
  },

  // 鸿蒙平台生成二维码
  createQRCodeHarmony(canvas, text) {
    try {
      const ctx = canvas.getContext('2d');

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置画布大小
      const dpr = 2; // 鸿蒙平台使用固定DPI
      canvas.width = this.data.qrSize * dpr;
      canvas.height = this.data.qrSize * dpr;
      ctx.scale(dpr, dpr);

      // 错误级别映射
      const errorLevelMap = ['L', 'M', 'Q', 'H'];
      const errorLevel = errorLevelMap[this.data.errorLevelIndex] || 'M';
      // 错误级别数字值映射
      const correctLevelMap = { 'L': 1, 'M': 2, 'Q': 3, 'H': 4 };
      const correctLevel = correctLevelMap[errorLevel] || 2;

      // 使用微信小程序兼容的生成二维码库
      QRCode({
        canvas: canvas,
        text: text,
        width: this.data.qrSize,
        height: this.data.qrSize,
        padding: 20,
        background: '#ffffff',
        foreground: '#000000',
        correctLevel: correctLevel
      }).then(() => {
        console.log('生成二维码成功');
        
        // 如果有中心图片，绘制中心图片
        if (this.data.hasImage && this.data.centerImage) {
          this.drawCenterImageHarmony(ctx, canvas)
        }
        
        // 延迟执行，确保canvas元素重新渲染和定位
        setTimeout(() => {
          this.setData({
            qrSize: this.data.qrSize
          });
        }, 100);
      }).catch(err => {
        console.error('生成二维码失败:', err);
        platform.showToast({
          title: '生成失败'
        });
      });
    } catch (error) {
      console.error('生成二维码失败:', error);
      platform.showToast({
        title: '生成失败'
      });
    }
  },

  // 获取显示文本（截断长文本）
  getDisplayText() {
    const text = this.data.text
    if (text.length <= 50) return text
    return text.substring(0, 47) + '...'
  },

  // 保存图片
  saveImage() {
    if (isHarmonyOS) {
      // 在鸿蒙平台，通过组件引用获取Canvas
      const canvas = this.$element('qrcodeCanvas');
      if (canvas) {
        this.saveImageHarmony(canvas);
      } else {
        console.error('获取Canvas元素失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
      }
    } else {
      // 在微信小程序平台
      wx.createSelectorQuery()
        .select('#qrcodeCanvas')
        .fields({ node: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            platform.showToast({ title: 'Canvas未找到', icon: 'none' })
            return
          }
          const canvas = res[0].node
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              platform.saveImageToAlbum(res.tempFilePath, 
                () => {
                  platform.showToast({
                    title: '保存成功',
                    icon: 'success'
                  })
                },
                (err) => {
                  if (err.errMsg && err.errMsg.includes('auth deny')) {
                    wx.showModal({
                      title: '需要授权',
                      content: '需要相册权限才能保存图片，请在设置中开启',
                      showCancel: false
                    })
                  } else {
                    platform.showToast({
                      title: '保存失败',
                      icon: 'none'
                    })
                  }
                  console.error('保存图片失败:', err)
                }
              )
            },
            fail: (err) => {
              platform.showToast({
                title: '生成图片失败',
                icon: 'none'
              })
              console.error('canvasToTempFilePath 失败:', err)
            }
          })
        })
    }
  },

  // 绘制中心图片（鸿蒙平台）
  drawCenterImageHarmony(ctx, canvas) {
    const imageSize = this.data.imageSize
    const qrSize = this.data.qrSize
    const padding = 20
    // 二维码实际绘制区域的中心点（考虑padding）
    const qrContentSize = qrSize - 2 * padding
    const qrCenterX = padding + qrContentSize / 2
    const qrCenterY = padding + qrContentSize / 2
    const radius = imageSize / 2
    
    // 使用兼容的图片创建方式
    let image = null
    if (isHarmonyOS) {
      try {
        image = new Image()
      } catch (e) {
        console.error('鸿蒙OS 图片创建失败:', e)
      }
    } else if (typeof wx !== 'undefined' && typeof wx.createImage === 'function') {
      try {
        image = wx.createImage()
      } catch (e) {
        console.error('微信图片创建失败:', e)
      }
    }
    
    // 尝试使用 canvas.createImage() (微信小程序 Canvas 2D 环境)
    if (!image && typeof canvas.createImage === 'function') {
      try {
        image = canvas.createImage()
      } catch (e) {
        console.error('画布图片创建失败:', e)
      }
    }
    
    // 如果上述方法都失败，尝试使用 window.Image
    if (!image && typeof window !== 'undefined' && typeof window.Image === 'function') {
      try {
        image = new window.Image()
      } catch (e) {
        console.error('window.Image 失败:', e)
      }
    }
    
    if (!image) {
      console.error('图片创建失败，环境不支持')
      // 绘制边框
      ctx.beginPath()
      ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      return
    }
    
    // 设置跨域图片支持（如果需要）
    image.crossOrigin = 'anonymous'
    
    image.onload = () => {
      try {
        // 重新获取上下文，确保状态正确
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('无法获取画布上下文')
          return
        }
        
        // 重置变换矩阵，确保没有缩放或平移
        try {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          console.log('重置变换矩阵后')
        } catch (e) {
          console.log('重置变换矩阵失败:', e)
        }
        
        // 获取设备像素比
        const dpr = isHarmonyOS ? 2 : (wx.getSystemInfoSync().pixelRatio || 1)
        console.log('鸿蒙平台设备像素比:', dpr)
        
        // 计算图片缩放比例以保持比例
        const scale = imageSize / Math.min(image.width, image.height)
        const drawWidth = image.width * scale
        const drawHeight = image.height * scale
        
        // 计算逻辑坐标的最终绘制位置
        const finalDrawX = qrCenterX - drawWidth / 2
        const finalDrawY = qrCenterY - drawHeight / 2
        
        // 考虑设备像素比，将逻辑坐标转换为物理坐标
        const physicalQrCenterX = qrCenterX * dpr
        const physicalQrCenterY = qrCenterY * dpr
        const physicalDrawWidth = drawWidth * dpr
        const physicalDrawHeight = drawHeight * dpr
        const physicalFinalDrawX = physicalQrCenterX - physicalDrawWidth / 2
        const physicalFinalDrawY = physicalQrCenterY - physicalDrawHeight / 2
        const physicalRadius = radius * dpr
        
        // 添加详细调试日志
        console.log('鸿蒙平台中心图片绘制详细信息:', {
          '图片原始宽度': image.width,
          '图片原始高度': image.height,
          '缩放比例 scale': scale.toFixed(4),
          '逻辑坐标 - 二维码中心X': qrCenterX.toFixed(2),
          '逻辑坐标 - 二维码中心Y': qrCenterY.toFixed(2),
          '物理坐标 - 二维码中心X': physicalQrCenterX.toFixed(2),
          '物理坐标 - 二维码中心Y': physicalQrCenterY.toFixed(2),
          '逻辑坐标 - 绘制宽度': drawWidth.toFixed(2),
          '逻辑坐标 - 绘制高度': drawHeight.toFixed(2),
          '物理坐标 - 绘制宽度': physicalDrawWidth.toFixed(2),
          '物理坐标 - 绘制高度': physicalDrawHeight.toFixed(2),
          '逻辑坐标 - 最终绘制X': finalDrawX.toFixed(2),
          '逻辑坐标 - 最终绘制Y': finalDrawY.toFixed(2),
          '物理坐标 - 最终绘制X': physicalFinalDrawX.toFixed(2),
          '物理坐标 - 最终绘制Y': physicalFinalDrawY.toFixed(2),
          '图片大小': imageSize,
          '二维码大小': qrSize,
          '边距': padding,
          '二维码内容大小': qrContentSize,
          '画布宽度': canvas.width,
          '画布高度': canvas.height,
          '设备像素比': dpr,
          '预期物理中心点X': (canvas.width / 2).toFixed(2),
          '预期物理中心点Y': (canvas.height / 2).toFixed(2)
        })
        
        // 保存当前状态
        ctx.save()
        
        // 创建圆形裁剪区域（使用物理坐标）
        ctx.beginPath()
        ctx.arc(physicalQrCenterX, physicalQrCenterY, physicalRadius, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.clip()
        
        // 绘制图片（使用物理坐标）
        ctx.drawImage(image, physicalFinalDrawX, physicalFinalDrawY, physicalDrawWidth, physicalDrawHeight)
        
        // 恢复状态
        ctx.restore()
        
        // 绘制圆形边框（使用物理坐标）
        ctx.beginPath()
        ctx.arc(physicalQrCenterX, physicalQrCenterY, physicalRadius, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 * dpr // 线宽也需要考虑DPR
        ctx.stroke()
        
      } catch (error) {
        console.error('绘制图片失败:', error)
        // 如果绘制失败，绘制边框
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.beginPath()
          ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    }
    
    image.onerror = (err) => {
      console.error('加载图片失败:', err)
      // 如果加载失败，绘制边框
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.arc(qrCenterX, qrCenterY, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    
    // 设置图片源
    image.src = this.data.centerImage
  },

  // 鸿蒙平台保存图片
  saveImageHarmony(canvas) {
    try {
      console.log('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
      
      // 在鸿蒙平台，使用canvas.toDataURL()获取图片数据，指定PNG格式
      const imageData = canvas.toDataURL('image/png');
      console.log('生成的图片数据长度:', imageData ? imageData.length : 0, '前100字符:', imageData ? imageData.substring(0, 100) : 'null');
      
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
          if (code === 201 || (data && data.code === 201)) {
            // 权限被拒绝
            if (isHarmonyOS) {
              // 鸿蒙平台权限提示
              platform.showToast({
                title: '需要相册权限，请到设置中开启'
              });
            }
          } else {
            platform.showToast({
              title: '保存失败，请重试'
            });
          }
        }
      );
    } catch (error) {
      console.error('保存图片失败:', error);
      platform.showToast({
        title: '保存失败: ' + (error.message || '未知错误')
      });
    }
  },

  // 分享二维码
  shareQRCode() {
    if (isHarmonyOS) {
      // 鸿蒙平台暂不支持分享操作
      platform.showToast({
        title: '分享功能暂不支持'
      });
    } else {
      wx.showActionSheet({
        itemList: ['生成分享图', '复制链接', '取消'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.generateShareImage()
          } else if (res.tapIndex === 1) {
            this.copyContent()
          }
        }
      })
    }
  },

  // 生成分享图（简化版）
  generateShareImage() {
    platform.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  // 复制内容
  copyContent() {
    if (isHarmonyOS) {
      // 鸿蒙平台暂不支持剪贴板操作
      platform.showToast({
        title: '复制功能暂不支持'
      });
    } else {
      wx.setClipboardData({
        data: this.data.qrcodeText,
        success: () => {
          platform.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        },
        fail: () => {
          platform.showToast({
            title: '复制失败',
            icon: 'none'
          })
        }
      })
    }
  },

  // 移除中心图片
  removeImage() {
    this.setData({
      centerImage: null,
      imageTempFilePath: '',
      hasImage: false,
      imageSize: 60
    })
    platform.showToast({
      title: '图片已移除',
      icon: 'success'
    })
  },

  // 清空
  clear() {
    this.setData({
      text: '',
      qrcodeText: '',
      showQrcode: false,
      canGenerate: false,
      centerImage: null,
      imageTempFilePath: '',
      hasImage: false,
      imageSize: 60
    })
    this.setDefaultContent()
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '生成二维码器 - 轻松创建个性化二维码',
      path: '/packages/utility/pages/qrcode/qrcode'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '生成二维码器 - 功能强大的二维码制作工具',
      query: 'qrcode'
    }
  }
};

// 平台兼容导出
if (!isHarmonyOS) {
  // 在微信小程序平台
  Page(PageDefinition);
}

// 在鸿蒙平台，默认导出必须在顶层
export default PageDefinition;