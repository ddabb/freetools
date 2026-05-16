// prime-checker.js - 质数判断功能
// 实时计算，无按钮

const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    inputValue: '',
    result: {},
    showResult: false,
    inputFocus: false
  },

  /**
   * 输入框内容变化事件 - 实时计算
   */
  onInputChange: function(e) {
    const value = e.detail.value;

    // 清空时直接隐藏结果
    if (!value) {
      this.setData({
        inputValue: '',
        result: {},
        showResult: false
      });
      return;
    }

    // 解析数字
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      return;
    }

    // 数字过大保护
    if (num > 9007199254740991) {
      return;
    }

    // 执行计算
    this.calculatePrime(num);
  },

  /**
   * 质数判断核心算法 - 6k±1优化
   */
  isPrime: function(n) {
    if (n <= 1) return { isPrime: false, reason: '小于等于1的数不是质数' };
    if (n <= 3) return { isPrime: true, reason: '2和3是最小的质数' };
    if (n % 2 === 0) return { isPrime: false, reason: '能被2整除，是偶数' };
    if (n % 3 === 0) return { isPrime: false, reason: '能被3整除' };

    const sqrtN = Math.sqrt(n);
    for (let i = 5; i <= sqrtN; i += 6) {
      if (n % i === 0) return { isPrime: false, reason: `能被${i}整除` };
      if (n % (i + 2) === 0) return { isPrime: false, reason: `能被${i + 2}整除` };
    }

    return { isPrime: true, reason: '只能被1和自身整除' };
  },

  /**
   * 获取质数性质说明
   */
  getPrimeProperties: function(n, isPrime) {
    const properties = [];

    if (isPrime) {
      if (n === 2) properties.push('唯一的偶质数');
      if (n > 2 && n % 2 !== 0) properties.push('奇质数');
      if (this.isMersennePrime(n)) properties.push('梅森质数');
      if (this.isTwinPrime(n)) properties.push('孪生质数');
      if (this.isSafePrime(n)) properties.push('安全质数');
    } else {
      if (n % 2 === 0) properties.push('偶数');
      else properties.push('奇数');
    }

    return properties;
  },

  isMersennePrime: function(n) {
    const mersennePrimes = [3, 7, 31, 127, 8191, 131071, 524287, 2147483647];
    return mersennePrimes.includes(n);
  },

  isTwinPrime: function(n) {
    if (n <= 2) return false;
    const checkPrime = (num) => {
      if (num <= 1) return false;
      if (num <= 3) return true;
      if (num % 2 === 0 || num % 3 === 0) return false;
      const sqrtNum = Math.sqrt(num);
      for (let i = 5; i <= sqrtNum; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
      }
      return true;
    };
    return checkPrime(n - 2) || checkPrime(n + 2);
  },

  isSafePrime: function(n) {
    if (n <= 2) return false;
    const q = (n - 1) / 2;
    if (!Number.isInteger(q)) return false;
    const checkPrime = (num) => {
      if (num <= 1) return false;
      if (num <= 3) return true;
      if (num % 2 === 0 || num % 3 === 0) return false;
      const sqrtNum = Math.sqrt(num);
      for (let i = 5; i <= sqrtNum; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
      }
      return true;
    };
    return checkPrime(q);
  },

  /**
   * 查找最近的质数
   */
  findNearestPrimes: function(n) {
    const checkPrime = (num) => {
      if (num <= 1) return false;
      if (num <= 3) return true;
      if (num % 2 === 0 || num % 3 === 0) return false;
      const sqrtNum = Math.sqrt(num);
      for (let i = 5; i <= sqrtNum; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
      }
      return true;
    };

    let prevPrime = null;
    let nextPrime = null;

    for (let i = n - 1; i >= 2 && prevPrime === null; i--) {
      if (checkPrime(i)) prevPrime = i;
    }

    for (let i = n + 1; nextPrime === null; i++) {
      if (checkPrime(i)) nextPrime = i;
      if (i > n + 10000) break;
    }

    return { prevPrime, nextPrime };
  },

  /**
   * 执行质数计算
   */
  calculatePrime: function(num) {
    const startTime = Date.now();
    const primeCheck = this.isPrime(num);
    const endTime = Date.now();

    const properties = this.getPrimeProperties(num, primeCheck.isPrime);
    const nearestPrimes = this.findNearestPrimes(num);

    this.setData({
      inputValue: String(num),
      result: {
        number: num,
        isPrime: primeCheck.isPrime,
        reason: primeCheck.reason,
        properties: properties,
        calculationTime: endTime - startTime,
        prevPrime: nearestPrimes.prevPrime,
        nextPrime: nearestPrimes.nextPrime
      },
      showResult: true
    });
  },

  /**
   * 清空输入和结果
   */
  clearInput: function() {
    this.setData({
      inputValue: '',
      result: {},
      showResult: false
    });
  },

  /**
   * 复制结果
   */
  copyResult: function() {
    const result = this.data.result;
    const copyText = `质数判断结果：\n数字：${result.number}\n结果：${result.isPrime ? '质数' : '合数'}\n原因：${result.reason}`;

    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  /**
   * 页面加载
   */
  onLoad: function(options) {
    if (options.number) {
      this.setData({ inputValue: options.number });
      this.calculatePrime(parseInt(options.number));
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.clearInput();
    wx.stopPullDownRefresh();
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    return {
      title: '质数判断 - 快速判断质数',
      path: '/packages/math/pages/prime-checker/prime-checker'
    };
  },

  onShareTimeline: function() {
    return {
      title: '质数判断 - 快速判断质数',
      query: 'prime-checker'
    };
  }
});
