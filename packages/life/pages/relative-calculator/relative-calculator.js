// 导入RelativeCalculator类
const RelativeCalculator = require('./relativeCalculator');

// 创建亲属关系计算器实例
const calculator = new RelativeCalculator();

Page({
  data: {
    relationshipChain: [],
    result: '',
    inputDisplayText: '',
    loading: true,
    error: ''
  },

  onLoad() {
    this.loadRelationData();
  },

  // 加载亲属关系数据
  async loadRelationData() {
    try {
      this.setData({ loading: true, error: '' });
      await calculator.loadRelationGraph();
      this.setData({ loading: false });
    } catch (error) {
      console.error('加载亲属关系数据失败:', error);
      this.setData({ 
        loading: false, 
        error: '数据加载失败，请检查网络连接' 
      });
    }
  },

  // 添加亲戚关系（实时计算）
  addRelation: function (e) {
    if (this.data.loading) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'loading' });
      return;
    }

    if (this.data.error) {
      wx.showToast({ title: this.data.error, icon: 'none' });
      return;
    }

    console.log('addRelation called', e);
    console.log('current dataset:', e.currentTarget.dataset);

    // 直接使用 data-relation 的值（按钮上显示的文本）
    const relation = e.currentTarget.dataset.relation;
    console.log('selected relation:', relation);

    const newChain = [...this.data.relationshipChain, relation];
    console.log('new relationship chain:', newChain);

    // 实时计算结果
    const result = calculator.calculate(newChain);
    const inputDisplayText = newChain.length === 0 ? '' : `我的${newChain.join('的')}`;

    this.setData({
      relationshipChain: newChain,
      result: result,
      inputDisplayText: inputDisplayText
    }, () => {
      console.log('UI updated, current data:', this.data);
    });
  },

  // 删除最后一个关系（实时计算）
  deleteRelation: function () {
    if (this.data.loading) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'loading' });
      return;
    }

    if (this.data.relationshipChain.length > 0) {
      const newChain = this.data.relationshipChain.slice(0, -1);
      const result = newChain.length > 0 ? calculator.calculate(newChain) : '';
      const inputDisplayText = newChain.length === 0 ? '' : `我的${newChain.join('的')}`;

      this.setData({
        relationshipChain: newChain,
        result: result,
        inputDisplayText: inputDisplayText
      });
    }
  },

  // 清空单个关系（C按钮）
  clearRelations: function () {
    this.setData({
      relationshipChain: [],
      result: '',
      inputDisplayText: ''
    });
  },

  // 清空所有（清空按钮）
  clearAll: function () {
    this.setData({
      relationshipChain: [],
      result: '',
      inputDisplayText: ''
    });
  },

  // 获取口语化显示文本
  getDisplayText: function (chain) {
    console.log('getDisplayText called with chain:', chain);
    if (!chain || chain.length === 0) return '';

    const result = chain.join('的');
    console.log('getDisplayText result:', result);
    return result;
  },

  // 打开设置
  openSettings: function () {
    wx.showToast({
      title: '设置功能尚未实现',
      icon: 'none'
    });
  },

  // 跳转到关于页面
  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '亲戚关系计算器',
      path: '/packages/life/pages/relative-calculator/relative-calculator'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '亲戚关系计算器 - 轻松计算复杂亲戚关系'
    };
  }
});