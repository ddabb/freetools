// packages/math/pages/random-selector/random-selector.js
const XLSX = require('../../../../libs/xlsx.full.min.js');

Page({
  data: {
    // 选号模式：'double'（六棕一绿）或 'lottery'（五棕两绿）
    mode: 'double',
    // 棕球号码
    brownBalls: [],
    // 绿球号码
    greenBalls: [],
    // 生成的注数
    generatedNotes: [],
    // 选中的注数
    // 模拟结果
    drawResult: {
      brownBalls: [],
      greenBalls: []
    },
    // 是否显示模拟结果
    showDrawResult: false,
    // 匹配结果（每注匹配结果数组）
    matchResults: [],
    // 是否显示匹配结果
    showMatchResult: false,
    // 单期模拟结果
    singleResult: {
      totalCost: 0,
      totalRevenue: 0,
      netProfit: 0
    },
    // 一键生成相关

    generateOptions: [1, 5, 10, 50, 100, 200],
    selectedGenerateCount: 1,
    // 定投相关
    investmentSettings: {
      periods: 100,
    },
    investmentResult: {
      totalPeriods: 0,
      hitPeriods: 0,
      hitDetails: [],
      hitRate: 0,
      totalCost: 0,
      totalRevenue: 0,
      netProfit: 0
    },
    showInvestmentResult: false,
    isInvesting: false,
    // 期数选择器相关
    periodOptions: [1, 5, 10, 20, 50, 100],
    selectedPeriod: 5,
    // 定投区域显示控制
    showInvestmentSection: false,
    // 卡片展开状态（默认全部展开）
    expandedCards: {
      generate: true,
      notes: true,
      batch: true,
      result: true,
      match: true,
      investment: true
    },
    // 奖池信息

  },

  // 切换选号模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (this.data.mode === mode) return;
    
    this.setData({
      mode,
      brownBalls: [],
      greenBalls: [],
      generatedNotes: [],
        showDrawResult: false,
      showMatchResult: false,
      showInvestmentResult: false
    });
  },

  // 卡片展开/收起功能
  toggleCard(e) {
    const cardType = e.currentTarget.dataset.card;
    const currentExpanded = this.data.expandedCards[cardType];
    
    // 更新卡片展开状态
    const newExpandedCards = {
      ...this.data.expandedCards,
      [cardType]: !currentExpanded
    };
    
    this.setData({
      expandedCards: newExpandedCards
    });
    
    console.debug('[toggleCard] 卡片状态切换:', { cardType, expanded: !currentExpanded });
  },

  // 生成随机号码
  generateNumbers() {
    const { mode, selectedGenerateCount } = this.data;
    const generatedNotes = [];
    
    // 生成指定数量的号码组合
    for (let i = 0; i < selectedGenerateCount; i++) {
      let brownBalls = [];
      let greenBalls = [];
      
      // 生成棕球
      const brownRange = mode === 'double' ? 33 : 35;
      const brownCount = mode === 'double' ? 6 : 5;
      
      while (brownBalls.length < brownCount) {
        const num = Math.floor(Math.random() * brownRange) + 1;
        if (!brownBalls.includes(num)) {
          brownBalls.push(num);
        }
      }
      
      // 生成绿球
      const greenRange = mode === 'double' ? 16 : 12;
      const greenCount = mode === 'double' ? 1 : 2;
      
      while (greenBalls.length < greenCount) {
        const num = Math.floor(Math.random() * greenRange) + 1;
        if (!greenBalls.includes(num)) {
          greenBalls.push(num);
        }
      }
      
      // 排序
      brownBalls.sort((a, b) => a - b);
      greenBalls.sort((a, b) => a - b);
      
      // 添加到生成注数
      generatedNotes.push({
        id: Date.now() + i,
        brownBalls: [...brownBalls],
        greenBalls: [...greenBalls],
        selected: true
      });
    }
    
    // 合并新生成的注数到现有注数
    const updatedGeneratedNotes = [...this.data.generatedNotes, ...generatedNotes];
    // 计算新的选中注数（所有selected为true的注数）
    const updatedSelectedNotes = updatedGeneratedNotes.filter(note => note.selected);
    
    console.debug('[generateNumbers] 生成注数:', {
      selectedGenerateCount,
      generatedNotesLength: generatedNotes.length,
      updatedGeneratedNotesLength: updatedGeneratedNotes.length,
      updatedSelectedNotesLength: updatedSelectedNotes.length
    });
    
    // 如果只生成一注，也更新当前显示的号码
    if (selectedGenerateCount === 1 && generatedNotes.length > 0) {
      this.setData({
        brownBalls: generatedNotes[0].brownBalls,
        greenBalls: generatedNotes[0].greenBalls,
        generatedNotes: updatedGeneratedNotes,
        });
    } else {
      // 生成多注时，只添加到生成注数，不更新当前显示的号码
      this.setData({
        generatedNotes: updatedGeneratedNotes,
        });
    }
  },

  // 添加当前显示的号码到生成注数
  addToNotes() {
    const { brownBalls, greenBalls, generatedNotes } = this.data;
    
    if (brownBalls.length === 0) {
      wx.showToast({
        title: '请先生成号码',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const note = {
      id: Date.now(),
      brownBalls: [...brownBalls],
      greenBalls: [...greenBalls],
      selected: true
    };
    
    const updatedGeneratedNotes = [...generatedNotes, note];
    const updatedSelectedNotes = updatedGeneratedNotes.filter(note => note.selected);
    
    this.setData({
      generatedNotes: updatedGeneratedNotes,
    });
  },

  // 选择注数
  toggleNote(e) {
    const noteId = e.currentTarget.dataset.id;
    const generatedNotes = this.data.generatedNotes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          selected: !note.selected
        };
      }
      return note;
    });
    
    const selectedNotes = generatedNotes.filter(note => note.selected);
    
    this.setData({
      generatedNotes,
    });
  },

  // 清空生成注数
  clearNotes() {
    this.setData({
      generatedNotes: [],
    });
  },

  // 模拟结果
  simulateResult() {
    const { mode } = this.data;
    let brownBalls = [];
    let greenBalls = [];
    
    // 生成棕球
    const brownRange = mode === 'double' ? 33 : 35;
    const brownCount = mode === 'double' ? 6 : 5;
    
    while (brownBalls.length < brownCount) {
      const num = Math.floor(Math.random() * brownRange) + 1;
      if (!brownBalls.includes(num)) {
        brownBalls.push(num);
      }
    }
    
    // 生成绿球
    const greenRange = mode === 'double' ? 16 : 12;
    const greenCount = mode === 'double' ? 1 : 2;
    
    while (greenBalls.length < greenCount) {
      const num = Math.floor(Math.random() * greenRange) + 1;
      if (!greenBalls.includes(num)) {
        greenBalls.push(num);
      }
    }
    
    // 排序
    brownBalls.sort((a, b) => a - b);
    greenBalls.sort((a, b) => a - b);
    
    console.debug('[simulateResult] 模拟开奖结果:', {
      brownBalls,
      greenBalls,
      mode
    });
    
    // 先显示开奖结果，再显示匹配结果
    this.setData({
      drawResult: {
        brownBalls,
        greenBalls
      },
      showDrawResult: true,
      // 初始化为空结果
      matchResults: [],
      showMatchResult: false,
      singleResult: {
        totalCost: 0,
        totalRevenue: 0,
        netProfit: 0
      }
    }, () => {
      // 延迟计算匹配结果，确保开奖结果先显示
      setTimeout(() => {
        this.calculateMatch();
      }, 100);
    });
    
    console.debug('[simulateResult] 初始化 singleResult:', this.data.singleResult);
  },

  // 计算匹配结果
  calculateMatch() {
    const selectedNotes = this._selectedNotes || [];
    const { drawResult, mode } = this.data;
    const prizeStandards = this.getPrizeStandards();
    
    // 计算每注的匹配情况和收益
    const costPerNote = 2; // 每注成本
    let totalCost = selectedNotes.length > 0 ? selectedNotes.length * costPerNote : 0;
    let totalRevenue = 0;
    
    const matchResults = selectedNotes.length > 0 ? selectedNotes.map(note => {
      const matchedBrown = note.brownBalls.filter(ball => drawResult.brownBalls.includes(ball)).length;
      const matchedGreen = note.greenBalls.filter(ball => drawResult.greenBalls.includes(ball)).length;
      
      let matchLevel = '';
      let revenue = 0;
      
      // 根据模式计算匹配等级和收益
      if (mode === 'double') {
        // 双色球模式
        if (matchedBrown === 6 && matchedGreen === 1) {
          matchLevel = '一等奖';
          revenue = prizeStandards['一等奖'];
        } else if (matchedBrown === 6 && matchedGreen === 0) {
          matchLevel = '二等奖';
          revenue = prizeStandards['二等奖'];
        } else if (matchedBrown === 5 && matchedGreen === 1) {
          matchLevel = '三等奖';
          revenue = prizeStandards['三等奖'];
        } else if (matchedBrown === 5 && matchedGreen === 0) {
          matchLevel = '四等奖';
          revenue = prizeStandards['四等奖'];
        } else if (matchedBrown === 4 && matchedGreen === 1) {
          matchLevel = '四等奖';
          revenue = prizeStandards['四等奖'];
        } else if (matchedBrown === 4 && matchedGreen === 0) {
          matchLevel = '五等奖';
          revenue = prizeStandards['五等奖'];
        } else if (matchedBrown === 3 && matchedGreen === 1) {
          matchLevel = '五等奖';
          revenue = prizeStandards['五等奖'];
        } else if (matchedBrown === 2 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else if (matchedBrown === 1 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else if (matchedBrown === 0 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else {
          matchLevel = '未中奖';
          revenue = 0;
        }
      } else {
        // 大乐透模式（2026年新规则，7个奖级）
        if (matchedBrown === 5 && matchedGreen === 2) {
          matchLevel = '一等奖';
          revenue = prizeStandards['一等奖'];
        } else if (matchedBrown === 5 && matchedGreen === 1) {
          matchLevel = '二等奖';
          revenue = prizeStandards['二等奖'];
        } else if (matchedBrown === 5 && matchedGreen === 0) {
          matchLevel = '三等奖';
          revenue = prizeStandards['三等奖'];
        } else if (matchedBrown === 4 && matchedGreen === 2) {
          matchLevel = '三等奖';
          revenue = prizeStandards['三等奖'];
        } else if (matchedBrown === 4 && matchedGreen === 1) {
          matchLevel = '四等奖';
          revenue = prizeStandards['四等奖'];
        } else if (matchedBrown === 3 && matchedGreen === 2) {
          matchLevel = '四等奖';
          revenue = prizeStandards['四等奖'];
        } else if (matchedBrown === 4 && matchedGreen === 0) {
          matchLevel = '五等奖';
          revenue = prizeStandards['五等奖'];
        } else if (matchedBrown === 3 && matchedGreen === 1) {
          matchLevel = '五等奖';
          revenue = prizeStandards['五等奖'];
        } else if (matchedBrown === 2 && matchedGreen === 2) {
          matchLevel = '五等奖';
          revenue = prizeStandards['五等奖'];
        } else if (matchedBrown === 3 && matchedGreen === 0) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else if (matchedBrown === 1 && matchedGreen === 2) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else if (matchedBrown === 2 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = prizeStandards['六等奖'];
        } else if (matchedBrown === 0 && matchedGreen === 2) {
          matchLevel = '七等奖';
          revenue = prizeStandards['七等奖'];
        } else if (matchedBrown === 2 && matchedGreen === 0) {
          matchLevel = '七等奖';
          revenue = prizeStandards['七等奖'];
        } else if (matchedBrown === 1 && matchedGreen === 1) {
          matchLevel = '七等奖';
          revenue = prizeStandards['七等奖'];
        } else if (matchedBrown === 0 && matchedGreen === 1) {
          matchLevel = '七等奖';
          revenue = prizeStandards['七等奖'];
        } else {
          matchLevel = '未中奖';
          revenue = 0;
        }
      }
      
      totalRevenue += revenue;
      
      return {
        ...note,
        matchedBrown,
        matchedGreen,
        matchLevel,
        revenue
      };
    }) : [];
    
    const netProfit = totalRevenue - totalCost;
    
    console.debug('[calculateMatch] 计算结果:', {
      selectedNotesCount: selectedNotes.length,
      costPerNote: 2,
      totalCost,
      totalRevenue,
      netProfit,
      prizeStandards
    });
    
    this.setData({
      matchResults,
      showMatchResult: true,
      singleResult: {
        totalCost,
        totalRevenue,
        netProfit
      }
    }, () => {
      console.debug('[calculateMatch] setData 回调 - 数据更新完成:', {
        showMatchResult: this.data.showMatchResult,
        singleResult: this.data.singleResult,
        matchResultsLength: this.data.matchResults.length
      });
    });
    
    console.debug('[calculateMatch] 更新后 singleResult:', this.data.singleResult);
    console.debug('[calculateMatch] showMatchResult:', this.data.showMatchResult);
    
    // 如果没有选中注数，显示提示但仍然显示成本和收益为0的结果
    if (selectedNotes.length === 0) {
      wx.showToast({
        title: '未选择注数，成本收益为0',
        icon: 'none',
        duration: 1000
      });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '取数模拟器',
      path: '/packages/math/pages/random-selector/random-selector'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '取数模拟器',
      query: 'random-selector'
    };
  },

  // 设置一键生成数量
  setGenerateCount(e) {
    const index = e.detail.value;
    const count = this.data.generateOptions[index];
    this.setData({
      selectedGenerateCount: count,
    });
  },

  // 设置定投期数
  setInvestmentPeriods(e) {
    const index = e.detail.value;
    const periods = this.data.periodOptions[index];
    console.debug('[setInvestmentPeriods] 更新定投期数:', { periods, index });
    this.setData({
      selectedPeriod: periods,
    });
  },

  // 直接设置生成数量
  setGenerateCountDirectly(e) {
    const count = e.currentTarget.dataset.count;
    const index = this.data.generateOptions.indexOf(count);
    this.setData({
      selectedGenerateCount: count,
    });
  },

  // 直接设置定投期数
  setInvestmentPeriodsDirectly(e) {
    const periods = e.currentTarget.dataset.periods;
    const index = this.data.periodOptions.indexOf(periods);
    console.debug('[setInvestmentPeriodsDirectly] 更新定投期数:', { periods, index });
    this.setData({
      selectedPeriod: periods,
    });
  },

  // 切换定投区域显示
  toggleInvestment(e) {
    const checked = e.detail.value;
    this.setData({
      showInvestmentSection: checked
    });
  },

  // 开始定投
  startInvestment() {
    const { generatedNotes, mode, selectedPeriod } = this.data;
    
    if (generatedNotes.length === 0) {
      wx.showToast({
        title: '请先生成注数',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    const selectedNotes = generatedNotes.filter(note => note.selected);
    
    this.setData({
      isInvesting: true,
      showInvestmentResult: false
    });
    
    // 使用setTimeout避免UI阻塞
    setTimeout(() => {
      // 模拟指定期数
      const totalPeriods = selectedPeriod;
      const hitDetails = [];
      let hitPeriods = 0;
      
      for (let i = 0; i < totalPeriods; i++) {
        // 生成当期结果
        const currentDraw = this.generateResultNumbers(mode);
        
        // 检查每注是否命中
        const currentHitStatus = selectedNotes.map(note => {
        const matchedBrown = note.brownBalls.filter(ball => currentDraw.brownBalls.includes(ball)).length;
        const matchedGreen = note.greenBalls.filter(ball => currentDraw.greenBalls.includes(ball)).length;
        
        let matchLevel = '';
        
        // 根据模式计算匹配等级
        if (mode === 'double') {
          // 模式1（6棕1绿）模式匹配规则
          if (matchedBrown === 6 && matchedGreen === 1) {
            matchLevel = '一等奖';
          } else if (matchedBrown === 6 && matchedGreen === 0) {
            matchLevel = '二等奖';
          } else if (matchedBrown === 5 && matchedGreen === 1) {
            matchLevel = '三等奖';
          } else if (matchedBrown === 5 && matchedGreen === 0) {
            matchLevel = '四等奖';
          } else if (matchedBrown === 4 && matchedGreen === 1) {
            matchLevel = '四等奖';
          } else if (matchedBrown === 4 && matchedGreen === 0) {
            matchLevel = '五等奖';
          } else if (matchedBrown === 3 && matchedGreen === 1) {
            matchLevel = '五等奖';
          } else if (matchedBrown === 2 && matchedGreen === 1) {
            matchLevel = '六等奖';
          } else if (matchedBrown === 1 && matchedGreen === 1) {
            matchLevel = '六等奖';
          } else if (matchedBrown === 0 && matchedGreen === 1) {
            matchLevel = '六等奖';
          } else {
            matchLevel = '未中奖';
          }
        } else {
          // 模式2（5棕2绿）模式匹配规则
          if (matchedBrown === 5 && matchedGreen === 2) {
            matchLevel = '一等奖';
          } else if (matchedBrown === 5 && matchedGreen === 1) {
            matchLevel = '二等奖';
          } else if (matchedBrown === 5 && matchedGreen === 0) {
            matchLevel = '三等奖';
          } else if (matchedBrown === 4 && matchedGreen === 2) {
            matchLevel = '三等奖';
          } else if (matchedBrown === 4 && matchedGreen === 1) {
            matchLevel = '四等奖';
          } else if (matchedBrown === 3 && matchedGreen === 2) {
            matchLevel = '四等奖';
          } else if (matchedBrown === 4 && matchedGreen === 0) {
            matchLevel = '五等奖';
          } else if (matchedBrown === 3 && matchedGreen === 1) {
            matchLevel = '五等奖';
          } else if (matchedBrown === 2 && matchedGreen === 2) {
            matchLevel = '五等奖';
          } else if (matchedBrown === 3 && matchedGreen === 0) {
            matchLevel = '六等奖';
          } else if (matchedBrown === 1 && matchedGreen === 2) {
            matchLevel = '六等奖';
          } else if (matchedBrown === 2 && matchedGreen === 1) {
            matchLevel = '六等奖';
          } else if (matchedBrown === 0 && matchedGreen === 2) {
            matchLevel = '六等奖';
          } else {
            matchLevel = '未中奖';
          }
        }
          
          return {
            ...note,
            matchedBrown,
            matchedGreen,
            matchLevel
          };
        });
        
        // 检查当期是否有命中
        const hasHit = currentHitStatus.some(item => item.matchLevel !== '未中奖');
        if (hasHit) {
          hitPeriods++;
        }
        
        hitDetails.push({
          period: i + 1,
          drawResult: currentDraw,
          hitStatus: currentHitStatus,
          hasHit: hasHit
        });
      }
      
      const hitRate = (hitPeriods / totalPeriods * 100).toFixed(2);
      
      // 计算投入成本和总收入（模拟）
      const costPerNote = 2; // 每注成本
      const totalNotes = selectedNotes.length;
      const totalCost = totalPeriods * totalNotes * costPerNote;
      
      // 获取奖金标准
      const prizeStandards = this.getPrizeStandards();
      
      // 模拟收入（根据命中情况）
      let totalRevenue = 0;
      
      // 初始化奖项统计
      const awardStats = [
        { name: '一等奖', count: 0, revenue: 0 },
        { name: '二等奖', count: 0, revenue: 0 },
        { name: '三等奖', count: 0, revenue: 0 },
        { name: '四等奖', count: 0, revenue: 0 },
        { name: '五等奖', count: 0, revenue: 0 },
        { name: '六等奖', count: 0, revenue: 0 },
        { name: '七等奖', count: 0, revenue: 0 }
      ];
      
      hitDetails.forEach(detail => {
        if (detail.hasHit) {
          detail.hitStatus.forEach(status => {
            if (status.matchLevel !== '未中奖') {
              // 根据奖金标准获取奖金
              const revenue = prizeStandards[status.matchLevel] || 0;
              
              // 更新奖项统计
              const awardIndex = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '七等奖'].indexOf(status.matchLevel);
              if (awardIndex !== -1) {
                awardStats[awardIndex].count++;
                awardStats[awardIndex].revenue += revenue;
              }
              
              totalRevenue += revenue;
            }
          });
        }
      });
      
      // 过滤掉数量为0的奖项
      const filteredAwardStats = awardStats.filter(award => award.count > 0);
      
      // 延迟更新数据，确保UI有足够时间响应
      setTimeout(() => {
        this.setData({
          investmentResult: {
            totalPeriods,
            hitPeriods,
            hitDetails,
            hitRate,
            totalCost,
            totalRevenue,
            netProfit: totalRevenue - totalCost,
            awardStats: filteredAwardStats
          },
          showInvestmentResult: true,
          isInvesting: false
        });
      }, 100);
    }, 100);
  },

  // 生成结果号码
  generateResultNumbers(mode) {
    let brownBalls = [];
    let greenBalls = [];
    
    // 生成棕球
    const brownRange = mode === 'double' ? 33 : 35;
    const brownCount = mode === 'double' ? 6 : 5;
    
    while (brownBalls.length < brownCount) {
      const num = Math.floor(Math.random() * brownRange) + 1;
      if (!brownBalls.includes(num)) {
        brownBalls.push(num);
      }
    }
    
    // 生成绿球
    const greenRange = mode === 'double' ? 16 : 12;
    const greenCount = mode === 'double' ? 1 : 2;
    
    while (greenBalls.length < greenCount) {
      const num = Math.floor(Math.random() * greenRange) + 1;
      if (!greenBalls.includes(num)) {
        greenBalls.push(num);
      }
    }
    
    // 排序
    brownBalls.sort((a, b) => a - b);
    greenBalls.sort((a, b) => a - b);
    
    return {
      brownBalls,
      greenBalls
    };
  },

  // 获取奖池信息
  async fetchPrizePool() {
    try {
      wx.showLoading({
        title: '更新奖池信息...'
      });
      
      // 模拟获取奖池信息（实际项目中应该调用真实的API）
      // 这里使用模拟数据，实际应该从体彩官方API获取
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const prizePoolAmount = 860000000; // 模拟8.6亿奖池

      this._prizePool = {
        amount: prizePoolAmount,
        lastUpdated: new Date().toLocaleString()
      };
      
      wx.hideLoading();
      wx.showToast({
        title: '奖池信息已更新',
        icon: 'success'
      });
      
      console.debug('[fetchPrizePool] 奖池信息更新成功:', prizePoolAmount);
    } catch (error) {
      wx.hideLoading();
      console.error('[fetchPrizePool] 获取奖池信息失败:', error);
      wx.showToast({
        title: '获取奖池信息失败',
        icon: 'none'
      });
    }
  },
  
  // 获取奖金标准（根据奖池金额）
  getPrizeStandards() {
    const prizePool = this._prizePool;
    const { mode } = this.data;
    const isHighPool = prizePool.amount >= 800000000;
    
    if (mode === 'double') {
      // 双色球模式
      return {
        一等奖: 5000000,
        二等奖: 200000,
        三等奖: 3000,
        四等奖: 200,
        五等奖: 10,
        六等奖: 5
      };
    } else {
      // 大乐透模式（2026年新规则）
      if (isHighPool) {
        // 奖池≥8亿时的奖金标准
        return {
          一等奖: 5000000,
          二等奖: 500000,
          三等奖: 6666,
          四等奖: 380,
          五等奖: 200,
          六等奖: 18,
          七等奖: 7
        };
      } else {
        // 奖池<8亿时的奖金标准
        return {
          一等奖: 5000000,
          二等奖: 500000,
          三等奖: 5000,
          四等奖: 300,
          五等奖: 150,
          六等奖: 15,
          七等奖: 5
        };
      }
    }
  },
  
  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '取数模拟器'
    });
    
    // 页面加载时获取奖池信息
    this.fetchPrizePool();
  },
  
  // 页面显示时执行
  onShow() {
    console.debug('[onShow] 页面显示时数据状态:', {
      showMatchResult: this.data.showMatchResult,
      singleResult: this.data.singleResult,
      selectedNotes: this.data.selectedNotes
    });
  },

  // ========== 导出 Excel 功能 ==========

  // 边框辅助
  _border(style) {
    const b = { style: 'thin', color: { rgb: 'FFAAAAAA' } };
    return { ...style, border: { top: b, bottom: b, left: b, right: b } };
  },

  _makeHeaderStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FF2C5F8C' } }
    });
  },

  _makeTitleStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 16, bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FF1A3A6B' } }
    });
  },

  _makeLabelStyle() {
    return this._border({
      alignment: { horizontal: 'left', vertical: 'center' },
      font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FF333333' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFD9E8F5' } }
    });
  },

  _makeValueStyle() {
    return this._border({
      alignment: { horizontal: 'left', vertical: 'center' },
      font: { name: 'Arial', sz: 11, color: { rgb: 'FF333333' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }
    });
  },

  _makeBrownBallStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFD32F2F' } }
    });
  },

  _makeGreenBallStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FF388E3C' } }
    });
  },

  _makeOddRowStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 11, color: { rgb: 'FF333333' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF5F8FF' } }
    });
  },

  _makeEvenRowStyle() {
    return this._border({
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { name: 'Arial', sz: 11, color: { rgb: 'FF333333' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } }
    });
  },

  _makeStatLabelStyle() {
    return this._border({
      alignment: { horizontal: 'left', vertical: 'center' },
      font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FF2C5F8C' } }
    });
  },

  _makeStatValueStyle(isProfit) {
    return this._border({
      alignment: { horizontal: 'left', vertical: 'center' },
      font: { name: 'Arial', sz: 11, bold: true, color: { rgb: isProfit ? 'FF1B5E20' : 'FFB71C1C' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFE8F5E9' } }
    });
  },

  _applyStyleToWs(ws, aoa, styleFn, dataStartRow) {
    const range = XLSX.utils.decode_range(`A1:${XLSX.utils.encode_cell({ r: aoa.length - 1, c: aoa[0].length - 1 })}`);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) ws[ref] = { v: '' };
        ws[ref].s = styleFn(R, C, ws[ref].v);
      }
    }
  },

  _doExport(wb, fileName) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    wx.getFileSystemManager().writeFile({
      filePath: fullPath,
      data: wbout,
      encoding: 'base64',
      success: () => {
        wx.openDocument({
          filePath: fullPath,
          fileType: 'xlsx',
          showMenu: true,
          success: () => wx.showToast({ title: '已打开Excel', icon: 'success' }),
          fail: () => wx.showModal({
            title: '导出成功',
            content: `文件已保存为 ${fileName}`,
            showCancel: false
          })
        });
      },
      fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
    });
  },

  // 导出当前生成的号码
  exportResult() {
    const { brownBalls, greenBalls, mode } = this.data;
    if (brownBalls.length === 0) {
      wx.showToast({ title: '请先生成号码', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导出',
      content: '确定要导出当前彩票号码为 Excel 文件吗？',
      success: (res) => {
        if (!res.confirm) return;

        const modeName = mode === 'double' ? '双色球' : '大乐透';
        const brownLabel = mode === 'double' ? '红球' : '棕球';
        const greenLabel = mode === 'double' ? '蓝球' : '绿球';
        const maxBalls = Math.max(brownBalls.length, greenBalls.length);

        // 构建球号展示区域 aoa，每列一个球
        // 行0=标签(棕/红球、绿/蓝球)，行1=球号
        const ballRows = [
          [brownLabel, greenLabel],
          brownBalls.map(n => String(n).padStart(2, '0')),
          greenBalls.map(n => String(n).padStart(2, '0'))
        ];

        // 信息行 aoa（左侧2列标签+值，右侧3列留空）
        const infoAoa = [
          ['生成时间', new Date().toLocaleString('zh-CN')],
          ['彩种', modeName],
          ['备注', '此号码由模拟器随机生成，仅供参考']
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
          ['取数模拟器 - 彩票号码导出'],
          [],
          [brownLabel, greenLabel, '', '', brownLabel, greenLabel],
          brownBalls.map(n => String(n).padStart(2, '0')),
          greenBalls.map(n => String(n).padStart(2, '0')),
          [],
          ['生成时间', new Date().toLocaleString('zh-CN'), '', '', '彩种', modeName],
          ['备注', '此号码由模拟器随机生成，仅供参考']
        ]);

        const ballColCount = maxBalls;
        ws['!cols'] = [
          { wch: 16 }, { wch: 12 }, { wch: 3 },
          ...Array(ballColCount).fill({ wch: 8 }),
          { wch: 3 },
          { wch: 16 }, { wch: 12 }
        ];

        // 样式：标题行（合并 A1:G1）
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
        for (let C = 0; C < 7; C++) {
          const ref = XLSX.utils.encode_cell({ r: 0, c: C });
          ws[ref] = ws[ref] || { v: '' };
          ws[ref].s = this._makeTitleStyle();
        }

        // 球号区样式（行2-4，跳过 A 列标签）
        for (let R = 2; R <= 4; R++) {
          const ballCount = R === 3 ? brownBalls.length : greenBalls.length;
          for (let C = 1; C <= ballCount; C++) {
            const ref = XLSX.utils.encode_cell({ r: R, c: C });
            ws[ref] = ws[ref] || { v: '' };
            ws[ref].s = R === 3 ? this._makeBrownBallStyle() : this._makeGreenBallStyle();
          }
          // A 列标签也用球号色
          const labelRef = XLSX.utils.encode_cell({ r: R, c: 0 });
          ws[labelRef].s = R === 3 ? this._makeBrownBallStyle() : this._makeGreenBallStyle();
        }

        // 信息行（行6-7）
        for (let R = 6; R <= 7; R++) {
          const cells = R === 6
            ? [['A', '生成时间'], ['B', new Date().toLocaleString('zh-CN')], ['F', '彩种'], ['G', modeName]]
            : [['A', '备注'], ['B', '此号码由模拟器随机生成，仅供参考']];
          cells.forEach(([col, val]) => {
            const colIdx = col.charCodeAt(0) - 65;
            const ref = XLSX.utils.encode_cell({ r: R, c: colIdx });
            ws[ref] = { v: val, s: colIdx === 0 || colIdx === 5 ? this._makeLabelStyle() : this._makeValueStyle() };
          });
        }

        XLSX.utils.book_append_sheet(wb, ws, '彩票号码');
        this._doExport(wb, `lottery_${Date.now()}.xlsx`);
      }   // 确认弹窗 success 结束
    });
  },

  // 导出已生成的号码列表
  copyNotesToClipboard() {
    const { generatedNotes, mode } = this.data;
    if (generatedNotes.length === 0) {
      wx.showToast({ title: '暂无数据', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导出',
      content: '确定要导出已生成的号码列表为 Excel 文件吗？',
      success: (res) => {
        if (!res.confirm) return;

        const modeName = mode === 'double' ? '双色球' : '大乐透';
        const brownLabel = mode === 'double' ? '红球' : '棕球';
        const greenLabel = mode === 'double' ? '蓝球' : '绿球';
        const brownCount = mode === 'double' ? 6 : 5;
        const greenCount = mode === 'double' ? 1 : 2;

        // 表头：序号 + 棕球×N + 绿球×N
        const headerCells = ['序号'];
        for (let i = 0; i < brownCount; i++) headerCells.push(brownLabel);
        for (let i = 0; i < greenCount; i++) headerCells.push(greenLabel);

        const aoa = [headerCells];

        generatedNotes.forEach((note, index) => {
          const row = [String(index + 1)];
          // 棕球
          for (let i = 0; i < brownCount; i++) {
            row.push(note.brownBalls[i] != null ? String(note.brownBalls[i]).padStart(2, '0') : '');
          }
          // 绿球
          for (let i = 0; i < greenCount; i++) {
            row.push(note.greenBalls[i] != null ? String(note.greenBalls[i]).padStart(2, '0') : '');
          }
          aoa.push(row);
        });

        // 统计区
        const selectedCount = generatedNotes.filter(n => n.selected).length;
        aoa.push([]);
        aoa.push(['统计']);
        aoa.push([`总注数  ${generatedNotes.length}`]);
        aoa.push([`已选注  ${selectedCount}`]);
        aoa.push([`总金额  ¥${selectedCount * 2}`]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // 列宽：序号6，其余按球号列宽
        const cols = [{ wch: 6 }];
        for (let i = 0; i < brownCount; i++) cols.push({ wch: 6 });
        for (let i = 0; i < greenCount; i++) cols.push({ wch: 6 });
        ws['!cols'] = cols;

        const totalCols = 1 + brownCount + greenCount;
        const lastDataRow = generatedNotes.length - 1; // 0-indexed
        const statsStartRow = lastDataRow + 2; // 空行后

        // 标题行
        const titleRef = `A1:${XLSX.utils.encode_cell({ r: 0, c: totalCols - 1 })}`;
        for (let C = 0; C < totalCols; C++) {
          const ref = XLSX.utils.encode_cell({ r: 0, c: C });
          ws[ref].s = this._makeTitleStyle();
        }
        // 合并标题行
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

        // 表头行
        for (let C = 0; C < totalCols; C++) {
          const ref = XLSX.utils.encode_cell({ r: 1, c: C });
          if (!ws[ref]) ws[ref] = { v: '' };
          ws[ref].s = this._makeHeaderStyle();
        }

        // 数据行
        for (let R = 1; R <= 1 + lastDataRow + 1; R++) {
          const isOdd = (R - 2) % 2 === 0;
          const rowStyle = isOdd ? this._makeOddRowStyle() : this._makeEvenRowStyle();
          for (let C = 0; C < totalCols; C++) {
            const ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[ref]) ws[ref] = { v: '' };
            if (C === 0) {
              ws[ref].s = rowStyle;
            } else if (C <= brownCount) {
              // 棕球列
              const ballVal = parseInt(ws[ref].v, 10);
              ws[ref].s = !isNaN(ballVal) ? this._makeBrownBallStyle() : rowStyle;
            } else {
              // 绿球列
              const ballVal = parseInt(ws[ref].v, 10);
              ws[ref].s = !isNaN(ballVal) ? this._makeGreenBallStyle() : rowStyle;
            }
          }
        }

        // 统计行
        for (let R = statsStartRow; R < aoa.length; R++) {
          const isLabelRow = R === statsStartRow;
          const isProfitRow = R === statsStartRow + 4;
          const baseStyle = isLabelRow ? this._makeStatLabelStyle()
            : isProfitRow ? this._makeStatValueStyle(true) : this._makeStatValueStyle(false);
          for (let C = 0; C < totalCols; C++) {
            const ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[ref]) ws[ref] = { v: '' };
            ws[ref].s = baseStyle;
          }
          // 合并统计行
          ws['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: totalCols - 1 } });
        }

        XLSX.utils.book_append_sheet(wb, ws, `${modeName}号码列表`);
        this._doExport(wb, `lottery_notes_${Date.now()}.xlsx`);
      }   // 确认弹窗 success 结束
    });
  },

  // 导出模拟结果
  shareResult() {
    const { drawResult, matchResults, singleResult, mode } = this.data;
    if (!drawResult.brownBalls.length) {
      wx.showToast({ title: '暂无结果', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导出',
      content: '确定要导出模拟结果为 Excel 文件吗？',
      success: (res) => {
        if (!res.confirm) return;

        const modeName = mode === 'double' ? '双色球' : '大乐透';
        const brownLabel = mode === 'double' ? '红球' : '棕球';
    const greenLabel = mode === 'double' ? '蓝球' : '绿球';
    const brownCount = mode === 'double' ? 6 : 5;
    const greenCount = mode === 'double' ? 1 : 2;

    // 开奖结果区
    const resultHeader = ['开奖结果', '', '', '', ''];
    const resultBrown = [brownLabel + '：', ...drawResult.brownBalls.map(n => String(n).padStart(2, '0'))];
    const resultGreen = [greenLabel + '：', ...drawResult.greenBalls.map(n => String(n).padStart(2, '0'))];
    const resultTime = ['开奖时间', new Date().toLocaleString('zh-CN')];

    // 汇总区
    const summary = [
      ['汇总'],
      [`总注数：${matchResults.length}`],
      [`总成本：¥${singleResult.totalCost}`],
      [`总收益：¥${singleResult.totalRevenue}`],
      [`净利润：¥${singleResult.netProfit}`]
    ];

    // 详情表头
    const detailHeader = ['序号', brownLabel, greenLabel, `中${brownLabel}`, `中${greenLabel}`, '奖项', '奖金'];
    const detailAoa = [detailHeader];

    // 奖项颜色映射
    const awardColors = {
      '一等奖': 'FFFFB300', '二等奖': 'FFC0C0C0', '三等奖': 'FFFF7043',
      '四等奖': 'FF81C784', '五等奖': 'FF64B5F6', '六等奖': 'FFBA68C8',
      '七等奖': 'FF90A4AE', '未中奖': 'FFE0E0E0'
    };

    matchResults.forEach((item, index) => {
      const brownStr = item.brownBalls.map(n => String(n).padStart(2, '0'));
      const greenStr = item.greenBalls.map(n => String(n).padStart(2, '0'));
      detailAoa.push([
        index + 1,
        ...brownStr,
        ...greenStr,
        item.matchedBrown,
        item.matchedGreen,
        item.matchLevel,
        item.revenue > 0 ? `¥${item.revenue}` : '-'
      ]);
    });

    const wb = XLSX.utils.book_new();

    // Sheet1：开奖+汇总
    const sumWs = XLSX.utils.aoa_to_sheet([
      [`取数模拟器 - ${modeName}模拟结果`],
      [],
      resultHeader,
      resultBrown,
      resultGreen,
      resultTime,
      [],
      ['模拟汇总'],
      [`总注数  ${matchResults.length}`],
      [`总成本  ¥${singleResult.totalCost}`],
      [`总收益  ¥${singleResult.totalRevenue}`],
      [`净利润  ¥${singleResult.netProfit}`]
    ]);
    sumWs['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
    sumWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    // 标题
    for (let C = 0; C < 7; C++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c: C });
      sumWs[ref] = sumWs[ref] || { v: '' };
      sumWs[ref].s = this._makeTitleStyle();
    }

    // 球号区样式（跳过A列标签）
    for (let R = 2; R <= 4; R++) {
      const ballCount = R === 3 ? brownCount : greenCount;
      for (let C = 1; C <= ballCount; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!sumWs[ref]) sumWs[ref] = { v: '' };
        sumWs[ref].s = R === 3 ? this._makeBrownBallStyle() : this._makeGreenBallStyle();
      }
      // A列标签样式
      const labelRef = XLSX.utils.encode_cell({ r: R, c: 0 });
      sumWs[labelRef].s = R === 3 ? this._makeBrownBallStyle() : this._makeGreenBallStyle();
    }

    // 汇总区
    const sumRowStart = 8;
    sumWs[`A${sumRowStart}`].s = this._makeStatLabelStyle();
    for (let R = sumRowStart + 1; R <= sumRowStart + 4; R++) {
      const ref = `A${R}`;
      if (!sumWs[ref]) sumWs[ref] = { v: '' };
      sumWs[ref].s = this._makeStatValueStyle(R === sumRowStart + 4);
    }
    for (let R = sumRowStart; R <= sumRowStart + 4; R++) {
      sumWs['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: 6 } });
    }

    XLSX.utils.book_append_sheet(wb, sumWs, '模拟汇总');

    // Sheet2：各注详情
    const detailWs = XLSX.utils.aoa_to_sheet(detailAoa);
    const detailColCount = detailHeader.length;
    detailWs['!cols'] = [
      { wch: 6 },
      ...Array(brownCount).fill({ wch: 6 }),
      ...Array(greenCount).fill({ wch: 6 }),
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];

    // 详情标题行
    detailWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: detailColCount - 1 } }];

    // 详情表头
    for (let C = 0; C < detailColCount; C++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!detailWs[ref]) detailWs[ref] = { v: '' };
      detailWs[ref].s = this._makeTitleStyle();
    }
    for (let C = 0; C < detailColCount; C++) {
      const ref = XLSX.utils.encode_cell({ r: 1, c: C });
      if (!detailWs[ref]) detailWs[ref] = { v: '' };
      detailWs[ref].s = this._makeHeaderStyle();
    }

    // 详情数据行
    const prizeLevelIdx = 5; // 奖项在数组中的列索引（0=序号,1-6=棕球,7-8=绿球,9=中棕,10=中绿,11=奖项,12=奖金）
    for (let R = 2; R < detailAoa.length; R++) {
      const isOdd = (R - 2) % 2 === 0;
      const rowBase = isOdd ? this._makeOddRowStyle() : this._makeEvenRowStyle();
      for (let C = 0; C < detailColCount; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!detailWs[ref]) detailWs[ref] = { v: '' };
        if (C >= 1 && C <= brownCount) {
          const ballVal = parseInt(detailWs[ref].v, 10);
          detailWs[ref].s = !isNaN(ballVal) ? this._makeBrownBallStyle() : rowBase;
        } else if (C > brownCount && C <= brownCount + greenCount) {
          const ballVal = parseInt(detailWs[ref].v, 10);
          detailWs[ref].s = !isNaN(ballVal) ? this._makeGreenBallStyle() : rowBase;
        } else {
          detailWs[ref].s = rowBase;
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, detailWs, '各注详情');
    this._doExport(wb, `lottery_result_${Date.now()}.xlsx`);
      }   // 确认弹窗 success 结束
    });
  }
});
