// utils/changelog-exporter.js
// 版本日志导出工具

const XLSX = require('../../../libs/xlsx.full.min.js');

/**
 * 导出版本日志为 Excel 文件
 * @param {Object} changelog - 版本日志数据
 * @returns {Promise<string>} - 导出成功返回文件路径
 */
exports.exportToExcel = function(changelog) {
  return new Promise((resolve, reject) => {
    try {
      if (!changelog || !changelog.changelog) {
        reject(new Error('暂无数据可导出'));
        return;
      }

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
          resolve(fullPath);
        },
        fail: () => {
          reject(new Error('导出失败'));
        }
      });
    } catch (err) {
      console.error('[changelog-exporter] 导出异常', err);
      reject(new Error('导出失败'));
    }
  });
};

/**
 * 打开导出的 Excel 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<void>}
 */
exports.openExcel = function(filePath) {
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath: filePath,
      fileType: 'xlsx',
      showMenu: true,
      success: () => {
        resolve();
      },
      fail: () => {
        reject(new Error('打开文件失败'));
      }
    });
  });
};