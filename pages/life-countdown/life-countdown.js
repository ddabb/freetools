// life-countdown.js
Page({
  data: {
    birthDate: '', // 出生日期
    expectedLifeYears: 80, // 预计寿命（岁）
    currentYear: new Date().getFullYear(), // 当前年份
    showResult: false, // 是否显示结果
    daysLived: 0, // 已活天数
    lifeLeft: 0, // 剩余预期寿命
    progress: 0, // 人生进度
    birthdayDays: 0, // 距离下次生日的天数
    weddingDays: 0, // 距离下次结婚纪念日的天数
    newYearDays: 0 // 距离新年的天数
  },
  
  // 设置出生日期
  setBirthDate(e) {
    this.setData({
      birthDate: e.detail.value
    });
  },
  
  // 设置预计寿命
  setExpectedLifeYears(e) {
    const value = parseInt(e.detail.value) || 80;
    if (value < 1 || value > 150) {
      wx.showToast({
        title: '预期寿命应在1-150岁之间',
        icon: 'none'
      });
      return;
    }
    this.setData({
      expectedLifeYears: value
    });
  },
  
  // 计算人生倒计时
  calculate() {
    const { birthDate, expectedLifeYears } = this.data;
    if (!birthDate) {
      wx.showToast({
        title: '请输入出生日期',
        icon: 'none'
      });
      return;
    }

    const today = new Date();
    const birth = new Date(birthDate);

    // 验证出生日期是否有效
    if (isNaN(birth.getTime())) {
      wx.showToast({
        title: '出生日期格式错误',
        icon: 'none'
      });
      return;
    }

    // 检查出生日期是否是未来日期
    if (birth > today) {
      wx.showToast({
        title: '出生日期不能是未来日期',
        icon: 'none'
      });
      return;
    }

    // 验证预期寿命范围
    if (expectedLifeYears < 1 || expectedLifeYears > 150) {
      wx.showToast({
        title: '预期寿命应在1-150岁之间',
        icon: 'none'
      });
      return;
    }

    try {
      // 计算已活天数
      const daysLived = Math.floor((today - birth) / (1000 * 60 * 60 * 24));

      // 计算预期寿命
      const expectedLife = expectedLifeYears * 365.25;
      const lifeLeft = Math.max(0, Math.floor(expectedLife - daysLived));

      // 计算人生进度
      const progress = Math.min(100, Math.round((daysLived / expectedLife) * 100));

      // 计算距离下次生日的天数
      const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      }
      const birthdayDays = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));

      // 计算距离下次结婚纪念日的天数（假设结婚日期为每年的10月1日）
      const nextWedding = new Date(today.getFullYear(), 9, 1); // 10月1日
      if (nextWedding < today) {
        nextWedding.setFullYear(nextWedding.getFullYear() + 1);
      }
      const weddingDays = Math.floor((nextWedding - today) / (1000 * 60 * 60 * 24));

      // 计算距离新年的天数
      const nextNewYear = new Date(today.getFullYear() + 1, 0, 1); // 1月1日
      const newYearDays = Math.floor((nextNewYear - today) / (1000 * 60 * 60 * 24));

      // 更新结果
      this.setData({
        showResult: true,
        daysLived,
        lifeLeft,
        progress,
        birthdayDays,
        weddingDays,
        newYearDays
      });
    } catch (error) {
      console.error('计算失败', error);
      wx.showToast({
        title: '计算失败，请重试',
        icon: 'none'
      });
    }
  }
})