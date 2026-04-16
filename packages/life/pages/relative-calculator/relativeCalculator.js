// 亲属关系计算器类 - 基于亲属关系的图论模型
class RelativeCalculator {
  constructor() {
    // 亲属关系图：从CDN加载
    this.relationGraph = null;
  }

  // 从CDN加载亲属关系数据
  async loadRelationGraph() {
    console.debug('[relative-calculator] loadRelationGraph 开始执行');
    if (this.relationGraph) {
      console.debug('[relative-calculator] 使用内存中的关系图');
      return this.relationGraph;
    }

    // 先尝试从缓存读取
    const cachedData = wx.getStorageSync('relation_graph');
    const cachedTimestamp = wx.getStorageSync('relation_graph_timestamp');
    const now = Date.now();
    const cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7天过期

    console.debug('[relative-calculator] 缓存检查', {
      hasCachedData: !!cachedData,
      hasCachedTimestamp: !!cachedTimestamp,
      cachedTimestamp,
      now,
      timeDiff: cachedTimestamp ? now - cachedTimestamp : null,
      cacheExpiry,
      isCacheValid: cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)
    });

    if (cachedData && cachedTimestamp && (now - cachedTimestamp < cacheExpiry)) {
      console.debug('[relative-calculator] 使用缓存数据');
      this.relationGraph = cachedData;
      return this.relationGraph;
    }

    console.debug('[relative-calculator] 缓存无效，开始从CDN加载');
    // 从CDN加载
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/relative-relation.json',
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          console.debug('[relative-calculator] CDN请求成功', {
            statusCode: res.statusCode,
            hasData: !!res.data,
            hasRelationGraph: !!(res.data && res.data.relationGraph)
          });
          if (res.statusCode === 200 && res.data && res.data.relationGraph) {
            this.relationGraph = res.data.relationGraph;
            
            // 保存到缓存
            wx.setStorageSync('relation_graph', this.relationGraph);
            wx.setStorageSync('relation_graph_timestamp', now);
            console.debug('[relative-calculator] 数据已保存到缓存');
            
            resolve(this.relationGraph);
          } else {
            console.error('[relative-calculator] 数据格式错误', res);
            reject(new Error('数据加载失败'));
          }
        },
        fail: (err) => {
          console.error('[relative-calculator] CDN请求失败', err);
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

    // 从链的第一个词判断起始人性别
    // "老公" → 女；"老婆" → 男；其他 → 性别未知（随机选）
    let gender = 'unknown';
    if (chain[0] === '老公') {
      gender = 'female';
    } else if (chain[0] === '老婆') {
      gender = 'male';
    }

    // 处理复杂树形结构关系
    return this.calculateTreeStructure(chain, gender);
  }

  // 基于图论的关系计算算法
  calculateTreeStructure(chain, gender) {
    if (chain.length === 0) return '';
    if (chain.length === 1) return chain[0];

    // 使用图遍历算法处理复杂关系
    return this.graphTraversal(chain, gender);
  }

  // 图遍历算法
  // gender: 'female' | 'male' | 'unknown'，用于解析含老公/老婆的多值数组
  graphTraversal(chain, gender) {
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

      // 处理数组类型的关系值
      let selectedRelation;
      if (Array.isArray(nextRelation)) {
        let candidates = [...nextRelation];

        // 已知性别的同辈冲突排除：
        // 男性(哥哥/弟弟)已知时：排除 弟弟的哥哥、哥哥的弟弟、妹妹的哥哥、弟弟的姐姐 中的"自己"
        // 女性(姐姐/妹妹)已知时：排除 弟弟的姐姐、哥哥的妹妹、妹妹的姐姐、姐姐的妹妹 中的"自己"
        if (gender !== 'unknown') {
          if (['哥哥', '弟弟'].includes(currentRelation) && gender === 'male') {
            // 男性同辈不可能选"自己"
            candidates = candidates.filter(v => v !== '自己');
          } else if (['姐姐', '妹妹'].includes(currentRelation) && gender === 'female') {
            // 女性同辈不可能选"自己"
            candidates = candidates.filter(v => v !== '自己');
          }
          // 父辈查子女：不可能选"自己"（我不能是我爸的儿子/女儿）
          if (['爸爸', '妈妈'].includes(currentRelation)) {
            candidates = candidates.filter(v => v !== '自己');
          }
        }

        // 已知性别的跨辈老公/老婆优先：
        if (gender === 'female' && candidates.includes('老公')) {
          selectedRelation = '老公';
        } else if (gender === 'male' && candidates.includes('老婆')) {
          selectedRelation = '老婆';
        } else {
          // 从候选中随机选（可能已过滤过，也可能只剩自己）
          const randomIndex = Math.floor(Math.random() * candidates.length);
          selectedRelation = candidates[randomIndex];
        }
      } else {
        selectedRelation = nextRelation;
      }

      // 更新当前关系，继续下一步
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