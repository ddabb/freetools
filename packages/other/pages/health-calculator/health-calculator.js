// health-calculator.js
// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');

// 根据平台导入相应的模块
let prompt, storage, device, image, share;
if (isHarmonyOS) {
  prompt = require('@system.prompt');
  storage = require('@system.storage');
  device = require('@system.device');
  image = require('@system.image');
  share = require('@system.share');
}

// 平台兼容API封装
const platform = {
  // 弹窗提示
  showToast: function(options) {
    if (isHarmonyOS) {
      prompt.showToast({
        message: options.title || options.message,
        duration: options.duration || 2000
      });
    } else {
      wx.showToast({
        title: options.title || options.message,
        icon: options.icon || 'none',
        duration: options.duration || 2000
      });
    }
  },
  
  // 存储相关
  setStorage: function(key, value) {
    if (isHarmonyOS) {
      storage.set({
        key: key,
        value: JSON.stringify(value),
        success: function() {
          console.log('存储成功');
        },
        fail: function(data, code) {
          console.log('存储失败', code, data);
        }
      });
    } else {
      wx.setStorageSync(key, value);
    }
  },
  
  getStorage: function(key, callback) {
    if (isHarmonyOS) {
      storage.get({
        key: key,
        success: (data) => {
          try {
            callback(JSON.parse(data));
          } catch (error) {
            callback(null);
          }
        },
        fail: (data, code) => {
          console.log('获取存储失败', code, data);
          callback(null);
        }
      });
    } else {
      const data = wx.getStorageSync(key);
      callback(data);
    }
  },
  
  removeStorage: function(key) {
    if (isHarmonyOS) {
      storage.delete({ 
        key: key,
        success: function() {
          console.log('清除存储成功');
        },
        fail: function(data, code) {
          console.log('清除存储失败', code, data);
        }
      });
    } else {
      wx.removeStorageSync(key);
    }
  },
  
  // 系统信息
  getSystemInfo: function(callback) {
    if (isHarmonyOS) {
      device.getInfo({
        success: (data) => {
          callback({
            pixelRatio: data.pixelRatio || 1,
            screenWidth: data.screenWidth || 375,
            screenHeight: data.screenHeight || 667
          });
        },
        fail: (data, code) => {
          console.log('获取设备信息失败', code, data);
          callback({ pixelRatio: 1, screenWidth: 375, screenHeight: 667 });
        }
      });
    } else {
      wx.getDeviceInfo({
        success: (data) => {
          callback({
            pixelRatio: data.pixelRatio || 1,
            screenWidth: data.screenWidth || 375,
            screenHeight: data.screenHeight || 667,
            platform: data.platform || '',
            version: data.version || '',
            SDKVersion: data.SDKVersion || ''
          });
        },
        fail: (err) => {
          console.log('获取设备信息失败', err);
          callback({ pixelRatio: 1, screenWidth: 375, screenHeight: 667, platform: '', version: '', SDKVersion: '' });
        }
      });
    }
  },
  
  // 分享
  share: function(options) {
    if (isHarmonyOS) {
      share.share({
        title: options.title,
        content: options.content || options.title,
        imageUrl: options.imageUrl || '',
        success: function() {
          console.log('分享成功');
        },
        fail: function(data, code) {
          console.log('分享失败', code, data);
        }
      });
    } else {
      // 微信小程序分享由系统处理
      console.log('微信分享');
    }
  },
  
  // 保存图片到相册
  saveImageToAlbum: function(imageData, success, fail) {
    if (isHarmonyOS) {
      image.saveToPhotosAlbum({
        uri: imageData,
        success: success,
        fail: fail
      });
    } else {
      wx.saveImageToPhotosAlbum({
        filePath: imageData,
        success: success,
        fail: fail
      });
    }
  }
};

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
    suggestion: '', // 健康建议
    canvaswidth: 376,
    canvasheight: 500
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
  },

  // 保存Canvas为图片
  savecodetofile() {
    if (isHarmonyOS) {
      // 在鸿蒙平台，我们需要通过组件引用获取Canvas
      const canvas = this.$element('cvs1');
      if (canvas) {
        this.MergeImage(canvas);
      } else {
        console.error('获取Canvas元素失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
      }
    } else {
      // 在微信小程序平台，使用wx.createCanvasContext
      console.log('使用wx.createCanvasContext获取画布');
      const ctx = wx.createCanvasContext('cvs1', this);
      if (ctx) {
        this.MergeImage(ctx);
      } else {
        console.error('创建Canvas上下文失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
      }
    }
  },

  // 绘制分享图片
  MergeImage(ctx) {
    let canvas;
    
    if (isHarmonyOS) {
      // 鸿蒙平台
      canvas = ctx;
      ctx = canvas.getContext('2d');
    }

    console.log('Canvas上下文:', ctx);
    let that = this;

    // 直接使用默认值，不依赖系统信息
    console.log('使用默认系统信息');
    const width = this.data.canvaswidth;
    const canvasHeight = this.data.canvasheight;
    
    console.log('Canvas尺寸:', { width, canvasHeight });

    // 清空画布
    if (isHarmonyOS) {
      ctx.clearRect(0, 0, width, canvasHeight);
    }

    const padding = 30; // 页面内边距
    const qrSize = 100; // 二维码大小
    
    // 布局位置计算
    const qrX = width - qrSize - 20; // 二维码X坐标（右侧）
    const qrY = padding + 10; // 二维码Y坐标（顶部，靠近内边距）
    const titleY = padding + 30; // 标题位置
    const subtitleY = titleY + 30; // 副标题位置
    const infoY = subtitleY + 40; // 信息区域起始位置

    // 背景色
    if (isHarmonyOS) {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, width, canvasHeight);
    } else {
      ctx.setFillStyle('#f8f9fa');
      ctx.fillRect(0, 0, width, canvasHeight);
    }

    // 标题
    if (isHarmonyOS) {
      ctx.font = 'bold 26px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('健康计算器', padding, titleY);
    } else {
      ctx.setFontSize(26);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('健康计算器', padding, titleY);
    }

    // 副标题
    if (isHarmonyOS) {
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('了解您的健康状况，科学管理体重', padding, subtitleY);
    } else {
      ctx.setFontSize(16);
      ctx.setFillStyle('#7f8c8d');
      ctx.fillText('了解您的健康状况，科学管理体重', padding, subtitleY);
    }

    // 个人信息
    const { height, weight, age, genderIndex, bmi, bmiStatus, idealWeight, suggestion } = this.data;
    const genderText = genderIndex === 0 ? '男' : (genderIndex === 1 ? '女' : '未选择');
    
    // 身高
    if (isHarmonyOS) {
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('身高：', padding, infoY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(height + ' cm', padding + 100, infoY);
    } else {
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('身高：', padding, infoY);
      ctx.setFillStyle('#3498db');
      ctx.fillText(height + ' cm', padding + 100, infoY);
    }

    // 体重
    if (isHarmonyOS) {
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('体重：', padding, infoY + 30);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(weight + ' kg', padding + 100, infoY + 30);
    } else {
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('体重：', padding, infoY + 30);
      ctx.setFillStyle('#3498db');
      ctx.fillText(weight + ' kg', padding + 100, infoY + 30);
    }

    // 年龄
    if (isHarmonyOS) {
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('年龄：', padding, infoY + 60);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(age + ' 岁', padding + 100, infoY + 60);
    } else {
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('年龄：', padding, infoY + 60);
      ctx.setFillStyle('#3498db');
      ctx.fillText(age + ' 岁', padding + 100, infoY + 60);
    }

    // 性别
    if (isHarmonyOS) {
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('性别：', padding, infoY + 90);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(genderText, padding + 100, infoY + 90);
    } else {
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('性别：', padding, infoY + 90);
      ctx.setFillStyle('#3498db');
      ctx.fillText(genderText, padding + 100, infoY + 90);
    }

    // 健康结果
    if (this.data.showResult) {
      // 健康结果标题
      if (isHarmonyOS) {
        ctx.font = 'bold 18px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('健康结果：', padding, infoY + 130);
      } else {
        ctx.setFontSize(18);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('健康结果：', padding, infoY + 130);
      }

      // BMI指数
      if (isHarmonyOS) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('BMI指数：', padding, infoY + 160);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(bmi, padding + 100, infoY + 160);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('BMI指数：', padding, infoY + 160);
        ctx.setFillStyle('#e74c3c');
        ctx.fillText(bmi, padding + 100, infoY + 160);
      }

      // 体重状态
      if (isHarmonyOS) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('体重状态：', padding, infoY + 190);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(bmiStatus, padding + 100, infoY + 190);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('体重状态：', padding, infoY + 190);
        ctx.setFillStyle('#e74c3c');
        ctx.fillText(bmiStatus, padding + 100, infoY + 190);
      }

      // 理想体重
      if (isHarmonyOS) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('理想体重：', padding, infoY + 220);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(idealWeight + ' kg', padding + 100, infoY + 220);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('理想体重：', padding, infoY + 220);
        ctx.setFillStyle('#e74c3c');
        ctx.fillText(idealWeight + ' kg', padding + 100, infoY + 220);
      }

      // 健康建议
      if (isHarmonyOS) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('健康建议：', padding, infoY + 260);
        ctx.font = '14px 微软雅黑';
        ctx.fillStyle = '#7f8c8d';
        
        // 绘制建议文本，支持换行
        let suggestionText = suggestion;
        let lineHeight = 20;
        let currentY = infoY + 280;
        let words = suggestionText.split(' ');
        let line = '';
        
        for (let i = 0; i < words.length; i++) {
          let testLine = line + words[i] + ' ';
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          
          if (testWidth > width - padding * 2) {
            ctx.fillText(line, padding, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, padding, currentY);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('健康建议：', padding, infoY + 260);
        ctx.setFontSize(14);
        ctx.setFillStyle('#7f8c8d');
        
        // 绘制建议文本，简单处理（微信Canvas Context不支持measureText）
        let suggestionText = suggestion;
        let lineHeight = 20;
        let currentY = infoY + 280;
        
        // 简单的换行处理
        const maxLineLength = 20;
        let lines = [];
        let currentLine = '';
        
        for (let i = 0; i < suggestionText.length; i++) {
          currentLine += suggestionText[i];
          if (currentLine.length >= maxLineLength || suggestionText[i] === ' ') {
            lines.push(currentLine);
            currentLine = '';
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        
        lines.forEach((line, index) => {
          ctx.fillText(line, padding, currentY + index * lineHeight);
        });
      }
    } else {
      if (isHarmonyOS) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('请填写完整信息并计算', padding, infoY + 130);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#7f8c8d');
        ctx.fillText('请填写完整信息并计算', padding, infoY + 130);
      }
    }

    // 底部提示
    if (isHarmonyOS) {
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('扫码使用健康计算器', padding, canvasHeight - 40);
    } else {
      ctx.setFontSize(14);
      ctx.setFillStyle('#7f8c8d');
      ctx.fillText('扫码使用健康计算器', padding, canvasHeight - 40);
    }

    // 绘制完成
    if (!isHarmonyOS) {
      ctx.draw(false, () => {
        console.log('Canvas绘制完成');
        
        // 生成临时文件路径并保存到相册
        wx.canvasToTempFilePath({
          canvasId: 'cvs1',
          success: (res) => {
            const drawurl = res.tempFilePath;
            platform.saveImageToAlbum(drawurl, 
              function(res) {
                console.log("保存相册成功" + res);
                platform.showToast({
                  title: '保存相册成功'
                });
              },
              function(err) {
                if (err.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || 
                    err.errMsg === "saveImageToPhotosAlbum:fail auth deny" || 
                    err.errMsg === "saveImageToPhotosAlbum:fail authorize no response") {
                  wx.showModal({
                    title: '提示',
                    content: '需要您授权保存相册',
                    showCancel: false,
                    success: modalSuccess => {
                      wx.openSetting({
                        success(settingdata) {
                          console.log("settingdata", settingdata);
                          if (settingdata.authSetting['scope.writePhotosAlbum']) {
                            wx.showModal({
                              title: '提示',
                              content: '获取权限成功,再次点击图片即可保存',
                              showCancel: false,
                            });
                          } else {
                            wx.showModal({
                              title: '提示',
                              content: '获取权限失败，将无法保存到相册哦~',
                              showCancel: false,
                            });
                          }
                        },
                        fail(failData) {
                          console.log("failData", failData);
                        },
                        complete(finishData) {
                          console.log("finishData", finishData);
                        }
                      });
                    }
                  });
                } else {
                  console.log("保存到相册失败" + res);
                }
              }
            );
          },
          fail: function (error) {
            console.log("canvasToTempFilePath" + error);
          }
        }, that);
      });
    } else {
      // 鸿蒙平台处理
      // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据
      const imageData = canvas.toDataURL();
      
      // 保存图片到相册
      platform.saveImageToAlbum(imageData, 
        function() {
          console.log("保存相册成功");
          platform.showToast({
            title: '保存相册成功'
          });
        },
        function(data, code) {
          console.log("保存到相册失败", code, data);
          platform.showToast({
            title: '保存失败，请重试'
          });
        }
      );
    }
  },

  // 生成分享海报
  MakePosters: async function () {
    try {
      let that = this;
      platform.showToast({
        title: '生成中，请稍候'
      });
      setTimeout(function () {
        that.savecodetofile()
      }, 1000);
    } catch (ex) {
      console.log("绘图出现了错误" + ex)
      platform.showToast({
        title: '请重试'
      });
    }
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '健康计算器 - 了解您的身体状况',
      path: '/packages/other/pages/health-calculator/health-calculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '健康计算器 - 了解您的身体状况',
      query: 'health-calculator'
    }
  }
})