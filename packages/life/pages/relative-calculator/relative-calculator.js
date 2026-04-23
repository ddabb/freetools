// 导入RelativeCalculator类
const RelativeCalculator = require('./relativeCalculator');

// 创建亲属关系计算器实例
const calculator = new RelativeCalculator();

Page({
  data: {
    relationshipChain: [],
    result: '',
    inputDisplayText: '',
    loading: true,
    error: ''
  },

  onLoad() {
    this.loadRelationData();
  },

  // 加载亲属关系数据
  async loadRelationData() {
    try {
      this.setData({ loading: true, error: '' });
      await calculator.loadRelationGraph();
      this.setData({ loading: false });
    } catch (error) {
      console.error('加载亲属关系数据失败:', error);
      this.setData({ 
        loading: false, 
        error: '数据加载失败，请检查网络连接' 
      });
    }
  },

  // 添加亲戚关系（实时计算）
  addRelation: function (e) {
    if (this.data.loading) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'loading' });
      return;
    }

    if (this.data.error) {
      wx.showToast({ title: this.data.error, icon: 'none' });
      return;
    }

    console.debug('addRelation called', e);
    console.debug('current dataset:', e.currentTarget.dataset);

    // 直接使用 data-relation 的值（按钮上显示的文本）
    const relation = e.currentTarget.dataset.relation;
    console.debug('selected relation:', relation);

    const newChain = [...this.data.relationshipChain, relation];
    console.debug('new relationship chain:', newChain);

    // 实时计算结果
    const result = calculator.calculate(newChain);
    const inputDisplayText = newChain.length === 0 ? '' : `我的${newChain.join('的')}`;

    this.setData({
      relationshipChain: newChain,
      result: result,
      inputDisplayText: inputDisplayText
    }, () => {
      console.debug('UI updated, current data:', this.data);
    });
  },

  // 删除最后一个关系（实时计算）
  deleteRelation: function () {
    if (this.data.loading) {
      wx.showToast({ title: '数据加载中，请稍候', icon: 'loading' });
      return;
    }

    if (this.data.relationshipChain.length > 0) {
      const newChain = this.data.relationshipChain.slice(0, -1);
      const result = newChain.length > 0 ? calculator.calculate(newChain) : '';
      const inputDisplayText = newChain.length === 0 ? '' : `我的${newChain.join('的')}`;

      this.setData({
        relationshipChain: newChain,
        result: result,
        inputDisplayText: inputDisplayText
      });
    }
  },

  // 清空单个关系（C按钮）
  clearRelations: function () {
    this.setData({
      relationshipChain: [],
      result: '',
      inputDisplayText: ''
    });
  },

  // 清空所有（清空按钮）
  clearAll: function () {
    this.setData({
      relationshipChain: [],
      result: '',
      inputDisplayText: ''
    });
  },

  // 获取口语化显示文本
  getDisplayText: function (chain) {
    console.debug('getDisplayText called with chain:', chain);
    if (!chain || chain.length === 0) return '';

    const result = chain.join('的');
    console.debug('getDisplayText result:', result);
    return result;
  },

  // 打开说明
  openSettings: function () {
    wx.showModal({
      title: '亲戚计算器使用说明',
      content: '使用逻辑：\n\n1. 选择关系：从按钮中选择亲戚关系\n2. 构建关系链：如"爸爸的哥哥"\n3. 自动计算：系统实时计算最终称呼\n4. 支持操作：删除、清空、导出数据\n\n设计原理：\n• 基于关系图谱计算亲戚称呼\n• 支持复杂多层关系计算\n• 自动处理性别和辈分关系',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 导出结果
  exportResult: function () {
    wx.showModal({
      title: '确认导出',
      content: '确定要导出亲戚关系对照表为 Excel 文件吗？',
      success: (res) => {
        if (res.confirm) {
          this.exportRelationData();
        }
      }
    });
  },

  // 导出亲戚关系数据
  exportRelationData: function () {
    try {
      // 导入xlsx库
      const XLSX = require('../../../libs/xlsx.full.min.js');
      
      // 从内存中获取已加载的亲戚关系数据
      if (!calculator.relationGraph) {
        wx.showToast({ title: '数据未加载，请稍候', icon: 'none' });
        return;
      }
      
      const graph = calculator.relationGraph;
      console.debug('导出数据:', graph);
      
      // 获取所有关系列（排除gender字段）
      const firstNode = Object.values(graph)[0];
      const cols = Object.keys(firstNode).filter(k => k !== 'gender');
      
      // 构建表格数据
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
      
      if (!rows || rows.length === 0) {
        wx.showToast({ title: '暂无数据可导出', icon: 'none' });
        return;
      }
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 创建数据工作表
      const dataAoa = [['角色', ...cols]];
      rows.forEach(row => {
        dataAoa.push(row);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(dataAoa);
      
      // 设置列宽度
      const colWidths = [{ wch: 12 }]; // 第一列（角色）宽度
      cols.forEach(() => colWidths.push({ wch: 16 })); // 其他列宽度
      ws['!cols'] = colWidths;
      
      // 设置单元格样式
      const range = XLSX.utils.decode_range(ws['!ref']);
      
      // 表头样式（第一行）- 深蓝色渐变背景
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { 
              bold: true, 
              color: { rgb: "FFFFFF" }, 
              sz: 12,
              name: "微软雅黑"
            },
            fill: { 
              fgColor: { rgb: "2D5AA0" },
              patternType: "solid"
            },
            alignment: { 
              horizontal: "center", 
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "thin", color: { rgb: "1A3A7A" } },
              bottom: { style: "thin", color: { rgb: "1A3A7A" } },
              left: { style: "thin", color: { rgb: "1A3A7A" } },
              right: { style: "thin", color: { rgb: "1A3A7A" } }
            }
          };
        }
      }
      
      // 第一列样式（角色列）- 浅蓝色背景
      for (let R = 1; R <= range.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { 
              bold: true, 
              color: { rgb: "1A3A7A" }, 
              sz: 11,
              name: "微软雅黑"
            },
            fill: { 
              fgColor: { rgb: "E6F3FF" },
              patternType: "solid"
            },
            alignment: { 
              horizontal: "center", 
              vertical: "center" 
            },
            border: {
              top: { style: "thin", color: { rgb: "B8D4FF" } },
              bottom: { style: "thin", color: { rgb: "B8D4FF" } },
              left: { style: "thin", color: { rgb: "B8D4FF" } },
              right: { style: "thin", color: { rgb: "B8D4FF" } }
            }
          };
        }
      }
      
      // 数据单元格样式 - 白色背景，交替行颜色
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 1; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[cellRef]) {
            // 交替行颜色
            const isEvenRow = R % 2 === 0;
            const bgColor = isEvenRow ? "F8FBFF" : "FFFFFF";
            
            ws[cellRef].s = {
              font: { 
                color: { rgb: "333333" }, 
                sz: 10,
                name: "微软雅黑"
              },
              fill: { 
                fgColor: { rgb: bgColor },
                patternType: "solid"
              },
              alignment: { 
                horizontal: "left", 
                vertical: "center",
                wrapText: true
              },
              border: {
                top: { style: "thin", color: { rgb: "E1E1E1" } },
                bottom: { style: "thin", color: { rgb: "E1E1E1" } },
                left: { style: "thin", color: { rgb: "E1E1E1" } },
                right: { style: "thin", color: { rgb: "E1E1E1" } }
              }
            };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, '亲戚关系表');
      
      // 创建说明工作表
      const guideAoa = [
        ['亲戚关系表使用说明'],
        [''],
        ['表格使用方法：'],
        ['1. 单元格坐标说明：'],
        ['   • A列：角色名称（如：我自己、爸爸、妈妈等）'],
        ['   • B列及以后：关系类型（如：儿子、女儿、爷爷等）'],
        ['   • 单元格内容：对应角色对某关系的称呼'],
        [''],
        ['2. 查询方法：'],
        ['   • 我称 A列角色 的 B列关系 为 对应单元格内容'],
        ['   • 例如：我称 A3角色 的 B1关系 为 B3单元格内容'],
        ['   • 例如：我称 A11角色 的 G1关系 为 G11单元格内容'],
        [''],
        ['具体示例：'],
        ['• A2 = "我自己", B1 = "儿子", B2 = "儿子"'],
        ['   说明：我称 我自己 的 儿子 为 儿子'],
        ['• A3 = "爸爸", B1 = "儿子", B3 = "自己、哥哥、弟弟"'],
        ['   说明：我称 爸爸 的 儿子 为 自己、哥哥、弟弟'],
        ['• A4 = "妈妈", G1 = "姑姑", G4 = "姑奶奶"'],
        ['   说明：我称 妈妈 的 姑姑 为 姑奶奶'],
        ['• A5 = "老公", E1 = "爷爷", E5 = "爷爷"'],
        ['   说明：我称 老公 的 爷爷 为 爷爷'],
        [''],
        ['使用技巧：'],
        ['• A列（角色列）为浅灰色背景，表示当前角色'],
        ['• 第1行（表头）为深蓝色背景，表示关系类型'],
        ['• 数据区域为浅灰色背景，便于区分'],
        ['• 所有单元格都有边框，方便定位'],
        [''],
        ['备注：'],
        ['• 多个称呼用"、"分隔，表示都可以使用'],
        ['• 空白单元格表示该角色没有对应的关系称呼'],
        ['• 表格基于中国传统的亲戚称呼体系'],
        ['• 坐标定位：A1=角色列表头，B1=第一个关系类型']
      ];
      
      const wsGuide = XLSX.utils.aoa_to_sheet(guideAoa);
      
      // 设置说明工作表列宽
      wsGuide['!cols'] = [{ wch: 60 }];
      
      // 设置说明工作表样式
      const guideRange = XLSX.utils.decode_range(wsGuide['!ref']);
      for (let R = guideRange.s.r; R <= guideRange.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (wsGuide[cellRef]) {
          if (R === 0) {
            // 标题样式 - 深蓝色渐变
            wsGuide[cellRef].s = {
              font: { 
                bold: true, 
                color: { rgb: "FFFFFF" }, 
                sz: 16,
                name: "微软雅黑"
              },
              fill: { 
                fgColor: { rgb: "2D5AA0" },
                patternType: "solid"
              },
              alignment: { 
                horizontal: "center", 
                vertical: "center"
              }
            };
          } else if (R === 2 || R === 9 || R === 15 || R === 19) {
            // 小标题样式 - 浅蓝色背景
            wsGuide[cellRef].s = {
              font: { 
                bold: true, 
                color: { rgb: "1A3A7A" }, 
                sz: 13,
                name: "微软雅黑"
              },
              fill: { 
                fgColor: { rgb: "E6F3FF" },
                patternType: "solid"
              },
              alignment: { 
                horizontal: "left", 
                vertical: "center"
              }
            };
          } else if (R === 4 || R === 11 || R === 17 || R === 21) {
            // 重点内容样式
            wsGuide[cellRef].s = {
              font: { 
                color: { rgb: "FF6B35" }, 
                sz: 11,
                name: "微软雅黑",
                bold: true
              }
            };
          } else {
            // 正文样式
            wsGuide[cellRef].s = {
              font: { 
                color: { rgb: "333333" }, 
                sz: 11,
                name: "微软雅黑"
              }
            };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, wsGuide, '使用说明');
      
      // 生成 base64
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      
      // 生成文件名和路径
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `亲戚关系表_${dateStr}.xlsx`;
      const fullPath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      
      // 保存文件
      wx.getFileSystemManager().writeFile({
        filePath: fullPath,
        data: wbout,
        encoding: 'base64',
        success: () => {
          // 尝试打开文档
          wx.openDocument({
            filePath: fullPath,
            fileType: 'xlsx',
            showMenu: true,
            success: () => {
              wx.showToast({ title: '已打开Excel', icon: 'success' });
            },
            fail: () => {
              wx.showModal({
                title: '导出成功',
                content: `文件已保存为 ${fileName}\n包含数据表和详细使用说明`,
                showCancel: false
              });
            }
          });
        },
        fail: () => {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      });
      
    } catch (err) {
      console.error('[relative-calculator] 导出异常', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  // 跳转到关于页面
  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '亲戚关系计算器',
      path: '/packages/life/pages/relative-calculator/relative-calculator'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: '亲戚关系计算器 - 轻松计算复杂亲戚关系'
    };
  }
});