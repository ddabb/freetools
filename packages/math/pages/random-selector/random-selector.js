// packages/math/pages/random-selector/random-selector.js
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
    selectedNotes: [],
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
    generateSettings: {
      count: 1
    },
    generateOptions: [1, 5, 10, 50, 100, 200],
    generateIndex: 0, // 默认选择1注
    selectedGenerateCount: 1,
    // 定投相关
    investmentSettings: {
      periods: 100,
      selectedNotes: []
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
    periodIndex: 1, // 默认选择5期
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
    }
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
      selectedNotes: [],
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
    
    console.log('[toggleCard] 卡片状态切换:', { cardType, expanded: !currentExpanded });
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
    
    console.log('[generateNumbers] 生成注数:', {
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
        selectedNotes: updatedSelectedNotes
      });
    } else {
      // 生成多注时，只添加到生成注数，不更新当前显示的号码
      this.setData({
        generatedNotes: updatedGeneratedNotes,
        selectedNotes: updatedSelectedNotes
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
      selectedNotes: updatedSelectedNotes
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
      selectedNotes
    });
  },

  // 清空生成注数
  clearNotes() {
    this.setData({
      generatedNotes: [],
      selectedNotes: []
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
    
    console.log('[simulateResult] 模拟开奖结果:', {
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
    
    console.log('[simulateResult] 初始化 singleResult:', this.data.singleResult);
  },

  // 计算匹配结果
  calculateMatch() {
    const { selectedNotes, drawResult, mode } = this.data;
    
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
        // 模式1（6棕1绿）模式匹配规则 - 实际奖金标准
        if (matchedBrown === 6 && matchedGreen === 1) {
          matchLevel = '一等奖';
          revenue = 5000000; // 一等奖（浮动奖金，模拟500万）
        } else if (matchedBrown === 6 && matchedGreen === 0) {
          matchLevel = '二等奖';
          revenue = 200000; // 二等奖（浮动奖金，模拟20万）
        } else if (matchedBrown === 5 && matchedGreen === 1) {
          matchLevel = '三等奖';
          revenue = 3000; // 三等奖（3000元）
        } else if (matchedBrown === 5 && matchedGreen === 0) {
          matchLevel = '四等奖';
          revenue = 200; // 四等奖（200元）
        } else if (matchedBrown === 4 && matchedGreen === 1) {
          matchLevel = '四等奖';
          revenue = 200; // 四等奖（200元）
        } else if (matchedBrown === 4 && matchedGreen === 0) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedBrown === 3 && matchedGreen === 1) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedBrown === 2 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedBrown === 1 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedBrown === 0 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else {
          matchLevel = '未中奖';
          revenue = 0;
        }
      } else {
        // 模式2（5棕2绿）模式匹配规则 - 实际奖金标准
        if (matchedBrown === 5 && matchedGreen === 2) {
          matchLevel = '一等奖';
          revenue = 5000000; // 一等奖（浮动奖金，模拟500万）
        } else if (matchedBrown === 5 && matchedGreen === 1) {
          matchLevel = '二等奖';
          revenue = 500000; // 二等奖（浮动奖金，模拟50万）
        } else if (matchedBrown === 5 && matchedGreen === 0) {
          matchLevel = '三等奖';
          revenue = 200; // 三等奖（200元）
        } else if (matchedBrown === 4 && matchedGreen === 2) {
          matchLevel = '三等奖';
          revenue = 200; // 三等奖（200元）
        } else if (matchedBrown === 4 && matchedGreen === 1) {
          matchLevel = '四等奖';
          revenue = 50; // 四等奖（50元）
        } else if (matchedBrown === 3 && matchedGreen === 2) {
          matchLevel = '四等奖';
          revenue = 50; // 四等奖（50元）
        } else if (matchedBrown === 4 && matchedGreen === 0) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedBrown === 3 && matchedGreen === 1) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedBrown === 2 && matchedGreen === 2) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedBrown === 3 && matchedGreen === 0) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedBrown === 1 && matchedGreen === 2) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedBrown === 2 && matchedGreen === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedBrown === 0 && matchedGreen === 2) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
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
    
    console.log('[calculateMatch] 计算结果:', {
      selectedNotesCount: selectedNotes.length,
      costPerNote: 2,
      totalCost,
      totalRevenue,
      netProfit
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
      console.log('[calculateMatch] setData 回调 - 数据更新完成:', {
        showMatchResult: this.data.showMatchResult,
        singleResult: this.data.singleResult,
        matchResultsLength: this.data.matchResults.length
      });
    });
    
    console.log('[calculateMatch] 更新后 singleResult:', this.data.singleResult);
    console.log('[calculateMatch] showMatchResult:', this.data.showMatchResult);
    
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
      generateIndex: index,
      selectedGenerateCount: count,
      'generateSettings.count': count
    });
  },

  // 设置定投期数
  setInvestmentPeriods(e) {
    const index = e.detail.value;
    const periods = this.data.periodOptions[index];
    console.log('[setInvestmentPeriods] 更新定投期数:', { periods, index });
    this.setData({
      periodIndex: index,
      selectedPeriod: periods,
      'investmentSettings.periods': periods
    });
  },

  // 直接设置生成数量
  setGenerateCountDirectly(e) {
    const count = e.currentTarget.dataset.count;
    const index = this.data.generateOptions.indexOf(count);
    this.setData({
      generateIndex: index,
      selectedGenerateCount: count,
      'generateSettings.count': count
    });
  },

  // 直接设置定投期数
  setInvestmentPeriodsDirectly(e) {
    const periods = e.currentTarget.dataset.periods;
    const index = this.data.periodOptions.indexOf(periods);
    console.log('[setInvestmentPeriodsDirectly] 更新定投期数:', { periods, index });
    this.setData({
      periodIndex: index,
      selectedPeriod: periods,
      'investmentSettings.periods': periods
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
      
      // 模拟收入（根据命中情况）
      let totalRevenue = 0;
      
      // 初始化奖项统计
      const awardStats = [
        { name: '一等奖', count: 0, revenue: 0 },
        { name: '二等奖', count: 0, revenue: 0 },
        { name: '三等奖', count: 0, revenue: 0 },
        { name: '四等奖', count: 0, revenue: 0 },
        { name: '五等奖', count: 0, revenue: 0 },
        { name: '六等奖', count: 0, revenue: 0 }
      ];
      
      hitDetails.forEach(detail => {
        if (detail.hasHit) {
          detail.hitStatus.forEach(status => {
            if (status.matchLevel !== '未中奖') {
              // 根据命中等级模拟奖金 - 使用与calculateMatch方法一致的奖金标准
              let revenue = 0;
              if (mode === 'double') {
                // 模式1奖金标准
                switch (status.matchLevel) {
                  case '一等奖':
                    revenue = 5000000; // 模拟大奖
                    break;
                  case '二等奖':
                    revenue = 200000; // 二等奖（浮动奖金，模拟20万）
                    break;
                  case '三等奖':
                    revenue = 3000; // 三等奖（3000元）
                    break;
                  case '四等奖':
                    revenue = 200; // 四等奖（200元）
                    break;
                  case '五等奖':
                    revenue = 10; // 五等奖（10元）
                    break;
                  case '六等奖':
                    revenue = 5; // 六等奖（5元）
                    break;
                }
              } else {
                // 模式2奖金标准
                switch (status.matchLevel) {
                  case '一等奖':
                    revenue = 5000000; // 一等奖（浮动奖金，模拟500万）
                    break;
                  case '二等奖':
                    revenue = 500000; // 二等奖（浮动奖金，模拟50万）
                    break;
                  case '三等奖':
                    revenue = 200; // 三等奖（200元）
                    break;
                  case '四等奖':
                    revenue = 50; // 四等奖（50元）
                    break;
                  case '五等奖':
                    revenue = 10; // 五等奖（10元）
                    break;
                  case '六等奖':
                    revenue = 5; // 六等奖（5元）
                    break;
                }
              }
              
              // 更新奖项统计
              switch (status.matchLevel) {
                case '一等奖':
                  awardStats[0].count++;
                  awardStats[0].revenue += revenue;
                  break;
                case '二等奖':
                  awardStats[1].count++;
                  awardStats[1].revenue += revenue;
                  break;
                case '三等奖':
                  awardStats[2].count++;
                  awardStats[2].revenue += revenue;
                  break;
                case '四等奖':
                  awardStats[3].count++;
                  awardStats[3].revenue += revenue;
                  break;
                case '五等奖':
                  awardStats[4].count++;
                  awardStats[4].revenue += revenue;
                  break;
                case '六等奖':
                  awardStats[5].count++;
                  awardStats[5].revenue += revenue;
                  break;
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

  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '取数模拟器'
    });
  },
  
  // 页面显示时执行
  onShow() {
    console.log('[onShow] 页面显示时数据状态:', {
      showMatchResult: this.data.showMatchResult,
      singleResult: this.data.singleResult,
      selectedNotes: this.data.selectedNotes
    });
  }
});
