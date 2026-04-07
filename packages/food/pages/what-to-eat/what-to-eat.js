// 食物数据（包含热量信息，单位：大卡/100g）
const utils = require('../../../../utils/index');

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
    { name: '龙眼', emoji: '🐉', calories: 60 },
    { name: '榴莲', emoji: '💀', calories: 147 }
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
    { name: '花生', emoji: '🥜', calories: 567 },
    { name: '核桃', emoji: '🌰', calories: 654 },
    { name: '薯片', emoji: '🥔', calories: 536 },
    { name: '棉花糖', emoji: '🍭', calories: 317 },
    { name: '肉干', emoji: '🥓', calories: 410 },
    { name: '鸡爪', emoji: '🦴', calories: 250 }
  ]
};

// 饮食建议模板
const dietSuggestions = {
  breakfast: [
    '早餐要吃好，搭配蛋白质让你上午精神满满',
    '早餐饮品推荐：牛奶或豆浆，补钙又营养',
    '早餐热量控制在400-600大卡为宜'
  ],
  lunch: [
    '午餐要吃饱，主食+蛋白质+蔬菜缺一不可',
    '午后来点水果，补充维生素又解馋',
    '午餐热量建议控制在600-800大卡'
  ],
  dinner: [
    '晚餐要吃少，轻食更健康',
    '晚餐避免高脂肪食物，推荐蔬菜+蛋白质组合',
    '晚餐热量建议控制在400-600大卡'
  ],
  snack: [
    '加餐选择坚果或水果，热量低又饱腹',
    '下午茶来杯茶或咖啡，提神又享受',
    '加餐热量控制在100-200大卡为宜'
  ]
};

// 餐型对应的推荐食物池
const mealPreferences = {
  breakfast: { staple: 'staples', protein: 'drinks', vegetable: 'fruits', exclude: ['drinks'] },
  lunch: { staple: 'staples', protein: 'proteins', vegetable: 'vegetables', exclude: [] },
  dinner: { staple: 'vegetables', protein: 'proteins', vegetable: 'vegetables', exclude: ['desserts', 'snacks', 'drinks'] },
  snack: { staple: 'desserts', protein: 'drinks', vegetable: 'fruits', exclude: [] }
};

