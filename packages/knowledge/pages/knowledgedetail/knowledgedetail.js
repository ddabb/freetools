// packages/knowledge/pages/knowledgedetail/knowledgedetail.js

const utils = require('../../../../utils/index');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    filename: '',
    article: null,
    formattedUpdateTime: '',
    loading: true,
    error: false,
    errorMsg: '',

    // 互动数据
    isLiked: false,
    likeCount: 0,
    isCollected: false,
    collectCount: 0,

    // 相关推荐
    relatedArticles: []
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
      this.checkLikeStatus(options.filename);
      this.checkCollectStatus(options.filename);
    } else {
      console.warn('缺少文章filename参数:', {
        options: options
      });
      this.setError('文章不存在');
    }
  },

  /**
   * 加载文章详情
   */
  loadDetail(filename) {
    this.setData({ loading: true, error: false });

    const url = CDN_BASE + 'detail/' + encodeURIComponent(filename);
    console.log('开始加载文章详情:', {
      filename,
      url,
      timestamp: new Date().toISOString()
    });

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log('文章详情请求成功:', {
          statusCode: res.statusCode,
          data: res.data,
          header: res.header,
          timestamp: new Date().toISOString()
        });
        
        if (res.statusCode === 200 && res.data) {
          const article = res.data;
          console.log('获取到文章数据:', {
            id: article.id,
            title: article.title,
            category: article.category,
            wordCount: article.wordCount
          });
          
          // 设置导航栏标题
          wx.setNavigationBarTitle({
            title: article.title || '文章详情'
          });

          this.setData({
            article,
            formattedUpdateTime: utils.formatDate(article.updateTime),
            loading: false,
            likeCount: article.likeCount || 0,
            collectCount: article.collectCount || 0
          });

          // 加载相关推荐
          this.loadRelatedArticles(article);
        } else {
          console.warn('文章详情请求返回异常:', {
            statusCode: res.statusCode,
            data: res.data,
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
    console.log('开始加载相关推荐:', {
      articleId: article.id,
      articleTitle: article.title,
      url,
      timestamp: new Date().toISOString()
    });

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log('相关推荐请求成功:', {
          statusCode: res.statusCode,
          dataLength: res.data ? (res.data.articles ? res.data.articles.length : 0) : 0,
          timestamp: new Date().toISOString()
        });
        
        if (res.statusCode === 200 && res.data) {
          const allArticles = res.data.articles || [];
          console.log('获取到文章列表:', {
            totalArticles: allArticles.length
          });
          
          // 找出同类目或同标签的文章
          const related = allArticles
            .filter(a => a.id !== article.id)
            .filter(a => 
              a.category === article.category ||
              (a.tags && article.tags && a.tags.some(t => article.tags.includes(t)))
            )
            .slice(0, 5); // 只显示5篇

          console.log('找到相关推荐:', {
            relatedCount: related.length,
            relatedTitles: related.map(a => a.title)
          });

          this.setData({ relatedArticles: related });
        } else {
          console.warn('相关推荐请求返回异常:', {
            statusCode: res.statusCode,
            data: res.data
          });
        }
      },
      fail: (err) => {
        console.error('加载相关推荐失败:', {
          error: err,
          url: url,
          articleId: article.id,
          timestamp: new Date().toISOString()
        });
      },
      complete: (res) => {
        console.log('相关推荐请求完成:', {
          status: res.statusCode,
          timestamp: new Date().toISOString()
        });
      }
    });
  },

  /**
   * 检查点赞状态
   */
  checkLikeStatus(filename) {
    try {
      const likeList = wx.getStorageSync('likeList') || [];
      const isLiked = likeList.includes(filename);
      this.setData({ isLiked });
    } catch (e) {
      console.error('检查点赞状态失败:', e);
    }
  },

  /**
   * 检查收藏状态
   */
  checkCollectStatus(filename) {
    try {
      const collectList = wx.getStorageSync('collectList') || [];
      const isCollected = collectList.includes(filename);
      this.setData({ isCollected });
    } catch (e) {
      console.error('检查收藏状态失败:', e);
    }
  },

  /**
   * 点赞
   */
  onLike() {
    const { filename, isLiked, likeCount } = this.data;
    
    try {
      let likeList = wx.getStorageSync('likeList') || [];
      
      if (isLiked) {
        // 取消点赞
        likeList = likeList.filter(item => item !== filename);
        this.setData({
          isLiked: false,
          likeCount: Math.max(0, likeCount - 1)
        });
        wx.showToast({
          title: '取消点赞',
          icon: 'success',
          duration: 1500
        });
      } else {
        // 添加点赞
        likeList.push(filename);
        this.setData({
          isLiked: true,
          likeCount: likeCount + 1
        });
        wx.showToast({
          title: '点赞成功 ❤️',
          icon: 'success',
          duration: 1500
        });
      }
      
      wx.setStorageSync('likeList', likeList);
    } catch (e) {
      console.error('点赞操作失败:', e);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 收藏
   */
  onCollect() {
    const { filename, isCollected } = this.data;
    
    try {
      let collectList = wx.getStorageSync('collectList') || [];
      
      if (isCollected) {
        // 取消收藏
        collectList = collectList.filter(item => item !== filename);
        this.setData({
          isCollected: false,
          collectCount: Math.max(0, this.data.collectCount - 1)
        });
        wx.showToast({
          title: '已取消收藏',
          icon: 'success',
          duration: 1500
        });
      } else {
        // 添加收藏
        collectList.push(filename);
        this.setData({
          isCollected: true,
          collectCount: this.data.collectCount + 1
        });
        wx.showToast({
          title: '收藏成功 ⭐',
          icon: 'success',
          duration: 1500
        });
      }
      
      wx.setStorageSync('collectList', collectList);
    } catch (e) {
      console.error('收藏操作失败:', e);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  /**
   * 复制内容
   */
  onCopyContent() {
    const { article } = this.data;
    if (!article) return;

    // 提取纯文本内容
    const content = article.content
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n\s*\n/g, '\n')
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
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?tag=${encodeURIComponent(tag)}`
    });
  },

  /**
   * 分类点击
   */
  onCategoryTap() {
    const { article } = this.data;
    if (!article || !article.category) return;
    
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgelist/knowledgelist?category=${encodeURIComponent(article.category)}`
    });
  },

  /**
   * 相关推荐点击
   */
  onRelatedTap(e) {
    const { filename } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?filename=${filename}`
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
    const iconMap = {
      '产品使用': '📖',
      '产品设计': '💡',
      '产品思考': '🧠',
      '开发实践': '🔧',
      '开发者故事': '💻',
      '项目管理': '📋',
      'PMP认证': '🎓',
      '敏捷管理': '🏃',
      '未分类': '📚'
    };
    return iconMap[category] || '📚';
  },

  /**
   * 获取分类英文类名
   */
  getCategoryClass(category) {
    const classMap = {
      '产品使用': 'category-product-usage',
      '产品设计': 'category-product-design',
      '产品思考': 'category-product-thinking',
      '开发实践': 'category-dev-practice',
      '开发者故事': 'category-dev-story',
      '项目管理': 'category-project-mgmt',
      'PMP认证': 'category-pmp',
      '敏捷管理': 'category-agile',
      '未分类': 'category-uncategorized'
    };
    return classMap[category] || 'category-uncategorized';
  },

  /**
   * 分享给好友
   */
  onShareAppMessage() {
    const { article, filename } = this.data;
    if (!article) return {};

    return {
      title: `${article.title} - 随身百科`,
      path: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?filename=${encodeURIComponent(filename)}`,
      imageUrl: article.description ? `https://cdn.jsdelivr.net/gh/ddabb/freetools@main/images/baike-share.png` : ''
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { article, filename } = this.data;
    if (!article) return {};

    return {
      title: `📖 ${article.title}`,
      query: `filename=${encodeURIComponent(filename)}`
    };
  }
});
