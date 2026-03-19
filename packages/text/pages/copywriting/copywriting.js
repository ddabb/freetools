// packages/copywriting/pages/copywriting/copywriting.js
// 导入 wordbank 包的数据
const wordbank = require('wordbank');

// 使用 wordbank 包中的数据
const allCategories = wordbank.allCategories;

Page({
  data: {
    categories: [],
    selectedCategory: '',
    searchKeyword: '',
    filteredCopywritings: [],
    scrollTop: 0
  },

  onLoad() {
    this.initData();
  },

  initData() {
    // 初始化分类数据
    const categories = allCategories;
    console.log('初始化分类数据:', categories.length, '个分类');
    
    if (categories.length > 0) {
      console.log('第一个分类的数据:', categories[0]);
      
      this.setData({
        categories: categories
        // 移除默认选中的分类
      });
    } else {
      console.error('没有找到分类数据');
    }
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.categoryId;
    console.log('点击分类:', categoryId);
    this.setData({
      selectedCategory: categoryId,
      searchKeyword: '',
      scrollTop: 0  // 重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 滚动事件
  onScroll(e) {
    // 记录当前滚动位置
    this.setData({
      scrollTop: e.detail.scrollTop
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      scrollTop: 0  // 搜索时重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      scrollTop: 0  // 清空搜索时重置滚动条到顶部
    });
    this.filterCopywritings();
  },

  // 过滤文案
  filterCopywritings() {
    const { selectedCategory, searchKeyword, categories } = this.data;
    console.log('过滤文案 - 分类:', selectedCategory, '关键词:', searchKeyword);
    
    let filtered = [];
    
    // 如果有搜索关键词，搜索所有分类
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      categories.forEach(category => {
        const categoryContent = category.content || [];
        const matchedItems = categoryContent.filter(item => 
          item.text.toLowerCase().includes(keyword)
        );
        filtered = filtered.concat(matchedItems);
      });
      console.log('跨分类搜索，找到结果数量:', filtered.length);
    } else if (selectedCategory) {
      // 没有搜索关键词，但有选中的分类，显示该分类的文案
      const currentCategory = categories.find(cat => cat.id === selectedCategory);
      console.log('显示分类:', currentCategory ? currentCategory.name : '未找到');
      if (currentCategory) {
        filtered = currentCategory.content || [];
        console.log('分类内容数量:', filtered.length);
      }
    } else {
      // 既没有搜索关键词也没有选中的分类，显示空
      console.log('没有搜索关键词也没有选中的分类');
      filtered = [];
    }
    
    this.setData({
      filteredCopywritings: filtered
    });
    console.log('设置filteredCopywritings长度:', filtered.length);
  },

  // 复制文案
  copyCopywriting(e) {
    const index = e.currentTarget.dataset.index;
    const copywriting = this.data.filteredCopywritings[index];
    
    if (copywriting) {
      wx.setClipboardData({
        data: copywriting.text,
        success: (res) => {
          wx.showToast({
            title: '复制成功',
            icon: 'success',
            duration: 1500
          });
        },
        fail: (err) => {
          wx.showToast({
            title: '复制失败',
            icon: 'none',
            duration: 1500
          });
        }
      });
    }
  }
});