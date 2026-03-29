// packages/knowledge/pages/knowledgedetail/knowledgedetail.js

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/know/';

Page({
  data: {
    id: '',
    article: null,
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
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail(options.id);
      this.checkLikeStatus(options.id);
      this.checkCollectStatus(options.id);
    } else {
      this.setError('文章ID不存在');
    }
  },

  /**
   * 加载文章详情
   */
  loadDetail(id) {
    this.setData({ loading: true, error: false });

    const url = CDN_BASE + `detail/${id}.json`;

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const article = res.data;
          
          // 设置导航栏标题
          wx.setNavigationBarTitle({
            title: article.title || '文章详情'
          });

          this.setData({
            article,
            loading: false,
            likeCount: article.likeCount || 0,
            collectCount: article.collectCount || 0
          });

          // 加载相关推荐
          this.loadRelatedArticles(article);
        } else {
          this.setError('文章不存在或已被删除');
        }
      },
      fail: (err) => {
        console.error('加载文章详情失败:', err);
        this.setError('网络错误，请检查网络连接');
      }
    });
  },

  /**
   * 加载相关推荐
   */
  loadRelatedArticles(article) {
    const url = CDN_BASE + 'articles.json';

    wx.request({
      url,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const allArticles = res.data.articles || [];
          
          // 找出同类目或同标签的文章
          const related = allArticles
            .filter(a => a.id !== article.id)
            .filter(a => 
              a.category === article.category ||
              (a.tags && article.tags && a.tags.some(t => article.tags.includes(t)))
            )
            .slice(0, 5); // 只显示5篇

          this.setData({ relatedArticles: related });
        }
      },
      fail: (err) => {
        console.error('加载相关推荐失败:', err);
      }
    });
  },

  /**
   * 检查点赞状态
   */
  checkLikeStatus(id) {
    try {
      const likeList = wx.getStorageSync('likeList') || [];
      const isLiked = likeList.includes(id);
      this.setData({ isLiked });
    } catch (e) {
      console.error('检查点赞状态失败:', e);
    }
  },

  /**
   * 检查收藏状态
   */
  checkCollectStatus(id) {
    try {
      const collectList = wx.getStorageSync('collectList') || [];
      const isCollected = collectList.includes(id);
      this.setData({ isCollected });
    } catch (e) {
      console.error('检查收藏状态失败:', e);
    }
  },

  /**
   * 点赞
   */
  onLike() {
    const { id, isLiked, likeCount } = this.data;
    
    try {
      let likeList = wx.getStorageSync('likeList') || [];
      
      if (isLiked) {
        // 取消点赞
        likeList = likeList.filter(item => item !== id);
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
        likeList.push(id);
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
    const { id, isCollected } = this.data;
    
    try {
      let collectList = wx.getStorageSync('collectList') || [];
      
      if (isCollected) {
        // 取消收藏
        collectList = collectList.filter(item => item !== id);
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
        collectList.push(id);
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
      .replace(/<[^>]+>/g, '\n')  // 移除 HTML 标签
      .replace(/&nbsp;/g, ' ')     // 替换空格
      .replace(/&lt;/g, '<')        // 替换 HTML 实体
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n\s*\n/g, '\n')   // 移除多余空行
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
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?id=${id}`
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
    const { id } = this.data;
    if (id) {
      this.loadDetail(id);
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
      '项目管理': '📋',
      '冷知识': '❄️',
      '技术': '💻',
      '生活': '🏠',
      '未分类': '📚'
    };
    return iconMap[category] || '📚';
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { article } = this.data;
    if (!article) return {};

    return {
      title: article.title,
      path: `/packages/knowledge/pages/knowledgedetail/knowledgedetail?id=${article.id}`,
      description: article.description
    };
  },

  onShareTimeline() {
    const { article } = this.data;
    if (!article) return {};

    return {
      title: article.title,
      query: `id=${article.id}`,
      imageUrl: ''
    };
  }
});
