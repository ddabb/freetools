// packages/copywriting/pages/copywriting/copywriting.js
// 平台兼容API封装
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
      // 微信小程序分享由系统处理
      console.log('微信分享');
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

// 导入 wordbank 包的数据
const wordbank = require('wordbank');

// 导入 lunar-javascript 包
const { Solar, Lunar } = require('lunar-javascript');

// 使用 wordbank 包中的数据
const allCategories = wordbank.allCategories;

Page({
  data: {
    categories: [],
    selectedCategory: '',
    searchKeyword: '',
    filteredCopywritings: [],
    scrollTop: 0,
    canvaswidth: 375,
    canvasheight: 667,
    linespace: 30
  },

  onLoad() {
    this.initData();
    
    // 页面加载后默认搜索"葬身"进行测试
    setTimeout(() => {

      this.filterCopywritings();
    }, 500);
  },

  initData() {
    // 初始化分类数据
    const categories = allCategories;
    console.log('初始化分类数据:', categories.length, '个分类');
    
    if (categories.length > 0) {
      console.log('第一个分类的数据:', categories[0]);
      
      this.setData({
        categories: categories
        // 移除默认选中的分类
      });
    } else {
      console.error('没有找到分类数据');
    }
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.categoryId;
    console.log('点击分类:', categoryId);
    this.setData({
      selectedCategory: categoryId,
      searchKeyword: '',
      scrollTop: 0  // 重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 滚动事件
  onScroll(e) {
    // 记录当前滚动位置
    this.setData({
      scrollTop: e.detail.scrollTop
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      scrollTop: 0  // 搜索时重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      scrollTop: 0  // 清空搜索时重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 过滤文案
  filterCopywritings() {
    const { selectedCategory, searchKeyword, categories } = this.data;
    console.log('过滤文案 - 分类:', selectedCategory, '关键词:', searchKeyword);
    
    let filtered = [];
    
    // 如果有搜索关键词，搜索所有分类
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      categories.forEach(category => {
        const categoryContent = category.content || [];
        const matchedItems = categoryContent.filter(item => {
          if (item && item.text) {
            return item.text.toLowerCase().includes(keyword);
          }
          return false;
        });
        filtered = filtered.concat(matchedItems);
      });
      console.log('跨分类搜索，找到结果数量:', filtered.length);
      console.log('搜索结果详情:', filtered);
    } else if (selectedCategory) {
      // 没有搜索关键词，但有选中的分类，显示该分类的文案
      const currentCategory = categories.find(cat => cat.id === selectedCategory);
      console.log('显示分类:', currentCategory ? currentCategory.name : '未找到');
      if (currentCategory) {
        filtered = currentCategory.content || [];
        console.log('分类内容数量:', filtered.length);
      }
    } else {
      // 既没有搜索关键词也没有选中的分类，显示空
      console.log('没有搜索关键词也没有选中的分类');
      filtered = [];
    }
    
    this.setData({
      filteredCopywritings: filtered
    });
    console.log('设置filteredCopywritings长度:', filtered.length);
  },

  // 复制文案
  copyCopywriting(e) {
    const index = e.currentTarget.dataset.index;
    const copywriting = this.data.filteredCopywritings[index];
    
    if (copywriting) {
      wx.setClipboardData({
        data: copywriting.text,
        success: (res) => {
          wx.showToast({
            title: '生成图片成功',
            icon: 'success',
            duration: 1500
          });
        },
        fail: (err) => {
          wx.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 1500
          });
        }
      });
    }
  },

  // 下载图片
  downloadImage(e) {
    const index = e.currentTarget.dataset.index;
    const copywriting = this.data.filteredCopywritings[index];
    
    if (copywriting) {
      this.setData({
        currentCopywriting: copywriting
      });
      this.savecodetofile();
    }
  },

  /**
   * 保存Canvas为图片
   */
  savecodetofile() {
    if (isHarmonyOS) {
      // 在鸿蒙平台，我们需要通过组件引用获取Canvas
      const canvas = this.$element('cvs1');
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
        const ctx = wx.createCanvasContext('cvs1', this);
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
   * 优先使用 app.js 中定义的字体，支持字体加载状态检测
   * 针对手机端兼容性优化：使用更稳定的字体栈配置
   */
  getFontStack(fontType = 'body') {
    const globalData = this.getAppGlobalData();
    
    // 字体栈配置 - 优化手机端兼容性
    const fontStacks = {
      // 标题字体：现代简约风格（手机端优先使用系统字体）
      title: {
        primary: 'Montserrat, Inter, Roboto',
        fallback: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      // 正文字体：清晰易读（手机端优化）
      body: {
        primary: 'Inter, Roboto, Open Sans',
        fallback: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      // 优雅字体：适合诗歌、文艺内容
      elegant: {
        primary: 'Raleway, Lato, Source Sans Pro',
        fallback: '"STKaiti", "KaiTi", "Microsoft YaHei", serif'
      },
      // 传统字体：适合古典、正式内容
      classic: {
        primary: '"STSong", "SimSun", serif',
        fallback: '"Microsoft YaHei", sans-serif'
      }
    };
    
    const stack = fontStacks[fontType] || fontStacks.body;
    
    // 手机端兼容性优化：Canvas 字体设置需要更保守的策略
    // 直接使用系统字体以确保兼容性，避免网络字体在 Canvas 中的显示问题
    return stack.fallback;
  },

  /**
   * 设置 Canvas 字体（兼容手机端）
   */
  setCanvasFont(ctx, fontSize, fontType = 'body', isBold = false, isItalic = false) {
    const fontStack = this.getFontStack(fontType);
    let fontStyle = '';
    
    if (isBold) fontStyle += 'bold ';
    if (isItalic) fontStyle += 'italic ';
    
    // 手机端 Canvas 字体设置优化
    ctx.font = `${fontStyle}${fontSize}px ${fontStack}`;
    
    // 设置文本对齐方式
    ctx.setTextAlign('left');
    ctx.setTextBaseline('top');
  },

  /**
   * 绘制分享图片
   */
  MergeImage(ctx) {
    let that = this;
    
    console.log('开始获取系统信息');
    
    // 直接使用默认值，不依赖系统信息
    console.log('使用默认系统信息');
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };
    
    console.log('系统信息:', systemInfo);
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    console.log('画布尺寸:', { width, height });

    const padding = 45; // 增加内边距，提升呼吸感
    const qrSize = 85; // 二维码大小调整
    
    // 布局位置计算
    const qrX = width - qrSize - 35; // 二维码X坐标（右侧，增加边距）
    const qrY = height - qrSize - 35; // 二维码Y坐标（底部，增加边距）
    const dateY = qrY; // 日期位置与二维码同一水平线
    const contentY = padding + 50; // 文案内容位置（顶部居中）
    let fromY = contentY; // 来源信息位置，将在绘制文案后动态调整

    // 背景 - 优化渐变效果和装饰元素
    // 1. 绘制更柔和的渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#fefefe');
    gradient.addColorStop(0.5, '#f8f9fa');
    gradient.addColorStop(1, '#f0f2f5');
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, width, height);
    
    // 2. 绘制更精致的装饰元素
    // 顶部装饰
    ctx.setFillStyle('rgba(255, 193, 7, 0.1)');
    ctx.beginPath();
    ctx.arc(width / 2, -50, 150, 0, 2 * Math.PI);
    ctx.fill();
    
    // 底部装饰
    ctx.setFillStyle('rgba(54, 162, 235, 0.1)');
    ctx.beginPath();
    ctx.arc(width / 2, height + 50, 150, 0, 2 * Math.PI);
    ctx.fill();
    
    // 3. 绘制精致的线条装饰
    ctx.setStrokeStyle('rgba(108, 117, 125, 0.1)');
    ctx.setLineWidth(1);
    // 水平线条
    for (let i = 0; i < 3; i++) {
      const y = padding + (height - 2 * padding) * (i + 1) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    console.log('背景效果绘制完成:', {bounds: {x: 0, y: 0, width, height}});

    // 文案内容 - 优化排版和字体
    const copywriting = this.data.currentCopywriting;
    if (copywriting && copywriting.text) {
      const text = copywriting.text;
      
      // 根据不同条件设置不同的模板配置（手机端兼容）
      let fontSize, lineHeight, maxCharsPerLine, fontType, isBold;
      
      // 模板1：短文本（适合诗歌、短句）- 使用优雅字体
      if (text.length <= 50) {
        fontSize = 25;
        lineHeight = 38;
        maxCharsPerLine = 14;
        fontType = 'elegant';
        isBold = true; // 短文本使用加粗
      }
      // 模板2：中等长度文本（适合段落、文章）- 使用传统字体
      else if (text.length <= 150) {
        fontSize = 22;
        lineHeight = 34;
        maxCharsPerLine = 16;
        fontType = 'classic';
        isBold = false;
      }
      // 模板3：长文本（适合长文章、故事）- 使用正文字体
      else {
        fontSize = 20;
        lineHeight = 30;
        maxCharsPerLine = 18;
        fontType = 'body';
        isBold = false;
      }
      
      // 使用兼容性字体设置方法
      this.setCanvasFont(ctx, fontSize, fontType, isBold);
      
      // 根据字体类型设置合适的颜色（提升视觉效果）
      const colorPalette = {
        elegant: '#2c3e50',   // 优雅字体使用深蓝色，文艺感
        classic: '#34495e',   // 传统字体使用深灰色，正式感
        body: '#2d3748',      // 正文字体使用中性深灰色，易读性
        title: '#1a202c'      // 标题字体使用最深的灰色，突出显示
      };
      
      const textColor = colorPalette[fontType] || '#2d3748';
      ctx.setFillStyle(textColor);
      ctx.setTextAlign('center'); // 文案居中显示
      
      // 绘制文案内容，支持换行
      let currentY = contentY;
      let startIndex = 0;
      const maxContentWidth = width - 2 * padding;
      
      while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, text.length);
        
        // 尝试在标点符号处换行，提升排版美观度（手机端兼容）
        if (endIndex < text.length) {
          // 使用字符串方法代替正则表达式，提高兼容性
          const punctuationChars = ['，', '。', '！', '？', '；', '：', ',', '.', '!', '?', ';', ':'];
          let lastPunctuationIndex = -1;
          
          // 从后向前查找标点符号
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
        
        // 检查当前行是否超出宽度
        let lineText = text.substring(startIndex, endIndex);
        let lineWidth = ctx.measureText(lineText).width;
        
        // 如果超出宽度，逐字减少直到符合宽度
        while (lineWidth > maxContentWidth && endIndex > startIndex) {
          endIndex--;
          lineText = text.substring(startIndex, endIndex);
          lineWidth = ctx.measureText(lineText).width;
        }
        
        ctx.fillText(lineText, width / 2, currentY); // 居中显示
        startIndex = endIndex;
        currentY += lineHeight;
        
        // 确保内容不会超出画布高度
        if (currentY > height - padding - 200) { // 增加空间以容纳日期信息和二维码
          // 超出高度，显示省略号
          ctx.setTextAlign('center');
          ctx.fillText('...', width / 2, currentY);
          currentY += lineHeight;
          break;
        }
      }
      
      // 动态调整来源信息位置
      fromY = currentY + 20; // 在文案内容下方20px
      
      console.log('文案内容绘制完成:', {position: {x: width / 2, y: contentY}, text: text.substring(0, 50) + '...', fontSize: fontSize, endY: currentY});
    }

    // 来源信息 - 优化样式（手机端兼容）
    if (copywriting && copywriting.from && copywriting.from !== '佚名') {
      // 使用优雅字体，斜体效果
      this.setCanvasFont(ctx, 16, 'elegant', false, true);
      ctx.setFillStyle('#8a9aaf'); // 更柔和的蓝灰色，与整体配色协调
      ctx.setTextAlign('center'); // 来源信息居中显示
      ctx.fillText('—— ' + copywriting.from, width / 2, fromY + 5); // 调整位置，跟随文案内容
      console.log('来源信息绘制完成:', {position: {x: width / 2, y: fromY + 5}, from: copywriting.from});
    }

    // 日期信息 - 放在二维码中间线的上下，星期和天干地支同一行
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[now.getDay()];
    const solar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const lunarDate = solar.getLunar();
    const ganzhi = lunarDate.getYearInGanZhi(); // 获取天干地支
    
    // 计算二维码中间线位置
    const qrCenterY = qrY + qrSize / 2;
    
    // 日期信息 - 左下角显示，年月日在二维码中间线上方，星期和天干地支在下方
    ctx.setTextAlign('left'); // 日期信息左对齐
    
    // 日期标题 - 使用清晰字体，放在二维码中间线上方
    this.setCanvasFont(ctx, 14, 'title', true);
    ctx.setFillStyle('#4a5568');
    ctx.fillText(dateStr, padding, qrCenterY - 20);
    
    // 星期和天干地支信息 - 同一行显示，放在二维码中间线下方
    this.setCanvasFont(ctx, 12, 'body');
    ctx.setFillStyle('#718096');
    const weekAndGanzhiText = `星期${weekDay} ${ganzhi}`;
    ctx.fillText(weekAndGanzhiText, padding, qrCenterY + 5);
    
    console.log('日期信息绘制完成（左下角）:', {date: dateStr, weekAndGanzhi: weekAndGanzhiText, position: {x: padding, y: qrCenterY}});

    // 加载并绘制二维码 - 优化位置和样式
    if (isHarmonyOS) {
      // 鸿蒙平台继续使用原来的方式
      const canvas = this.$element('cvs1');
      if (canvas) {
        const img = new Image();
        img.onload = () => {
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            // 绘制二维码背景
            ctx2d.setFillStyle('#ffffff');
            ctx2d.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
            // 绘制二维码
            ctx2d.drawImage(img, qrX, qrY, qrSize, qrSize);
            console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});
            
            // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据，指定PNG格式
            console.log('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
            const imageData = canvas.toDataURL('image/png');
            console.log('生成的图片数据长度:', imageData ? imageData.length : 0, '前100字符:', imageData ? imageData.substring(0, 100) : 'null');
            
            if (!imageData || !imageData.startsWith('data:image/png')) {
              console.error('生成的图片数据格式不正确:', imageData ? imageData.substring(0, 50) : 'null');
              platform.showToast({
                title: '生成图片数据失败'
              });
              return;
            }
            
            // 保存图片到相册 - 使用增强的权限校验
            platform.saveImageToAlbum(imageData, 
              function() {
                console.log("保存相册成功");
                platform.showToast({
                  title: '保存成功'
                });
              },
              function(data, code) {
                console.log("保存到相册失败", { code, data, dataType: typeof data });
                // 增强的权限处理已经在saveImageToAlbum函数中实现
                // 这里只显示通用错误提示
                platform.showToast({
                  title: '保存失败，请重试'
                });
              }
            );
          }
        };
        img.src = '/images/mini.png';
        console.log('二维码加载开始:', {source: '/images/mini.png', target: {x: qrX, y: qrY, size: qrSize}, exists: true});
      }
    } else {
      // 在微信小程序平台，直接使用路径绘制二维码
      console.log('开始绘制二维码');
      // 绘制二维码背景
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
      // 绘制二维码
      ctx.drawImage('/images/mini.png', qrX, qrY, qrSize, qrSize);
      console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});
      
      // 绘制完成后执行保存
      ctx.draw(false, function() {
        console.log('开始执行保存操作');
        // 在微信小程序平台
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: width,
          height: height,
          quality: 1,
          canvasId: 'cvs1',
          destWidth: width * (systemInfo.pixelRatio / 2),
          destHeight: height * (systemInfo.pixelRatio / 2),
          success: (res) => {
            console.log('canvasToTempFilePath成功:', res);
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

  /**
   * 绘制文本（支持换行）
   */
  drawText(ctx, str, leftWidth, initHeight, titleHeight, canvasWidth) {
    var lineWidth = 0;
    var linespace = this.data.linespace; //设置成30
    var lastSubStrIndex = 0; //每次开始截取的字符串的索引
    for (let i = 0; i < str.length; i++) {
      lineWidth += ctx.measureText(str[i]).width;
      if (lineWidth > canvasWidth) {
        ctx.fillText(str.substring(lastSubStrIndex, i), leftWidth, initHeight); //绘制截取部分
        initHeight += 25; //字体的高度
        lineWidth = 0;
        lastSubStrIndex = i;
        titleHeight += linespace;
      }
      if (i == str.length - 1) { //绘制剩余部分
        ctx.fillText(str.substring(lastSubStrIndex, i + 1), leftWidth, initHeight);
      }
    }
    // 标题border-bottom 线距顶部距离
    titleHeight = titleHeight + linespace;
    return titleHeight
  }
});