// packages/financial/pages/mortgage/mortgage.js
// 检测运行环境
const isHarmonyOS = typeof ohos !== 'undefined' || (typeof window !== 'undefined' && typeof window.$element !== 'undefined');
const utils = require('../../../../utils/index');

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
      if (options.icon === 'success') {
        utils.showSuccess(options.title || options.message);
      } else {
        utils.showText(options.title || options.message);
      }
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
      console.debug('微信小程序平台获取设备信息');
      wx.getDeviceInfo({
        success: (data) => {
          console.debug('获取设备信息成功:', data);
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
  data: {
    loanType: 0, // 0:商业贷款 1:公积金贷款 2:组合贷款
    loanAmount: '',
    years: 30,
    yearsIndex: 5, // 贷款年限在数组中的索引
    rate: 4.2,
    monthlyPayment: '',
    totalInterest: '',
    totalPayment: '',
    hasValidResult: false,
    canvaswidth: 376,
    canvasheight: 400
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '房贷计算'
    })
  },

  onLoanTypeChange(e) {
    this.setData({
      loanType: parseInt(e.detail.value)
    })
    this.recalc()
  },

  onLoanAmountInput(e) {
    this.setData({
      loanAmount: e.detail.value
    })
    this.recalc()
  },

  onYearsChange(e) {
    const index = parseInt(e.detail.value)
    const yearsArray = [5, 10, 15, 20, 25, 30]
    this.setData({
      yearsIndex: index,
      years: yearsArray[index]
    })
    this.recalc()
  },

  onRateChange(e) {
    this.setData({
      rate: parseFloat(e.detail.value)
    })
    this.recalc()
  },

  // 实时计算
  recalc() {
    const { loanAmount, years, rate, loanType } = this.data

    // 验证输入
    if (!loanAmount || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
      this.setData({
        monthlyPayment: '',
        totalInterest: '',
        totalPayment: '',
        hasValidResult: false
      })
      return
    }

    const amount = parseFloat(loanAmount) * 10000
    const months = years * 12
    const monthlyRate = parseFloat(rate) / 100 / 12

    // 等额本息
    const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, months) /
                          (Math.pow(1 + monthlyRate, months) - 1)
    const totalPayment = monthlyPayment * months
    const totalInterest = totalPayment - amount

    this.setData({
      monthlyPayment: monthlyPayment.toFixed(2),
      totalInterest: (totalInterest / 10000).toFixed(2),
      totalPayment: (totalPayment / 10000).toFixed(2),
      hasValidResult: true
    })
  },

  reset() {
    this.setData({
      loanAmount: '',
      years: 30,
      yearsIndex: 5,
      rate: 4.2,
      monthlyPayment: '',
      totalInterest: '',
      totalPayment: '',
      hasValidResult: false
    })
  },


  // 保存Canvas为图片
  savecodetofile() {
    if (isHarmonyOS) {
      // 在鸿蒙平台，我们需要通过组件引用获取Canvas
      const canvas = this.$element('cvs1');
      if (canvas) {
        console.debug('鸿蒙平台获取Canvas成功');
        this.MergeImage(canvas);
      } else {
        console.error('获取Canvas元素失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
      }
    } else {
      // 在微信小程序平台
      console.debug('开始获取微信小程序Canvas');
      wx.createSelectorQuery()
        .select('#cvs1')
        .fields({
          node: true,
          size: true,
        })
        .exec((res) => {
          console.debug('微信小程序获取Canvas结果:', res);
          if (res && res[0] && res[0].node) {
            console.debug('微信小程序获取Canvas成功');
            this.MergeImage(res);
          } else {
            console.error('微信小程序获取Canvas失败:', res);
            platform.showToast({
              title: '获取画布失败，请重试'
            });
          }
        });
    }
  },

  // 绘制分享图片
  MergeImage(res) {
    console.debug('开始执行MergeImage方法');
    let canvas, ctx;
    
    if (isHarmonyOS) {
      // 鸿蒙平台
      console.debug('鸿蒙平台处理');
      canvas = res;
      if (!canvas) {
        console.error('鸿蒙平台获取Canvas失败');
        platform.showToast({
          title: '获取画布失败，请重试'
        });
        return;
      }
      ctx = canvas.getContext('2d');
      console.debug('鸿蒙平台Canvas:', { width: canvas.width, height: canvas.height });
    } else {
      // 微信小程序平台
      console.debug('微信小程序平台处理');
      console.debug('res参数:', res);
      if (!res || !res[0] || !res[0].node) {
        console.error('微信小程序平台获取Canvas失败:', res);
        platform.showToast({
          title: '获取画布失败，请重试'
        });
        return;
      }
      console.debug('微信小程序平台获取Canvas节点成功');
      canvas = res[0].node;
      console.debug('Canvas节点:', canvas);
      console.debug('Canvas节点类型:', typeof canvas);
      console.debug('Canvas节点属性', Object.keys(canvas));
      
      try {
        ctx = canvas.getContext('2d');
        console.debug('获取Canvas上下文成功', ctx);
      } catch (e) {
        console.error('获取Canvas上下文失败', e);
        platform.showToast({
          title: '获取画布上下文失败，请重试'
        });
        return;
      }
      
      if (!ctx) {
        console.error('获取Canvas上下文失败，ctx为null或undefined');
        platform.showToast({
          title: '获取画布上下文失败，请重试'
        });
        return;
      }
      
      console.debug('微信小程序Canvas:', { width: canvas.width, height: canvas.height });
    }

    console.debug('Canvas元素:', canvas);
    console.debug('Context:', ctx);
    if (!ctx) {
      console.error('获取Canvas上下文失败');
      platform.showToast({
        title: '获取画布上下文失败，请重试'
      });
      return;
    }
    console.debug('获取Canvas上下文成功');
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
    const dpr = systemInfo.pixelRatio || 1;
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    console.debug('设置Canvas尺寸:', { width, height, dpr });
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

    console.debug('开始绘制背景');
    // 背景�?- 使用更专业的金融蓝色�?
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, width, height);

    // 添加装饰性背景元�?
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.beginPath();
    ctx.arc(width - 50, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(50, height - 50, 25, 0, Math.PI * 2);
    ctx.fill();

    console.debug('开始绘制标题');
    // 标题
    ctx.font = 'bold 24px 微软雅黑';
    ctx.fillStyle = '#1a73e8';
    ctx.fillText('房贷计算结果', padding, titleY);

    // 副标题
    ctx.font = '14px 微软雅黑';
    ctx.fillStyle = '#666666';
    ctx.fillText('嘿，这是你的房贷计划', padding, subtitleY);

    console.debug('开始绘制贷款信息');
    // 贷款信息
    const { loanAmount, years, rate, monthlyPayment, totalInterest, totalPayment, loanType } = this.data;
    const loanTypeText = ['商业贷款', '公积金贷款', '组合贷款'][loanType];
    
    // 贷款信息标题
    ctx.font = 'bold 14px 微软雅黑';
    ctx.fillStyle = '#333333';
    ctx.fillText('你选择的贷款信息', padding, infoY);
    
    // 贷款信息内容
    ctx.font = '14px 微软雅黑';
    ctx.fillStyle = '#666666';
    ctx.fillText('贷款类型：', padding + 10, infoY + 25);
    ctx.fillStyle = '#1a73e8';
    ctx.fillText(loanTypeText, padding + 90, infoY + 25);

    ctx.fillStyle = '#666666';
    ctx.fillText('贷款金额：', padding + 10, infoY + 50);
    ctx.fillStyle = '#1a73e8';
    ctx.fillText(loanAmount + ' 万元', padding + 90, infoY + 50);

    ctx.fillStyle = '#666666';
    ctx.fillText('贷款年限：', padding + 10, infoY + 75);
    ctx.fillStyle = '#1a73e8';
    ctx.fillText(years + ' 年', padding + 90, infoY + 75);

    ctx.fillStyle = '#666666';
    ctx.fillText('年利率：', padding + 10, infoY + 100);
    ctx.fillStyle = '#1a73e8';
    ctx.fillText(rate + '%', padding + 90, infoY + 100);

    console.debug('开始绘制计算结果');
    // 计算结果
    if (this.data.hasValidResult) {
      // 结果标题
      ctx.font = 'bold 14px 微软雅黑';
      ctx.fillStyle = '#333333';
      ctx.fillText('算好了！你的还款计划是这样的', padding, infoY + 135);

      // 结果内容
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#666666';
      ctx.fillText('每个月要还：', padding + 10, infoY + 160);
      ctx.font = 'bold 14px 微软雅黑';
      ctx.fillStyle = '#e53935';
      ctx.fillText('¥' + monthlyPayment, padding + 90, infoY + 160);

      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#666666';
      ctx.fillText('总共要付利息：', padding + 10, infoY + 185);
      ctx.font = 'bold 14px 微软雅黑';
      ctx.fillStyle = '#e53935';
      ctx.fillText('¥' + totalInterest + ' 万元', padding + 110, infoY + 185);

      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#666666';
      ctx.fillText('最后总共要还：', padding + 10, infoY + 210);
      ctx.font = 'bold 14px 微软雅黑';
      ctx.fillStyle = '#e53935';
      ctx.fillText('¥' + totalPayment + ' 万元', padding + 110, infoY + 210);
    } else {
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#999999';
      ctx.fillText('快输入你的贷款信息，我来帮你算！', padding + 10, infoY + 135);
    }

    console.debug('开始加载并绘制二维码');
    // 加载并绘制二维码
    const img = isHarmonyOS ? new Image() : canvas.createImage();
    img.onload = () => {
      console.debug('二维码加载成功');
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      console.debug('二维码绘制完成', {position: {x: qrX, y: qrY}, size: qrSize});
      
      if (isHarmonyOS) {
        // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据，指定PNG格式
        console.debug('鸿蒙平台保存图片，canvas尺寸:', { width: canvas.width, height: canvas.height });
        const imageData = canvas.toDataURL('image/png');
        console.debug('生成的图片数据长�?', imageData ? imageData.length : 0, '�?00字符:', imageData ? imageData.substring(0, 100) : 'null');
        
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
      } else {
        // 在微信小程序平台
        console.debug('微信小程序平台保存图片');
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          quality: 1,
          canvas: canvas,
          destWidth: width * (systemInfo.pixelRatio / 2),
          destHeight: height * (systemInfo.pixelRatio / 2),
          success: (res) => {
            console.debug('canvasToTempFilePath成功:', res);
            const drawurl = res.tempFilePath;
            platform.saveImageToAlbum(drawurl, 
              function(res) {
                console.debug("保存相册成功" + res);
                platform.showToast({
                  title: '保存相册成功'
                });
              },
              function(err) {
                console.debug("保存到相册失败", err);
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
                  platform.showToast({
                    title: '保存失败，请重试'
                  });
                }
              }
            );
          },
          fail: function (error) {
            console.debug("canvasToTempFilePath失败:" + error);
            platform.showToast({
              title: '生成图片失败，请重试'
            });
          }
        }, that);
      }
    };
    img.onerror = function() {
      console.error('二维码加载失败');
      platform.showToast({
        title: '二维码加载失败，请重试'
      });
    };
    img.src = '/images/mini.png';
    console.debug('二维码加载开始', {source: '/images/mini.png', target: {x: qrX, y: qrY, size: qrSize}, exists: true});
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