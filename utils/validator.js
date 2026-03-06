// 数据验证工具类

/**
 * 验证是否为有效的数字
 * @param {any} value - 要验证的值
 * @param {object} options - 验证选项 {min, max, integer}
 * @returns {boolean}
 */
export function isValidNumber(value, options = {}) {
  const num = Number(value);

  if (isNaN(num)) {
    return false;
  }

  const { min, max, integer } = options;

  if (integer && !Number.isInteger(num)) {
    return false;
  }

  if (typeof min !== 'undefined' && num < min) {
    return false;
  }

  if (typeof max !== 'undefined' && num > max) {
    return false;
  }

  return true;
}

/**
 * 验证字符串长度
 * @param {string} str - 要验证的字符串
 * @param {object} options - 验证选项 {min, max}
 * @returns {boolean}
 */
export function isValidLength(str, options = {}) {
  const len = str.length;
  const { min, max } = options;

  if (typeof min !== 'undefined' && len < min) {
    return false;
  }

  if (typeof max !== 'undefined' && len > max) {
    return false;
  }

  return true;
}

/**
 * 验证是否为有效的日期
 * @param {any} value - 要验证的值
 * @returns {boolean}
 */
export function isValidDate(value) {
  if (!(value instanceof Date)) {
    value = new Date(value);
  }

  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 验证身份证号码格式
 * @param {string} idCard - 身份证号码
 * @returns {boolean}
 */
export function isValidIdCardFormat(idCard) {
  // 15位或18位身份证
  const reg15 = /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$/;
  const reg18 = /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/;

  return reg15.test(idCard) || reg18.test(idCard);
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return reg.test(email);
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 验证是否为空值
 * @param {any} value - 要验证的值
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}
