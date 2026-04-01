// packages/math/pages/divisor-finder/divisor-finder.js
// 实时计算，无按钮

Page({
  data: {
    number: '',
    divisors: [],
    showResult: false,
    isPrime: false,
    error: '',
    examples: [
      { number: 12 },
      { number: 36 },
      { number: 100 },
      { number: 256 },
      { number: 360 },
      { number: 1000 }
    ]
  },

  /**
   * 输入变化 - 实时计算
   */
  onInputChange: function(e) {
    const value = e.detail.value;

    if (!value || value === '') {
      this.setData({
        number: '',
        divisors: [],
        showResult: false,
        error: ''
      });
      return;
    }

    // 检查是否为空或纯空格
    if (value.trim() === '') {
      this.setData({ error: '请输入有效数字' });
      return;
    }

    // 转换为数字
    const num = parseInt(value, 10);

    // 检查是否为有效数字
    if (isNaN(num)) {
      this.setData({ error: '请输入有效数字', showResult: false });
      return;
    }

    // 检查是否为负数
    if (num < 1) {
      this.setData({ 
        error: '请输入大于 0 的正整数',
        showResult: false,
        number: value
      });
      return;
    }

    // 检查是否超出范围
    if (num > 999999999) {
      this.setData({
        error: '数字超出范围（最大 999,999,999）',
        showResult: false,
        number: value
      });
      return;
    }

    // 检查是否有小数
    if (!Number.isInteger(num)) {
      this.setData({
        error: '请输入整数',
        showResult: false,
        number: value
      });
      return;
    }

    // 清除错误，执行计算
    this.setData({ error: '' });
    this.calculate(num);
  },

  /**
   * 执行约数计算
   */
  calculate: function(num) {
    const divisors = this.findDivisors(num);
    
    // 判断是否为质数（只有2个约数：1和自身）
    const isPrime = divisors.length === 2 && divisors[0].value === 1 && divisors[1].value === num;

    this.setData({
      number: String(num),
      divisors,
      showResult: true,
      isPrime
    });
  },

  /**
   * 查找所有约数
   */
  findDivisors: function(n) {
    const divisors = [];
    const sqrt = Math.floor(Math.sqrt(n));

    for (let i = 1; i <= sqrt; i++) {
      if (n % i === 0) {
        // i 是约数
        divisors.push({ value: i, isPrime: this.isPrimeNumber(i) });
        // n/i 也是约数（如果不同于 i）
        if (i !== n / i) {
          divisors.push({ value: n / i, isPrime: this.isPrimeNumber(n / i) });
        }
      }
    }

    // 排序
    divisors.sort((a, b) => a.value - b.value);
    return divisors;
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
   * 使用示例
   */
  useExample: function(e) {
    const { number } = e.currentTarget.dataset;
    this.calculate(number);
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    return {
      title: '求约数 - 轻松找出所有因数',
      path: '/packages/math/pages/divisor-finder/divisor-finder'
    };
  },

  onShareTimeline: function() {
    return {
      title: '求约数 - 轻松找出所有因数',
      query: 'divisor-finder'
    };
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '📋 求约数' });
  }
});
