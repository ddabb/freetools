// app.js
const CURRENT_VERSION = '2.0.12';

App({
  onLaunch() {
    // 初始化小程序
    console.log('随身工具宝小程序启动 v' + CURRENT_VERSION);

    // 版本升级检测 + CDN缓存清理
    this.checkVersionAndClearCache();

    // 检查更新
    this.checkForUpdate();

    // 初始化使用统计
    this.initStats();

    // 全局加载自定义字体
    this.loadFonts();
  },

  /**
   * 版本升级检测 & CDN缓存清理
   * 逻辑：
   * 1. 获取上次运行的版本号
   * 2. 与当前版本比较
   * 3. 如果版本升级，清除CDN缓存（强制拉取最新数据）
   * 4. 更新存储的版本号
   */
  checkVersionAndClearCache() {
    const lastVersion = wx.getStorageSync('lastAppVersion') || '0.0.0';
    
    // 版本比较：是否需要清除缓存
    if (this.compareVersion(CURRENT_VERSION, lastVersion) > 0) {
      console.log('检测到版本升级：' + lastVersion + ' -> ' + CURRENT_VERSION + '，清除CDN缓存');
      this.clearCDNCache();
    }
    
    // 更新存储的版本号
    wx.setStorageSync('lastAppVersion', CURRENT_VERSION);
  },

  /**
   * 清除CDN缓存
   * 清除所有与CDN数据相关的本地存储
   */
  clearCDNCache() {
    const cdnCacheKeys = [
      'constellationCache',
      'constellationCacheTime',
      'dailySudokuCache',
      'dailySudokuCacheTime',
      'hotToolsCache',
      'hotToolsCacheTime',
      'changelogCache',
      'changelogCacheTime',
      'calendarEventsCache',
      'calendarEventsCacheTime',
      'dailyQuoteCache',
      'dailyQuoteCacheTime',
      '24pointCache',
      '24pointCacheTime',
      'sudokuPresetsCache',
      'sudokuPresetsCacheTime',
    ];
    
    cdnCacheKeys.forEach(key => {
      wx.removeStorageSync(key);
    });
    
    console.log('CDN缓存已清除');
  },

  /**
   * 版本号比较
   * @param {string} v1 - 当前版本
   * @param {string} v2 - 比较版本
   * @returns {number} 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
   */
  compareVersion(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const p1 = v1Parts[i] || 0;
      const p2 = v2Parts[i] || 0;
      
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    
    return 0;
  },

  /**
   * 全局加载字体
   */
  loadFonts() {
    const GOOGLE_FONTS_CDN = 'https://fonts.gstatic.com';
    const GHPROXY_BASE = 'https://ghproxy.com/https://fonts.gstatic.com';
    const useMirror = 'google';

    const getFontUrl = (path) => {
      switch (useMirror) {
        case 'ghproxy':
          return `url("${GHPROXY_BASE}${path}")`;
        case 'google':
        default:
          return `url("${GOOGLE_FONTS_CDN}${path}")`;
      }
    };

    const fontGroups = {
      core: [
        { family: 'Inter', source: getFontUrl('/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'), desc: { weight: '400', style: 'normal' } },
        { family: 'Roboto', source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf'), desc: { weight: '400', style: 'normal' } },
        { family: 'Noto Sans SC', source: getFontUrl('/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG4HFnYlNbPzT7HEL7j12XCOHJKg4RgZw3nFTvwZ8atTsBvwlvRUk7mYP2g.4.woff2'), desc: { weight: '300', style: 'normal' } }
      ],
      common: [
        { family: 'Roboto', source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWub2bWmT.ttf'), desc: { weight: '500', style: 'normal' } },
        { family: 'Roboto', source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf'), desc: { weight: '700', style: 'normal' } },
        { family: 'Open Sans', source: getFontUrl('/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0B4gaVc.ttf'), desc: { weight: '400', style: 'normal' } },
        { family: 'Montserrat', source: getFontUrl('/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2'), desc: { weight: '400', style: 'normal' } }
      ],
      special: [
        { family: 'Lato', source: getFontUrl('/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Raleway', source: getFontUrl('/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT5lu.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Source Sans 3', source: getFontUrl('/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf'), desc: { weight: '400', style: 'normal' } },
        { family: 'Pacifico', source: getFontUrl('/s/pacifico/v23/FwZY7-Qmy14u9lezJ-6J6MmBp0u-zK4.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Dancing Script', source: getFontUrl('/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7B1i03Sup8hNX6plRP.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Bangers', source: getFontUrl('/s/bangers/v25/FeVQS0BTqb0h60ACH55Q2J5hm24.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Fira Code', source: getFontUrl('/s/firacode/v27/uU9NCBsR6Z2vfE9aq3bh0NSDqFGedCMX.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'JetBrains Mono', source: getFontUrl('/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx3cwgknk-6nFg.woff2'), desc: { weight: '400', style: 'normal' } },
        { family: 'Comic Neue', source: getFontUrl('/s/comicneue/v9/4UaErEJDsxBrF37olUeD_xHM8pxULilENlY.woff2'), desc: { weight: '700', style: 'normal' } },
        { family: 'Inconsolata', source: getFontUrl('/s/inconsolata/v37/QlddNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLyya15IDhunA.woff2'), desc: { weight: '400', style: 'normal' } }
      ]
    };

    const loadFontGroup = (fonts, groupName) => {
      return new Promise((resolve) => {
        if (!fonts || fonts.length === 0) {
          resolve({ loaded: [], failed: [] });
          return;
        }

        const promises = fonts.map(font => new Promise((fontResolve) => {
          wx.loadFontFace({
            family: font.family,
            source: font.source,
            desc: font.desc,
            global: true,
            scopes: ['webview', 'native'],
            success: (res) => {
              console.log(`字体加载成功 [${groupName}]: ${font.family}`);
              fontResolve({ ok: true, family: font.family });
            },
            fail: (err) => {
              console.warn(`字体加载失败 [${groupName}]: ${font.family}`);
              fontResolve({ ok: false, family: font.family, err });
            }
          });
        }));

        Promise.all(promises).then(results => {
          const loaded = results.filter(r => r.ok).map(r => r.family);
          const failed = results.filter(r => !r.ok).map(r => r.family);
          console.log(`${groupName} 字体加载完成。成功:${loaded.length} 失败:${failed.length}`);
          resolve({ loaded, failed });
        });
      });
    };

    const loadFontsInStages = async () => {
      try {
        const coreResult = await loadFontGroup(fontGroups.core, '核心');
        this.globalData.fontsReady = true;
        this.globalData.fontsFailed = coreResult.failed.length > 0;
        this.globalData.loadedFonts = coreResult.loaded;

        setTimeout(async () => {
          const commonResult = await loadFontGroup(fontGroups.common, '常用');
          this.globalData.loadedFonts = [...new Set([...coreResult.loaded, ...commonResult.loaded])];
          this.globalData.fontsFailed = [...coreResult.failed, ...commonResult.failed].length > 0;

          setTimeout(async () => {
            const specialResult = await loadFontGroup(fontGroups.special, '特殊');
            this.globalData.loadedFonts = [...new Set([...coreResult.loaded, ...commonResult.loaded, ...specialResult.loaded])];
            console.log('所有字体加载完成');
          }, 1000);
        }, 500);
      } catch (error) {
        console.error('字体加载出错:', error);
        this.globalData.fontsReady = true;
        this.globalData.fontsFailed = true;
      }
    };

    loadFontsInStages();
  },

  onShow() {},

  onHide() {},

  onError(msg) {
    console.error('小程序发生错误：', msg);
  },

  /**
   * 检查微信小程序更新
   */
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function (res) {
        console.log('检查更新结果：', res.hasUpdate);
      });

      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function (res) {
            if (res.confirm) {
              // 重启前清除缓存
              wx.getStorageSync('lastAppVersion') && wx.removeStorageSync('lastAppVersion');
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function () {
        console.error('新版本下载失败');
      });
    }
  },

  /**
   * 初始化统计数据
   */
  initStats() {
    try {
      let useCount = wx.getStorageSync('useCount') || 0;
      useCount++;
      wx.setStorageSync('useCount', useCount);
    } catch (e) {
      console.error('初始化统计数据失败', e);
    }
  },

  globalData: {
    userInfo: null,
    version: CURRENT_VERSION,
    fontsReady: false,
    fontsFailed: false,
    loadedFonts: []
  }
});
