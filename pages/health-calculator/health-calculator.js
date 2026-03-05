// health-calculator.js
Page({
  data: {
    height: 170, // 身高（cm）
    weight: 60, // 体重（kg）
    gender: 'male', // 性别：male-男, female-女
    showResult: false, // 是否显示结果
    bmi: 0, // BMI指数
    bmiStatus: '', // BMI状态
    idealWeight: 0, // 理想体重
    suggestion: '' // 健康建议
  },
  
  // 设置身高
  setHeight(e) {
    this.setData({
      height: parseFloat(e.detail.value) || 0
    });
  },
  
  // 设置体重
  setWeight(e) {
    this.setData({
      weight: parseFloat(e.detail.value) || 0
    });
  },
  
  // 设置性别
  setGender(e) {
    this.setData({
      gender: e.currentTarget.dataset.gender
    });
  },
  
  // 计算健康数据
  calculate() {
    const { height, weight, gender } = this.data;
    if (!height || !weight) {
      wx.showToast({
        title: '请输入身高和体重',
        icon: 'none'
      });
      return;
    }
    
    // 计算BMI指数
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // 确定BMI状态
    let bmiStatus;
    if (bmi < 18.5) {
      bmiStatus = '偏瘦';
    } else if (bmi < 24) {
      bmiStatus = '正常范围';
    } else if (bmi < 28) {
      bmiStatus = '超重';
    } else {
      bmiStatus = '肥胖';
    }
    
    // 计算理想体重
    let idealWeight;
    if (gender === 'male') {
      idealWeight = (height - 100) * 0.9;
    } else {
      idealWeight = (height - 105) * 0.92;
    }
    
    // 生成健康建议
    let suggestion;
    if (bmi < 18.5) {
      suggestion = '建议适当增加营养，保持均衡饮食';
    } else if (bmi < 24) {
      suggestion = '保持当前体重，继续健康生活方式';
    } else if (bmi < 28) {
      suggestion = '建议适当控制饮食，增加运动量';
    } else {
      suggestion = '建议寻求专业医疗建议，制定减重计划';
    }
    
    // 更新结果
    this.setData({
      showResult: true,
      bmi: bmi.toFixed(2),
      bmiStatus,
      idealWeight: idealWeight.toFixed(1),
      suggestion
    });
  }
})