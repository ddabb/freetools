/**
 * 成语接龙 - 数据服务模块
 * 
 * 懒加载策略：
 * - loadData() 同步加载首字索引（顺查），约 200KB
 * - 尾字索引（逆查）后台异步加载，按字母按需加载（每个字母 ~1-22KB）
 * - 成语详情按字母加载，已有的直接返回缓存
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

// 缓存键
const K = {
  FIRST_INDEX: 'cdn_idiom_first_index',
  FIRST_TS: 'cdn_idiom_first_ts',
  LAST_INDEX: 'cdn_idiom_last_index',
  LAST_TS: 'cdn_idiom_last_ts',
  LOG: 'cdn_idiom_data_logs',
};
const MAX_LOG = 100;

// 内部状态
let firstIndex = null;    // 首字索引 {拼音:[成语...]}
let lastIndex = null;     // 尾字索引 {拼音:[成语...]}，懒加载
let wordToFirstPy = null; // 成语 → 首字拼音
let wordToLastPy = null;  // 成语 → 尾字拼音
let allWords = null;      // Set<成语>

let isFirstReady = false; // 首字索引已加载（顺查可工作）
let isLastReady = false;  // 尾字索引已加载（逆查可工作）

// 待注册的逆查回调（尾字索引加载完成后调用）
let _pendingReverseCallbacks = [];

/**
 * 写日志
 */
function log(type, msg, data) {
  try {
    const entries = wx.getStorageSync(K.LOG) || [];
    entries.unshift({ t: Date.now(), type, msg, data });
    if (entries.length > MAX_LOG) entries.splice(MAX_LOG);
    wx.setStorageSync(K.LOG, entries);
  } catch (e) { /* ignore */ }
  console.log(`[idiom-data] ${type}: ${msg}`, data || '');
}

/**
 * 网络请求封装
 */
function request(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    wx.request({
      url,
      timeout,
      success: res => {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data);
        } else {
          reject(new Error(`status ${res.statusCode}`));
        }
      },
      fail: reject
    });
  });
}

/**
 * 应用首字索引到内存
 */
function applyFirstIndex(data) {
  firstIndex = data;
  wordToFirstPy = new Map();
  wordToLastPy = new Map();
  allWords = new Set();
  for (const [py, arr] of Object.entries(data)) {
    arr.forEach(w => {
      if (!wordToFirstPy.has(w)) wordToFirstPy.set(w, py);
      allWords.add(w);
    });
  }
}

/**
 * 应用尾字索引到内存
 */
function applyLastIndex(data) {
  lastIndex = data;
  for (const [py, arr] of Object.entries(data)) {
    arr.forEach(w => {
      wordToLastPy.set(w, py);
    });
  }
}

/**
 * 同步从缓存读取首字索引（毫秒级）
 */
