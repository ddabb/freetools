// error-state.js
Component({
  properties: {
    // 错误提示文本
    text: {
      type: String,
      value: '加载失败'
    },
    // 错误提示子文本
    subText: {
      type: String,
      value: ''
    },
    // 图标类型（使用微信内置图标）
    icon: {
      type: String,
      value: ''
    },
    // 自定义图标图片路径
    image: {
      type: String,
      value: ''
    },
    // 图标大小（rpx）
    iconSize: {
      type: Number,
      value: 80
    },
    // 图标颜色
    iconColor: {
      type: String,
      value: '#ff4d4f'
    },
    // 是否显示主按钮
    showButton: {
      type: Boolean,
      value: true
    },
    // 主按钮文本
    buttonText: {
      type: String,
      value: '重试'
    },
    // 按钮尺寸（default, mini）
    buttonSize: {
      type: String,
      value: 'default'
    },
    // 是否显示次要按钮
    showSecondaryButton: {
      type: Boolean,
      value: false
    },
    // 次要按钮文本
    secondaryButtonText: {
      type: String,
      value: '取消'
    }
  },
  data: {
  },
  methods: {
    // 主按钮点击事件
    onButtonClick() {
      this.triggerEvent('buttonClick');
    },
    // 次要按钮点击事件
    onSecondaryButtonClick() {
      this.triggerEvent('secondaryButtonClick');
    }
  }
});