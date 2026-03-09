// health-calculator.js
Page({
  data: {
    height: '', // 身高（cm）
    weight: '', // 体重（kg）
    age: '', // 年龄
    genders: ['男', '女'], // 性别选项
    genderIndex: -1, // 性别选择索引：-1-未选择, 0-男, 1-女
    gender: '', // 性别：male-男, female-女
    ageGroup: '', // 年龄段：child, adult, elderly
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
    const index = parseInt(e.detail.value);
    this.setData({
      genderIndex: index,
      gender: index === 0 ? 'male' : (index === 1 ? 'female' : '')
    });
  },

  // 设置年龄
  setAge(e) {
    const age = parseInt(e.detail.value) || 0;
    let ageGroup = '';
    
    if (age > 0 && age < 18) {
      ageGroup = 'child';
    } else if (age >= 18 && age < 65) {
      ageGroup = 'adult';
    } else if (age >= 65) {
      ageGroup = 'elderly';
    }
    
    this.setData({
      age: age,
      ageGroup: ageGroup
    });
  },

  // 计算健康数据
  calculate() {
    const { height, weight, genderIndex, age, ageGroup } = this.data;
    if (!height || !weight || genderIndex === -1 || !age) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    
    // 儿童青少年使用专用提示
    if (ageGroup === 'child') {
      wx.showModal({
        title: '温馨提示',
        content: '儿童和青少年的生长发育有特殊标准，建议使用专业的儿童生长曲线评估工具，或咨询儿科医生。',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 计算BMI指数
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // 根据年龄段确定BMI状态
    let bmiStatus, minIdealBmi, maxIdealBmi;
    
    if (ageGroup === 'elderly') {
      // 老年人标准 (WHO建议)
      if (bmi < 20) {
        bmiStatus = '体重过轻';
      } else if (bmi < 27) {
        bmiStatus = '健康范围';
      } else {
        bmiStatus = '体重过重';
      }
      // 老年人理想BMI范围：20-26.9
      minIdealBmi = 20;
      maxIdealBmi = 26.9;
    } else {
      // 成年人标准 (中国卫健委)
      if (bmi < 18.5) {
        bmiStatus = '偏瘦';
      } else if (bmi < 24) {
        bmiStatus = '正常范围';
      } else if (bmi < 28) {
        bmiStatus = '超重';
      } else {
        bmiStatus = '肥胖';
      }
      // 成年人理想BMI范围：18.5-23.9
      minIdealBmi = 18.5;
      maxIdealBmi = 23.9;
    }
    
    // 计算理想体重范围（基于理想BMI）
    const minIdealWeight = (minIdealBmi * heightInMeters * heightInMeters).toFixed(1);
    const maxIdealWeight = (maxIdealBmi * heightInMeters * heightInMeters).toFixed(1);
    const avgIdealWeight = ((parseFloat(minIdealWeight) + parseFloat(maxIdealWeight)) / 2).toFixed(1);
    
    // 生成健康建议（考虑年龄段）
    let suggestion;
    if (ageGroup === 'elderly') {
      if (bmi < 20) {
        suggestion = '建议适当增加营养摄入，预防肌肉流失，建议咨询医生或营养师';
      } else if (bmi < 27) {
        suggestion = '体重在健康范围内，保持均衡饮食和适量运动';
      } else {
        suggestion = '建议适度控制体重，注意肌肉量维持，避免快速减重';
      }
    } else {
      // 成年人建议
      if (bmi < 18.5) {
        suggestion = '建议适当增加营养，保持均衡饮食';
      } else if (bmi < 24) {
        suggestion = '保持当前体重，继续健康生活方式';
      } else if (bmi < 28) {
        suggestion = '建议适当控制饮食，增加运动量';
      } else {
        suggestion = '建议寻求专业医疗建议，制定减重计划';
      }
    }
    
    // 更新结果
    this.setData({
      showResult: true,
      bmi: bmi.toFixed(2),
      bmiStatus,
      idealWeight: `${minIdealWeight}-${maxIdealWeight}`,
      idealWeightAvg: avgIdealWeight,
      suggestion,
      ageGroup: ageGroup
    });
  }
})