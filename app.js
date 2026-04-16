// app.js
App({
  onLaunch() {
    // 初始化小程序
    console.debug('随身工具宝小程序启动');

    // 检查更新
    this.checkForUpdate();
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
        console.debug('检查更新结果：', res.hasUpdate);
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

  globalData: {
    userInfo: null
  },

  /**
   * 缓存管理工具
   */
  cache: {
    /**
     * 生成缓存键
     * @param {string} url - 请求URL
     * @param {object} params - 请求参数
     * @returns {string} 缓存键
     */
    generateKey(url, params = {}) {
      const paramStr = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      return `cdn_${url}_${paramStr}`;
    },

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} data - 缓存数据
     * @param {number} expire - 过期时间（秒），默认1小时
     */
    set(key, data, expire = 3600) {
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          expire: expire * 1000
        };
        wx.setStorageSync(key, cacheData);
        console.debug(`缓存设置成功: ${key}`);
      } catch (e) {
        console.error('缓存设置失败:', e);
      }
    },

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {any|null} 缓存数据，过期或不存在返回null
     */
    get(key) {
      try {
        const cacheData = wx.getStorageSync(key);
        if (!cacheData) return null;

        const now = Date.now();
        if (now - cacheData.timestamp > cacheData.expire) {
          wx.removeStorageSync(key);
          console.debug(`缓存已过期: ${key}`);
          return null;
        }

        console.debug(`缓存命中: ${key}`);
        return cacheData.data;
      } catch (e) {
        console.error('缓存获取失败:', e);
        return null;
      }
    },

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     */
    remove(key) {
      try {
        wx.removeStorageSync(key);
        console.debug(`缓存删除成功: ${key}`);
      } catch (e) {
        console.error('缓存删除失败:', e);
      }
    },

    /**
     * 清除所有CDN相关缓存
     */
    clearCDNCache() {
      try {
        const keys = wx.getStorageInfoSync().keys;
        const cdnKeys = keys.filter(key => key.startsWith('cdn_'));
        cdnKeys.forEach(key => wx.removeStorageSync(key));
        console.debug(`CDN缓存已清除，共 ${cdnKeys.length} 个缓存项`);
      } catch (e) {
        console.error('CDN缓存清除失败:', e);
      }
    }
  },

  /**
   * 带缓存的CDN请求
   * @param {string} url - 请求URL
   * @param {object} options - 请求选项
   * @param {number} expire - 缓存过期时间（秒）
   * @returns {Promise<any>} 请求结果
   */
  async requestWithCache(url, options = {}, expire = 3600) {
    const cacheKey = this.cache.generateKey(url, options.params || {});
    const cachedData = this.cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        ...options,
        success: (res) => {
          if (res.statusCode === 200) {
            this.cache.set(cacheKey, res.data, expire);
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});
