// packages/math/pages/24point/24point.js
const utils = require('../../../../utils/index');
const { playSound } = utils;

// CDN 数据源地址
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data';
const QUESTION_KEY = 'cdn_24point_questions';
const QUESTION_TIMESTAMP_KEY = 'cdn_24point_questions_ts';
const CACHE_EXPIRE = 24 * 60 * 60 * 1000; // 24小时缓存

// 本地备用题目
const localQuestionBank = [
  { numbers: [1, 2, 3, 4], solutions: [
    { expression: "(1+2+3)×4", description: "先相加得6，再乘以4" },
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
  ]},
  { numbers: [6, 6, 8, 8], solutions: [
    { expression: "(6÷(8-6))×8", description: "先做减法，再除法，最后乘法" },
    { expression: "(8÷(8-6))×6", description: "另一种顺序" }
  ]}
];

Page({
  data: {
    numbers: [1, 2, 3, 4], // 当前游戏4个数字
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
    // 游戏模式：'preset'（预设模式） 或 'custom'（自定义模式）
    gameMode: 'custom',
    // 自定义数字输入
    customNumbers: ['', '', '', ''], // 自定义输入的4个数字
    customNumbersValid: false, // 自定义数字是否有效（4个数字都已输入）
    showSolvabilityResult: false, // 是否显示可解性结果
    isSolvable: false, // 自定义数字是否有解
    solvabilityMessage: '', // 可解性消息
    customSolutions: [], // 自定义数字的解法
    soundEnabled: true, // 音效开关状态
    hints: [
      "尝试先将两个数字组合成容易计算的数，比如 3×8=24、4×6=24、12×2=24",
      "可以先算出24 的因数，然后看能否用其他数字得到对应的另一个因数",
      "不要忽视括号的作用，它可以改变运算顺序",
      "除法可以产生分数，有时分数运算能得到意想不到的结果",
      "试试先把两个数字相加或相减，看看能不能简化问题",
      "记住：每个数字必须使用且只能使用一次"
    ],
    // 预设题目库（初始用本地数据）
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
    playSound('click', { pageId: '24point' });
    this.setData({
      expression: '',
      showResult: false
    });
  },

  // 添加运算符
  appendOperator(e) {
    const operator = e.currentTarget.dataset.op;
    playSound('click', { pageId: '24point' });
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

  // 自定义数字输入处理
  onCustomInput1(e) {
    this.handleCustomInput(0, e.detail.value);
  },
  onCustomInput2(e) {
    this.handleCustomInput(1, e.detail.value);
  },
  onCustomInput3(e) {
    this.handleCustomInput(2, e.detail.value);
  },
  onCustomInput4(e) {
    this.handleCustomInput(3, e.detail.value);
  },

  // 处理自定义数字输入
  handleCustomInput(index, value) {
    const customNumbers = [...this.data.customNumbers];
    customNumbers[index] = value;
    
    // 检查四个数字是否都已输入（非空且为有效数字）
    const allFilled = customNumbers.every(num => num !== '' && !isNaN(parseInt(num)));
    
    this.setData({
      customNumbers,
      customNumbersValid: allFilled,
      showSolvabilityResult: false // 输入变化时隐藏结果
    });
  },

  // 随机生成自定义数字（0-24之间的4个随机整数）
  generateRandomCustomNumbers() {
    const randomNumbers = [];
    for (let i = 0; i < 4; i++) {
      // 生成0-24之间的随机整数
      randomNumbers.push(Math.floor(Math.random() * 25).toString());
    }
    
    this.setData({
      customNumbers: randomNumbers,
      customNumbersValid: true,
      showSolvabilityResult: false // 隐藏之前的可解性结果
    });
    
    // 移除振动和弹窗，输入框更新已经提供足够反馈
  },

  // 检查自定义数字是否有解
  checkSolvability() {
    const { customNumbers } = this.data;
    
    if (!this.data.customNumbersValid) {
      wx.showToast({
        title: '请输入4个有效整数',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    // 转换为数字数组
    const numbers = customNumbers.map(num => parseInt(num));
    
    // 检查是否有解
    const solutions = this.solve24(numbers);
    const isSolvable = solutions.length > 0;
    
    this.setData({
      showSolvabilityResult: true,
      isSolvable,
      solvabilityMessage: isSolvable ? 
        `数字 [${numbers.join(', ')}] 可以计算24！` : 
        `数字 [${numbers.join(', ')}] 无法计算24。`,
      customSolutions: solutions
    });
  },

  // 使用自定义数字开始游戏
  useCustomNumbers() {
    const { customNumbers } = this.data;
    
    if (!this.data.customNumbersValid) {
      wx.showToast({
        title: '请输入4个有效整数',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const numbers = customNumbers.map(num => parseInt(num));
    
    // 打乱数字顺序
    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
    
    // 尝试查找解法
    const solutions = this.solve24(numbers);
    
    this.setData({
      gameMode: 'custom',
      numbers: shuffledNumbers,
      expression: '',
      showResult: false,
      showingHint: false,
      showingSolution: false,
      solutionFound: false,
      solutions: solutions,
      showSolvabilityResult: false // 隐藏可解性结果
    });
    
    // 移除振动和成功弹窗，界面切换已经提供足够反馈
  },

  // 安全表达式求值函数（替代eval，避免微信小程序环境限制）
  safeEval(expression) {
    // 移除所有空格
    let expr = expression.replace(/\s+/g, '');
    
    // 运算符优先级映射
    const precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2
    };
    
    // 双栈：操作数栈和运算符栈
    const values = [];
    const ops = [];
    
    // 辅助函数：应用运算符
    const applyOp = (a, b, op) => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': 
          if (Math.abs(b) < 0.000001) throw new Error('除零错误');
          return a / b;
        default: throw new Error(`未知运算符 ${op}`);
      }
    };
    
    // 辅助函数：处理栈顶运算符
    const processTopOp = () => {
      if (ops.length < 1 || values.length < 2) return;
      const b = values.pop();
      const a = values.pop();
      const op = ops.pop();
      values.push(applyOp(a, b, op));
    };
    
    let i = 0;
    while (i < expr.length) {
      // 处理数字
      if (expr[i] >= '0' && expr[i] <= '9') {
        let num = '';
        while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
          num += expr[i];
          i++;
        }
        values.push(parseFloat(num));
        continue;
      }
      
      // 处理左括号
      if (expr[i] === '(') {
        ops.push('(');
        i++;
        continue;
      }
      
      // 处理右括号
      if (expr[i] === ')') {
        while (ops.length > 0 && ops[ops.length - 1] !== '(') {
          processTopOp();
        }
        if (ops.length === 0) throw new Error('括号不匹配');
        ops.pop(); // 移除左括号
        i++;
        continue;
      }
      
      // 处理运算符
      if (['+', '-', '*', '/'].includes(expr[i])) {
        // 处理负号（一元减号）
        if (expr[i] === '-' && (i === 0 || expr[i-1] === '(' || ['+', '-', '*', '/'].includes(expr[i-1]))) {
          // 一元负号：推入0和减号，或者直接处理为负数
          // 简单处理：读取下一个数字作为负数
          i++;
          if (expr[i] >= '0' && expr[i] <= '9') {
            let num = '-';
            while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
              num += expr[i];
              i++;
            }
            values.push(parseFloat(num));
          } else {
            throw new Error('无效的一元负号');
          }
          continue;
        }
        
        // 二元运算符
        // 处理高优先级运算符
        while (ops.length > 0 && ops[ops.length - 1] !== '(' && 
               precedence[ops[ops.length - 1]] >= precedence[expr[i]]) {
          processTopOp();
        }
        ops.push(expr[i]);
        i++;
        continue;
      }
      
      // 未知字符
      throw new Error(`无效字符: ${expr[i]}`);
    }
    
    // 处理剩余运算符
    while (ops.length > 0) {
      if (ops[ops.length - 1] === '(') throw new Error('括号不匹配');
      processTopOp();
    }
    
    if (values.length !== 1) throw new Error('表达式无结果');
    return values[0];
  },

  // 24点求解算法
  solve24(numbers) {
    if (numbers.length !== 4) return [];
    
    // 调试模式：检查是否为 [6,6,8,8]
    const debugMode = JSON.stringify(numbers) === JSON.stringify([6,6,8,8]);
    if (debugMode) {
      console.debug('调试模式：求解 [6,6,8,8]');
    }
    
    const solutions = [];
    const ops = ['+', '-', '*', '/'];
    
    // 递归函数：尝试所有可能的运算
    const solve = (nums, exprs) => {
      if (nums.length === 1) {
        if (Math.abs(nums[0] - 24) < 0.000001) {
          solutions.push(exprs[0]);
          if (debugMode) {
            console.debug('找到解:', exprs[0]);
          }
        }
        return;
      }
      
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          // 选择两个数字 nums[i] 和 nums[j]
          const a = nums[i];
          const b = nums[j];
          const aExpr = exprs[i];
          const bExpr = exprs[j];
          
          // 剩余数字
          const remainingNums = [];
          const remainingExprs = [];
          for (let k = 0; k < nums.length; k++) {
            if (k !== i && k !== j) {
              remainingNums.push(nums[k]);
              remainingExprs.push(exprs[k]);
            }
          }
          
          // 尝试所有运算符
          for (const op of ops) {
            // 加法、乘法满足交换律，避免重复计算
            if ((op === '+' || op === '*') && i > j) continue;
            
            let newVal, newExpr;
            switch (op) {
              case '+':
                newVal = a + b;
                newExpr = `(${aExpr}+${bExpr})`;
                solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                break;
              case '-':
                // 减法不满足交换律，尝试两种顺序
                // a - b
                newVal = a - b;
                newExpr = `(${aExpr}-${bExpr})`;
                solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                // b - a
                newVal = b - a;
                newExpr = `(${bExpr}-${aExpr})`;
                solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                break;
              case '*':
                newVal = a * b;
                newExpr = `(${aExpr}×${bExpr})`;
                solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                break;
              case '/':
                // 除法不满足交换律，尝试两种顺序（除数不能为0）
                if (Math.abs(b) > 0.000001) {
                  newVal = a / b;
                  newExpr = `(${aExpr}÷${bExpr})`;
                  solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                }
                if (Math.abs(a) > 0.000001) {
                  newVal = b / a;
                  newExpr = `(${bExpr}÷${aExpr})`;
                  solve([newVal, ...remainingNums], [newExpr, ...remainingExprs]);
                }
                break;
            }
          }
        }
      }
    };
    
    // 初始表达式就是数字本身
    const initExprs = numbers.map(num => num.toString());
    solve(numbers, initExprs);
    
    if (debugMode) {
      console.debug('总共找到原始解数量:', solutions.length);
      console.debug('原始解列表:', solutions);
    }
    
    // 去重并格式化解法
    const uniqueSolutions = [];
    const seen = new Set();
    
    for (const expr of solutions) {
      // 标准化运算符：确保使用统一的乘除符
      let normalized = expr.replace(/\*/g, '×').replace(/\//g, '÷');
      
      // 验证表达式是否正确计算为24
      try {
        let calcExpression = normalized.replace(/×/g, '*').replace(/÷/g, '/');
        const result = this.safeEval(calcExpression);
        if (Math.abs(result - 24) < 0.000001) {
          if (!seen.has(normalized)) {
            seen.add(normalized);
            uniqueSolutions.push({ expression: normalized, description: '' });
          }
        } else if (debugMode) {
          console.debug('表达式计算结果不为24:', normalized, '=', result);
        }
      } catch (error) {
        // 忽略无效表达式
        if (debugMode) {
          console.debug('表达式无结果:', normalized, error);
        }
      }
    }
    
    if (debugMode) {
      console.debug('去重后解数量:', uniqueSolutions.length);
      console.debug('去重后解列表:', uniqueSolutions);
    }
    
    return uniqueSolutions.slice(0, 10); // 最多返回10种解
  },

  // 切换游戏模式
  switchGameMode(e) {
    const mode = e.currentTarget.dataset.mode;
    console.debug('switchGameMode called, mode:', mode);
    if (this.data.gameMode === mode) return;
    
    this.setData({
      gameMode: mode,
      showSolvabilityResult: false,
      showingHint: false,
      showingSolution: false
    });
    
    // 切换到预设模式时，生成新游戏
    if (mode === 'preset') {
      console.debug('Switching to preset, generating new game');
      this.generateNewGame();
    }
    
    // 移除振动，选项卡切换已提供视觉反馈
  },

  // 生成新游戏
  generateNewGame() {
    console.debug('generateNewGame called');
    try {
      // 检查题目库是否已加载
           if (!this._questionBank || this._questionBank.length === 0) {
        console.warn('questionBank not loaded yet, waiting...');
        setTimeout(() => this.generateNewGame(), 500);
        return;
      }
      
      // 随机选择一个预设题目
      const randomIndex = Math.floor(Math.random() * this._questionBank.length);
      const selectedQuestion = this._questionBank[randomIndex];
      
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

      playSound('click', { pageId: '24point' });
    } catch (error) {
      console.error('generateNewGame error:', error);
      wx.showToast({
        title: '生成新游戏失败',
        icon: 'none'
      });
    }
  },

  // 显示提示
  showHint() {
    const randomIndex = Math.floor(Math.random() * this.data.hints.length);
    this.setData({
      showingHint: true,
      currentHint: this.data.hints[randomIndex]
    });
    // 移除振动，提示框弹出已提供足够反馈
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
    // 移除振动，答案框弹出已提供足够反馈
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

  // 检查答案
  checkAnswer() {
    const { expression, numbers, solutions } = this.data;
    
    if (!expression) {
      wx.showToast({
        title: '请输入算式',
        icon: 'none',
        duration: 1000
      });
      return;
    }

    try {
      // 检查是否使用了所有数字
      const usedNumbers = this.extractNumbersFromExpression(expression);
      const sortedUsed = usedNumbers.sort();
      const sortedOriginal = [...numbers].sort();
      
      if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedOriginal)) {
        this.showResult(false, '请确保使用了所有数字，且每个数字只使用一次');
        return;
      }

      // 替换显示符号为计算符
      let calcExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      
      // 处理阶乘
      calcExpression = calcExpression.replace(/(\d+)!/g, (match, num) => {
        return this.factorial(parseInt(num));
      });
      
      // 处理平方根
      calcExpression = calcExpression.replace(/√?\(\d+)/g, (match, num) => {
        return Math.sqrt(parseInt(num));
      });
      
      // 计算结果
      const result = this.safeEval(calcExpression);
      
      // 允许一定的误差范围（处理浮点数精度问题）
      if (Math.abs(result - 24) < 0.000001) {
        playSound('correct', { pageId: '24point' });
        this.showResult(true, '恭喜你，答对了！');
        this.addToHistory(numbers, true);
        this.updateStats(true);
        this.setData({
          solutionFound: true
        });
      } else {
        playSound('wrong', { pageId: '24point' });
        this.showResult(false, `计算结果为${result}，正确答案是24`);
        this.addToHistory(numbers, false);
        this.updateStats(false);
      }
      
    } catch (error) {
      console.error('表达式错误:', error);
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

  // 切换音效开关
  toggleSound() {
    const newEnabled = !this.data.soundEnabled;
    this.setData({ soundEnabled: newEnabled });
    utils.setPageSoundEnabled('24point', newEnabled);
    if (newEnabled) {
      playSound('click', { pageId: '24point' });
    }
  },



  // 页面加载时运行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '24点速算'
    });
    
    // 加载音效开关状态
    const soundEnabled = utils.isPageSoundEnabled('24point');
    this.setData({ soundEnabled });
    
    // 尝试恢复上次的游戏进度
    const saved = wx.getStorageSync('24point_saved');
    if (saved && saved.numbers && saved.numbers.length === 4) {
      this.setData({
        numbers: saved.numbers,
        expression: saved.expression || '',
        showingHint: saved.showingHint || false,
        currentHint: saved.currentHint || '',
        showingSolution: saved.showingSolution || false,
        solutionFound: saved.solutionFound || false,
        isCorrect: false,
        showResult: false,
        resultMessage: '',
      });
    }
    
    // 从CDN加载预设题目
    this.loadQuestionBank();
    
    // 生成初始游戏（仅在预设模式下）
    if (this.data.gameMode === 'preset') {
      this.generateNewGame();
    }
    
    // 加载统计数据
    this.loadStats();
  },

  onUnload() {
    // 保存游戏进度
    wx.setStorageSync('24point_saved', {
      numbers: this.data.numbers,
      expression: this.data.expression,
      showingHint: this.data.showingHint,
      currentHint: this.data.currentHint,
      showingSolution: this.data.showingSolution,
      solutionFound: this.data.solutionFound,
    });
  },

  // 从CDN加载预设题目
  loadQuestionBank() {
    const cached = wx.getStorageSync(QUESTION_KEY);
    const timestamp = wx.getStorageSync(QUESTION_TIMESTAMP_KEY);
    const now = Date.now();

    // 检查缓存是否有数据
    if (cached && timestamp && (now - timestamp < CACHE_EXPIRE)) {
      console.debug('[24point] 使用缓存题目');
      this._questionBank = cached;
      return;
    }

    console.debug('[24point] 从CDN加载预设题目');
    wx.request({
      url: `${CDN_BASE}/24point-questions.json`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.questions) {
          this._questionBank = res.data.questions;
          // 保存到缓存
          wx.setStorageSync(QUESTION_KEY, res.data.questions);
          wx.setStorageSync(QUESTION_TIMESTAMP_KEY, now);
          console.debug('[24point] CDN题目加载成功，共', res.data.questions.length, '条');
               } else {
          console.warn('[24point] CDN数据格式错误，使用本地数据');
          this._questionBank = [];
        }
      },
      fail: (err) => {
        console.warn('[24point] CDN请求失败，使用本地数据', err);
        // 使用本地备用题目
        this._questionBank = localQuestionBank;
        console.debug('[24point] 已加载本地备用题目，共', localQuestionBank.length, '条');
      }
    });
  },

  // 页面显示时运行
  onShow() {
    // 可以在这里添加动画或其他效果
  },

  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    // 清空缓存
    wx.clearStorageSync();
    // 重新加载数据
    this.loadQuestionBank();
    if (this.data.gameMode === 'preset') {
      this.generateNewGame();
    }
    wx.stopPullDownRefresh();
  }
})