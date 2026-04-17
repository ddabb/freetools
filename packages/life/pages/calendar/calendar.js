// packages/life/pages/calendar/calendar.js
// 导入 lunar-javascript
const { Solar, Lunar } = require('lunar-javascript');
const utils = require('../../../../utils/index');

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
  data: {
    currentDate: '',
    selectedDate: '',
    year: 0,
    month: 0,
    day: 0,
    weekDay: '',
    lunar: '',
    lunarYearGanZhi: '',
    zodiac: '',
    xingZuo: '',
    holidays: [],
    calendarDays: [],
    showLunar: true,
    canvaswidth: 376,
    canvasheight: 500,
    selectedYear: 0,
    selectedMonth: 0,
    selectedDay: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '万年历'
    })
    
    // 延迟初始化日历，让页面先渲染
    setTimeout(() => {
      const now = new Date()
      this.initCalendar(now.getFullYear(), now.getMonth(), now.getDate())
    }, 50);
  },

  initCalendar(year, month, day) {
    const date = new Date(year, month, day)
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']

    // 格式化日期为 YYYY-MM-DD 格式，兼容picker 组件
    const formatDate = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const solar = Solar.fromYmd(year, month + 1, day)
    const lunar = solar.getLunar()

    // 农历显示月、日
    const lunarMonth = lunar.getMonthInChinese()
    const lunarDay = lunar.getDayInChinese()
    const lunarDate = lunarMonth + '月' + lunarDay

    this.setData({
      year,
      month: month + 1,
      day,
      currentDate: formatDate(date),
      selectedDate: formatDate(date),
      selectedYear: year,
      selectedMonth: month + 1,
      selectedDay: day,
      weekDay: weekDays[date.getDay()],
      lunar: lunarDate,
      lunarYearGanZhi: lunar.getYearInGanZhi(),
      zodiac: lunar.getShengxiao(),
      xingZuo: solar.getXingZuo()
    })

    this.loadHolidays(year, month + 1, solar)
    this.generateCalendar(year, month + 1)
  },

  loadHolidays(year, month, solar) {
    const holidays = this.getMonthHolidays(year, month, solar)
    this.setData({ holidays })
  },

  getMonthHolidays(year, month, solar) {
    const holidays = []

    // 固定节日
    const fixedHolidays = {
      '1-1': '元旦',
      '2-14': '情人节',
      '3-8': '妇女节',
      '3-12': '植树节',
      '4-1': '愚人节',
      '4-5': '清明节',
      '5-1': '劳动节',
      '5-4': '青年节',
      '5-12': '护士节',
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

    // 使用 lunar-javascript 获取准确的节气
    const startSolar = Solar.fromYmd(year, month, 1)
    const lunarMonth = startSolar.getLunar()
    
    // 节气映射
    const jieQiMap = {
      'LI_CHUN': '立春',
      'YU_SHUI': '雨水',
      'JING_ZHE': '惊蛰',
      'CHUN_FEN': '春分',
      'QING_MING': '清明',
      'GU_YU': '谷雨',
      'LI_XIA': '立夏',
      'XIAO_MAN': '小满',
      'MANG_ZHONG': '芒种',
      'XIA_ZHI': '夏至',
      'XIAO_SHU': '小暑',
      'DA_SHU': '大暑',
      'LI_QIU': '立秋',
      'CHU_SHU': '处暑',
      'BAI_LU': '白露',
      'QIU_FEN': '秋分',
      'HAN_LU': '寒露',
      'SHUANG_JIANG': '霜降',
      'LI_DONG': '立冬',
      'XIAO_XUE': '小雪',
      'DA_XUE': '大雪',
      'DONG_ZHI': '冬至',
      'XIAO_HAN': '小寒',
      'DA_HAN': '大寒'
    }
    
    // 遍历节气映射，检查当月的节气
    for (const [key, name] of Object.entries(jieQiMap)) {
      // 尝试获取节气对应的阳历日期
      const jieQiSolar = lunarMonth._p && lunarMonth._p.jieQi ? lunarMonth._p.jieQi[key] : null
      if (jieQiSolar && jieQiSolar.getMonth() === month) {
        holidays.push({ day: jieQiSolar.getDay(), name, type: 'solar' })
      }
    }

    // 按日期排序
    holidays.sort((a, b) => a.day - b.day)

    return holidays
  },

  generateCalendar(year, month) {
    const calendarDays = []
    const holidays = this.data.holidays
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    // 当月第一天
    const firstDay = new Date(year, month - 1, 1)
    // 当月第一天是星期几
    const firstDayWeek = firstDay.getDay()
    // 当月有多少天
    const daysInMonth = new Date(year, month, 0).getDate()
    
    // 上个月需要显示的天数
    const prevMonthDays = firstDayWeek
    // 上个月的年份和月份
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    // 上个月有多少天
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()
    
    // 日历网格（6行7列）
    let dayCount = 1
    for (let i = 0; i < 6; i++) {
      const week = []
      for (let j = 0; j < 7; j++) {
        let day = null
        let isCurrentMonth = false
        let isToday = false
        let isSelected = false
        let lunarDay = ''
        let holiday = null
        
        if (i === 0 && j < prevMonthDays) {
          // 上个月的日期
          day = daysInPrevMonth - prevMonthDays + j + 1
          const prevSolar = Solar.fromYmd(prevYear, prevMonth, day)
          const prevLunar = prevSolar.getLunar()
          lunarDay = prevLunar.getDayInChinese()
        } else if (dayCount <= daysInMonth) {
          // 当月的日期
          day = dayCount
          isCurrentMonth = true
          
          // 检查是否是今天
          const today = new Date()
          if (year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()) {
            isToday = true
          }
          
          // 检查是否是选中日期
          isSelected = this.data.selectedYear === year && this.data.selectedMonth === month && this.data.selectedDay === day
          
          // 获取农历
          const solar = Solar.fromYmd(year, month, day)
          const lunar = solar.getLunar()
          lunarDay = lunar.getDayInChinese()
          
          // 检查是否是节假日
          holiday = holidays.find(h => h.day === day)
          
          // 检查是否是除夕
          if (!holiday && Math.abs(lunar.getMonth()) === 12 && lunar.getDay() >= 29) {
            const nextDay = lunar.next(1)
            if (lunar.getYear() !== nextDay.getYear()) {
              holiday = { day, name: '除夕', type: 'lunar' }
            }
          }
          
          dayCount++
        } else {
          // 下个月的日期
          day = dayCount - daysInMonth
          const nextMonth = month === 12 ? 1 : month + 1
          const nextYear = month === 12 ? year + 1 : year
          const nextSolar = Solar.fromYmd(nextYear, nextMonth, day)
          const nextLunar = nextSolar.getLunar()
          lunarDay = nextLunar.getDayInChinese()
        }
        
        week.push({
          day,
          isCurrentMonth,
          isToday,
          isSelected,
          lunarDay,
          holiday
        })
      }
      calendarDays.push(week)
      
      if (dayCount > daysInMonth) break
    }
    
    this.setData({ calendarDays, weekDays })
  },

  // 处理日期点击事件
  onDayClick(e) {
    const { day, isCurrentMonth } = e.currentTarget.dataset
    const { year, month } = this.data
    
    let targetYear = year
    let targetMonth = month
    
    if (!isCurrentMonth) {
      // 处理上个月或下个月的日期
      if (day > 15) {
        // 上个月
        targetMonth = month === 1 ? 12 : month - 1
        targetYear = month === 1 ? year - 1 : year
      } else {
        // 下个月
        targetMonth = month === 12 ? 1 : month + 1
        targetYear = month === 12 ? year + 1 : year
      }
    }
    
    // 跳转到选中日期
    const date = new Date(targetYear, targetMonth - 1, day)
    this.initCalendar(targetYear, targetMonth - 1, day)
  },



  // 切换月份
  switchMonth(direction) {
    const { year, month, day } = this.data
    let newMonth = month + direction
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    } else if (newMonth < 1) {
      newMonth = 12
      newYear = year - 1
    }
    
    // 确保日期有效
    const daysInMonth = new Date(newYear, newMonth, 0).getDate()
    const newDay = Math.min(day, daysInMonth)
    
    this.initCalendar(newYear, newMonth - 1, newDay)
  },

  // 处理年份切换
  handleYearSwitch(e) {
    const direction = parseInt(e.currentTarget.dataset.direction)
    this.switchYear(direction)
  },

  // 处理月份切换
  handleMonthSwitch(e) {
    const direction = parseInt(e.currentTarget.dataset.direction)
    this.switchMonth(direction)
  },

  // 切换年份
  switchYear(direction) {
    const { year, month, day } = this.data
    const newYear = year + direction
    
    // 确保日期有效
    const daysInMonth = new Date(newYear, month, 0).getDate()
    const newDay = Math.min(day, daysInMonth)
    
    this.initCalendar(newYear, month - 1, newDay)
  },

  onDateChange(e) {
    // 处理 picker 组件返回的 YYYY-MM-DD 格式日期
    const dateStr = e.detail.value
    const date = new Date(dateStr)
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

  goToZodiac() {
    if (isHarmonyOS) {
      router.push({
        uri: '/packages/life/pages/zodiac/zodiac'
      })
    } else {
      wx.navigateTo({
        url: '/packages/life/pages/zodiac/zodiac'
      })
    }
  },

  goToConstellation() {
    if (isHarmonyOS) {
      router.push({
        uri: '/packages/life/pages/constellation/constellation'
      })
    } else {
      wx.navigateTo({
        url: '/packages/life/pages/constellation/constellation'
      })
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
          utils.showText('获取画布失败，请重试');
        }
    } else {
      // 在微信小程序平台，使用wx.createCanvasContext
      try {
        const ctx = wx.createCanvasContext('cvs1', this);
        if (ctx) {
          this.MergeImage(ctx);
        } else {
          console.error('创建Canvas上下文失败');
          utils.showText('创建画布上下文失败，请重试');
        }
      } catch (error) {
        console.error('调用wx.createCanvasContext失败:', error);
        utils.showText('创建画布失败，请重试');
      }
    }
  },

  // 绘制分享图片
  MergeImage(ctx) {
    let that = this;

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

      // 背景色
      ctx.setFillStyle('#f8f9fa');
      ctx.fillRect(0, 0, width, height);

      // 标题
      ctx.setFontSize(26);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('万年历', padding, titleY);

      // 副标题
      ctx.setFontSize(16);
      ctx.setFillStyle('#7f8c8d');
      ctx.fillText('公历农历双显示，节假日一目了然', padding, subtitleY);

      // 日期信息
      const { year, month, day, weekDay, lunar, holidays } = this.data;
      
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('公历日期：', padding, infoY);
      ctx.setFontSize(16);
      ctx.setFillStyle('#3498db');
      ctx.fillText(`${year}年${month}月${day}日`, padding + 100, infoY);

      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('星期：', padding, infoY + 30);
      ctx.setFontSize(16);
      ctx.setFillStyle('#3498db');
      ctx.fillText(weekDay, padding + 100, infoY + 30);

      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('农历：', padding, infoY + 60);
      ctx.setFontSize(16);
      ctx.setFillStyle('#3498db');
      ctx.fillText(lunar, padding + 100, infoY + 60);

      // 节假日信息
      if (holidays && holidays.length > 0) {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('今日节日：', padding, infoY + 90);
        ctx.setFontSize(16);
        ctx.setFillStyle('#e74c3c');
        const holidayNames = holidays.map(holiday => holiday.name).join('、');
        ctx.fillText(holidayNames, padding + 100, infoY + 90);
      } else {
        ctx.setFontSize(16);
        ctx.setFillStyle('#2c3e50');
        ctx.fillText('今日节日：', padding, infoY + 90);
        ctx.setFontSize(16);
        ctx.setFillStyle('#7f8c8d');
        ctx.fillText('无', padding + 100, infoY + 90);
      }

      // 日历小知识
      ctx.setFontSize(16);
      ctx.setFillStyle('#2c3e50');
      ctx.fillText('日历小知识：', padding, infoY + 130);
      ctx.setFontSize(14);
      ctx.setFillStyle('#7f8c8d');
      
      let calendarTip = '农历是中国传统历法，结合了太阳和月亮的运行周期，包含二十四节气，对农业生产和传统节日有重要意义。';
      
      // 绘制小知识文本，支持换行
      const lineHeight = 20;
      const maxCharsPerLine = 18;
      let startIndex = 0;
      let currentY = infoY + 150;

      while (startIndex < calendarTip.length) {
        let endIndex = Math.min(startIndex + maxCharsPerLine, calendarTip.length);
        // 尝试在词语边界处换行
        if (endIndex < calendarTip.length && calendarTip[endIndex] !== ' ') {
          const lastSpaceIndex = calendarTip.lastIndexOf(' ', endIndex);
          if (lastSpaceIndex > startIndex) {
            endIndex = lastSpaceIndex;
          }
        }
        const lineText = calendarTip.substring(startIndex, endIndex);
        ctx.fillText(lineText, padding, currentY);
        startIndex = endIndex + 1;
        currentY += lineHeight;
      }

      // 底部提示
      ctx.setFontSize(14);
      ctx.setFillStyle('#7f8c8d');
      ctx.fillText('扫码使用万年历', padding, height - 40);

      // 绘制二维码
      ctx.drawImage('/images/mini.png', qrX, qrY, qrSize, qrSize);

      // 绘制完成后执行保存
      ctx.draw(false, function() {
        if (isHarmonyOS) {
          // 在鸿蒙平台，我们需要通过组件引用获取Canvas
          const canvas = that.$element('cvs1');
          if (canvas) {
            // 在鸿蒙平台，我们使用canvas.toDataURL()获取图片数据
            const imageData = canvas.toDataURL();
            
            // 保存图片到相册
            platform.saveImageToAlbum(imageData, 
              function() {
                console.debug("保存相册成功");
                utils.showSuccess('保存相册成功');
              },
              function(data, code) {
                console.debug("保存到相册失败", code, data);
                utils.showText('保存失败，请重试');
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
                  utils.showSuccess('保存相册成功');
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
                            console.debug("settingdata", settingdata);
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
                            console.debug("failData", failData);
                          },
                          complete(finishData) {
                            console.debug("finishData", finishData);
                          }
                        });
                      }
                    });
                  } else {
                    console.debug("保存到相册失败" + err);
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
      utils.showLoading('生成中，请稍候');
      setTimeout(function () {
        that.savecodetofile();
        utils.hideLoading();
      }, 1000);
    } catch (ex) {
      console.debug("绘图出现了错误" + ex)
      utils.showText('请重试');
    }
  }
})
