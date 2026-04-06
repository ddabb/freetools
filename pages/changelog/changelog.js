// pages/changelog/changelog.js
// 版本日志页面

const XLSX = require('../../libs/xlsx.mini.min.js');
const cacheManager = require('../../utils/cacheManager');
const CDN_URL = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/changelog.json';

// 缓存配置（cdn_ 前缀支持 app.js 自动清理）
const CACHE_KEY_CHANGELOG = 'cdn_changelog';
const CACHE_KEY_CHANGELOG_TS = 'cdn_changelog_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

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

        try {
          const aoa = [['版本', '日期', '类型', '标题', '更新内容']];
      changelog.changelog.forEach(item => {
        const changes = item.changes ? item.changes.join('；') : '';
        const typeText = item.type === 'feature' ? '新功能' : item.type === 'fix' ? '修复' : '其他';
        aoa.push([item.version || '', item.date || '', typeText, item.title || '', changes]);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const ncol = aoa[0].length;
      const nrow = aoa.length;

      const b = { style: 'thin', color: { rgb: 'FFAAAAAA' } };
      const border = { top: b, bottom: b, left: b, right: b };
      const mk = (bg, fc, bold, align) => ({ fill: { fgColor: { rgb: bg } }, font: { color: { rgb: fc }, bold }, border, alignment: { horizontal: align || 'center', vertical: 'center' } });

      // 表头
      const hStyle = mk('FF1F4E79', 'FFFFFFFF', true);
      for (let c = 0; c < ncol; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        ws[ref].s = hStyle;
      }

      // 类型样式
      const typeStyles = {
        '新功能': mk('FF388E3C', 'FFFFFFFF', true),
        '修复': mk('FFF57C00', 'FFFFFFFF', true),
        '其他': mk('FF757575', 'FFFFFFFF', true)
      };
      const oddStyle = mk('FFDAEEF3', 'FF333333', false, 'left');
      const evenStyle = mk('FFFFFFFF', 'FF333333', false, 'left');

      for (let r = 1; r < nrow; r++) {
        const rowStyle = r % 2 === 1 ? oddStyle : evenStyle;
        const typeText = aoa[r][2];
        const tStyle = typeStyles[typeText] || rowStyle;
        for (let c = 0; c < ncol; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          ws[ref].s = c === 2 ? tStyle : rowStyle;
        }
      }

      // 列宽
      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 32 }, { wch: 60 }
      ];
      // 行高
      ws['!rows'] = Array.from({ length: nrow }, () => ({ hpt: 18 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '更新日志');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `changelog_${dateStr}.xlsx`;
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;

      wx.getFileSystemManager().writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => {
              this.setData({ exporting: false });
              wx.showToast({ title: '已打开Excel', icon: 'success' });
            },
            fail: () => {
              this.setData({ exporting: false });
              wx.showModal({
                title: '导出成功',
                content: `文件已保存为 ${fileName}\n可在「文件管理」中找到并打开`,
                showCancel: false
              });
            }
          });
        },
        fail: () => {
          this.setData({ exporting: false });
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      });
    } catch (err) {
      console.error('[changelog] 导出异常', err);
      this.setData({ exporting: false });
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
      }   // 确认弹窗 success 结束
    });
  },

  /**
   * 带缓存的请求（内存 → Storage → CDN，支持 304 + LRU）
   */
  fetchWithCache(cacheKey, tsKey, url) {
    return cacheManager.fetchWithCache({
      cacheKey,
      tsKey,
      url,
      ttl: CACHE_EXPIRE
    });
  },

  // 从 jsDelivr CDN 加载 changelog（带缓存）
  loadChangelog() {
    console.log('[changelog] 开始加载版本日志');
    this.setData({
      loading: true,
      error: ''
    });

    this.fetchWithCache(CACHE_KEY_CHANGELOG, CACHE_KEY_CHANGELOG_TS, CDN_URL)
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
