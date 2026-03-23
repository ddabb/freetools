// 字符头像生成器页面逻辑
Page({
  data: {
    inputText: '',
    selectedTemplate: 'template1',
    selectedTextEffect: 'normal',
    canExport: false,
    isLoading: false,
    previewText: '预览',
    previewStyle: '',
    templateExpanded: true, // 模板展开状态（默认展开）
    textEffectExpanded: true, // 文字效果展开状态（默认展开）
    
    // 画布尺寸配置
    canvasWidth: 200,
    canvasHeight: 200,

    // 模板对应的阴影效果（仅用于 CSS 预览，Canvas 不支持）
    templateShadows: {
      template1: '0 8px 25px rgba(52, 152, 219, 0.35)',
      template2: '0 8px 25px rgba(46, 204, 113, 0.3)',
      template3: '0 8px 25px rgba(255, 154, 158, 0.4)',
      template4: '0 15px 35px rgba(231, 76, 60, 0.4)',
      template5: '0 15px 35px rgba(255, 165, 0, 0.45)',
      template6: '0 8px 25px rgba(0, 131, 176, 0.35)',
      template7: '0 8px 25px rgba(255, 107, 157, 0.4)',
      template8: '0 8px 25px rgba(72, 85, 99, 0.4)',
      template9: '0 8px 25px rgba(0, 0, 0, 0.12)'
    },
    
    // 模板配置（放在data中确保可访问）
    // box-shadow 只在预览 CSS 中渲染，Canvas 导出不支持，从模板数据中移除
    templates: {
      template1: {
        name: '简约圆形',
        style: {
          'background': 'linear-gradient(135deg, #3498db, #8e44ad)',
          'border-radius': '50%',
          'border': 'none'
        }
      },
      template2: {
        name: '方形边框',
        style: {
          'background': 'linear-gradient(135deg, #2ecc71, #1abc9c)',
          'border-radius': '25px',
          'border': '8px solid #2c3e50'
        }
      },
      template3: {
        name: '渐变背景',
        style: {
          'background': 'linear-gradient(135deg, #ff9a9e, #fad0c4, #fad0c4)',
          'border-radius': '50%',
          'border': 'none'
        }
      },
      template4: {
        name: '阴影效果',
        style: {
          'background': 'linear-gradient(135deg, #e74c3c, #c0392b)',
          'border-radius': '50%',
          'border': 'none'
        }
      },
      template5: {
        name: '金色质感',
        style: {
          'background': 'linear-gradient(135deg, #FFD700, #FFA500)',
          'border-radius': '50%',
          'border': 'none'
        }
      },
      template6: {
        name: '科技蓝',
        style: {
          'background': 'linear-gradient(135deg, #00b4db, #0083b0)',
          'border-radius': '20px',
          'border': 'none'
        }
      },
      template7: {
        name: '粉色浪漫',
        style: {
          'background': 'linear-gradient(135deg, #ff6b9d, #ff8e53)',
          'border-radius': '50%',
          'border': 'none'
        }
      },
      template8: {
        name: '商务深灰',
        style: {
          'background': 'linear-gradient(135deg, #485563, #29323c)',
          'border-radius': '8px',
          'border': '3px solid #1a1a1a'
        }
      },
      template9: {
        name: '纯色背景',
        style: {
          'background': '#ffffff',
          'border-radius': '50%',
          'border': 'none'
        }
      }
    },
    
    // 文字效果配置（与Canvas导出保持一致）
    // 统一使用 Canvas 能完美实现的效果
    textEffects: {
      normal: {
        name: '普通',
        color: '#ffffff',
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      },
      shadow: {
        name: '阴影',
        color: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 8,
        shadowOffsetX: 3,
        shadowOffsetY: 3
      },
      stroke: {
        name: '描边',
        color: '#ffffff',
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        strokeColor: '#2c3e50',
        strokeWidth: 3
      },
      glow: {
        name: '发光',
        color: '#00ff9d',
        shadowColor: '#00ff9d',
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      },
      '3d': {
        name: '立体',
        color: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 4,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        depthLayers: 2
      },
      gradient: {
        name: '渐变',
        color: 'gradient',
        gradientColors: ['#ffffff', '#f39c12'],
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0
      }
    },
    
    // 字体样式配置
    fontStyles: {
      // 无衬线字体
      sans: {
        name: '黑体',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        fontStyle: 'normal'
      },
      // 衬线字体
      serif: {
        name: '宋体',
        fontFamily: 'Noto Sans SC, serif',
        fontWeight: 'bold',
        fontStyle: 'normal'
      },
      // 等宽字体
      mono: {
        name: '等宽',
        fontFamily: 'Fira Code, JetBrains Mono, monospace',
        fontWeight: 'bold',
        fontStyle: 'normal'
      },
      // 细体无衬线
      sansLight: {
        name: '细体',
        fontFamily: 'Noto Sans SC, sans-serif',
        fontWeight: '300',
        fontStyle: 'normal'
      },
      // 中等无衬线
      sansMedium: {
        name: '中体',
        fontFamily: 'Inter, Roboto, sans-serif',
        fontWeight: '500',
        fontStyle: 'normal'
      },
      // 粗体无衬线
      sansBold: {
        name: '特粗',
        fontFamily: 'Inter, Roboto, sans-serif',
        fontWeight: '900',
        fontStyle: 'normal'
      },
      // 斜体
      sansItalic: {
        name: '斜体',
        fontFamily: 'Inter, Roboto, sans-serif',
        fontWeight: 'bold',
        fontStyle: 'italic'
      },
      // 细宋体
      serifLight: {
        name: '细宋',
        fontFamily: 'Noto Sans SC, serif',
        fontWeight: '300',
        fontStyle: 'normal'
      },
      // 意大利体
      cursive: {
        name: '手写体',
        fontFamily: 'Pacifico, Dancing Script, cursive',
        fontWeight: 'normal',
        fontStyle: 'normal'
      },
      // 装饰体
      fantasy: {
        name: '艺术体',
        fontFamily: 'Bangers, Comic Neue, fantasy',
        fontWeight: 'bold',
        fontStyle: 'normal'
      },
      // 系统默认加粗
      systemBold: {
        name: '系统粗体',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        fontWeight: '800',
        fontStyle: 'normal'
      },
      // 圆润体
      rounded: {
        name: '圆润体',
        fontFamily: 'Montserrat, Open Sans, sans-serif',
        fontWeight: 'bold',
        fontStyle: 'normal'
      }
    },
    selectedFontStyle: 'sans', // 默认选中黑体
    fontStyleExpanded: true // 字体样式展开状态
  },



  // 检查输入是否有效（1-4个字符，支持任何字符）
  isValidInput(input) {
    if (!input || input.trim() === '') {
      return { valid: false, message: '请输入内容' };
    }
    
    // 将输入转换为数组
    const chars = Array.from(input.trim());
    const charCount = chars.length;
    
    // 检查字符数量是否在1-4个之间
    if (charCount < 1) {
      return { 
        valid: false, 
        message: '请输入至少1个字符'
      };
    }
    
    if (charCount > 4) {
      return { 
        valid: false, 
        message: '最多只能输入4个字符'
      };
    }
    
    return { valid: true, message: '' };
  },

  // 构建预览样式（核心样式生成逻辑，供预览和导出共用）
  buildPreviewStyle() {
    const inputValue = this.data.inputText.trim();
    const validation = this.isValidInput(inputValue);

    const template = this.data.templates[this.data.selectedTemplate];
    const textEffect = this.data.textEffects[this.data.selectedTextEffect];
    const fontStyle = this.data.fontStyles[this.data.selectedFontStyle];

    let previewStyle = '';

    // 第一步：应用模板样式（背景、边框、圆角）
    Object.keys(template.style).forEach(key => {
      previewStyle += `${key}: ${template.style[key]}; `;
    });

    // 添加阴影（仅预览，Canvas 不支持）
    const shadow = this.data.templateShadows[this.data.selectedTemplate];
    if (shadow) {
      previewStyle += `box-shadow: ${shadow}; `;
    }

    // 第二步：字体大小（根据字符数量）
    const charCount = Array.from(inputValue).length;
    if (charCount === 1) {
      previewStyle += 'font-size: 4.5rem; ';
    } else if (charCount === 2) {
      previewStyle += 'font-size: 4rem; ';
    } else if (charCount === 3) {
      previewStyle += 'font-size: 3.5rem; ';
    } else if (charCount === 4) {
      previewStyle += 'font-size: 3rem; ';
    } else {
      previewStyle += 'font-size: 3.5rem; ';
    }

    // 第三步：字体样式
    previewStyle += `font-family: ${fontStyle.fontFamily}; font-weight: ${fontStyle.fontWeight}; font-style: ${fontStyle.fontStyle}; `;

    // 第四步：文字效果（颜色 + text-shadow，与 Canvas 效果完全一致）
    const isLightBackground = ['template3', 'template7', 'template9'].includes(this.data.selectedTemplate);
    const effect = this.data.selectedTextEffect;

    // 确定文字颜色
    let textColor = textEffect.color;
    if (isLightBackground && textColor === '#ffffff') {
      textColor = '#2c3e50'; // 浅色背景用深色文字
    }
    previewStyle += `color: ${textColor}; `;

    // 确定 text-shadow
    if (effect === 'shadow') {
      if (isLightBackground) {
        previewStyle += `text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.3); `;
      } else {
        previewStyle += `text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.5); `;
      }
    } else if (effect === 'stroke') {
      // 描边用阴影模拟
      if (isLightBackground) {
        previewStyle += `text-shadow: 1px 1px 0 #2c3e50, -1px -1px 0 #2c3e50, 1px -1px 0 #2c3e50, -1px 1px 0 #2c3e50, 0 1px 0 #2c3e50, 0 -1px 0 #2c3e50; color: #ffffff; `;
      } else {
        previewStyle += `text-shadow: 1px 1px 0 #2c3e50, -1px -1px 0 #2c3e50, 1px -1px 0 #2c3e50, -1px 1px 0 #2c3e50, 0 1px 0 #2c3e50, 0 -1px 0 #2c3e50; `;
      }
    } else if (effect === 'glow') {
      previewStyle += `text-shadow: 0 0 10px #00ff9d, 0 0 20px #00ff9d, 0 0 30px #00ff9d; `;
    } else if (effect === '3d') {
      previewStyle += `text-shadow: 2px 2px 0 #2c3e50, 4px 4px 0 rgba(0, 0, 0, 0.25); `;
    } else if (effect === 'gradient') {
      if (isLightBackground) {
        previewStyle += `background: linear-gradient(135deg, #3498db 0%, #8e44ad 100%); `;
        previewStyle += `-webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none; `;
      } else {
        previewStyle += `background: linear-gradient(135deg, #ffffff 0%, #f39c12 100%); `;
        previewStyle += `-webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: none; `;
      }
    } else {
      // normal
      previewStyle += `text-shadow: none; `;
    }

    return {
      style: previewStyle,
      valid: validation.valid,
      inputValue: inputValue
    };
  },

  // 更新预览
  updatePreview() {
    const result = this.buildPreviewStyle();
    
    this.setData({
      previewText: result.valid ? result.inputValue : '预览',
      canExport: true,
      previewStyle: result.style
    });
  },

  // 输入文字变化
  onTextInput(e) {
    this.setData({
      inputText: e.detail.value
    });
    this.updatePreview();
  },

  // 模板选择（通过直接点击）
  onTemplateSelect(e) {
    const template = e.currentTarget.dataset.value;
    console.log('选择模板:', template);
    console.log('当前选中的模板数据:', this.data.templates[template]);
    console.log('当前选中的文字效果:', this.data.selectedTextEffect);
    
    this.setData({
      selectedTemplate: template
    });
    
    console.log('设置后的选中模板:', this.data.selectedTemplate);
    this.updatePreview();
  },

  // 文字效果选择（通过直接点击）
  onTextEffectSelect(e) {
    const effect = e.currentTarget.dataset.value;
    console.log('选择文字效果:', effect);
    this.setData({
      selectedTextEffect: effect
    });
    this.updatePreview();
  },

  // 字体样式选择
  onFontStyleSelect(e) {
    const fontStyle = e.currentTarget.dataset.value;
    console.log('选择字体样式:', fontStyle);
    this.setData({
      selectedFontStyle: fontStyle
    });
    this.updatePreview();
  },

  // 切换字体样式展开状态
  toggleFontStyleExpanded() {
    this.setData({
      fontStyleExpanded: !this.data.fontStyleExpanded
    });
  },

  // 重置表单
  resetForm() {
    this.setData({
      inputText: '',
      selectedTemplate: 'template1',
      selectedTextEffect: 'normal'
    });
    this.updatePreview();
  },

  // 切换模板展开状态
  toggleTemplateExpanded() {
    this.setData({
      templateExpanded: !this.data.templateExpanded
    });
  },

  // 切换文字效果展开状态
  toggleTextEffectExpanded() {
    this.setData({
      textEffectExpanded: !this.data.textEffectExpanded
    });
  },



  // 页面加载
  onLoad() {
    this.updatePreview();
    
    // 提前初始化Canvas，确保Canvas节点可用
    setTimeout(() => {
      this.initCanvas();
    }, 500);
  },
  
  // 初始化Canvas
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#avatarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0] && res[0].node) {
          console.log('Canvas初始化成功');
        } else {
          console.warn('Canvas初始化失败，可能WXML还未渲染完成');
        }
      });
  },

  // 生成头像PNG图片（与预览样式完全一致）
  generateAvatarPNG() {
    const that = this;

    try {
      const inputText = this.data.inputText.trim() || '预览';
      const effect = this.data.selectedTextEffect;
      const templateId = this.data.selectedTemplate;
      const isLightBackground = ['template3', 'template7', 'template9'].includes(templateId);

      // 获取字体样式配置
      const fontStyleConfig = this.data.fontStyles[this.data.selectedFontStyle] || this.data.fontStyles.sans;

      // 字体大小：预览 160px，rem=16px。Canvas 200px → 按比例换算
      // 1char: 4.5rem=72px preview → 90px canvas
      // 2char: 4rem=64px preview → 80px canvas
      // 3char: 3.5rem=56px preview → 70px canvas
      // 4char: 3rem=48px preview → 60px canvas
      const charCount = Array.from(inputText).length;
      let fontSize;
      if (charCount === 1) fontSize = 90;
      else if (charCount === 2) fontSize = 80;
      else if (charCount === 3) fontSize = 68;
      else if (charCount === 4) fontSize = 58;
      else fontSize = 68;

      // 文字颜色
      let textColor = '#ffffff';
      if (effect === 'glow') {
        textColor = '#00ff9d';
      } else if (isLightBackground) {
        if (effect === 'stroke') {
          textColor = '#ffffff'; // 描边效果始终白字
        } else {
          textColor = '#2c3e50'; // 浅色背景默认深色字
        }
      }

      // 阴影参数
      let shadowColor = 'transparent';
      let shadowBlur = 0;
      let shadowOffsetX = 0;
      let shadowOffsetY = 0;

      if (effect === 'shadow') {
        shadowColor = isLightBackground ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)';
        shadowBlur = 8;
        shadowOffsetX = 3;
        shadowOffsetY = 3;
      } else if (effect === 'glow') {
        shadowColor = '#00ff9d';
        shadowBlur = 20;
        shadowOffsetX = 0;
        shadowOffsetY = 0;
      }

      const query = wx.createSelectorQuery();
      query.select('#avatarCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            wx.showToast({ title: 'Canvas初始化失败', icon: 'none' });
            that.setData({ isLoading: false });
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          const canvasWidth = that.data.canvasWidth;
          const canvasHeight = that.data.canvasHeight;

          // 设置 Canvas 实际尺寸
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);

          // 清空画布
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);

          // --- 绘制背景 ---
          this._drawBackground(ctx, canvasWidth, canvasHeight);

          // --- 绘制文字 ---
          ctx.font = `${fontStyleConfig.fontWeight} ${fontSize}px ${fontStyleConfig.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 描边效果：先画描边，再画主文字
          if (effect === 'stroke') {
            const strokeColor = isLightBackground ? '#2c3e50' : '#2c3e50';
            const strokeOffsets = [
              [1, 1], [-1, -1], [1, -1], [-1, 1],
              [0, 1], [0, -1], [1, 0], [-1, 0]
            ];
            ctx.fillStyle = strokeColor;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            strokeOffsets.forEach(([ox, oy]) => {
              ctx.fillText(inputText, canvasWidth / 2 + ox, canvasHeight / 2 + oy);
            });
          }

          // 立体效果：多层阴影模拟
          if (effect === '3d') {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.fillText(inputText, canvasWidth / 2 + 4, canvasHeight / 2 + 4);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillText(inputText, canvasWidth / 2 + 2, canvasHeight / 2 + 2);
          }

          // 设置文字样式（渐变 or 纯色）
          if (effect === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
            if (isLightBackground) {
              gradient.addColorStop(0, '#3498db');
              gradient.addColorStop(1, '#8e44ad');
            } else {
              gradient.addColorStop(0, '#ffffff');
              gradient.addColorStop(1, '#f39c12');
            }
            ctx.fillStyle = gradient;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = textColor;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;
          }

          // 绘制主文字
          ctx.fillText(inputText, canvasWidth / 2, canvasHeight / 2);

          // --- 导出图片 ---
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0, y: 0,
            width: canvasWidth, height: canvasHeight,
            destWidth: canvasWidth * 2,
            destHeight: canvasHeight * 2,
            quality: 1,
            fileType: 'png',
            success: (res) => {
              that.saveImageToAlbum(res.tempFilePath);
            },
            fail: (err) => {
              wx.showToast({ title: '生成图片失败，请重试', icon: 'none' });
              that.setData({ isLoading: false });
            }
          });
        });
    } catch (error) {
      wx.showToast({ title: '生成图片失败，请重试', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  // 绘制背景（支持渐变/纯色 + 圆形/圆角/方形 + 边框）
  _drawBackground(ctx, canvasWidth, canvasHeight) {
    const template = this.data.templates[this.data.selectedTemplate];
    const style = template.style;

    // 填充颜色
    let fillStyle = '#ffffff';
    if (style.background) {
      if (style.background.startsWith('linear-gradient')) {
        const colorMatch = style.background.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
        if (colorMatch && colorMatch.length >= 2) {
          const grd = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
          grd.addColorStop(0, colorMatch[0]);
          grd.addColorStop(1, colorMatch[1]);
          fillStyle = grd;
        } else if (colorMatch) {
          fillStyle = colorMatch[0];
        }
      } else {
        fillStyle = style.background;
      }
    }
    ctx.fillStyle = fillStyle;

    // 绘制形状
    const borderRadius = style['border-radius'];
    const border = style.border;

    ctx.beginPath();

    if (borderRadius === '50%') {
      // 圆形
      const r = canvasWidth / 2;
      ctx.arc(canvasWidth / 2, canvasHeight / 2, r, 0, 2 * Math.PI);
    } else if (borderRadius && borderRadius.includes('px')) {
      // 圆角矩形
      const r = Math.min(parseInt(borderRadius), canvasWidth / 2);
      ctx.roundRect ? ctx.roundRect(0, 0, canvasWidth, canvasHeight, r) : this._roundRect(ctx, 0, 0, canvasWidth, canvasHeight, r);
    } else {
      // 方形
      ctx.rect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.fill();

    // 绘制边框
    if (border && border !== 'none') {
      const match = border.match(/(\d+)px\s+solid\s+(.+)/);
      if (match) {
        const borderWidth = Math.max(parseInt(match[1]) * 0.8, 1);
        ctx.strokeStyle = match[2];
        ctx.lineWidth = borderWidth;
        ctx.stroke();
      }
    }
  },

  // 兼容旧版 Canvas 的圆角矩形
  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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
    const inputValue = this.data.inputText.trim();
    
    this.setData({ isLoading: true });
    
    try {
      console.log('开始导出PNG图片，参数:', {
        inputText: inputValue || '预览', // 如果没有输入，使用"预览"
        template: this.data.selectedTemplate,
        textEffect: this.data.selectedTextEffect
      });
      
      // 延迟执行以确保UI更新
      setTimeout(() => {
        this.generateAvatarPNG();
      }, 100);
      
    } catch (error) {
      console.error('导出图片时出错:', error);
      wx.showToast({
        title: '导出图片失败，请重试',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    }
  }
});