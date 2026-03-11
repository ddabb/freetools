// packages/life/pages/life-countdown/life-countdown.js
// 平台兼容API封装
const platform = {
  // 弹窗提示
  showToast: function(options) {
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
      const info = wx.getSystemInfoSync();
      callback(info);
    }
  },
  
  // 分享
  share: function(options) {
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
    if (isHarmonyOS) {
      image.saveToPhotosAlbum({
        uri: imageData,
        success: success,
        fail: fail
      });
    } else {
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
    expectedLifeYears: 75, // 预计寿命（岁）- 调整为更现实的数字
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
    console.log('设置出生日期:', selectedDate);
    this.setData({
      birthDate: selectedDate
    });
  },

  // 设置预计寿命
  setExpectedLifeYears(e) {
    const inputValue = e.detail.value;
    if (inputValue === '') {
      // 允许清空输入框
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

  // 计算人生A4纸
  calculate() {
    const { birthDate, expectedLifeYears = 75 } = this.data;
    console.log('计算开始，当前数据:', { birthDate, expectedLifeYears });
    
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
      console.log('=== 人生格子计算开始 ===');
      console.log('出生日期:', birthDate);
      console.log('预期寿命:', finalExpectedLife, '岁');
      console.log('当前日期:', today.toISOString());

      // 计算已活天数（精确到小数）
      const preciseDaysLived = (today - birth) / (1000 * 60 * 60 * 24);
      const daysLived = Math.floor(preciseDaysLived);
      console.log('精确已活天数:', preciseDaysLived);
      console.log('已活天数:', daysLived);

      // 计算预期寿命总天数
      const expectedLifeTotal = finalExpectedLife * 365.25;
      const lifeLeft = Math.max(0, Math.floor(expectedLifeTotal - preciseDaysLived));
      console.log('预期寿命总天数:', expectedLifeTotal);
      console.log('剩余天数:', lifeLeft);

      // 计算人生进度百分比
      const progress = Math.min(100, Math.round((preciseDaysLived / expectedLifeTotal) * 10000) / 100);
      console.log('人生进度百分比:', progress, '%');

      // 精确计算900个格子的填充情况
      // 每个格子代表：总寿命天数 ÷ 900格
      const daysPerGrid = expectedLifeTotal / this.data.totalGrids;
      console.log('总格子数:', this.data.totalGrids);
      console.log('每格代表天数:', daysPerGrid);
      
      // 使用精确计算，确保格子数量正确
      const livedGrids = Math.min(this.data.totalGrids, Math.ceil(preciseDaysLived / daysPerGrid));
      const gridPercentage = Math.min(100, Math.round((livedGrids / this.data.totalGrids) * 10000) / 100);
      console.log('已填充格子数:', livedGrids);
      console.log('格子百分比:', gridPercentage, '%');

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
      
      console.log('每格代表天数文本:', daysPerGridText);

      // 设置初始问题索引
      const randomIndex = Math.floor(Math.random() * this.data.questions.length);
      this.setData({
        currentIndex: randomIndex
      });
      console.log('随机问题索引:', randomIndex);

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

      console.log('=== 人生格子计算结束 ===');

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
          // 确保expectedLifeYears有值
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
    }
    this.autoPlayTimer = setInterval(() => {
      this.nextQuestion();
    }, 5000); // 5秒切换一次
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

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '人生格子 - 每一格都是生命的珍贵时光',
      path: '/packages/life/pages/life-countdown/life-countdown'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '人生格子 - 感知时间流逝，思考生命意义',
      query: 'life-countdown'
    }
  },

  // 初始化数组
  initArrays() {
    const { gridRows, gridCols } = this.data;
    const rowsArray = Array.from({ length: gridRows }, (_, index) => index);
    const colsArray = Array.from({ length: gridCols }, (_, index) => index);
    console.log('初始化数组:', { gridRows, gridCols, rowsArray: rowsArray.length, colsArray: colsArray.length });
    this.setData({
      rowsArray,
      colsArray
    });
  },



  // 获取每格代表的天数文本
  getDaysPerGridText() {
    // 这个函数现在主要是为了兼容性，实际数据通过 daysPerGridText 属性提供
    console.log('getDaysPerGridText 被调用，当前数据:', this.data);
    const { daysPerGridText } = this.data;
    
    if (!daysPerGridText) {
      console.log('getDaysPerGridText: 没有找到 daysPerGridText，返回默认值');
      return '约2.67天';
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

  // 页面显示时执行
  onShow() {
    this.startAutoPlay();
  },

  // 页面隐藏时执行
  onHide() {
    this.stopAutoPlay();
  },

  // 页面卸载时执行
  onUnload() {
    this.stopAutoPlay();
  },

  // 页面数据更新时执行
  onReady() {
    console.log('页面准备就绪，确保数据正确绑定');
    this.initArrays();
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
      // 在微信小程序平台
      wx.createSelectorQuery()
        .select('#cvs1')
        .fields({
          node: true,
          size: true,
        })
        .exec(this.MergeImage.bind(this));
    }
  },

  /**
   * 绘制分享图片 - 所见即所得版本
   */
  MergeImage(res) {
    let canvas, ctx;
    
    if (isHarmonyOS) {
      // 鸿蒙平台
      canvas = res;
      ctx = canvas.getContext('2d');
      console.log('鸿蒙平台Canvas:', { width: canvas.width, height: canvas.height });
    } else {
      // 微信小程序平台
      canvas = res[0].node;
      ctx = canvas.getContext('2d');
      console.log('微信小程序Canvas:', { width: canvas.width, height: canvas.height });
    }

    console.log('Canvas元素:', canvas);
    let that = this;
    
    // 确保Canvas尺寸正确
    if (isHarmonyOS) {
      const dpr = 2; // 鸿蒙平台使用固定DPI
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      console.log('鸿蒙Canvas尺寸调整:', { width, height, dpr, actualWidth: canvas.width, actualHeight: canvas.height });
    } else {
      // 微信小程序平台 - 使用系统信息获取DPI
      const systemInfo = wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio || 2;
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      console.log('微信Canvas尺寸调整:', { width, height, dpr, actualWidth: canvas.width, actualHeight: canvas.height, systemInfo });
    }

    // 获取系统信息
    platform.getSystemInfo((systemInfo) => {
      const dpr = systemInfo.pixelRatio || 1;
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr); // 适配分辨率

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

      console.log('=== 图片生成布局分析 ===');
      console.log('调整后画布尺寸:', {width, height});
      console.log('内边距:', padding);
      console.log('格子区域位置:', {top: gridSectionTop, height: gridSectionHeight});
      console.log('格子网格配置:', {rows: gridRows, cols: gridCols, cellSize: gridCellSize, gap: gridGap, actualWidth: gridWidth, actualHeight: gridHeight});
      console.log('二维码位置:', {x: qrX, y: qrY, size: qrSize});
      console.log('格子起始坐标:', {x: gridStartX, y: gridStartY});
      console.log('格子区域结束坐标:', {x: gridEndX, y: gridEndY});
      console.log('二维码区域:', {x: qrX, y: qrY, width: qrSize, height: qrSize});
      console.log('图例位置:', {y: legendY});
      console.log('格子信息文本位置:', {y: gridInfoY});
      console.log('出生日期信息位置:', {y: birthDateY});
      console.log('预期寿命信息位置:', {y: expectedLifeY});
      console.log('人生思考问题位置:', {y: questionY});
      
      // 检查是否有重叠风险
      const overlapCheck = {
        gridVsQr: gridEndX > qrX || gridEndY > qrY,
        gridVsLegend: gridEndY > legendY - 20,
        textVsGrid: gridSectionTop - 70 < gridStartY,
        legendVsQr: legendY + 30 > qrY,
        questionVsBottom: questionY + 60 > height - padding // 确保底部有留白
      };
      console.log('重叠检查:', overlapCheck);

      // 背景色 - 使用更舒适的配色方案
      ctx.fillStyle = '#f8f9fa'; // 使用更现代的浅灰色背景，更舒适
      ctx.fillRect(0, 0, width, height);
      console.log('背景色填充完成:', {color: '#f8f9fa', bounds: {x: 0, y: 0, width, height}});

      // 标题 - 使用更现代的样式
      ctx.font = 'bold 26px 微软雅黑';
      ctx.fillStyle = '#2c3e50'; // 深灰色标题，更专业
      ctx.fillText('人生A4纸', padding, titleY);
      console.log('标题绘制完成:', {text: '人生A4纸', position: {x: padding, y: titleY}});

      // 副标题 - 使用更现代的样式
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#7f8c8d'; // 中灰色副标题，更柔和
      ctx.fillText('900个格子，见证生命的成长~', padding, subtitleY);
      console.log('副标题绘制完成:', {text: '生命的成长~', position: {x: padding, y: subtitleY}});

      // 出生日期信息
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('出生日期：', padding, birthDateY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db'; // 蓝色强调，更醒目
      ctx.fillText(this.data.birthDate || '未知', padding + 100, birthDateY);
      console.log('出生日期信息绘制完成:', {position: {x: padding, y: birthDateY}, date: this.data.birthDate});

      // 预期寿命信息
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('预期寿命：', padding, expectedLifeY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(this.data.expectedLifeYears + ' 岁', padding + 100, expectedLifeY);
      console.log('预期寿命信息绘制完成:', {position: {x: padding, y: expectedLifeY}, years: this.data.expectedLifeYears});

      // 统计信息区域
      console.log('统计信息区域起始位置:', statsY);
      
      // 已活天数
      ctx.font = 'bold 18px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('已活天数：', padding, statsY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(this.data.daysLived + ' 天', padding + 100, statsY);
      console.log('已活天数绘制完成:', {position: {x: padding, y: statsY}});

      // 剩余天数
      ctx.font = 'bold 18px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('剩余天数：', padding, statsY + 25);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(this.data.lifeLeft + ' 天', padding + 100, statsY + 25);
      console.log('剩余天数绘制完成:', {position: {x: padding, y: statsY + 25}});

      // 人生进度
      ctx.font = 'bold 18px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('人生进度：', padding, statsY + 50);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(this.data.progress + '%', padding + 100, statsY + 50);
      console.log('人生进度绘制完成:', {position: {x: padding, y: statsY + 50}});

      // 绘制格子网格 - 所见即所得
      const totalGrids = this.data.totalGrids;
      const livedGrids = Math.min(this.data.livedGrids, totalGrids);
      const expectedLifeYears = this.data.expectedLifeYears || 75;
      console.log('格子绘制开始:', {total: totalGrids, lived: livedGrids});
      
      // 添加调试信息
      console.log('网格配置:', {
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

          // 根据格子状态设置颜色
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
      
      console.log('格子网格绘制完成，边界尺寸:', {
        width: this.data.gridCols * (gridCellSize + gridGap) - gridGap,
        height: this.data.gridRows * (gridCellSize + gridGap) - gridGap
      });

      // 格子信息文本
      ctx.font = 'bold 16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('人生A4纸：' + livedGrids + '/' + totalGrids + ' 格', padding, gridInfoY);
      
      // 每格代表天数
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('每格 ≈ ' + this.data.daysPerGridText, padding, daysInfoY);
      
      console.log('格子信息文本绘制完成:', {
        position: {x: padding, y: gridInfoY},
        daysInfoPosition: {x: padding, y: daysInfoY}
      });

      // 绘制图例 - 避免与格子重叠
      console.log('图例区域位置:', legendY);
      
      // 已度过的时光
      ctx.fillStyle = '#3498db'; // 更现代的蓝色
      ctx.fillRect(padding, legendY, 15, 15);
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('已度过的时光', padding + 20, legendY + 12);
      
      // 正在经历
      ctx.fillStyle = '#e74c3c'; // 更现代的红色
      ctx.fillRect(padding + 130, legendY, 15, 15);
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('正在经历', padding + 150, legendY + 12);
      
      // 未来可期
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(padding + 230, legendY, 15, 15);
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('未来可期', padding + 250, legendY + 12);
      
      console.log('图例绘制完成:', {position: {x: padding, y: legendY}});

      // 人生思考问题
      const randomQuestion = this.data.questions[Math.floor(Math.random() * this.data.questions.length)];
      ctx.font = 'bold 16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('🤔 人生思考：', padding, questionY);
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      // 绘制问题文本，支持换行
      let questionText = randomQuestion.text;
      let lineHeight = 20;
      let currentY = questionY + lineHeight;
      let words = questionText.split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        
        if (testWidth > width - padding * 2) {
          ctx.fillText(line, padding, currentY);
          line = words[i] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, padding, currentY);
      console.log('人生思考问题绘制完成:', {position: {x: padding, y: questionY}, question: randomQuestion.text});

      // 加载并绘制二维码
      const img = isHarmonyOS ? new Image() : canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});
        
        if (isHarmonyOS) {
          // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据
          const imageData = canvas.toDataURL();
          
          // 保存图片到相册
          platform.saveImageToAlbum(imageData, 
            function() {
              console.log("保存相册成功");
              platform.showToast({
                title: '保存相册成功'
              });
            },
            function(data, code) {
              console.log("保存到相册失败", code, data);
              platform.showToast({
                title: '保存失败，请重试'
              });
            }
          );
        } else {
          // 在微信小程序平台
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            quality: 1,
            canvas: canvas,
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
                  if (err.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || 
                      err.errMsg === "saveImageToPhotosAlbum:fail auth deny" || 
                      err.errMsg === "saveImageToPhotosAlbum:fail authorize no response") {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存相册',
                      showCancel: false,
                      success: modalSuccess => {
                        wx.openSetting({
                          success(settingdata) {
                            console.log("settingdata", settingdata);
                            if (settingdata.authSetting['scope.writePhotosAlbum']) {
                              wx.showModal({
                                title: '提示',
                                content: '获取权限成功,再次点击图片即可保存',
                                showCancel: false,
                              });
                            } else {
                              wx.showModal({
                                title: '提示',
                                content: '获取权限失败，将无法保存到相册哦~',
                                showCancel: false,
                              });
                            }
                          },
                          fail(failData) {
                            console.log("failData", failData);
                          },
                          complete(finishData) {
                            console.log("finishData", finishData);
                          }
                        });
                      }
                    });
                  } else {
                    console.log("保存到相册失败" + res);
                  }
                }
              );
            },
            fail: function (error) {
              console.log("canvasToTempFilePath" + error);
            }
          }, that);
        }
      };
      img.src = '/images/mini.png';
      console.log('二维码加载开始:', {source: '/images/mini.png', target: {x: qrX, y: qrY, size: qrSize}, exists: true});
    });
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
      console.log("绘图出现了错误" + ex)
      platform.showToast({
        title: '请重试'
      });
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
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
      
      // 微信小程序分享
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

// 在鸿蒙平台，默认导出必须在顶层
export default PageDefinition;