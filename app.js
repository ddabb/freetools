// app.js
App({
  onLaunch() {
    // 初始化小程序
    console.log('实用工具集合小程序启动');

    // 检查更新
    this.checkForUpdate();

    // 初始化使用统计
    this.initStats();

    // 全局加载自定义字体
    this.loadFonts();
  },

  /**
   * 全局加载字体
   * 使用 wx.loadFontFace + global:true，一次加载，全页面（含 Canvas）生效。
   *
   * 字体来源说明（均为开源免费商用）：
   *   - 使用 Google Fonts 官方 CDN (fonts.gstatic.com)，确保字体加载稳定性
   *   - 优先使用 woff2 格式字体，体积小，加载速度快
   *   - 支持多种镜像源切换，可通过 useMirror 变量配置
   *   - 镜像源选项：google (官方CDN) / ghproxy (国内镜像)
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

    // 字体分组：按优先级和使用场景
    const fontGroups = {
      // 核心字体：页面初始化时必须的字体
      core: [
        {
          family: 'Inter',
          source: getFontUrl('/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Roboto',
          source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Noto Sans SC',
          source: getFontUrl('/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG4HFnYlNbPzT7HEL7j12XCOHJKg4RgZw3nFTvwZ8atTsBvwlvRUk7mYP2g.4.woff2'),
          desc: { weight: '300', style: 'normal' }
        }
      ],
      // 常用字体：页面加载后加载
      common: [
        {
          family: 'Roboto',
          source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWub2bWmT.ttf'),
          desc: { weight: '500', style: 'normal' }
        },
        {
          family: 'Roboto',
          source: getFontUrl('/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf'),
          desc: { weight: '700', style: 'normal' }
        },
        {
          family: 'Open Sans',
          source: getFontUrl('/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0B4gaVc.ttf'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Montserrat',
          source: getFontUrl('/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2'),
          desc: { weight: '400', style: 'normal' }
        }
      ],
      // 特殊字体：按需加载
      special: [
        {
          family: 'Lato',
          source: getFontUrl('/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Raleway',
          source: getFontUrl('/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT5lu.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Source Sans 3',
          source: getFontUrl('/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Pacifico',
          source: getFontUrl('/s/pacifico/v23/FwZY7-Qmy14u9lezJ-6J6MmBp0u-zK4.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Dancing Script',
          source: getFontUrl('/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7B1i03Sup8hNX6plRP.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Bangers',
          source: getFontUrl('/s/bangers/v25/FeVQS0BTqb0h60ACH55Q2J5hm24.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Fira Code',
          source: getFontUrl('/s/firacode/v27/uU9NCBsR6Z2vfE9aq3bh0NSDqFGedCMX.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'JetBrains Mono',
          source: getFontUrl('/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx3cwgknk-6nFg.woff2'),
          desc: { weight: '400', style: 'normal' }
        },
        {
          family: 'Comic Neue',
          source: getFontUrl('/s/comicneue/v9/4UaErEJDsxBrF37olUeD_xHM8pxULilENlY.woff2'),
          desc: { weight: '700', style: 'normal' }
        },
        {
          family: 'Inconsolata',
          source: getFontUrl('/s/inconsolata/v37/QlddNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLyya15IDhunA.woff2'),
          desc: { weight: '400', style: 'normal' }
        }
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
            global: true,   // 全局生效（包含 Canvas）
            scopes: ['webview', 'native'], // webview 页面 + 原生组件同时生效
            success: (res) => {
              console.log(`字体加载成功 [${groupName}]: ${font.family} weight=${font.desc.weight}`, res);
              fontResolve({ ok: true, family: font.family });
            },
            fail: (err) => {
              console.warn(`字体加载失败 [${groupName}]: ${font.family} weight=${font.desc.weight}`, err);
              fontResolve({ ok: false, family: font.family, err }); // fail 也 resolve，不阻断启动
            }
          });
        }));

        Promise.all(promises).then(results => {
          const loaded = results.filter(r => r.ok).map(r => r.family);
          const failed = results.filter(r => !r.ok).map(r => r.family);
          console.log(`${groupName} 字体加载完成。成功:`, [...new Set(loaded)], '失败:', [...new Set(failed)]);
          resolve({ loaded, failed });
        });
      });
    };

    // 分阶段加载字体
    const loadFontsInStages = async () => {
      try {
        // 1. 加载核心字体
        const coreResult = await loadFontGroup(fontGroups.core, '核心');
        const allLoaded = [...coreResult.loaded];
        const allFailed = [...coreResult.failed];

        // 核心字体加载完成后，标记基本就绪
        this.globalData.fontsReady = true;
        this.globalData.fontsFailed = allFailed.length > 0;
        this.globalData.loadedFonts = allLoaded;

        // 2. 延迟加载常用字体
        setTimeout(async () => {
          const commonResult = await loadFontGroup(fontGroups.common, '常用');
          allLoaded.push(...commonResult.loaded);
          allFailed.push(...commonResult.failed);
          
          this.globalData.loadedFonts = [...new Set(allLoaded)];
          this.globalData.fontsFailed = allFailed.length > 0;

          // 3. 进一步延迟加载特殊字体
          setTimeout(async () => {
            const specialResult = await loadFontGroup(fontGroups.special, '特殊');
            allLoaded.push(...specialResult.loaded);
            allFailed.push(...specialResult.failed);
            
            this.globalData.loadedFonts = [...new Set(allLoaded)];
            this.globalData.fontsFailed = allFailed.length > 0;
            
            console.log('所有字体加载完成。总计成功:', this.globalData.loadedFonts.length, '失败:', allFailed.length);
          }, 1000); // 特殊字体延迟1秒加载
        }, 500); // 常用字体延迟500ms加载
      } catch (error) {
        console.error('字体加载过程出错:', error);
        this.globalData.fontsReady = true; // 即使出错也标记为就绪，使用系统字体
        this.globalData.fontsFailed = true;
      }
    };

    // 开始分阶段加载
    loadFontsInStages();
  },

  onShow() {
    // 小程序显示
  },

  onHide() {
    // 小程序隐藏
  },

  onError(msg) {
    console.error('小程序发生错误：', msg);
  },

  // 检查更新
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

  // 初始化统计数据
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
    version: '1.0.0',
    fontsReady: false,    // 字体是否全部加载完毕
    fontsFailed: false,    // 是否有字体加载失败（失败时 Canvas 回退系统字体）
    loadedFonts: []       // 已成功加载的字体列表
  }
})
