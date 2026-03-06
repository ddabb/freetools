// components/tool-card/tool-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 工具名称
    name: {
      type: String,
      value: ''
    },
    // 工具图标
    icon: {
      type: String,
      value: ''
    },
    // 工具颜色
    color: {
      type: String,
      value: 'blue'
    },
    // 工具链接
    url: {
      type: String,
      value: ''
    },
    // 工具描述
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
  methods: {
    onCardTap() {
      // 工具卡片点击震动反馈（短震动）
      wx.vibrateShort({
        type: 'light'
      });
      
      if (this.properties.url) {
        // 判断是否是 tabBar 页面
        const tabbarPages = ['/pages/index/index', '/pages/discover/discover', '/pages/mine/mine'];
        const urlPath = this.properties.url.split('?')[0]; // 获取路径部分，去掉参数

        if (tabbarPages.includes(urlPath)) {
          // tabBar 页面使用 switchTab
          wx.switchTab({
            url: this.properties.url,
            fail: (err) => {
              console.error('页面跳转失败:', err);
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          // 普通页面使用 navigateTo
          wx.navigateTo({
            url: this.properties.url,
            fail: (err) => {
              console.error('页面跳转失败:', err);
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              });
            }
          });
        }
      }
    }
  }
})
