// components/category-card/category-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 分类名称
    name: {
      type: String,
      value: ''
    },
    // 分类图标
    icon: {
      type: String,
      value: ''
    },
    // 分类颜色
    color: {
      type: String,
      value: 'blue'
    },
    // 分类链接
    url: {
      type: String,
      value: ''
    },
    // 分类描述
    description: {
      type: String,
      value: ''
    },
    // 卡片尺寸：large（大）、medium（中）、small（小）
    size: {
      type: String,
      value: 'medium'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {}
})
