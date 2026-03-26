// 亲属关系计算器类 - 基于亲属关系的图论模型
class RelativeCalculator {
  constructor() {
    // 亲属关系图：从CDN加载
    this.relationGraph = null;
  }

  // 从CDN加载亲属关系数据
  async loadRelationGraph() {
    if (this.relationGraph) {
      return this.relationGraph;
    }

    // 先尝试从缓存读取
    const cachedData = wx.getStorageSync('relation_graph');
    const cachedTimestamp = wx.getStorageSync('relation_graph_timestamp');
    const now = Date.now();
    const cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7天过期

    if (cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)) {
      this.relationGraph = cachedData;
      return this.relationGraph;
    }

    // 从CDN加载
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/relative-relation.json',
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.relationGraph) {
            this.relationGraph = res.data.relationGraph;
            
            // 保存到缓存
            wx.setStorageSync('relation_graph', this.relationGraph);
            wx.setStorageSync('relation_graph_timestamp', now);
            
            resolve(this.relationGraph);
          } else {
            reject(new Error('数据加载失败'));
          }
        },
        fail: () => {
          reject(new Error('网络请求失败'));
        }
      });
    });
  }
  // 计算关系链
  calculate(chain) {
    if (!chain || chain.length === 0) {
      return '请选择亲戚关系';
    }

    // 处理复杂树形结构关系
    return this.calculateTreeStructure(chain);
  }

  // 基于图论的关系计算算法
  calculateTreeStructure(chain) {
    if (chain.length === 0) return '';
    if (chain.length === 1) return chain[0];

    // 使用图遍历算法处理复杂关系
    return this.graphTraversal(chain);
  }

  // 图遍历算法（恢复简化版：精简关系，随机选择）
  graphTraversal(chain) {
    // 从"自己"开始
    let currentRelation = '自己';

    for (let i = 0; i < chain.length; i++) {
      const relation = chain[i];

      // 异常处理：如果当前关系或目标关系未定义
      if (!this.relationGraph[currentRelation] || !this.relationGraph[currentRelation][relation]) {
        // 返回当前关系 + 剩余关系
        if (currentRelation !== '自己') {
          return currentRelation + '的' + chain.slice(i).join('的');
        } else {
          return chain.slice(i).join('的');
        }
      }

      // 获取下一个关系
      const nextRelation = this.relationGraph[currentRelation][relation];

      // 处理数组类型的关系值（随机选择，不避免"自己"）
      let selectedRelation;
      if (Array.isArray(nextRelation)) {
        // 如果有多个选择，随机选择一个（包括"自己"）
        const randomIndex = Math.floor(Math.random() * nextRelation.length);
        selectedRelation = nextRelation[randomIndex];
      } else {
        selectedRelation = nextRelation;
      }

      // 如果选择的结果是"自己"，直接更新当前关系为"自己"，继续计算
      // 例如：儿子的爸爸 → 自己（正确简化）

      // 更新当前关系
      currentRelation = selectedRelation;

      // 异常处理：如果计算出的新关系在图中不存在
      // 但只在还有剩余关系需要处理时才添加"的"
      if (!this.relationGraph[currentRelation] && (i + 1 < chain.length)) {
        return currentRelation + '的' + chain.slice(i + 1).join('的');
      }
    }

    return currentRelation;
  }



}

// 导出RelativeCalculator类
module.exports = RelativeCalculator;