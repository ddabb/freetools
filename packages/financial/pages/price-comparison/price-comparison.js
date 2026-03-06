// packages/financial/pages/price-comparison/price-comparison.js
Page({
  data: {
    items: [
      { name: '', price: '', spec: '', unitPrice: '' },
      { name: '', price: '', spec: '', unitPrice: '' },
      { name: '', price: '', spec: '', unitPrice: '' }
    ]
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '价格对比'
    })
  },

  onNameInput(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    items[index].name = e.detail.value
    this.setData({ items })
  },

  onPriceInput(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    items[index].price = e.detail.value
    this.setData({ items })
  },

  onSpecInput(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    items[index].spec = e.detail.value
    this.setData({ items })
  },

  calculate() {
    const items = this.data.items.map(item => {
      if (item.price && item.spec && item.spec > 0) {
        const unitPrice = (parseFloat(item.price) / parseFloat(item.spec)).toFixed(2)
        return { ...item, unitPrice }
      }
      return { ...item, unitPrice: '' }
    })

    this.setData({ items })
  },

  addItem() {
    if (this.data.items.length < 5) {
      const items = [...this.data.items, { name: '', price: '', spec: '', unitPrice: '' }]
      this.setData({ items })
    } else {
      wx.showToast({
        title: '最多对比5个商品',
        icon: 'none'
      })
    }
  },

  removeItem(e) {
    const index = e.currentTarget.dataset.index
    if (this.data.items.length > 1) {
      const items = this.data.items.filter((_, i) => i !== index)
      this.setData({ items })
    }
  },

  reset() {
    this.setData({
      items: [
        { name: '', price: '', spec: '', unitPrice: '' },
        { name: '', price: '', spec: '', unitPrice: '' },
        { name: '', price: '', spec: '', unitPrice: '' }
      ]
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '价格对比工具 - 哪个更划算一目了然',
      path: '/packages/financial/pages/price-comparison/price-comparison',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '价格对比工具 - 哪个更划算一目了然',
      imageUrl: ''
    }
  }
})