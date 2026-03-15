// packages/math/pages/random-selector/random-selector.js
Page({
  data: {
    // 选号模式：'double'（六红一蓝）或 'lottery'（五红两蓝）
    mode: 'double',
    // 红球号码
    redBalls: [],
    // 蓝球号码
    blueBalls: [],
    // 生成的注数
    generatedNotes: [],
    // 选中的注数
    selectedNotes: [],
    // 模拟结果
    drawResult: {
      redBalls: [],
      blueBalls: []
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
    // 免责声明
    disclaimer: '本工具仅为随机模拟，不涉及真实彩票销售或预测，结果不具备任何参考价值。模拟娱乐，与真实彩票无关。'
  },

  // 切换选号模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (this.data.mode === mode) return;
    
    this.setData({
      mode,
      redBalls: [],
      blueBalls: [],
      generatedNotes: [],
      selectedNotes: [],
      showDrawResult: false,
      showMatchResult: false,
      showInvestmentResult: false
    });
  },

  // 生成随机号码
  generateNumbers() {
    const { mode, selectedGenerateCount } = this.data;
    const generatedNotes = [];
    
    // 生成指定数量的号码组合
    for (let i = 0; i < selectedGenerateCount; i++) {
      let redBalls = [];
      let blueBalls = [];
      
      // 生成红球
      const redRange = mode === 'double' ? 33 : 35;
      const redCount = mode === 'double' ? 6 : 5;
      
      while (redBalls.length < redCount) {
        const num = Math.floor(Math.random() * redRange) + 1;
        if (!redBalls.includes(num)) {
          redBalls.push(num);
        }
      }
      
      // 生成蓝球
      const blueRange = mode === 'double' ? 16 : 12;
      const blueCount = mode === 'double' ? 1 : 2;
      
      while (blueBalls.length < blueCount) {
        const num = Math.floor(Math.random() * blueRange) + 1;
        if (!blueBalls.includes(num)) {
          blueBalls.push(num);
        }
      }
      
      // 排序
      redBalls.sort((a, b) => a - b);
      blueBalls.sort((a, b) => a - b);
      
      // 添加到生成注数
      generatedNotes.push({
        id: Date.now() + i,
        redBalls: [...redBalls],
        blueBalls: [...blueBalls],
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
        redBalls: generatedNotes[0].redBalls,
        blueBalls: generatedNotes[0].blueBalls,
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
    const { redBalls, blueBalls, generatedNotes } = this.data;
    
    if (redBalls.length === 0) {
      wx.showToast({
        title: '请先生成号码',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const note = {
      id: Date.now(),
      redBalls: [...redBalls],
      blueBalls: [...blueBalls],
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
    let redBalls = [];
    let blueBalls = [];
    
    // 生成红球
    const redRange = mode === 'double' ? 33 : 35;
    const redCount = mode === 'double' ? 6 : 5;
    
    while (redBalls.length < redCount) {
      const num = Math.floor(Math.random() * redRange) + 1;
      if (!redBalls.includes(num)) {
        redBalls.push(num);
      }
    }
    
    // 生成蓝球
    const blueRange = mode === 'double' ? 16 : 12;
    const blueCount = mode === 'double' ? 1 : 2;
    
    while (blueBalls.length < blueCount) {
      const num = Math.floor(Math.random() * blueRange) + 1;
      if (!blueBalls.includes(num)) {
        blueBalls.push(num);
      }
    }
    
    // 排序
    redBalls.sort((a, b) => a - b);
    blueBalls.sort((a, b) => a - b);
    
    console.log('[simulateResult] 模拟开奖结果:', {
      redBalls,
      blueBalls,
      mode
    });
    
    // 先显示开奖结果，再显示匹配结果
    this.setData({
      drawResult: {
        redBalls,
        blueBalls
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
      const matchedRed = note.redBalls.filter(ball => drawResult.redBalls.includes(ball)).length;
      const matchedBlue = note.blueBalls.filter(ball => drawResult.blueBalls.includes(ball)).length;
      
      let matchLevel = '';
      let revenue = 0;
      
      // 根据模式计算匹配等级和收益
      if (mode === 'double') {
        // 双色球（6红1蓝）模式匹配规则 - 实际奖金标准
        if (matchedRed === 6 && matchedBlue === 1) {
          matchLevel = '一等奖';
          revenue = 5000000; // 一等奖（浮动奖金，模拟500万）
        } else if (matchedRed === 6 && matchedBlue === 0) {
          matchLevel = '二等奖';
          revenue = 200000; // 二等奖（浮动奖金，模拟20万）
        } else if (matchedRed === 5 && matchedBlue === 1) {
          matchLevel = '三等奖';
          revenue = 3000; // 三等奖（3000元）
        } else if (matchedRed === 5 && matchedBlue === 0) {
          matchLevel = '四等奖';
          revenue = 200; // 四等奖（200元）
        } else if (matchedRed === 4 && matchedBlue === 1) {
          matchLevel = '四等奖';
          revenue = 200; // 四等奖（200元）
        } else if (matchedRed === 4 && matchedBlue === 0) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedRed === 3 && matchedBlue === 1) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedRed === 2 && matchedBlue === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedRed === 1 && matchedBlue === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedRed === 0 && matchedBlue === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else {
          matchLevel = '未中奖';
          revenue = 0;
        }
      } else {
        // 大乐透（5红2蓝）模式匹配规则 - 实际奖金标准
        if (matchedRed === 5 && matchedBlue === 2) {
          matchLevel = '一等奖';
          revenue = 5000000; // 一等奖（浮动奖金，模拟500万）
        } else if (matchedRed === 5 && matchedBlue === 1) {
          matchLevel = '二等奖';
          revenue = 500000; // 二等奖（浮动奖金，模拟50万）
        } else if (matchedRed === 5 && matchedBlue === 0) {
          matchLevel = '三等奖';
          revenue = 200; // 三等奖（200元）
        } else if (matchedRed === 4 && matchedBlue === 2) {
          matchLevel = '三等奖';
          revenue = 200; // 三等奖（200元）
        } else if (matchedRed === 4 && matchedBlue === 1) {
          matchLevel = '四等奖';
          revenue = 50; // 四等奖（50元）
        } else if (matchedRed === 3 && matchedBlue === 2) {
          matchLevel = '四等奖';
          revenue = 50; // 四等奖（50元）
        } else if (matchedRed === 4 && matchedBlue === 0) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedRed === 3 && matchedBlue === 1) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedRed === 2 && matchedBlue === 2) {
          matchLevel = '五等奖';
          revenue = 10; // 五等奖（10元）
        } else if (matchedRed === 3 && matchedBlue === 0) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedRed === 1 && matchedBlue === 2) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedRed === 2 && matchedBlue === 1) {
          matchLevel = '六等奖';
          revenue = 5; // 六等奖（5元）
        } else if (matchedRed === 0 && matchedBlue === 2) {
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
        matchedRed,
        matchedBlue,
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

  // 分享结果
  shareResult() {
    const { mode, drawResult, matchResults } = this.data;
    
    if (!drawResult.redBalls.length) {
      wx.showToast({
        title: '请先模拟开奖',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const modeName = mode === 'double' ? '六红一蓝' : '五红两蓝';
    const drawRedBalls = drawResult.redBalls.join(' ');
    const drawBlueBalls = drawResult.blueBalls.join(' ');
    
    let shareText = `【${modeName}模拟结果】\n`;
    shareText += `结果：\n`;
    shareText += `红球：${drawRedBalls}\n`;
    shareText += `蓝球：${drawBlueBalls}\n\n`;
    
    if (matchResults && matchResults.length) {
      shareText += `匹配结果：\n`;
      matchResults.forEach((result, index) => {
        shareText += `第${index + 1}注：`;
        shareText += `红球${result.matchedRed}个，蓝球${result.matchedBlue}个，`;
        shareText += `${result.matchLevel}\n`;
      });
    }
    
    shareText += `\n注：本结果仅为模拟，与真实彩票无关`;
    
    wx.setClipboardData({
      data: shareText,
      success() {
        wx.showToast({
          title: '结果已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '随机选号器 - 模拟彩票选号',
      path: '/packages/math/pages/random-selector/random-selector'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '随机选号器 - 模拟彩票选号',
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
          const matchedRed = note.redBalls.filter(ball => currentDraw.redBalls.includes(ball)).length;
          const matchedBlue = note.blueBalls.filter(ball => currentDraw.blueBalls.includes(ball)).length;
          
          let matchLevel = '';
          
          // 根据模式计算匹配等级
          if (mode === 'double') {
            // 双色球（6红1蓝）模式匹配规则
            if (matchedRed === 6 && matchedBlue === 1) {
              matchLevel = '一等奖';
            } else if (matchedRed === 6 && matchedBlue === 0) {
              matchLevel = '二等奖';
            } else if (matchedRed === 5 && matchedBlue === 1) {
              matchLevel = '三等奖';
            } else if (matchedRed === 5 && matchedBlue === 0) {
              matchLevel = '四等奖';
            } else if (matchedRed === 4 && matchedBlue === 1) {
              matchLevel = '四等奖';
            } else if (matchedRed === 4 && matchedBlue === 0) {
              matchLevel = '五等奖';
            } else if (matchedRed === 3 && matchedBlue === 1) {
              matchLevel = '五等奖';
            } else if (matchedRed === 2 && matchedBlue === 1) {
              matchLevel = '六等奖';
            } else if (matchedRed === 1 && matchedBlue === 1) {
              matchLevel = '六等奖';
            } else if (matchedRed === 0 && matchedBlue === 1) {
              matchLevel = '六等奖';
            } else {
              matchLevel = '未中奖';
            }
          } else {
            // 大乐透（5红2蓝）模式匹配规则
            if (matchedRed === 5 && matchedBlue === 2) {
              matchLevel = '一等奖';
            } else if (matchedRed === 5 && matchedBlue === 1) {
              matchLevel = '二等奖';
            } else if (matchedRed === 5 && matchedBlue === 0) {
              matchLevel = '三等奖';
            } else if (matchedRed === 4 && matchedBlue === 2) {
              matchLevel = '三等奖';
            } else if (matchedRed === 4 && matchedBlue === 1) {
              matchLevel = '四等奖';
            } else if (matchedRed === 3 && matchedBlue === 2) {
              matchLevel = '四等奖';
            } else if (matchedRed === 4 && matchedBlue === 0) {
              matchLevel = '五等奖';
            } else if (matchedRed === 3 && matchedBlue === 1) {
              matchLevel = '五等奖';
            } else if (matchedRed === 2 && matchedBlue === 2) {
              matchLevel = '五等奖';
            } else if (matchedRed === 3 && matchedBlue === 0) {
              matchLevel = '六等奖';
            } else if (matchedRed === 1 && matchedBlue === 2) {
              matchLevel = '六等奖';
            } else if (matchedRed === 2 && matchedBlue === 1) {
              matchLevel = '六等奖';
            } else if (matchedRed === 0 && matchedBlue === 2) {
              matchLevel = '六等奖';
            } else {
              matchLevel = '未中奖';
            }
          }
          
          return {
            ...note,
            matchedRed,
            matchedBlue,
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
                // 双色球奖金标准
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
                // 大乐透奖金标准
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
    let redBalls = [];
    let blueBalls = [];
    
    // 生成红球
    const redRange = mode === 'double' ? 33 : 35;
    const redCount = mode === 'double' ? 6 : 5;
    
    while (redBalls.length < redCount) {
      const num = Math.floor(Math.random() * redRange) + 1;
      if (!redBalls.includes(num)) {
        redBalls.push(num);
      }
    }
    
    // 生成蓝球
    const blueRange = mode === 'double' ? 16 : 12;
    const blueCount = mode === 'double' ? 1 : 2;
    
    while (blueBalls.length < blueCount) {
      const num = Math.floor(Math.random() * blueRange) + 1;
      if (!blueBalls.includes(num)) {
        blueBalls.push(num);
      }
    }
    
    // 排序
    redBalls.sort((a, b) => a - b);
    blueBalls.sort((a, b) => a - b);
    
    return {
      redBalls,
      blueBalls
    };
  },

  // 分享定投结果
  shareInvestmentResult() {
    const { mode, investmentResult } = this.data;
    
    if (!investmentResult.totalPeriods) {
      wx.showToast({
        title: '请先进行定投模拟',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const modeName = mode === 'double' ? '6红1蓝' : '5红2蓝';
    
    let shareText = `【${modeName}定投模拟结果】\n`;
    shareText += `总期数：${investmentResult.totalPeriods}期\n`;
    shareText += `命中期数：${investmentResult.hitPeriods}期\n`;
    shareText += `命中率：${investmentResult.hitRate}%\n`;
    shareText += `投入成本：¥${investmentResult.totalCost.toLocaleString()}\n`;
    shareText += `总收入：¥${investmentResult.totalRevenue.toLocaleString()}\n`;
    shareText += `净利润：¥${investmentResult.netProfit.toLocaleString()}\n\n`;
    
    // 分享所有期数的结果
    shareText += `各期结果：\n`;
    for (let i = 0; i < investmentResult.hitDetails.length; i++) {
      const period = investmentResult.hitDetails[i];
      shareText += `${i + 1}、红球 ${period.drawResult.redBalls.join(' ')}，蓝球 ${period.drawResult.blueBalls.join(' ')}\n`;
    }
    
    shareText += `注：本结果仅为模拟，与真实彩票无关`;
    
    wx.setClipboardData({
      data: shareText,
      success() {
        wx.showToast({
          title: '结果已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  // 导出投注内容
  exportResult() {
    const { mode, generatedNotes, drawResult, matchResults } = this.data;
    
    if (generatedNotes.length === 0) {
      wx.showToast({
        title: '请先生成投注内容',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const modeName = mode === 'double' ? '6红1蓝' : '5红2蓝';
    
    // 生成导出内容
    let exportText = `【${modeName}模拟投注内容】\n\n`;
    exportText += `投注注数：${generatedNotes.length}注\n\n`;
    
    // 列出所有投注内容
    generatedNotes.forEach((note, index) => {
      exportText += `${index + 1}、红球 ${note.redBalls.join(' ')}，蓝球 ${note.blueBalls.join(' ')}\n`;
    });
    

    
    exportText += `\n注：本内容仅为模拟，与真实彩票无关，不构成任何投资建议`;
    
    wx.setClipboardData({
      data: exportText,
      success() {
        wx.showToast({
          title: '投注内容已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
        
        // 提示用户可以粘贴到Excel
        wx.showModal({
          title: '导出成功',
          content: '投注内容已复制到剪贴板，您可以粘贴到Excel或其他应用中保存。',
          showCancel: false
        });
      }
    });
  },

  // 导出定投内容
  exportInvestmentResult() {
    const { mode, investmentResult } = this.data;
    
    if (!investmentResult.totalPeriods) {
      wx.showToast({
        title: '请先进行定投模拟',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const modeName = mode === 'double' ? '6红1蓝' : '5红2蓝';
    
    // 生成导出内容
    let exportText = `【${modeName}定投模拟结果】\n\n`;
    exportText += `总期数：${investmentResult.totalPeriods}期\n`;
    exportText += `命中期数：${investmentResult.hitPeriods}期\n`;
    exportText += `命中率：${investmentResult.hitRate}%\n`;
    exportText += `投入成本：¥${investmentResult.totalCost.toLocaleString()}\n`;
    exportText += `总收入：¥${investmentResult.totalRevenue.toLocaleString()}\n`;
    exportText += `净利润：¥${investmentResult.netProfit.toLocaleString()}\n\n`;
    
    // 列出所有期数的结果
    exportText += `【各期结果】\n\n`;
    for (let i = 0; i < investmentResult.hitDetails.length; i++) {
      const period = investmentResult.hitDetails[i];
      exportText += `${i + 1}、红球 ${period.drawResult.redBalls.join(' ')}，蓝球 ${period.drawResult.blueBalls.join(' ')}\n`;
    }
    
    exportText += `注：本结果仅为模拟，与真实彩票无关，不构成任何投资建议`;
    
    wx.setClipboardData({
      data: exportText,
      success() {
        wx.showToast({
          title: '定投结果已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
        
        // 提示用户可以粘贴到Excel
        wx.showModal({
          title: '导出成功',
          content: '定投结果已复制到剪贴板，您可以粘贴到Excel或其他应用中保存。',
          showCancel: false
        });
      }
    });
  },

  // 复制注数到剪贴板
  copyNotesToClipboard() {
    const { mode, generatedNotes } = this.data;
    
    if (generatedNotes.length === 0) {
      wx.showToast({
        title: '暂无生成的注数',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    const modeName = mode === 'double' ? '6红1蓝' : '5红2蓝';
    
    // 生成复制内容
    let copyText = `【${modeName}生成注数】\n\n`;
    copyText += `生成注数：${generatedNotes.length}注\n\n`;
    
    // 列出所有注数
    generatedNotes.forEach((note, index) => {
      copyText += `${index + 1}、红球 ${note.redBalls.join(' ')}，蓝球 ${note.blueBalls.join(' ')}\n`;
    });
    
    copyText += `注：本内容仅为模拟，与真实彩票无关`;
    
    wx.setClipboardData({
      data: copyText,
      success() {
        wx.showToast({
          title: '注数已复制到剪贴板',
          icon: 'success',
          duration: 1500
        });
      }
    });
  },

  // 页面加载时执行
  onLoad() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '随机选号器'
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