// ad-behavior.js - 广告事件 Behavior
// 在 Page 中引入：const adBehavior = require('../../utils/ad-behavior');
// Page({ behaviors: [adBehavior], ... })

module.exports = Behavior({
  methods: {
    onAdError(err) {
      // 广告加载失败静默处理，不影响用户体验
      console.warn('[广告] banner错误:', err.detail.errCode, err.detail.errMsg);
    },
    onAdClose() {
      console.log('[广告] banner关闭');
    }
  }
});
