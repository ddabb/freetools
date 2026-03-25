/**
 * 图片生成工具（文案生图核心模块）
 * 支持文本、图片、二维码的绘制和导出
 * 平台兼容：微信小程序 + 鸿蒙
 */

const utils = require('./index');

// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

/**
 * 默认配置
 */
const defaultConfig = {
  width: 375,
  height: 667,
  padding: 10,
  qrSize: 85,
  qrMargin: 35,
  background: {
    gradient: true,
    colors: ['#f9f7fe', '#f0f4ff', '#e8f0ff', '#f5f0ff', '#fef7f9']
  }
};

/**
 * 计算文案绘制参数
 * @param {number} textLength - 文字长度
 * @param {number} availableHeight - 可用高度
 * @returns {object} {fontSize, lineHeight, maxCharsPerLine, maxLines}
 */
function calculateTextParams(textLength, availableHeight) {
  let fontSize, lineHeight, maxCharsPerLine, maxLines;
  
  if (textLength <= 15) {
    fontSize = 36;
    lineHeight = 50;
    maxCharsPerLine = 8;
    maxLines = 4;
  } else if (textLength <= 30) {
    fontSize = 32;
    lineHeight = 46;
    maxCharsPerLine = 10;
    maxLines = 5;
  } else if (textLength <= 50) {
    fontSize = 28;
    lineHeight = 42;
    maxCharsPerLine = 12;
    maxLines = 6;
  } else {
    fontSize = 26;
    lineHeight = 40;
    maxCharsPerLine = 14;
    maxLines = 6;
  }
  
  // 根据可用高度调整
  const heightBasedLines = Math.floor(availableHeight / lineHeight);
  maxLines = Math.min(maxLines, heightBasedLines);
  
  return { fontSize, lineHeight, maxCharsPerLine, maxLines };
}

/**
 * 绘制背景
 * @param {object} ctx - Canvas上下文
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 * @param {object} options - 配置选项
 */
