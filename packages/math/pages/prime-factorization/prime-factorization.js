// packages/math/pages/prime-factorization/prime-factorization.js
// 实时计算，无按钮

const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    number: '',
    factors: [],
    steps: [],
    showResult: false,
    isPrime: false,
    examples: [
      { number: 60 },
      { number: 100 },
      { number: 360 },
      { number: 1024 },
      { number: 97 },
      { number: 2310 }
    ]
  },

  /**
   * 输入变化 - 实时计算
   */
  onInputChange: function(e) {
    const value = e.detail.value;

    if (!value) {
      this.setData({
        number: '',
        factors: [],
        steps: [],
        showResult: false,
        isPrime: false
      });
      return;
    }

    const num = parseInt(value);
    if (isNaN(num)) return;

    // 小于2不计算
    if (num < 2) {
      this.setData({ number: value, showResult: false });
      return;
    }

    // 执行计算
    this.calculate(num);
  },

  /**
   * 执行质因数分解计算
   */
  calculate: function(num) {
    // 检查是否为质数
    if (this.isPrimeNumber(num)) {
      this.setData({
        number: String(num),
        factors: [{ value: num, isPrime: true }],
        steps: [`${num} 是质数，无需分解`],
        showResult: true,
        isPrime: true
      });
      return;
    }

    // 分解质因数
    const { factors, steps } = this.primeFactorization(num);

    this.setData({
      number: String(num),
      factors,
      steps,
      showResult: true,
      isPrime: false
    });
  },

  /**
   * 判断是否为质数
   */
  isPrimeNumber: function(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  },

  /**
   * 质因数分解算法
   */
  primeFactorization: function(n) {
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
        steps.push(`步骤${stepNum}：${n} ÷ ${divisor} = ${temp}`);
      } else {
        steps.push(`步骤${stepNum}：${n} ÷ ${divisor}^${count} = ${temp}`);
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
        const prevTemp = temp * Math.pow(divisor, count);
        if (count === 1) {
          steps.push(`步骤${stepNum}：${prevTemp} ÷ ${divisor} = ${temp}`);
        } else {
          steps.push(`步骤${stepNum}：${prevTemp} ÷ ${divisor}^${count} = ${temp}`);
        }
        stepNum++;
      }
      divisor += 2;
    }

    // 如果最后temp > 1，说明temp本身是质数
    if (temp > 1) {
      factors.push({ value: temp, isPrime: true });
      steps.push(`步骤${stepNum}：剩余 ${temp} 是质数`);
    }

    // 生成最终结果
    const factorExpression = factors.map(f => f.value).join(' × ');
    steps.push(`${n} = ${factorExpression}`);

    return { factors, steps };
  },

  /**
   * 使用示例
   */
  useExample: function(e) {
    const { number } = e.currentTarget.dataset;
    this.calculate(number);
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '🔢 质因数分解' });
  }
});
