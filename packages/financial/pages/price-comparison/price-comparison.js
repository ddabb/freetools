// packages/financial/pages/price-comparison/price-comparison.js

// 单位换算配置
const UNIT_CONFIG = {
  // 重量单位 (统一转换为克)
  weight: {
    g: { factor: 1, name: '克' },
    kg: { factor: 1000, name: '千克' },
    mg: { factor: 0.001, name: '毫克' },
    jin: { factor: 500, name: '斤' },
    liang: { factor: 50, name: '两' },
    oz: { factor: 28.35, name: '盎司' },
    lb: { factor: 453.59, name: '磅' }
  },
  // 体积单位 (统一转换为毫升)
  volume: {
    ml: { factor: 1, name: '毫升' },
    l: { factor: 1000, name: '升' },
    dl: { factor: 100, name: '分升' },
    floz: { factor: 29.57, name: '液盎司' },
    gal: { factor: 3785.41, name: '加仑' }
  },
  // 数量单位 (统一转换为个)
  count: {
    ge: { factor: 1, name: '个' },
    jian: { factor: 1, name: '件' },
    zhi: { factor: 1, name: '只' },
    ping: { factor: 1, name: '瓶' },
    bao: { factor: 1, name: '包' },
    he: { factor: 1, name: '盒' },
    dai: { factor: 1, name: '袋' },
    xiang: { factor: 1, name: '箱' }
  },
  // 长度单位 (统一转换为厘米)
  length: {
    mm: { factor: 0.1, name: '毫米' },
    cm: { factor: 1, name: '厘米' },
    dm: { factor: 10, name: '分米' },
    m: { factor: 100, name: '米' },
    km: { factor: 100000, name: '千米' },
    inch: { factor: 2.54, name: '英寸' },
    ft: { factor: 30.48, name: '英尺' }
  }
};

// 所有单位选项
const UNIT_OPTIONS = [
  { category: 'weight', label: '重量', units: Object.entries(UNIT_CONFIG.weight).map(([k, v]) => ({ value: `weight:${k}`, label: v.name })) },
  { category: 'volume', label: '体积', units: Object.entries(UNIT_CONFIG.volume).map(([k, v]) => ({ value: `volume:${k}`, label: v.name })) },
  { category: 'count', label: '数量', units: Object.entries(UNIT_CONFIG.count).map(([k, v]) => ({ value: `count:${k}`, label: v.name })) },
  { category: 'length', label: '长度', units: Object.entries(UNIT_CONFIG.length).map(([k, v]) => ({ value: `length:${k}`, label: v.name })) }
];

