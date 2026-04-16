// packages/knowledge/pages/knowledgedetail/knowledgedetail.js

const utils = require('../../utils/index');
const knowledgeCategory = require('../../utils/knowledgeCategory');
const cacheManager = require('../../utils/cacheManager');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/PortableKnowledge@main/know/';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天
const CACHE_KEY_DETAIL = 'cdn_know_detail_';
const CACHE_KEY_DETAIL_TS = 'cdn_know_detail_ts_';
const CACHE_KEY_ARTICLES = 'cdn_know_articles';
const CACHE_KEY_ARTICLES_TS = 'cdn_know_articles_ts';

// 内存缓存（进程级）
let articlesCache = null;


// 使用 markdown-it 渲染 Markdown（项目已安装该库）
let markdownIt = null;
let markdownItTable = null;
try {
  markdownIt = require('markdown-it');
  markdownItTable = require('markdown-it-table');
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
    console.debug('页面加载参数:', {
      options: options,
      timestamp: new Date().toISOString()
    });
    
    if (options.filename) {
      console.debug('开始加载文章:', {
        filename: options.filename
      });
      this.setData({ 
        filename: options.filename,
        loading: true  // 立即显示loading
      });
      // 异步加载，不阻塞 onLoad 返回
      setTimeout(() => {
        this.loadDetail(options.filename);
      }, 0);
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
    // 只清知识库相关缓存（定点清除，不影响其他模块）
    cacheManager.clearCdnCache('know_');
    cacheManager.clearCdnCache('cdn_know_');
    articlesCache = null;
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
        const md = markdownIt({
          html: true,         // 启用 HTML 标签解析
          linkify: true,      // 自动将 URL 转换为链接
          typographer: true,  // 启用排版优化
          breaks: true        // 将换行符转换为 <br>
        });
        
        // 只有当 markdownItTable 不为 null 时才使用表格插件
        if (markdownItTable) {
          md.use(markdownItTable, {
            multiline: true,    // 支持多行表格
            rowspan: true,      // 支持行合并
            headerless: false   // 确保生成表头
          });
        }

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
        console.debug('markdown-it 生成的 HTML:', {
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
      categoryClass: categoryMeta.className,
      // CDN 主题梯度，loadTheme 完成后自动生效；未完成时使用默认梯度兜底
      categoryGradient: knowledgeCategory.getCategoryGradient(categoryMeta.className)
    };
  },


  /**
   * 加载文章详情（带 Storage 缓存，7 天有效）
   */
  loadDetail(filename) {
    this.setData({ loading: true, error: false });

    const cacheKey = CACHE_KEY_DETAIL + filename;
    const tsKey = CACHE_KEY_DETAIL_TS + filename;
    const url = CDN_BASE + 'detail/' + filename;

    cacheManager.fetchWithCache({
      cacheKey,
      tsKey,
      url,
      ttl: CACHE_EXPIRE
    }).then(data => {
      if (data) {
        this._renderArticle(data);
      } else {
        this.setError('文章不存在或已被删除');
      }
    }).catch(err => {
      console.error('[knowledgedetail] 加载失败:', err);
      this.setError('网络错误，请检查网络连接');
    });
  },

  /**
   * 渲染文章（详情 + 相关推荐）
   */
  _renderArticle(data) {
    const article = this.decorateArticle(data);

    wx.setNavigationBarTitle({
      title: article.title || '文章详情'
    });

    // Markdown 内容渲染为 HTML
    const contentHtml = this.markdownToHtml(article.content || '');

    this.setData({
      article,
      contentHtml,
      loading: false
    });

    // 加载相关推荐
    this.loadRelatedArticles(article);
  },


  /**
   * 加载相关推荐（带 Storage 缓存，7 天有效）
   */
  loadRelatedArticles(article) {
    if (!article || !article.filename) {
      this.setData({ relatedArticles: [] });
      return;
    }

    // 统一通过 cacheManager.fetchWithCache 处理内存+Storage+CDN 三级链路，支持 304 + LRU
    cacheManager.fetchWithCache({
      cacheKey: CACHE_KEY_ARTICLES,
      tsKey: CACHE_KEY_ARTICLES_TS,
      url: CDN_BASE + 'articles.json',
      ttl: CACHE_EXPIRE,
      memRef: articlesCache
    }).then(allArticles => {
      if (Array.isArray(allArticles)) {
        articlesCache = allArticles;
        this._filterRelated(allArticles, article);
      } else {
        this.setData({ relatedArticles: [] });
      }
    }).catch(err => {
      console.error('[knowledgedetail] 加载推荐失败:', err);
      this.setData({ relatedArticles: [] });
    });
  },

  /**
   * 从文章列表中筛选相关推荐
   */
  _filterRelated(allArticles, article) {
    const related = allArticles
      .filter(a => a.filename && a.filename !== article.filename)
      .filter(a =>
        a.category === article.category ||
        (a.tags && article.tags && a.tags.some(t => article.tags.includes(t)))
      )
      .map(a => this.decorateArticle(a))
      .slice(0, 5);

    this.setData({ relatedArticles: related });
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
    wx.navigateTo({
      url: `/pages/tagdetail/tagdetail?tag=${tag}`
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
    wx.navigateTo({
      url: `/pages/categorydetail/categorydetail?category=${article.category}`
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
    console.debug('切换调试模式:', {
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
        
        console.debug('复制调试HTML成功:', {
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
