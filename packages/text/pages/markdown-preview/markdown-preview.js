// packages/text/pages/markdown-preview/markdown-preview.js
Page({
  data: {
    markdownText: '',
    renderedHtml: '',
    themeIndex: 0,
    themes: ['默认', 'GitHub', '暗黑', '护眼'],
    isFullscreen: false
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: 'Markdown预览器' });
    this.loadDefaultContent();
  },

  setMarkdownText(e) {
    const text = e.detail.value;
    this.setData({ markdownText: text });
    this.renderMarkdown(text);
  },

  setTheme(e) {
    this.setData({ themeIndex: e.detail.value });
    this.renderMarkdown(this.data.markdownText);
  },

  renderMarkdown(markdown) {
    if (!markdown.trim()) {
      this.setData({ renderedHtml: '' });
      return;
    }

    try {
      let html = markdown;
      html = this.parseHeaders(html);
      html = this.parseBold(html);
      html = this.parseItalic(html);
      html = this.parseCode(html);
      html = this.parseLinks(html);
      html = this.parseLists(html);
      html = this.parseBlockquotes(html);
      html = this.parseHorizontalRules(html);
      
      const nodes = this.simpleHtmlToNodes(html);
      this.setData({ renderedHtml: nodes });
    } catch (error) {
      this.setData({ renderedHtml: '<div style="color: red;">渲染出错</div>' });
    }
  },

  parseHeaders(text) {
    return text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>');
  },

  parseBold(text) {
    return text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  },

  parseItalic(text) {
    return text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  },

  parseCode(text) {
    text = text.replace(/`([^`]+)`/gim, '<code>$1</code>');
    text = text.replace(/```([\\s\\S]*?)```/gim, '<pre><code>$1</code></pre>');
    return text;
  },

  parseLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  },

  parseLists(text) {
    return text.replace(/^- (.*$)/gim, '<li>$1</li>')
               .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  },

  parseBlockquotes(text) {
    return text.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  },

  parseHorizontalRules(text) {
    return text.replace(/^---$/gim, '<hr>');
  },

  simpleHtmlToNodes(html) {
    const lines = html.split('\n').filter(line => line.trim());
    const nodes = [];
    
    lines.forEach(line => {
      if (line.includes('<h1>')) {
        nodes.push({ name: 'div', attrs: { style: 'font-size: 24px; font-weight: bold; margin: 15px 0;' }, children: [{ type: 'text', text: line.replace(/<[^>]*>/g, '') }] });
      } else if (line.includes('<h2>')) {
        nodes.push({ name: 'div', attrs: { style: 'font-size: 20px; font-weight: bold; margin: 12px 0;' }, children: [{ type: 'text', text: line.replace(/<[^>]*>/g, '') }] });
      } else if (line.includes('<strong>')) {
        nodes.push({ name: 'div', attrs: { style: 'font-weight: bold; margin: 8px 0;' }, children: [{ type: 'text', text: line.replace(/<[^>]*>/g, '') }] });
      } else if (line.includes('<code>')) {
        nodes.push({ name: 'div', attrs: { style: 'background: #f4f4f4; padding: 8px; border-radius: 3px; font-family: monospace;' }, children: [{ type: 'text', text: line.replace(/<[^>]*>/g, '') }] });
      } else if (line.includes('<li>')) {
        nodes.push({ name: 'div', attrs: { style: 'margin: 5px 0; padding-left: 20px;' }, children: [{ type: 'text', text: '• ' + line.replace(/<[^>]*>/g, '') }] });
      } else if (line.trim()) {
        nodes.push({ name: 'div', attrs: { style: 'margin: 8px 0;' }, children: [{ type: 'text', text: line.replace(/<[^>]*>/g, '') }] });
      }
    });
    
    return nodes;
  },

  loadDefaultContent() {
    const defaultMarkdown = `# Markdown预览器\n\n## 功能特点\n\n- **实时预览**: 输入即预览\n- **语法支持**: 标题、粗体、斜体、代码等\n- **多主题**: 多种视觉主题选择\n\n## 示例\n\n这是 **粗体** 和 *斜体* 文本。\n\n### 代码示例\n\`\`\`javascript\nconsole.log("Hello World");\n\`\`\`\n\n开始使用吧！`;
    
    this.setData({ markdownText: defaultMarkdown });
    this.renderMarkdown(defaultMarkdown);
  },

  insertTemplate() {
    wx.showToast({ title: '模板功能开发中', icon: 'none' });
  },

  toggleFullscreen() {
    wx.showToast({ title: '全屏功能开发中', icon: 'none' });
  },

  exportHtml() {
    wx.showToast({ title: '导出功能开发中', icon: 'none' });
  },

  copyHtml() {
    wx.setClipboardData({ data: this.data.markdownText, success: () => {
      wx.showToast({ title: '已复制', icon: 'success' });
    }});
  },

  refreshPreview() {
    this.renderMarkdown(this.data.markdownText);
    wx.showToast({ title: '已刷新', icon: 'success' });
  },

  loadSample() {
    this.loadDefaultContent();
    wx.showToast({ title: '已加载示例', icon: 'success' });
  },

  sharePreview() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' });
  },

  printPreview() {
    wx.showToast({ title: '打印功能开发中', icon: 'none' });
  },

  settings() {
    wx.showToast({ title: '设置功能开发中', icon: 'none' });
  },

  boldText() { wx.showToast({ title: '编辑器开发中', icon: 'none' }); },
  italicText() { wx.showToast({ title: '编辑器开发中', icon: 'none' }); },
  linkText() { wx.showToast({ title: '编辑器开发中', icon: 'none' }); },
  codeText() { wx.showToast({ title: '编辑器开发中', icon: 'none' }); },

  onShareAppMessage() {
    return {
      title: 'Markdown预览器',
      path: '/packages/text/pages/markdown-preview/markdown-preview'
    }
  }
})