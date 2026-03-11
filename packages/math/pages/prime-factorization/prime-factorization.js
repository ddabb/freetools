// packages/math/pages/prime-factorization/prime-factorization.js
Page({
  data: {
    number: '', // 要分解的数字
    factors: [], // 分解后的质因数数组
    steps: [], // 计算步骤
    showResult: false, // 是否显示结果
    isPrime: false, // 是否为质数
    canCalculate: false, // 是否可以计算
    examples: [
      { number: 60 },
      { number: 100 },
      { number: 2310 },
      { number: 97 }, // 质数示例
      { number: 360 },
      { number: 1024 }
    ]
  },

  // 设置数字
  setNumber(e) {
    const value = parseInt(e.detail.value) || '';
    const canCalculate = value && value >= 2 && value <= 999999999;
    this.setData({
      number: value,
      showResult: false,
      factors: [],
      steps: [],
      isPrime: false,
      canCalculate: canCalculate
    });
  },

  // 计算质因数分解
  calculate() {
    const { number } = this.data;
    
    if (!number) {
      wx.showToast({
        title: '请输入要分解的数字',
        icon: 'none'
      });
      return;
    }

    if (number < 2) {
      wx.showToast({
        title: '请输入大于1的整数',
        icon: 'none'
      });
      return;
    }

    if (number > 999999999) {
      wx.showToast({
        title: '数字太大，请输入小于10亿的数',
        icon: 'none'
      });
      return;
    }

    try {
      // 检查是否为质数
      if (this.isPrimeNumber(number)) {
        this.setData({
          showResult: true,
          factors: [{ value: number, isPrime: true }],
          steps: [`${number} 是质数，无法分解为更小的质因数`],
          isPrime: true
        });
        wx.vibrateShort();
        return;
      }

      // 分解质因数
      const { factors, steps } = this.primeFactorization(number);

      this.setData({
        factors,
        steps,
        showResult: true,
        isPrime: false
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('计算失败', error);
      wx.showToast({
        title: '计算失败，请重试',
        icon: 'none'
      });
    }
  },

  // 判断是否为质数
  isPrimeNumber(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  },

  // 质因数分解算法
  primeFactorization(n) {
    const factors = [];
    const steps = [];
    let temp = n;
    let divisor = 2;
    let stepNum = 1;

    steps.push(`开始分解 ${n}`);

    // 处理因子2
    let count = 0;
    while (temp % divisor === 0) {
      temp = Math.floor(temp / divisor);
      count++;
    }
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        factors.push({ value: divisor, isPrime: true });
      }
      if (count === 1) {
        steps.push(`步骤${stepNum}：${n} ÷ ${divisor} = ${temp}，所以 ${divisor} 是一个质因数`);
      } else {
        steps.push(`步骤${stepNum}：${n} ÷ ${divisor}^${count} = ${temp}，所以 ${divisor}^${count} 是质因数分解的一部分`);
      }
      stepNum++;
    }

    // 处理奇数因子
    divisor = 3;
    while (temp > 1 && divisor * divisor <= temp) {
      count = 0;
      while (temp % divisor === 0) {
        temp = Math.floor(temp / divisor);
        count++;
      }
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          factors.push({ value: divisor, isPrime: true });
        }
        if (count === 1) {
          steps.push(`步骤${stepNum}：${temp * divisor} ÷ ${divisor} = ${temp}，所以 ${divisor} 是一个质因数`);
        } else {
          steps.push(`步骤${stepNum}：${temp * divisor} ÷ ${divisor}^${count} = ${temp}，所以 ${divisor}^${count} 是质因数分解的一部分`);
        }
        stepNum++;
      }
      divisor += 2;
    }

    // 如果最后temp > 1，说明temp本身是质数
    if (temp > 1) {
      factors.push({ value: temp, isPrime: true });
      steps.push(`步骤${stepNum}：剩余的 ${temp} 是质数，所以也是质因数`);
    }

    // 生成最终表达式
    const factorExpression = factors.map(f => f.value).join(' × ');
    steps.push(`最终结果：${n} = ${factorExpression}`);

    return { factors, steps };
  },

  // 使用示例
  useExample(e) {
    const { number } = e.currentTarget.dataset;
    this.setData({
      number,
      showResult: false,
      factors: [],
      steps: [],
      isPrime: false
    });
    
    // 自动计算
    setTimeout(() => {
      this.calculate();
    }, 100);
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '质因数分解器 - 轻松学习数论',
      path: '/packages/math/pages/prime-factorization/prime-factorization'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '质因数分解器 - 轻松学习数论',
      query: 'prime-factorization'
    }
  },

  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '质因数分解'
    });
  },


})