// 汉字头像生成器页面逻辑
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
    
    // 模板配置（放在data中确保可访问）
    templates: {
      template1: {
        name: '简约圆形',
        style: {
          'background': 'linear-gradient(135deg, #3498db, #8e44ad)',
          'border-radius': '50%',
          'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
          'border': 'none'
        }
      },
      template2: {
        name: '方形边框',
        style: {
          'background': 'linear-gradient(135deg, #2ecc71, #1abc9c)',
          'border-radius': '25px',
          'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
          'border': '8px solid #2c3e50'
        }
      },
      template3: {
        name: '渐变背景',
        style: {
          'background': 'linear-gradient(135deg, #ff9a9e, #fad0c4, #fad0c4)',
          'border-radius': '50%',
          'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
          'border': 'none'
        }
      },
      template4: {
        name: '阴影效果',
        style: {
          'background': 'linear-gradient(135deg, #e74c3c, #c0392b)',
          'border-radius': '50%',
          'box-shadow': '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 10px 20px rgba(255, 255, 255, 0.2)',
          'border': 'none'
        }
      },
      template5: {
        name: '金色质感',
        style: {
          'background': 'linear-gradient(135deg, #FFD700, #FFA500)',
          'border-radius': '50%',
          'box-shadow': '0 15px 35px rgba(255, 165, 0, 0.4), inset 0 5px 15px rgba(255, 255, 255, 0.4)',
          'border': 'none'
        }
      },
      template6: {
        name: '科技蓝',
        style: {
          'background': 'linear-gradient(135deg, #00b4db, #0083b0)',
          'border-radius': '20px',
          'box-shadow': '0 10px 20px rgba(0, 131, 176, 0.3)',
          'border': 'none'
        }
      },
      template7: {
        name: '粉色浪漫',
        style: {
          'background': 'linear-gradient(135deg, #ff6b9d, #ff8e53)',
          'border-radius': '50%',
          'box-shadow': '0 10px 25px rgba(255, 107, 157, 0.3)',
          'border': 'none'
        }
      },
      template8: {
        name: '商务深灰',
        style: {
          'background': 'linear-gradient(135deg, #485563, #29323c)',
          'border-radius': '8px',
          'box-shadow': '0 10px 20px rgba(0, 0, 0, 0.3)',
          'border': '3px solid #1a1a1a'
        }
      },
      template9: {
        name: '纯色背景',
        style: {
          'background': '#ffffff',
          'border-radius': '50%',
          'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.1)',
          'border': 'none'
        }
      }
    },
    
    // 文字效果配置（放在data中确保可访问）
    textEffects: {
      normal: {
        name: '普通效果',
        style: {
          'color': '#ffffff',
          'text-shadow': 'none'
        }
      },
      gradient: {
        name: '渐变文字',
        style: {
          'color': '#ffffff',
          'text-shadow': 'none'
        }
      },
      shadow: {
        name: '阴影效果',
        style: {
          'color': '#ffffff',
          'text-shadow': '4px 4px 8px rgba(0, 0, 0, 0.5)'
        }
      },
      stroke: {
        name: '描边效果',
        style: {
          'color': '#ffffff',
          'text-shadow': '1px 1px 0 #2c3e50, -1px -1px 0 #2c3e50, 1px -1px 0 #2c3e50, -1px 1px 0 #2c3e50'
        }
      },
      glow: {
        name: '发光效果',
        style: {
          'color': '#ffffff',
          'text-shadow': '0 0 10px #00ff9d, 0 0 20px #00ff9d'
        }
      },
      '3d': {
        name: '立体效果',
        style: {
          'color': '#ffffff',
          'text-shadow': '2px 2px 0 #2c3e50, 4px 4px 0 rgba(0, 0, 0, 0.2)'
        }
      }
    }
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

  // 更新预览
  updatePreview() {
    const inputValue = this.data.inputText.trim();
    const validation = this.isValidInput(inputValue);
    
    const template = this.data.templates[this.data.selectedTemplate];
    const textEffect = this.data.textEffects[this.data.selectedTextEffect];
    
    console.log('当前选中的模板:', this.data.selectedTemplate, template);
    console.log('当前选中的文字效果:', this.data.selectedTextEffect, textEffect);
    
    // 构建预览样式
    let previewStyle = '';
    
    // 第一步：应用模板的基础样式（只负责背景、边框、圆角等容器样式）
    Object.keys(template.style).forEach(key => {
      previewStyle += `${key}: ${template.style[key]}; `;
    });
    
    // 第二步：根据字符数量调整字体大小（独立于模板和文字效果）
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
      // 默认字体大小（当没有输入时）
      previewStyle += 'font-size: 3.5rem; ';
    }
    
    // 第三步：应用文字效果样式（完全独立，负责文字颜色、阴影、渐变等）
    // 特殊处理：浅色背景的文字颜色优化
    const isLightBackground = ['template3', 'template7', 'template9'].includes(this.data.selectedTemplate);
    
    if (isLightBackground) {
      // 浅色背景下的文字优化
      if (this.data.selectedTextEffect === 'normal') {
        // 普通效果：改为深色文字
        previewStyle += 'color: #333333; ';
        previewStyle += 'text-shadow: none; ';
      } else if (this.data.selectedTextEffect === 'gradient') {
        // 渐变文字：深色渐变
        previewStyle += 'background: linear-gradient(135deg, #3498db, #8e44ad); ';
        previewStyle += '-webkit-background-clip: text; ';
        previewStyle += '-webkit-text-fill-color: transparent; ';
        previewStyle += 'text-shadow: none; ';
      } else {
        // 其他效果：保持白色但增强阴影效果
        Object.keys(textEffect.style).forEach(key => {
          if (key === 'text-shadow' && textEffect.style[key] !== 'none') {
            // 增强阴影效果在浅色背景上的可见性
            previewStyle += `${key}: ${textEffect.style[key].replace('rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.7)')}; `;
          } else {
            previewStyle += `${key}: ${textEffect.style[key]}; `;
          }
        });
      }
    } else {
      // 深色背景：正常应用文字效果
      if (this.data.selectedTextEffect === 'gradient') {
        // 渐变文字：浅色渐变
        previewStyle += 'background: linear-gradient(135deg, #ffffff, #f39c12); ';
        previewStyle += '-webkit-background-clip: text; ';
        previewStyle += '-webkit-text-fill-color: transparent; ';
        previewStyle += 'text-shadow: none; ';
      } else {
        Object.keys(textEffect.style).forEach(key => {
          previewStyle += `${key}: ${textEffect.style[key]}; `;
        });
      }
    }
    
    console.log('生成的预览样式:', previewStyle);
    
    // 无论输入是否有效，都可以导出图片
    // 如果输入无效，显示"预览"；如果输入有效，显示输入的内容
    this.setData({
      previewText: validation.valid ? inputValue : '预览',
      canExport: true, // 始终允许导出
      previewStyle: previewStyle
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

  // 生成头像PNG图片
  generateAvatarPNG() {
    const that = this;
    
    try {
      // 获取当前选中的模板和文字效果
      const template = this.data.templates[this.data.selectedTemplate];
      const textEffect = this.data.textEffects[this.data.selectedTextEffect];
      const inputText = this.data.inputText.trim() || '预览';
      
      console.log('开始生成头像PNG:', {
        template: this.data.selectedTemplate,
        textEffect: this.data.selectedTextEffect,
        inputText: inputText,
        templateStyle: template.style,
        textEffectStyle: textEffect.style
      });
      
      // 使用新的Canvas API
      const query = wx.createSelectorQuery();
      query.select('#avatarCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('Canvas节点未找到');
            wx.showToast({
              title: 'Canvas初始化失败',
              icon: 'none'
            });
            that.setData({ isLoading: false });
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          // 设置画布尺寸
          const canvasWidth = that.data.canvasWidth;
          const canvasHeight = that.data.canvasHeight;
          
          // 设置Canvas实际尺寸（考虑设备像素比）
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);
          
          // 首先清空画布
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制背景（根据模板样式）
          let fillColor = '#ffffff'; // 默认背景色
          if (template.style.background) {
            if (template.style.background.startsWith('linear-gradient')) {
              // 处理渐变背景 - 使用渐变绘制
              const gradient = template.style.background;
              const colorMatch = gradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
              if (colorMatch && colorMatch.length >= 2) {
                // 创建线性渐变
                const grd = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
                grd.addColorStop(0, colorMatch[0]);
                grd.addColorStop(1, colorMatch[1]);
                fillColor = grd;
              } else if (colorMatch) {
                fillColor = colorMatch[0];
              }
            } else {
              // 纯色背景
              fillColor = template.style.background;
            }
          }
          ctx.fillStyle = fillColor;
          
          // 绘制头像容器（根据模板样式）
          const avatarSize = Math.min(canvasWidth, canvasHeight); // 使用画布的最小尺寸
          
          // 处理圆角 - 根据模板样式决定是否使用圆角
          if (template.style['border-radius']) {
            const borderRadius = template.style['border-radius'];
            let radius = 0;
            
            if (borderRadius === '50%') {
              // 圆形：半径等于画布宽度的一半
              radius = avatarSize / 2;
              
              // 绘制圆形
              ctx.beginPath();
              ctx.arc(canvasWidth / 2, canvasHeight / 2, radius, 0, 2 * Math.PI);
              ctx.closePath();
              ctx.fill();
              
              // 绘制圆形边框
              if (template.style.border && template.style.border !== 'none') {
                const borderMatch = template.style.border.match(/(\d+)px solid (#?[a-fA-F0-9]+)/);
                if (borderMatch) {
                  const borderWidth = Math.max(parseInt(borderMatch[1]) * 0.8, 1); // 最小1像素
                  const borderColor = borderMatch[2];
                  ctx.strokeStyle = borderColor;
                  ctx.lineWidth = borderWidth;
                  ctx.stroke();
                }
              }
            } else if (borderRadius.includes('px')) {
              // 圆角矩形：圆角半径等于画布宽度
              radius = Math.min(parseInt(borderRadius), avatarSize / 2);
              
              // 绘制圆角矩形
              ctx.beginPath();
              ctx.arc(0 + radius, 0 + radius, radius, Math.PI, 1.5 * Math.PI);
              ctx.arc(canvasWidth - radius, 0 + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
              ctx.arc(canvasWidth - radius, canvasHeight - radius, radius, 0, 0.5 * Math.PI);
              ctx.arc(0 + radius, canvasHeight - radius, radius, 0.5 * Math.PI, Math.PI);
              ctx.closePath();
              ctx.fill();
              
              // 绘制圆角矩形边框
              if (template.style.border && template.style.border !== 'none') {
                const borderMatch = template.style.border.match(/(\d+)px solid (#?[a-fA-F0-9]+)/);
                if (borderMatch) {
                  const borderWidth = Math.max(parseInt(borderMatch[1]) * 0.8, 1); // 最小1像素
                  const borderColor = borderMatch[2];
                  ctx.strokeStyle = borderColor;
                  ctx.lineWidth = borderWidth;
                  ctx.stroke();
                }
              }
            }
          } else {
            // 方形：绘制和画布等宽的矩形
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // 绘制方形边框
            if (template.style.border && template.style.border !== 'none') {
              const borderMatch = template.style.border.match(/(\d+)px solid (#?[a-fA-F0-9]+)/);
              if (borderMatch) {
                const borderWidth = Math.max(parseInt(borderMatch[1]) * 0.8, 1); // 最小1像素
                const borderColor = borderMatch[2];
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
              }
            }
          }
          
          // 绘制文字（根据字符数量精确调整字体大小）
          const charCount = Array.from(inputText).length;
          let fontSize = 40; // 基础字体大小
          
          // 根据字符数量精确调整字体大小，确保不同字符数的显示效果一致
          if (charCount === 1) {
            fontSize = 80; // 单个字符使用较大字体
          } else if (charCount === 2) {
            fontSize = 60; // 两个字符
          } else if (charCount === 3) {
            fontSize = 50; // 三个字符
          } else if (charCount === 4) {
            fontSize = 45; // 四个字符
          }
          
          // 设置文字样式
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // 处理文字颜色（根据背景自动调整）
          let textColor = '#ffffff';
          if (that.data.selectedTemplate === 'template9' && that.data.selectedTextEffect === 'normal') {
            textColor = '#000000';
          } else if (['template3', 'template7', 'template9'].includes(that.data.selectedTemplate) && 
                     ['normal'].includes(that.data.selectedTextEffect)) {
            textColor = '#333333';
          }
          
          // 处理渐变文字效果
          if (that.data.selectedTextEffect === 'gradient') {
            // 创建渐变
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
            if (['template3', 'template7', 'template9'].includes(that.data.selectedTemplate)) {
              // 浅色背景使用深色渐变
              gradient.addColorStop(0, '#3498db');
              gradient.addColorStop(1, '#8e44ad');
            } else {
              // 深色背景使用浅色渐变
              gradient.addColorStop(0, '#ffffff');
              gradient.addColorStop(1, '#f39c12');
            }
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = textColor;
          }
          
          // 绘制文字
          ctx.fillText(inputText, canvasWidth / 2, canvasHeight / 2);
          
          // 绘制完成后保存图片
          console.log('Canvas绘制完成，开始生成PNG图片');
          
          // 使用新的Canvas转图片API
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth * 2, // 输出400x400像素的高清图片
            destHeight: canvasHeight * 2,
            quality: 1,
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