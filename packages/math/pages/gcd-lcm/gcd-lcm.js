// packages/math/pages/gcd-lcm/gcd-lcm.js
const adBehavior = require('../../../../utils/ad-behavior');

Page({
  behaviors: [adBehavior],
  data: {
    num1: '', // 第一个数
    num2: '', // 第二个数
    gcd: 0, // 最大公约数
    lcm: 0, // 最小公倍数
    showResult: false, // 是否显示结果
    steps: [], // 计算步骤
    canCalculate: false, // 是否可以计算
    examples: [
      { num1: 48, num2: 18 },
      { num1: 100, num2: 75 },
      { num1: 36, num2: 24 },
      { num1: 144, num2: 96 }
    ]
  },

  // 设置第一个数
  setNum1(e) {
    const value = parseInt(e.detail.value) || '';
    this.setData({
      num1: value,
      showResult: false,
      canCalculate: value && this.data.num2 && value > 0 && this.data.num2 > 0
    });
  },

  // 设置第二个数
  setNum2(e) {
    const value = parseInt(e.detail.value) || '';
    this.setData({
      num2: value,
      showResult: false,
      canCalculate: this.data.num1 && value && this.data.num1 > 0 && value > 0
    });
  },

  // 计算最大公约数和最小公倍数
  calculate() {
    const { num1, num2 } = this.data;
    
    if (!num1 || !num2) {
      wx.showToast({
        title: '请输入两个数',
        icon: 'none'
      });
      return;
    }

    if (num1 < 1 || num2 < 1) {
      wx.showToast({
        title: '请输入正整数',
        icon: 'none'
      });
      return;
    }

    if (num1 > 999999 || num2 > 999999) {
      wx.showToast({
        title: '数字太大，请输入小于100万的整数',
        icon: 'none'
      });
      return;
    }

    try {
      // 计算最大公约数（欧几里得算法）
      const gcd = this.calculateGCD(num1, num2);
      
      // 计算最小公倍数
      const lcm = (num1 * num2) / gcd;

      // 生成计算步骤
      const steps = this.generateSteps(num1, num2, gcd);

      this.setData({
        gcd,
        lcm,
        showResult: true,
        steps
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

  // 欧几里得算法计算最大公约数
  calculateGCD(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    
    const steps = [];
    
    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    
    return x;
  },

  // 生成计算步骤说明
  generateSteps(num1, num2, gcd) {
    const steps = [];
    steps.push(`步骤1：使用欧几里得算法求 ${num1} 和 ${num2} 的最大公约数`);
    
    let a = Math.max(num1, num2);
    let b = Math.min(num1, num2);
    let stepNum = 2;
    
    while (b !== 0) {
      const remainder = a % b;
      steps.push(`步骤${stepNum}：${a} ÷ ${b} = ${Math.floor(a/b)} ${remainder}`);
      a = b;
      b = remainder;
      stepNum++;
    }
    
    steps.push(`步骤${stepNum}：余数为0，所以最大公约数为 ${a}`);
    steps.push(`步骤${stepNum + 1}：最小公倍数 = (${num1} × ${num2}) ÷ ${a} = ${(num1 * num2) / a}`);
    
    return steps;
  },    

  // 使用示例
  useExample(e) {
    const { num1, num2 } = e.currentTarget.dataset;
    this.setData({
      num1,
      num2,
      showResult: false
    });
    
    // 自动计算
    setTimeout(() => {
      this.calculate();
    }, 100);
  },



  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '公约数·公倍数'
    });
  },


})