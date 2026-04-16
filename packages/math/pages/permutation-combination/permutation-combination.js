// packages/math/pages/permutation-combination/permutation-combination.js
// 实时计算，无按钮

Page({
  data: {
    n: '',
    r: '',
    permutation: 0,
    combination: 0,
    showResult: false,
    error: '',
    examples: [
      { n: 5, r: 2 },
      { n: 10, r: 3 },
      { n: 6, r: 4 },
      { n: 8, r: 5 },
      { n: 52, r: 5 },
      { n: 10, r: 10 }
    ]
  },

  /**
   * n 输入变化
   */
  onNChange: function(e) {
    const n = e.detail.value;
    this.setData({ n });
    this.calculate();
  },

  /**
   * r 输入变化
   */
  onRChange: function(e) {
    const r = e.detail.value;
    this.setData({ r });
    this.calculate();
  },

  /**
   * 计算排列组合
   */
  calculate: function() {
    const { n, r } = this.data;

    // 两个输入都为空，不显示结果
    if (!n && !r) {
      this.setData({
        showResult: false,
        error: ''
      });
      return;
    }

    // 解析数字
    const nNum = parseInt(n, 10);
    const rNum = parseInt(r, 10);

    // 验证 n
    if (n && (isNaN(nNum) || nNum < 1)) {
      this.setData({
        error: 'n 必须是大于 0 的正整数',
        showResult: false
      });
      return;
    }

    // 验证 r
    if (r && (isNaN(rNum) || rNum < 1)) {
      this.setData({
        error: 'r 必须是大于 0 的正整数',
        showResult: false
      });
      return;
    }

    // 如果两个都有效
    if (n && r) {
      // 检查 r > n
      if (rNum > nNum) {
        this.setData({
          error: 'r 不能大于 n',
          showResult: false
        });
        return;
      }

      // 计算阶乘，检查是否超出范围
      try {
        const permutation = this.permutation(nNum, rNum);
        const combination = this.combination(nNum, rNum);

        this.setData({
          permutation,
          combination,
          showResult: true,
          error: ''
        });
      } catch (e) {
        this.setData({
          error: '计算结果过大，已超出范围',
          showResult: false
        });
      }
    } else {
      // 只有一个输入
      this.setData({
        showResult: false,
        error: ''
      });
    }
  },

  /**
   * 计算排列 A(n,r) = n! / (n-r)!
   */
  permutation: function(n, r) {
    if (r > n) return 0;
    let result = 1;
    for (let i = 0; i < r; i++) {
      result *= (n - i);
    }
    return result;
  },

  /**
   * 计算组合 C(n,r) = n! / (r! * (n-r)!)
   */
  combination: function(n, r) {
    if (r > n) return 0;
    // 取较小的 r 以优化
    r = Math.min(r, n - r);
    let result = 1;
    for (let i = 0; i < r; i++) {
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  },

  /**
   * 使用示例
   */
  useExample: function(e) {
    const { n, r } = e.currentTarget.dataset;
    this.setData({
      n: String(n),
      r: String(r)
    });
    this.calculate();
  },

  onLoad: function() {
    wx.setNavigationBarTitle({ title: '🔢 排列组合' });
  }
});
