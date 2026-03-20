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
            title: '复制成功',
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
    const dateY = padding + 35; // 日期位置
    const contentY = dateY + 90; // 文案内容位置（调整空间以适应新的日期信息布局）
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

    // 日期信息 - 优化字体和布局
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[now.getDay()];
    const solar = Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const lunarDate = solar.getLunar();
    const lunarDateStr = `${lunarDate.getYear()}年${lunarDate.getMonth()}月${lunarDate.getDay()}日`;
    const ganzhi = lunarDate.getYearInGanZhi(); // 获取天干地支
    
    // 检查是否为节日
    let holidayInfo = '';
    
    // 固定节日
    const fixedHolidays = {
      '1-1': '元旦',
      '2-14': '情人节',
      '3-8': '妇女节',
      '3-12': '植树节',
      '4-1': '愚人节',
      '4-5': '清明节',
      '5-1': '劳动节',
      '5-4': '青年节',
      '5-12': '护士节',
      '6-1': '儿童节',
      '7-1': '建党节',
      '8-1': '建军节',
      '9-10': '教师节',
      '10-1': '国庆节',
      '12-25': '圣诞节'
    };
    
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateKey = `${month}-${day}`;
    
    // 检查固定节日
    if (fixedHolidays[dateKey]) {
      holidayInfo = `今日 ${fixedHolidays[dateKey]}`;
    } else {
      // 检查农历节日
      const lunarMonth = lunarDate.getMonth();
      const lunarDay = lunarDate.getDay();
      
      // 春节
      if (lunarMonth === 1 && lunarDay === 1) {
        holidayInfo = '今日 春节';
      } 
      // 元宵节
      else if (lunarMonth === 15 && lunarDay === 1) {
        holidayInfo = '今日 元宵节';
      } 
      // 端午节
      else if (lunarMonth === 5 && lunarDay === 5) {
        holidayInfo = '今日 端午节';
      } 
      // 中秋节
      else if (lunarMonth === 8 && lunarDay === 15) {
        holidayInfo = '今日 中秋节';
      }
      // 除夕
      else if (Math.abs(lunarMonth) === 12 && lunarDay >= 29) {
        const nextDay = lunarDate.next(1);
        if (lunarDate.getYear() !== nextDay.getYear()) {
          holidayInfo = '今日 除夕';
        }
      }
    }
    
    // 检查节气
    const jieQi = lunarDate.getJieQi();
    if (jieQi && !holidayInfo) {
      // 节气映射
      const jieQiMap = {
        'LI_CHUN': '立春',
        'YU_SHUI': '雨水',
        'JING_ZHE': '惊蛰',
        'CHUN_FEN': '春分',
        'QING_MING': '清明',
        'GU_YU': '谷雨',
        'LI_XIA': '立夏',
        'XIAO_MAN': '小满',
        'MANG_ZHONG': '芒种',
        'XIA_ZHI': '夏至',
        'XIAO_SHU': '小暑',
        'DA_SHU': '大暑',
        'LI_QIU': '立秋',
        'CHU_SHU': '处暑',
        'BAI_LU': '白露',
        'QIU_FEN': '秋分',
        'HAN_LU': '寒露',
        'SHUANG_JIANG': '霜降',
        'LI_DONG': '立冬',
        'XIAO_XUE': '小雪',
        'DA_XUE': '大雪',
        'DONG_ZHI': '冬至',
        'XIAO_HAN': '小寒',
        'DA_HAN': '大寒'
      };
      
      if (jieQiMap[jieQi]) {
        holidayInfo = `今日 ${jieQiMap[jieQi]}`;
      }
    }
    
    // 日期标题
    ctx.font = 'bold 15px 微软雅黑, Microsoft YaHei, sans-serif'; // 加粗，减小字体
    ctx.setFillStyle('#5a6c7d'); // 稍深的灰色
    if (holidayInfo) {
      // 检查节日信息长度
      const holidayWidth = ctx.measureText(holidayInfo).width;
      const maxWidth = width - 2 * padding;
      if (holidayWidth > maxWidth) {
        // 如果节日信息太长，减小字体
        ctx.font = 'bold 14px 微软雅黑, Microsoft YaHei, sans-serif';
      }
      ctx.fillText(holidayInfo, padding, dateY - 28);
    } else {
      ctx.fillText('今日', padding, dateY - 28);
    }
    
    // 日期详情
    ctx.font = '16px 宋体, STSong, SimSun, serif'; // 减小字体
    ctx.setFillStyle('#495057'); // 深灰色日期信息
    
    // 优化日期信息排版，确保不超出屏幕
    const maxDateWidth = width - 2 * padding;
    
    // 绘制公历日期
    const dateWidth = ctx.measureText(dateStr).width;
    if (dateWidth > maxDateWidth) {
      // 如果日期太长，减小字体
      ctx.font = '15px 宋体, STSong, SimSun, serif';
    }
    ctx.fillText(dateStr, padding, dateY);
    
    // 绘制星期
    ctx.font = '15px 宋体, STSong, SimSun, serif';
    ctx.fillText(`星期${weekDay}`, padding, dateY + 22);
    
    // 绘制农历日期
    const lunarText = `农历：${lunarDateStr}`;
    const lunarWidth = ctx.measureText(lunarText).width;
    if (lunarWidth > maxDateWidth) {
      // 如果农历日期太长，调整字体大小
      ctx.font = '14px 宋体, STSong, SimSun, serif';
    }
    ctx.fillText(lunarText, padding, dateY + 44);
    
    // 绘制天干地支
    const ganzhiText = `干支：${ganzhi}`;
    const ganzhiWidth = ctx.measureText(ganzhiText).width;
    if (ganzhiWidth > maxDateWidth) {
      // 如果天干地支太长，调整字体大小
      ctx.font = '13px 宋体, STSong, SimSun, serif';
    }
    ctx.fillText(ganzhiText, padding, dateY + 66);
    
    console.log('日期信息绘制完成:', {date: dateStr, weekDay: weekDay, lunarDate: lunarDateStr, ganzhi: ganzhi, holiday: holidayInfo});

    // 文案内容 - 优化排版和字体
    const copywriting = this.data.currentCopywriting;
    if (copywriting && copywriting.text) {
      const text = copywriting.text;
      
      // 根据不同条件设置不同的模板配置
      let fontSize, lineHeight, maxCharsPerLine, fontFamily;
      
      // 模板1：短文本（适合诗歌、短句）
      if (text.length <= 50) {
        fontSize = 25;
        lineHeight = 38;
        maxCharsPerLine = 14;
        fontFamily = '楷体, STKaiti, KaiTi, serif'; // 适合诗歌、短句的字体
        // 使用加粗字体
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
      }
      // 模板2：中等长度文本（适合段落、文章）
      else if (text.length <= 150) {
        fontSize = 22;
        lineHeight = 34;
        maxCharsPerLine = 16;
        fontFamily = '宋体, STSong, SimSun, serif'; // 适合正式文章的字体
        ctx.font = `${fontSize}px ${fontFamily}`;
      }
      // 模板3：长文本（适合长文章、故事）
      else {
        fontSize = 20;
        lineHeight = 30;
        maxCharsPerLine = 18;
        fontFamily = '微软雅黑, Microsoft YaHei, sans-serif'; // 适合长文本阅读的字体
        ctx.font = `${fontSize}px ${fontFamily}`;
      }
      ctx.setFillStyle('#212529'); // 更深色的文本，提升可读性
      ctx.setTextAlign('left');
      
      // 绘制文案内容，支持换行
      let currentY = contentY;
      let startIndex = 0;
      const maxContentWidth = width - 2 * padding;
      
      while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, text.length);
        
        // 尝试在标点符号处换行，提升排版美观度
        if (endIndex < text.length) {
          const lastPunctuationIndex = text.lastIndexOf(/[，。！？；：]/, endIndex);
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
        
        ctx.fillText(lineText, padding, currentY);
        startIndex = endIndex;
        currentY += lineHeight;
        
        // 确保内容不会超出画布高度
        if (currentY > height - padding - 150) { // 增加空间以容纳来源信息和二维码
          // 超出高度，显示省略号
          ctx.fillText('...', padding, currentY);
          currentY += lineHeight;
          break;
        }
      }
      
      // 动态调整来源信息位置
      fromY = currentY + 20; // 在文案内容下方20px
      
      console.log('文案内容绘制完成:', {position: {x: padding, y: contentY}, text: text.substring(0, 50) + '...', fontSize: fontSize, endY: currentY});
    }

    // 来源信息 - 优化样式
    if (copywriting && copywriting.from && copywriting.from !== '佚名') {
      // 使用 ctx.font 设置字体
      ctx.font = 'italic 16px 楷体, STKaiti, KaiTi, serif'; // 斜体
      ctx.setFillStyle('#667788'); // 稍深的灰色
      ctx.setTextAlign('right');
      ctx.fillText('—— ' + copywriting.from, width - padding, fromY + 5); // 调整位置
      console.log('来源信息绘制完成:', {position: {x: width - padding, y: fromY + 5}, from: copywriting.from});
    }

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