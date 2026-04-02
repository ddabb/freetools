// pages/changelog/changelog.js
// 版本日志页面

const XLSX = require('../../libs/xlsx.mini.min.js');

Page({
  data: {
    loading: true,
    error: '',
    changelog: null,
    exporting: false
  },

  onLoad() {
    this.loadChangelog();
  },

  // 导出为 Excel (使用 xlsx.mini.min.js，小程序专用优化版)
  onExportExcel() {
    if (this.data.exporting) return;

    const { changelog } = this.data;
    if (!changelog || !changelog.changelog) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' });
      return;
    }

    this.setData({ exporting: true });

    try {
      // 构建二维数组（表头 + 数据行）
      const aoa = [
        ['版本', '日期', '类型', '标题', '更新内容']  // 表头
      ];

      changelog.changelog.forEach(item => {
        const changes = item.changes ? item.changes.join('；') : '';
        const typeText = item.type === 'feature' ? '新功能' : item.type === 'fix' ? '修复' : '其他';
        aoa.push([
          item.version || '',
          item.date || '',
          typeText,
          item.title || '',
          changes
        ]);
      });

      // 1. 将数据转为工作表
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // 2. 设置列宽（自动适应）
      ws['!cols'] = [
        { wch: 12 },  // 版本
        { wch: 14 },  // 日期
        { wch: 8 },   // 类型
        { wch: 30 },  // 标题
        { wch: 50 }   // 更新内容
      ];

      // 3. 创建工作簿
      const wb = XLSX.utils.book_new();

      // 4. 添加工作表
      XLSX.utils.book_append_sheet(wb, ws, '更新日志');

      // 5. 生成 base64 格式的 Excel 文件
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      // 6. 保存文件
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `changelog_${dateStr}.xlsx`;
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      const fs = wx.getFileSystemManager();
      fs.writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          // 7. 打开文件（自动识别为 Excel）
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => {
              this.setData({ exporting: false });
              wx.showToast({ title: '已打开Excel', icon: 'success' });
            },
            fail: (err) => {
              console.error('[changelog] 打开文件失败', err);
              this.setData({ exporting: false });
              wx.showModal({
                title: '导出成功',
                content: `文件已保存为 ${fileName}\n可在「文件管理」中找到并打开`,
                showCancel: false
              });
            }
          });
        },
        fail: (err) => {
          console.error('[changelog] 写入文件失败', err);
          this.setData({ exporting: false });
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      });
    } catch (err) {
      console.error('[changelog] 导出异常', err);
      this.setData({ exporting: false });
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  // 从 jsDelivr CDN 加载 changelog
  loadChangelog() {
    console.log('[changelog] 开始加载版本日志');
    this.setData({
      loading: true,
      error: ''
    });
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/changelog.json'+ `?_t=${Date.now()}`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        console.log('[changelog] 请求成功', {
          statusCode: res.statusCode,
          hasData: !!res.data
        });
        if (res.statusCode === 200 && res.data) {
          this.setData({
            loading: false,
            changelog: res.data
          });
        } else {
          console.error('[changelog] 数据格式错误', res);
          this.setData({
            loading: false,
            error: '数据格式错误，点击重试'
          });
        }
      },
      fail: (err) => {
        console.error('[changelog] 网络请求失败', err);
        this.setData({
          loading: false,
          error: '网络请求失败，点击重试'
        });
      }
    });
  },

  // 点击重试
  onRetry() {
    console.log('[changelog] 用户点击重试');
    this.loadChangelog();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '随身工具宝 - 版本日志',
      path: '/pages/changelog/changelog'
    };
  },

  onShareTimeline() {
    return {
      title: '随身工具宝 - 版本日志'
    };
  }
});
