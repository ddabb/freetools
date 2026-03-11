// packages/math/pages/24point/24point.js
Page({
  data: {
    numbers: [1, 2, 3, 4], // 当前游戏的4个数字
    expression: '', // 用户输入的表达式
    showResult: false, // 是否显示结果
    isCorrect: false, // 答案是否正确
    resultMessage: '', // 结果消息
    showingHint: false, // 是否显示提示
    currentHint: '', // 当前提示内容
    showingSolution: false, // 是否显示答案
    solutions: [], // 所有解决方案
    solutionFound: false, // 是否已找到答案
    gamesPlayed: 0, // 已玩游戏局数
    correctAnswers: 0, // 答对题数
    accuracy: 0, // 正确率
    gameHistory: [], // 游戏历史
    hints: [
      "尝试先将两个数字组合成容易计算的数，比如 3×8=24、4×6=24、12×2=24",
      "可以先算出 24 的因数，然后看能否用其他数字得到对应的另一个因数",
      "不要忽视括号的作用，它可以改变运算顺序",
      "除法可以产生分数，有时分数运算能得到意想不到的结果",
      "试试先把两个数字相加或相减，看看能不能简化问题",
      "记住：每个数字必须使用且只能使用一次"
    ],
    // 预定义的一些24点题目和答案
    questionBank: [
      { numbers: [1, 2, 3, 4], solutions: [
        { expression: "(1+2+3)×4", description: "先相加得到6，再乘以4" },
        { expression: "(1×2×3)×4", description: "连乘得到24" }
      ]},
      { numbers: [2, 3, 4, 6], solutions: [
        { expression: "6×4×(3-2)", description: "利用差值简化计算" },
        { expression: "(6-3)×2×4", description: "先做减法得到3" }
      ]},
      { numbers: [3, 3, 8, 8], solutions: [
        { expression: "8÷(3-8÷3)", description: "经典的分式解法" }
      ]},
      { numbers: [1, 3, 5, 7], solutions: [
        { expression: "(7-3)×(1+5)", description: "分组计算得到4和6" }
      ]},
      { numbers: [4, 4, 10, 10], solutions: [
        { expression: "(10×10-4)÷4", description: "利用平方差公式思路" }
      ]},
      { numbers: [5, 5, 5, 1], solutions: [
        { expression: "(5-1÷5)×5", description: "分数运算的经典例子" }
      ]}
    ]
  },

  // 设置表达式
  setExpression(e) {
    this.setData({
      expression: e.detail.value,
      showResult: false
    });
  },

  // 清空表达式
  clearExpression() {
    this.setData({
      expression: '',
      showResult: false
    });
  },

  // 添加运算符
  appendOperator(e) {
    const operator = e.currentTarget.dataset.op;
    const { expression } = this.data;
    
    // 防止连续添加运算符
    const lastChar = expression.slice(-1);
    const operators = ['+', '-', '×', '÷', '(', ')', '!', '√'];
    
    if (operators.includes(lastChar) && operators.includes(operator)) {
      return;
    }
    
    this.setData({
      expression: expression + operator,
      showResult: false
    });
  },

  // 生成新游戏
  generateNewGame() {
    // 随机选择一个预设题目
    const randomIndex = Math.floor(Math.random() * this.data.questionBank.length);
    const selectedQuestion = this.data.questionBank[randomIndex];
    
    // 打乱数字顺序
    const shuffledNumbers = [...selectedQuestion.numbers].sort(() => Math.random() - 0.5);
    
    this.setData({
      numbers: shuffledNumbers,
      expression: '',
      showResult: false,
      showingHint: false,
      showingSolution: false,
      solutionFound: false,
      solutions: selectedQuestion.solutions
    });
    
    wx.vibrateShort();
  },

  // 显示提示
  showHint() {
    const randomIndex = Math.floor(Math.random() * this.data.hints.length);
    this.setData({
      showingHint: true,
      currentHint: this.data.hints[randomIndex]
    });
    wx.vibrateShort();
  },

  // 关闭提示
  closeHint() {
    this.setData({
      showingHint: false
    });
  },

  // 显示答案
  showSolution() {
    this.setData({
      showingSolution: true
    });
    wx.vibrateShort();
  },

  // 关闭答案
  closeSolution() {
    this.setData({
      showingSolution: false
    });
  },

  // 阶乘函数
  factorial(n) {
    if (n === 0 || n === 1) return 1;
    return n * this.factorial(n - 1);
  },

  // 检验答案
  checkAnswer() {
    const { expression, numbers, solutions } = this.data;
    
    if (!expression) {
      wx.showToast({
        title: '请输入算式',
        icon: 'none'
      });
      return;
    }

    try {
      // 检查是否使用了所有数字
      const usedNumbers = this.extractNumbersFromExpression(expression);
      const sortedUsed = usedNumbers.sort();
      const sortedOriginal = [...numbers].sort();
      
      if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedOriginal)) {
        this.showResult(false, '请确保使用了所有4个数字，且每个数字只使用一次');
        return;
      }

      // 替换显示符号为计算符号
      let calcExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      
      // 处理阶乘
      calcExpression = calcExpression.replace(/(\d+)!/g, (match, num) => {
        return this.factorial(parseInt(num));
      });
      
      // 处理平方根
      calcExpression = calcExpression.replace(/√(\d+)/g, (match, num) => {
        return Math.sqrt(parseInt(num));
      });
      
      // 计算结果
      const result = eval(calcExpression);
      
      // 允许一定的误差范围（处理浮点数精度问题）
      if (Math.abs(result - 24) < 0.000001) {
        this.showResult(true, '恭喜你，答对了！');
        this.addToHistory(numbers, true);
        this.updateStats(true);
        this.setData({
          solutionFound: true
        });
      } else {
        this.showResult(false, `计算结果：${result}，正确答案是24`);
        this.addToHistory(numbers, false);
        this.updateStats(false);
      }
      
    } catch (error) {
      console.error('表达式错误', error);
      this.showResult(false, '表达式有误，请检查语法');
    }
  },

  // 从表达式中提取数字
  extractNumbersFromExpression(expr) {
    const matches = expr.match(/\d+/g);
    return matches ? matches.map(n => parseInt(n)) : [];
  },

  // 显示结果
  showResult(isCorrect, message) {
    this.setData({
      showResult: true,
      isCorrect,
      resultMessage: message
    });
    
    setTimeout(() => {
      this.setData({
        showResult: false
      });
    }, 3000);
  },

  // 添加到历史记录
  addToHistory(numbers, solved) {
    const historyItem = {
      numbers: [...numbers],
      solved,
      timestamp: new Date().toLocaleString()
    };
    
    let history = [...this.data.gameHistory];
    history.unshift(historyItem);
    
    // 只保留最近10条记录
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    this.setData({
      gameHistory: history
    });
  },

  // 更新统计信息
  updateStats(correct) {
    const gamesPlayed = this.data.gamesPlayed + 1;
    const correctAnswers = correct ? this.data.correctAnswers + 1 : this.data.correctAnswers;
    const accuracy = Math.round((correctAnswers / gamesPlayed) * 100);
    
    this.setData({
      gamesPlayed,
      correctAnswers,
      accuracy
    });
    
    // 保存到本地存储
    wx.setStorageSync('24point_stats', {
      gamesPlayed,
      correctAnswers,
      accuracy,
      gameHistory: this.data.gameHistory
    });
  },

  // 加载统计数据
  loadStats() {
    try {
      const stats = wx.getStorageSync('24point_stats');
      if (stats) {
        this.setData({
          gamesPlayed: stats.gamesPlayed || 0,
          correctAnswers: stats.correctAnswers || 0,
          accuracy: stats.accuracy || 0,
          gameHistory: stats.gameHistory || []
        });
      }
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '24点速算挑战 - 锻炼数学思维',
      path: '/packages/math/pages/24point/24point'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '24点速算挑战 - 锻炼数学思维',
      query: '24point'
    }
  },

  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '24点速算'
    });
    
    // 生成初始游戏
    this.generateNewGame();
    
    // 加载统计数据
    this.loadStats();
  },

  // 页面显示时执行
  onShow() {
    // 可以在这里添加动画或其他效果
  }
})