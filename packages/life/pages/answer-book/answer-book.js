// packages/life/pages/answer-book/answer-book.js

// 答案库 - 按类型分类
const ANSWERS = {
  positive: {
    icon: '💪',
    label: '肯定',
    color: '#22c55e',
    items: [
      '是的，毫无疑问', '当然，去做吧', '时机正好，行动起来', '你会成功的',
      '相信你的直觉', '这是一个好主意', '结果会如你所愿', '大胆去做',
      '命运站在你这边', '不要犹豫，勇往直前', '一切都会顺利的',
      '这是正确的选择', '你的努力会有回报', '坚持下去，胜利在望',
      '未来充满希望', '相信自己，你可以的', '这是个绝佳的机会',
      '放手一搏吧', '好运正在路上', '你的梦想即将实现'
    ]
  },
  negative: {
    icon: '🤔',
    label: '否定',
    color: '#ef4444',
    items: [
      '现在还不是时候', '再等等看', '可能不是最佳选择', '需要更多准备',
      '暂时先不要', ' reconsider your approach', '情况不太明朗',
      '建议再考虑一下', '还有更好的选择', '时机尚未成熟',
      '先放一放', '需要更多思考', '现在行动可能太早',
      '还有变数', '不要操之过急', '再观察一段时间',
      '条件还不够成熟', '需要更多耐心', '现在不是好时机'
    ]
  },
  neutral: {
    icon: '💭',
    label: '中立',
    color: '#6b7280',
    items: [
      '顺其自然', '保持现状', '时间会给出答案', '跟随你的心',
      '没有绝对的对错', '取决于你的选择', '结果掌握在你手中',
      '一切皆有可能', '保持开放的心态', '答案就在你心中',
      '需要更多信息', '问问身边的人', '倾听内心的声音',
      '没有标准答案', '视情况而定', '走一步看一步',
      '保持平衡', '灵活应对', '相信过程'
    ]
  },
  mystical: {
    icon: '🌟',
    label: '神秘',
    color: '#f59e0b',
    items: [
      '宇宙正在倾听', '命运之轮在转动', '冥冥中自有安排', '星辰指引着你',
      '答案即将揭晓', '相信宇宙的安排', '你的能量正在聚集',
      '神秘力量在帮助你', '直觉会带你找到答案', '相信奇迹',
      '灵性在觉醒', '你的愿望正在被听见', '保持正念',
      '宇宙的能量与你同在', '相信未知的力量', '你的灵魂知道答案',
      '命运的齿轮已经开始转动', '保持信念', '奇迹即将发生'
    ]
  }
};

// 关键词匹配规则
const KEYWORD_RULES = [
  // 肯定类关键词
  { pattern: /^(能|可以|会|应该|要).*(吗|么|嘛)\?*$/, type: 'positive', weight: 2 },
  { pattern: /^(我|他|她|它).*(成功|赢|胜利|达成|实现)/, type: 'positive', weight: 2 },
  { pattern: /^(做|去|尝试|开始).*(好吗|可以吗|行吗)/, type: 'positive', weight: 2 },
  { pattern: /喜欢|爱|想|愿意|希望|期待/, type: 'positive', weight: 1 },
  { pattern: /表白|追求|争取|努力|奋斗/, type: 'positive', weight: 1 },
  
  // 否定类关键词
  { pattern: /^(不能|不可以|不会|不该|不要).*(吗|么|嘛)\?*$/, type: 'negative', weight: 2 },
  { pattern: /放弃|停止|结束|退出|离开|分手|离婚/, type: 'negative', weight: 2 },
  { pattern: /失败|输|错|问题|麻烦|困难|阻碍/, type: 'negative', weight: 1 },
  { pattern: /后悔|遗憾|错过|失去|痛苦|伤心/, type: 'negative', weight: 1 },
  
  // 神秘类关键词
  { pattern: /命运|缘分|天意|注定|前世|来生|灵魂/, type: 'mystical', weight: 3 },
  { pattern: /梦|直觉|感应|预兆|暗示|征兆/, type: 'mystical', weight: 2 },
  { pattern: /宇宙|能量|灵性|冥想|塔罗|星座/, type: 'mystical', weight: 2 },
  
  // 中立类（默认）
  { pattern: /.* /, type: 'neutral', weight: 0 }
];

