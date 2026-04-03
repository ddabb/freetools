Page({
  data: {
    // 游戏状态
    diceValues: [1, 2, 3, 4, 5, 6], // 初始显示各个面
    diceRotations: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 180, z: 0 },
      { x: 0, y: -90, z: 0 },
      { x: 0, y: 90, z: 0 },
      { x: -90, y: 0, z: 0 },
      { x: 90, y: 0, z: 0 }
    ],
    rollCount: 0,
    currentScore: 0,
    currentAward: null,
    history: [],
    isRolling: false,
    rollBtnText: '掷骰子',
    resultText: '等待投掷...',
    showRulesModal: false,
    showResultModal: false,
    showHistoryModal: false,
    // 骰子点数对应的emoji
    diceEmojis: {
      1: "⚀",
      2: "⚁", 
      3: "⚂",
      4: "⚃",
      5: "⚄",
      6: "⚅"
    },
    // 博饼奖项规则
    awards: [
      { 
        name: "状元", 
        condition: "四个4点 或 五个相同点数 或 六个相同点数 或 顺子",
        check: function(dice) {
          const counts = this.countDice(dice);
          const values = Object.values(counts);
          
          // 六个相同点数 (状元插金花)
          if (values.includes(6)) return { level: 1, desc: "状元插金花 (六个相同点数)" };
          
          // 五个相同点数
          if (values.includes(5)) {
            // 检查是否是五个4
            if (counts[4] === 5) return { level: 2, desc: "五王 (五个4点)" };
            return { level: 3, desc: "五子登科 (五个相同点数)" };
          }
          
          // 四个4点
          if (counts[4] === 4) {
            // 检查另外两个骰子是否是1和2
            const otherDice = dice.filter(val => val !== 4);
            if (otherDice.includes(1) && otherDice.includes(2) && otherDice.length === 2) {
              return { level: 4, desc: "状元 (四个4点带1和2)" };
            }
            return { level: 5, desc: "状元 (四个4点)" };
          }
          
          // 顺子 (1-6)
          const sorted = [...dice].sort((a, b) => a - b);
          if (sorted.join('') === '123456') return { level: 6, desc: "状元 (顺子)" };
          
          return null;
        }
      },
      { 
        name: "对堂", 
        condition: "顺子 (1-6)",
        check: function(dice) {
          const sorted = [...dice].sort((a, b) => a - b);
          if (sorted.join('') === '123456') return { level: 7, desc: "对堂 (顺子)" };
          return null;
        }
      },
      { 
        name: "三红", 
        condition: "三个4点",
        check: function(dice) {
          const counts = this.countDice(dice);
          if (counts[4] === 3) return { level: 8, desc: "三红 (三个4点)" };
          return null;
        }
      },
      { 
        name: "四进", 
        condition: "四个相同点数 (除了4点)",
        check: function(dice) {
          const counts = this.countDice(dice);
          const values = Object.values(counts);
          if (values.includes(4)) {
            // 找到是哪个点数出现了4次
            for (let num in counts) {
              if (counts[num] === 4 && Number(num) !== 4) {
                return { level: 9, desc: `四进 (四个${num}点)` };
              }
            }
          }
          return null;
        }
      },
      { 
        name: "二举", 
        condition: "两个4点",
        check: function(dice) {
          const counts = this.countDice(dice);
          if (counts[4] === 2) return { level: 10, desc: "二举 (两个4点)" };
          return null;
        }
      },
      { 
        name: "一秀", 
        condition: "一个4点",
        check: function(dice) {
          const counts = this.countDice(dice);
          if (counts[4] === 1) return { level: 11, desc: "一秀 (一个4点)" };
          return null;
        }
      },
      { 
        name: "无奖", 
        condition: "没有4点",
        check: function(dice) {
          const counts = this.countDice(dice);
          if (!counts[4] || counts[4] === 0) return { level: 12, desc: "无奖 (没有4点)" };
          return null;
        }
      }
    ]
  },

  onLoad: function() {
    this.initGame();
  },

  // 初始化游戏
  initGame: function() {
    this.evaluateResult(true);
  },

  // 统计骰子点数
  countDice: function(diceArray) {
    const counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    diceArray.forEach(value => {
      // 确保使用数字作为键
      counts[Number(value)]++;
    });
    return counts;
  },

  // 投掷骰子
  rollDice: function() {
    if (this.data.isRolling) return;

    // 禁用按钮防止重复点击
    this.setData({
      isRolling: true,
      rollBtnText: '投掷中...'
    });

    // 模拟骰子滚动
    let rolls = 0;
    const rollInterval = setInterval(() => {
      // 随机生成临时点数
      const tempValues = Array.from({length: 6}, () => Math.floor(Math.random() * 6) + 1);
      const tempRotations = tempValues.map(value => {
        switch(value) {
          case 1: return { x: 0, y: 0, z: 0 };
          case 2: return { x: 0, y: 180, z: 0 };
          case 3: return { x: 0, y: -90, z: 0 };
          case 4: return { x: 0, y: 90, z: 0 };
          case 5: return { x: -90, y: 0, z: 0 };
          case 6: return { x: 90, y: 0, z: 0 };
          default: return { x: 0, y: 0, z: 0 };
        }
      });

      this.setData({
        diceValues: tempValues,
        diceRotations: tempRotations
      });

      rolls++;
      if (rolls > 15) { // 滚动15次后停止
        clearInterval(rollInterval);

        // 生成最终点数
        const finalValues = Array.from({length: 6}, () => Math.floor(Math.random() * 6) + 1);
        const finalRotations = finalValues.map(value => {
          switch(value) {
            case 1: return { x: 0, y: 0, z: 0 };
            case 2: return { x: 0, y: 180, z: 0 };
            case 3: return { x: 0, y: -90, z: 0 };
            case 4: return { x: 0, y: 90, z: 0 };
            case 5: return { x: -90, y: 0, z: 0 };
            case 6: return { x: 90, y: 0, z: 0 };
            default: return { x: 0, y: 0, z: 0 };
          }
        });

        // 立即更新到最终结果
        this.setData({
          diceValues: finalValues,
          diceRotations: finalRotations,
          isRolling: false,
          rollBtnText: '掷骰子'
        }, () => {
          // 在setData回调中调用evaluateResult，确保数据已更新
          this.evaluateResult();
        });
      }
    }, 60);
  },

  // 评估结果
  evaluateResult: function(isInitial = false) {
    const diceValues = this.data.diceValues;
    let rollCount = this.data.rollCount;
    
    // 只有在非初始化时才增加投掷次数
    if (!isInitial) {
      rollCount++;
    }
    
    // 检查所有奖项
    let currentAward = null;
    let currentLevel = Infinity;
    
    for (let award of this.data.awards) {
      // 绑定this到Page实例
      const result = award.check.call(this, diceValues);
      if (result && result.level < currentLevel) {
        currentLevel = result.level;
        currentAward = {
          name: award.name,
          desc: result.desc,
          level: result.level
        };
      }
    }
    
    // 计算得分 (12 - 级别，级别越高得分越低)
    const score = currentAward ? 12 - currentAward.level : 0;
    
    // 更新结果显示
    let resultText = "等待投掷...";
    if (currentAward) {
      resultText = `${currentAward.name}: ${currentAward.desc}`;
    } else {
      resultText = "无奖项";
    }
    
    // 添加到历史记录（非初始化时）
    const history = this.data.history;
    if (!isInitial) {
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
      history.unshift({
        time,
        diceValues: [...diceValues],
        award: currentAward ? {name: currentAward.name, desc: currentAward.desc} : null
      });
      
      // 限制历史记录数量
      if (history.length > 10) {
        history.pop();
      }
    }
    
    // 更新数据
    this.setData({
      rollCount,
      currentScore: score,
      currentAward,
      resultText,
      history
    });
  },

  // 获取骰子emoji字符串
  getDiceEmojiString: function(diceValues) {
    return diceValues.map(val => this.data.diceEmojis[val]).join('');
  },

  // 显示游戏规则弹窗
  showRules: function() {
    this.setData({
      showRulesModal: true
    });
  },

  // 关闭游戏规则弹窗
  closeRules: function() {
    this.setData({
      showRulesModal: false
    });
  },

  // 显示结果弹窗
  showResult: function() {
    this.setData({
      showResultModal: true
    });
  },

  // 关闭结果弹窗
  closeResult: function() {
    this.setData({
      showResultModal: false
    });
  },

  // 显示历史记录弹窗
  showHistory: function() {
    this.setData({
      showHistoryModal: true
    });
  },

  // 关闭历史记录弹窗
  closeHistory: function() {
    this.setData({
      showHistoryModal: false
    });
  },

  // 清空历史记录
  clearHistory: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            history: []
          });
          wx.showToast({
            title: '历史记录已清空',
            icon: 'success'
          });
        }
      }
    });
  }
});