// pages/changelog/changelog.js
// 版本日志页面

const changelogExporter = require('../../utils/changelog-exporter');
const changelogLoader = require('../../utils/changelog-loader');

Page({
  behaviors: [adBehavior],
  data: {
    loading: true,
    error: '',
    changelog: null,
    exporting: false,
    currentVersion: ''
  },

  onLoad() {
    // 获取微信小程序的真实版本信息
    this.getAppVersion();
    this.loadChangelog();
  },

  // 导出为 Excel
  onExportExcel() {
    if (this.data.exporting) return;

    const { changelog } = this.data;
    if (!changelog || !changelog.changelog) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导出',
      content: '确定要导出更新日志为 Excel 文件吗？',
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ exporting: true });

        changelogExporter.exportToExcel(changelog)
          .then(filePath => {
            return changelogExporter.openExcel(filePath);
          })
          .then(() => {
            this.setData({ exporting: false });
            wx.showToast({ title: '已打开Excel', icon: 'success' });
          })
          .catch(err => {
            console.error('[changelog] 导出异常', err);
            this.setData({ exporting: false });
            wx.showToast({ title: '导出失败', icon: 'none' });
          });
      }   // 确认弹窗 success 结束
    });
  },



  // 获取微信小程序真实版本信息
  getAppVersion() {
    try {
      const version = changelogLoader.getAppVersion();
      this.setData({
        currentVersion: version
      });
    } catch (error) {
      console.error('[changelog] 获取版本信息失败:', error);
      // 如果获取失败，使用默认版本
      this.setData({
        currentVersion: '2.0.0'
      });
    }
  },

  // 从 jsDelivr CDN 加载 changelog（带缓存）
  loadChangelog() {
    console.debug('[changelog] 开始加载版本日志');
    this.setData({
      loading: true,
      error: ''
    });

    changelogLoader.loadChangelog()
      .then(data => {
        this.setData({
          loading: false,
          changelog: data
        });
      })
      .catch(err => {
        console.error('[changelog] 加载失败', err);
        this.setData({
          loading: false,
          error: '网络请求失败，点击重试'
        });
      });
  },

  // 点击重试
  onRetry() {
    console.debug('[changelog] 用户点击重试');
    this.loadChangelog();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  }
});
const adBehavior = require('../../../../utils/ad-behavior');
