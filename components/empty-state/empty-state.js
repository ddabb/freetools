Component({
  properties: {
    icon: {
      type: String,
      value: 'info'
    },
    image: {
      type: String,
      value: ''
    },
    iconSize: {
      type: Number,
      value: 100
    },
    iconColor: {
      type: String,
      value: '#999999'
    },
    text: {
      type: String,
      value: '暂无数据'
    },
    subText: {
      type: String,
      value: ''
    },
    showButton: {
      type: Boolean,
      value: false
    },
    buttonText: {
      type: String,
      value: '重试'
    },
    buttonSize: {
      type: String,
      value: 'default'
    }
  },

  data: {},

  methods: {
    onButtonClick() {
      this.triggerEvent('buttonClick');
    }
  }
});