Page({
  data: {
    question: '',
    answer: '',
    answerType: 'neutral',
    isShaking: false,
    hasResult: false,
    showResult: false,
    historyList: [],
    showHistory: false,
    shakeEnabled: true,
    lastShakeTime: 0,
    animationClass: ''
  },

  onLoad() {
    this.loadHistory();
    this.startShakeListener();
  },

  onUnload() {
    this.stopShakeListener();
  },

  onHide() {
    this.stopShakeListener();
  },

  onShow() {
    this.startShakeListener();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('answerBookHistory') || [];
    this.setData({ historyList: history.slice(0, 50) });
  },

  // 保存历史记录
  saveHistory() {
    wx.setStorageSync('answerBookHistory', this.data.historyList);
  },

  // 启动摇一摇监听
  startShakeListener() {
    if (!this.data.shakeEnabled) return;
    
    wx.startAccelerometer({ interval: 'normal' });
    wx.onAccelerometerChange(this.onAccelerometerChange.bind(this));
  },

  // 停止摇一摇监听
  stopShakeListener() {
    wx.stopAccelerometer();
    wx.offAccelerometerChange(this.onAccelerometerChange);
  },

  // 加速度变化处理
  onAccelerometerChange(res) {
    const now = Date.now();
    // 防抖：1.5秒内只触发一次
    if (now - this.data.lastShakeTime < 1500) return;
    
    // 检测摇动阈值
    const threshold = 1.5;
    const acceleration = Math.sqrt(res.x * res.x + res.y * res.y + res.z * res.z);
    
    if (acceleration > threshold) {
      this.setData({ lastShakeTime: now });
      this.shakeAndAsk();
    }
  },

  // 输入问题
  onQuestionInput(e) {
    this.setData({ question: e.detail.value });
  },

  // 摇一摇并获取答案
  shakeAndAsk() {
    if (this.data.isShaking) return;

    // 震动反馈
    wx.vibrateShort({ type: 'heavy' });

    this.setData({ 
      isShaking: true,
      showResult: false,
      hasResult: false,
      animationClass: 'shake-animation'
    });

    // 播放音效（如果支持）
    this.playShakeSound();

    // 延迟显示结果
    setTimeout(() => {
      const result = this.generateAnswer();
      
      this.setData({
        answer: result.answer,
        answerType: result.type,
        isShaking: false,
        hasResult: true,
        animationClass: 'glow-animation'
      });

      // 延迟显示答案卡片
      setTimeout(() => {
        this.setData({ showResult: true });
        this.addToHistory(result);
        
        // 成功震动
        wx.vibrateShort({ type: 'light' });
      }, 300);
    }, 1200);
  },

  // 播放摇动音效（模拟）
  playShakeSound() {
    // 微信小程序音频播放需要用户交互触发
    // 这里可以预留接口，如果需要可以添加
  },

  // 生成答案
  generateAnswer() {
    const question = this.data.question.trim();
    let type = this.getAnswerType(question);
    
    // 如果问题为空或无法判断，随机选择
    if (!type || type === 'neutral') {
      const types = Object.keys(ANSWERS);
      const weights = [0.35, 0.25, 0.25, 0.15]; // positive, negative, neutral, mystical
      type = this.weightedRandom(types, weights);
    }

    const answerList = ANSWERS[type].items;
    const answer = answerList[Math.floor(Math.random() * answerList.length)];

    return { type, answer };
  },

  // 根据问题判断答案类型
  getAnswerType(question) {
    if (!question) return 'neutral';

    const scores = { positive: 0, negative: 0, mystical: 0, neutral: 0 };
    
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(question)) {
        scores[rule.type] += rule.weight;
      }
    }

    // 找出得分最高的类型
    let maxScore = 0;
    let resultType = 'neutral';
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        resultType = type;
      }
    }

    return resultType;
  },

  // 加权随机选择
  weightedRandom(items, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  },

  // 添加到历史记录
  addToHistory(result) {
    const historyItem = {
      id: Date.now(),
      question: this.data.question || '（未输入问题）',
      answer: result.answer,
      answerType: result.type,
      time: new Date().toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    const history = [historyItem, ...this.data.historyList].slice(0, 50);
    this.setData({ historyList: history });
    this.saveHistory();
  },

  // 复制答案
  copyAnswer() {
    const text = `问题：${this.data.question || '（未输入）'}\n答案：${this.data.answer}`;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 切换历史记录显示
  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '删除所有历史记录？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.setData({ historyList: [], showHistory: false });
          this.saveHistory();
        }
      }
    });
  },

  // 从历史记录重新提问
  askAgain(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.historyList[index];
    
    this.setData({
      question: item.question,
      showHistory: false
    }, () => {
      this.shakeAndAsk();
    });
  },

  // 分享答案
  shareAnswer() {
    const typeInfo = ANSWERS[this.data.answerType];
    const text = `🔮 答案之书\n\n问题：${this.data.question || '（未输入）'}\n\n${typeInfo.icon} ${this.data.answer}\n\n类型：${typeInfo.label}`;
    
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  // 切换摇一摇开关
  toggleShake() {
    const enabled = !this.data.shakeEnabled;
    this.setData({ shakeEnabled: enabled });
    
    if (enabled) {
      this.startShakeListener();
      wx.showToast({ title: '摇一摇已开启', icon: 'none' });
    } else {
      this.stopShakeListener();
      wx.showToast({ title: '摇一摇已关闭', icon: 'none' });
    }
  },

  // 防止冒泡
  preventBubble() {
    // 空函数，用于阻止事件冒泡
  },

  // 分享给好友
  onShareAppMessage() {
    const typeInfo = ANSWERS[this.data.answerType];
    return {
      title: `🔮 答案之书：${this.data.answer}`,
      path: '/packages/life/pages/answer-book/answer-book'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const typeInfo = ANSWERS[this.data.answerType];
    return {
      title: `🔮 答案之书：${this.data.answer}`
    };
  }
});