function drawBackground(ctx, width, height, options = {}) {
  const bg = { ...defaultConfig.background, ...options.background };
  
  if (bg.gradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    bg.colors.forEach((color, i) => {
      gradient.addColorStop(i / (bg.colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = bg.color || '#ffffff';
  }
  ctx.fillRect(0, 0, width, height);
  
  // 绘制装饰圆形
  ctx.fillStyle = 'rgba(255, 166, 0, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.2, height * 0.2, 120, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(138, 43, 226, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.3, 100, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(0, 191, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.3, height * 0.8, 140, 0, 2 * Math.PI);
  ctx.fill();
  
  // 绘制装饰曲线
  ctx.strokeStyle = 'rgba(147, 112, 219, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(options.padding || 45, height * 0.3);
  ctx.bezierCurveTo(width * 0.25, height * 0.2, width * 0.75, height * 0.4, width - (options.padding || 45), height * 0.3);
  ctx.stroke();
  
  ctx.strokeStyle = 'rgba(255, 105, 180, 0.1)';
  ctx.beginPath();
  ctx.moveTo(options.padding || 45, height * 0.7);
  ctx.bezierCurveTo(width * 0.25, height * 0.6, width * 0.75, height * 0.8, width - (options.padding || 45), height * 0.7);
  ctx.stroke();
}

/**
 * 设置Canvas字体
 * @param {object} ctx - Canvas上下文
 * @param {number} fontSize - 字体大小
 * @param {string} fontType - 字体类型
 * @param {boolean} isBold - 是否加粗
 */
function setCanvasFont(ctx, fontSize, fontType = 'handwriting', isBold = false) {
  const fontStacks = {
    title: 'Montserrat, Pacifico, Inter, Roboto, -apple-system, sans-serif',
    body: 'Inter, Roboto, Open Sans, -apple-system, sans-serif',
    handwriting: 'Pacifico, Dancing Script, cursive, STKaiti, KaiTi, serif',
    elegant: 'Raleway, Lato, Source Sans Pro, STKaiti, serif'
  };
  
  const fontFamily = fontStacks[fontType] || fontStacks.body;
  const style = isBold ? 'bold ' : '';
  
  ctx.font = `${style}${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

/**
 * 绘制文案内容
 * @param {object} ctx - Canvas上下文
 * @param {string} text - 文案内容
 * @param {object} options - 配置 {x, y, maxWidth, maxHeight, align}
 * @returns {number} 实际绘制高度
 */
function drawText(ctx, text, options = {}) {
  const {
    x = 10,
    startY = 95,
    maxWidth = 285,
    maxHeight = 400,
    align = 'left'
  } = options;
  
  const params = calculateTextParams(text.length, maxHeight);
  const { fontSize, lineHeight, maxCharsPerLine, maxLines } = params;
  
  setCanvasFont(ctx, fontSize, 'handwriting', true);
  
  let currentY = startY;
  let lineCount = 0;
  const paragraphs = text.split(/[\r\n]+/);
  
  for (let p = 0; p < paragraphs.length; p++) {
    let paragraphText = paragraphs[p];
    if (!paragraphText.trim()) continue;
    
    let pos = 0;
    while (pos < paragraphText.length && lineCount < maxLines) {
      let endPos = Math.min(pos + maxCharsPerLine, paragraphText.length);
      
      // 智能断行
      if (endPos < paragraphText.length) {
        const punctChars = ['，', '。', '！', '？', ',', '.', '!', '?'];
        for (let i = endPos - 1; i >= pos; i--) {
          if (punctChars.includes(paragraphText[i])) {
            endPos = i + 1;
            break;
          }
        }
      }
      
      const lineText = paragraphText.substring(pos, endPos).trim();
      if (lineText) {
        // 渐变色文字
        const gradient = ctx.createLinearGradient(x, currentY, x + maxWidth, currentY);
        gradient.addColorStop(0, '#8e44ad');
        gradient.addColorStop(1, '#3498db');
        ctx.fillStyle = gradient;
        
        // 根据对齐方式设置绘制位置
        const drawX = align === 'center' ? x : x;
        ctx.fillText(lineText, drawX, currentY);
        currentY += lineHeight;
        lineCount++;
      }
      pos = endPos;
    }
    
    if (p < paragraphs.length - 1 && lineCount < maxLines) {
      currentY += lineHeight * 0.3;
    }
  }
  
  // 截断省略号
  if (text.length > 50 || lineCount >= maxLines) {
    ctx.fillStyle = '#8e44ad';
    ctx.fillText('...', x, currentY);
    currentY += lineHeight;
  }
  
  return currentY;
}

/**
 * 绘制来源信息
 * @param {object} ctx - Canvas上下文
 * @param {string} from - 来源
 * @param {object} options - 配置 {x, y, maxWidth, align}
 */
function drawFrom(ctx, from, options = {}) {
  const { x = 10, y, maxWidth = 285, align = 'right' } = options;
  
  if (from && from !== '佚名') {
    setCanvasFont(ctx, 16, 'elegant', false, true);
    ctx.fillStyle = '#8a9aaf';
    ctx.textAlign = align;
    const text = '—— ' + from;
    if (align === 'center') {
      ctx.fillText(text, x, y);
    } else {
      ctx.fillText(text, x + maxWidth, y);
    }
    ctx.textAlign = 'left';
  }
}

/**
 * 绘制日期信息
 * @param {object} ctx - Canvas上下文
 * @param {object} options - 配置 {x, y}
 */
function drawDate(ctx, options = {}) {
  const { x = 10, qrY, qrSize, qrMargin } = options;
  const now = new Date();
  
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[now.getDay()];
  
  // 尝试使用农历（如果可用）
  let lunarInfo = '';
  try {
    const { Solar } = require('lunar-javascript');
    const solar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const lunarDate = solar.getLunar();
    lunarInfo = lunarDate.getYearInGanZhi();
  } catch (e) {
    lunarInfo = '';
  }
  
  const qrCenterY = qrY + qrSize / 2;
  
  setCanvasFont(ctx, 14, 'title', true);
  ctx.fillStyle = '#4a5568';
  ctx.fillText(dateStr, x, qrCenterY - 20);
  
  setCanvasFont(ctx, 12, 'body');
  ctx.fillStyle = '#718096';
  const weekText = lunarInfo ? `星期${weekDay} ${lunarInfo}` : `星期${weekDay}`;
  ctx.fillText(weekText, x, qrCenterY + 5);
}

/**
 * 绘制二维码
 * @param {object} ctx - Canvas上下文
 * @param {string} qrPath - 二维码图片路径
 * @param {object} options - 配置 {qrX, qrY, qrSize, hasBorder}
 */
function drawQRCode(ctx, qrPath, options = {}) {
  const {
    qrX,
    qrY,
    qrSize = 85,
    hasBorder = true
  } = options;
  
  // 白色背景边框
  if (hasBorder) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
  }
  
  // 绘制二维码
  ctx.drawImage(qrPath, qrX, qrY, qrSize, qrSize);
}

/**
 * 导出图片
 * @param {object} ctx - Canvas上下文
 * @param {object} options - 配置 {canvasId, width, height, pixelRatio, success, fail}
 */
function exportImage(ctx, options = {}) {
  const {
    canvasId,
    width,
    height,
    pixelRatio = 2,
    quality = 1,
    success,
    fail
  } = options;
  
  if (isHarmonyOS) {
    // 鸿蒙平台导出
    const canvas = this.$element(canvasId);
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      if (success) success(imageData);
    } else {
      if (fail) fail({ error: 'Canvas not found' });
    }
  } else {
    // 微信小程序导出 (新版 type="2d" Canvas 不需要 draw)
    if (success) success();
  }
}

/**
 * 保存图片到相册
 * @param {string} filePath - 文件路径
 * @param {function} success - 成功回调
 * @param {function} fail - 失败回调
 */
function saveToAlbum(filePath, success, fail) {
  if (isHarmonyOS) {
    // 鸿蒙平台
    const image = require('@system.image');
    image.saveToPhotosAlbum({
      uri: filePath,
      success: (res) => {
        if (success) success(res);
      },
      fail: (data, code) => {
        if (fail) fail({ code, data });
      }
    });
  } else {
    // 微信小程序
    wx.saveImageToPhotosAlbum({
      filePath,
      success: (res) => {
        if (success) success(res);
      },
      fail: (err) => {
        if (fail) fail(err);
      }
    });
  }
}

module.exports = {
  defaultConfig,
  calculateTextParams,
  drawBackground,
  setCanvasFont,
  drawText,
  drawFrom,
  drawDate,
  drawQRCode,
  exportImage,
  saveToAlbum
};
