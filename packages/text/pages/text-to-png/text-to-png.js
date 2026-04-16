// 文本转图片页面逻辑
const utils = require('../../../../utils/index');

Page({
  data: {
    inputText: '',
    selectedTemplate: 'template1',
    selectedTextEffect: 'normal',
    templateExpanded: true,
    textEffectExpanded: true,
    canExport: false,
    isLoading: false,
    previewText: '请输入文本',
    previewStyle: '',
    
    // 模板配置
    templates: {
      template1: {
        name: '简约白色',
        style: {
          'background': '#ffffff',
          'border': '1px solid #e0e0e0',
          'border-radius': '8px'
        },
        textColor: '#333333',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: 16,
          lineHeight: 1.5
        }
      },
      template2: {
        name: '深色背景',
        style: {
          'background': '#333333',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: 16,
          lineHeight: 1.5
        }
      },
      template3: {
        name: '渐变蓝色',
        style: {
          'background': 'linear-gradient(135deg, #3498db, #2980b9)',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'light',
          fontSize: 17,
          lineHeight: 1.6
        }
      },
      template4: {
        name: '渐变绿色',
        style: {
          'background': 'linear-gradient(135deg, #2ecc71, #27ae60)',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: 16,
          lineHeight: 1.5
        }
      },
      template5: {
        name: '渐变红色',
        style: {
          'background': 'linear-gradient(135deg, #e74c3c, #c0392b)',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          fontSize: 16,
          lineHeight: 1.5
        }
      },
      template6: {
        name: '渐变紫色',
        style: {
          'background': 'linear-gradient(135deg, #9b59b6, #8e44ad)',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'serif',
          fontWeight: 'normal',
          fontSize: 17,
          lineHeight: 1.6
        }
      },
      template7: {
        name: '渐变橙色',
        style: {
          'background': 'linear-gradient(135deg, #f39c12, #e67e22)',
          'border-radius': '8px'
        },
        textColor: '#ffffff',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'medium',
          fontSize: 16,
          lineHeight: 1.5
        }
      },
      template8: {
        name: '商务灰色',
        style: {
          'background': '#f5f5f5',
          'border': '2px solid #95a5a6',
          'border-radius': '8px'
        },
        textColor: '#333333',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: 15,
          lineHeight: 1.4
        }
      },
      template9: {
        name: '卡片风格',
        style: {
          'background': '#ffffff',
          'border': '1px solid #e0e0e0',
          'border-radius': '8px',
          'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)'
        },
        textColor: '#333333',
        fontConfig: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          fontSize: 16,
          lineHeight: 1.5
        }
      }
    },
    
    // 文字效果配置
    textEffects: {
      normal: {
        name: '普通效果',
        style: {
          'text-shadow': 'none'
        }
      },
      gradient: {
        name: '渐变文字',
        style: {
          'text-shadow': 'none'
        }
      },
      shadow: {
        name: '阴影效果',
        style: {
          'text-shadow': '4px 4px 8px rgba(0, 0, 0, 0.5)'
        }
      },
      stroke: {
        name: '描边效果',
        style: {
          'text-shadow': '1px 1px 0 #2c3e50, -1px -1px 0 #2c3e50, 1px -1px 0 #2c3e50, -1px 1px 0 #2c3e50'
        }
      },
      glow: {
        name: '发光效果',
        style: {
          'text-shadow': '0 0 10px #00ff9d, 0 0 20px #00ff9d'
        }
      },
      '3d': {
        name: '立体效果',
        style: {
          'text-shadow': '2px 2px 0 #2c3e50, 4px 4px 0 rgba(0, 0, 0, 0.2)'
        }
      }
    },
    
    // 画布配置
    canvasWidth: 750, // 小程序默认宽度
    canvasHeight: 1000 // 初始高度
  },

  // 检查输入是否有效
  isValidInput(input) {
    if (!input || input.trim() === '') {
      return { valid: false, message: '请输入文本' };
    }
    return { valid: true, message: '' };
  },

  // Markdown解析函数
  parseMarkdown(text) {
    if (!text) return [];
    
    const lines = text.split('\n');
    const parsedLines = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    
    lines.forEach(line => {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock) {
          parsedLines.push({ type: 'code', content: codeBlockContent });
          codeBlockContent = '';
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return;
      }
      
      // 标题
      if (line.startsWith('# ')) {
        parsedLines.push({ type: 'h1', content: line.substring(2) });
      } else if (line.startsWith('## ')) {
        parsedLines.push({ type: 'h2', content: line.substring(3) });
      } else if (line.startsWith('### ')) {
        parsedLines.push({ type: 'h3', content: line.substring(4) });
      } 
      // 引用
      else if (line.startsWith('> ')) {
        parsedLines.push({ type: 'quote', content: line.substring(2) });
      }
      // 列表
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        parsedLines.push({ type: 'list', content: line.substring(2) });
      }
      // 普通文本
      else {
        // 处理行内格式：粗体和斜体
        let content = line;
        // 粗体
        content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        // 斜体
        content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');
        parsedLines.push({ type: 'text', content: content });
      }
    });
    
    return parsedLines;
  },

  // 更新预览
  updatePreview() {
    const inputValue = this.data.inputText.trim();
    const validation = this.isValidInput(inputValue);
    
    const template = this.data.templates[this.data.selectedTemplate];
    const textEffect = this.data.textEffects[this.data.selectedTextEffect];
    const fontConfig = template.fontConfig;
    
    // 构建预览样式
    let previewStyle = '';
    
    // 应用模板样式
    Object.keys(template.style).forEach(key => {
      previewStyle += `${key}: ${template.style[key]}; `;
    });
    
    // 应用文字样式
    previewStyle += `font-family: ${fontConfig.fontFamily}; `;
    previewStyle += `font-weight: ${fontConfig.fontWeight}; `;
    previewStyle += `font-size: ${fontConfig.fontSize}px; `;
    previewStyle += `line-height: ${fontConfig.lineHeight}; `;
    
    // 应用文字颜色
    previewStyle += `color: ${template.textColor}; `;
    
    // 应用文字效果
    Object.keys(textEffect.style).forEach(key => {
      previewStyle += `${key}: ${textEffect.style[key]}; `;
    });
    
    // 处理Markdown预览
    let previewText = validation.valid ? inputValue : '请输入文本';
    if (validation.valid) {
      previewText = this.renderMarkdownPreview(inputValue, fontConfig);
    }
    
    this.setData({
      previewText: previewText,
      canExport: validation.valid,
      previewStyle: previewStyle.trim()
    });
  },

  // 渲染Markdown预览
  renderMarkdownPreview(text, fontConfig) {
    if (!text) return '';
    
    let html = '';
    const lines = text.split('\n');
    let inCodeBlock = false;
    
    // 默认字体配置
    const defaultFontConfig = {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      fontSize: 16,
      lineHeight: 1.5
    };
    
    const config = fontConfig || defaultFontConfig;
    
    lines.forEach(line => {
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          html += `<div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: ${config.fontSize * 0.9}px; line-height: ${config.lineHeight};">`;
        } else {
          html += '</div>';
        }
        return;
      }
      
      if (inCodeBlock) {
        html += line + '<br>';
        return;
      }
      
      // 标题
      if (line.startsWith('# ')) {
        html += `<h1 style="font-family: ${config.fontFamily}; font-weight: bold; font-size: ${config.fontSize * 1.5}px; margin: 10px 0; line-height: ${config.lineHeight};">` + line.substring(2) + '</h1>';
      } else if (line.startsWith('## ')) {
        html += `<h2 style="font-family: ${config.fontFamily}; font-weight: bold; font-size: ${config.fontSize * 1.3}px; margin: 8px 0; line-height: ${config.lineHeight};">` + line.substring(3) + '</h2>';
      } else if (line.startsWith('### ')) {
        html += `<h3 style="font-family: ${config.fontFamily}; font-weight: bold; font-size: ${config.fontSize * 1.1}px; margin: 6px 0; line-height: ${config.lineHeight};">` + line.substring(4) + '</h3>';
      }
      // 引用
      else if (line.startsWith('> ')) {
        html += `<div style="margin: 10px 0; padding: 10px; background: rgba(0, 0, 0, 0.05); border-left: 4px solid #3498db; font-family: ${config.fontFamily}; font-size: ${config.fontSize}px; line-height: ${config.lineHeight};">` + line.substring(2) + '</div>';
      }
      // 列表
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        html += `<div style="margin: 5px 0; padding-left: 20px; font-family: ${config.fontFamily}; font-size: ${config.fontSize}px; line-height: ${config.lineHeight};">• ` + line.substring(2) + '</div>';
      }
      // 普通文本
      else {
        let content = line;
        // 处理行内格式：粗体和斜体
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        if (content.trim() === '') {
          html += '<br>';
        } else {
          html += `<div style="font-family: ${config.fontFamily}; font-size: ${config.fontSize}px; line-height: ${config.lineHeight};">` + content + '</div>';
        }
      }
    });
    
    return html;
  },

  // 输入文本变化
  onTextInput(e) {
    this.setData({
      inputText: e.detail.value
    });
    this.updatePreview();
  },

  // 模板选择
  onTemplateSelect(e) {
    const template = e.currentTarget.dataset.value;
    this.setData({
      selectedTemplate: template
    });
    this.updatePreview();
  },

  // 文字效果选择
  onTextEffectSelect(e) {
    const effect = e.currentTarget.dataset.value;
    this.setData({
      selectedTextEffect: effect
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

  // 重置表单
  resetForm() {
    this.setData({
      inputText: '',
      selectedTemplate: 'template1',
      selectedTextEffect: 'normal'
    });
    this.updatePreview();
  },

  // 计算文本高度
  calculateTextHeight(text, fontSize, lineHeight, canvasWidth) {
    const lines = text.split('\n');
    let totalHeight = 0;
    
    // 估算每行高度
    const lineHeightPx = fontSize * lineHeight;
    
    // 计算每行的字符数（假设平均字符宽度）
    const avgCharWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor((canvasWidth - 64) / avgCharWidth); // 64是左右边距
    
    lines.forEach(line => {
      if (line.trim() === '') {
        totalHeight += lineHeightPx;
      } else {
        const lineCount = Math.ceil(line.length / maxCharsPerLine);
        totalHeight += lineCount * lineHeightPx;
      }
    });
    
    // 添加上下边距
    totalHeight += 64;
    
    return Math.max(totalHeight, 200); // 最小高度200px
  },

  // 计算Markdown内容高度
  calculateMarkdownHeight(parsedContent, baseFontSize, lineHeight, canvasWidth) {
    let totalHeight = 0;
    const margin = 64; // 上下边距
    const lineSpacing = 10; // 行间距
    
    parsedContent.forEach(item => {
      let fontSize = baseFontSize;
      let indent = 0;
      let extraSpacing = 0;
      
      switch (item.type) {
        case 'h1':
          fontSize = baseFontSize * 2;
          extraSpacing = 20;
          break;
        case 'h2':
          fontSize = baseFontSize * 1.5;
          extraSpacing = 15;
          break;
        case 'h3':
          fontSize = baseFontSize * 1.2;
          extraSpacing = 10;
          break;
        case 'quote':
          indent = 40; // 增加引用的缩进
          extraSpacing = 15;
          break;
        case 'list':
          indent = 20;
          break;
        case 'code':
          extraSpacing = 15;
          break;
      }
      
      const lineHeightPx = fontSize * lineHeight;
      const avgCharWidth = fontSize * 0.6;
      const maxCharsPerLine = Math.floor((canvasWidth - margin - indent * 2) / avgCharWidth);
      
      if (item.type === 'code') {
        const codeLines = item.content.split('\n');
        totalHeight += codeLines.length * lineHeightPx + extraSpacing;
      } else {
        // 处理行内格式标记
        let content = item.content.replace(/<b>|<\/b>|<i>|<\/i>/g, '');
        const lineCount = Math.ceil(content.length / maxCharsPerLine);
        totalHeight += lineCount * lineHeightPx + extraSpacing;
      }
      
      // 添加行间距
      totalHeight += lineSpacing;
    });
    
    // 添加上下边距
    totalHeight += margin;
    
    return Math.max(totalHeight, 300); // 增加最小高度
  },

  // 生成文本PNG图片
  generateTextPNG() {
    const that = this;
    
    try {
      const inputText = this.data.inputText.trim();
      const template = this.data.templates[this.data.selectedTemplate];
      const textEffect = this.data.textEffects[this.data.selectedTextEffect];
      const fontConfig = template.fontConfig;
      const baseFontSize = fontConfig.fontSize;
      const lineHeight = fontConfig.lineHeight;
      
      console.debug('开始生成文本PNG:', {
        inputText: inputText,
        template: this.data.selectedTemplate,
        textEffect: this.data.selectedTextEffect
      });
      
      // 使用新的Canvas API
      const query = wx.createSelectorQuery();
      query.select('#textCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('Canvas节点未找到');
            utils.showText('Canvas初始化失败');
            that.setData({ isLoading: false });
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          
          // 获取设备屏幕宽度作为画布宽度，并设置最大宽度
          const systemInfo = wx.getSystemInfoSync();
          const maxWidth = 750; // 设置最大宽度为750px
          const canvasWidth = Math.min(systemInfo.windowWidth * 2, maxWidth * 2); // 适配手机宽度，不超过最大宽度
          
          // 解析Markdown
          const parsedContent = that.parseMarkdown(inputText);
          
          // 计算画布高度，比计算值高20像素
          const calculatedHeight = that.calculateMarkdownHeight(parsedContent, baseFontSize, lineHeight, canvasWidth);
          const canvasHeight = calculatedHeight + 20; // 画布高度比计算值高20像素
          
          // 更新data中的画布尺寸
          that.setData({
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
          });
          
          // 设置Canvas实际尺寸（考虑设备像素比）
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);
          
          // 清空画布
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制背景（根据模板样式）
          let fillColor = '#ffffff'; // 默认背景色
          if (template.style.background) {
            if (template.style.background.startsWith('linear-gradient')) {
              // 处理渐变背景
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
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
          // 绘制边框
          if (template.style.border && template.style.border !== 'none') {
            const borderMatch = template.style.border.match(/(\d+)px solid (#?[a-fA-F0-9]+)/);
            if (borderMatch) {
              const borderWidth = parseInt(borderMatch[1]);
              const borderColor = borderMatch[2];
              ctx.strokeStyle = borderColor;
              ctx.lineWidth = borderWidth;
              ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
            }
          }
          
          // 绘制阴影效果
          if (template.style['box-shadow']) {
            // 简化处理，添加基本阴影效果
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }
          
          // 处理文字颜色和效果
          let textColor = template.textColor;
          if (that.data.selectedTextEffect === 'gradient') {
            // 创建渐变文字
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
            if (template.textColor === '#ffffff') {
              // 深色背景使用浅色渐变
              gradient.addColorStop(0, '#ffffff');
              gradient.addColorStop(1, '#f39c12');
            } else {
              // 浅色背景使用深色渐变
              gradient.addColorStop(0, '#3498db');
              gradient.addColorStop(1, '#8e44ad');
            }
            textColor = gradient;
          }
          
          // 绘制Markdown内容
          const margin = 32; // 边距
          let y = margin;
          
          parsedContent.forEach(item => {
            let fontSize = baseFontSize;
            let fontWeight = 'normal';
            let indent = 0;
            let isQuote = false;
            
            switch (item.type) {
              case 'h1':
                fontSize = baseFontSize * 2;
                fontWeight = 'bold';
                break;
              case 'h2':
                fontSize = baseFontSize * 1.5;
                fontWeight = 'bold';
                break;
              case 'h3':
                fontSize = baseFontSize * 1.2;
                fontWeight = 'bold';
                break;
              case 'quote':
                indent = 40;
                isQuote = true;
                break;
              case 'list':
                indent = 20;
                break;
            }
            
            // 设置文字样式
            ctx.font = `${fontWeight} ${fontSize}px ${fontConfig.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = textColor;
            
            // 应用文字效果
            if (textEffect.style['text-shadow'] && textEffect.style['text-shadow'] !== 'none') {
              // 简化处理文字阴影效果
              if (textEffect.style['text-shadow'].includes('glow')) {
                ctx.shadowColor = '#00ff9d';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              } else if (textEffect.style['text-shadow'].includes('3d')) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 4;
              } else if (textEffect.style['text-shadow'].includes('stroke')) {
                // 描边效果需要特殊处理
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 1;
              } else if (textEffect.style['text-shadow'].includes('shadow')) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 4;
              }
            }
            
            // 计算每行的最大字符数
            const avgCharWidth = fontSize * 0.6;
            const maxCharsPerLine = Math.floor((canvasWidth - margin * 2 - indent) / avgCharWidth);
            
            // 处理行内格式
            const lineHeightPx = fontSize * lineHeight;
            
            // 处理内容
            if (item.type === 'code') {
              // 绘制代码块
              ctx.font = `normal ${baseFontSize * 0.9}px monospace`;
              ctx.fillStyle = '#333333';
              // 绘制代码块背景
              ctx.fillStyle = '#f5f5f5';
              const codeLines = item.content.split('\n');
              const codeBlockHeight = codeLines.length * lineHeightPx + 20;
              ctx.fillRect(margin + indent - 10, y - 10, canvasWidth - (margin + indent) * 2 + 20, codeBlockHeight);
              // 恢复文字颜色
              ctx.fillStyle = textColor;
              
              codeLines.forEach(codeLine => {
                if (codeLine.trim() !== '') {
                  ctx.fillText(codeLine, margin + indent, y);
                }
                y += lineHeightPx;
              });
              y += 10;
            } else {
              // 处理引用内容的左侧竖线和背景
              if (isQuote) {
                // 绘制引用的左侧竖线
                ctx.fillStyle = '#3498db';
                ctx.fillRect(margin + 10, y - 5, 4, lineHeightPx * 1.5);
                // 绘制引用背景
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(margin + indent - 10, y - 10, canvasWidth - (margin + indent) * 2 + 20, lineHeightPx * 1.5 + 10);
                ctx.fillStyle = textColor;
              }
              
              // 处理普通文本和其他元素
              let content = item.content;
              // 处理行内格式：粗体和斜体
              let parts = [];
              let currentPart = '';
              let inBold = false;
              let inItalic = false;
              
              for (let i = 0; i < content.length; i++) {
                if (content.substr(i, 3) === '<b>') {
                  if (currentPart) {
                    parts.push({ text: currentPart, bold: inBold, italic: inItalic });
                    currentPart = '';
                  }
                  inBold = true;
                  i += 2;
                } else if (content.substr(i, 4) === '</b>') {
                  if (currentPart) {
                    parts.push({ text: currentPart, bold: inBold, italic: inItalic });
                    currentPart = '';
                  }
                  inBold = false;
                  i += 3;
                } else if (content.substr(i, 3) === '<i>') {
                  if (currentPart) {
                    parts.push({ text: currentPart, bold: inBold, italic: inItalic });
                    currentPart = '';
                  }
                  inItalic = true;
                  i += 2;
                } else if (content.substr(i, 4) === '</i>') {
                  if (currentPart) {
                    parts.push({ text: currentPart, bold: inBold, italic: inItalic });
                    currentPart = '';
                  }
                  inItalic = false;
                  i += 3;
                } else {
                  currentPart += content[i];
                }
              }
              if (currentPart) {
                parts.push({ text: currentPart, bold: inBold, italic: inItalic });
              }
              
              // 绘制处理后的内容
              let currentX = margin + indent;
              let lineContent = '';
              let lineParts = [];
              
              parts.forEach(part => {
                // 处理长行
                let currentText = part.text;
                while (currentText.length > 0) {
                  let splitIndex = maxCharsPerLine - lineContent.length;
                  if (currentText.length > splitIndex) {
                    // 尝试在空格处分割
                    splitIndex = currentText.lastIndexOf(' ', splitIndex);
                    if (splitIndex === -1) {
                      splitIndex = maxCharsPerLine - lineContent.length;
                    }
                  }
                  const textToDraw = currentText.substring(0, splitIndex);
                  lineParts.push({ text: textToDraw, bold: part.bold, italic: part.italic });
                  lineContent += textToDraw;
                  
                  currentText = currentText.substring(splitIndex).trim();
                  if (currentText || !part.text) {
                    // 绘制当前行
                    let x = currentX;
                    lineParts.forEach(linePart => {
                      ctx.font = `${linePart.bold ? 'bold' : 'normal'} ${linePart.italic ? 'italic' : 'normal'} ${fontSize}px ${fontConfig.fontFamily}`;
                      // 处理描边效果
                      if (textEffect.style['text-shadow'] && textEffect.style['text-shadow'].includes('stroke')) {
                        ctx.strokeText(linePart.text, x, y);
                      }
                      ctx.fillText(linePart.text, x, y);
                      // 计算文本宽度并更新x坐标
                      const textWidth = ctx.measureText(linePart.text).width;
                      x += textWidth;
                    });
                    
                    // 重置行状态
                    y += lineHeightPx;
                    currentX = margin + indent;
                    lineContent = '';
                    lineParts = [];
                    
                    // 为引用的多行内容也添加竖线和背景
                    if (isQuote) {
                      ctx.fillStyle = '#3498db';
                      ctx.fillRect(margin + 10, y - 5, 4, lineHeightPx * 1.5);
                      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                      ctx.fillRect(margin + indent - 10, y - 10, canvasWidth - (margin + indent) * 2 + 20, lineHeightPx * 1.5 + 10);
                      ctx.fillStyle = textColor;
                    }
                  }
                }
              });
              
              // 绘制最后一行
              if (lineParts.length > 0) {
                let x = currentX;
                lineParts.forEach(linePart => {
                  ctx.font = `${linePart.bold ? 'bold' : 'normal'} ${linePart.italic ? 'italic' : 'normal'} ${fontSize}px ${fontConfig.fontFamily}`;
                  // 处理描边效果
                  if (textEffect.style['text-shadow'] && textEffect.style['text-shadow'].includes('stroke')) {
                    ctx.strokeText(linePart.text, x, y);
                  }
                  ctx.fillText(linePart.text, x, y);
                  // 计算文本宽度并更新x坐标
                  const textWidth = ctx.measureText(linePart.text).width;
                  x += textWidth;
                });
              }
              y += lineHeightPx;
            }
          });
          
          // 重置阴影效果
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          console.debug('Canvas绘制完成，开始生成PNG图片');
          
          // 使用新的Canvas转图片API
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth * 2, // 高清图片
            destHeight: canvasHeight * 2,
            quality: 1,
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
    const inputValue = this.data.inputText.trim();
    
    if (!inputValue) {
      utils.showText('请输入文本');
      return;
    }
    
    this.setData({ isLoading: true });
    
    try {
      console.debug('开始导出PNG图片');
      
      // 延迟执行以确保UI更新
      setTimeout(() => {
        this.generateTextPNG();
      }, 100);
      
    } catch (error) {
      console.error('导出图片时出错:', error);
      utils.showText('导出图片失败，请重试');
      this.setData({ isLoading: false });
    }
  },

  // 页面加载
  onLoad(options) {
    // 接收从其他页面传递的文本参数
    if (options && options.text) {
      this.setData({
        inputText: options.text
      });
    }
    this.updatePreview();
  }
});