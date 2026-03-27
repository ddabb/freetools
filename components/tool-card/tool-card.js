// components/tool-card/tool-card.js
Component({
  properties: {
    // 工具ID
    id: { type: String, value: '' },
    // 工具名称
    name: { type: String, value: '' },
    // 工具图标
    icon: { type: String, value: '🔧' },
    // 工具描述
    description: { type: String, value: '' },
    // 工具链接
    url: { type: String, value: '' },
    // 热度值 0-100
    frequency: { type: Number, value: 50 },
    // 分类名称（用于颜色样式）
    category: { type: String, value: 'text' }
  },

  data: {},

  methods: {
    onTap() {
      this.triggerEvent('tap', {
        id: this.properties.id,
        url: this.properties.url,
        name: this.properties.name,
        icon: this.properties.icon
      });
    }
  }
});
