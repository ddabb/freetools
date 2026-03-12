// 食物数据（包含热量信息，单位：大卡/100g）
const foodData = {
  // 水果类
  fruits: [
    { name: '苹果', emoji: '🍎', calories: 52 },
    { name: '香蕉', emoji: '🍌', calories: 89 },
    { name: '葡萄', emoji: '🍇', calories: 69 },
    { name: '草莓', emoji: '🍓', calories: 32 },
    { name: '桃子', emoji: '🍑', calories: 39 },
    { name: '西瓜', emoji: '🍉', calories: 30 },
    { name: '柠檬', emoji: '🍋', calories: 29 },
    { name: '梨子', emoji: '🍐', calories: 57 },
    { name: '芒果', emoji: '🥭', calories: 60 },
    { name: '菠萝', emoji: '🍍', calories: 50 },
    { name: '椰子', emoji: '🥥', calories: 354 },
    { name: '猕猴桃', emoji: '🥝', calories: 61 },
    { name: '橙子', emoji: '🍊', calories: 47 },
    { name: '樱桃', emoji: '🍒', calories: 50 },
    { name: '哈密瓜', emoji: '🍈', calories: 34 },
    { name: '蓝莓', emoji: '🫐', calories: 57 },
    { name: '石榴', emoji: '🍯', calories: 83 },
    { name: '荔枝', emoji: '🧁', calories: 66 },
    { name: '龙眼', emoji: '🍬', calories: 60 },
    { name: '榴莲', emoji: '🍈', calories: 147 }
  ],
  // 蔬菜类
  vegetables: [
    { name: '西兰花', emoji: '🥦', calories: 34 },
    { name: '胡萝卜', emoji: '🥕', calories: 41 },
    { name: '玉米', emoji: '🌽', calories: 86 },
    { name: '茄子', emoji: '🍆', calories: 25 },
    { name: '黄瓜', emoji: '🥒', calories: 15 },
    { name: '蘑菇', emoji: '🍄', calories: 22 },
    { name: '番茄', emoji: '🍅', calories: 18 },
    { name: '菠菜', emoji: '🥬', calories: 23 },
    { name: '土豆', emoji: '🥔', calories: 77 },
    { name: '南瓜', emoji: '🎃', calories: 26 },
    { name: '红薯', emoji: '🍠', calories: 86 },
    { name: '洋葱', emoji: '🧅', calories: 40 },
    { name: '大蒜', emoji: '🧄', calories: 149 },
    { name: '青椒', emoji: '🫑', calories: 20 },
    { name: '生菜', emoji: '🥗', calories: 15 },
    { name: '卷心菜', emoji: '🥬', calories: 25 },
    { name: '芦笋', emoji: '🌿', calories: 20 },
    { name: '芹菜', emoji: '🥒', calories: 16 }
  ],
  // 主食类
  staples: [
    { name: '面包', emoji: '🍞', calories: 265 },
    { name: '米饭', emoji: '🍚', calories: 130 },
    { name: '面条', emoji: '🍜', calories: 138 },
    { name: '饺子', emoji: '🥟', calories: 250 },
    { name: '披萨', emoji: '🍕', calories: 266 },
    { name: '汉堡', emoji: '🍔', calories: 250 },
    { name: '薯条', emoji: '🍟', calories: 312 },
    { name: '馒头', emoji: '🥠', calories: 221 },
    { name: '粥', emoji: '🍲', calories: 65 },
    { name: '包子', emoji: '🥟', calories: 230 },
    { name: '煎饼', emoji: '🌯', calories: 290 },
    { name: '热狗', emoji: '🌭', calories: 290 },
    { name: '三明治', emoji: '🥪', calories: 250 },
    { name: '意面', emoji: '🍝', calories: 158 },
    { name: '寿司', emoji: '🍣', calories: 143 },
    { name: '饭团', emoji: '🍙', calories: 170 },
    { name: '墨西哥卷', emoji: '🌮', calories: 250 }
  ],
  // 肉类与蛋白质
  proteins: [
    { name: '鸡腿', emoji: '🍗', calories: 167 },
    { name: '培根', emoji: '🥓', calories: 418 },
    { name: '火腿', emoji: '🍖', calories: 340 },
    { name: '鸡蛋', emoji: '🍳', calories: 155 },
    { name: '鱼', emoji: '🐟', calories: 208 },
    { name: '虾', emoji: '🦐', calories: 99 },
    { name: '牛排', emoji: '🥩', calories: 250 },
    { name: '蟹', emoji: '🦀', calories: 113 },
    { name: '章鱼', emoji: '🐙', calories: 82 },
    { name: '贝类', emoji: '🦪', calories: 72 },
    { name: '奶酪', emoji: '🧀', calories: 350 }
  ],
  // 饮品类
  drinks: [
    { name: '咖啡', emoji: '☕', calories: 2 },
    { name: '茶', emoji: '🍵', calories: 1 },
    { name: '牛奶', emoji: '🥛', calories: 42 },
    { name: '啤酒', emoji: '🍺', calories: 43 },
    { name: '红酒', emoji: '🍷', calories: 85 },
    { name: '果汁', emoji: '🧃', calories: 50 },
    { name: '汽水', emoji: '🥤', calories: 40 },
    { name: '奶茶', emoji: '🧋', calories: 150 },
    { name: '冰沙', emoji: '🍹', calories: 100 },
    { name: '酸奶', emoji: '🍶', calories: 59 }
  ],
  // 甜点类
  desserts: [
    { name: '蛋糕', emoji: '🎂', calories: 340 },
    { name: '冰淇淋', emoji: '🍦', calories: 207 },
    { name: '甜甜圈', emoji: '🍩', calories: 300 },
    { name: '巧克力', emoji: '🍫', calories: 546 },
    { name: '饼干', emoji: '🍪', calories: 470 },
    { name: '布丁', emoji: '🍮', calories: 130 },
    { name: 'cupcake', emoji: '🧁', calories: 350 },
    { name: '华夫饼', emoji: '🧇', calories: 290 },
    { name: '可颂', emoji: '🥐', calories: 410 },
    { name: '雪糕', emoji: '🍨', calories: 200 },
    { name: '刨冰', emoji: '🍧', calories: 100 },
    { name: '糖果', emoji: '🍬', calories: 400 },
    { name: '爆米花', emoji: '🍿', calories: 387 }
  ],
  // 其他小吃
  snacks: [
    { name: '寿司', emoji: '🍣', calories: 143 },
    { name: '墨西哥卷饼', emoji: '🌮', calories: 250 },
    { name: '爆米花', emoji: '🍿', calories: 387 },
    { name: '饭团', emoji: '🍙', calories: 170 },
    { name: '奶酪', emoji: '🧀', calories: 350 },
    { name: '花生', emoji: '🥜', calories: 567 },
    { name: '核桃', emoji: '🌰', calories: 654 },
    { name: '薯片', emoji: '🥔', calories: 536 },
    { name: '棉花糖', emoji: '🍭', calories: 317 },
    { name: '巧克力棒', emoji: '🍫', calories: 500 },
    { name: '冰淇淋蛋筒', emoji: '🍦', calories: 250 },
    { name: '饼干', emoji: '🍪', calories: 470 }
  ]
};

