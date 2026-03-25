/**
 * 工具频率数据管理
 * 负责工具使用频率的记录、更新和查询
 */
const { toolFrequency: defaultToolFrequency } = require('./constants');
const { setStorage, getStorage, removeStorage } = require('../utils/storage');

// 存储键名
const STORAGE_KEY = 'tool_frequency_data';

/**
 * 获取工具频率数据
 * @returns {Promise<Object>} 工具频率数据对象
 */
async function getToolFrequency() {
  try {
    const storedData = await getStorage(STORAGE_KEY);
    if (storedData) {
      return { ...defaultToolFrequency, ...storedData };
    }
  } catch (error) {
    console.error('获取工具频率数据失败:', error);
  }
  return { ...defaultToolFrequency };
}

/**
 * 更新工具频率数据
 * @param {string} toolId - 工具ID
 * @param {number} increment - 增加的频率值（默认1）
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateToolFrequency(toolId, increment = 1) {
  try {
    const currentFrequency = await getToolFrequency();
    currentFrequency[toolId] = (currentFrequency[toolId] || 0) + increment;
    
    const success = await setStorage(STORAGE_KEY, currentFrequency);
    return success;
  } catch (error) {
    console.error('更新工具频率数据失败:', error);
    return false;
  }
}

/**
 * 重置工具频率数据
 * @returns {Promise<boolean>} 重置是否成功
 */
async function resetToolFrequency() {
  try {
    const success = await removeStorage(STORAGE_KEY);
    return success;
  } catch (error) {
    console.error('重置工具频率数据失败:', error);
    return false;
  }
}

/**
 * 获取工具频率排名
 * @param {number} limit - 返回前N个工具（默认10）
 * @returns {Promise<Array>} 按频率排序的工具ID列表
 */
async function getToolFrequencyRanking(limit = 10) {
  const frequency = await getToolFrequency();
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([toolId, freq]) => ({ toolId, frequency: freq }));
}

/**
 * 批量更新工具频率数据
 * @param {Array<{toolId: string, increment: number}>} updates - 更新列表
 * @returns {Promise<boolean>} 更新是否成功
 */
async function batchUpdateToolFrequency(updates) {
  try {
    const currentFrequency = await getToolFrequency();
    
    updates.forEach(({ toolId, increment = 1 }) => {
      currentFrequency[toolId] = (currentFrequency[toolId] || 0) + increment;
    });
    
    const success = await setStorage(STORAGE_KEY, currentFrequency);
    return success;
  } catch (error) {
    console.error('批量更新工具频率数据失败:', error);
    return false;
  }
}

module.exports = {
  getToolFrequency,
  updateToolFrequency,
  resetToolFrequency,
  getToolFrequencyRanking,
  batchUpdateToolFrequency
};