function getCachedFirstIndex() {
  try {
    const data = wx.getStorageSync(K.FIRST_INDEX);
    const ts = wx.getStorageSync(K.FIRST_TS);
    if (data && ts && Date.now() - ts < CACHE_EXPIRE) {
      return data;
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * 同步从缓存读取尾字索引
 */
function getCachedLastIndex() {
  try {
    const data = wx.getStorageSync(K.LAST_INDEX);
    const ts = wx.getStorageSync(K.LAST_TS);
    if (data && ts && Date.now() - ts < CACHE_EXPIRE) {
      return data;
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * 加载首字索引（同步路径：缓存优先）
 * @returns {Promise<boolean>} 成功返回 true
 */
function loadFirstIndex() {
  // 1. 缓存命中 → 同步返回
  const cached = getCachedFirstIndex();
  if (cached) {
    applyFirstIndex(cached);
    isFirstReady = true;
    log('cache', '首字索引命中缓存');
    return Promise.resolve(true);
  }

  // 2. 缓存未命中 → 请求 CDN（首次安装/缓存过期）
  log('load', '首字索引缓存未命中，请求CDN');
  wx.showLoading({ title: '加载数据…', mask: true });
  return request(`${CDN_BASE}/idiom-first-full-index.json`)
    .then(data => {
      try {
        wx.setStorageSync(K.FIRST_INDEX, data);
        wx.setStorageSync(K.FIRST_TS, Date.now());
      } catch (e) { /* ignore */ }
      wx.hideLoading();
      applyFirstIndex(data);
      isFirstReady = true;
      log('ok', '首字索引CDN加载成功', { keys: Object.keys(data).length });
      return true;
    })
    .catch(err => {
      wx.hideLoading();
      log('err', '首字索引加载失败', { msg: err.message });
      return false;
    });
}

/**
 * 加载尾字索引（完全异步，后台执行）
 * 按字母懒加载：用户点击"逆查"时才触发，按尾字首字母加载对应文件
 * 
 * @param {Function} onComplete - 加载完成回调 (success: boolean) => void
 */
function loadLastIndex(onComplete) {
  // 1. 缓存命中 → 同步应用
  const cached = getCachedLastIndex();
  if (cached) {
    applyLastIndex(cached);
    isLastReady = true;
    log('cache', '尾字索引命中缓存');
    onComplete && onComplete(true);
    return;
  }

  // 2. 缓存未命中 → 后台按字母懒加载
  //    逆查时只知道目标尾字的拼音（如 "wei"），不知道首字母
  //    故退化为加载全量尾字索引（204KB），后台静默执行
  log('load', '尾字索引缓存未命中，后台加载');
  request(`${CDN_BASE}/idiom-last-index.json`)
    .then(data => {
      try {
        wx.setStorageSync(K.LAST_INDEX, data);
        wx.setStorageSync(K.LAST_TS, Date.now());
      } catch (e) { /* ignore */ }
      applyLastIndex(data);
      isLastReady = true;
      log('ok', '尾字索引CDN加载成功');
      onComplete && onComplete(true);
    })
    .catch(err => {
      log('err', '尾字索引加载失败', { msg: err.message });
      onComplete && onComplete(false);
    });
}

/**
 * 主入口：加载成语数据
 * 优先使用缓存保证首次打开无等待
 * 顺查立即可用，逆查后台加载完成后自动解锁
 * 
 * @param {Function} [onReady] - 首字索引就绪回调
 * @param {Function} [onLastReady] - 尾字索引就绪回调（逆查可用时）
 */
function loadData(onReady, onLastReady) {
  // 尝试同步加载首字索引
  const ok = loadFirstIndex();
  if (ok !== false) {
    onReady && onReady();
  } else {
    onReady && onReady(false);
  }

  // 尾字索引后台异步加载，完成后通知
  if (onLastReady) {
    _pendingReverseCallbacks.push(onLastReady);
  }
  loadLastIndex(success => {
    _pendingReverseCallbacks.forEach(cb => cb(success));
    _pendingReverseCallbacks = [];
  });
}

/**
 * 按首字母加载成语详情（带缓存，已实现）
 * @param {string} letter - 首字母 a-z
 */
function fetchLetterData(letter) {
  if (!letter) return Promise.reject(new Error('letter required'));

  const cacheKey = `cdn_idiom_letter_${letter}`;
  const tsKey = `cdn_idiom_letter_${letter}_ts`;
  const now = Date.now();

  // 读缓存
  try {
    const cached = wx.getStorageSync(cacheKey);
    const ts = wx.getStorageSync(tsKey);
    if (cached && ts && now - ts < CACHE_EXPIRE) {
      return Promise.resolve(cached);
    }
  } catch (e) { /* ignore */ }

  // 缓存过期 → 请求 CDN
  return request(`${CDN_BASE}/letter/${letter}.json`).then(data => {
    try {
      wx.setStorageSync(cacheKey, data);
      wx.setStorageSync(tsKey, now);
    } catch (e) { /* ignore */ }
    return data;
  });
}

/**
 * 清除所有缓存
 */
function clearCache() {
  wx.removeStorageSync(K.FIRST_INDEX);
  wx.removeStorageSync(K.FIRST_TS);
  wx.removeStorageSync(K.LAST_INDEX);
  wx.removeStorageSync(K.LAST_TS);

  // 清除字母详情缓存
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(l => {
    wx.removeStorageSync(`cdn_idiom_letter_${l}`);
    wx.removeStorageSync(`cdn_idiom_letter_${l}_ts`);
  });

  firstIndex = null;
  lastIndex = null;
  wordToFirstPy = null;
  wordToLastPy = null;
  allWords = null;
  isFirstReady = false;
  isLastReady = false;
}

/**
 * 获取首字拼音
 */
function getFirstPy(word) {
  return wordToFirstPy ? wordToFirstPy.get(word) || null : null;
}

/**
 * 获取首字拼音的首字母（用于加载详情数据）
 */
function getFirstLetter(word) {
  const py = getFirstPy(word);
  return py ? py[0] : null;
}

/**
 * 获取尾字拼音
 */
function getLastPy(word) {
  return wordToLastPy ? wordToLastPy.get(word) || null : null;
}

/**
 * 检查成语是否在库中
 */
function hasWord(word) {
  return allWords ? allWords.has(word) : false;
}

/**
 * 顺查：以给定拼音开头的成语
 */
function getCandidates(pinyin) {
  if (!firstIndex || !pinyin) return [];
  return firstIndex[pinyin] || [];
}

/**
 * 逆查：以给定拼音结尾的成语
 */
function getReverseCandidates(pinyin) {
  if (!lastIndex || !pinyin) return [];
  return lastIndex[pinyin] || [];
}

/**
 * 查询成语接龙
 * @param {string} word - 查询的成语
 * @param {string} mode - 'forward' | 'reverse'
 * @returns {{ candidates, error, lastIndexLoading }}
 */
function querySolitaire(word, mode = 'forward') {
  if (!isFirstReady) {
    return { candidates: [], error: '数据加载中…', lastIndexLoading: !isLastReady };
  }
  if (!hasWord(word)) {
    return { candidates: [], error: '该成语不在词库中', lastIndexLoading: false };
  }

  if (mode === 'reverse') {
    // 逆查：需要尾字索引
    if (!isLastReady) {
      // 触发尾字索引加载，告知 UI 等待
      if (!_pendingReverseCallbacks.length) {
        loadLastIndex(() => {}); // 已在 loadData 中注册过，这里防止未调用
      }
      return { candidates: [], error: '数据加载中…', lastIndexLoading: true };
    }
    const fp = getFirstPy(word);
    return { candidates: fp ? getReverseCandidates(fp) : [], error: null, lastIndexLoading: false };
  } else {
    // 顺查：只用首字索引
    const lp = getLastPy(word);
    return { candidates: lp ? getCandidates(lp) : [], error: null, lastIndexLoading: false };
  }
}

/**
 * 模糊搜索（包含匹配）
 */
function fuzzySearch(query) {
  if (!allWords || !query) return [];
  const q = query.trim().toLowerCase();
  const results = [];
  for (const w of allWords) {
    if (w.includes(q)) {
      results.push(w);
      if (results.length >= 200) break;
    }
  }
  return results;
}

/**
 * 获取尾字
 */
function getLastChar(word) {
  return word ? word.slice(-1) : '';
}

/**
 * 获取随机成语
 */
function getRandomWord() {
  if (!allWords || !allWords.size) return null;
  const arr = Array.from(allWords);
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 首字索引是否就绪（顺查可工作）
 */
function isReady() {
  return isFirstReady;
}

/**
 * 尾字索引是否就绪（逆查可工作）
 */
function isLastIndexReady() {
  return isLastReady;
}

/**
 * 获取日志
 */
function getLogs() {
  return wx.getStorageSync(K.LOG) || [];
}

/**
 * 清除日志
 */
function clearLogs() {
  wx.removeStorageSync(K.LOG);
}

module.exports = {
  CDN_BASE,
  loadData,
  fetchLetterData,
  clearCache,
  getFirstPy,
  getFirstLetter,
  getLastPy,
  hasWord,
  getCandidates,
  getReverseCandidates,
  isReady,
  isLastIndexReady,
  getLastChar,
  fuzzySearch,
  getRandomWord,
  querySolitaire,
  getLogs,
  clearLogs,
};
