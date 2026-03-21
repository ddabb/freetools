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
   * 字体来源说明（均为开源免费商用，国内可稳定访问）：
   *   - 使用 Google Fonts CDN，确保字体加载稳定性
   *   - 优先使用 woff2 格式字体，体积小，加载速度快
   */
  loadFonts() {
    const fonts = [
      // Inter字体
      {
        family: 'Inter',
        // Inter Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2")',
        desc: { weight: '400', style: 'normal' }
      },
      {
        family: 'Inter',
        // Inter Regular 400 latin-ext
        source: 'url("https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2")',
        desc: { weight: '400', style: 'normal' }
      },

      // Roboto字体
      {
        family: 'Roboto',
        // Roboto Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf")',
        desc: { weight: '400', style: 'normal' }
      },
      {
        family: 'Roboto',
        // Roboto Medium 500 latin
        source: 'url("https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWub2bWmT.ttf")',
        desc: { weight: '500', style: 'normal' }
      },
      {
        family: 'Roboto',
        // Roboto Bold 700 latin
        source: 'url("https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf")',
        desc: { weight: '700', style: 'normal' }
      },

      // Open Sans字体
      {
        family: 'Open Sans',
        // Open Sans Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0B4gaVc.ttf")',
        desc: { weight: '400', style: 'normal' }
      },
      // Lato字体
      {
        family: 'Lato',
        // Lato Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXiWtFCc.woff2")',
        desc: { weight: '400', style: 'normal' }
      },


      // Montserrat字体
      {
        family: 'Montserrat',
        // Montserrat Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2")',
        desc: { weight: '400', style: 'normal' }
      },

      // Raleway字体
      {
        family: 'Raleway',
        // Raleway Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT5lu.woff2")',
        desc: { weight: '400', style: 'normal' }
      },

      // Source Sans Pro字体
      {
        family: 'Source Sans Pro',
        // Source Sans Pro Regular 400 latin
        source: 'url("https://fonts.gstatic.com/s/sourcesanspro/v22/6xK3dSBYKcSV-LCoeQqfX1RYOo3qNa7lqDY.woff2")',
        desc: { weight: '400', style: 'normal' }
      }



    ];

    const promises = fonts.map(font => new Promise((resolve) => {
      wx.loadFontFace({
        family: font.family,
        source: font.source,
        desc: font.desc,
        global: true,   // 全局生效（包含 Canvas）
        scopes: ['webview', 'native'], // webview 页面 + 原生组件同时生效
        success: (res) => {
          console.log(`字体加载成功: ${font.family} weight=${font.desc.weight}`, res);
          resolve({ ok: true, family: font.family });
        },
        fail: (err) => {
          console.warn(`字体加载失败: ${font.family} weight=${font.desc.weight}`, err);
          resolve({ ok: false, family: font.family, err }); // fail 也 resolve，不阻断启动
        }
      });
    }));

    Promise.all(promises).then(results => {
      const loaded = results.filter(r => r.ok).map(r => r.family);
      const failed = results.filter(r => !r.ok).map(r => r.family);
      console.log('字体加载完成。成功:', [...new Set(loaded)], '失败:', [...new Set(failed)]);
      // 将字体就绪状态写入 globalData，供各页面 Canvas 绘图时判断
      this.globalData.fontsReady = true;
      this.globalData.fontsFailed = failed.length > 0;
    });
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
    fontsFailed: false    // 是否有字体加载失败（失败时 Canvas 回退系统字体）
  }
})
