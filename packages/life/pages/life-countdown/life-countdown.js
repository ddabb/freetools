// packages/life/pages/life-countdown/life-countdown.js
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
          console.debug('存储成功');
        },
        fail: function(data, code) {
          console.debug('存储失败', code, data);
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
          console.debug('获取存储失败', code, data);
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
          console.debug('清除存储成功');
        },
        fail: function(data, code) {
          console.debug('清除存储失败', code, data);
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
          console.debug('获取设备信息失败', code, data);
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
          console.debug('获取设备信息失败', err);
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
          console.debug('分享成功');
        },
        fail: function(data, code) {
          console.debug('分享失败', code, data);
        }
      });
    } else {
      // 微信小程序分享由系统处理
      console.debug('微信分享');
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
    birthDate: '', // 出生日期
    expectedLifeYears: 75, // 预计寿命（岁） 调整为更现实的数值
    showResult: false, // 是否显示结果
    daysLived: 0, // 已活天数
    lifeLeft: 0, // 剩余预期寿命
    progress: 0, // 人生进度百分比
    totalGrids: 900, // 总格子数 (30×30)
    livedGrids: 0, // 已度过的格子数
    gridPercentage: 0, // 格子填充百分比
    gridRows: 30, // 网格行数
    gridCols: 30, // 网格列数
    rowsArray: [], // 行数组用于循环
    colsArray: [], // 列数组用于循环

    currentYear: new Date().getFullYear(), // 当前年份
    qrcodesize: 100,
    canvaswidth: 376,
    canvasheight: 730, // 调整为700px，提供合适空间
    linespace: 30,
    // 人生思考引导问题
    questions: [
      {
        text: "如果生命只剩下一年，你最想做什么？",
        hint: "静下心来，认真思考这个问题。生命有限，别让时光在无意识中溜走。"
      },
      {
        text: "什么让你感到真正的快乐和满足？",
        hint: "真正的幸福往往来自内心深处的满足感。"
      },
      {
        text: "你是否在为自己而活，还是活在别人的期待里？",
        hint: "勇敢地活出真实的自己，而不是被他人定义。"
      },
      {
        text: "有什么事情是你一直想做却迟迟未行动的？",
        hint: "别让犹豫成为你人生的遗憾。"
      },
      {
        text: "你希望被记住的是一个怎样的人？",
        hint: "思考你留给世界的印记。"
      },
      {
        text: "什么是你愿意为之奋斗一生的目标？",
        hint: "找到你的使命，为之全力以赴。"
      },
      {
        text: "你最近一次因为专注而忘记时间是什么时候？",
        hint: "那种沉浸其中的感觉就是真正的热爱。"
      },
      {
        text: "如果金钱不是问题，你会如何度过余生？",
        hint: "这能帮助你发现真正重要的事情。"
      },
      {
        text: "你觉得自己最大的天赋或优势是什么？",
        hint: "认识并发挥你的独特之处。"
      },
      {
        text: "你想给这个世界留下什么？",
        hint: "思考你的人生价值和贡献。"
      }
    ],
    currentIndex: 0
  },

  // 设置出生日期
  setBirthDate(e) {
    const selectedDate = e.detail.value;
    console.debug('设置出生日期:', selectedDate);
    this.setData({
      birthDate: selectedDate
    });
  },

  // 设置预计寿命
  setExpectedLifeYears(e) {
    const inputValue = e.detail.value;
    if (inputValue === '') {
      // 允许清空输入�?
      this.setData({
        expectedLifeYears: ''
      });
      return;
    }
    const value = parseInt(inputValue);
    if (isNaN(value) || value < 1 || value > 120) {
      platform.showToast({
        title: '预期寿命应在1-120岁之间'
      });
      return;
    }
    this.setData({
      expectedLifeYears: value
    });
  },

  // 计算人生A4�?
  calculate() {
    const { birthDate, expectedLifeYears = 75 } = this.data;
    console.debug('计算开始，当前数据:', { birthDate, expectedLifeYears });
    
    if (!birthDate) {
      platform.showToast({
        title: '请输入出生日期'
      });
      return;
    }

    const today = new Date();
    const birth = new Date(birthDate);

    // 验证出生日期是否有效
    if (isNaN(birth.getTime())) {
      platform.showToast({
        title: '出生日期格式错误'
      });
      return;
    }

    // 检查出生日期是否是未来日期
    if (birth > today) {
      platform.showToast({
        title: '出生日期不能是未来日期'
      });
      return;
    }

    // 验证预期寿命范围
    const finalExpectedLife = expectedLifeYears || 75;
    if (finalExpectedLife < 1 || finalExpectedLife > 120) {
      platform.showToast({
        title: '预期寿命应在1-120岁之间'
      });
      return;
    }

    try {
      console.debug('=== 人生格子计算开�?===');
      console.debug('出生日期:', birthDate);
      console.debug('预期寿命:', finalExpectedLife, '岁');
      console.debug('当前日期:', today.toISOString());

      // 计算已活天数（精确到小数位
      const preciseDaysLived = (today - birth) / (1000 * 60 * 60 * 24);
      const daysLived = Math.floor(preciseDaysLived);
      console.debug('精确已活天数:', preciseDaysLived);
      console.debug('已活天数:', daysLived);

      // 计算预期寿命总天数
      const expectedLifeTotal = finalExpectedLife * 365.25;
      const lifeLeft = Math.max(0, Math.floor(expectedLifeTotal - preciseDaysLived));
      console.debug('预期寿命总天数', expectedLifeTotal);
      console.debug('剩余天数:', lifeLeft);

      // 计算人生进度百分比
      const progress = Math.min(100, Math.round((preciseDaysLived / expectedLifeTotal) * 10000) / 100);
      console.debug('人生进度百分比', progress, '%');

      // 精确计算900个格子的填充情况
      // 每个格子代表：总寿命天数 ÷ 900
      const daysPerGrid = expectedLifeTotal / this.data.totalGrids;
      console.debug('总格子数:', this.data.totalGrids);
      console.debug('每格代表天数:', daysPerGrid);
      
      // 使用精确计算，确保格子数量正确
      const livedGrids = Math.min(this.data.totalGrids, Math.ceil(preciseDaysLived / daysPerGrid));
      const gridPercentage = Math.min(100, Math.round((livedGrids / this.data.totalGrids) * 10000) / 100);
      console.debug('已填充格子数:', livedGrids);
      console.debug('格子百分比', gridPercentage, '%');

      // 检查计算结果是否合理
      if (livedGrids > this.data.totalGrids) {
        console.error('警告: 已填充格子数超过总格子数', { livedGrids, totalGrids: this.data.totalGrids });
      }
      if (gridPercentage > 100) {
        console.error('警告: 格子百分比超过100%', { gridPercentage });
      }

// 计算每格代表的天数文本
      let daysPerGridText = '2.67天'; // 默认值
      
      if (finalExpectedLife && this.data.totalGrids && finalExpectedLife > 0 && this.data.totalGrids > 0) {
        const expectedLifeTotal = finalExpectedLife * 365.25;
        const daysPerGrid = (expectedLifeTotal / this.data.totalGrids);
        daysPerGridText = `${daysPerGrid.toFixed(3)}天`;
      }
      
      console.debug('每格代表天数文本:', daysPerGridText);

      // 设置初始问题索引
      const randomIndex = Math.floor(Math.random() * this.data.questions.length);
      this.setData({
        currentIndex: randomIndex
      });
      console.debug('随机问题索引:', randomIndex);

      // 确保数组已初始化
      this.initArrays();

      // 更新结果
      this.setData({
        showResult: true,
        daysLived,
        lifeLeft,
        progress,
        livedGrids,
        gridPercentage,
        daysPerGridText, // 添加这个字段
        currentIndex: 0
      });

      // 保存数据到本地存储
      this.saveData();

      console.debug('=== 人生格子计算结束 ===');

    } catch (error) {
      console.error('计算失败', error);
      platform.showToast({
        title: '计算失败，请重试'
      });
    }
  },

  // 重置
  reset() {
    this.setData({
      birthDate: '',
      expectedLifeYears: 75,
      showResult: false,
      daysLived: 0,
      lifeLeft: 0,
      progress: 0,
      livedGrids: 0,
      gridPercentage: 0,
      randomQuestion: ''
    });
    // 清除本地存储
    platform.removeStorage('lifeCountdownData');
  },

  // 保存数据到本地存储
  saveData() {
    const { birthDate, expectedLifeYears } = this.data;
    platform.setStorage('lifeCountdownData', { birthDate, expectedLifeYears });
  },

  // 从本地存储加载数据
  loadData() {
    platform.getStorage('lifeCountdownData', (data) => {
      if (data) {
        try {
          // 确保expectedLifeYears有�?
          const finalExpectedLife = data.expectedLifeYears || 75;
          
          this.setData({
            birthDate: data.birthDate || '',
            expectedLifeYears: finalExpectedLife
          });
          
          // 如果有数据，自动计算
          if (data.birthDate) {
            this.calculate();
          }
        } catch (error) {
          console.error('解析存储数据失败', error);
          this.setDefaultData();
        }
      } else {
        this.setDefaultData();
      }
    });
  },
  
  // 设置默认数据
  setDefaultData() {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const defaultBirthDate = tenYearsAgo.toISOString().split('T')[0];
    
    this.setData({
      birthDate: defaultBirthDate,
      expectedLifeYears: 75
    });
    
    this.calculate();
  },

  // 切换到下一个问题
  nextQuestion() {
    const newIndex = (this.data.currentIndex + 1) % this.data.questions.length;
    this.setData({
      currentIndex: newIndex
    });
  },

  // 切换到上一个问题
  prevQuestion() {
    const newIndex = (this.data.currentIndex - 1 + this.data.questions.length) % this.data.questions.length;
    this.setData({
      currentIndex: newIndex
    });
  },

  // 自动轮播（可选）
  startAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    // 捕获当前this的引用
    const self = this;
    const timerId = setInterval(() => {
      // 安全检查：确保self存在
      if (!self) {
        clearInterval(timerId);
        return;
      }
      try {
        self.nextQuestion();
      } catch (error) {
        console.error('自动轮播出错:', error);
        clearInterval(timerId);
        if (self.autoPlayTimer === timerId) {
          self.autoPlayTimer = null;
        }
      }
    }, 5000); // 5秒切换一次
    this.autoPlayTimer = timerId;
  },

  // 停止自动轮播
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  },

  // 分享功能
  share() {
    platform.share({
      title: '人生格子 - 每一格都是生命的珍贵时光',
      content: '感知时间流逝，思考生命意义',
      imageUrl: ''
    });
  },


  // 初始化数据
  initArrays() {
    const { gridRows, gridCols } = this.data;
    const rowsArray = Array.from({ length: gridRows }, (_, index) => index);
    const colsArray = Array.from({ length: gridCols }, (_, index) => index);
    console.debug('初始化数�?', { gridRows, gridCols, rowsArray: rowsArray.length, colsArray: colsArray.length });
    this.setData({
      rowsArray,
      colsArray
    });
  },



  // 获取每格代表的天数文本
  getDaysPerGridText() {
    // 这个函数现在主要是为了兼容性，实际数据通过 daysPerGridText 属性提供
    console.debug('getDaysPerGridText 被调用，当前数据:', this.data);
    const { daysPerGridText } = this.data;
    
    if (!daysPerGridText) {
      console.debug('getDaysPerGridText: 没有找到 daysPerGridText，返回默认值');
      return '2.67天';
    }
    
    return daysPerGridText;
  },

  // 格子点击事件
  onGridTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const { livedGrids } = this.data;
    
    // 如果点击的是正在经历的格子，显示提示
    if (index === livedGrids - 1 && livedGrids > 0) {
      platform.showToast({
        title: '这就是你现在正在经历的时光！'
      });
    }
  },

  // 页面显示时执�?
  onShow() {
    this.startAutoPlay();
  },

  // 页面隐藏时执�?
  onHide() {
    this.stopAutoPlay();
  },

  // 页面卸载时执�?
  onUnload() {
    this.stopAutoPlay();
  },

  // 页面数据更新时执行
  onReady() {
    console.debug('页面准备就绪');
    // 不再重复调用 initArrays，onInit 中已经调用过
  },

  // 页面加载时执行
  onInit() {
    this.initArrays();
    
    // 从本地存储加载数据
    this.loadData();
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
      // 在微信小程序平台，使用新�?D Canvas API
      try {
        const query = wx.createSelectorQuery().in(this);
        query.select('#cvs1')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0] || !res[0].node) {
              console.error('获取Canvas元素失败');
              platform.showToast({
                title: '获取画布失败，请重试'
              });
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getSystemInfoSync().pixelRatio;

            // 设置高清canvas尺寸
            canvas.width = this.data.canvaswidth * dpr;
            canvas.height = this.data.canvasheight * dpr;
            ctx.scale(dpr, dpr);

            this.MergeImage(ctx);
          });
      } catch (error) {
        console.error('创建Canvas上下文失�?', error);
        platform.showToast({
          title: '创建画布失败，请重试'
        });
      }
    }
  },

  /**
   * 绘制分享图片 - 所见即所得版本
   */
  MergeImage(ctx) {
    let that = this;
    
    console.debug('开始获取系统信息');
    
    // 直接使用默认值，不依赖系统信息
    console.debug('使用默认系统信息');
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };
    
    console.debug('系统信息:', systemInfo);
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    console.debug('画布尺寸:', { width, height });

    const padding = 30; // 页面内边距
    const gridRows = 30;
    const gridCols = 30;
    const gridCellSize = 10; // 格子大小
    const gridGap = 1; // 格子间距
    const qrSize = 100; // 二维码大小
    
    // 计算格子实际尺寸
    const gridCellTotalSize = gridCellSize + gridGap;
    const gridWidth = gridCols * gridCellTotalSize;
    const gridHeight = gridRows * gridCellTotalSize;
    
    // 布局位置计算
    const qrX = width - qrSize - 20; // 二维码X坐标（右侧）
    const qrY = padding + 10; // 二维码Y坐标（顶部，靠近内边距）
    const titleY = padding + 20; // 标题位置
    const subtitleY = titleY + 30; // 副标题位置
    const birthDateY = subtitleY + 30; // 出生日期信息位置
    const expectedLifeY = birthDateY + 25; // 预期寿命信息位置
    const statsY = expectedLifeY + 30; // 统计信息区域起始位置
    const gridSectionTop = statsY + 80; // 格子区域顶部位置，确保不与统计信息重叠
    const gridSectionHeight = gridHeight; // 格子区域高度，使用实际计算值
    const gridStartX = padding; // 格子起始X
    const gridStartY = gridSectionTop; // 格子起始Y
    
    // 计算元素边界
    const gridEndX = gridStartX + gridWidth;
    const gridEndY = gridStartY + gridHeight;
    const gridInfoY = gridEndY + 20; // 格子信息文本位置
    const daysInfoY = gridInfoY + 20; // 每格代表天数位置
    const legendY = daysInfoY + 30; // 图例位置，确保不与格子信息重叠
    const questionY = legendY + 40; // 人生思考问题位置，确保不与图例重叠

    console.debug('=== 图片生成布局分析 ===');
    console.debug('调整后画布尺寸', {width, height});
    console.debug('内边距', padding);
    console.debug('格子区域位置:', {top: gridSectionTop, height: gridSectionHeight});
    console.debug('格子网格配置:', {rows: gridRows, cols: gridCols, cellSize: gridCellSize, gap: gridGap, actualWidth: gridWidth, actualHeight: gridHeight});
    console.debug('二维码位置', {x: qrX, y: qrY, size: qrSize});
    console.debug('格子起始坐标:', {x: gridStartX, y: gridStartY});
    console.debug('格子区域结束坐标:', {x: gridEndX, y: gridEndY});
    console.debug('二维码区域', {x: qrX, y: qrY, width: qrSize, height: qrSize});
    console.debug('图例位置:', {y: legendY});
    console.debug('格子信息文本位置:', {y: gridInfoY});
    console.debug('出生日期信息位置:', {y: birthDateY});
    console.debug('预期寿命信息位置:', {y: expectedLifeY});
    console.debug('人生思考问题位置', {y: questionY});
    
    // 检查是否有重叠风险
    const overlapCheck = {
      gridVsQr: gridEndX > qrX || gridEndY > qrY,
      gridVsLegend: gridEndY > legendY - 20,
      textVsGrid: gridSectionTop - 70 < gridStartY,
      legendVsQr: legendY + 30 > qrY,
      questionVsBottom: questionY + 60 > height - padding // 确保底部有留白
    };
    console.debug('重叠检查', overlapCheck);

    // 背景色- 使用更舒适的配色方案
    ctx.fillStyle = '#f8f9fa'; // 使用更现代的浅灰色背景，更舒适
    ctx.fillRect(0, 0, width, height);
    console.debug('背景色填充完成', {color: '#f8f9fa', bounds: {x: 0, y: 0, width, height}});

    // 标题 - 使用更现代的样式
    ctx.font = '26px Montserrat, Roboto, sans-serif';
    ctx.fillStyle = '#2c3e50'; // 深灰色标题，更专业
    ctx.fillText('人生A4纸', padding, titleY);
    console.debug('标题绘制完成:', {text: '人生A4纸', position: {x: padding, y: titleY}});

    // 副标题- 使用更现代的样式
    ctx.font = '16px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#7f8c8d'; // 中灰色副标题，更柔和
    ctx.fillText('900个格子，见证生命的成长~', padding, subtitleY);
    console.debug('副标题绘制完成', {text: '900个格子，见证生命的成长~', position: {x: padding, y: subtitleY}});

    // 出生日期信息
    ctx.font = '16px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('出生日期:', padding, birthDateY);
    ctx.font = '16px Roboto, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#3498db'; // 蓝色强调，更醒目
    ctx.fillText(this.data.birthDate || '未知', padding + 100, birthDateY);
    console.debug('出生日期信息绘制完成:', {position: {x: padding, y: birthDateY}, date: this.data.birthDate});

    // 预期寿命信息
    ctx.font = '16px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('预期寿命:', padding, expectedLifeY);
    ctx.font = '16px Roboto, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText(this.data.expectedLifeYears + ' 年', padding + 100, expectedLifeY);
    console.debug('预期寿命信息绘制完成:', {position: {x: padding, y: expectedLifeY}, years: this.data.expectedLifeYears});

    // 统计信息区域
    console.debug('统计信息区域起始位置:', statsY);
    
    // 已活天数
    ctx.font = '18px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('已活天数:', padding, statsY);
    ctx.font = '16px Roboto, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText(this.data.daysLived + ' 天', padding + 100, statsY);
    console.debug('已活天数绘制完成:', {position: {x: padding, y: statsY}});

    // 剩余天数
    ctx.font = '18px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('剩余天数:', padding, statsY + 25);
    ctx.font = '16px Roboto, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText(this.data.lifeLeft + ' 天', padding + 100, statsY + 25);
    console.debug('剩余天数绘制完成:', {position: {x: padding, y: statsY + 25}});

    // 人生进度
    ctx.font = '18px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('人生进度:', padding, statsY + 50);
    ctx.font = '16px Roboto, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText(this.data.progress + '%', padding + 100, statsY + 50);
    console.debug('人生进度绘制完成:', {position: {x: padding, y: statsY + 50}});

    // 绘制格子网格 - 所见即所�?
    const totalGrids = this.data.totalGrids;
    const livedGrids = Math.min(this.data.livedGrids, totalGrids);
    const expectedLifeYears = this.data.expectedLifeYears || 75;
    console.debug('格子绘制开�?', {total: totalGrids, lived: livedGrids});
    
    // 添加调试信息
    console.debug('网格配置:', {
      gridRows: this.data.gridRows, 
      gridCols: this.data.gridCols,
      gridCellSize, 
      gridGap,
      gridStartX, 
      gridStartY,
      livedGrids,
      expectedLivedGrids: Math.ceil((this.data.daysLived / (expectedLifeYears * 365.25)) * totalGrids)
    });
    
    for (let i = 0; i < this.data.gridRows; i++) {
      for (let j = 0; j < this.data.gridCols; j++) {
        const index = i * this.data.gridCols + j;
        const x = gridStartX + j * (gridCellSize + gridGap);
        const y = gridStartY + i * (gridCellSize + gridGap);

        // 根据格子状态设置颜�?
        if (index < livedGrids - 1) {
          // 已度过的时光 - 使用优化后的颜色
          ctx.fillStyle = '#3498db';
        } else if (index === livedGrids - 1 && livedGrids > 0) {
          // 正在经历 - 使用优化后的颜色
          ctx.fillStyle = '#e74c3c';
        } else {
          // 未来可期 - 使用优化后的颜色
          ctx.fillStyle = '#e0e0e0';
        }

        ctx.fillRect(x, y, gridCellSize, gridCellSize);
        
        // 调试：绘制网格线
        if (i < 2 && j < 2) {
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, gridCellSize, gridCellSize);
        }
      }
    }
    
    // 绘制网格边界
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(gridStartX, gridStartY, 
                  this.data.gridCols * (gridCellSize + gridGap) - gridGap, 
                  this.data.gridRows * (gridCellSize + gridGap) - gridGap);
    
    console.debug('格子网格绘制完成，边界尺�?', {
      width: this.data.gridCols * (gridCellSize + gridGap) - gridGap,
      height: this.data.gridRows * (gridCellSize + gridGap) - gridGap
    });

    // 格子信息文本
    ctx.font = '16px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('人生A4纸：' + livedGrids + '/' + totalGrids + ' 天', padding, gridInfoY);
    
    // 每格代表天数
    ctx.font = '14px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('每格 ' + this.data.daysPerGridText, padding, daysInfoY);
    
    console.debug('格子信息文本绘制完成:', {
      position: {x: padding, y: gridInfoY},
      daysInfoPosition: {x: padding, y: daysInfoY}
    });

    // 绘制图例 - 避免与格子重�?
    console.debug('图例区域位置:', legendY);
    
    // 已度过的时光
    ctx.fillStyle = '#3498db'; // 更现代的蓝色
    ctx.fillRect(padding, legendY, 15, 15);
    ctx.font = '14px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('已度过的时光', padding + 20, legendY + 12);
    
    // 正在经历
    ctx.fillStyle = '#e74c3c'; // 更现代的红色
    ctx.fillRect(padding + 130, legendY, 15, 15);
    ctx.font = '14px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('正在经历', padding + 150, legendY + 12);
    
    // 未来可期
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(padding + 230, legendY, 15, 15);
    ctx.font = '14px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('未来可期', padding + 250, legendY + 12);
    
    console.debug('图例绘制完成:', {position: {x: padding, y: legendY}});

    // 人生思考问�?
    const randomQuestion = this.data.questions[Math.floor(Math.random() * this.data.questions.length)];
    ctx.font = '16px Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('🤔 人生思考：', padding, questionY);
    ctx.font = '14px Open Sans, Inter, Noto Sans SC, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    // 绘制问题文本，支持换行
    let questionText = randomQuestion.text;
    let lineHeight = 20;
    let currentY = questionY + lineHeight;
    let words = questionText.split(' ');
    let line = '';
    
    // 由于wx.createCanvasContext不支持measureText，我们简化处理
    // 假设每行最多显示20个字符
    const maxCharsPerLine = 20;
    let startIndex = 0;
    while (startIndex < questionText.length) {
      let endIndex = Math.min(startIndex + maxCharsPerLine, questionText.length);
      // 尝试在单词边界处换行
      if (endIndex < questionText.length && questionText[endIndex] !== ' ') {
        const lastSpaceIndex = questionText.lastIndexOf(' ', endIndex);
        if (lastSpaceIndex > startIndex) {
          endIndex = lastSpaceIndex;
        }
      }
      const lineText = questionText.substring(startIndex, endIndex);
      ctx.fillText(lineText, padding, currentY);
      startIndex = endIndex + 1;
      currentY += lineHeight;
    }
    console.debug('人生思考问题绘制完成', {position: {x: padding, y: questionY}, question: randomQuestion.text});

    // 加载并绘制二维码
    if (isHarmonyOS) {
      // 鸿蒙平台继续使用原来的方法
      const canvas = this.$element('cvs1');
      if (canvas) {
        const img = new Image();
        img.onload = () => {
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.drawImage(img, qrX, qrY, qrSize, qrSize);
            console.debug('二维码绘制完成', {position: {x: qrX, y: qrY}, size: qrSize});
            
            // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据，指定PNG格式
            console.debug('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
            const imageData = canvas.toDataURL('image/png');
            console.debug('生成的图片数据长度', imageData ? imageData.length : 0, '前100字符:', imageData ? imageData.substring(0, 100) : 'null');
            
            if (!imageData || !imageData.startsWith('data:image/png')) {
              console.error('生成的图片数据格式不正确:', imageData ? imageData.substring(0, 50) : 'null');
              platform.showToast({
                title: '生成图片数据失败'
              });
              return;
            }
            
            // 保存图片到相册- 使用增强的权限校验
            platform.saveImageToAlbum(imageData, 
              function() {
                console.debug("保存相册成功");
                platform.showToast({
                  title: '保存成功'
                });
              },
              function(data, code) {
                console.debug("保存到相册失败", { code, data, dataType: typeof data });
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
        console.debug('二维码加载开始', {source: '/images/mini.png', target: {x: qrX, y: qrY, size: qrSize}, exists: true});
      }
    } else {
      // 在微信小程序平台，使用新2D Canvas API绘制二维码
      console.debug('开始绘制二维码');
      // 获取canvas元素来创建图片对象
      const query = wx.createSelectorQuery().in(this);
      query.select('#cvs1')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('获取Canvas元素失败');
            platform.showToast({
              title: '获取画布失败，请重试'
            });
            return;
          }

          const canvas = res[0].node;
          const img = canvas.createImage();
          img.src = '/images/mini.png';
          img.onload = () => {
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
            console.debug('二维码绘制完成', {position: {x: qrX, y: qrY}, size: qrSize});
            
            // 绘制完成后执行保存
            console.debug('开始执行保存操作');
            wx.canvasToTempFilePath({
              canvas: canvas,
              x: 0,
              y: 0,
              width: width,
              height: height,
              quality: 1,
              destWidth: width * systemInfo.pixelRatio,
              destHeight: height * systemInfo.pixelRatio,
              success: (res) => {
                console.debug('canvasToTempFilePath成功:', res);
                const drawurl = res.tempFilePath;
                platform.saveImageToAlbum(drawurl, 
                  function(res) {
                    console.debug("保存相册成功" + res);
                    platform.showToast({
                      title: '保存相册成功'
                    });
                  },
                  function(err) {
                    console.debug("保存到相册失败", err);
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
                console.debug("canvasToTempFilePath失败:" + error);
                platform.showToast({
                  title: '生成图片失败，请重试'
                });
              }
            });
          };
        });
    }
  },

  /**
   * 绘制文本（支持换行）
   */
  drawText(ctx, str, leftWidth, initHeight, titleHeight, canvasWidth) {
    // 设置字体
    ctx.font = '14px Open Sans, Inter, Noto Sans SC, sans-serif';
    var lineWidth = 0;
    var linespace = this.data.linespace; //设置为20
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
  },

  /**
   * 生成分享海报
   */
  MakePosters: async function () {
    try {
      let that = this;
      platform.showToast({
        title: '生成中，请稍候'
      });
      setTimeout(function () {
        that.savecodetofile()
      }, 1000);
    } catch (ex) {
      console.debug("绘图出现了错误" + ex)
      platform.showToast({
        title: '请重试'
      });
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    let share;
    if (isHarmonyOS) {
      try {
        share = require('@system.share');
      } catch (err) {
        console.error('鸿蒙系统分享模块加载失败:', err);
      }
    }
    
    // 分享倒计时结果到朋友圈
    const { countdownText, countdownTitle } = this.data;
    if (countdownText) {
      // 鸿蒙系统分享处理
      if (isHarmonyOS && share) {
        return {
          title: `${countdownTitle} - ${countdownText}`,
          path: '/packages/life/pages/life-countdown/life-countdown',
          imageUrl: ''
        };
      }
      
      // 微信小程序分享处理
      return {
        title: `${countdownTitle} - ${countdownText}`,
        path: '/packages/life/pages/life-countdown/life-countdown',
        imageUrl: ''
      };
    }
    
    // 默认分享
    if (isHarmonyOS && share) {
      return {
        title: '倒计时工具 - 计算你的重要日子',
        path: '/packages/life/pages/life-countdown/life-countdown',
        imageUrl: ''
      };
    }
    
    return {
      title: '倒计时工具 - 计算你的重要日子',
      path: '/packages/life/pages/life-countdown/life-countdown',
      imageUrl: ''
    }
  }
};

// 平台兼容导出
if (!isHarmonyOS) {
  // 在微信小程序平台
  Page(PageDefinition);
}

// 在鸿蒙平台，默认导出必须在顶部
//export default PageDefinition;
