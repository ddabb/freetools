// packages/other/pages/health-calculator/health-calculator.js
Page({
  data: {
    gender: 0, // 0:男 1:女
    height: '',
    weight: '',
    age: '',
    bmi: '',
    bmiStatus: '',
    idealWeight: '',
    dailyCalories: '',
    showResult: false
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '健康计算器'
    })
  },

  onGenderChange(e) {
    this.setData({
      gender: parseInt(e.detail.value)
    })
  },

  onHeightInput(e) {
    this.setData({
      height: e.detail.value
    })
  },

  onWeightInput(e) {
    this.setData({
      weight: e.detail.value
    })
  },

  onAgeInput(e) {
    this.setData({
      age: e.detail.value
    })
  },

  calculate() {
    const { height, weight, age, gender } = this.data

    if (!height || !weight || !age) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    const heightInMeters = parseFloat(height) / 100
    const weightInKg = parseFloat(weight)
    const ageInYears = parseInt(age)

    // 计算BMI
    const bmi = weightInKg / (heightInMeters * heightInMeters)

    // 判断BMI状态
    let bmiStatus = ''
    if (bmi < 18.5) {
      bmiStatus = '体重过轻'
    } else if (bmi < 24) {
      bmiStatus = '体重正常'
    } else if (bmi < 28) {
      bmiStatus = '超重'
    } else {
      bmiStatus = '肥胖'
    }

    // 计算理想体重（BMI=22）
    const idealWeight = (22 * heightInMeters * heightInMeters).toFixed(1)

    // 计算每日所需热量
    const bmr = gender === 0
      ? 88.362 + (13.397 * weightInKg) + (4.799 * parseFloat(height)) - (5.677 * ageInYears)
      : 447.593 + (9.247 * weightInKg) + (3.098 * parseFloat(height)) - (4.330 * ageInYears)

    const dailyCalories = Math.round(bmr * 1.55) // 假设中等活动量

    this.setData({
      bmi: bmi.toFixed(1),
      bmiStatus,
      idealWeight,
      dailyCalories,
      showResult: true
    })
  },

  reset() {
    this.setData({
      gender: 0,
      height: '',
      weight: '',
      age: '',
      bmi: '',
      bmiStatus: '',
      idealWeight: '',
      dailyCalories: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '健康计算器 - 了解你的身体状况',
      path: '/packages/other/pages/health-calculator/health-calculator',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '健康计算器 - 了解你的身体状况',
      imageUrl: ''
    }
  }
})