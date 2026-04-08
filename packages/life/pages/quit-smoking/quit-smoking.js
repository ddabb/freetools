const utils = require('../../../../utils/index');

Page({
  data: {
    // 戒烟设置
    quitDate: '',           // 戒烟开始日期（格式：YYYY-MM-DD）
    quitDays: 0,            // 戒烟天数
    isQuitSet: false,       // 是否已设置戒烟日期
    showDatePicker: false,   // 显示日期选择

    // 呼吸练习状态
    isBreathing: false,      // 是否正在呼吸练习
    breathPhase: 'idle',     // idle | inhale | hold | exhale
    breathProgress: 0,      // 呼吸进度 0-100
    breathCount: 0,         // 今日练习次数
    breathCircles: 0,       // 当前完成的呼吸周期
    maxCircles: 3,          // 每次练习的周期数

    // 烟雾动画
    smokeParticles: [],
    smokeIntensity: 0,

    // 统计数据（计算得出）
    savedMoney: 0,          // 节省金额
    avoidedTar: 0,          // 避免焦油量(g)
    avoidedNicotine: 0,     // 避免尼古丁量(g)
    lifeRestored: 0,        // 延长寿命（小时）
    cigarsAvoided: 0,       // 避免烟支数

    // 成就
    achievements: [],
    newAchievement: null,    // 新解锁的成就

    // 今日打卡
    todayChecked: false,
    lastCheckDate: '',

    // 语录
    currentQuote: '',
    quoteIndex: 0,

    // 设置模式
    showSettings: false,
    pricePerPack: 25,       // 每包烟价格
    cigsPerDay: 20,         // 每天吸烟量
    packCigs: 20,           // 每包支数
  },

  // 励志语录库
  quotes: [
    '每一次坚持，都是对自己健康的投资',
    '你已经比昨天更接近自由呼吸的目标',
    '烟瘾只是暂时的，戒烟的成就却是永恒的',
    '你的肺部正在感谢你的每一个选择',
    '今天忍住不抽，明天更轻松',
    '每戒掉一根烟，你就离自由更近一步',
    '坚持就是胜利，你已经做得很好了',
    '相信自己，你比想象中更强大',
    '每一次渴望都是成长的机会',
    '健康的身体是最好的礼物',
    '你已经省下了买烟的钱，可以买更健康的东西',
    '呼吸新鲜空气的快乐，是烟盒装不下的',
    '今天不抽，就是赢了今天的烟瘾',
    '你的家人会为你的坚持感到骄傲',
    '每一口清新的空气，都在滋养你的身体',
  ],

  onLoad() {
    this.loadQuitData();
    this.initSmokeParticles();
    this.showRandomQuote();
    this.checkTodayStatus();
  },

  // 加载戒烟数据
  loadQuitData() {
    const quitData = wx.getStorageSync('quitData') || {};
    const today = this.formatDate(new Date());

    this.setData({
      quitDate: quitData.quitDate || '',
      isQuitSet: !!quitData.quitDate,
      pricePerPack: quitData.pricePerPack || 25,
      cigsPerDay: quitData.cigsPerDay || 20,
      packCigs: quitData.packCigs || 20,
      lastCheckDate: quitData.lastCheckDate || '',
      todayChecked: quitData.lastCheckDate === today,
      achievements: quitData.achievements || [],
      earnedAchievements: []
    });

    if (quitData.quitDate) {
      this.calculateStats();
    }
  },

  // 保存戒烟数据
  saveQuitData(updates) {
    const quitData = wx.getStorageSync('quitData') || {};
    wx.setStorageSync('quitData', { ...quitData, ...updates });
  },

  // 计算统计数据
  calculateStats() {
    const { quitDate, pricePerPack, cigsPerDay, packCigs } = this.data;
    if (!quitDate) return;

    const days = this.getDaysDiff(quitDate);
    const cigsAvoided = days * cigsPerDay;
    const moneySaved = (cigsAvoided / packCigs * pricePerPack).toFixed(1);
    const tarAvoided = (cigsAvoided * 0.008).toFixed(2);      // 约8mg焦油/支
    const nicotineAvoided = (cigsAvoided * 0.001).toFixed(2); // 约1mg尼古丁/支
    const lifeRestored = (days * 0.5).toFixed(1);             // 约30分钟/天

    this.setData({
      quitDays: days,
      cigarsAvoided: cigsAvoided,
      savedMoney: moneySaved,
      avoidedTar: tarAvoided,
      avoidedNicotine: nicotineAvoided,
      lifeRestored: lifeRestored
    });

    this.checkAchievements(days);
  },

  // 计算日期差
  getDaysDiff(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today - start) / (1000 * 60 * 60 * 24));
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 显示日期选择器
  showDatePicker() {
    const today = this.formatDate(new Date());
    this.setData({ showDatePicker: true, pickerDate: today });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ pickerDate: e.detail.value });
  },

  // 确认戒烟日期
  confirmQuitDate() {
    const date = this.data.pickerDate;
    if (!date) return;

    this.saveQuitData({ quitDate: date });
    this.setData({ quitDate: date, isQuitSet: true, showDatePicker: false });
    this.calculateStats();
    utils.showSuccess('戒烟目标已设置！加油！💪');
  },

  // 关闭日期选择
  closeDatePicker() {
    this.setData({ showDatePicker: false });
  },

  // 初始化烟雾粒子
  initSmokeParticles() {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      particles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 100,
        size: 20 + Math.random() * 30,
        opacity: 0,
        duration: 2000 + Math.random() * 1000,
        delay: Math.random() * 500,
        drift: (Math.random() - 0.5) * 20
      });
    }
    this.setData({ smokeParticles: particles });
  },

  // 开始呼吸练习
  startBreathing() {
    if (this.data.isBreathing) return;
    this.setData({
      isBreathing: true,
      breathPhase: 'inhale',
      breathProgress: 0,
      breathCircles: 0,
      smokeIntensity: 0
    });
    this.runBreathCycle();
  },

  // 运行呼吸周期（4-7-8呼吸法）
  runBreathCycle() {
    const { breathCircles, maxCircles } = this.data;
    if (breathCircles >= maxCircles) {
      this.finishBreathing();
      return;
    }

    // 吸气 4 秒
    this.animatePhase('inhale', 4000, () => {
      // 屏息 7 秒
      this.animatePhase('hold', 7000, () => {
        // 呼气 8 秒
        this.animatePhase('exhale', 8000, () => {
          this.setData({ breathCircles: this.data.breathCircles + 1 });
          this.runBreathCycle();
        });
      });
    });
  },

  // 执行单个呼吸阶段
  animatePhase(phase, duration, callback) {
    this.setData({ breathPhase: phase, breathProgress: 0 });

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.setData({ breathProgress: Math.round(progress * 100) });

      if (elapsed < duration) {
        setTimeout(tick, 16); // 约60fps
      } else {
        callback && callback();
      }
    };
    tick();
  },

  // 结束呼吸练习
  finishBreathing() {
    const { breathCircles } = this.data;
    this.setData({
      isBreathing: false,
      breathPhase: 'idle',
      breathProgress: 100,
      breathCount: this.data.breathCount + breathCircles
    });

    // 今日打卡
    const today = this.formatDate(new Date());
    if (this.data.lastCheckDate !== today) {
      this.saveQuitData({ lastCheckDate: today });
      this.setData({ todayChecked: true, lastCheckDate: today });
      utils.showSuccess(`完成${breathCircles}组呼吸练习！🎉`);
    }
  },

  // 停止呼吸练习
  stopBreathing() {
    this.setData({
      isBreathing: false,
      breathPhase: 'idle',
      breathProgress: 0
    });
  },

  // 显示随机语录
  showRandomQuote() {
    const index = Math.floor(Math.random() * this.quotes.length);
    this.setData({ currentQuote: this.quotes[index], quoteIndex: index });
  },

  // 切换语录
  nextQuote() {
    const next = (this.data.quoteIndex + 1) % this.quotes.length;
    this.setData({ currentQuote: this.quotes[next], quoteIndex: next });
  },

  // 检查今日状态
  checkTodayStatus() {
    const today = this.formatDate(new Date());
    const { lastCheckDate } = this.data;
    this.setData({ todayChecked: lastCheckDate === today });
  },

  // 检查成就
  checkAchievements(days) {
    const achievementList = [
      { id: 'day1', name: '第一天', desc: '开启戒烟之旅', icon: '🌱', days: 1 },
      { id: 'day3', name: '三天', desc: '最难熬的阶段已过', icon: '🌿', days: 3 },
      { id: 'day7', name: '一周', desc: '尼古丁依赖开始消退', icon: '🌳', days: 7 },
      { id: 'day14', name: '两周', desc: '身心状态明显改善', icon: '🌲', days: 14 },
      { id: 'day30', name: '一个月', desc: '肺功能开始恢复', icon: '🏔️', days: 30 },
      { id: 'day90', name: '三个月', desc: '血液循环大幅改善', icon: '🌍', days: 90 },
      { id: 'day180', name: '半年', desc: '心脏病风险减半', icon: '❤️', days: 180 },
      { id: 'day365', name: '一年', desc: '彻底告别香烟', icon: '🏆', days: 365 },
    ];

    const earned = [];
    const newOne = [];

    achievementList.forEach(a => {
      if (days >= a.days) {
        if (!this.data.achievements.includes(a.id)) {
          newOne.push(a);
        }
        earned.push(a);
      }
    });

    if (newOne.length > 0) {
      this.setData({ newAchievement: newOne[0] });
      setTimeout(() => this.setData({ newAchievement: null }), 4000);
    }

    this.setData({
      achievements: earned.map(a => a.id),
      earnedAchievements: earned
    });
    this.saveQuitData({ achievements: earned.map(a => a.id) });
  },

  // 获取成就列表
  getAchievementList() {
    const allAchievements = [
      { id: 'day1', name: '第一天', desc: '开启戒烟之旅', icon: '🌱', days: 1 },
      { id: 'day3', name: '三天', desc: '最难熬的阶段已过', icon: '🌿', days: 3 },
      { id: 'day7', name: '一周', desc: '尼古丁依赖开始消退', icon: '🌳', days: 7 },
      { id: 'day14', name: '两周', desc: '身心状态明显改善', icon: '🌲', days: 14 },
      { id: 'day30', name: '一个月', desc: '肺功能开始恢复', icon: '🏔️', days: 30 },
      { id: 'day90', name: '三个月', desc: '血液循环大幅改善', icon: '🌍', days: 90 },
      { id: 'day180', name: '半年', desc: '心脏病风险减半', icon: '❤️', days: 180 },
      { id: 'day365', name: '一年', desc: '彻底告别香烟', icon: '🏆', days: 365 },
    ];
    return allAchievements;
  },

  // 显示成就弹窗
  showAchievements() {
    const list = this.getAchievementList();
    const earned = this.data.achievements;
    const formatted = list.map(a => ({
      ...a,
      earned: earned.includes(a.id)
    }));
    this.setData({ showAchievements: true, achievementList: formatted });
  },

  // 关闭成就弹窗
  closeAchievements() {
    this.setData({ showAchievements: false });
  },

  // 显示设置
  showSettings() {
    this.setData({ showSettings: true });
  },

  // 关闭设置
  closeSettings() {
    this.setData({ showSettings: false });
  },

  // 更新设置
  updatePrice(e) {
    const price = parseInt(e.detail.value) || 25;
    this.setData({ pricePerPack: price });
    this.saveQuitData({ pricePerPack: price });
  },

  updateCigsPerDay(e) {
    const cigs = parseInt(e.detail.value) || 20;
    this.setData({ cigsPerDay: cigs });
    this.saveQuitData({ cigsPerDay: cigs });
    if (this.data.isQuitSet) this.calculateStats();
  },

  // 重置戒烟目标
  resetQuit() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置戒烟目标吗？所有统计数据将被清空。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('quitData');
          this.setData({
            quitDate: '', isQuitSet: false, quitDays: 0,
            savedMoney: 0, avoidedTar: 0, avoidedNicotine: 0,
            lifeRestored: 0, cigarsAvoided: 0,
            achievements: [], todayChecked: false, lastCheckDate: '',
            showSettings: false
          });
          utils.showText('已重置，请重新设置戒烟目标');
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `我已戒烟${this.data.quitDays}天，${this.data.savedMoney}元！`,
      path: '/packages/life/pages/quit-smoking/quit-smoking'
    };
  },

  onShareTimeline() {
    return {
      title: `🚭 我已戒烟${this.data.quitDays}天，节省${this.data.savedMoney}元！`
    };
  }
});
