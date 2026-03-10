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
      ctx.fillText('电池健康', padding, titleY);

      // 副标题
      ctx.font = '16px 微软雅黑';
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
      ctx.font = 'bold 16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(batteryLevel + '%', batteryX + batteryWidth + 20, batteryY + batteryHeight / 2 + 5);

      // 充电状态
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('充电状态：', padding, infoY + 80);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(isCharging ? '充电中' : '未在充电', padding + 100, infoY + 80);

      // 省电模式
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('省电模式：', padding, infoY + 110);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(isLowPowerModeEnabled ? '已开启' : '未开启', padding + 100, infoY + 110);

      // 电池状态建议
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('电池建议：', padding, infoY + 150);
      ctx.font = '14px 微软雅黑';
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
      let lineHeight = 20;
      let currentY = infoY + 170;
      let words = batteryAdvice.split(' ');
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

      // 底部提示
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('扫码使用电池健康检测', padding, height - 40);

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