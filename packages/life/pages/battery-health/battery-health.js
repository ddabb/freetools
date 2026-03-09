// battery-health.js
Page({
  data: {
    level: null, // 设备电量百分比（1-100）
    isCharging: null, // 是否正在充电
    isLowPowerModeEnabled: null, // 是否开启省电模式
    showResult: false, // 是否显示结果
    result: '' // 结果文字
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
  }
})