// 饮食建议模板
const dietSuggestions = [
  '建议搭配适量的蛋白质和蔬菜，保持营养均衡',
  '多吃蔬菜水果，少吃高热量食物',
  '合理控制主食摄入量，增加膳食纤维',
  '多喝水，少喝含糖饮料',
  '注意饮食多样化，保证各种营养素的摄入',
  '适量运动，保持健康体重',
  '早餐要吃好，午餐要吃饱，晚餐要吃少',
  '避免暴饮暴食，细嚼慢咽'
];

// 获取随机食物
function getRandomFood(category) {
  const foods = foodData[category];
  if (!foods || foods.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * foods.length);
  return foods[randomIndex];
}

// 生成随机餐食搭配
function generateRandomMeal() {
  const meal = {
    staple: getRandomFood('staples'),
    protein: getRandomFood('proteins'),
    vegetable: getRandomFood('vegetables'),
    fruit: getRandomFood('fruits'),
    drink: getRandomFood('drinks')
  };
  
  // 计算总热量
  let totalCalories = 0;
  Object.values(meal).forEach(item => {
    if (item) {
      // 估算份量：主食150g，蛋白质100g，蔬菜200g，水果100g，饮料200ml
      if (item === meal.staple) totalCalories += item.calories * 1.5;
      else if (item === meal.protein) totalCalories += item.calories * 1;
      else if (item === meal.vegetable) totalCalories += item.calories * 2;
      else if (item === meal.fruit) totalCalories += item.calories * 1;
      else if (item === meal.drink) totalCalories += item.calories * 2;
    }
  });
  
  // 获取随机饮食建议
  const suggestion = dietSuggestions[Math.floor(Math.random() * dietSuggestions.length)];
  
  return {
    meal,
    totalCalories: Math.round(totalCalories),
    suggestion
  };
}

