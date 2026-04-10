/**
 * 成语接龙 - 数据服务模块
 * 负责成语索引数据的加载、缓存管理及查询
 */

// CDN 配置
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire';

// 缓存配置（CDN 数据，需加 cdn_ 前缀以支持 app.js 自动清理）
const CACHE_KEY_INDEX = 'cdn_idiom_index_data';
const CACHE_KEY_TS = 'cdn_idiom_index_ts';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000; // 7 天

// 日志配置
const LOG_KEY = 'cdn_idiom_data_logs';
const MAX_LOG_SIZE = 100;

// 添加日志
function addLog(type, message, data = {}) {
  try {
    const logs = wx.getStorageSync(LOG_KEY) || [];
    const logEntry = {
      timestamp: Date.now(),
      type,
      message,
      data,
      userAgent: wx.getSystemInfoSync().system
    };
    
    logs.unshift(logEntry);
    if (logs.length > MAX_LOG_SIZE) {
      logs.splice(MAX_LOG_SIZE);
    }
    
    wx.setStorageSync(LOG_KEY, logs);
    console.log(`[idiom-data] ${type}: ${message}`, data);
  } catch (error) {
    console.error('[idiom-data] 日志记录失败:', error);
  }
}

// 数据索引（内部状态）
let firstFullIndex = null; // 首字完整拼音索引 {wei:[], xian:[], ...}
let lastIndex = null;      // 尾字完整拼音索引 {wei:[], xian:[], ...}
let wordToFirstPy = null;  // 反向 Map：成语 -> 首字拼音，O(1) 查询
let wordToLastPy = null;   // 反向 Map：成语 -> 尾字拼音，O(1) 查询
let allWords = null;       // 所有成语 Set

// 是否已初始化
let isInitialized = false;

/**
 * 封装请求方法
 * @param {string} url - 请求地址
 * @returns {Promise}
 */
function request(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    wx.request({
      url,
      timeout: 15000,
      success: res => {
        const requestTime = Date.now() - startTime;
        
        if (res.statusCode === 200 && res.data) {
          addLog('request_success', '请求成功', { 
            url, 
            requestTime, 
            statusCode: res.statusCode,
            dataSize: JSON.stringify(res.data).length 
          });
          resolve(res.data);
        } else {
          addLog('request_error', '请求状态错误', { 
            url, 
            requestTime, 
            statusCode: res.statusCode 
          });
          reject(new Error('bad status'));
        }
      },
      fail: err => {
        const requestTime = Date.now() - startTime;
        addLog('request_fail', '网络请求失败', { 
          url, 
          requestTime, 
          error: err.errMsg || err.toString() 
        });
        reject(err);
      },
    });
  });
}

/**
 * 构建反向 Map：成语 -> 首字拼音
 * @param {Object} firstFullIndex - 首字索引
 * @returns {Map}
 */
function buildWordToFirstPy(firstFullIndex) {
  const map = new Map();
  for (const [py, arr] of Object.entries(firstFullIndex)) {
    for (const w of arr) {
      map.set(w, py);
    }
  }
  return map;
}

/**
 * 构建反向 Map：成语 -> 尾字拼音
 * @param {Object} lastIndex - 尾字索引
 * @returns {Map}
 */
function buildWordToLastPy(lastIndex) {
  const map = new Map();
  for (const [py, arr] of Object.entries(lastIndex)) {
    for (const w of arr) {
      map.set(w, py);
    }
  }
  return map;
}

/**
 * 构建所有成语集合
 * @param {Object} firstFullIndex - 首字索引
 * @returns {Set}
 */
function buildAllWords(firstFullIndex) {
  const words = new Set();
  for (const arr of Object.values(firstFullIndex)) {
    for (const w of arr) {
      words.add(w);
    }
  }
  return words;
}

/**
 * 应用索引数据到内部状态
 * @param {Object} data - { firstFullIndex, lastIndex }
 */
function applyIndexData(data) {
  firstFullIndex = data.firstFullIndex;
  lastIndex = data.lastIndex;
  wordToFirstPy = buildWordToFirstPy(data.firstFullIndex);
  wordToLastPy = buildWordToLastPy(data.lastIndex);
  allWords = buildAllWords(data.firstFullIndex);
  isInitialized = true;
}

