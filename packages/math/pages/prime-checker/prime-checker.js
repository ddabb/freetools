// prime-checker.js - 质数判断功能
// 使用6k±1优化算法，性能优异

Page({
  data: {
    inputValue: '',
    result: {},
    showResult: false,
    loading: false,
    inputFocus: false
  },

  /**
   * 输入框内容变化事件
   */
  onInputChange: function(e) {
    this.setData({
      inputValue: e.detail.value,
      showResult: false
    });
  },

  /**
   * 质数判断核心算法 - 6k±1优化
   * 时间复杂度: O(√n)
   * 空间复杂度: O(1)
   */
  isPrime: function(n) {
    // 处理小数字情况
    if (n <= 1) return { isPrime: false, reason: '小于等于1的数不是质数' };
    if (n <= 3) return { isPrime: true, reason: '2和3是最小的质数' };
    if (n % 2 === 0) return { isPrime: false, reason: '能被2整除，是偶数' };
    if (n % 3 === 0) return { isPrime: false, reason: '能被3整除' };

    // 6k±1优化：所有质数都可以表示为 6k±1 的形式（除了2和3）
    // 只需检查形如 6k±1 的数是否能整除n
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
      // 质数性质
      if (n === 2) properties.push('唯一的偶质数');
      if (n === 3) properties.push('最小的奇质数');
      if (n > 2) properties.push('奇质数');
      
      // 检查是否为特殊质数
      if (this.isMersennePrime(n)) properties.push('梅森质数');
      if (this.isTwinPrime(n)) properties.push('孪生质数之一');
      if (this.isSafePrime(n)) properties.push('安全质数');
    } else {
      // 合数性质
      if (n % 2 === 0) properties.push('偶数');
      else properties.push('奇数');
      
      if (n > 1) {
        const factors = this.getSmallFactors(n);
        if (factors.length > 0) {
          properties.push(`因数: ${factors.join(', ')}`);
        }
      }
    }
    
    return properties;
  },

  /**
   * 检查是否为梅森质数 (2^p - 1)
   */
  isMersennePrime: function(n) {
    const mersennePrimes = [3, 7, 31, 127, 8191, 131071, 524287, 2147483647];
    return mersennePrimes.includes(n);
  },

  /**
   * 检查是否为孪生质数之一 (p, p+2 都是质数)
   */
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

  /**
   * 检查是否为安全质数 (p = 2q + 1, q也是质数)
   */
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
   * 获取小因数（用于合数说明）
   */
  getSmallFactors: function(n) {
    const factors = [];
    const limit = Math.min(100, Math.sqrt(n));
    
    for (let i = 2; i <= limit && factors.length < 5; i++) {
      if (n % i === 0) {
        factors.push(i);
        const complement = n / i;
        if (complement !== i && complement <= 1000000) {
          factors.push(complement);
        }
      }
    }
    
    return factors.slice(0, 5).sort((a, b) => a - b);
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

    // 查找前一个质数
    for (let i = n - 1; i >= 2 && prevPrime === null; i--) {
      if (checkPrime(i)) prevPrime = i;
    }

    // 查找后一个质数
    for (let i = n + 1; nextPrime === null; i++) {
      if (checkPrime(i)) nextPrime = i;
      if (i > n + 10000) break; // 防止无限循环
    }

    return { prevPrime, nextPrime };
  },

  /**
   * 判断质数主函数
   */
  checkPrime: function() {
    const inputValue = this.data.inputValue.trim();
    
    // 空值校验
    if (!inputValue) {
      wx.showToast({
        title: '请输入一个整数',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 数值转换和校验
    const num = parseInt(inputValue);
    if (isNaN(num)) {
      wx.showToast({
        title: '请输入有效的整数',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (num > 9007199254740991) {
      wx.showToast({
        title: '数字过大，请输入更小的数',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ loading: true });
    
    // 使用setTimeout避免界面卡顿
    setTimeout(() => {
      const startTime = Date.now();
      const primeCheck = this.isPrime(num);
      const endTime = Date.now();
      const calculationTime = endTime - startTime;
      
      const properties = this.getPrimeProperties(num, primeCheck.isPrime);
      const nearestPrimes = this.findNearestPrimes(num);
      
      const resultText = primeCheck.isPrime ? 
        `${num} 是质数` : 
        `${num} 不是质数`;
      
      const explanation = primeCheck.isPrime ? 
        `${num} 是质数，因为它只能被1和自身整除。` : 
        `${num} 不是质数，${primeCheck.reason}。`;
      
      this.setData({
        result: {
          number: num,
          isPrime: primeCheck.isPrime,
          resultText: resultText,
          reason: primeCheck.reason,
          properties: properties,
          calculationTime: calculationTime,
          prevPrime: nearestPrimes.prevPrime,
          nextPrime: nearestPrimes.nextPrime,
          explanation: explanation
        },
        showResult: true,
        loading: false
      });

      // 添加成功反馈
      wx.vibrateShort({
        type: 'light'
      });
    }, 100);
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
   * 重置功能
   */
  reset: function() {
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
    const copyText = `质数判断结果：\n输入数字：${result.number}\n判断结果：${result.resultText}\n${result.reason ? '原因：' + result.reason : ''}\n性质：${result.properties.join('、')}\n计算耗时：${result.calculationTime}ms`;
    
    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showToast({
          title: '结果已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 页面加载完成
   */
  onLoad: function(options) {
    console.log('质数判断页面加载完成');
    if (options.number) {
      this.setData({
        inputValue: options.number
      });
    }
  },

  /**
   * 页面初次渲染完成
   */
  onReady: function() {
    console.log('质数判断页面渲染完成');
  },

  /**
   * 页面显示
   */
  onShow: function() {
    console.log('质数判断页面显示');
  },

  /**
   * 页面隐藏
   */
  onHide: function() {
    console.log('质数判断页面隐藏');
  },

  /**
   * 页面卸载
   */
  onUnload: function() {
    console.log('质数判断页面卸载');
  },

  /**
   * 监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.reset();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '质数判断 - 快速判断质数',
      path: '/packages/math/pages/prime-checker/prime-checker'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function() {
    return {
      title: '质数判断 - 快速判断质数',
      query: 'prime-checker'
    };
  }
});
