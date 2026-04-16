// components/tool-detail-modal/tool-detail-modal.js
/**
 * 工具详情弹窗组件
 * 统一处理：成语详情、工具卡片详情、词条详情
 * 
 * 使用方式：
 * <tool-detail-modal 
 *   show="{{showDetail}}" 
 *   type="idiom"
 *   data="{{detailData}}"
 *   bindclose="onDetailClose"
 *   bindaction="onDetailAction"
 * />
 */

Component({
  options: {
    styleIsolation: 'shared',
    multipleSlots: true
  },

  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this._onShow();
        } else {
          this._onHide();
        }
      }
    },

    // 详情类型：idiom | tool | article | custom
    type: {
      type: String,
      value: 'custom'
    },

    // 详情数据
    data: {
      type: Object,
      value: null,
      observer(newVal) {
        if (newVal) {
          this._processData(newVal);
        }
      }
    },

    // 自定义标题（覆盖 data.title）
    title: {
      type: String,
      value: ''
    },

    // 自定义副标题（覆盖 data.subtitle）
    subtitle: {
      type: String,
      value: ''
    },

    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      value: true
    },

    // 是否显示操作按钮
    showAction: {
      type: Boolean,
      value: false
    },

    // 操作按钮文字
    actionText: {
      type: String,
      value: '确定'
    },

    // 是否显示复制按钮
    showCopy: {
      type: Boolean,
      value: false
    },

    // 复制按钮文字
    copyText: {
      type: String,
      value: '📋 复制'
    },

    // 点击遮罩是否关闭
    maskClosable: {
      type: Boolean,
      value: true
    },

    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 处理后的展示数据
    displayData: null,
    // 动画状态
    animationClass: ''
  },

  methods: {
    // ========== 生命周期 ==========
    _onShow() {
      this.setData({ animationClass: 'show' });
    },

    _onHide() {
      this.setData({ animationClass: '' });
    },

    // ========== 数据处理 ==========
    _processData(rawData) {
      const { type } = this.properties;
      let displayData = {};

      switch (type) {
        case 'idiom':
          displayData = this._processIdiomData(rawData);
          break;
        case 'tool':
          displayData = this._processToolData(rawData);
          break;
        case 'article':
          displayData = this._processArticleData(rawData);
          break;
        default:
          displayData = this._processCustomData(rawData);
      }

      this.setData({ displayData });
    },

    // 成语数据格式化
    _processIdiomData(data) {
      return {
        title: data.word || data.title || '',
        subtitle: data.pinyin || '',
        sections: [
          {
            key: 'explanation',
            title: '释义',
            content: data.explanation || data.meaning || '',
            showCopy: true
          },
          {
            key: 'derivation',
            title: '出处',
            content: data.derivation || data.source || '',
            showCopy: false
          },
          {
            key: 'example',
            title: '示例',
            content: data.example || '',
            showCopy: false
          }
        ].filter(s => s.content)
      };
    },

    // 工具数据格式化
    _processToolData(data) {
      return {
        title: data.name || data.title || '',
        subtitle: data.subtitle || data.description || '',
        icon: data.icon || '',
        tags: data.tags || data.keywords || [],
        sections: [
          {
            key: 'description',
            title: '功能说明',
            content: data.description || data.detail || '',
            showCopy: false
          },
          {
            key: 'usage',
            title: '使用方法',
            content: data.usage || data.guide || '',
            showCopy: false
          }
        ].filter(s => s.content)
      };
    },

    // 文章数据格式化
    _processArticleData(data) {
      return {
        title: data.title || '',
        subtitle: data.category || data.author || '',
        tags: data.tags || [],
        sections: [
          {
            key: 'summary',
            title: '摘要',
            content: data.summary || data.excerpt || data.description || '',
            showCopy: true
          },
          {
            key: 'content',
            title: '内容',
            content: data.content || '',
            showCopy: true
          }
        ].filter(s => s.content)
      };
    },

    // 自定义数据格式化
    _processCustomData(data) {
      return {
        title: data.title || '',
        subtitle: data.subtitle || '',
        icon: data.icon || '',
        tags: data.tags || [],
        sections: data.sections || [
          {
            key: 'content',
            title: data.sectionTitle || '详情',
            content: data.content || '',
            showCopy: this.properties.showCopy
          }
        ]
      };
    },

    // ========== 事件处理 ==========
    // 点击遮罩关闭
    onMaskTap() {
      if (this.properties.maskClosable) {
        this.onClose();
      }
    },

    // 关闭弹窗
    onClose() {
      this.triggerEvent('close');
    },

    // 阻止冒泡
    onBoxTap() {
      // 阻止事件冒泡到遮罩
    },

    // 操作按钮点击
    onActionTap() {
      const { displayData } = this.data;
      this.triggerEvent('action', { 
        type: this.properties.type,
        data: this.properties.data,
        displayData 
      });
    },

    // 复制内容
    onCopyTap(e) {
      const { key } = e.currentTarget.dataset;
      const { displayData } = this.data;
      const section = displayData.sections.find(s => s.key === key);
      
      if (!section || !section.content) return;

      const text = section.content;
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({ title: '已复制', icon: 'success' });
          this.triggerEvent('copy', { key, text, type: this.properties.type });
        }
      });
    },

    // 复制全部
    onCopyAll() {
      const { displayData } = this.data;
      const texts = [
        displayData.title,
        displayData.subtitle,
        ...displayData.sections.map(s => `${s.title}：${s.content}`)
      ].filter(Boolean);

      wx.setClipboardData({
        data: texts.join('\n\n'),
        success: () => {
          wx.showToast({ title: '已复制全部', icon: 'success' });
          this.triggerEvent('copyall', { type: this.properties.type, data: this.properties.data });
        }
      });
    },

    // 标签点击
    onTagTap(e) {
      const { tag } = e.currentTarget.dataset;
      this.triggerEvent('tagtap', { tag, type: this.properties.type });
    }
  }
});
