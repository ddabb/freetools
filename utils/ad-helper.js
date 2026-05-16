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

/**
 * 创建激励视频广告实例
 */
function createRewardedVideoAd() {
  if (!wx.createRewardedVideoAd) return null;
  const ad = wx.createRewardedVideoAd({
    adUnitId: AD_IDS.REWARDED_VIDEO
  });
  ad.onError(err => console.warn('[广告] 激励视频错误:', err.errCode, err.errMsg));
  ad.onClose(res => {
    if (res && res.isEnded) {
      console.log('[广告] 激励视频完整观看');
    } else {
      console.log('[广告] 激励视频未完整观看');
    }
  });
  return ad;
}

/**
 * 创建插屏广告实例
 */
function createInterstitialAd() {
  if (!wx.createInterstitialAd) return null;
  const ad = wx.createInterstitialAd({
    adUnitId: AD_IDS.INTERSTITIAL
  });
  ad.onError(err => console.warn('[广告] 插屏错误:', err.errCode, err.errMsg));
  ad.onClose(() => console.log('[广告] 插屏关闭'));
  return ad;
}

module.exports = {
  AD_IDS,
  createRewardedVideoAd,
  createInterstitialAd,
};
