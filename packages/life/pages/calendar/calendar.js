// packages/life/pages/calendar/calendar.js
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
    currentDate: '',
    selectedDate: '',
    year: 0,
    month: 0,
    day: 0,
    weekDay: '',
    lunar: '',
    holidays: [],
    showLunar: true,
    canvaswidth: 376,
    canvasheight: 500
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '万年历'
    })
    const now = new Date()
    this.initCalendar(now.getFullYear(), now.getMonth(), now.getDate())
  },

  initCalendar(year, month, day) {
    const date = new Date(year, month, day)
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

    this.setData({
      year,
      month: month + 1,
      day,
      currentDate: date.toLocaleDateString('zh-CN'),
      selectedDate: date.toLocaleDateString('zh-CN'),
      weekDay: weekDays[date.getDay()],
      lunar: this.getLunarDate(year, month + 1, day)
    })

    this.loadHolidays(year, month + 1)
  },

  getLunarDate(year, month, day) {
    // 简化的农历计算（仅作演示）
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    // 简单算法，实际需要复杂的天文计算
    const lunarMonth = (year * 12 + month) % 12
    const lunarDay = day % 30

    return `农历${lunarMonths[lunarMonth]}${lunarDays[lunarDay]}`
  },

  loadHolidays(year, month) {
    // 简化的节假日数据
    const holidays = this.getMonthHolidays(year, month)
    this.setData({ holidays })
  },

  getMonthHolidays(year, month) {
    const holidays = []

    // 固定节日
    const fixedHolidays = {
      '1-1': '元旦',
      '2-14': '情人节',
      '3-8': '妇女节',
      '3-12': '植树节',
      '4-1': '愚人节',
      '5-1': '劳动节',
      '5-4': '青年节',
      '6-1': '儿童节',
      '7-1': '建党节',
      '8-1': '建军节',
      '9-10': '教师节',
      '10-1': '国庆节',
      '12-25': '圣诞节'
    }

    for (const [date, name] of Object.entries(fixedHolidays)) {
      const [m, d] = date.split('-')
      if (parseInt(m) === month) {
        holidays.push({ day: parseInt(d), name, type: 'fixed' })
      }
    }

    // 节气（简化）
    const solarTerms = [
      { day: 6, name: '小寒', month: 1 },
      { day: 20, name: '大寒', month: 1 },
      { day: 4, name: '立春', month: 2 },
      { day: 19, name: '雨水', month: 2 },
      { day: 6, name: '惊蛰', month: 3 },
      { day: 21, name: '春分', month: 3 },
      { day: 5, name: '清明', month: 4 },
      { day: 20, name: '谷雨', month: 4 },
      { day: 6, name: '立夏', month: 5 },
      { day: 21, name: '小满', month: 5 },
      { day: 6, name: '芒种', month: 6 },
      { day: 21, name: '夏至', month: 6 },
      { day: 7, name: '小暑', month: 7 },
      { day: 23, name: '大暑', month: 7 },
      { day: 8, name: '立秋', month: 8 },
      { day: 23, name: '处暑', month: 8 },
      { day: 8, name: '白露', month: 9 },
      { day: 23, name: '秋分', month: 9 },
      { day: 8, name: '寒露', month: 10 },
      { day: 24, name: '霜降', month: 10 },
      { day: 8, name: '立冬', month: 11 },
      { day: 22, name: '小雪', month: 11 },
      { day: 7, name: '大雪', month: 12 },
      { day: 22, name: '冬至', month: 12 }
    ]

    for (const term of solarTerms) {
      if (term.month === month) {
        holidays.push({ day: term.day, name: term.name, type: 'solar' })
      }
    }

    return holidays
  },

  onDateChange(e) {
    const date = new Date(e.detail.value)
    this.initCalendar(date.getFullYear(), date.getMonth(), date.getDate())
  },

  toggleLunar() {
    this.setData({
      showLunar: !this.data.showLunar
    })
  },

  today() {
    const now = new Date()
    this.initCalendar(now.getFullYear(), now.getMonth(), now.getDate())
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: '万年历 - 查看日历和农历',
      path: '/packages/life/pages/calendar/calendar',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '万年历 - 查看日历和农历',
      imageUrl: ''
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
      ctx.fillText('万年历', padding, titleY);

      // 副标题
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('公历农历双显示，节假日一目了然', padding, subtitleY);

      // 日期信息
      const { year, month, day, weekDay, lunar, holidays } = this.data;
      
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('公历日期：', padding, infoY);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(`${year}年${month}月${day}日`, padding + 100, infoY);

      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('星期：', padding, infoY + 30);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(weekDay, padding + 100, infoY + 30);

      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('农历：', padding, infoY + 60);
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#3498db';
      ctx.fillText(lunar, padding + 100, infoY + 60);

      // 节假日信息
      if (holidays && holidays.length > 0) {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('今日节日：', padding, infoY + 90);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#e74c3c';
        const holidayNames = holidays.map(holiday => holiday.name).join('、');
        ctx.fillText(holidayNames, padding + 100, infoY + 90);
      } else {
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('今日节日：', padding, infoY + 90);
        ctx.font = '16px 微软雅黑';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('无', padding + 100, infoY + 90);
      }

      // 日历小知识
      ctx.font = '16px 微软雅黑';
      ctx.fillStyle = '#2c3e50';
      ctx.fillText('日历小知识：', padding, infoY + 130);
      ctx.font = '14px 微软雅黑';
      ctx.fillStyle = '#7f8c8d';
      
      let calendarTip = '农历是中国传统历法，结合了太阳和月亮的运行周期，包含二十四节气，对农业生产和传统节日有重要意义。';
      
      // 绘制小知识文本，支持换行
      let lineHeight = 20;
      let currentY = infoY + 150;
      let words = calendarTip.split(' ');
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
      ctx.fillText('扫码使用万年历', padding, height - 40);

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
