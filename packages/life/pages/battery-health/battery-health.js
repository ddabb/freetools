// battery-health.js
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
    level: null, // 设备电量百分比（1-100）
    isCharging: null, // 是否正在充电
    isLowPowerModeEnabled: null, // 是否开启省电模式
    showResult: false, // 是否显示结果
    result: '', // 结果文字
    canvaswidth: 376,
    canvasheight: 500
  },

  onLoad() {
    this.getBatteryInfo();
  },

  // 获取电池信息
  getBatteryInfo() {
    wx.getBatteryInfo({
      success: (res) => {
        this.setData({
          level: res.level,
          isCharging: res.isCharging,
          isLowPowerModeEnabled: res.isLowPowerModeEnabled,
          showResult: true,
          result: `电量 ${res.level}%，${res.isCharging ? '充电中' : '未在充电'}${res.isLowPowerModeEnabled ? '，已开启省电模式' : ''}`
        });
      },
      fail: (err) => {
        console.error('获取电池信息失败', err);
        this.setData({
          result: '获取电池信息失败'
        });
      }
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
      // 在微信小程序平台，使用新的2D Canvas API
      try {
        const query = wx.createSelectorQuery().in(this);
        query.select('#cvs1')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0] || !res[0].node) {
              console.error('获取Canvas元素失败');
              platform.showToast({
                title: '获取画布失败，请重试'
              });
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getSystemInfoSync().pixelRatio;

            // 设置高清canvas尺寸
            canvas.width = this.data.canvaswidth * dpr;
            canvas.height = this.data.canvasheight * dpr;
            ctx.scale(dpr, dpr);

            this.MergeImage(ctx, canvas);
          });
      } catch (error) {
        console.error('创建Canvas上下文失败:', error);
        platform.showToast({
          title: '创建画布失败，请重试'
        });
      }
    }
  },

  // 绘制分享图片
  MergeImage(ctx, canvas) {
    let that = this;

    // 直接使用默认值，不依赖系统信息
    console.log('使用默认系统信息');
    const systemInfo = {
      pixelRatio: 2,
      screenWidth: 375,
      screenHeight: 667,
      platform: 'wechat',
      version: '7.0.0',
      SDKVersion: '2.0.0'
    };
    
    console.log('系统信息:', systemInfo);
    const width = this.data.canvaswidth;
    const height = this.data.canvasheight;
    
    console.log('画布尺寸:', { width, height });

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
      ctx.font = '26px Arial, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('电池健康', padding, titleY);

      // 副标题
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('实时监控您的设备电池状态', padding, subtitleY);

      // 电池信息
      const { level, isCharging, isLowPowerModeEnabled, result } = this.data;
      
      // 绘制电池图标
      const batteryX = padding;
      const batteryY = infoY;
      const batteryWidth = 100;
      const batteryHeight = 50;
      const batteryPadding = 10;
      
      // 电池外框
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.strokeRect(batteryX, batteryY, batteryWidth, batteryHeight);
      
      // 电池正极
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(batteryX + batteryWidth, batteryY + batteryHeight / 3, 8, batteryHeight / 3);
      
      // 电池电量
      const batteryLevel = level || 0;
      const batteryFillWidth = (batteryWidth - batteryPadding * 2) * (batteryLevel / 100);
      
      // 根据电量设置颜色
      if (batteryLevel > 60) {
        ctx.fillStyle = '#27ae60'; // 绿色
      } else if (batteryLevel > 20) {
        ctx.fillStyle = '#f39c12'; // 黄色
      } else {
        ctx.fillStyle = '#e74c3c'; // 红色
      }
      
      ctx.fillRect(batteryX + batteryPadding, batteryY + batteryPadding, batteryFillWidth, batteryHeight - batteryPadding * 2);
      
      // 电量百分比
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(batteryLevel + '%', batteryX + batteryWidth + 20, batteryY + batteryHeight / 2 + 5);

      // 充电状态
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('充电状态：', padding, infoY + 80);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#3498db';
      ctx.fillText(isCharging ? '充电中' : '未在充电', padding + 100, infoY + 80);

      // 省电模式
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('省电模式：', padding, infoY + 110);
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#3498db';
      ctx.fillText(isLowPowerModeEnabled ? '已开启' : '未开启', padding + 100, infoY + 110);

      // 电池状态建议
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('电池建议：', padding, infoY + 150);
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      
      let batteryAdvice = '';
      if (batteryLevel >= 80) {
        batteryAdvice = '电池状态良好，继续保持使用习惯';
      } else if (batteryLevel >= 50) {
        batteryAdvice = '电池状态正常，可正常使用';
      } else if (batteryLevel >= 20) {
        batteryAdvice = '电池电量偏低，建议及时充电';
      } else {
        batteryAdvice = '电池电量过低，需要立即充电';
      }
      
      // 绘制建议文本，支持换行
      const lineHeight = 20;
      const maxCharsPerLine = 18;
      let startIndex = 0;
      let currentY = infoY + 170;

      while (startIndex < batteryAdvice.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, batteryAdvice.length);
        // 尝试在词语边界处换行
        if (endIndex < batteryAdvice.length && batteryAdvice[endIndex] !== ' ') {
          const lastSpaceIndex = batteryAdvice.lastIndexOf(' ', endIndex);
          if (lastSpaceIndex > startIndex) {
            endIndex = lastSpaceIndex;
          }
        }
        const lineText = batteryAdvice.substring(startIndex, endIndex);
        ctx.fillText(lineText, padding, currentY);
        startIndex = endIndex + 1;
        currentY += lineHeight;
      }

      // 底部提示
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('扫码使用电池健康检测', padding, height - 40);

      // 绘制完成
      if (isHarmonyOS) {
        // 在鸿蒙平台，我们需要通过组件引用获取Canvas
        const canvas = this.$element('cvs1');
        if (canvas) {
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
      } else {
        // 微信小程序平台
        // 绘制二维码
        const img = canvas.createImage();
        img.src = '/images/mini.png';
        img.onload = () => {
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          console.log('二维码绘制完成:', {position: {x: qrX, y: qrY}, size: qrSize});

          // 生成临时文件路径并保存到相册
          wx.canvasToTempFilePath({
            canvas: canvas,
            x: 0,
            y: 0,
            width: width,
            height: height,
            quality: 1,
            destWidth: width * systemInfo.pixelRatio,
            destHeight: height * systemInfo.pixelRatio,
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
          });
        };
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
      title: '电池健康检测 - 实时监控您的设备电池状态',
      path: '/packages/life/pages/battery-health/battery-health'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '电池健康检测 - 实时监控您的设备电池状态',
      query: 'battery-health'
    }
  }
})