/**
 * 加载成语索引数据（带缓存）
 * 优先从本地缓存读取，若缓存过期则从 CDN 重新加载
 * @returns {Promise<boolean>} 加载成功返回 true
 */
function loadData() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const cached = wx.getStorageSync(CACHE_KEY_INDEX);
    const ts = wx.getStorageSync(CACHE_KEY_TS);

    // 缓存有效，直接使用
    if (cached && ts && (now - ts < CACHE_EXPIRE)) {
      addLog('cache', '使用缓存数据', { cacheAge: now - ts });
      applyIndexData(cached);
      resolve(true);
      return;
    }

    // 缓存过期，从 CDN 加载
    addLog('load', '开始从CDN加载数据', { 
      hasCache: !!cached, 
      cacheAge: ts ? now - ts : 'no_cache' 
    });
    
    wx.showLoading({ title: '加载数据…', mask: true });

    const startTime = Date.now();
    Promise.all([
      request(`${CDN_BASE}/idiom-first-full-index.json`),
      request(`${CDN_BASE}/idiom-last-index.json`),
    ]).then(([firstFullData, lastData]) => {
      const loadTime = Date.now() - startTime;
      const indexData = { firstFullIndex: firstFullData, lastIndex: lastData };
      
      wx.setStorageSync(CACHE_KEY_INDEX, indexData);
      wx.setStorageSync(CACHE_KEY_TS, now);
      wx.hideLoading();
      
      addLog('success', 'CDN数据加载成功', { 
        loadTime, 
        firstIndexSize: Object.keys(firstFullData).length,
        lastIndexSize: Object.keys(lastData).length 
      });
      
      applyIndexData(indexData);
      resolve(true);
    }).catch(err => {
      const loadTime = Date.now() - startTime;
      wx.hideLoading();
      
      addLog('error', 'CDN数据加载失败', { 
        loadTime, 
        error: err.message || err.toString() 
      });
      
      console.error('[idiom-data] 加载失败', err);
      reject(err);
    });
  });
}

/**
 * 根据首字母加载成语详情数据（带 Storage 缓存，7 天有效）
 * @param {string} firstLetter - 首字母 (a-z)
 * @returns {Promise<Array>} 成语详情数组
 */
function fetchLetterData(firstLetter) {
  if (!firstLetter) {
    return Promise.reject(new Error('firstLetter is required'));
  }

  const cacheKey = `cdn_idiom_letter_${firstLetter}`;
  const tsKey = `cdn_idiom_letter_${firstLetter}_ts`;
  const now = Date.now();

  // 优先读 Storage 缓存
  try {
    const cached = wx.getStorageSync(cacheKey);
    const ts = wx.getStorageSync(tsKey);
    if (cached && ts && (now - ts < CACHE_EXPIRE)) {
      return Promise.resolve(cached);
    }
  } catch (e) { /* 读缓存失败不影响正常流程 */ }

  // 缓存失效，走网络
  return request(`${CDN_BASE}/letter/${firstLetter}.json`).then(data => {
    try {
      wx.setStorageSync(cacheKey, data);
      wx.setStorageSync(tsKey, now);
    } catch (e) { /* 写缓存失败不影响正常流程 */ }
    return data;
  });
}

/**
 * 清除本地缓存（索引 + 所有 letter 详情）
 */
function clearCache() {
  wx.removeStorageSync(CACHE_KEY_INDEX);
  wx.removeStorageSync(CACHE_KEY_TS);

  // 清除 letter 详情缓存（a-z）
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  letters.forEach(l => {
    wx.removeStorageSync(`cdn_idiom_letter_${l}`);
    wx.removeStorageSync(`cdn_idiom_letter_${l}_ts`);
  });

  firstFullIndex = null;
  lastIndex = null;
  wordToFirstPy = null;
  wordToLastPy = null;
  allWords = null;
  isInitialized = false;
}

/**
 * 获取成语首字拼音首字母
 * @param {string} word - 成语
 * @returns {string|null} 首字母 (a-z) 或 null
 */
function getFirstLetter(word) {
  if (!word || !wordToFirstPy) return null;
  const firstPy = wordToFirstPy.get(word);
  return firstPy ? firstPy[0] : null;
}

