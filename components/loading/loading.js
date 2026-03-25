Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    mask: {
      type: Boolean,
      value: true
    },
    text: {
      type: String,
      value: '加载中...'
    }
  },

  data: {},

  methods: {
    show(options) {
      this.setData({
        visible: true,
        ...options
      });
    },

    hide() {
      this.setData({ visible: false });
    }
  }
});