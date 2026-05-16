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
          console.debug('存储成功');
        },
        fail: function(data, code) {
          console.debug('存储失败', code, data);
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
          console.debug('获取存储失败', code, data);
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
          console.debug('清除存储成功');
        },
        fail: function(data, code) {
          console.debug('清除存储失败', code, data);
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
          console.debug('获取设备信息失败', code, data);
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
          console.debug('获取设备信息失败', err);
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
          console.debug('分享成功');
        },
        fail: function(data, code) {
          console.debug('分享失败', code, data);
        }
      });
    } else {
      // 微信小程序分享由系统处理
      console.debug('微信分享');
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
  behaviors: [adBehavior],
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
    yearsToRetire: '',
    hasValidResult: false,
    canvaswidth: 376,
    canvasheight: 400
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '退休金计算'
    })
  },

  onCurrentAgeInput(e) {
    const value = e.detail.value
    // 只允许输入数字
    if (/^\d*$/.test(value)) {
      this.setData({
        currentAge: value
      })
      this.recalc()
    }
  },

  onRetireAgeChange(e) {
    const index = parseInt(e.detail.value)
    const ageArray = [55, 60, 65, 70]
    this.setData({
      retireAgeIndex: index,
      retireAge: ageArray[index]
    })
    this.recalc()
  },

  onCurrentSalaryInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        currentSalary: value
      })
      this.recalc()
    }
  },

  onSavingTypeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      savingTypeIndex: index
    })
    this.recalc()
  },

  onSalaryIncreaseChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      salaryIncrease: isNaN(value) ? 0 : value
    })
    this.recalc()
  },

  onMonthlySavingInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        monthlySaving: value
      })
      this.recalc()
    }
  },

  onExpectedReturnChange(e) {
    const value = parseFloat(e.detail.value);
    this.setData({
      expectedReturn: isNaN(value) ? 0 : value
    })
    this.recalc()
  },

  // 实时计算
  recalc() {
    const { currentAge, retireAge, currentSalary, salaryIncrease, monthlySaving, expectedReturn, savingTypeIndex } = this.data

    // 验证必填项
    if (!currentAge || parseInt(currentAge) <= 0) {
      this.setData({
        totalSavings: '',
        retireSavings: '',
        expectedMonthlySaving: '',
        yearsToRetire: '',
        hasValidResult: false
      })
      return
    }

    if (!monthlySaving || parseFloat(monthlySaving) <= 0) {
      this.setData({
        totalSavings: '',
        retireSavings: '',
        expectedMonthlySaving: '',
        yearsToRetire: '',
        hasValidResult: false
      })
      return
    }

    const currentAgeNum = parseInt(currentAge)
    if (currentAgeNum >= retireAge) {
      this.setData({
        totalSavings: '',
        retireSavings: '',
        expectedMonthlySaving: '',
        yearsToRetire: '',
        hasValidResult: false
      })
      return
    }

    const yearsToRetire = retireAge - currentAgeNum
    const months = yearsToRetire * 12

    // 计算每月储蓄金额
    let monthlySavingAmount
    if (savingTypeIndex === 1 && currentSalary) {
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
      yearsToRetire: yearsToRetire,
      hasValidResult: true
    })
  },

  reset() {
    this.setData({
      currentAge: '',
      retireAge: 60,
      retireAgeIndex: 1,
      currentSalary: '',
      salaryIncrease: 5,
      savingTypeIndex: 0,
      monthlySaving: '',
      expectedReturn: 6,
      totalSavings: '',
      retireSavings: '',
      expectedMonthlySaving: '',
      yearsToRetire: '',
      hasValidResult: false
    })
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
        try {
          const ctx = wx.createCanvasContext('cvs1', this);
          if (ctx) {
            this.MergeImage(ctx);
          } else {
            console.error('创建Canvas上下文失败');
            platform.showToast({
              title: '创建画布上下文失败，请重试'
            });
          }
        } catch (error) {
          console.error('调用wx.createCanvasContext失败:', error);
          platform.showToast({
            title: '创建画布失败，请重试'
          });
        }
      }
  },

  // 绘制分享图片
  MergeImage(ctx) {
    let that = this;

    console.debug('开始获取系统信息');
    
    // 直接使用默认值，不依赖系统信息
    console.debug('使用默认系统信息');
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };
    
    console.debug('系统信息:', systemInfo);
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    console.debug('画布尺寸:', { width, height });

      const padding = 30; // 页面内边距
      const qrSize = 100; // 二维码大小
      
      // 布局位置计算
      const qrX = width - qrSize - 20; // 二维码X坐标（右侧）
      const qrY = padding + 10; // 二维码Y坐标（顶部，靠近内边距）
      const titleY = padding + 30; // 标题位置
      const subtitleY = titleY + 30; // 副标题位置
      const infoY = subtitleY + 40; // 信息区域起始位置

      // 背景色- 使用更专业的金融蓝色
      ctx.setFillStyle('#f0f8ff');
      ctx.fillRect(0, 0, width, height);

      // 添加装饰性背景元素
      ctx.setFillStyle('rgba(52, 152, 219, 0.1)');
      ctx.beginPath();
      ctx.arc(width - 50, 50, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(50, height - 50, 25, 0, Math.PI * 2);
      ctx.fill();

      // 标题
      ctx.setFontSize(24);
      ctx.setFillStyle('#1a73e8');
      ctx.fillText('退休储蓄预测', padding, titleY);

      // 副标题
      ctx.setFontSize(14);
      ctx.setFillStyle('#666666');
      ctx.fillText('来算算你退休时候能存多少？', padding, subtitleY);

      // 退休信息
      const { currentAge, retireAge, currentSalary, salaryIncrease, monthlySaving, expectedReturn, totalSavings, retireSavings, expectedMonthlySaving, savingTypeIndex } = this.data;
      const savingTypeText = savingTypeIndex === 0 ? '固定金额' : '薪资比例';
      
      // 退休信息标题
      ctx.setFontSize(14);
      ctx.setFillStyle('#333333');
      ctx.fillText('你的储蓄计划', padding, infoY);
      
      // 退休信息内容
      ctx.setFontSize(14);
      ctx.setFillStyle('#666666');
      ctx.fillText('当前年龄：', padding + 10, infoY + 25);
      ctx.setFillStyle('#1a73e8');
      ctx.fillText(currentAge + ' 岁', padding + 90, infoY + 25);

      ctx.setFillStyle('#666666');
      ctx.fillText('退休年龄：', padding + 10, infoY + 50);
      ctx.setFillStyle('#1a73e8');
      ctx.fillText(retireAge + ' 岁', padding + 90, infoY + 50);

      ctx.setFillStyle('#666666');
      ctx.fillText('每月储蓄' + (savingTypeIndex === 0 ? '金额' : '比例') + '：', padding + 10, infoY + 75);
      ctx.setFillStyle('#1a73e8');
      ctx.fillText(monthlySaving + (savingTypeIndex === 0 ? ' 元' : '%'), padding + 120, infoY + 75);

      ctx.setFillStyle('#666666');
      ctx.fillText('预期年化收益率：', padding + 10, infoY + 100);
      ctx.setFillStyle('#1a73e8');
      ctx.fillText(expectedReturn + '%', padding + 130, infoY + 100);

      // 计算结果
      if (this.data.hasValidResult) {
        // 结果标题
        ctx.setFontSize(14);
        ctx.setFillStyle('#333333');
        ctx.fillText('如果按照这个计划执行', padding, infoY + 135);

        // 结果内容
        ctx.setFontSize(14);
        ctx.setFillStyle('#666666');
        ctx.fillText('然后到退休时，你每月能存：', padding + 10, infoY + 160);
        ctx.setFontSize(14);
        ctx.setFillStyle('#e53935');
        ctx.fillText('¥' + expectedMonthlySaving, padding + 200, infoY + 160);

        ctx.setFontSize(14);
        ctx.setFillStyle('#666666');
        ctx.fillText('最后总共能存下：', padding + 10, infoY + 185);
        ctx.setFontSize(14);
        ctx.setFillStyle('#e53935');
        ctx.fillText('¥' + retireSavings + ' 万元', padding + 120, infoY + 185);

        ctx.setFontSize(14);
        ctx.setFillStyle('#1a73e8');
        ctx.fillText('所以，从现在开始努力存钱吧！', padding + 10, infoY + 210);
        
        // 补充仅供参考的提醒
        ctx.setFontSize(12);
        ctx.setFillStyle('#999999');
        ctx.fillText('* 仅供参考，实际收益受市场影响', padding + 10, infoY + 240);
        ctx.fillText('* 投资有风险，理财需谨慎', padding + 10, infoY + 260);
      } else {
        ctx.setFontSize(14);
        ctx.setFillStyle('#999999');
        ctx.fillText('快输入你的信息，我来帮你算退休储蓄！', padding + 10, infoY + 135);
      }

      // 绘制二维码
      ctx.drawImage('/images/mini.png', qrX, qrY, qrSize, qrSize);

      // 绘制完成后执行保存
      ctx.draw(false, function() {
        if (isHarmonyOS) {
          // 在鸿蒙平台，我们需要通过组件引用获取Canvas
          const canvas = that.$element('cvs1');
          if (canvas) {
            // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据，指定PNG格式
            console.debug('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
            const imageData = canvas.toDataURL('image/png');
            console.debug('生成的图片数据长度', imageData ? imageData.length : 0, '前100字符:', imageData ? imageData.substring(0, 100) : 'null');
            
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
                console.debug("保存相册成功");
                platform.showToast({
                  title: '保存成功'
                });
              },
              function(data, code) {
                console.debug("保存到相册失败", { code, data, dataType: typeof data });
                platform.showToast({
                  title: '保存失败，请重试'
                });
              }
            );
          }
        } else {
          // 在微信小程序平台
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: width,
            height: height,
            quality: 1,
            canvasId: 'cvs1',
            destWidth: width * (systemInfo.pixelRatio / 2),
            destHeight: height * (systemInfo.pixelRatio / 2),
            success: (res) => {
              const drawurl = res.tempFilePath;
              platform.saveImageToAlbum(drawurl, 
                function(res) {
                  console.debug("保存相册成功" + res);
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
                    console.debug("保存到相册失败", err);
                  }
                }
              );
            },
            fail: function (error) {
              console.debug("canvasToTempFilePath" + error);
            }
          }, that);
        }
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
      console.debug("绘图出现了错误" + ex)
      platform.showToast({
        title: '请重试'
      });
    }
  }
})
const adBehavior = require('../../../../utils/ad-behavior');