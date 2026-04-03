// packages/knowledge/pages/knowledgedetail/knowledgedetail.js

const utils = require('../../utils/index');
const knowledgeCategory = require('../../utils/knowledgeCategory');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';


// 使用 markdown-it 渲染 Markdown（项目已安装该库）
let markdownIt = null;
try {
  markdownIt = require('markdown-it');
} catch (e) {
  console.warn('[knowledgedetail] markdown-it 未正确引入，请确保构建时打包了 markdown-it');
}

Page({
  data: {
    filename: '',
    article: null,
    loading: true,
    error: false,
    errorMsg: '',
    // Markdown 渲染后的 HTML（供 rich-text 使用）
    contentHtml: '',
    // 相关推荐
    relatedArticles: [],
    // 调试模式
    debugMode: false
  },

  onLoad(options) {
    console.log('页面加载参数:', {
      options: options,
      timestamp: new Date().toISOString()
    });
    
    if (options.filename) {
      console.log('开始加载文章:', {
        filename: options.filename
      });
      this.setData({ filename: options.filename });
      this.loadDetail(options.filename);
    } else {
      console.warn('缺少文章filename参数:', {
        options: options
      });
      this.setError('文章不存在');
    }
  },

  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    wx.clearStorageSync();
    const { filename } = this.data;
    if (filename) {
      this.loadDetail(filename);
    }
    wx.stopPullDownRefresh();
  },

  /**
   * 将 Markdown 转换为简化 HTML（供 rich-text 使用）
   * 处理 towxml 不方便引入时的回退方案
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 使用 markdown-it（如果可用）
    if (markdownIt) {
      try {
        const md = markdownIt();
        return md.render(markdown);
      } catch (e) {
        console.error('[knowledgedetail] markdown-it 渲染失败:', e);
        try {
          const md = markdownIt({
            html: true,         // 启用 HTML 标签解析
            linkify: true,      // 自动将 URL 转换为链接
            typographer: true,  // 启用排版优化
            breaks: true        // 将换行符转换为 <br>
          }).use(require('markdown-it-table'), {
            multiline: true,    // 支持多行表格
            rowspan: true,      // 支持行合并
            headerless: false   // 确保生成表头
          });

          // 对生成的 HTML 进行美化
          let html = md.render(markdown);
          
          // 为表格添加 CSS 类
          html = html.replace(/<table>/g, '<table class="md-table">');
          html = html.replace(/<thead>/g, '<thead class="md-thead">');
          html = html.replace(/<tbody>/g, '<tbody class="md-tbody">');
          html = html.replace(/<tr>/g, '<tr class="md-tr">');
          html = html.replace(/<th>/g, '<th class="md-th">');
          html = html.replace(/<td>/g, '<td class="md-td">');
          
          // 记录生成的 HTML 内容
          console.log('markdown-it 生成的 HTML:', {
            html: html,
            hasTable: html.includes('<table'),
            tableCount: (html.match(/<table/g) || []).length,
            timestamp: new Date().toISOString()
          });
          
          return html;
        } catch (e) {
          console.error('[knowledgedetail] markdown-it 渲染失败:', e);
          return this._simpleMarkdownParser(markdown); // 失败时回退到简单解析器
        }
      }
    }
    
    // 无 markdown-it 时的手写解析器（基础功能）
    return this._simpleMarkdownParser(markdown);
  },

  /**
   * 简化的 Markdown 解析器（不依赖任何库）
   */
  _simpleMarkdownParser(text) {
    if (!text) return '';
    
    let html = text
      // 转义 HTML 特殊字符（放在最前面）
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 分隔线
      .replace(/^---$/gm, '<view style="border-top:1px dashed #e0e0e0;margin:24rpx 0;"></view>')
      // H1 ~ H6（代码块内的不处理，已被提前保护）
      .replace(/^###### (.+)$/gm, '<view class="md-h6">$1</view>')
      .replace(/^##### (.+)$/gm, '<view class="md-h5">$1</view>')
      .replace(/^#### (.+)$/gm, '<view class="md-h4">$1</view>')
      .replace(/^### (.+)$/gm, '<view class="md-h3">$1</view>')
      .replace(/^## (.+)$/gm, '<view class="md-h2">$1</view>')
      .replace(/^# (.+)$/gm, '<view class="md-h1">$1</view>')
      // 引用块（多行）
      .replace(/^&gt; (.+)$/gm, '<view class="md-blockquote">$1</view>')
      // 无序列表项
      .replace(/^[-*] (.+)$/gm, '<view class="md-li">• $1</view>')
      // 有序列表项
      .replace(/^\d+\. (.+)$/gm, '<view class="md-li">$1</view>')
      // 表格行（简化处理：把 | 转为分隔）
      .replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map(c => c.trim());
        if (cells.some(c => /^-+$/.test(c))) {
          return ''; // 分隔行跳过
        }
        const tds = cells.map(c => `<view class="md-td">${c}</view>`).join('');
        return `<view class="md-tr">${tds}</view>`;
      })
      // 行内代码
      .replace(/`([^`]+)`/g, '<view class="md-code">$1</view>')
      // 加粗
      .replace(/\*\*(.+?)\*\*/g, '<view class="md-bold">$1</view>')
      // 斜体
      .replace(/\*(.+?)\*/g, '<view class="md-em">$1</view>')
      // 换行（保留段落结构）
      .replace(/\n{2,}/g, '</view><view class="md-p">')
      .replace(/\n/g, '<view class="md-br"></view>');

    // 包裹段落
    html = `<view class="md-article">${html}</view>`;
    return html;
  },

  getLeafCategoryName(category) {
    return knowledgeCategory.getLeafCategoryName(category);
  },

  decorateArticle(article) {
    if (!article) return article;

    const displayCategory = this.getLeafCategoryName(article.category);
    const categoryMeta = knowledgeCategory.getCategoryMeta(displayCategory);

    return {
      ...article,
      displayCategory,
      categoryIcon: categoryMeta.icon,
      categoryClass: categoryMeta.className
    };
  },


  /**
   * 加载文章详情
   */
  loadDetail(filename) {
    this.setData({ loading: true, error: false });

    const url = CDN_BASE + 'detail/' + filename;
    console.log('开始加载文章详情:', {
      filename,
      url,
      timestamp: new Date().toISOString()
    });

    wx.request({
      url: url + `?_t=${Date.now()}`,
      method: 'GET',
      timeout: 30000,
      success: (res) => {
        console.log('文章详情请求成功:', {
          statusCode: res.statusCode,
          header: res.header,
          timestamp: new Date().toISOString()
        });
        
        if (res.statusCode === 200 && res.data) {
          const article = this.decorateArticle(res.data);
          console.log('获取到文章数据:', {
            id: article.id,
            title: article.title,
            category: article.category,
            wordCount: article.wordCount
          });
          
          wx.setNavigationBarTitle({
            title: article.title || '文章详情'
          });

          // Markdown 内容渲染为 HTML
          const contentHtml = this.markdownToHtml(article.content || '');
          
          // 记录最终的 contentHtml 内容
          console.log('设置到页面的 contentHtml:', {
            contentHtml: contentHtml,
            length: contentHtml.length,
            hasTable: contentHtml.includes('<table'),
            tableCount: (contentHtml.match(/<table/g) || []).length,
            timestamp: new Date().toISOString()
          });

          this.setData({
            article,
            contentHtml,
            loading: false
          });

          // 加载相关推荐
          this.loadRelatedArticles(article);
        } else {
          console.warn('文章详情请求返回异常:', {
            statusCode: res.statusCode,
            message: '文章不存在或已被删除'
          });
          this.setError('文章不存在或已被删除');
        }
      },
      fail: (err) => {
        console.error('加载文章详情失败:', {
          error: err,
          url: url,
          filename: filename,
          timestamp: new Date().toISOString()
        });
        this.setError('网络错误，请检查网络连接');
      },
      complete: (res) => {
        console.log('文章详情请求完成:', {
          status: res.statusCode,
          timestamp: new Date().toISOString()
        });
      }
    });
  },


  /**
   * 加载相关推荐
   */
  loadRelatedArticles(article) {
    const url = CDN_BASE + 'articles.json';

    if (!article || !article.filename) {
      this.setData({ relatedArticles: [] });
      return;
    }

    wx.request({
      url: url + `?_t=${Date.now()}`,
      method: 'GET',
      timeout: 30000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const allArticles = res.data.articles || [];
          
          const related = allArticles
            .filter(a => a.filename && a.filename !== article.filename)
            .filter(a => 
              a.category === article.category ||
              (a.tags && article.tags && a.tags.some(t => article.tags.includes(t)))
            )
            .map(a => this.decorateArticle(a))
            .slice(0, 5);

          this.setData({ relatedArticles: related });

        } else {
          this.setData({ relatedArticles: [] });
        }
      },
      fail: (err) => {
        console.error('加载相关推荐失败:', err);
        this.setData({ relatedArticles: [] });
      }
    });
  },



  /**
   * 复制内容
   */
  onCopyContent() {
    const { article } = this.data;
    if (!article) return;

    const content = article.content
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/[#*`_]/g, ''))
      .replace(/[#*`_\[\]]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    wx.setClipboardData({
      data: `${article.title}\n\n${article.description}\n\n${content}`,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 标签点击
   */
  onTagTap(e) {
    const { tag } = e.currentTarget.dataset;
    wx.switchTab({
      url: '/pages/knowledgelist/knowledgelist',
      success: () => {
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.pendingTag = tag;
        app.globalData.pendingCategory = '';
      }
    });
  },

  /**
   * 跳转标签列表
   */
  onTagListTap() {
    wx.navigateTo({
      url: '/pages/taglist/taglist'
    });
  },

  /**
   * 跳转分类列表
   */
  onCategoryListTap() {
    wx.navigateTo({
      url: '/pages/categorylist/categorylist'
    });
  },

  /**
   * 分类点击
   */
  onCategoryTap() {
    const { article } = this.data;
    if (!article || !article.category) return;
    wx.switchTab({
      url: '/pages/knowledgelist/knowledgelist',
      success: () => {
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.pendingCategory = article.category;
        app.globalData.pendingTag = '';
      }
    });
  },

  /**
   * 相关推荐点击
   */
  onRelatedTap(e) {
    const { filename } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledgedetail/knowledgedetail?filename=${filename}`
    });
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack();
  },

  /**
   * 重试加载
   */
  onRetry() {
    const { filename } = this.data;
    if (filename) {
      this.loadDetail(filename);
    }
  },

  /**
   * 切换调试模式
   */
  onToggleDebug() {
    const { debugMode } = this.data;
    console.log('切换调试模式:', {
      currentMode: debugMode,
      newMode: !debugMode,
      timestamp: new Date().toISOString()
    });
    
    this.setData({
      debugMode: !debugMode
    });
  },

  /**
   * 复制调试HTML内容
   */
  onCopyDebugHtml() {
    const { contentHtml } = this.data;
    
    if (!contentHtml) {
      wx.showToast({
        title: '暂无内容可复制',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: contentHtml,
      success: () => {
        wx.showToast({
          title: 'HTML已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
        
        console.log('复制调试HTML成功:', {
          length: contentHtml.length,
          timestamp: new Date().toISOString()
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 设置错误状态
   */
  setError(message) {
    this.setData({
      error: true,
      errorMsg: message,
      loading: false
    });
  },

  /**
   * 获取分类图标
   */
  getCategoryIcon(category) {
    return knowledgeCategory.getCategoryIcon(category);
  },

  /**
   * 获取分类英文类名
   */
  getCategoryClass(category) {
    return knowledgeCategory.getCategoryClass(category);
  },


  /**
   * 分享给好友
   */
  onShareAppMessage() {
    const { article, filename } = this.data;
    if (!article) return {};

    return {
      title: `${article.title} - 随身百科`,
      path: `/pages/knowledgedetail/knowledgedetail?filename=${filename}`
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { article, filename } = this.data;
    if (!article) return {};

    return {
      title: `${article.title}`,
      query: `filename=${filename}`
    };
  }
});
