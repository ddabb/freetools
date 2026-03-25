Component({
  properties: {
    list: {
      type: Array,
      value: []
    },
    current: {
      type: Number,
      value: 0
    }
  },

  data: {},

  methods: {
    onTabClick(e) {
      const index = e.currentTarget.dataset.index;
      if (index !== this.data.current) {
        this.setData({ current: index });
        this.triggerEvent('tabChange', { index });
      }
    }
  }
});