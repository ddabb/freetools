// pages/relative-export/relative-export.js
// 亲戚关系表导出页面

const XLSX = require('../../libs/xlsx.full.min.js');

Page({
  data: {
    loading: true,
    error: '',
    exporting: false,
    tableData: null,
    rows: [],
    cols: [],
    rowCount: 0,
    colCount: 0,
    cellCount: 0
  },

  onLoad() {
    this.loadData();
  },

  // 从 CDN 加载亲戚关系数据
  loadData() {
    this.setData({ loading: true, error: '' });
    wx.request({
      url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/relative-relation.json?_t=' + Date.now(),
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.relationGraph) {
          const graph = res.data.relationGraph;
          const firstNode = Object.values(graph)[0];
          const cols = Object.keys(firstNode).filter(k => k !== 'gender');
          const rows = [];

          for (const [role, relations] of Object.entries(graph)) {
            const row = [role];
            for (const col of cols) {
              const val = relations[col];
              if (val == null) {
                row.push('');
              } else if (Array.isArray(val)) {
                row.push(val.join('、'));
              } else {
                row.push(String(val));
              }
            }
            rows.push(row);
          }

          const cellCount = rows.length * cols.length;
          this.setData({
            loading: false,
            tableData: { rows, cols },
            rows,
            cols,
            rowCount: rows.length,
            colCount: cols.length,
            cellCount: Math.round(cellCount / 100) * 100
          });
        } else {
          this.setData({ loading: false, error: '数据格式错误' });
        }
      },
      fail: () => {
        this.setData({ loading: false, error: '网络请求失败' });
      }
    });
  },

  // 导出为 Excel
  onExportExcel() {
    if (this.data.exporting) return;

    const { rows, cols } = this.data;
    if (!rows || rows.length === 0) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' });
      return;
    }

    this.setData({ exporting: true });

    try {
      // 构建 aoa：第一行是表头
      const aoa = [['角色', ...cols]];

      rows.forEach(row => {
        aoa.push(row);
      });

      // 转为工作表
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // 设置第一列宽度（角色名）
      const colWidths = [{ wch: 10 }];
      cols.forEach(() => colWidths.push({ wch: 14 }));
      ws['!cols'] = colWidths;

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '亲戚关系表');

      // 生成 base64
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      // 保存文件
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `亲戚关系表_${dateStr}.xlsx`;
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
      console.error('[relative-export] 导出异常', err);
      this.setData({ exporting: false });
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  onShareAppMessage() {
    return {
      title: '亲戚关系对照表 - 随身工具宝',
      path: '/pages/relative-export/relative-export'
    };
  },

  onShareTimeline() {
    return {
      title: '亲戚关系对照表 - 完整的中国亲戚称呼对照表'
    };
  }
});
