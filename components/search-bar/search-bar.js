Component({
  properties: {
    placeholder: {
      type: String,
      value: '搜索'
    },
    value: {
      type: String,
      value: ''
    },
    showCancel: {
      type: Boolean,
      value: false
    },
    cancelText: {
      type: String,
      value: '取消'
    }
  },

  data: {},

  methods: {
    onInput(e) {
      const value = e.detail.value;
      this.setData({ value });
      this.triggerEvent('input', { value });
    },

    onFocus() {
      this.triggerEvent('focus');
    },

    onBlur() {
      this.triggerEvent('blur');
    },

    onConfirm(e) {
      const value = e.detail.value;
      this.triggerEvent('confirm', { value });
    },

    onClear() {
      this.setData({ value: '' });
      this.triggerEvent('clear');
      this.triggerEvent('input', { value: '' });
    },

    onCancel() {
      this.triggerEvent('cancel');
    }
  }
});