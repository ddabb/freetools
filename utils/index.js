/**
 * 全局工具函数统一导出（平台兼容版）
 * 同时支持微信小程序和鸿蒙系统
 * 
 * 使用方式：
 * const utils = require('../../utils');
 * // 或从主包调用
 * const utils = require('utils');
 */

// Toast轻提示
const toast = require('./toast');

// Modal对话框
const modal = require('./modal');

// 存储工具
const storage = require('./storage');

// 验证工具
const validator = require('./validator');

// 日期工具
const dateUtil = require('./dateUtil');

// 分享工具
const share = require('./share');

// 图片生成工具
const imageGenerator = require('./imageGenerator');

// 基础工具
const util = require('./util');

/**
 * 合并导出所有工具
 */
module.exports = {
  // Toast相关
  showSuccess: toast.showSuccess,
  showError: toast.showError,
  showWarning: toast.showWarning,
  showLoading: toast.showLoading,
  hideLoading: toast.hideLoading,
  showText: toast.showText,
  showToast: toast.showToast,
  
  // Modal对话框
  showConfirm: modal.showConfirm,
  showAlert: modal.showAlert,
  showErrorDialog: modal.showErrorDialog,
  
  // 存储相关（异步）
  setStorage: storage.setStorage,
  getStorage: storage.getStorage,
  removeStorage: storage.removeStorage,
  clearStorage: storage.clearStorage,
  getStorageInfo: storage.getStorageInfo,
  
  // 存储相关（同步，仅微信）
  getStorageSync: storage.getStorageSync,
  
  // 验证相关
  isValidNumber: validator.isValidNumber,
  isValidLength: validator.isValidLength,
  isValidDate: validator.isValidDate,
  isValidIdCardFormat: validator.isValidIdCardFormat,
  isValidPhone: validator.isValidPhone,
  isValidEmail: validator.isValidEmail,
  isValidUrl: validator.isValidUrl,
  isEmpty: validator.isEmpty,
  
  // 日期相关
  ...dateUtil,
  
  // 分享相关
  shareAppMessage: share.shareAppMessage,
  shareTimeline: share.shareTimeline,
  showShareMenu: share.showShareMenu,
  hideShareMenu: share.hideShareMenu,
  updateShareMenu: share.updateShareMenu,
  createShareHandlers: share.createShareHandlers,
  
  // 图片生成相关
  imageGenerator: imageGenerator,
  drawBackground: imageGenerator.drawBackground,
  drawText: imageGenerator.drawText,
  drawQRCode: imageGenerator.drawQRCode,
  drawFrom: imageGenerator.drawFrom,
  drawDate: imageGenerator.drawDate,
  exportImage: imageGenerator.exportImage,
  saveToAlbum: imageGenerator.saveToAlbum,
  
  // 基础工具
  formatTime: util.formatTime,
  
  // 版本信息
  VERSION: '1.0.0'
};