// 获取随机食物（排除指定类别）
function getRandomFood(category, excludeCategories = []) {
  let pool = [];
  for (const cat of category) {
    if (!excludeCategories.includes(cat) && foodData[cat]) {
      pool = pool.concat(foodData[cat]);
    }
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 生成随机餐食搭配
function generateRandomMeal(mealType) {
  const prefs = mealPreferences[mealType] || mealPreferences.lunch;
  const suggestions = dietSuggestions[mealType] || dietSuggestions.lunch;

  const meal = {
    staple: getRandomFood([prefs.staple], prefs.exclude),
    protein: getRandomFood([prefs.protein], prefs.exclude),
    vegetable: getRandomFood([prefs.vegetable], prefs.exclude),
    fruit: getRandomFood(['fruits'], prefs.exclude),
    drink: getRandomFood(['drinks'], prefs.exclude)
  };

  // 计算总热量
  let totalCalories = 0;
  if (meal.staple) totalCalories += meal.staple.calories * 1.5;
  if (meal.protein) totalCalories += meal.protein.calories * 1;
  if (meal.vegetable) totalCalories += meal.vegetable.calories * 2;
  if (meal.fruit) totalCalories += meal.fruit.calories * 1;
  if (meal.drink) totalCalories += meal.drink.calories * 2;

  return {
    meal,
    totalCalories: Math.round(totalCalories),
    suggestion: suggestions[Math.floor(Math.random() * suggestions.length)]
  };
}

// 获取所有食物池（用于转盘动画）
function getAllFoods() {
  const allFoods = [];
  const categories = ['fruits', 'vegetables', 'staples', 'proteins', 'drinks', 'desserts', 'snacks'];
  categories.forEach(cat => {
    if (foodData[cat]) {
      allFoods.push(...foodData[cat]);
    }
  });
  return allFoods;
}

Page({
  data: {
    isSpinning: false,
    result: null,
    animationDuration: 2000,
    showResult: false,
    mealTypes: ['早餐', '午餐', '晚餐', '加餐'],
    selectedMealType: '午餐',
    selectedMealTypeKey: 'lunch',
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
    // 分类排除状态
    excludedCategories: [],
    categoryEnabled: {
      fruits: true,
      vegetables: true,
      staples: true,
      proteins: true,
      drinks: true,
      desserts: true,
      snacks: true
    },
    // 转盘动画相关
    spinFoods: [],
    spinIndex: 0,
    spinInterval: null,
    spinTimer: null,
    foodData: foodData,
    canvaswidth: 220,
    canvasheight: 400
  },

  onLoad() {
    this.initSpinFoods();
  },

  // 初始化转盘食物池
  initSpinFoods() {
    const allFoods = getAllFoods();
    // 随机打乱顺序，取20个作为转盘显示池
    const shuffled = allFoods.sort(() => Math.random() - 0.5).slice(0, 20);
    this.setData({ spinFoods: shuffled });
  },

  // 选择餐型
  selectMealType(e) {
    const type = e.currentTarget.dataset.type;
    const typeMap = {
      '早餐': 'breakfast',
      '午餐': 'lunch',
      '晚餐': 'dinner',
      '加餐': 'snack'
    };
    this.setData({
      selectedMealType: type,
      selectedMealTypeKey: typeMap[type]
    });
  },

  // 切换分类是否启用
  toggleCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    const enabled = !this.data.categoryEnabled[cat];
    const newEnabled = { ...this.data.categoryEnabled, [cat]: enabled };

    // 如果禁用某分类且它在排除列表中，先移出
    let excluded = [...this.data.excludedCategories];
    if (!enabled && !excluded.includes(cat)) {
      excluded.push(cat);
    } else if (enabled) {
      excluded = excluded.filter(c => c !== cat);
    }

    this.setData({
      categoryEnabled: newEnabled,
      excludedCategories: excluded
    });
  },

  // 开始随机选择（转盘动画）
  startRandom() {
    if (this.data.isSpinning) return;

    // 收集已启用的食物
    const enabledCategories = this.data.foodCategories.filter(cat => this.data.categoryEnabled[cat]);
    const allEnabledFoods = [];
    enabledCategories.forEach(cat => {
      if (foodData[cat]) {
        allEnabledFoods.push(...foodData[cat]);
      }
    });

    if (allEnabledFoods.length === 0) {
      utils.showText('请至少启用一个食物类别');
      return;
    }

    // 随机打乱食物池
    const shuffled = allEnabledFoods.sort(() => Math.random() - 0.5);
    this.setData({
      spinFoods: shuffled.slice(0, Math.min(20, shuffled.length)),
      isSpinning: true,
      showResult: false
    });

    // 转盘滚动动画
    let spinCount = 0;
    const totalSpins = 30; // 总滚动次数
    let currentInterval = 50; // 初始间隔 ms

    const spinInterval = setInterval(() => {
      spinCount++;
      // 逐渐减速
      if (spinCount > totalSpins * 0.6) {
        clearInterval(spinInterval);
        // 最后一跳：直接跳到结果
        setTimeout(() => {
          const result = generateRandomMeal(this.data.selectedMealTypeKey);
          this.setData({
            result: result,
            isSpinning: false,
            showResult: true
          });
        }, 300);
      } else {
        // 更新显示的食物索引
        const newIndex = (this.data.spinIndex + 1) % this.data.spinFoods.length;
        this.setData({ spinIndex: newIndex });
      }
    }, currentInterval);

    this.setData({ spinInterval });
  },

  // 重新随机
  reRandom() {
    this.startRandom();
  },

  // 分享给好友
  onShareAppMessage() {
    const result = this.data.result;
    let title = '今天吃什么 - 解决选择困难症';
    const path = '/packages/food/pages/what-to-eat/what-to-eat';

    if (result) {
      const stapleName = result.meal.staple ? result.meal.staple.name : '';
      const proteinName = result.meal.protein ? result.meal.protein.name : '';
      title = `推荐${this.data.selectedMealType}：${stapleName} + ${proteinName}`;
    }

    return { title, path };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const result = this.data.result;
    let title = '今天吃什么 - 随机饮食推荐';

    if (result) {
      const stapleEmoji = result.meal.staple ? result.meal.staple.emoji : '';
      const stapleName = result.meal.staple ? result.meal.staple.name : '';
      title = `${this.data.selectedMealType}推荐：${stapleEmoji} ${stapleName}，约${result.totalCalories}大卡`;
    }

    return { title, query: 'what-to-eat' };
  },

  // 显示全部食物清单
  showAllFoods() {
    this.setData({ showFoodModal: true });
  },

  // 关闭食物清单模态框
  closeFoodModal() {
    this.setData({ showFoodModal: false });
  },

  // 保存Canvas为图片
  savecodetofile() {
    try {
      const query = wx.createSelectorQuery().in(this);
      query.select('#foodPosterCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            utils.showText('获取画布失败，请重试');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          canvas.width = this.data.canvaswidth * dpr;
          canvas.height = this.data.canvasheight * dpr;
          ctx.scale(dpr, dpr);

          this.MergeImage(ctx, canvas);
        });
    } catch (error) {
      console.error('创建Canvas上下文失败:', error);
      utils.showText('创建画布失败，请重试');
    }
  },

  // 绘制分享图片
  MergeImage(ctx, canvas) {
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };

    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    const padding = 20;
    const titleY = padding + 20;
    const subtitleY = titleY + 20;
    const mealInfoY = subtitleY + 30;
    const qrSize = 80;
    const qrX = (width - qrSize) / 2;
    const qrY = height - qrSize - padding;

    // 背景色
    ctx.fillStyle = '#ffe6cc';
    ctx.fillRect(0, 0, width, height);

    // 装饰元素
    ctx.fillStyle = 'rgba(255, 152, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(width - 40, 40, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(40, height - 40, 20, 0, Math.PI * 2);
    ctx.fill();

    // 标题
    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = '#e67e22';
    ctx.fillText('今日饮食推荐', padding, titleY);

    // 副标题
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#d35400';
    ctx.fillText('解决你的选择困难症', padding, subtitleY);

    // 餐型信息
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(`餐型：${this.data.selectedMealType}`, padding, mealInfoY);

    if (this.data.result) {
      const meal = this.data.result.meal;
      const calories = this.data.result.totalCalories;
      const suggestion = this.data.result.suggestion;

      let yPos = mealInfoY + 30;
      const drawFoodItem = (label, food) => {
        if (food) {
          ctx.font = '14px Arial, sans-serif';
          ctx.fillStyle = '#666';
          ctx.fillText(`${label}：`, padding, yPos);

          ctx.font = '20px Arial, sans-serif';
          ctx.fillStyle = '#000';
          ctx.fillText(food.emoji, padding + 60, yPos);

          ctx.font = '14px Arial, sans-serif';
          ctx.fillStyle = '#e67e22';
          ctx.fillText(food.name, padding + 90, yPos);

          yPos += 20;
        }
      };

      drawFoodItem('主食', meal.staple);
      drawFoodItem('蛋白质', meal.protein);
      drawFoodItem('蔬菜', meal.vegetable);
      drawFoodItem('水果', meal.fruit);
      drawFoodItem('饮品', meal.drink);

      yPos += 10;
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(`总热量：${calories} 大卡`, padding, yPos);

      yPos += 20;
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#27ae60';
      ctx.fillText('饮食建议：', padding, yPos);

      const lineHeight = 20;
      const maxCharsPerLine = 15;
      let startIndex = 0;
      let lineY = yPos + lineHeight;

      while (startIndex < suggestion.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, suggestion.length);
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
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#999';
      ctx.fillText('快来生成你的饮食推荐吧！', padding, mealInfoY + 30);
    }

    const img = canvas.createImage();
    img.src = '/images/mini.png';
    img.onload = () => {
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0, y: 0, width: width, height: height,
        quality: 1,
        destWidth: width * systemInfo.pixelRatio,
        destHeight: height * systemInfo.pixelRatio,
        success: (res) => {
          const tempFilePath = res.tempFilePath;
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
              utils.showSuccess('海报已保存到相册');
            },
            fail: (err) => {
              if (err.errMsg && err.errMsg.includes('auth denied')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存到相册',
                  showCancel: true,
                  success: (modalRes) => {
                    if (modalRes.confirm) wx.openSetting();
                  }
                });
              } else {
                utils.showText('保存失败，请重试');
              }
            }
          });
        },
        fail: (error) => {
          console.error('生成图片失败:', error);
          utils.showText('生成图片失败');
        }
      });
    };
  },

  // 生成分享海报
  MakePosters() {
    if (!this.data.result) {
      utils.showText('请先生成饮食推荐');
      return;
    }

    utils.showLoading('生成中，请稍候');

    setTimeout(() => {
      this.savecodetofile();
    }, 1000);
  }
});
