const app = getApp();

Page({
  data: {
    // 功德计数
    meritCount: 0,       // 累计功德
    todayMerit: 0,       // 今日功德
    isStriking: false,   // 是否正在敲击
    showRipple: false,   // 显示涟漪

    // 当前文案
    currentText: '',
    textIndex: 0,

    // 成就
    achievements: [],
    newAchievement: null,

    // 模态框
    showAchievements: false,
    achievementList: [],

    // 设置
    showSettings: false,
    soundEnabled: true,
  },

  // 佛系文案库
  phrases: [
    '功德+1',
    '阿弥陀佛',
    '一切随缘',
    '心平气和',
    '莫急莫急',
    '施主莫急',
    '缘起缘灭',
    '静心静心',
    '南无阿弥陀佛',
    '心若止水',
    '诸行无常',
    '放下执念',
    '禅意生活',
    '万法皆空',
    '清心寡欲',
    '缘来缘去',
    '顺其自然',
    '心如明镜',
    '本来无一物',
    '何处惹尘埃',
  ],

  // 成就列表
  achievementDefs: [
    { id: 'first', name: '初入佛门', desc: '完成第一次敲击', icon: '🌱', count: 1 },
    { id: 'ten', name: '小有所成', desc: '累计敲击10次', icon: '🌿', count: 10 },
    { id: 'hundred', name: '略有小成', desc: '累计敲击100次', icon: '🌳', count: 100 },
    { id: 'thousand', name: '功德无量', desc: '累计敲击1000次', icon: '🏔️', count: 1000 },
    { id: 'tenk', name: '立地成佛', desc: '累计敲击10000次', icon: '🙏', count: 10000 },
    { id: 'hundredk', name: '佛光普照', desc: '累计敲击100000次', icon: '✨', count: 100000 },
  ],

  // 音频上下文
  audioCtx: null,

  onLoad() {
    this.loadData();
    this.showRandomPhrase();
    this.checkTodayMerit();
  },

  onReady() {
    // 预加载音频
    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.src = 'https://mmbiz.qpic.cn/mmbiz_png/jOTWgOic56ibQniaibZCG9icVibibicw5ibM7ic7O6rS8Wwib7h7icYbT1s9iaTicq8D9wiaQibwY7f4qibPZdicf5mnia4zGvib8hO8OQQ/0?wx_fmt=png'; // 占位，真实音效需要上传
    this.audioCtx.autoplay = false;
  },

  onUnload() {
    if (this.audioCtx) {
      this.audioCtx.destroy();
    }
  },

  // 加载数据
  loadData() {
    const fishData = wx.getStorageSync('fishData') || {};
    const today = this.formatDate(new Date());

    this.setData({
      meritCount: fishData.meritCount || 0,
      todayMerit: fishData.lastDate === today ? (fishData.todayMerit || 0) : 0,
      achievements: fishData.achievements || [],
      soundEnabled: fishData.soundEnabled !== false,
      earnedAchievements: []
    });

    this.updateAchievements();
  },

  // 保存数据
  saveData(updates) {
    const fishData = wx.getStorageSync('fishData') || {};
    const today = this.formatDate(new Date());

    // 更新今日统计
    if (updates.meritCount !== undefined) {
      const prevMerit = fishData.meritCount || 0;
      const newMerit = updates.meritCount;

      updates.todayMerit = (fishData.lastDate === today ? (fishData.todayMerit || 0) : 0) + (newMerit - prevMerit);
      updates.lastDate = today;
    }

    wx.setStorageSync('fishData', { ...fishData, ...updates });
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 检查今日状态
  checkTodayMerit() {
    const fishData = wx.getStorageSync('fishData') || {};
    const today = this.formatDate(new Date());

    if (fishData.lastDate !== today) {
      this.setData({ todayMerit: 0 });
    }
  },

  // 显示随机文案
  showRandomPhrase() {
    const index = Math.floor(Math.random() * this.phrases.length);
    this.setData({
      currentText: this.phrases[index],
      textIndex: index
    });
  },

  // 敲击木鱼
  strikeWoodfish() {
    if (this.data.isStriking) return;

    const newCount = this.data.meritCount + 1;

    this.setData({
      isStriking: true,
      showRipple: true,
      meritCount: newCount,
      todayMerit: this.data.todayMerit + 1
    });

    // 保存数据
    this.saveData({ meritCount: newCount });

    // 检查成就
    this.checkAchievements(newCount);

    // 随机新文案
    setTimeout(() => {
      this.showRandomPhrase();
    }, 300);

    // 播放音效
    if (this.data.soundEnabled) {
      this.playSound();
    }

    // 结束动画
    setTimeout(() => {
      this.setData({ isStriking: false, showRipple: false });
    }, 400);
  },

  // 播放音效（模拟音效，使用系统提示音）
  playSound() {
    // 微信小程序无法直接播放自定义音频，使用vibrate替代
    wx.vibrateShort({ type: 'light' });
  },

  // 检查成就
  checkAchievements(count) {
    const earned = [];
    const newOne = [];

    this.achievementDefs.forEach(a => {
      if (count >= a.count) {
        if (!this.data.achievements.includes(a.id)) {
          newOne.push(a);
        }
        earned.push(a.id);
      }
    });

    if (newOne.length > 0) {
      this.setData({ newAchievement: newOne[newOne.length - 1] });
      setTimeout(() => this.setData({ newAchievement: null }), 4000);
    }

    this.setData({ achievements: earned });
    this.saveData({ achievements: earned });
    this.updateAchievements();
  },

  // 更新已获得的成就详情
  updateAchievements() {
    const earned = this.data.achievements || [];
    const list = this.achievementDefs.map(a => ({
      ...a,
      earned: earned.includes(a.id)
    }));
    this.setData({ achievementList: list, earnedAchievements: list.filter(a => a.earned) });
  },

  // 显示成就弹窗
  showAchievements() {
    this.setData({ showAchievements: true });
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

  // 切换音效
  toggleSound() {
    const newVal = !this.data.soundEnabled;
    this.setData({ soundEnabled: newVal });
    this.saveData({ soundEnabled: newVal });
  },

  // 重置数据
  resetData() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有功德数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('fishData');
          this.setData({
            meritCount: 0,
            todayMerit: 0,
            achievements: [],
            earnedAchievements: [],
            showSettings: false
          });
          wx.showToast({ title: '已重置', icon: 'none' });
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `我已积累 ${this.data.meritCount} 功德，快来一起敲木鱼！`,
      path: '/packages/life/pages/electronic-woodfish/electronic-woodfish'
    };
  },

  onShareTimeline() {
    return {
      title: `🎵 我已积累 ${this.data.meritCount} 功德，敲敲木鱼，心平气和`
    };
  }
});
