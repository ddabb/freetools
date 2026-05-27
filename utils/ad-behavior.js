// ad-behavior.js - 原生模板广告事件 Behavior
// 在 Page 中引入：const adBehavior = require('../../utils/ad-behavior');
// Page({ behaviors: [adBehavior], ... })

module.exports = Behavior({
  methods: {
    adLoad() {
      console.log('[广告] 原生模板广告加载成功');
    },
    adError(err) {
      console.error('[广告] 原生模板广告加载失败', err);
    },
    adClose() {
      console.log('[广告] 原生模板广告关闭');
    }
  }
});