/**
 * 获取成语尾字拼音
 * @param {string} word - 成语
 * @returns {string|null} 尾字完整拼音或 null
 */
function getWordLastPy(word) {
  if (!word || !wordToLastPy) return null;
  return wordToLastPy.get(word) || null;
}

/**
 * 获取成语首字完整拼音
 * @param {string} word - 成语
 * @returns {string|null} 首字完整拼音或 null
 */
function getWordFirstPy(word) {
  if (!word || !wordToFirstPy) return null;
  return wordToFirstPy.get(word) || null;
}

/**
 * 检查成语是否在词库中
 * @param {string} word - 成语
 * @returns {boolean}
 */
function hasWord(word) {
  if (!word || !allWords) return false;
  return allWords.has(word);
}

/**
 * 获取以指定拼音开头的成语列表
 * @param {string} pinyin - 尾字拼音
 * @returns {Array} 成语数组
 */
function getCandidates(pinyin) {
  if (!pinyin || !firstFullIndex) return [];
  return firstFullIndex[pinyin] || [];
}

/**
 * 获取以指定拼音结尾的成语列表
 * @param {string} pinyin - 首字拼音
 * @returns {Array} 成语数组
 */
function getWordsEndingWith(pinyin) {
  if (!pinyin || !lastIndex) return [];
  return lastIndex[pinyin] || [];
}

/**
 * 检查服务是否已初始化
 * @returns {boolean}
 */
function isReady() {
  return isInitialized;
}

/**
 * 模糊搜索成语（包含匹配）
 * @param {string} query - 查询字符串
 * @returns {Array} 匹配的成语数组，最多返回 200 条
 */
function fuzzySearch(query) {
  if (!query || !allWords) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const word of allWords) {
    if (word.includes(q)) {
      results.push(word);
    }
    if (results.length >= 200) break;
  }
  return results;
}

/**
 * 获取成语尾字
 * @param {string} word - 成语
 * @returns {string}
 */
function getLastChar(word) {
  return word ? word.slice(-1) : '';
}

/**
 * 获取所有成语集合
 * @returns {Set|null} 所有成语的 Set 集合，若未初始化则返回 null
 */
function getAllWords() {
  return allWords;
}

/**
 * 从所有成语中随机获取一个成语
 * @returns {string|null} 随机成语，若未初始化则返回 null
 */
function getRandomWord() {
  if (!allWords || allWords.size === 0) return null;
  const words = Array.from(allWords);
  return words[Math.floor(Math.random() * words.length)];
}

/**
 * 查询成语接龙
 * @param {string} word - 查询的成语
 * @param {string} mode - 模式：'forward'（顺查）或 'reverse'（逆查）
 * @returns {Object} { candidates: Array, error: string|null }
 */
function querySolitaire(word, mode = 'forward') {
  if (!isInitialized) {
    return { candidates: [], error: '数据未初始化' };
  }
  
  if (!hasWord(word)) {
    return { candidates: [], error: '该成语不在词库中' };
  }
  
  let candidates = [];
  
  if (mode === 'reverse') {
    // 逆查：查找可以接在当前成语前面的成语
    const firstPy = getWordFirstPy(word);
    if (firstPy) {
      candidates = getWordsEndingWith(firstPy);
    }
  } else {
    // 顺查：查找可以接在当前成语后面的成语
    const lastPy = getWordLastPy(word);
    if (lastPy) {
      candidates = getCandidates(lastPy);
    }
  }
  
  return { candidates, error: null };
}

/**
 * 获取日志
 * @returns {Array} 日志数组
 */
function getLogs() {
  return wx.getStorageSync(LOG_KEY) || [];
}

/**
 * 清除日志
 */
function clearLogs() {
  wx.removeStorageSync(LOG_KEY);
}

// 导出模块
module.exports = {
  CDN_BASE,
  loadData,
  fetchLetterData,
  clearCache,
  getFirstLetter,
  getWordLastPy,
  getWordFirstPy,
  hasWord,
  getCandidates,
  getWordsEndingWith,
  isReady,
  getLastChar,
  getAllWords,
  getRandomWord,
  querySolitaire,
  fuzzySearch,
  // 日志相关
  getLogs,
  clearLogs,
};