Page({
  data: {
    items: [],
    unitOptions: UNIT_OPTIONS,
    showResult: false,
    bestDealIndex: -1,
    history: [],
    showHistory: false,
    sortByUnitPrice: true
  },

  onLoad() {
    this.loadHistory();
    this.addItem();
    this.addItem();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('priceComparisonHistory') || [];
    this.setData({ history: history.slice(0, 20) });
  },

  // 保存历史记录
  saveHistory() {
    wx.setStorageSync('priceComparisonHistory', this.data.history);
  },

  // 添加商品
  addItem() {
    const items = this.data.items;
    if (items.length >= 8) {
      wx.showToast({ title: '最多添加8个商品', icon: 'none' });
      return;
    }
    
    const newItem = {
      name: '',
      price: '',
      quantity: '',
      unit: 'weight:kg',
      unitPrice: null,
      normalizedPrice: null,
      error: ''
    };
    
    this.setData({
      items: [...items, newItem],
      showResult: false
    });
  },

  // 删除商品
  removeItem(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items.filter((_, i) => i !== index);
    this.setData({ 
      items: items.length ? items : [{ name: '', price: '', quantity: '', unit: 'weight:kg', unitPrice: null, normalizedPrice: null, error: '' }],
      showResult: false
    });
  },

  // 输入商品名称
  onNameInput(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    items[index].name = e.detail.value;
    this.setData({ items });
  },

  // 输入价格
  onPriceInput(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    const value = e.detail.value;
    
    // 只允许数字和小数点
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    items[index].price = value;
    items[index].error = '';
    this.setData({ items, showResult: false });
  },

  // 输入数量
  onQuantityInput(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    const value = e.detail.value;
    
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    items[index].quantity = value;
    items[index].error = '';
    this.setData({ items, showResult: false });
  },

  // 选择单位
  onUnitChange(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    const unitValue = e.detail.value;
    
    // 找到选中的单位
    let selectedUnit = 'weight:kg';
    for (const group of UNIT_OPTIONS) {
      const found = group.units[unitValue[0]];
      if (found) {
        selectedUnit = found.value;
        break;
      }
    }
    
    items[index].unit = selectedUnit;
    this.setData({ items, showResult: false });
  },

  // 计算单价
  calculate() {
    const items = this.data.items;
    let hasError = false;
    let validItems = 0;

    // 验证输入
    items.forEach((item, index) => {
      item.error = '';
      
      if (!item.price && !item.quantity) {
        // 空商品，跳过
        return;
      }
      
      validItems++;
      
      if (!item.price || parseFloat(item.price) <= 0) {
        item.error = '请输入有效的价格';
        hasError = true;
      } else if (!item.quantity || parseFloat(item.quantity) <= 0) {
        item.error = '请输入有效的数量';
        hasError = true;
      }
    });

    if (validItems < 2) {
      wx.showToast({ title: '请至少输入两个商品', icon: 'none' });
      return;
    }

    if (hasError) {
      this.setData({ items });
      return;
    }

    // 计算单价
    let minPrice = Infinity;
    let bestIndex = -1;

    items.forEach((item, index) => {
      if (!item.price || !item.quantity) {
        item.unitPrice = null;
        item.normalizedPrice = null;
        return;
      }

      const price = parseFloat(item.price);
      const quantity = parseFloat(item.quantity);
      
      // 解析单位
      const [category, unitKey] = item.unit.split(':');
      const unitConfig = UNIT_CONFIG[category]?.[unitKey];
      
      if (unitConfig) {
        // 标准化数量（转换为基准单位）
        const normalizedQty = quantity * unitConfig.factor;
        // 计算标准化单价（每基准单位的价格）
        item.normalizedPrice = price / normalizedQty;
        // 显示单价（保留4位小数）
        item.unitPrice = item.normalizedPrice.toFixed(4);
        
        // 找出最划算的
        if (item.normalizedPrice < minPrice) {
          minPrice = item.normalizedPrice;
          bestIndex = index;
        }
      }
    });

    // 添加到历史记录
    const record = {
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      items: items.filter(i => i.price && i.quantity).map(i => ({
        name: i.name || '未命名商品',
        price: i.price,
        quantity: i.quantity,
        unit: this.getUnitName(i.unit),
        unitPrice: i.unitPrice
      })),
      bestIndex: bestIndex
    };
    
    const history = [record, ...this.data.history].slice(0, 20);
    this.setData({ history });
    this.saveHistory();

    this.setData({
      items,
      showResult: true,
      bestDealIndex: bestIndex
    });

    // 显示结果提示
    if (bestIndex >= 0) {
      const bestItem = items[bestIndex];
      const name = bestItem.name || `商品${bestIndex + 1}`;
      wx.showToast({ 
        title: `${name} 最划算！`, 
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 获取单位名称
  getUnitName(unitValue) {
    const [category, unitKey] = unitValue.split(':');
    return UNIT_CONFIG[category]?.[unitKey]?.name || unitKey;
  },

  // 重置
  reset() {
    wx.showModal({
      title: '确认重置',
      content: '清空所有商品数据？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            items: [
              { name: '', price: '', quantity: '', unit: 'weight:kg', unitPrice: null, normalizedPrice: null, error: '' },
              { name: '', price: '', quantity: '', unit: 'weight:kg', unitPrice: null, normalizedPrice: null, error: '' }
            ],
            showResult: false,
            bestDealIndex: -1
          });
        }
      }
    });
  },

  // 切换历史记录显示
  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  // 从历史记录加载
  loadFromHistory(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.history[index];
    
    if (!record || !record.items) return;

    const items = record.items.map(item => ({
      name: item.name === '未命名商品' ? '' : item.name,
      price: item.price,
      quantity: item.quantity,
      unit: this.findUnitValue(item.unit),
      unitPrice: null,
      normalizedPrice: null,
      error: ''
    }));

    this.setData({
      items,
      showResult: false,
      bestDealIndex: -1,
      showHistory: false
    });

    wx.showToast({ title: '已加载历史记录', icon: 'success' });
  },

  // 根据单位名称查找单位值
  findUnitName(unitName) {
    for (const [cat, units] of Object.entries(UNIT_CONFIG)) {
      for (const [key, config] of Object.entries(units)) {
        if (config.name === unitName) return `${cat}:${key}`;
      }
    }
    return 'weight:kg';
  },

  // 查找单位值
  findUnitValue(unitName) {
    for (const [cat, units] of Object.entries(UNIT_CONFIG)) {
      for (const [key, config] of Object.entries(units)) {
        if (config.name === unitName) return `${cat}:${key}`;
      }
    }
    return 'weight:kg';
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '删除所有历史记录？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          this.saveHistory();
        }
      }
    });
  },

  // 分享结果
  shareResult() {
    const items = this.data.items.filter(i => i.unitPrice);
    if (items.length === 0) {
      wx.showToast({ title: '请先计算结果', icon: 'none' });
      return;
    }

    let text = '🛒 价格对比结果\n\n';
    items.forEach((item, index) => {
      const name = item.name || `商品${index + 1}`;
      const isBest = index === this.data.bestDealIndex;
      text += `${isBest ? '✅ ' : ''}${name}\n`;
      text += `   价格：¥${item.price} / ${item.quantity}${this.getUnitName(item.unit)}\n`;
      text += `   单价：¥${item.unitPrice}/${this.getBaseUnit(item.unit)}\n\n`;
    });

    if (this.data.bestDealIndex >= 0) {
      const best = items[this.data.bestDealIndex];
      text += `💡 推荐：${best.name || `商品${this.data.bestDealIndex + 1}`} 最划算！`;
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '结果已复制', icon: 'success' });
      }
    });
  },

  // 获取基准单位名称
  getBaseUnit(unitValue) {
    const [category] = unitValue.split(':');
    const baseUnits = {
      weight: '克',
      volume: '毫升',
      count: '个',
      length: '厘米'
    };
    return baseUnits[category] || '';
  }
});
