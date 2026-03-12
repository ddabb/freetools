// packages/financial/pages/retirementCalculator/retirementCalculator.js
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
      const info = wx.getSystemInfoSync();
      callback(info);
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
    currentAge: '',
    retireAge: 60,
    retireAgeIndex: 1, // 退休年龄在数组中的索引
    currentSalary: '',
    salaryIncrease: 5,
    savingTypeIndex: 0, // 0: 固定金额, 1: 薪资比例
    monthlySaving: '',
    expectedReturn: 6,
    totalSavings: '',
    retireSavings: '',
    expectedMonthlySaving: '',
    showResult: false,
    canvaswidth: 376,
    canvasheight: 400
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '退休金计算器'
    })
  },

  onCurrentAgeInput(e) {
    const value = e.detail.value
    // 只允许输入数字
    if (/^\d*$/.test(value)) {
      this.setData({
        currentAge: value
      })
    }
  },

  onRetireAgeChange(e) {
    const index = parseInt(e.detail.value)
    const ageArray = [55, 60, 65, 70]
    this.setData({
      retireAgeIndex: index,
      retireAge: ageArray[index]
    })
  },

  onCurrentSalaryInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        currentSalary: value
      })
    }
  },

  onSavingTypeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      savingTypeIndex: index
    })
  },

  onSalaryIncreaseChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      salaryIncrease: isNaN(value) ? 0 : value
    })
  },

  onMonthlySavingInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        monthlySaving: value
      })
    }
  },

  onExpectedReturnChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      expectedReturn: isNaN(value) ? 0 : value
    })
  },

  calculate() {
    const { currentAge, retireAge, currentSalary, salaryIncrease, monthlySaving, expectedReturn } = this.data

    if (!currentAge || currentAge <= 0) {
      wx.showToast({
        title: '请输入当前年龄',
        icon: 'none'
      })
      return
    }

    if (!monthlySaving || monthlySaving <= 0) {
      wx.showToast({
        title: '请输入每月储蓄',
        icon: 'none'
      })
      return
    }

    const currentAgeNum = parseInt(currentAge)
    if (currentAgeNum >= retireAge) {
      wx.showToast({
        title: '当前年龄必须小于退休年龄',
        icon: 'none'
      })
      return
    }

    const yearsToRetire = retireAge - currentAgeNum
    const months = yearsToRetire * 12

    // 计算每月储蓄金额
    let monthlySavingAmount
    if (this.data.savingTypeIndex === 1 && currentSalary) {
      // 如果选择了薪资比例且输入了当前薪资
      monthlySavingAmount = parseFloat(currentSalary) * (parseFloat(monthlySaving) / 100)
    } else {
      // 否则视为固定金额
      monthlySavingAmount = parseFloat(monthlySaving)
    }

    // 计算退休时预计的月储蓄
    const expectedMonthlySaving = monthlySavingAmount * Math.pow(1 + salaryIncrease / 100, yearsToRetire)

    // 计算退休储蓄总额（考虑复利）
    const monthlyRate = expectedReturn / 100 / 12
    let totalSavings
    if (Math.abs(monthlyRate) < 1e-10) {
      // 利率为零时，简单累加
      totalSavings = expectedMonthlySaving * months
    } else {
      totalSavings = (expectedMonthlySaving * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate
    }

    this.setData({
      totalSavings: totalSavings.toFixed(2),
      retireSavings: (totalSavings / 10000).toFixed(2),
      expectedMonthlySaving: expectedMonthlySaving.toFixed(2),
      showResult: true
    })
  },

  reset() {
    this.setData({
      currentAge: '',
      retireAge: 60,
      currentSalary: '',
      salaryIncrease: 5,
      savingTypeIndex: 0,
      monthlySaving: '',
      expectedReturn: 6,
      totalSavings: '',
      retireSavings: '',
      expectedMonthlySaving: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '退休金计算器 - 算算你的退休储蓄',
      path: '/packages/financial/pages/retirementCalculator/retirementCalculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '退休金计算器 - 算算你的退休储蓄',
      query: 'retirementCalculator'
    }
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
      // 在微信小程序平台
      wx.createSelectorQuery()
        .select('#cvs1')
        .fields({
          node: true,
          size: true,
        })
        .exec(this.MergeImage.bind(this));
    }
  },

  // 绘制分享图片
  MergeImage(res) {
    let canvas, ctx;
    
    if (isHarmonyOS) {
      // 鸿蒙平台
      canvas = res;
      if (!canvas) {
        console.error('鸿蒙平台获取Canvas失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
        return;
      }
      ctx = canvas.getContext('2d');
      console.log('鸿蒙平台Canvas:', { width: canvas.width, height: canvas.height });
    } else {
      // 微信小程序平台
      if (!res || !res[0] || !res[0].node) {
        console.error('微信小程序平台获取Canvas失败:', res);
        platform.showToast({
          title: '获取画布失败，请重试'
        });
        return;
      }
      canvas = res[0].node;
      ctx = canvas.getContext('2d');
      console.log('微信小程序Canvas:', { width: canvas.width, height: canvas.height });
    }

    console.log('Canvas元素:', canvas);
    let that = this;

    // 确保Canvas尺寸正确
    if (isHarmonyOS) {
      const dpr = 2; // 鸿蒙平台使用固定DPI
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      console.log('鸿蒙Canvas尺寸调整:', { width, height, dpr, actualWidth: canvas.width, actualHeight: canvas.height });
    } else {
      // 微信小程序平台 - 使用系统信息获取DPI
      const systemInfo = wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio || 2;
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      console.log('微信Canvas尺寸调整:', { width, height, dpr, actualWidth: canvas.width, actualHeight: canvas.height, systemInfo });
    }

    // 获取系统信息
    platform.getSystemInfo((systemInfo) => {
      const dpr = systemInfo.pixelRatio || 1;
      const width = this.data.canvaswidth;
      const height = this.data.canvasheight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr); // 适配分辨率

      const padding = 30; // 页面内边距
      const qrSize = 100; // 二维码大小
      
      // 布局位置计算
      const qrX = width - qrSize - 20; // 二维码X坐标（右侧）
      const qrY = padding + 10; // 二维码Y坐标（顶部，靠近内边距）
      const titleY = padding + 30; // 标题位置
      const subtitleY = titleY + 30; // 副标题位置
      const infoY = subtitleY + 40; // 信息区域起始位置

      // 背景色 - 使用更专业的金融蓝色调
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, width, height);

      // 添加装饰性背景元素
      ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      ctx.beginPath();
      ctx.arc(width - 50, 50, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(50, height - 50, 25, 0, Math.PI * 2);
      ctx.fill();

      // 标题
      ctx.font = 'bold 24px 微软雅黑';
      ctx.fillStyle = '#1a73e8';
      ctx.fillText('退休储蓄预测', padding, titleY);

      // 副标题
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#666666';
      ctx.fillText('来算算你退休时候能存在多少钱', padding, subtitleY);

      // 退休信息
      const { currentAge, retireAge, currentSalary, salaryIncrease, monthlySaving, expectedReturn, totalSavings, retireSavings, expectedMonthlySaving, savingTypeIndex } = this.data;
      const savingTypeText = savingTypeIndex === 0 ? '固定金额' : '薪资比例';
      
      // 退休信息标题
      ctx.font = 'bold 14px 微软雅黑';
      ctx.fillStyle = '#333333';
      ctx.fillText('你的储蓄计划', padding, infoY);
      
      // 退休信息内容
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#666666';
      ctx.fillText('当前年龄：', padding + 10, infoY + 25);
      ctx.fillStyle = '#1a73e8';
      ctx.fillText(currentAge + ' 岁', padding + 90, infoY + 25);

      ctx.fillStyle = '#666666';
      ctx.fillText('退休年龄：', padding + 10, infoY + 50);
      ctx.fillStyle = '#1a73e8';
      ctx.fillText(retireAge + ' 岁', padding + 90, infoY + 50);

      ctx.fillStyle = '#666666';
      ctx.fillText('每月储蓄' + (savingTypeIndex === 0 ? '金额' : '比例') + '：', padding + 10, infoY + 75);
      ctx.fillStyle = '#1a73e8';
      ctx.fillText(monthlySaving + (savingTypeIndex === 0 ? ' 元' : '%'), padding + 120, infoY + 75);

      ctx.fillStyle = '#666666';
      ctx.fillText('预期年化收益率：', padding + 10, infoY + 100);
      ctx.fillStyle = '#1a73e8';
      ctx.fillText(expectedReturn + '%', padding + 130, infoY + 100);

      // 计算结果
      if (this.data.showResult) {
        // 结果标题
        ctx.font = 'bold 14px 微软雅黑';
        ctx.fillStyle = '#333333';
        ctx.fillText('如果按照这个计划执行', padding, infoY + 135);

        // 结果内容
        ctx.font = '14px 微软雅黑';
        ctx.fillStyle = '#666666';
        ctx.fillText('然后到退休时，你每月能存：', padding + 10, infoY + 160);
        ctx.font = 'bold 14px 微软雅黑';
        ctx.fillStyle = '#e53935';
        ctx.fillText('¥' + expectedMonthlySaving, padding + 200, infoY + 160);

        ctx.font = '14px 微软雅黑';
        ctx.fillStyle = '#666666';
        ctx.fillText('最后总共能存下：', padding + 10, infoY + 185);
        ctx.font = 'bold 14px 微软雅黑';
        ctx.fillStyle = '#e53935';
        ctx.fillText('¥' + retireSavings + ' 万元', padding + 120, infoY + 185);

        ctx.font = 'bold 14px 微软雅黑';
        ctx.fillStyle = '#1a73e8';
        ctx.fillText('所以，从现在开始努力存钱吧！', padding + 10, infoY + 210);
        
        // 补充仅供参考的提醒
        ctx.font = '12px 微软雅黑';
        ctx.fillStyle = '#999999';
        ctx.fillText('* 仅供参考，实际收益受市场影响', padding + 10, infoY + 240);
        ctx.fillText('* 投资有风险，理财需谨慎', padding + 10, infoY + 260);
      } else {
        ctx.font = '14px 微软雅黑';
        ctx.fillStyle = '#999999';
        ctx.fillText('快输入你的信息，我来帮你算退休储蓄！', padding + 10, infoY + 135);
      }

      // 加载并绘制二维码
      const img = isHarmonyOS ? new Image() : canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});
        
        if (isHarmonyOS) {
          // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据，指定PNG格式
          console.log('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
          const imageData = canvas.toDataURL('image/png');
          console.log('生成的图片数据长度:', imageData ? imageData.length : 0, '前100字符:', imageData ? imageData.substring(0, 100) : 'null');
          
          if (!imageData || !imageData.startsWith('data:image/png')) {
            console.error('生成的图片数据格式不正确:', imageData ? imageData.substring(0, 50) : 'null');
            platform.showToast({
              title: '生成图片数据失败'
            });
            return;
          }
          
          // 保存图片到相册
          platform.saveImageToAlbum(imageData, 
            function() {
              console.log("保存相册成功");
              platform.showToast({
                title: '保存成功'
              });
            },
            function(data, code) {
              console.log("保存到相册失败", { code, data, dataType: typeof data });
              platform.showToast({
                title: '保存失败，请重试'
              });
            }
          );
        } else {
          // 在微信小程序平台
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            quality: 1,
            canvas: canvas,
            destWidth: width * (systemInfo.pixelRatio / 2),
            destHeight: height * (systemInfo.pixelRatio / 2),
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
                      showCancel: true,
                      success: modalSuccess => {
                        if (modalSuccess.confirm) {
                          wx.openSetting();
                        }
                      }
                    });
                  } else {
                    console.log("保存到相册失败", err);
                  }
                }
              );
            },
            fail: function (error) {
              console.log("canvasToTempFilePath" + error);
            }
          }, that);
        }
      };
      img.src = '/images/mini.png';
      console.log('二维码加载开始:', {source: '/images/mini.png', target: {x: qrX, y: qrY, size: qrSize}, exists: true});
    });
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
  }
})