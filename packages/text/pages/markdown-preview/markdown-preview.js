const utils = require('../../../../utils/index');

// 使用 markdown-it 渲染 Markdown
let markdownIt = null;
let markdownItTable = null;
try {
  markdownIt = require('markdown-it');
  markdownItTable = require('markdown-it-table');
} catch (e) {
  console.warn('[markdown-preview] markdown-it 未正确引入，请确保构建时打包 markdown-it');
}

const SYNTAX_ITEMS = [
  { md: '# 标题1', desc: '一级标题' },
  { md: '## 标题2', desc: '二级标题' },
  { md: '### 标题3', desc: '三级标题' },
  { md: '**粗体**', desc: '粗体文本' },
  { md: '*斜体*', desc: '斜体文本' },
  { md: '~~删除~~', desc: '删除文本' },
  { md: '`代码`', desc: '行内代码' },
  { md: '- 列表', desc: '无序列表' },
  { md: '1. 有序', desc: '有序列表' },
  { md: '> 引用', desc: '引用' },
  { md: '---', desc: '分隔线' },
  { md: '[链接](url)', desc: '超链接' },
];

const THEMES = ['默认', 'GitHub', '暗黑', '护眼'];
const THEME_CLASSES = ['', 'github-theme', 'dark-theme', 'eye-care-theme'];

Page({
  data: {
    activeTab: 'edit',
    markdownText: '',
    renderedHtml: '',
    themeIndex: 0,
    themes: THEMES,
    themeClass: '',
    showHelp: false,
    syntaxItems: SYNTAX_ITEMS,
    loading: false,
    error: false,
    errorMsg: '',
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: 'Markdown 预览器' });
    this.loadDefaultContent();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'preview') {
      this.renderMarkdown(this.data.markdownText);
    }
    this.setData({ activeTab: tab });
  },

  switchToPreview() {
    this.renderMarkdown(this.data.markdownText);
    this.setData({ activeTab: 'preview' });
  },

  switchToEdit() {
    this.setData({ activeTab: 'edit' });
  },

  setTheme(e) {
    const idx = Number(e.detail.value);
    this.setData({ themeIndex: idx, themeClass: THEME_CLASSES[idx] });
    this.renderMarkdown(this.data.markdownText);
  },

  toggleHelp() {
    this.setData({ showHelp: !this.data.showHelp });
  },

  setMarkdownText(e) {
    const text = e.detail.value;
    this.setData({ markdownText: text });
    if (this.data.activeTab === 'preview') {
      this.renderMarkdown(text);
    }
  },

  insertBold() { this._appendText('**粗体文本**'); },
  insertItalic() { this._appendText('*斜体文本*'); },
  insertCode() { this._appendText('`代码`'); },
  insertH1() { this._appendText('\n# 一级标题\n'); },
  insertH2() { this._appendText('\n## 二级标题\n'); },
  insertList() { this._appendText('\n- 列表项\n- 列表项\n'); },
  insertQuote() { this._appendText('\n> 引用内容\n'); },

  _appendText(snippet) {
    const current = this.data.markdownText;
    this.setData({ markdownText: current + snippet });
  },

  clearEditor() {
    wx.showModal({
      title: '确认清空',
      content: '清空后无法恢复，确认吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ markdownText: '', renderedHtml: '' });
        }
      }
    });
  },

  renderMarkdown(markdown) {
    if (!markdown || !markdown.trim()) {
      this.setData({ renderedHtml: '', error: false });
      return;
    }
    const html = this.markdownToHtml(markdown);
    this.setData({ renderedHtml: html, error: false });
  },

  markdownToHtml(markdown) {
    if (!markdown) return '';

    if (markdownIt) {
      try {
        const md = markdownIt({
          html: true,
          linkify: true,
          typographer: true,
          breaks: true
        });

        // 只有�?markdownItTable 不为 null 时才使用表格插件
        if (markdownItTable) {
          md.use(markdownItTable, { multiline: true, rowspan: true, headerless: false });
        }

        let html = md.render(markdown);

        html = html.replace(/<table>/g, '<table class="md-table">');
        html = html.replace(/<thead>/g, '<thead class="md-thead">');
        html = html.replace(/<tbody>/g, '<tbody class="md-tbody">');
        html = html.replace(/<tr>/g, '<tr class="md-tr">');
        html = html.replace(/<th>/g, '<th class="md-th">');
        html = html.replace(/<td>/g, '<td class="md-td">');

        return html;
      } catch (e) {
        console.error('[markdown-preview] markdown-it 渲染失败:', e);
        return this._simpleMarkdownParser(markdown);
      }
    }

    return this._simpleMarkdownParser(markdown);
  },

  _simpleMarkdownParser(text) {
    if (!text) return '';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^---$/gm, '<view style="border-top:1px dashed #e0e0e0;margin:24rpx 0;"></view>')
      .replace(/^###### (.+)$/gm, '<view class="md-h6"></view>')
      .replace(/^##### (.+)$/gm, '<view class="md-h5"></view>')
      .replace(/^#### (.+)$/gm, '<view class="md-h4"></view>')
      .replace(/^### (.+)$/gm, '<view class="md-h3"></view>')
      .replace(/^## (.+)$/gm, '<view class="md-h2"></view>')
      .replace(/^# (.+)$/gm, '<view class="md-h1"></view>')
      .replace(/^&gt; (.+)$/gm, '<view class="md-blockquote"></view>')
      .replace(/^[-*] (.+)$/gm, '<view class="md-li"></view>')
      .replace(/^\d+\. (.+)$/gm, '<view class="md-li"></view>')
      .replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map(c => c.trim());
        if (cells.some(c => /^-+$/.test(c))) return '';
        const tds = cells.map(c => '<view class="md-td">' + c + '</view>').join('');
        return '<view class="md-tr">' + tds + '</view>';
      })
      .replace(/`([^`]+)`/g, '<view class="md-code"></view>')
      .replace(/\*\*(.+?)\*\*/g, '<view class="md-bold"></view>')
      .replace(/\*(.+?)\*/g, '<view class="md-em"></view>')
      .replace(/\n{2,}/g, '</view><view class="md-p">')
      .replace(/\n/g, '<view class="md-br"></view>');

    html = '<view class="md-article">' + html + '</view>';
    return html;
  },

  copyMarkdown() {
    const text = this.data.markdownText;
    if (!text) { utils.showText('暂无内容'); return; }
    wx.setClipboardData({ data: text, success: () => utils.showSuccess('Markdown 已复制') });
  },

  copyHtml() {
    const html = this.data.renderedHtml;
    if (!html) { utils.showText('暂无内容可复制'); return; }
    wx.setClipboardData({ data: html, success: () => utils.showSuccess('HTML 已复制') });
  },

  refreshPreview() {
    this.renderMarkdown(this.data.markdownText);
    utils.showSuccess('已刷新预览');
  },

  loadSample() {
    this.loadDefaultContent();
  },

  loadDefaultContent() {
    const md = '# Markdown 预览器\n\n## 功能特点\n\n- **实时预览**：切换到预览 Tab 即可看到渲染效果\n- **多主题**：支持默认、GitHub、暗黑、护眼四种主题\n- **工具按钮**：快速插入常用语法\n\n## 语法示例\n\n这里有**粗体**、*斜体*、~~删除线~~。\n> 引用块：写下你想引用的内容\n`javascript\nconsole.debug(\'Hello, Markdown!\');\n`\n\n---\n\n1. 有序列表第一项\n2. 有序列表第二项\n\n开始编写你的Markdown 文档吧！';
    this.setData({ markdownText: md });
    this.renderMarkdown(md);
  },
});
