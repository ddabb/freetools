// packages/financial/pages/mortgage/mortgage.js
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
    loanType: 0, // 0:商业贷款 1:公积金贷款 2:组合贷款
    loanAmount: '',
    years: 30,
    yearsIndex: 5, // 贷款年限在数组中的索引
    rate: 4.2,
    monthlyPayment: '',
    totalInterest: '',
    totalPayment: '',
    showResult: false,
    canvaswidth: 376,
    canvasheight: 500
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '房贷计算器'
    })
  },

  onLoanTypeChange(e) {
    this.setData({
      loanType: parseInt(e.detail.value)
    })
  },

  onLoanAmountInput(e) {
    this.setData({
      loanAmount: e.detail.value
    })
  },

  onYearsChange(e) {
    const index = parseInt(e.detail.value)
    const yearsArray = [5, 10, 15, 20, 25, 30]
    this.setData({
      yearsIndex: index,
      years: yearsArray[index]
    })
  },

  onRateChange(e) {
    this.setData({
      rate: parseFloat(e.detail.value)
    })
  },

  calculate() {
    const { loanAmount, years, rate, loanType } = this.data

    if (!loanAmount || loanAmount <= 0) {
      wx.showToast({
        title: '请输入贷款金额',
        icon: 'none'
      })
      return
    }

    const amount = parseFloat(loanAmount) * 10000
    const months = years * 12
    const monthlyRate = rate / 100 / 12

    // 等额本息
    const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, months) /
                          (Math.pow(1 + monthlyRate, months) - 1)
    const totalPayment = monthlyPayment * months
    const totalInterest = totalPayment - amount

    this.setData({
      monthlyPayment: monthlyPayment.toFixed(2),
      totalInterest: (totalInterest / 10000).toFixed(2),
      totalPayment: (totalPayment / 10000).toFixed(2),
      showResult: true
    })
  },

  reset() {
    this.setData({
      loanAmount: '',
      years: 30,
      rate: 4.2,
      monthlyPayment: '',
      totalInterest: '',
      totalPayment: '',
      showResult: false
    })
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '房贷计算器 - 帮你算算每月还多少',
      path: '/packages/financial/pages/mortgage/mortgage'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '房贷计算器 - 帮你算算每月还多少',
      query: 'mortgage'
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
      ctx = canvas.getContext('2d');
    } else {
      // 微信小程序平台
      canvas = res[0].node;
      ctx = canvas.getContext('2d');
    }

    console.log('Canvas元素:', canvas);
    let that = this;

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

      // 背景色
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, width, height);

      // 标题
      ctx.font = 'bold 26px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('房贷计算器', padding, titleY);

      // 副标题
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('专业房贷计算，让您的购房计划更清晰', padding, subtitleY);

      // 贷款信息
      const { loanAmount, years, rate, monthlyPayment, totalInterest, totalPayment, loanType } = this.data;
      const loanTypeText = ['商业贷款', '公积金贷款', '组合贷款'][loanType];
      
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('贷款类型：', padding, infoY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(loanTypeText, padding + 100, infoY);

      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('贷款金额：', padding, infoY + 30);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(loanAmount + ' 万元', padding + 100, infoY + 30);

      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('贷款年限：', padding, infoY + 60);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(years + ' 年', padding + 100, infoY + 60);

      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('年利率：', padding, infoY + 90);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(rate + '%', padding + 100, infoY + 90);

      // 计算结果
      if (this.data.showResult) {
        ctx.font = 'bold 18px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('计算结果：', padding, infoY + 130);

        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('月供：', padding, infoY + 160);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('¥' + monthlyPayment, padding + 100, infoY + 160);

        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('总利息：', padding, infoY + 190);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('¥' + totalInterest + ' 万元', padding + 100, infoY + 190);

        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('还款总额：', padding, infoY + 220);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('¥' + totalPayment + ' 万元', padding + 100, infoY + 220);
      } else {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('请输入贷款信息并计算', padding, infoY + 130);
      }

      // 底部提示
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('扫码使用房贷计算器', padding, height - 40);

      // 加载并绘制二维码
      const img = isHarmonyOS ? new Image() : canvas.createImage();
      img.onload = () => {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});
        
        if (isHarmonyOS) {
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