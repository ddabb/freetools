// ad-helper.js - 广告辅助工具
// 统一管理所有广告位 unit-id，方便后续替换

const AD_IDS = {
  // 首页 — 原生模板广告
  INDEX_BANNER: 'adunit-7c367b556fa848ca',
  // 关于页 — 原生模板广告
  ABOUT_BANNER: 'adunit-7c367b556fa848ca',
  // 工具页 — 视频图片广告
  TOOL_BANNER: 'adunit-07e9c9da9e4b8254',
  // 激励视频
  REWARDED_VIDEO: 'adunit-00712de35b90c0f0',
  // 插屏广告
  INTERSTITIAL: 'adunit-fce8815b3af37d84',
};

// ---- 插屏广告单例 ----
let _interstitialAd = null;
let _interstitialReady = false;

/**
 * 获取插屏广告实例（单例）
 * 首次调用时创建实例，后续调用复用同一个实例
 */
function getInterstitialAd() {
  if (_interstitialAd) return _interstitialAd;

  // 基础库版本不支持插屏广告
  if (!wx.createInterstitialAd) {
    console.warn('[广告] 当前基础库不支持插屏广告');
    return null;
  }

  try {
    _interstitialAd = wx.createInterstitialAd({
      adUnitId: AD_IDS.INTERSTITIAL
    });

    _interstitialAd.onLoad(() => {
      console.log('[广告] 插屏广告加载成功');
      _interstitialReady = true;
    });

    _interstitialAd.onError((err) => {
      console.error('[广告] 插屏广告错误:', err.errCode, err.errMsg);
      _interstitialReady = false;
    });

    _interstitialAd.onClose(() => {
      console.log('[广告] 插屏广告关闭');
      _interstitialReady = false;
    });

    return _interstitialAd;
  } catch (err) {
    console.error('[广告] 创建插屏广告失败:', err);
    return null;
  }
}

/**
 * 显示插屏广告
 * 适用于页面切换、返回等自然断点场景
 * @returns {Promise<boolean>} 是否成功显示
 */
function showInterstitialAd() {
  const ad = getInterstitialAd();
  if (!ad) return Promise.resolve(false);

  return ad.show()
    .then(() => {
      console.log('[广告] 插屏广告显示成功');
      return true;
    })
    .catch((err) => {
      // 错误码 2004 表示广告未加载好，属于正常情况
      console.warn('[广告] 插屏广告显示失败:', err.errCode, err.errMsg);
      return false;
    });
}

// ---- 激励视频广告单例 ----
let _rewardedVideoAd = null;

/**
 * 获取激励视频广告实例（单例）
 */
function getRewardedVideoAd() {
  if (_rewardedVideoAd) return _rewardedVideoAd;

  if (!wx.createRewardedVideoAd) {
    console.warn('[广告] 当前基础库不支持激励视频广告');
    return null;
  }

  try {
    _rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: AD_IDS.REWARDED_VIDEO
    });

    _rewardedVideoAd.onLoad(() => {
      console.log('[广告] 激励视频广告加载成功');
    });

    _rewardedVideoAd.onError((err) => {
      console.error('[广告] 激励视频广告错误:', err.errCode, err.errMsg);
    });

    _rewardedVideoAd.onClose((res) => {
      if (res && res.isEnded) {
        console.log('[广告] 激励视频完整观看，可发放奖励');
      } else {
        console.log('[广告] 激励视频中途关闭，不发放奖励');
      }
    });

    return _rewardedVideoAd;
  } catch (err) {
    console.error('[广告] 创建激励视频广告失败:', err);
    return null;
  }
}

/**
 * 显示激励视频广告（失败自动重试一次）
 * @param {Function} onRewarded - 完整观看后的回调
 * @returns {Promise<boolean>}
 */
function showRewardedVideoAd(onRewarded) {
  const ad = getRewardedVideoAd();
  if (!ad) return Promise.resolve(false);

  return ad.show()
    .then(() => {
      console.log('[广告] 激励视频广告显示成功');
      return true;
    })
    .catch(() => {
      // 失败重试：先 load 再 show
      console.warn('[广告] 激励视频首次显示失败，尝试重新加载...');
      return ad.load()
        .then(() => ad.show())
        .then(() => true)
        .catch((err) => {
          console.error('[广告] 激励视频重试后仍失败:', err.errCode, err.errMsg);
          return false;
        });
    });
}

module.exports = {
  AD_IDS,
  getRewardedVideoAd,
  showRewardedVideoAd,
  getInterstitialAd,
  showInterstitialAd,
};
