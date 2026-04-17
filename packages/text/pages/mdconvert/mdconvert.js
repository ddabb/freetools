// packages/text/pages/mdconvert/mdconvert.js
let md = null;

// 安全初始化 markdown-it
function initMarkdownIt() {
  try {
    const MarkdownIt = require('markdown-it');
    md = new MarkdownIt({
      html: false,        // 禁用 HTML 标签，安全
  xhtmlOut: true,     // 使用 XHTML 自闭合标签
  breaks: true,       // 将换行符转换为 <br>
  linkify: true,      // 自动转换 URL 为链接
      typographer: true,  // 启用智能标点
      quotes: '""\'\'',     // 中文引号
    });
    return true;
  } catch (error) {
    console.error('Markdown-it 初始化失败', error);
    return false;
  }
}

// 简单的降级处理函数
function simpleMarkdownToHtml(text) {
  if (!text) return '';
  
  // 基本Markdown转换
  return text
    .replace(/^#\s+(.*$)/gm, '<h1>$1</h1>')  // 标题1
    .replace(/^##\s+(.*$)/gm, '<h2>$1</h2>') // 标题2
    .replace(/^###\s+(.*$)/gm, '<h3>$1</h3>') // 标题3
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')     // 斜体
    .replace(/`(.*?)`/g, '<code>$1</code>')   // 行内代码
    .replace(/^-\s+(.*$)/gm, '<li>$1</li>')  // 列表项
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>') // 列表
    .replace(/\n/g, '<br>')                   // 换行
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>'); // 链接
}

Page({
  data: {
    mdText: '',
    htmlResult: '',
    isPreviewMode: false,
    history: [],
    showHistory: false,
    // 示例模板
    templates: [
      {
        name: '基础文档',
        icon: '📄',
        content: `# 文档标题

## 章节一
这是正文内容，支持*粗体**、*斜体*、~~删除线~~。

- 列表项1
- 列表项2
- 列表项3

## 章节二
> 这是一段引用文字

[链接文字](https://example.com)`
      },
      {
        name: '任务清单',
        icon: '✅',
        content: `# 待办事项

## 今日任务
- [x] 完成代码审查
- [x] 更新文档
- [ ] 发布新版本

## 本周计划
1. 周一：需求分析
2. 周二：原型设计
3. 周三：开发实现
4. 周四：测试验证
5. 周五：上线部署`
      },
      {
        name: '代码文档',
        icon: '💻',
        content: `# API 文档

## 接口说明
\`\`\`javascript
// 示例代码
const result = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ id: 123 })
});
\`\`\`

## 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 数据ID |
| name | string | 是 | 名称 |`
      }
    ]
  },

  onLoad() {
    this.loadHistory();
  },

  // 输入变化
  mdInputChange(e) {
    this.setData({
      mdText: e.detail.value
    });
  },

  // 转换为 HTML
  convertToHtml() {
    const mdText = this.data.mdText;
    if (!mdText.trim()) {
      wx.showToast({
        title: '请输入Markdown文本',
        icon: 'none'
      });
      return;
    }

    try {
      // 如果markdown-it未初始化，则尝试初始化
      if (!md && !initMarkdownIt()) {
        // 降级处理：使用简单转换
        const html = simpleMarkdownToHtml(mdText);
        this.setData({
          htmlResult: html,
          isPreviewMode: false
        });
        this.saveToHistory(mdText, html);
        wx.showToast({
          title: '使用基础转换（高级功能不可用）',
          icon: 'none'
        });
        return;
      }

      // 使用 markdown-it 转换
      const html = md.render(mdText);
      
      this.setData({
        htmlResult: html,
        isPreviewMode: false
      });

      // 保存到历史记录
      this.saveToHistory(mdText, html);
    } catch (error) {
      console.error('Markdown 转换失败:', error);
      // 降级处理
      const html = simpleMarkdownToHtml(mdText);
      this.setData({
        htmlResult: html,
        isPreviewMode: false
      });
      wx.showToast({
        title: '使用基础转换',
        icon: 'none'
      });
    }
  },

  // 实时预览
  togglePreview() {
    const mdText = this.data.mdText;
    if (!mdText.trim()) {
      wx.showToast({
        title: '请先输入内容',
        icon: 'none'
      });
      return;
    }

    try {
      // 如果markdown-it未初始化，则尝试初始化
      if (!md && !initMarkdownIt()) {
        // 降级处理：使用简单转换
        const html = simpleMarkdownToHtml(mdText);
        this.setData({
          htmlResult: html,
          isPreviewMode: !this.data.isPreviewMode
        });
        return;
      }

      const html = md.render(mdText);
      this.setData({
        htmlResult: html,
        isPreviewMode: !this.data.isPreviewMode
      });
    } catch (error) {
      // 降级处理
      const html = simpleMarkdownToHtml(mdText);
      this.setData({
        htmlResult: html,
        isPreviewMode: !this.data.isPreviewMode
      });
    }
  },

  // 清空内容
  clearContent() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有内容吗？',
           success: (res) => {
        if (res.confirm) {
          this.setData({
            mdText: '',
            htmlResult: '',
            isPreviewMode: false
          });
        }
      }
    });
  },

  // 使用模板
  useTemplate(e) {
    const index = e.currentTarget.dataset.index;
    const template = this.data.templates[index];
    
    wx.showModal({
      title: '使用模板',
      content: `使用「${template.name}」模板将替换当前内容，继续吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            mdText: template.content,
            htmlResult: '',
            isPreviewMode: false
          });
        }
      }
    });
  },

  // 复制 HTML
  copyHtml() {
    if (!this.data.htmlResult) {
      wx.showToast({
        title: '请先转换',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.htmlResult,
      success: () => {
        wx.showToast({
          title: 'HTML 已复制',
          icon: 'success'
        });
      }
    });
  },

  // 复制 Markdown
  copyMarkdown() {
    if (!this.data.mdText) {
      wx.showToast({
        title: '没有内容可复制',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.mdText,
      success: () => {
        wx.showToast({
          title: 'Markdown 已复制',
          icon: 'success'
        });
      }
    });
  },

  // 保存到历史记录
  saveToHistory(mdText, htmlResult) {
    if (!mdText.trim()) return;

    const history = wx.getStorageSync('mdconvert_history') || [];
    const newItem = {
      id: Date.now(),
      mdText: mdText.length > 200 ? mdText.substring(0, 200) + '...' : mdText,
      fullMdText: mdText,
      htmlResult: htmlResult.length > 500 ? htmlResult.substring(0, 500) + '...' : htmlResult,
      timestamp: new Date().toLocaleString()
    };

    // 去重：如果内容相同则不添加
    const exists = history.some(item => item.fullMdText === mdText);
    if (exists) return;

    history.unshift(newItem);
    // 最多保存 20 条
    if (history.length > 20) {
      history.pop();
    }

    wx.setStorageSync('mdconvert_history', history);
    this.setData({ history });
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('mdconvert_history') || [];
    this.setData({ history });
  },

  // 切换历史记录显示
  toggleHistory() {
    this.setData({
      showHistory: !this.data.showHistory
    });
  },

  // 从历史记录加载
  loadFromHistory(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.history[index];
    
    this.setData({
      mdText: item.fullMdText,
      htmlResult: item.htmlResult,
      showHistory: false,
      isPreviewMode: false
    });

    wx.showToast({
      title: '已加载',
      icon: 'success'
    });
  },

  // 删除历史记录
  deleteHistory(e) {
    const index = e.currentTarget.dataset.index;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const history = this.data.history;
          history.splice(index, 1);
          wx.setStorageSync('mdconvert_history', history);
          this.setData({ history });
        }
      }
    });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('mdconvert_history');
          this.setData({ history: [] });
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 分享给好友
  // 分享到朋友圈
});