Page({
  data: {
    isSpinning: false,
    result: null,
    animationDuration: 1500,
    showResult: false,
    mealTypes: ['早餐', '午餐', '晚餐', '加餐'],
    selectedMealType: '午餐',
    showFoodModal: false,
    foodCategories: ['fruits', 'vegetables', 'staples', 'proteins', 'drinks', 'desserts', 'snacks'],
    categoryMap: {
      fruits: { name: '水果类', emoji: '🍎' },
      vegetables: { name: '蔬菜类', emoji: '🥦' },
      staples: { name: '主食类', emoji: '🍞' },
      proteins: { name: '肉类与蛋白质', emoji: '🍖' },
      drinks: { name: '饮品类', emoji: '☕' },
      desserts: { name: '甜点类', emoji: '🍰' },
      snacks: { name: '其他小吃', emoji: '🍿' }
    },
    foodData: foodData,
    canvaswidth: 220,
    canvasheight: 400
  },
  
  onLoad() {
    // 页面加载时初始化
  },
  
  // 选择餐型
  selectMealType(e) {
    this.setData({
      selectedMealType: e.currentTarget.dataset.type
    });
  },
  
  // 开始随机选择
  startRandom() {
    if (this.data.isSpinning) return;
    
    console.log('开始随机选择，当前餐型：', this.data.selectedMealType);
    this.setData({
      isSpinning: true,
      showResult: false
    });
    
    // 模拟转盘动画
    setTimeout(() => {
      console.log('随机计时结束，生成结果...');
      const result = generateRandomMeal();
      console.log('生成的结果：', result);
      
      if (!result) {
        console.error('生成结果失败，结果为null');
        this.setData({
          isSpinning: false,
          showResult: false
        });
        wx.showToast({
          title: '生成失败，请重试',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        result: result,
        isSpinning: false,
        showResult: true
      });
      console.log('结果已设置，showResult:', true, 'result:', result);
    }, this.data.animationDuration);
  },
  
  // 重新随机
  reRandom() {
    this.startRandom();
  },
  
  // 分享给好友
  onShareAppMessage() {
    const result = this.data.result;
    let title = '今天吃什么 - 解决选择困难症';
    let path = '/packages/food/pages/what-to-eat/what-to-eat';
    
    if (result) {
      const stapleName = result.meal.staple ? result.meal.staple.name : '';
      const proteinName = result.meal.protein ? result.meal.protein.name : '';
      title = `推荐${this.data.selectedMealType}：${stapleName} + ${proteinName}`;
    }
    
    return {
      title: title,
      path: path
    };
  },
  
  // 分享到朋友圈
  onShareTimeline() {
    const result = this.data.result;
    let title = '今天吃什么 - 随机饮食推荐';
    
    if (result) {
      const stapleEmoji = result.meal.staple ? result.meal.staple.emoji : '';
      const stapleName = result.meal.staple ? result.meal.staple.name : '';
      title = `${this.data.selectedMealType}推荐：${stapleEmoji} ${stapleName}，总热量${result.totalCalories}大卡`;
    }
    
    return {
      title: title,
      query: 'what-to-eat'
    };
  },
  
  // 显示全部食物清单
  showAllFoods() {
    this.setData({
      showFoodModal: true
    });
  },
  
  // 关闭食物清单模态框
  closeFoodModal() {
    this.setData({
      showFoodModal: false
    });
  },

  // 保存Canvas为图片
  savecodetofile() {
    try {
      const ctx = wx.createCanvasContext('foodPosterCanvas', this);
      if (ctx) {
        this.MergeImage(ctx);
      } else {
        console.error('创建Canvas上下文失败');
        wx.showToast({
          title: '创建画布上下文失败，请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('调用wx.createCanvasContext失败:', error);
      wx.showToast({
        title: '创建画布失败，请重试',
        icon: 'none'
      });
    }
  },

  // 绘制分享图片
  MergeImage(ctx) {
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

    const padding = 20;
    const titleY = padding + 20;
    const subtitleY = titleY + 20;
    const mealInfoY = subtitleY + 30;
    const qrSize = 80;
    const qrX = (width - qrSize) / 2;
    const qrY = height - qrSize - padding;

    // 背景色 - 食物主题的温暖色调
    // 由于wx.createCanvasContext不支持渐变，使用纯色背景
    ctx.setFillStyle('#ffe6cc');
    ctx.fillRect(0, 0, width, height);

    // 添加装饰性食物元素背景
    ctx.setFillStyle('rgba(255, 152, 0, 0.1)');
    ctx.beginPath();
    ctx.arc(width - 40, 40, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(40, height - 40, 20, 0, Math.PI * 2);
    ctx.fill();

    // 标题
    ctx.setFontSize(22);
    ctx.setFillStyle('#e67e22');
    ctx.fillText('今日饮食推荐', padding, titleY);

    // 副标题
    ctx.setFontSize(14);
    ctx.setFillStyle('#d35400');
    ctx.fillText('解决你的选择困难症', padding, subtitleY);

    // 餐型信息
    ctx.setFontSize(16);
    ctx.setFillStyle('#333');
    ctx.fillText(`餐型：${this.data.selectedMealType}`, padding, mealInfoY);

    // 如果有结果，绘制食物详情
    if (this.data.result) {
      const meal = this.data.result.meal;
      const calories = this.data.result.totalCalories;
      const suggestion = this.data.result.suggestion;

      // 绘制食物项目
      let yPos = mealInfoY + 30;
      const drawFoodItem = (label, food) => {
        if (food) {
          ctx.setFontSize(14);
          ctx.setFillStyle('#666');
          ctx.fillText(`${label}：`, padding, yPos);

          // 绘制emoji（wx.createCanvasContext自动处理emoji）
          ctx.setFontSize(20);
          ctx.setFillStyle('#000');
          ctx.fillText(food.emoji, padding + 60, yPos);

          ctx.setFontSize(14);
          ctx.setFillStyle('#e67e22');
          ctx.fillText(food.name, padding + 90, yPos);

          yPos += 20;
        }
      };

      drawFoodItem('主食', meal.staple);
      drawFoodItem('蛋白质', meal.protein);
      drawFoodItem('蔬菜', meal.vegetable);
      drawFoodItem('水果', meal.fruit);
      drawFoodItem('饮品', meal.drink);

      // 热量信息
      yPos += 10;
      ctx.setFontSize(16);
      ctx.setFillStyle('#e74c3c');
      ctx.fillText(`总热量：${calories} 大卡`, padding, yPos);

      // 饮食建议
      yPos += 20;
      ctx.setFontSize(14);
      ctx.setFillStyle('#27ae60');
      ctx.fillText('饮食建议：', padding, yPos);

      // 多行文本处理
      const lineHeight = 20;
      const maxCharsPerLine = 15;
      let startIndex = 0;
      let lineY = yPos + lineHeight;

      while (startIndex < suggestion.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, suggestion.length);
        // 尝试在词语边界处换行
        if (endIndex < suggestion.length && suggestion[endIndex] !== ' ') {
          const lastSpaceIndex = suggestion.lastIndexOf(' ', endIndex);
          if (lastSpaceIndex > startIndex) {
            endIndex = lastSpaceIndex;
          }
        }
        const lineText = suggestion.substring(startIndex, endIndex);
        ctx.fillText(lineText, padding, lineY);
        startIndex = endIndex + 1;
        lineY += lineHeight;
      }
    } else {
      // 没有结果时的提示
      ctx.setFontSize(14);
      ctx.setFillStyle('#999');
      ctx.fillText('快来生成你的饮食推荐吧！', padding, mealInfoY + 30);
    }

    // 绘制二维码
    console.log('开始绘制二维码');
    ctx.drawImage('/images/mini.png', qrX, qrY, qrSize, qrSize);
    console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});

    // 绘制完成后执行保存
    ctx.draw(false, () => {
      console.log('开始执行保存操作');
      // 生成临时文件路径并保存到相册
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: width,
        height: height,
        quality: 1,
        canvasId: 'foodPosterCanvas',
        destWidth: width * (systemInfo.pixelRatio / 2),
        destHeight: height * (systemInfo.pixelRatio / 2),
        success: (res) => {
          console.log('canvasToTempFilePath成功:', res);
          const tempFilePath = res.tempFilePath;
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
              console.log('保存相册成功');
              wx.showToast({
                title: '海报已保存到相册',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.log('保存到相册失败', err);
              if (err.errMsg.includes('auth denied')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存到相册',
                  showCancel: true,
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                wx.showToast({
                  title: '保存失败，请重试',
                  icon: 'none'
                });
              }
            }
          });
        },
        fail: (error) => {
          console.error('生成图片失败:', error);
          wx.showToast({
            title: '生成图片失败',
            icon: 'none'
          });
        }
      }, this);
    });
  },

  // 生成分享海报
  MakePosters() {
    if (!this.data.result) {
      wx.showToast({
        title: '请先生成饮食推荐',
        icon: 'none'
      });
      return;
    }
    
    wx.showToast({
      title: '生成中，请稍候',
      icon: 'loading',
      duration: 2000
    });
    
    setTimeout(() => {
      this.savecodetofile();
    }, 1000);
  }
});